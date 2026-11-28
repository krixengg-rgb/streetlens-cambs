#!/usr/bin/env python3
"""Police force / area configuration shared by every StreetLens build script.

Pick the force with the SL_FORCE environment variable or a --force-id=<id> argument
(default: cambridgeshire, which keeps the original public/data paths so existing
URLs keep working). Each further force writes to public/data/f/<id>/ and
public/feeds/<id>/.

To add a force: add an entry to FORCES (police.uk force id, district GSS codes with
their police.uk neighbourhood ids, and the area filters below), add the same
entry to FORCES in public/app.js, then run the build scripts with SL_FORCE=<id>.
"""
import os, sys, urllib.error

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FORCES = {
    "cambridgeshire": {
        "name": "Cambridgeshire & Peterborough",
        "police": "Cambridgeshire Constabulary",
        "districts": {
            "E07000008": ("Cambridge", ["CamCity_City_Centre", "CamCity_East_City", "CamCity_North_City", "CamCity_South_City"]),
            "E07000009": ("East Cambridgeshire", ["East_Cambridgeshire"]),
            "E07000010": ("Fenland", ["March", "Wisbech"]),
            "E07000011": ("Huntingdonshire", ["Huntingdon_and_Yaxley", "St_Ives_and_Ramsey", "St_Neots"]),
            "E07000012": ("South Cambridgeshire", ["South_Cambridgeshire"]),
            "E06000031": ("Peterborough", ["Peterborough_Central", "Peterborough_City_Centre", "Peterborough_Eastern", "Peterborough_Northern", "Peterborough_Southern"]),
        },
        # Land Registry district names -> GSS code
        "lr_districts": {"CAMBRIDGE": "E07000008", "EAST CAMBRIDGESHIRE": "E07000009", "FENLAND": "E07000010",
                         "HUNTINGDONSHIRE": "E07000011", "SOUTH CAMBRIDGESHIRE": "E07000012", "CITY OF PETERBOROUGH": "E06000031"},
        "gias_las": ["Cambridgeshire", "Peterborough"],
        "naptan_areas": ["050", "059"],
        # postcode areas that can contain addresses in the force (filtered by LAD later where possible)
        "pc_areas": ["CB", "PE"],
        "pc_whole_areas": True,  # keep every CB/PE postcode (original behaviour)
        "nhs_pc_re": r"^(CB|PE|SG8|SG19|IP28|NR)",
        # lat0, lat1, lon0, lon1 (generous; used for rail stations and collision sanity filter)
        "bbox": (52.0, 52.75, -0.55, 0.55),
        "collision_bbox": (51.9, 52.9, -0.8, 0.6),
        "min_crimes": 40000,
        "min_schools": 200,
        "min_stops": 2000,
        "alerts": ("eCops", "https://www.ecops.org.uk/"),
    },
    "northamptonshire": {
        "name": "Northamptonshire",
        "police": "Northamptonshire Police",
        "districts": {
            "E06000062": ("West Northamptonshire", ["ND1", "ND2", "ND3", "ND4", "NN1", "NN2", "NN3", "NN4", "NN5", "NN6", "NN7", "NN8", "NS1", "NS2", "NS3", "NS4"]),
            "E06000061": ("North Northamptonshire", ["EN1", "EN2", "EN3", "EN4", "EN5", "NC1", "NC2", "NK1", "NK2", "NK3", "NK4", "NK5", "NK6", "NW1", "NW2", "NW3", "NW4", "NW5"]),
        },
        "lr_districts": {"WEST NORTHAMPTONSHIRE": "E06000062", "NORTH NORTHAMPTONSHIRE": "E06000061"},
        "gias_las": ["West Northamptonshire", "North Northamptonshire"],
        "naptan_areas": ["280"],
        "pc_areas": ["NN", "MK", "OX", "CV", "LE", "PE"],
        "nhs_pc_re": r"^(NN|MK|OX|CV|LE|PE)",
        "bbox": (51.95, 52.70, -1.40, -0.30),
        "collision_bbox": (51.85, 52.8, -1.5, -0.2),
        "min_crimes": 30000,
        "lsoa_range": (400, 520),
        "min_schools": 150,
        "min_stops": 1500,
        "min_rail": 5,
        "alerts": ("Northamptonshire Talking", "https://www.northamptonshiretalking.co.uk/"),
    },
}
DEFAULT = "cambridgeshire"


def force_id():
    for a in sys.argv[1:]:
        if a.startswith("--force-id="):
            return a.split("=", 1)[1]
    return os.environ.get("SL_FORCE") or DEFAULT


ID = force_id()
if ID not in FORCES:
    raise SystemExit(f"unknown force {ID!r}; known: {', '.join(FORCES)}")
CFG = FORCES[ID]
NAME = CFG["name"]
DIST = CFG["districts"]
CODES = set(DIST)
IS_DEFAULT = ID == DEFAULT
# Per-force output and raw caches. Cambridgeshire keeps the original paths.
OUT = os.path.join(ROOT, "public", "data") if IS_DEFAULT else os.path.join(ROOT, "public", "data", "f", ID)
FEEDS = os.path.join(ROOT, "public", "feeds") if IS_DEFAULT else os.path.join(ROOT, "public", "feeds", ID)
RAW = os.path.join(ROOT, "raw") if IS_DEFAULT else os.path.join(ROOT, "raw", "f", ID)
# National downloads shared by every force (GIAS, NHS ODS, Land Registry, STATS19, IoD, Census, VOA ...)
RAW_NAT = os.path.join(ROOT, "raw")
WEB_PATH = "" if IS_DEFAULT else f"f/{ID}/"  # relative to public/data and public/feeds
for d in (OUT, RAW, RAW_NAT, FEEDS):
    os.makedirs(d, exist_ok=True)


def in_bbox(lat, lon, pad=0.0):
    a, b, c, d = CFG["bbox"]
    return a - pad <= lat <= b + pad and c - pad <= lon <= d + pad


_OC = None


def postcode_filter(candidates):
    """Return f(pc_without_space) -> bool for postcodes in this force.

    For forces whose postcode areas straddle neighbours (e.g. NN/MK/LE), keep only
    outcodes that postcodes.io says touch one of the force's districts. Cached per force.
    """
    global _OC
    areas = tuple(CFG["pc_areas"])
    if CFG.get("pc_whole_areas"):
        return lambda pc: pc.startswith(areas)
    if True:
        import json, urllib.request, time
        cf = os.path.join(RAW, "outcodes.json")
        cache = json.load(open(cf)) if os.path.exists(cf) else {}
        names = {v[0] for v in DIST.values()}
        todo = sorted({c for c in candidates if c and c.startswith(areas) and c not in cache})
        for oc in todo:
            for i in range(4):
                try:
                    req = urllib.request.Request(f"https://api.postcodes.io/outcodes/{oc}", headers={"User-Agent": "StreetLens/1.0"})
                    with urllib.request.urlopen(req, timeout=30) as r:
                        cache[oc] = (json.load(r).get("result") or {}).get("admin_district") or []
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 404:
                        cache[oc] = []
                        break
                    time.sleep(1 + i)
                except Exception:
                    time.sleep(1 + i)
        json.dump(cache, open(cf, "w"))
        _OC = {oc for oc, ds in cache.items() if names & set(ds)}
        print("postcode filter:", len(_OC), "outcodes in", NAME)
    return lambda pc: len(pc) > 3 and pc[:-3] in _OC
