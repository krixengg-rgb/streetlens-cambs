#!/usr/bin/env python3
"""Refresh Cambridgeshire crime data (data.police.uk API) + ONS population (Nomis). Run monthly."""
import json, time, csv, io, urllib.request, urllib.parse, concurrent.futures as cf, os
API="https://data.police.uk/api"; OUT=os.path.join(os.path.dirname(__file__),"..","public","data")
def get(url,data=None):
    for i in range(6):
        try:
            req=urllib.request.Request(url,data=data,headers={"User-Agent":"cambs-crime-prototype"})
            return urllib.request.urlopen(req,timeout=120).read()
        except Exception as e:
            print("retry",url[:80],e); time.sleep(2*(i+1))
    raise RuntimeError(url)
DIST={"E07000008":("Cambridge",["CamCity_City_Centre","CamCity_East_City","CamCity_North_City","CamCity_South_City"]),
 "E07000009":("East Cambridgeshire",["East_Cambridgeshire"]),
 "E07000010":("Fenland",["March","Wisbech"]),
 "E07000011":("Huntingdonshire",["Huntingdon_and_Yaxley","St_Ives_and_Ramsey","St_Neots"]),
 "E07000012":("South Cambridgeshire",["South_Cambridgeshire"]),
 "E06000031":("Peterborough",["Peterborough_Central","Peterborough_City_Centre","Peterborough_Eastern","Peterborough_Northern","Peterborough_Southern"])}
pop={}; popyear=None
r=get("https://www.nomisweb.co.uk/api/v01/dataset/NM_2002_1.data.csv?geography="+",".join(DIST)+"&date=latest&gender=0&c_age=200&measures=20100&select=date_name,geography_code,obs_value").decode()
for row in csv.DictReader(io.StringIO(r)): pop[row["GEOGRAPHY_CODE"]]=int(row["OBS_VALUE"]); popyear=row["DATE_NAME"]
dates=[d["date"] for d in json.loads(get(API+"/crimes-street-dates")) if "cambridgeshire" in d.get("stop-and-search",[]) or True]
months=sorted(dates)[-12:]
nb2d={n:c for c,(_,ns) in DIST.items() for n in ns}
polys={}
for n in nb2d:
    b=json.loads(get(f"{API}/cambridgeshire/{n}/boundary")); polys[n]=":".join(f"{p['latitude']},{p['longitude']}" for p in b)
def fetch(job):
    n,m=job
    d=json.loads(get(API+"/crimes-street/all-crime",urllib.parse.urlencode({"poly":polys[n],"date":m}).encode()))
    if len(d)>=10000: print("WARNING cap hit",n,m)
    return n,m,d
seen={}; 
with cf.ThreadPoolExecutor(6) as ex:
    for n,m,d in ex.map(fetch,[(n,m) for n in nb2d for m in months]):
        for c in d:
            key=c["id"] or c["persistent_id"]
            if key not in seen: seen[key]=(nb2d[n],m,c)
cats=json.loads(get(API+"/crime-categories"));catname={c["url"]:c["name"] for c in cats}
catlist=sorted({c["category"] for _,_,c in seen.values()})
def blank(): return {"total":0,"byType":{k:0 for k in catlist},"monthly":{m:0 for m in months}}
dist={c:blank() for c in DIST}; allc=blank(); pts=[]
OB=["Charged / summonsed","Out-of-court resolution","No suspect identified","Unable to prosecute / not in public interest","Under investigation","Other / transferred","No outcome (ASB)"]
def ob(c):
    o=(c.get("outcome_status") or {}).get("category")
    if not o: return 6
    l=o.lower()
    if any(k in l for k in ["charged","court","prison","fined","sentence","discharge","compensation","otherwise dealt","not guilty","deprived","summons"]): return 0
    if any(k in l for k in ["caution","local resolution","penalty","warning","community resolution"]): return 1
    if "no suspect" in l: return 2
    if any(k in l for k in ["unable","public interest"]): return 3
    if any(k in l for k in ["under investigation","status update"]): return 4
    return 5
raw_out=__import__("collections").Counter()
for code,m,c in seen.values():
    for agg in (dist[code],allc):
        agg["total"]+=1; agg["byType"][c["category"]]+=1; agg["monthly"][m]+=1; agg.setdefault("outcomes",[0]*7)[ob(c)]+=1
    pts.append([round(float(c["location"]["latitude"]),5),round(float(c["location"]["longitude"]),5),catlist.index(c["category"]),months.index(m),ob(c)]); raw_out[(c.get("outcome_status") or {}).get("category")]+=1
tp=sum(pop.values())
ss=[]
for m in months:
    for x in json.loads(get(f"{API}/stops-force?force=cambridgeshire&date={m}")):
        if x.get("location"): ss.append([round(float(x["location"]["latitude"]),5),round(float(x["location"]["longitude"]),5),months.index(m)])
json.dump(ss,open(os.path.join(OUT,"stopsearch.json"),"w"),separators=(",",":"))
print("stops",len(ss)); print(raw_out.most_common())
summary={"outcomeBuckets":OB,"generated":time.strftime("%Y-%m-%d"),"months":months,"popYear":popyear,
 "categories":[{"id":k,"name":catname.get(k,k)} for k in catlist],
 "overview":{**allc,"name":"Cambridgeshire & Peterborough","population":tp,"rate":round(allc["total"]/tp*1000,1)},
 "districts":[{"code":c,"name":DIST[c][0],"population":pop[c],"rate":round(dist[c]["total"]/pop[c]*1000,1),**dist[c]} for c in DIST]}
json.dump(summary,open(os.path.join(OUT,"summary.json"),"w"))
json.dump(pts,open(os.path.join(OUT,"points.json"),"w"),separators=(",",":"))
print("crimes",len(seen),"months",months[0],months[-1])
