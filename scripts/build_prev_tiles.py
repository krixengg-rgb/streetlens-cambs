#!/usr/bin/env python3
"""Build compact previous-12-month crime-point tiles for postcode year-on-year counts.

Does not change points.json (latest 12 months, used on the map). Each previous-year
tile is just [lat, lon] so the files stay small.
"""
import json, math, os, sys, time, urllib.parse, urllib.request
from collections import defaultdict
import concurrent.futures as cf

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data")
RAW = os.path.join(ROOT, "raw")
TDIR = os.path.join(OUT, "prev_tiles")
BFILE = os.path.join(RAW, "nb-boundaries.json")
API = "https://data.police.uk/api"
CELL = 0.05

# Same neighbourhood list as refresh_data.py
DIST = {
    "E07000008": ("Cambridge", ["CamCity_City_Centre", "CamCity_East_City", "CamCity_North_City", "CamCity_South_City"]),
    "E07000009": ("East Cambridgeshire", ["East_Cambridgeshire"]),
    "E07000010": ("Fenland", ["March", "Wisbech"]),
    "E07000011": ("Huntingdonshire", ["Huntingdon_and_Yaxley", "St_Ives_and_Ramsey", "St_Neots"]),
    "E07000012": ("South Cambridgeshire", ["South_Cambridgeshire"]),
    "E06000031": ("Peterborough", ["Peterborough_Central", "Peterborough_City_Centre", "Peterborough_Eastern", "Peterborough_Northern", "Peterborough_Southern"]),
}
NBS = [n for _, ns in DIST.values() for n in ns]


def get(url, data=None, tries=6):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(
                url,
                data=data,
                headers={"User-Agent": "StreetLens-cambs/1.0 (+https://github.com/krixengg-rgb/streetlens-cambs)"},
            )
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:
            last = e
            print(f"retry {i+1}/{tries}", url[:90], e, flush=True)
            time.sleep(2 * (i + 1))
    raise SystemExit(f"failed after {tries} tries: {url}\n{last}")


def load_boundaries():
    if os.path.exists(BFILE):
        b = json.load(open(BFILE))
        if all(n in b for n in NBS):
            print("using cached boundaries", BFILE)
            return b
    b = {}
    for n in NBS:
        raw = json.loads(get(f"{API}/cambridgeshire/{n}/boundary"))
        if len(raw) < 3:
            raise SystemExit(f"boundary too small for {n}")
        b[n] = ":".join(f"{p['latitude']},{p['longitude']}" for p in raw)
        print("boundary", n, "pts", len(raw), flush=True)
    os.makedirs(RAW, exist_ok=True)
    json.dump(b, open(BFILE, "w"))
    return b


def write_tiles(pts, months, dest=TDIR):
    tiles = defaultdict(list)
    for p in pts:
        tiles[(math.floor(p[0] / CELL), math.floor(p[1] / CELL))].append(p)
    os.makedirs(dest, exist_ok=True)
    # drop stale tiles
    for name in os.listdir(dest):
        if name.endswith(".json"):
            os.remove(os.path.join(dest, name))
    index = []
    for (i, j), arr in tiles.items():
        json.dump(arr, open(os.path.join(dest, f"{i}_{j}.json"), "w"), separators=(",", ":"))
        index.append([i, j])
    meta = {
        "cell": CELL,
        "tiles": index,
        "total": len(pts),
        "months": months,
        "note": "Previous 12-month recorded-crime pins (lat, lon only) for year-on-year radius counts. Not shown on the map.",
        "generated": time.strftime("%Y-%m-%d"),
    }
    json.dump(meta, open(os.path.join(dest, "meta.json"), "w"), separators=(",", ":"))
    print("prev tiles", len(index), "points", len(pts), "months", months[0], "→", months[-1], flush=True)
    return meta


def main():
    summary = json.load(open(os.path.join(OUT, "summary.json")))
    months = summary["months"]
    months_all = summary.get("monthsAll") or months
    prev = [m for m in months_all if m not in months]
    if len(prev) < 12:
        raise SystemExit(f"need 12 previous months, have {prev}")
    prev = sorted(prev)[-12:]
    print("previous window", prev[0], "→", prev[-1], "jobs", len(NBS) * len(prev), flush=True)
    polys = load_boundaries()

    def fetch(job):
        n, m = job
        d = json.loads(
            get(API + "/crimes-street/all-crime", urllib.parse.urlencode({"poly": polys[n], "date": m}).encode())
        )
        if len(d) >= 10000:
            print("WARNING cap hit", n, m, flush=True)
        return n, m, d

    jobs = [(n, m) for n in NBS for m in prev]
    seen = {}
    with cf.ThreadPoolExecutor(6) as ex:
        done = 0
        for n, m, d in ex.map(fetch, jobs):
            done += 1
            if done % 20 == 0 or done == len(jobs):
                print(f"fetched {done}/{len(jobs)}", flush=True)
            for c in d:
                key = c.get("id") or c.get("persistent_id")
                loc = c.get("location") or {}
                if not key or not loc.get("latitude") or not loc.get("longitude"):
                    continue
                if key in seen:
                    continue
                seen[key] = [round(float(loc["latitude"]), 5), round(float(loc["longitude"]), 5)]

    pts = list(seen.values())
    if len(pts) < 40000:
        raise SystemExit(f"too few previous-year points: {len(pts)}")
    write_tiles(pts, prev)
    return 0


if __name__ == "__main__":
    sys.exit(main())
