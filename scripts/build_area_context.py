#!/usr/bin/env python3
"""Build compact Census 2021 + council tax band context for Cambs & Peterborough LSOAs (OGL)."""
import csv, io, json, os, sys, time, zipfile

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data", "context.json")
LSOA = os.path.join(ROOT, "public", "data", "lsoa_rates.json")
SUMMARY = os.path.join(ROOT, "public", "data", "summary.json")
TS054 = os.path.join(ROOT, "raw", "census", "census2021-ts054.zip")
TS007A = os.path.join(ROOT, "raw", "census", "census2021-ts007a.zip")
CTSOP = os.path.join(ROOT, "raw", "ctsop", "CTSOP_1_1_2026.zip")

# 5-year bands in TS007A folded into broader groups for a short profile.
AGE_GROUPS = [
    ("0-15", ["Age: Aged 4 years and under", "Age: Aged 5 to 9 years", "Age: Aged 10 to 14 years", "Age: Aged 15 to 19 years"]),
]
# 15-19 straddles; better groups:
# 0-14, 15-24, 25-44, 45-64, 65+
AGE_MAP = {
    "0-14": ["Age: Aged 4 years and under", "Age: Aged 5 to 9 years", "Age: Aged 10 to 14 years"],
    "15-24": ["Age: Aged 15 to 19 years", "Age: Aged 20 to 24 years"],
    "25-44": ["Age: Aged 25 to 29 years", "Age: Aged 30 to 34 years", "Age: Aged 35 to 39 years", "Age: Aged 40 to 44 years"],
    "45-64": ["Age: Aged 45 to 49 years", "Age: Aged 50 to 54 years", "Age: Aged 55 to 59 years", "Age: Aged 60 to 64 years"],
    "65+": ["Age: Aged 65 to 69 years", "Age: Aged 70 to 74 years", "Age: Aged 75 to 79 years", "Age: Aged 80 to 84 years", "Age: Aged 85 years and over"],
}
AGE_KEYS = ["0-14", "15-24", "25-44", "45-64", "65+"]
BANDS = list("abcdefgh")


def die(msg):
    print("ERROR:", msg, file=sys.stderr)
    sys.exit(1)


def pct(part, whole):
    if not whole:
        return None
    return round(part / whole * 100, 1)


def num(v):
    if v is None:
        return 0
    s = str(v).strip()
    if s in ("", "[c]", "[z]", "NA", "N/A", "-"):
        return 0
    try:
        return int(float(s.replace(",", "")))
    except ValueError:
        return 0


def load_csv_from_zip(path, inner, key="geography code"):
    with zipfile.ZipFile(path) as z:
        # allow a single matching name
        names = z.namelist()
        if inner not in names:
            hits = [n for n in names if n.endswith(inner) or inner in n]
            if not hits:
                die(f"{path} missing {inner}: {names}")
            inner = hits[0]
        with z.open(inner) as f:
            r = csv.DictReader(io.TextIOWrapper(f, newline="", encoding="utf-8-sig"))
            # normalise header
            rows = []
            for row in r:
                rows.append({(k or "").lstrip("\ufeff").strip().strip('"'): v for k, v in row.items()})
            return rows


def main():
    if not os.path.exists(LSOA):
        die("lsoa_rates.json missing")
    lr = json.load(open(LSOA))
    codes = set(lr["lsoa"])
    # district name -> code
    summary = json.load(open(SUMMARY))
    la_code = {d["name"]: d["code"] for d in summary["districts"]}
    # also accept "City of Peterborough" etc.
    la_code["City of Peterborough"] = la_code.get("Peterborough")

    # Tenure
    ten_rows = load_csv_from_zip(TS054, "census2021-ts054-lsoa.csv")
    tenure = {}
    for row in ten_rows:
        code = row.get("geography code") or row.get("GEOGRAPHY_CODE")
        if code not in codes:
            continue
        hh = num(row.get("Tenure of household: Total: All households"))
        owned = num(row.get("Tenure of household: Owned")) + num(row.get("Tenure of household: Shared ownership"))
        social = num(row.get("Tenure of household: Social rented"))
        priv = num(row.get("Tenure of household: Private rented")) + num(row.get("Tenure of household: Lives rent free"))
        tenure[code] = {"hh": hh, "owned": pct(owned, hh), "social": pct(social, hh), "priv": pct(priv, hh)}
    if len(tenure) < 500:
        die(f"tenure rows {len(tenure)} expected ~516")

    # Age
    age_rows = load_csv_from_zip(TS007A, "census2021-ts007a-lsoa.csv")
    ages = {}
    for row in age_rows:
        code = row.get("geography code") or row.get("GEOGRAPHY_CODE")
        if code not in codes:
            continue
        tot = num(row.get("Age: Total"))
        grp = []
        for k in AGE_KEYS:
            grp.append(pct(sum(num(row.get(col)) for col in AGE_MAP[k]), tot))
        ages[code] = {"pop21": tot, "age": grp}
    if len(ages) < 500:
        die(f"age rows {len(ages)} expected ~516")

    # Council tax
    ct_rows = load_csv_from_zip(CTSOP, "CTSOP1_1_2026_03_31.csv")
    # field names after utf-8-sig / quote strip
    tax = {}
    for row in ct_rows:
        geo = (row.get("geography") or row.get('"geography"') or "").strip().strip('"')
        code = (row.get("ecode") or "").strip()
        if geo != "LSOA" or code not in codes:
            continue
        bands = [num(row.get(f"band_{b}")) for b in BANDS]
        tot = num(row.get("all_properties"))
        if tot <= 0:
            tot = sum(bands)
        tax[code] = {"ct": bands, "ctN": tot}
    if len(tax) < 400:
        die(f"council tax LSOA rows {len(tax)} unexpected")

    lsoa_out = {}
    for code in codes:
        rec = {}
        rec.update(tenure.get(code) or {})
        rec.update(ages.get(code) or {})
        rec.update(tax.get(code) or {})
        if rec:
            lsoa_out[code] = rec

    # District aggregates from member LSOAs (by la name on lsoa_rates)
    dist = {d["code"]: {"hh": 0, "owned_n": 0, "social_n": 0, "priv_n": 0, "pop21": 0, "age_n": [0] * 5, "ct": [0] * 8, "ctN": 0} for d in summary["districts"]}
    for code, row in lr["lsoa"].items():
        la = row.get("la")
        dc = la_code.get(la)
        if not dc or dc not in dist:
            continue
        c = lsoa_out.get(code) or {}
        d = dist[dc]
        hh = c.get("hh") or 0
        d["hh"] += hh
        if c.get("owned") is not None:
            d["owned_n"] += c["owned"] / 100 * hh
            d["social_n"] += (c.get("social") or 0) / 100 * hh
            d["priv_n"] += (c.get("priv") or 0) / 100 * hh
        pop = c.get("pop21") or 0
        d["pop21"] += pop
        if c.get("age") and pop:
            for i, p in enumerate(c["age"]):
                d["age_n"][i] += (p or 0) / 100 * pop
        if c.get("ct"):
            for i, n in enumerate(c["ct"]):
                d["ct"][i] += n
            d["ctN"] += c.get("ctN") or 0

    districts = {}
    for d in summary["districts"]:
        x = dist[d["code"]]
        districts[d["code"]] = {
            "name": d["name"],
            "hh": int(x["hh"]),
            "owned": pct(x["owned_n"], x["hh"]),
            "social": pct(x["social_n"], x["hh"]),
            "priv": pct(x["priv_n"], x["hh"]),
            "pop21": int(x["pop21"]),
            "age": [pct(v, x["pop21"]) for v in x["age_n"]],
            "ct": x["ct"],
            "ctN": int(x["ctN"]),
        }

    out = {
        "meta": {
            "census": "Census 2021 (21 March 2021), ONS via Nomis, OGL v3.0. Tenure is TS054 (households). Age is TS007A, grouped from five-year bands.",
            "councilTax": "Valuation Office Agency, Council Tax stock of properties (CTSOP1.1) at 31 March 2026, OGL v3.0. Counts are rounded to the nearest 10; some small band counts are suppressed in the source.",
            "note": "Shown as background about who lives and pays council tax in the neighbourhood, not as a judgement or a safety score. Census figures are from 2021 and will have changed. Council tax bands in England are based on 1991 values.",
            "ageKeys": AGE_KEYS,
            "ctBands": [b.upper() for b in BANDS],
            "generated": time.strftime("%Y-%m-%d"),
            "n": len(lsoa_out),
        },
        "lsoa": lsoa_out,
        "districts": districts,
    }
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    os.replace(tmp, OUT)
    print("wrote", OUT, "lsoa", len(lsoa_out), "tax", len(tax), "bytes", os.path.getsize(OUT))
    # sanity print one
    hunts = next(d for d in summary["districts"] if d["name"] == "Huntingdonshire")
    print("Huntingdonshire context", districts[hunts["code"]])
    return 0


if __name__ == "__main__":
    sys.exit(main())
