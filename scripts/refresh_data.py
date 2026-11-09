#!/usr/bin/env python3
"""Refresh Cambridgeshire crime data (data.police.uk) + ONS population (Nomis). Safe for CI."""
import json, time, csv, io, urllib.request, urllib.parse, concurrent.futures as cf, os, sys

API = "https://data.police.uk/api"
ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data")
RAW = os.path.join(ROOT, "raw")
os.makedirs(OUT, exist_ok=True)
os.makedirs(RAW, exist_ok=True)

def die(msg):
    print("ERROR:", msg, file=sys.stderr)
    sys.exit(1)

def get(url, data=None, tries=6):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers={"User-Agent": "StreetLens-cambs/1.0 (+https://github.com/krixengg-rgb/streetlens-cambs)"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:
            last = e
            print(f"retry {i+1}/{tries}", url[:90], e)
            time.sleep(2 * (i + 1))
    die(f"failed after {tries} tries: {url}\n{last}")

DIST = {
    "E07000008": ("Cambridge", ["CamCity_City_Centre", "CamCity_East_City", "CamCity_North_City", "CamCity_South_City"]),
    "E07000009": ("East Cambridgeshire", ["East_Cambridgeshire"]),
    "E07000010": ("Fenland", ["March", "Wisbech"]),
    "E07000011": ("Huntingdonshire", ["Huntingdon_and_Yaxley", "St_Ives_and_Ramsey", "St_Neots"]),
    "E07000012": ("South Cambridgeshire", ["South_Cambridgeshire"]),
    "E06000031": ("Peterborough", ["Peterborough_Central", "Peterborough_City_Centre", "Peterborough_Eastern", "Peterborough_Northern", "Peterborough_Southern"]),
}

def latest_api_month():
    dates = [d["date"] for d in json.loads(get(API + "/crimes-street-dates"))]
    if not dates:
        die("crimes-street-dates returned no months")
    return sorted(dates)[-1], sorted(dates)

def current_site_month():
    p = os.path.join(OUT, "summary.json")
    if not os.path.exists(p):
        return None
    return json.load(open(p)).get("months", [None])[-1]

def main(force=False):
    api_latest, all_dates = latest_api_month()
    site_latest = current_site_month()
    print("api_latest", api_latest, "site_latest", site_latest)
    if not force and site_latest and api_latest <= site_latest:
        print("NO_NEW_MONTH: site already has", site_latest)
        return 0

    pop, popyear = {}, None
    r = get(
        "https://www.nomisweb.co.uk/api/v01/dataset/NM_2002_1.data.csv?geography="
        + ",".join(DIST)
        + "&date=latest&gender=0&c_age=200&measures=20100&select=date_name,geography_code,obs_value"
    ).decode()
    for row in csv.DictReader(io.StringIO(r)):
        pop[row["GEOGRAPHY_CODE"]] = int(row["OBS_VALUE"])
        popyear = row["DATE_NAME"]
    if len(pop) != len(DIST):
        die(f"population missing for districts: have {list(pop)} need {list(DIST)}")

    months_all = sorted(all_dates)[-24:]  # up to 24 for YoY aggregates
    if len(months_all) < 12:
        die(f"expected at least 12 months, got {months_all}")
    months = months_all[-12:]  # map points stay on latest 12

    nb2d = {n: c for c, (_, ns) in DIST.items() for n in ns}
    polys = {}
    for n in nb2d:
        b = json.loads(get(f"{API}/cambridgeshire/{n}/boundary"))
        if len(b) < 3:
            die(f"boundary too small for neighbourhood {n}")
        polys[n] = ":".join(f"{p['latitude']},{p['longitude']}" for p in b)

    def fetch(job):
        n, m = job
        d = json.loads(get(API + "/crimes-street/all-crime", urllib.parse.urlencode({"poly": polys[n], "date": m}).encode()))
        if len(d) >= 10000:
            print("WARNING cap hit", n, m)
        return n, m, d

    seen = {}
    jobs = [(n, m) for n in nb2d for m in months_all]
    with cf.ThreadPoolExecutor(6) as ex:
        for n, m, d in ex.map(fetch, jobs):
            for c in d:
                key = c["id"] or c["persistent_id"]
                if key not in seen:
                    seen[key] = (nb2d[n], m, c)

    if len(seen) < 40000:
        die(f"too few crimes: {len(seen)} (expected ~70k–100k)")

    cats = json.loads(get(API + "/crime-categories"))
    catname = {c["url"]: c["name"] for c in cats}
    catlist = sorted({c["category"] for _, _, c in seen.values()})
    if len(catlist) < 8:
        die(f"too few crime categories: {catlist}")

    def blank():
        return {"total": 0, "byType": {k: 0 for k in catlist}, "monthly": {m: 0 for m in months_all}, "monthly12": {m: 0 for m in months}}

    dist = {c: blank() for c in DIST}
    allc = blank()
    pts = []
    OB = [
        "Charged / summonsed",
        "Out-of-court resolution",
        "No suspect identified",
        "Unable to prosecute / not in public interest",
        "Under investigation",
        "Other / transferred",
        "No outcome (ASB)",
    ]

    def ob(c):
        o = (c.get("outcome_status") or {}).get("category")
        if not o:
            return 6
        l = o.lower()
        if any(k in l for k in ["charged", "court", "prison", "fined", "sentence", "discharge", "compensation", "otherwise dealt", "not guilty", "deprived", "summons"]):
            return 0
        if any(k in l for k in ["caution", "local resolution", "penalty", "warning", "community resolution"]):
            return 1
        if "no suspect" in l:
            return 2
        if any(k in l for k in ["unable", "public interest"]):
            return 3
        if any(k in l for k in ["under investigation", "status update"]):
            return 4
        return 5

    raw_out = __import__("collections").Counter()
    for code, m, c in seen.values():
        for agg in (dist[code], allc):
            agg["monthly"][m] += 1
            if m in months:
                agg["total"] += 1
                agg["byType"][c["category"]] += 1
                agg.setdefault("outcomes", [0] * 7)[ob(c)] += 1
        loc = c.get("location") or {}
        if not loc.get("latitude") or not loc.get("longitude"):
            continue
        if m in months:
            pts.append([
                round(float(loc["latitude"]), 5),
                round(float(loc["longitude"]), 5),
                catlist.index(c["category"]),
                months.index(m),
                ob(c),
                # district index for future splits
            ])
        raw_out[(c.get("outcome_status") or {}).get("category")] += 1

    if len(pts) < 40000:
        die(f"too few point rows: {len(pts)}")

    tp = sum(pop.values())
    ss = []
    for m in months:
        for x in json.loads(get(f"{API}/stops-force?force=cambridgeshire&date={m}")):
            if x.get("location"):
                ss.append([
                    round(float(x["location"]["latitude"]), 5),
                    round(float(x["location"]["longitude"]), 5),
                    months.index(m),
                ])
    if len(ss) < 500:
        die(f"too few stop-and-search rows: {len(ss)}")

    # YoY: compare latest 12 months vs previous 12 in months_all
    def add_yoy(agg):
        tot=sum(agg["monthly"].get(m,0) for m in months)
        prev_months=[m for m in months_all if m not in months]
        prev_tot=sum(agg["monthly"].get(m,0) for m in prev_months) if len(prev_months)>=12 else None
        agg["yoy"]=round((tot-prev_tot)/prev_tot*100,1) if prev_tot else None
    for c in DIST: add_yoy(dist[c])
    add_yoy(allc)

    # Stage then replace so a crash mid-write cannot leave empty files
    stage = os.path.join(RAW, "_stage_crime")
    os.makedirs(stage, exist_ok=True)
    summary = {
        "outcomeBuckets": OB,
        "generated": time.strftime("%Y-%m-%d"),
        "months": months,
        "monthsAll": months_all,
        "popYear": popyear,
        "categories": [{"id": k, "name": catname.get(k, k)} for k in catlist],
        "overview": {**allc, "name": "Cambridgeshire & Peterborough", "population": tp, "rate": round(allc["total"] / tp * 1000, 1)},
        "districts": [{"code": c, "name": DIST[c][0], "population": pop[c], "rate": round(dist[c]["total"] / pop[c] * 1000, 1), **dist[c]} for c in DIST],
    }
    for name, obj in (("stopsearch.json", ss), ("summary.json", summary), ("points.json", pts)):
        path = os.path.join(stage, name)
        with open(path, "w") as f:
            json.dump(obj, f, separators=(",", ":") if name != "summary.json" else None)
        if os.path.getsize(path) < 200:
            die(f"staged {name} too small ({os.path.getsize(path)} bytes)")

    for name in ("stopsearch.json", "summary.json", "points.json"):
        os.replace(os.path.join(stage, name), os.path.join(OUT, name))

    print("stops", len(ss))
    print(raw_out.most_common(8))
    print("crimes", len(seen), "points", len(pts), "months", months[0], "→", months[-1], "generated", summary["generated"])
    return 0

if __name__ == "__main__":
    force = "--force" in sys.argv or os.environ.get("FORCE_REFRESH") == "1"
    sys.exit(main(force=force) or 0)
