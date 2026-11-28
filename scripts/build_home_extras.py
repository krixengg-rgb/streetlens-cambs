#!/usr/bin/env python3
"""Slim homepage payload so first load does not fetch full hotspot and collision files."""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import forces
OUT = os.path.join(forces.OUT, "home_extras.json")
HS = os.path.join(forces.OUT, "hotspots.json")
CO = os.path.join(forces.OUT, "collisions.json")


def main():
    out = {}
    if os.path.exists(HS):
        H = json.load(open(HS))
        out["hotspots"] = {
            "meta": {k: H.get("meta", {}).get(k) for k in ("source", "months", "note", "n", "crimes")},
            "spots": (H.get("spots") or [])[:10],
            "districts": H.get("districts") or [],
        }
    if os.path.exists(CO):
        C = json.load(open(CO))
        # drop points
        out["collisions"] = {
            "meta": C.get("meta") or {},
            "overview": C.get("overview") or {},
            "byYear": C.get("byYear") or {},
            "districts": C.get("districts") or [],
        }
        if C.get("prov"):
            pv = C["prov"]
            out["collisions"]["prov"] = {k: v for k, v in pv.items() if k != "points"}
    if not out:
        raise SystemExit("no hotspots or collisions to summarise")
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    os.replace(tmp, OUT)
    print("wrote", OUT, "bytes", os.path.getsize(OUT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
