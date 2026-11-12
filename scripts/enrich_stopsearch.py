#!/usr/bin/env python3
"""Refresh stop-and-search points with a factual outcome index. 12 force-wide calls."""
import json, os, sys, time, urllib.request, urllib.parse

sys.path.insert(0, os.path.dirname(__file__))
import refresh_data as rd

OUT = os.path.join(rd.OUT, "stopsearch.json")
STAGE = os.path.join(rd.RAW, "_stage_ss")


def ss_ob(x):
    name = ((x.get("outcome_object") or {}).get("name") or x.get("outcome") or "")
    l = name.lower()
    if "arrest" in l:
        return 0
    if "summons" in l or "charged" in l:
        return 1
    if any(k in l for k in ["community resolution", "caution", "warning", "penalty", "khat", "cannabis"]):
        return 2
    if "no further action" in l or l in ("nfa", ""):
        return 3
    return 4


def main():
    S = json.load(open(os.path.join(rd.OUT, "summary.json")))
    months = S["months"]
    ss = []
    for m in months:
        rows = json.loads(rd.get(f"{rd.API}/stops-force?force=cambridgeshire&date={m}"))
        print(m, len(rows))
        for x in rows:
            loc = x.get("location") or {}
            if not loc.get("latitude") or not loc.get("longitude"):
                continue
            ss.append([
                round(float(loc["latitude"]), 5),
                round(float(loc["longitude"]), 5),
                months.index(m),
                ss_ob(x),
            ])
    if len(ss) < 500:
        rd.die(f"too few stop-and-search rows: {len(ss)}")
    os.makedirs(STAGE, exist_ok=True)
    staged = os.path.join(STAGE, "stopsearch.json")
    with open(staged, "w") as f:
        json.dump(ss, f, separators=(",", ":"))
    os.replace(staged, OUT)
    print("stops", len(ss))
    return 0

if __name__ == "__main__":
    sys.exit(main() or 0)
