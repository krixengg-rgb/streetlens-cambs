#!/usr/bin/env python3
"""Build extra static layers: GP/dentists (NHS ODS), schools (DfE GIAS + Ofsted MI), transport (NaPTAN), house prices (HMLR PPD). Run monthly after refresh_data.py."""
import csv, json, os, re, io, statistics, subprocess, urllib.request, datetime, collections, time
B=os.path.dirname(os.path.abspath(__file__)); RAW=os.path.join(B,"..","raw"); OUT=os.path.join(B,"..","public","data"); os.makedirs(RAW,exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 (StreetLens prototype)"}
def dl(url,path):
    req=urllib.request.Request(url,headers=UA); open(path,"wb").write(urllib.request.urlopen(req,timeout=300).read()); return path
LAS={"Cambridge":"E07000008","East Cambridgeshire":"E07000009","Fenland":"E07000010","Huntingdonshire":"E07000011","South Cambridgeshire":"E07000012","Peterborough":"E06000031"}
CODES=set(LAS.values())
_geo={}
def geocode(pcs):
    todo=[p for p in {p.upper().strip() for p in pcs if p} if p not in _geo]
    for i in range(0,len(todo),100):
        body=json.dumps({"postcodes":todo[i:i+100]}).encode()
        req=urllib.request.Request("https://api.postcodes.io/postcodes",data=body,headers={**UA,"Content-Type":"application/json"})
        for r in json.load(urllib.request.urlopen(req,timeout=60))["result"]:
            q=r["result"]; _geo[r["query"].upper()]=(q["latitude"],q["longitude"],q["codes"]["admin_district"]) if q and q["latitude"] else None
    return _geo
def w(name,obj): json.dump(obj,open(os.path.join(OUT,name),"w"),separators=(",",":")); print(name,len(obj) if isinstance(obj,list) else "")
title=lambda s:re.sub(r"\b(Nhs|Gp|Pcn|Uk)\b",lambda m:m.group(0).upper(),s.title())
# --- NHS ODS GP practices (epraccur) & dental practices (egdpprac)
for rep,out in (("epraccur","gp.json"),("egdpprac","dentists.json")):
    p=dl(f"https://www.odsdatasearchandexport.nhs.uk/api/getReport?report={rep}",os.path.join(RAW,rep+".csv"))
    rows=[r for r in csv.reader(open(p,encoding="latin-1")) if len(r)>12 and r[12]=="ACTIVE" and re.match(r"^(CB|PE|SG8|SG19|IP28|NR)",r[9])]
    if rep=="epraccur": rows=[r for r in rows if len(r)>25 and r[25]=="RO76"]  # primary role RO76 = GP practice
    g=geocode([r[9] for r in rows]); res=[]
    for r in rows:
        x=g.get(r[9].upper())
        if x and x[2] in CODES: res.append([round(x[0],5),round(x[1],5),title(r[1]),r[9],r[0]])
    w(out,res)
# --- Schools: GIAS + Ofsted latest-inspections MI
gias=dl(f"https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata{datetime.date.today():%Y%m%d}.csv",os.path.join(RAW,"gias.csv"))
api=urllib.request.urlopen(urllib.request.Request("https://www.gov.uk/api/content/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes",headers=UA)).read().decode()
mon={m:i for i,m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())}
def key(u):
    m=re.search(r"as_at_(\d+)_([A-Za-z]+)_(\d{4})",u); return (int(m[3]),mon[m[2][:3].lower()],int(m[1]))
urls=sorted(set(re.findall(r'https://assets[^"\\]+latest_inspections_as_at_[^"\\]+\.csv',api)),key=key)
of={}; ofdate=key(urls[-1])
for r in csv.DictReader(open(dl(urls[-1],os.path.join(RAW,"ofsted.csv")),encoding="latin-1")):
    g=r.get("Latest OEIF overall effectiveness",""); d=r.get("Inspection start date of latest OEIF graded inspection","")
    m=re.search(r"remains (Outstanding|Good|Requires improvement|Inadequate)",r.get("Ungraded inspection overall outcome",""),re.I)
    if g not in("1","2","3","4") and m: g={"outstanding":"1","good":"2","requires improvement":"3","inadequate":"4"}[m[1].lower()]; d=r.get("Date of latest ungraded inspection","")+" (ungraded check)"
    elif g=="Not judged": g="NJ"
    of[r["URN"]]=(g,d)
links=collections.defaultdict(list)
for d in range(3):
    D=(datetime.date.today()-datetime.timedelta(days=d)).strftime("%Y%m%d")
    try: lp=dl(f"https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/links_edubasealldata{D}.csv",os.path.join(RAW,"links.csv")); break
    except Exception as e: lp=None
if lp:
    for r in csv.DictReader(open(lp,encoding="latin-1")):
        if r["LinkType"].startswith("Predecessor"): links[r["URN"]].append(r["LinkURN"])
# older Ofsted MI files keep grades for closed predecessor URNs
for u in urls[-1:0:-6][1:4]:
    try:
        for r in csv.DictReader(io.StringIO(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=120).read().decode("latin-1"))):
            g=r.get("Latest OEIF overall effectiveness") or r.get("Overall effectiveness","")
            if r["URN"] not in of and g in("1","2","3","4"): of[r["URN"]]=(g,r.get("Inspection start date of latest OEIF graded inspection") or r.get("Inspection start date",""))
    except Exception as e: print("old MI",e)
def grade(urn,depth=0):
    o=of.get(urn,("",""))
    if o[0] in("1","2","3","4") or depth>2: return o,False
    for p in links.get(urn,[]):
        g,_=grade(p,depth+1)
        if g[0] in("1","2","3","4"): return g,True
    return o,False
GR={"1":"Outstanding","2":"Good","3":"Requires improvement","4":"Inadequate","NJ":"No overall grade (post-2024 inspection)"}
rows=[r for r in csv.DictReader(open(gias,encoding="latin-1")) if r["LA (name)"] in("Cambridgeshire","Peterborough") and r["EstablishmentStatus (name)"]=="Open"]
g=geocode([r["Postcode"] for r in rows]); res=[]
for r in rows:
    x=g.get(r["Postcode"].upper())
    if not x: continue
    o,pred=grade(r["URN"])
    res.append([round(x[0],5),round(x[1],5),r["EstablishmentName"],r["PhaseOfEducation (name)"],r["TypeOfEstablishment (name)"],GR.get(o[0],""),o[1]+(" (predecessor school)" if pred and o[0] else ""),r["URN"]])
print("schools graded",sum(1 for x in res if x[5]),"of",len(res),"via predecessor",sum(1 for x in res if "predecessor" in x[6]))
w("schools.json",res)
# --- NaPTAN: 050 Cambridgeshire, 059 Peterborough
from pyproj import Transformer
TR=Transformer.from_crs(27700,4326,always_xy=True)
stops=[];rail={}
for a in ("050","059"):
    for r in csv.DictReader(io.StringIO(urllib.request.urlopen(urllib.request.Request(f"https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes={a}",headers=UA),timeout=120).read().decode("utf-8-sig"))):
        if r.get("Status","active").lower()!="active" or not r["Easting"]: continue
        lng,lat=TR.transform(float(r["Easting"]),float(r["Northing"])); lat,lng=round(lat,5),round(lng,5)
        if r["StopType"] in("BCT","BCS","BCQ"): stops.append([lat,lng,r["CommonName"]+(" ("+r["Indicator"]+")" if r["Indicator"] else "")])

for r in csv.DictReader(io.StringIO(urllib.request.urlopen(urllib.request.Request("https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes=910",headers=UA),timeout=180).read().decode("utf-8-sig"))):
    if r["StopType"]!="RLY" or r.get("Status","active").lower()!="active" or not r["Easting"]: continue
    lng,lat=TR.transform(float(r["Easting"]),float(r["Northing"]))
    if 52.0<lat<52.75 and -0.55<lng<0.55:
        n=re.sub(r"\s*Rail Station.*","",r["CommonName"]).strip()+" station"; rail.setdefault(n,[round(lat,5),round(lng,5),n])
w("stops.json",stops); w("rail.json",list(rail.values()))
# --- HM Land Registry Price Paid (last 12 months of available data)
y=datetime.date.today().year; sales=[]
for yr in (y-1,y):
    try:
        req=urllib.request.Request(f"http://prod2.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-{yr}.csv",headers=UA)
        txt=urllib.request.urlopen(req,timeout=600).read().decode("latin-1")
    except Exception as e: print("pp",yr,e); continue
    for r in csv.reader(io.StringIO(txt)):
        if r[12] in("CAMBRIDGE","EAST CAMBRIDGESHIRE","FENLAND","HUNTINGDONSHIRE","SOUTH CAMBRIDGESHIRE","CITY OF PETERBOROUGH") and r[3] and r[14]=="A":
            sales.append((r[2][:10],int(r[1]),r[3],r[12]))
last=max(s[0] for s in sales); d=datetime.date.fromisoformat(last); start=(d.replace(day=1)-datetime.timedelta(days=335)).replace(day=1).isoformat()
sales=[s for s in sales if s[0]>=start]
dn={"CAMBRIDGE":"E07000008","EAST CAMBRIDGESHIRE":"E07000009","FENLAND":"E07000010","HUNTINGDONSHIRE":"E07000011","SOUTH CAMBRIDGESHIRE":"E07000012","CITY OF PETERBOROUGH":"E06000031"}
sec=collections.defaultdict(list); dis=collections.defaultdict(list)
for _,p,pc,dd in sales: sec[pc[:-2].strip()].append(p); dis[dn[dd]].append(p)
w("prices.json",{"from":start,"to":last,"note":"Standard (category A) residential sales","districts":{k:[int(statistics.median(v)),len(v)] for k,v in dis.items()},"sectors":{k:[int(statistics.median(v)),len(v)] for k,v in sec.items()},"ofstedAsAt":"%d-%02d-%02d"%(ofdate[0],ofdate[1]+1,ofdate[2])})
