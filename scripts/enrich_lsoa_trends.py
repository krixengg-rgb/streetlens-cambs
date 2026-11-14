#!/usr/bin/env python3
"""Add a compact 12-month count sparkline (mv) to each LSOA in lsoa_rates.json."""
import json, math, os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
LSOA = os.path.join(ROOT, "public", "data", "lsoa_rates.json")
POINTS = os.path.join(ROOT, "public", "data", "points.json")
SUMMARY = os.path.join(ROOT, "public", "data", "summary.json")


def hav(a, b, c, d):
    R = 6371.0  # km — only for nearest comparison, scale doesn't matter if consistent
    r = math.pi / 180
    x = math.sin((c - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(c * r) * math.sin((d - b) * r / 2) ** 2
    return x  # chordal, monotonic with distance


def main():
    lr = json.load(open(LSOA))
    pts = json.load(open(POINTS))
    months = json.load(open(SUMMARY))["months"]
    n_m = len(months)
    cents = []
    for code, row in lr["lsoa"].items():
        if row.get("lat") is None or row.get("lon") is None:
            continue
        cents.append((code, row["lat"], row["lon"]))
    if len(cents) < 500:
        raise SystemExit(f"too few centroids: {len(cents)}")

    # spatial bins of 0.05 deg
    bins = {}
    for i, (code, la, lo) in enumerate(cents):
        key = (int(la * 20), int(lo * 20))
        bins.setdefault(key, []).append(i)

    counts = {code: [0] * n_m for code, _, _ in cents}
    assigned = 0
    for p in pts:
        la, lo, _, mi = p[0], p[1], p[2], p[3]
        if not (0 <= mi < n_m):
            continue
        cx, cy = int(la * 20), int(lo * 20)
        best = None
        bd = 1e9
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for i in bins.get((cx + dx, cy + dy), ()):
                    d = hav(la, lo, cents[i][1], cents[i][2])
                    if d < bd:
                        bd = d
                        best = cents[i][0]
        if best is None:
            # rare fallback
            best = min(cents, key=lambda c: hav(la, lo, c[1], c[2]))[0]
        counts[best][mi] += 1
        assigned += 1

    missing = 0
    for code, row in lr["lsoa"].items():
        row["mv"] = counts.get(code) or [0] * n_m
        if sum(row["mv"]) != row.get("n", -1) and abs(sum(row["mv"]) - (row.get("n") or 0)) > 2:
            missing += 1
    # totals may differ slightly if a point is assigned to a centroid we already used for n
    # Rebuild n is already from the same method in tiles script; should be close.
    lr["meta"]["trends"] = "mv is a 12-month count of published crimes assigned to the nearest 2021 LSOA centroid, same method as the rate. Approximate, not an official police LSOA series."
    tmp = LSOA + ".tmp"
    with open(tmp, "w") as f:
        json.dump(lr, f, separators=(",", ":"))
    os.replace(tmp, LSOA)
    tot = sum(sum(v) for v in counts.values())
    print("lsoa trends written, assigned", assigned, "of", len(pts), "sum", tot, "rows with n mismatch", missing)
    return 0


if __name__ == "__main__":
    sys.exit(main())
