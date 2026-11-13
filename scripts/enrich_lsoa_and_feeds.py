#!/usr/bin/env python3
"""Enrich lsoa_rates with names, centroids, percentiles; write district downloads and Atom feeds."""
import csv, json, os, math, urllib.request, urllib.parse, datetime, xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data"
RAW = ROOT / "raw"
FEEDS = ROOT / "public" / "feeds"
DL = OUT / "downloads"
BASE = "https://krixengg-rgb.github.io/streetlens-cambs/public"
UA = {"User-Agent": "StreetLens-cambs/1.0 (+https://github.com/krixengg-rgb/streetlens-cambs)"}
CENT_URL = "https://services-eu1.arcgis.com/6BsumkdKnml1ntNV/arcgis/rest/services/2021_LSOA_Population_Weighted_Centroid/FeatureServer/0/query"


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def fetch_centroids(codes):
    cents = {}
    for i in range(0, len(codes), 50):
        chunk = codes[i : i + 50]
        where = "CODE IN (" + ",".join(f"'{c}'" for c in chunk) + ")"
        qs = urllib.parse.urlencode(
            {"where": where, "outFields": "CODE", "returnGeometry": "true", "outSR": "4326", "f": "json"}
        )
        data = get_json(CENT_URL + "?" + qs)
        if data.get("error"):
            raise SystemExit(f"centroid query failed: {data['error']}")
        for f in data.get("features") or []:
            g = f.get("geometry") or {}
            code = f["attributes"]["CODE"]
            if g.get("y") is not None and g.get("x") is not None:
                cents[code] = (round(g["y"], 5), round(g["x"], 5))
        print(f"centroids {min(i+50,len(codes))}/{len(codes)}")
    return cents


def names_and_la():
    path = RAW / "iod2025_file7.csv"
    out = {}
    with path.open(newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            out[row["LSOA code (2021)"]] = {
                "name": row["LSOA name (2021)"],
                "la": row["Local Authority District name (2024)"],
            }
    return out


def percentile_lower_than(rate, rates):
    """Share of neighbourhoods with a strictly higher recorded rate (0–100)."""
    if rate is None or not rates:
        return None
    n = len(rates)
    higher = sum(1 for r in rates if r > rate)
    return round(100 * higher / n, 1)


def slug(s):
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in s).strip("-").replace("--", "-")


def enrich_lsoa():
    path = OUT / "lsoa_rates.json"
    data = json.loads(path.read_text())
    lsoa = data["lsoa"]
    codes = list(lsoa)
    cents = fetch_centroids(codes)
    meta_n = names_and_la()
    missing_c = [c for c in codes if c not in cents]
    if len(cents) < len(codes) * 0.95:
        raise SystemExit(f"too few centroids: {len(cents)}/{len(codes)} missing {missing_c[:8]}")
    rates = [v["rate"] for v in lsoa.values() if v.get("rate") is not None]
    for code, v in lsoa.items():
        info = meta_n.get(code) or {}
        if info.get("name"):
            v["name"] = info["name"]
        if info.get("la"):
            v["la"] = info["la"]
        if code in cents:
            v["lat"], v["lon"] = cents[code]
        v["pct"] = percentile_lower_than(v.get("rate"), rates)
    data["meta"] = {
        **data.get("meta", {}),
        "percentile": "pct is the share of Cambridgeshire & Peterborough LSOAs with a higher approximate recorded rate. Not a safety score. Rates use nearest-centroid assignment and resident population.",
        "centroids": "ONS LSOA (Dec 2021) population-weighted centroids, OGL.",
        "n": len(lsoa),
        "enriched": datetime.date.today().isoformat(),
    }
    path.write_text(json.dumps(data, separators=(",", ":")))
    print("lsoa enriched", len(lsoa), "centroids", len(cents), "with name", sum(1 for v in lsoa.values() if v.get("name")))
    return data


def write_downloads(summary):
    DL.mkdir(parents=True, exist_ok=True)
    # overview
    ov = {
        "area": summary["overview"]["name"],
        "generated": summary["generated"],
        "months": summary["months"],
        "monthsAll": summary.get("monthsAll"),
        "popYear": summary.get("popYear"),
        "total": summary["overview"]["total"],
        "rate": summary["overview"]["rate"],
        "yoy": summary["overview"].get("yoy"),
        "population": summary["overview"]["population"],
        "outcomes": dict(zip(summary["outcomeBuckets"], summary["overview"]["outcomes"])),
        "byType": summary["overview"]["byType"],
        "byTypePrev": summary["overview"].get("byTypePrev"),
        "typeYoy": summary["overview"].get("typeYoy"),
        "monthly": summary["overview"]["monthly"],
        "districts": [
            {"code": d["code"], "name": d["name"], "total": d["total"], "rate": d["rate"], "yoy": d.get("yoy"), "population": d["population"]}
            for d in summary["districts"]
        ],
        "licence": "Contains public sector information licensed under the Open Government Licence v3.0. Crime: data.police.uk.",
        "note": "See method.html for how rates and outcomes are calculated.",
    }
    (DL / "overview.json").write_text(json.dumps(ov, indent=2))
    rows = [["district", "code", "crimes_12m", "population", "rate_per_1000", "yoy_pct"]]
    for d in summary["districts"]:
        rows.append([d["name"], d["code"], d["total"], d["population"], d["rate"], "" if d.get("yoy") is None else d["yoy"]])
    (DL / "districts.csv").write_text("\n".join(",".join(map(str, r)) for r in rows) + "\n")
    for d in summary["districts"]:
        slug_d = slug(d["name"])
        payload = {
            "name": d["name"],
            "code": d["code"],
            "generated": summary["generated"],
            "months": summary["months"],
            "monthsAll": summary.get("monthsAll"),
            "total": d["total"],
            "rate": d["rate"],
            "yoy": d.get("yoy"),
            "population": d["population"],
            "outcomes": dict(zip(summary["outcomeBuckets"], d["outcomes"])),
            "byType": d["byType"],
            "byTypePrev": d.get("byTypePrev"),
            "typeYoy": d.get("typeYoy"),
            "monthly": d["monthly"],
            "licence": ov["licence"],
        }
        (DL / f"{slug_d}.json").write_text(json.dumps(payload, indent=2))
        # wide-ish CSV: monthly + types
        lines = ["metric,key,value"]
        lines += [f"total,12m,{d['total']}", f"rate,per_1000,{d['rate']}", f"yoy,pct,{d.get('yoy','')}"]
        for m, v in d["monthly"].items():
            lines.append(f"monthly,{m},{v}")
        for k, v in d["byType"].items():
            lines.append(f"byType,{k},{v}")
        if d.get("byTypePrev"):
            for k, v in d["byTypePrev"].items():
                lines.append(f"byTypePrev,{k},{v}")
        (DL / f"{slug_d}.csv").write_text("\n".join(lines) + "\n")
    print("downloads", len(list(DL.iterdir())))


def atom_feed(path, title, page_url, summary_text, updated, entry_id):
    # Keep this simple and valid
    updated = updated if "T" in updated else updated + "T00:00:00Z"
    xml = f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{title}</title>
  <link href="{page_url}" rel="alternate"/>
  <link href="{BASE}/feeds/{path.name}" rel="self"/>
  <id>{BASE}/feeds/{path.name}</id>
  <updated>{updated}</updated>
  <author><name>StreetLens</name></author>
  <subtitle>Open crime and area figures for Cambridgeshire and Peterborough. Not an official police alert service.</subtitle>
  <entry>
    <title>{title}: data updated</title>
    <link href="{page_url}"/>
    <id>{entry_id}</id>
    <updated>{updated}</updated>
    <summary>{summary_text}</summary>
  </entry>
</feed>
"""
    path.write_text(xml)


def write_feeds(summary):
    FEEDS.mkdir(parents=True, exist_ok=True)
    gen = summary["generated"]
    period = f"{summary['months'][0]} to {summary['months'][-1]}"
    ov = summary["overview"]
    yoy = ov.get("yoy")
    yoy_s = "n/a" if yoy is None else f"{yoy:+.1f}%"
    atom_feed(
        FEEDS / "county.xml",
        "StreetLens — Cambridgeshire &amp; Peterborough",
        f"{BASE}/",
        f"Recorded crimes in the 12 months {period}: {ov['total']:,} ({ov['rate']} per 1,000 residents). Year-on-year {yoy_s}. Figures are police-recorded and locations are anonymised. Not a substitute for official community messaging.",
        gen,
        f"{BASE}/#update-{gen}",
    )
    for d in summary["districts"]:
        sl = slug(d["name"])
        y = d.get("yoy")
        ys = "n/a" if y is None else f"{y:+.1f}%"
        atom_feed(
            FEEDS / f"{sl}.xml",
            f"StreetLens — {d['name']}",
            f"{BASE}/?d={sl}",
            f"{d['name']}: {d['total']:,} recorded crimes in the 12 months {period} ({d['rate']} per 1,000). Year-on-year {ys}. Police-recorded, anonymised locations.",
            gen,
            f"{BASE}/?d={sl}#update-{gen}",
        )
    # index
    links = ["county.xml"] + [f"{slug(d['name'])}.xml" for d in summary["districts"]]
    (FEEDS / "index.html").write_text(
        "<!doctype html><meta charset=utf-8><title>StreetLens feeds</title><h1>Atom feeds</h1><ul>"
        + "".join(f'<li><a href="{n}">{n}</a></li>' for n in links)
        + "</ul><p>These feeds note when StreetLens district and county figures are refreshed. They are not live incident alerts. For official Cambridgeshire Constabulary messages, use eCops.</p>"
    )
    print("feeds", len(links))


def main():
    enrich_lsoa()
    summary = json.loads((OUT / "summary.json").read_text())
    write_downloads(summary)
    write_feeds(summary)


if __name__ == "__main__":
    main()
