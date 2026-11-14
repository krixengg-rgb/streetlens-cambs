#!/usr/bin/env python3
"""Aggregate police.uk street snap-points into a compact hotspot list (OGL)."""
import json, os, sys, time, urllib.parse, urllib.request, concurrent.futures as cf
from collections import defaultdict

API = "https://data.police.uk/api"
ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data", "hotspots.json")
SUMMARY = os.path.join(ROOT, "public", "data", "summary.json")
UA = {"User-Agent": "StreetLens-cambs/1.0 (+https://github.com/krixengg-rgb/streetlens-cambs)"}

DIST = {
    "E07000008": ("Cambridge", ["CamCity_City_Centre", "CamCity_East_City", "CamCity_North_City", "CamCity_South_City"]),
    "E07000009": ("East Cambridgeshire", ["East_Cambridgeshire"]),
    "E07000010": ("Fenland", ["March", "Wisbech"]),
    "E07000011": ("Huntingdonshire", ["Huntingdon_and_Yaxley", "St_Ives_and_Ramsey", "St_Neots"]),
    "E07000012": ("South Cambridgeshire", ["South_Cambridgeshire"]),
    "E06000031": ("Peterborough", ["Peterborough_Central", "Peterborough_City_Centre", "Peterborough_Eastern", "Peterborough_Northern", "Peterborough_Southern"]),
}
DIST_I = {c: i for i, c in enumerate(DIST)}


def die(msg):
    print("ERROR:", msg, file=sys.stderr)
    sys.exit(1)


def get(url, data=None, tries=6):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:
            last = e
            print(f"retry {i+1}/{tries}", url[:90], e)
            time.sleep(2 * (i + 1))
    die(f"failed after {tries} tries: {url}\n{last}")


def clean_name(s):
    s = (s or "").strip()
    if not s:
        return "Location not recorded"
    # Police.uk usually prefixes "On or near "
    if s.lower().startswith("on or near "):
        s = s[11:].strip()
    return s or "Location not recorded"


def main():
    if not os.path.exists(SUMMARY):
        die("summary.json missing")
    summary = json.load(open(SUMMARY))
    months = summary.get("months") or []
    if len(months) != 12:
        die(f"expected 12 months in summary, got {months}")
    catlist = [c["id"] for c in summary["categories"]]

    nb2d = {n: c for c, (_, ns) in DIST.items() for n in ns}
    polys = {}
    for n in nb2d:
        b = json.loads(get(f"{API}/cambridgeshire/{n}/boundary"))
        if len(b) < 3:
            die(f"boundary too small for neighbourhood {n}")
        polys[n] = ":".join(f"{p['latitude']},{p['longitude']}" for p in b)
        print("boundary", n, "pts", len(b))

    def fetch(job):
        n, m = job
        d = json.loads(get(API + "/crimes-street/all-crime", urllib.parse.urlencode({"poly": polys[n], "date": m}).encode()))
        if len(d) >= 10000:
            print("WARNING cap hit", n, m)
        return n, m, d

    jobs = [(n, m) for n in nb2d for m in months]
    # key: (rounded lat, rounded lon, district)
    agg = {}
    seen = set()
    with cf.ThreadPoolExecutor(6) as ex:
        for n, m, d in ex.map(fetch, jobs):
            code = nb2d[n]
            for c in d:
                key = c.get("id") or c.get("persistent_id")
                if not key or key in seen:
                    continue
                seen.add(key)
                loc = c.get("location") or {}
                if not loc.get("latitude") or not loc.get("longitude"):
                    continue
                lat = round(float(loc["latitude"]), 5)
                lon = round(float(loc["longitude"]), 5)
                street = clean_name(((loc.get("street") or {}).get("name")))
                cat = c.get("category") or "other-crime"
                k = (lat, lon, code)
                rec = agg.get(k)
                if rec is None:
                    rec = {"n": 0, "name": street, "cats": defaultdict(int)}
                    agg[k] = rec
                rec["n"] += 1
                rec["cats"][cat] += 1
                # prefer a more specific name if one record is "Location not recorded"
                if rec["name"] == "Location not recorded" and street != rec["name"]:
                    rec["name"] = street
            print("got", n, m, "rows", len(d), "unique so far", len(seen))

    if len(seen) < 40000:
        die(f"too few crimes for hotspots: {len(seen)}")

    spots = []
    for (lat, lon, code), rec in agg.items():
        top = max(rec["cats"].items(), key=lambda x: x[1])[0]
        try:
            ti = catlist.index(top)
        except ValueError:
            ti = 0
        spots.append([lat, lon, rec["n"], rec["name"], ti, DIST_I[code]])
    spots.sort(key=lambda r: -r[2])

    # Compact top-N per district for the league/home, plus full list for radius queries.
    tops = []
    for i, code in enumerate(DIST):
        chunk = [s for s in spots if s[5] == i][:12]
        tops.append({"code": code, "name": DIST[code][0], "spots": [
            {"lat": s[0], "lon": s[1], "n": s[2], "name": s[3], "type": catlist[s[4]] if s[4] < len(catlist) else ""}
            for s in chunk
        ]})

    out = {
        "meta": {
            "source": "data.police.uk street-level crime, Cambridgeshire Constabulary, OGL v3.0",
            "months": months,
            "generated": time.strftime("%Y-%m-%d"),
            "note": "Each location is the anonymised snap point published by the police (usually “On or near” a street or landmark), not the exact address of an offence. Counts are recorded crimes at that snap point over the latest 12 months.",
            "n": len(spots),
            "crimes": len(seen),
        },
        "districts": tops,
        # [lat, lon, count, name, topCategoryIndex, districtIndex]
        "spots": spots,
    }
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    os.replace(tmp, OUT)
    print("wrote", OUT, "spots", len(spots), "crimes", len(seen), "bytes", os.path.getsize(OUT))
    if spots:
        print("top", spots[0])
    return 0


if __name__ == "__main__":
    sys.exit(main())
