#!/usr/bin/env python3
"""Clip OS Open Greenspace (OGL) TL/TF/SP tiles to the Cambridgeshire bbox and write centroids."""
import json, sys
from pathlib import Path
from collections import Counter

# Requires pyshp + pyproj (see raw/greenspace unpack)
try:
    import shapefile
    from pyproj import Transformer
except ImportError:
    sys.exit("need pyshp and pyproj in the environment")

ROOT = Path(__file__).resolve().parent.parent
UNPACKED = ROOT / "raw" / "greenspace" / "unpacked"
OUT = ROOT / "public" / "data" / "greenspace.json"

KEEP = {
    "Public Park Or Garden": "Park",
    "Playing Field": "Playing field",
    "Play Space": "Play space",
    "Sports Facility": "Sports facility",
    "Other Sports Facility": "Sports facility",
    "Tennis Court": "Tennis court",
    "Bowling Green": "Bowling green",
    "Golf Course": "Golf course",
    "Allotments Or Community Growing Spaces": "Allotments",
    "Cemetery": "Cemetery",
}

def main():
    pts = json.loads((ROOT / "public" / "data" / "points.json").read_text())
    lats = [p[0] for p in pts]
    lons = [p[1] for p in pts]
    lat0, lat1 = min(lats) - 0.08, max(lats) + 0.08
    lon0, lon1 = min(lons) - 0.12, max(lons) + 0.12
    to_wgs = Transformer.from_crs(27700, 4326, always_xy=True)
    seen, out, funcs = set(), [], Counter()
    for shp in UNPACKED.rglob("*_GreenspaceSite.shp"):
        r = shapefile.Reader(str(shp), encoding="latin-1")
        names = [f[0] for f in r.fields[1:]]
        for sr in r.iterShapeRecords():
            rec = dict(zip(names, sr.record))
            fid = rec.get("id")
            if fid in seen:
                continue
            fn = rec.get("function") or ""
            if fn not in KEEP:
                continue
            ptsxy = sr.shape.points
            if not ptsxy:
                continue
            x = sum(p[0] for p in ptsxy) / len(ptsxy)
            y = sum(p[1] for p in ptsxy) / len(ptsxy)
            lon, lat = to_wgs.transform(x, y)
            if not (lat0 <= lat <= lat1 and lon0 <= lon <= lon1):
                continue
            seen.add(fid)
            name = (rec.get("distName1") or rec.get("distName2") or "").strip()
            out.append([round(lat, 5), round(lon, 5), name or KEEP[fn], KEEP[fn]])
            funcs[KEEP[fn]] += 1
    out.sort(key=lambda p: (p[3], p[2]))
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print("sites", len(out), "bytes", OUT.stat().st_size, dict(funcs))

if __name__ == "__main__":
    main()
