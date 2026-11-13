#!/usr/bin/env python3
"""Compare newly built public/data against a previous snapshot. Exit 1 on bad/partial data."""
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
NEW = os.path.join(ROOT, "public", "data")
PREV = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PREV_DATA", "")

RANGES = {
    "points.json": (50000, 150000),
    "stopsearch.json": (800, 20000),
    "gp.json": (40, 300),
    "dentists.json": (40, 400),
    "schools.json": (200, 800),
    "stops.json": (2000, 12000),
    "rail.json": (20, 80),
}

def load(folder, name):
    p = os.path.join(folder, name)
    if not os.path.exists(p):
        return None
    if os.path.getsize(p) < 50:
        return "__EMPTY__"
    return json.load(open(p))

def die(msg):
    print("SANITY FAIL:", msg, file=sys.stderr)
    sys.exit(1)

errs = []
summary = load(NEW, "summary.json")
if summary in (None, "__EMPTY__") or not isinstance(summary, dict):
    die("summary.json missing or empty")
months = summary.get("months") or []
if len(months) != 12:
    die(f"summary.months length {len(months)} != 12")
if not summary.get("generated"):
    die("summary.generated missing")
if not summary.get("districts") or len(summary["districts"]) != 6:
    die("expected 6 districts")
ov = summary.get("overview") or {}
if not ov.get("total") or ov["total"] < 40000:
    die(f"overview.total too low: {ov.get('total')}")
if not ov.get("rate") or not (20 < ov["rate"] < 300):
    die(f"overview.rate implausible: {ov.get('rate')}")
# Optional 24-month YoY fields (present after force refresh)
ma = summary.get("monthsAll") or []
if ma:
    if len(ma) < 12 or len(ma) > 24:
        die(f"monthsAll length {len(ma)} not in 12..24")
    if ma[-12:] != months:
        die("monthsAll tail must equal months")
    if "yoy" not in ov:
        die("overview.yoy missing when monthsAll present")
    ty = ov.get("typeYoy") or {}
    prev = ov.get("byTypePrev") or {}
    if ty:
        cats = {c["id"] for c in (summary.get("categories") or [])}
        if not cats.issubset(ty.keys()):
            die("typeYoy missing some categories")
        prev_sum = sum(prev.values()) if prev else sum(v.get("prev", 0) for v in ty.values())
        exp = sum(ov.get("monthly", {}).get(m, 0) for m in ma if m not in months)
        if exp and (prev_sum < exp * 0.9 or prev_sum > exp * 1.1):
            die(f"byTypePrev total {prev_sum} vs previous 12-month sum {exp}")
        for d in summary["districts"]:
            if not d.get("typeYoy"):
                die(f"{d['name']} typeYoy missing")

for name, (lo, hi) in RANGES.items():
    obj = load(NEW, name)
    if obj == "__EMPTY__":
        errs.append(f"{name} empty")
        continue
    if obj is None:
        errs.append(f"{name} missing")
        continue
    n = len(obj) if isinstance(obj, list) else (obj.get("districts") and len(obj["districts"]))
    if name == "prices.json":
        if not isinstance(obj, dict) or len(obj.get("districts") or {}) < 6 or len(obj.get("sectors") or {}) < 50:
            errs.append(f"prices.json incomplete districts/sectors")
        continue
    if not isinstance(n, int) or not (lo <= n <= hi):
        errs.append(f"{name} count {n} outside [{lo},{hi}]")

if PREV and os.path.isdir(PREV):
    prev_s = load(PREV, "summary.json")
    if isinstance(prev_s, dict) and prev_s.get("overview"):
        old_t = prev_s["overview"]["total"]
        new_t = ov["total"]
        if new_t < old_t * 0.7:
            errs.append(f"crime total dropped too far: {old_t} → {new_t}")
        if new_t > old_t * 1.6:
            errs.append(f"crime total jumped too far: {old_t} → {new_t} (possible bad pull)")
        old_m = (prev_s.get("months") or [None])[-1]
        new_m = months[-1]
        print(f"months {old_m} → {new_m}; crimes {old_t} → {new_t}")
    for name, (lo, hi) in RANGES.items():
        if name == "prices.json":
            continue
        a, b = load(PREV, name), load(NEW, name)
        if isinstance(a, list) and isinstance(b, list) and a:
            if len(b) < len(a) * 0.6:
                errs.append(f"{name} shrunk too much: {len(a)} → {len(b)}")


# Stage F: LSOA percentiles/centroids, downloads and Atom feeds
lr = load(NEW, "lsoa_rates.json")
if lr in (None, "__EMPTY__") or not isinstance(lr, dict) or not isinstance(lr.get("lsoa"), dict):
    die("lsoa_rates.json missing or empty")
lsoas = lr["lsoa"]
if not (500 <= len(lsoas) <= 600):
    die(f"lsoa count {len(lsoas)} unexpected")
missing = 0
for code, row in lsoas.items():
    if not isinstance(row, dict) or row.get("rate") is None:
        die(f"lsoa {code} missing rate")
    if row.get("lat") is None or row.get("lon") is None or row.get("pct") is None:
        missing += 1
if missing > 10:
    die(f"{missing} LSOAs missing centroid or percentile")

DL = os.path.join(NEW, "downloads")
FEEDS = os.path.join(ROOT, "public", "feeds")
slugs = [d["name"].lower().replace(" ", "-") for d in summary["districts"]]
for name in ["overview.json", "districts.csv"] + [s + ext for s in slugs for ext in (".json", ".csv")]:
    p = os.path.join(DL, name)
    if not os.path.exists(p) or os.path.getsize(p) < 40:
        errs.append(f"download missing or tiny: {name}")
for name in ["county.xml", "index.html"] + [s + ".xml" for s in slugs]:
    p = os.path.join(FEEDS, name)
    if not os.path.exists(p) or os.path.getsize(p) < 40:
        errs.append(f"feed missing or tiny: {name}")

if errs:
    for e in errs:
        print("SANITY FAIL:", e, file=sys.stderr)
    sys.exit(1)

print("SANITY OK", months[0], "→", months[-1], "crimes", ov["total"], "generated", summary["generated"])
