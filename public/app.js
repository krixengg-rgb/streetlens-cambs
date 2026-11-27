'use strict';
/* StreetLens front end — static data in /data, no build step */
let S,PR,P,map,charts=[];const $=s=>document.querySelector(s),app=$('#app');
const fmt=n=>Number(n).toLocaleString('en-GB'),slug=s=>s.toLowerCase().replace(/[^a-z]+/g,'-');
const mname=m=>new Date(m+'-01').toLocaleDateString('en-GB',{month:'short',year:'2-digit'});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cn=id=>(S.categories.find(c=>c.id==id)||{name:id}).name;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const _lj={};const lj=n=>_lj[n]||(_lj[n]=fetch('data/'+n+'.json').then(r=>{if(!r.ok)throw Error(n);return r.json()}));
/* ---------- icons (inline SVG, stroke style) ---------- */
const IP={search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',check:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/><path d="M9 11h6M12 8v6"/>',tooth:'<path d="M7 4c-2 0-3 2-3 4 0 3 1 4 2 8 .5 2 1 4 2 4s1.5-3 2-5c.3-1 1.7-1 2 0 .5 2 1 5 2 5s1.5-2 2-4c1-4 2-5 2-8 0-2-1-4-3-4-1.5 0-3 1-5 1S8.5 4 7 4z"/>',
school:'<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',bus:'<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 21v-3M16 21v-3"/><circle cx="8.5" cy="14.5" r=".8"/><circle cx="15.5" cy="14.5" r=".8"/>',
train:'<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 10h12M9 21l1.5-4M15 21l-1.5-4"/>',home:'<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',chart:'<path d="M4 20V4M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>',
pin:'<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',sv:'<circle cx="12" cy="5.5" r="2.2"/><path d="M12 8.2v4.3M9 20.5l3-8 3 8M7.5 13.5h9"/>',loc:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
people:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/>',
gavel:'<path d="M14 4l6 6M11 7l6 6M12.5 5.5l-5 5M18.5 11.5l-5 5M3 21l7-7"/>',hand:'<path d="M8 13V5.5a1.5 1.5 0 013 0V11M11 10V4.5a1.5 1.5 0 013 0V11M14 10V5.5a1.5 1.5 0 013 0V14c0 4-3 7-6.5 7S5 19 4 16l-1.5-3.5a1.5 1.5 0 012.6-1.4L8 14"/>',
expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',shrink:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',flood:'<path d="M12 3c4 6 7 9 7 12a7 7 0 11-14 0c0-3 3-6 7-12z"/>',wifi:'<path d="M5 12.5a9 9 0 0114 0M8.5 16a5 5 0 017 0"/><circle cx="12" cy="20" r="1.2"/>',depr:'<path d="M4 20V10l8-6 8 6v10"/><path d="M10 20v-6h4v6"/>',map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',park:'<path d="M12 22V11"/><path d="M12 14c-4-1-7-4-7-8 5 0 7 3 7 5 0-2 2-5 7-5 0 4-3 7-7 8z"/><path d="M7 22h10"/>',save:'<path d="M7 3h10a2 2 0 012 2v16l-7-4-7 4V5a2 2 0 012-2z"/>',code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>'};
const ic=(n,s=20)=>`<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IP[n]}</svg>`;
const tipI=t=>`<button type="button" class="tip-i" aria-label="Help: ${esc(t)}" data-tip="${esc(t)}"></button>`;
/* ---------- helpers ---------- */
function spark(vals,color='var(--teal)'){const w=200,h=34,mx=Math.max(...vals),mn=Math.min(...vals),r=mx-mn||1;
 const pts=vals.map((v,i)=>[i*w/(vals.length-1),h-3-(v-mn)/r*(h-6)]);const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');
 return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Trend over 12 months, from ${fmt(vals[0])} to ${fmt(vals.at(-1))}"><path d="${d} L${w} ${h} L0 ${h}Z" fill="${color}" opacity=".12"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`}
/* badge: higherIsBad true => higher value shown red. Text always states direction */
function badge(v,ref,label,higherIsBad=true,unit=''){if(ref==null||v==null||isNaN(v))return '';const diff=(v-ref)/ref*100;
 if(Math.abs(diff)<5)return `<span class="badge neu">≈ Similar to ${label}</span>`;const up=diff>0,bad=up===higherIsBad;
 return `<span class="badge ${bad?'bad':'good'}">${up?'▲':'▼'} ${Math.abs(diff).toFixed(0)}% ${up?'higher':'lower'} than ${label}</span>`}
function csv(name,rows){const b=new Blob([rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click()}
window._csv={};const csvBtn=(id,rows,what)=>{window._csv[id]=rows;return `<button class="btn ghost" aria-label="Download ${what} as a CSV file" data-tip="Download ${what} as a CSV file for Excel or Google Sheets." onclick="csv('${id}.csv',_csv['${id}'])">${ic('dl',18)} CSV</button>`};
function hav(a,b,c,d){const R=3958.8,r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
const nearest=(arr,la,lo,n)=>arr.map(p=>Object.assign([...p],{d:hav(la,lo,p[0],p[1])})).sort((a,b)=>a.d-b.d).slice(0,n);
const solveOf=a=>{const t=a.outcomes.reduce((x,y)=>x+y,0)-a.outcomes[6];return t?(a.outcomes[0]+a.outcomes[1])/t*100:0};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------- Stage A: radius + crime-type filters + meta ---------- */
const RADII=[0.5,1,2];
function getR(){const v=parseFloat(sessionStorage.getItem('sl-r')||'1');return RADII.includes(v)?v:1}
function setR(r){sessionStorage.setItem('sl-r',String(r))}
function getTypeFilter(){try{const t=JSON.parse(sessionStorage.getItem('sl-tf')||'null');return Array.isArray(t)?new Set(t):null}catch{return null}}
function setTypeFilter(set){if(!set||set.size===S.categories.length)sessionStorage.removeItem('sl-tf');else sessionStorage.setItem('sl-tf',JSON.stringify([...set]))}
const WINDOWS=[3,6,12];
function getW(){const q=new URLSearchParams(location.search).get('w'); if(q&&WINDOWS.includes(+q)){sessionStorage.setItem('sl-w',q);return +q}
 const v=parseInt(sessionStorage.getItem('sl-w')||'12',10);return WINDOWS.includes(v)?v:12}
function setW(w){sessionStorage.setItem('sl-w',String(w))}
function windowBar(w){return `<div class="rbar" role="group" aria-label="Time window">${WINDOWS.map(x=>`<button type="button" class="rbtn${x===w?' on':''}" data-w="${x}" aria-pressed="${x===w}" data-tip="Show crimes recorded in the last ${x} months of published data. The default is 12 months.">${x} mo</button>`).join('')}</div>`}
function wLabel(w){return w===12?'12 months':'the last '+w+' months'}
function wMonths(w){return S.months.slice(-w)}
function inWindow(p,w){return p[3]>=S.months.length-w}
function pcUrl(postcode){const w=getW(); return '?pc='+encodeURIComponent(postcode)+(w===12?'':'&w='+w)+'&mode='+getMode()}

const WATCH_KEY='sl-watch';
function normPc(pc){return String(pc||'').toUpperCase().replace(/\s+/g,' ').trim()}
function watchGet(){try{const a=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
function watchSet(a){localStorage.setItem(WATCH_KEY,JSON.stringify(a.slice(0,20)))}
function watchHas(pc){const n=normPc(pc);return watchGet().some(x=>x.pc===n)}
function watchToggle(pc,label){const n=normPc(pc);let a=watchGet();if(a.some(x=>x.pc===n))a=a.filter(x=>x.pc!==n);else a=[{pc:n,label:label||n,ts:Date.now()},...a];watchSet(a);return a}
const PLACE_LA=new Set(['Cambridgeshire','Peterborough','City of Peterborough','Cambridge','East Cambridgeshire','Fenland','Huntingdonshire','South Cambridgeshire']);
function placeInArea(p){return PLACE_LA.has(p.county_unitary)||PLACE_LA.has(p.district_borough)}
function monthHeat(monthly,months,title){if(!months||!months.length)return '';
 const vals=months.map(m=>monthly[m]||0),mx=Math.max(...vals,1);
 const rows={}; months.forEach((m,i)=>{const y=m.slice(0,4);(rows[y]=rows[y]||[]).push({m,v:vals[i]})});
 const cells=Object.entries(rows).map(([y,arr])=>`<div class="cal-row"><span class="cal-y">${y}</span>${arr.map(({m,v})=>{const t=v/mx;return `<span class="cal-c" style="--t:${t.toFixed(2)}" title="${mname(m)}: ${fmt(v)} recorded"><abbr title="${mname(m)}">${m.slice(5)}</abbr><b>${fmt(v)}</b></span>`}).join('')}</div>`).join('');
 return `<div class="card"><div class="row"><h3>${title||'Month by month'}</h3>${tipI('Each cell is a published month of police-recorded crime. Colour is relative to the highest month shown here, not a national scale. Only the month is published — there is no day-of-week or time-of-day detail.')}</div><div class="cal" role="img" aria-label="Monthly recorded crime counts">${cells}</div></div>`}
function nearbyLsoa(lr,code,la,lo){const cur=lr&&lr.lsoa&&lr.lsoa[code]; if(!cur||cur.rate==null||la==null)return [];
 const out=[]; for(const [id,v] of Object.entries(lr.lsoa)){ if(id===code||v.lat==null||v.rate==null)continue; const d=hav(la,lo,v.lat,v.lon); if(d>5||v.rate>=cur.rate)continue; out.push({id,...v,dist:d}); }
 out.sort((a,b)=>(a.la===cur.la?0:1)-(b.la===cur.la?0:1)||a.dist-b.dist||a.rate-b.rate); return out.slice(0,4)}
function nearestLsoa(lr,code,la,lo,n){const cur=lr&&lr.lsoa&&lr.lsoa[code]; if(!cur||la==null)return [];
 const out=[]; for(const [id,v] of Object.entries(lr.lsoa)){ if(id===code||v.lat==null||v.rate==null)continue; const d=hav(la,lo,v.lat,v.lon); if(d>5)continue; out.push({id,...v,dist:d}); }
 out.sort((a,b)=>a.dist-b.dist); return out.slice(0,n||4)}
async function postcodeNearPoint(lat,lon){const r=await fetch(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&limit=5`).then(x=>x.json()); const rs=r.result||[]; return rs.find(p=>S.districts.some(d=>d.name===p.admin_district))||null}
function crimeTable(nearAll,cats,wm){const map={}; nearAll.forEach(p=>{const m=S.months[p[3]]; if(wm&&!wm.includes(m))return; const key=m+'|'+cats[p[2]]+'|'+(p[4]??''); map[key]=(map[key]||0)+1});
 const rows=Object.entries(map).map(([k,n])=>{const [m,ty,o]=k.split('|');return {m,ty,o:+o,n}}).sort((a,b)=>a.m.localeCompare(b.m)||b.n-a.n);
 const body=rows.map(r=>'<tr><td>'+mname(r.m)+'</td><td>'+cn(r.ty)+'</td><td>'+(S.outcomeBuckets[r.o]||'–')+'</td><td class="n">'+fmt(r.n)+'</td></tr>').join('');
 return `<div class="card" id="maptable"><div class="row"><h3>Crimes as a table</h3>${tipI('The same records as the map, grouped by month, type and latest outcome so the list stays readable. Locations are anonymised, so this is not a list of addresses.')}</div>
 <div style="overflow:auto;max-height:360px"><table><thead><tr><th>Month</th><th>Type</th><th>Outcome</th><th class="n">Count</th></tr></thead><tbody>${body||'<tr><td colspan="4">No records in this window.</td></tr>'}</tbody></table></div>
 <p class="muted">${fmt(nearAll.length)} records in ${fmt(rows.length)} groups. <a href="#mapbox">Back to the map</a></p></div>`}
function watchPanel(){const a=watchGet();
 if(!a.length) return `<p class="muted">Save a postcode from its dashboard — the list stays on this device. For official messages from Cambridgeshire Constabulary, use <a href="https://www.ecops.org.uk/" target="_blank" rel="noopener">eCops</a>.</p>`;
 return `<div class="card"><div class="row"><h3>Saved areas</h3><span class="muted">On this device only.</span></div>
  <ul class="watch">${a.map(x=>`<li><a class="tlink" href="?pc=${encodeURIComponent(x.pc)}" data-q="pc=${encodeURIComponent(x.pc)}">${esc(x.pc)}</a> <span class="muted">${esc(x.label&&x.label!==x.pc?x.label:'')}</span> <button type="button" class="btn ghost watch-rm" data-pc="${esc(x.pc)}" aria-label="Remove ${esc(x.pc)}">Remove</button></li>`).join('')}</ul></div>`}
function openDataBlock(dist){const sl=dist?slug(dist.name):null, feed=sl?'feeds/'+sl+'.xml':'feeds/county.xml', dl=sl?'data/downloads/'+sl+'.csv':'data/downloads/districts.csv', js=sl?'data/downloads/'+sl+'.json':'data/downloads/overview.json';
 return `<section class="sec"><div class="sec-h"><div><h2>Open data</h2><p>Download the figures on this page, or subscribe to an Atom feed that updates when a new month is published here.</p></div></div>
  <p class="row-btns"><a class="btn ghost" href="${js}" download>JSON</a> <a class="btn ghost" href="${dl}" download>CSV</a> <a class="btn ghost" href="${feed}">Atom feed</a>${dist?` <button type="button" class="btn ghost" id="emb-d">Embed</button>`:''}</p>
  <p class="muted">Licensed as open government data. The feed is a monthly snapshot, not a live incident alert. Official community messaging: <a href="https://www.ecops.org.uk/" target="_blank" rel="noopener">eCops</a>.</p></section>`}
function embedSnippet(kind,val){const src=new URL('embed.html', location.href).href.split('?')[0]+'?'+kind+'='+encodeURIComponent(val); return '<iframe title="StreetLens" src="'+src+'" style="width:100%;max-width:420px;min-height:230px;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'}
function showEmbed(kind,val){const sn=embedSnippet(kind,val); const box=document.createElement('div'); box.className='embed-pop'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Embed this page');
 box.innerHTML='<div class="card"><div class="row"><h3>Embed this profile</h3><button type="button" class="icon-btn" id="emb-x" aria-label="Close">×</button></div><p class="muted">Paste this into a page you control. It shows a compact summary and links back to StreetLens.</p><textarea id="emb-sn" readonly rows="4">'+sn.replace(/</g,'&lt;')+'</textarea><p><button type="button" class="btn" id="emb-copy">Copy snippet</button></p></div>';
 document.body.appendChild(box); const ta=box.querySelector('#emb-sn'); ta.value=sn; const close=()=>box.remove(); box.querySelector('#emb-x').onclick=close; box.addEventListener('click',e=>{if(e.target===box)close()});
 box.querySelector('#emb-copy').onclick=async()=>{try{await navigator.clipboard.writeText(sn);box.querySelector('#emb-copy').textContent='Copied'}catch{ta.select()}};}
function setMeta(title,desc,url){document.title=title;const set=(sel,attr,val)=>{let el=document.querySelector(sel);if(el)el.setAttribute(attr,val)};
 set('meta[name=description]','content',desc);set('meta[property="og:title"]','content',title);set('meta[property="og:description"]','content',desc);
 set('meta[property="og:url"]','content',url);set('meta[name="twitter:title"]','content',title);set('meta[name="twitter:description"]','content',desc);
 let c=document.querySelector('link[rel=canonical]');if(c)c.href=url}
function stripHtml(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
function radiusBar(r){return `<div class="rbar" role="group" aria-label="Search radius">${RADII.map(x=>`<button type="button" class="rbtn${x===r?' on':''}" data-r="${x}" aria-pressed="${x===r}" data-tip="Count crimes and draw the search circle at ${x} mile${x===1?'':'s'}.">${x===0.5?'½':x} mi</button>`).join('')}</div>`}
function typeFilterBar(by,active){const rows=Object.entries(by).filter(e=>e[1]).sort((a,b)=>b[1]-a[1]);if(!rows.length)return '';
 const all=!active||active.size===S.categories.length;
 return `<div class="tfbar" role="group" aria-label="Crime type filters"><button type="button" class="tchip${all?' on':''}" data-tf="all" aria-pressed="${all}">All types</button>${rows.map(([k,v])=>{const on=!active||active.has(k);return `<button type="button" class="tchip${on&&!all?' on':''}" data-tf="${esc(k)}" aria-pressed="${on}" data-tip="Show or hide ${cn(k)} on the map.">${cn(k)} <b>${fmt(v)}</b></button>`}).join('')}</div>`}

function bandLabel(b){return {H:'High',M:'Medium',L:'Low',V:'Very low'}[b]||'None mapped'}
function decileLabel(d){if(d==null)return '–';const t=['most deprived 10%','more deprived','more deprived','more deprived','around average','around average','less deprived','less deprived','less deprived','least deprived 10%'];return `Decile ${d} · ${t[d-1]||''}`}

async function loadPointsNear(la,lo,rMi){
  const meta=await lj('tiles/meta').catch(()=>null);
  if(!meta||!meta.cell){const PP=await lj('points');const pad=rMi*0.02;return PP.filter(p=>Math.abs(p[0]-la)<pad&&Math.abs(p[1]-lo)<pad*1.5&&hav(la,lo,p[0],p[1])<=rMi)}
  const cell=meta.cell, pad=rMi/69+cell; // miles→deg approx + cell
  const i0=Math.floor((la-pad)/cell), i1=Math.floor((la+pad)/cell);
  const j0=Math.floor((lo-pad)/cell), j1=Math.floor((lo+pad)/cell);
  const want=new Set();
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++) want.add(i+'_'+j);
  const files=[...want].filter(k=>meta.tiles.some(([i,j])=>i+'_'+j===k));
  const chunks=await Promise.all(files.map(k=>fetch('data/tiles/'+k+'.json').then(r=>r.ok?r.json():[]).catch(()=>[])));
  const out=[]; for(const arr of chunks) for(const p of arr){if(hav(la,lo,p[0],p[1])<=rMi) out.push(p)}
  return out}

async function loadPointsInBBox(minLa,maxLa,minLo,maxLo){
  const meta=await lj('tiles/meta').catch(()=>null);
  const pad=0.02;
  minLa-=pad; maxLa+=pad; minLo-=pad; maxLo+=pad;
  let pts;
  if(!meta||!meta.cell){
    const PP=await lj('points');
    pts=PP.filter(p=>p[0]>=minLa&&p[0]<=maxLa&&p[1]>=minLo&&p[1]<=maxLo);
  }else{
    const cell=meta.cell;
    const i0=Math.floor(minLa/cell), i1=Math.floor(maxLa/cell);
    const j0=Math.floor(minLo/cell), j1=Math.floor(maxLo/cell);
    const want=new Set();
    for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++) want.add(i+'_'+j);
    const files=[...want].filter(k=>meta.tiles.some(([ti,tj])=>ti+'_'+tj===k));
    const chunks=await Promise.all(files.map(k=>fetch('data/tiles/'+k+'.json').then(r=>r.ok?r.json():[]).catch(()=>[])));
    pts=[]; for(const arr of chunks) for(const p of arr) if(p[0]>=minLa&&p[0]<=maxLa&&p[1]>=minLo&&p[1]<=maxLo) pts.push(p);
  }
  return pts;
}

async function loadPrevPointsNear(la,lo,rMi){
  const meta=await fetch('data/prev_tiles/meta.json').then(r=>r.ok?r.json():null).catch(()=>null);
  if(!meta||!meta.cell) return [];
  const cell=meta.cell, pad=rMi/69+cell;
  const i0=Math.floor((la-pad)/cell), i1=Math.floor((la+pad)/cell);
  const j0=Math.floor((lo-pad)/cell), j1=Math.floor((lo+pad)/cell);
  const want=new Set();
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++) want.add(i+'_'+j);
  const files=[...want].filter(k=>(meta.tiles||[]).some(([ti,tj])=>ti+'_'+tj===k));
  const chunks=await Promise.all(files.map(k=>fetch('data/prev_tiles/'+k+'.json').then(r=>r.ok?r.json():[]).catch(()=>[])));
  const out=[]; for(const arr of chunks) for(const p of arr){if(hav(la,lo,p[0],p[1])<=rMi) out.push(p)}
  return {pts:out, months:meta.months||[]};
}
async function fetchJSON(url, fallback, tries=3){
  let last=null;
  for(let i=0;i<tries;i++){
    try{
      const r=await fetch(url,{cache:'no-store'});
      if(r.ok) return await r.json();
      last=new Error('HTTP '+r.status);
    }catch(e){last=e}
    await new Promise(res=>setTimeout(res, 400*Math.pow(2,i)));
  }
  return fallback;
}
function afterPaint(fn){requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(fn,0)))}

async function loadAreaExtras(postcode,lsoa){const pc=postcode.replace(/\s+/g,'').toUpperCase(),sec=pc.length>=5?pc.slice(0,-2):pc;
 const [imd,fl,bb]=await Promise.all(['imd','flood','broadband'].map(n=>lj(n).catch(()=>null)));
 const im=imd&&imd.lsoa&&imd.lsoa[lsoa];
 const fb=fl&&fl.pc?fl.pc[pc]:null;
 let gig=null,sfbb=null; if(bb){const hit=bb.pc&&bb.pc[pc]; const s=hit||(bb.sector&&bb.sector[sec]); if(s){gig=s[0];sfbb=s[1]}}
 return {im,fb,gig,sfbb,secFallback:!(bb&&bb.pc&&bb.pc[pc])}}

async function loadNeighbourhood(la,lo,el){
 const fail=()=>{el.innerHTML='<p class="muted">Could not load neighbourhood details just now. Police.uk sometimes blocks requests from this site.</p><p><button type="button" class="btn ghost" id="nb-retry">Try again</button></p>'; const b=$('#nb-retry'); if(b) b.onclick=()=>{el.innerHTML='<p class="muted">Looking up the local police team…</p>'; loadNeighbourhood(la,lo,el)};};
 try{
 const loc=await fetchJSON(`https://data.police.uk/api/locate-neighbourhood?q=${la},${lo}`, null, 3);
 if(!loc){fail();return}
 if(!loc.force||!loc.neighbourhood){el.innerHTML='<p class="muted">No neighbourhood team found for this point.</p>';return}
 const [info,pri,people,events]=await Promise.all([
  fetchJSON(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}`, null, 3),
  fetchJSON(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}/priorities`, [], 3),
  fetchJSON(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}/people`, [], 3),
  fetchJSON(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}/events`, [], 3)
 ]);
 if(!info){fail();return}
 const name=(info&&info.name)||loc.neighbourhood.replace(/_/g,' ');
 const url=`https://www.police.uk/pu/your-area/${loc.force}/${loc.neighbourhood.toLowerCase().replace(/_/g,'-')}/`;
 const cd=(info&&info.contact_details)||{};
 const tel=cd.telephone||cd.phone, email=cd.email;
 const bits=[];
 if(tel) bits.push('Phone <a href="tel:'+esc(String(tel).replace(/\s+/g,''))+'">'+esc(tel)+'</a>');
 if(email) bits.push('<a href="mailto:'+esc(email)+'">'+esc(email)+'</a>');
 const priHtml=(pri||[]).map(p=>{
   const issue=stripHtml(p.issue||'').slice(0,360);
   const action=stripHtml(p.action||'').slice(0,280);
   const when=p['issue-date']?String(p['issue-date']).slice(0,10):'';
   if(!issue)return '';
   return `<li><b>${esc(issue)}${issue.length>=360?'…':''}</b>${when?`<div class="muted">Set ${esc(when)}</div>`:''}${action?`<div class="muted">${esc(action)}${action.length>=280?'…':''}</div>`:''}</li>`;
 }).join('');
 const peoHtml=(people||[]).slice(0,12).map(p=>{
   const bio=stripHtml(p.bio||'').slice(0,200);
   return `<li><b>${esc(p.name||'Officer')}</b> <span class="muted">${esc(p.rank||'')}</span>${bio?`<div class="muted">${esc(bio)}${bio.length>=200?'…':''}</div>`:''}</li>`;
 }).join('');

 const now=new Date();
 const evHtml=(events||[]).filter(e=>e&&e.start_date&&new Date(e.end_date||e.start_date)>=now).slice().sort((a,b)=>String(a.start_date).localeCompare(String(b.start_date))).map(e=>{
   const start=new Date(e.start_date), end=e.end_date?new Date(e.end_date):null;
   if(isNaN(start)) return '';
   const when=start.toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'});
   const until=end&&!isNaN(end)?('–'+end.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'})):'';
   const desc=stripHtml(e.description||'').slice(0,240);
   const addr=String(e.address||'');
   const m=addr.match(/https?:\/\/[^\s<]+/);
   const place=m?stripHtml(addr.replace(m[0],'')).trim():addr;
   const link=m?`<a href="${esc(m[0])}" target="_blank" rel="noopener">Register or join</a>`:'';
   return `<li><b>${esc(e.title||'Event')}</b><div class="muted">${esc(when)}${esc(until)}${place?(' · '+esc(place)):''}</div>${desc?`<div class="muted">${esc(desc)}${desc.length>=240?'…':''}</div>`:''}${link?`<div>${link}</div>`:''}</li>`;
 }).join('');
 el.innerHTML=`<div class="row"><h3>Local policing</h3>${tipI('Neighbourhood team, contacts and priorities published by the force on data.police.uk. These change over time and are not StreetLens content. 101 is the non-emergency number.')}</div>
 <p><b>${esc(name)}</b> · ${esc(loc.force.replace(/-/g,' '))}</p>
 ${bits.length?`<p>${bits.join(' · ')}</p>`:''}
 ${priHtml?`<h4 class="subh">Current priorities</h4><ul class="pri">${priHtml}</ul>`:'<p class="muted">No current priorities were published for this team.</p>'}
 ${evHtml?`<h4 class="subh">Upcoming beat meetings and drop-ins</h4><ul class="ev">${evHtml}</ul>`:'<p class="muted">No upcoming neighbourhood events are published for this team just now.</p>'}
 ${peoHtml?`<h4 class="subh">Neighbourhood officers</h4><ul class="peo">${peoHtml}</ul>`:''}
 <p class="muted">Events, contacts and officers are as the force published them on data.police.uk and can change. For a non-emergency report use 101; call 999 in an emergency.</p>
 <p><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Open on police.uk</a></p>`}
 catch{fail()}}


/* ---------- Stage G helpers ---------- */
const icPlus={car:'<path d="M5 13l2-5h10l2 5"/><rect x="3" y="13" width="18" height="6" rx="1.5"/><circle cx="7.5" cy="16" r=".8"/><circle cx="16.5" cy="16" r=".8"/><path d="M7 19v2M17 19v2"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',image:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5.5-5.5-8.5 8"/>'};
Object.assign(IP,icPlus);

function loadAsset(el){return new Promise((res,rej)=>{el.onload=()=>res();el.onerror=()=>rej(new Error(el.src||'asset'))})}
function ensureLeaflet(){
  if(window.L&&window.L.markerClusterGroup)return Promise.resolve();
  return window._ll||(window._ll=(async()=>{
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'].forEach(h=>{const l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l)});
    const s1=document.createElement('script');s1.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';document.body.appendChild(s1);await loadAsset(s1);
    const s2=document.createElement('script');s2.src='https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';document.body.appendChild(s2);await loadAsset(s2);
  })());
}

function monthIndex(monthly,months){const vals=months.map(m=>monthly[m]||0),sum=vals.reduce((a,b)=>a+b,0),mean=vals.length?sum/vals.length:0;
  return {vals,mean,idx:vals.map(v=>mean?Math.round(v/mean*1000)/10:0)}}

function seasonMarkup(opts){opts=opts||{};
  return `<div class="card" id="${opts.wrapId||'season-card'}"><div class="row"><h3>${opts.title||'This year against the usual pattern'}</h3>${tipI('Each month as a percentage of this area’s own monthly average (100 is a typical month). Where a county line is shown, it uses the same months for Cambridgeshire & Peterborough. A peak can reflect reporting and police activity as well as offending.')}</div>
  <p class="muted" id="${opts.sumId||'season-sum'}"></p>
  <div style="height:220px"><canvas id="${opts.canvasId||'season'}" aria-label="Monthly pattern compared with the county"></canvas></div></div>`}

function drawSeason(el, localMonthly, months, countyMonthly){
  if(!el||!months||!months.length)return;
  const loc=monthIndex(localMonthly,months), cty=countyMonthly?monthIndex(countyMonthly,months):null;
  const peakI=loc.idx.reduce((b,v,i)=>v>loc.idx[b]?i:b,0), lowI=loc.idx.reduce((b,v,i)=>v<loc.idx[b]?i:b,0);
  const sum=$('#'+(el.id==='season'?'season-sum':el.id+'-sum'))||el.closest('.card')&&el.closest('.card').querySelector('.muted');
  const peakTxt=`${mname(months[peakI])} was the busiest month here, at ${loc.idx[peakI]}% of this area’s monthly average. ${mname(months[lowI])} was the quietest, at ${loc.idx[lowI]}%.`;
  const cmp=cty?` County-wide, ${mname(months[peakI])} sat at ${cty.idx[peakI]}% of the county average.`:'';
  if(sum)sum.textContent=peakTxt+cmp;
  chartTheme();
  const ds=[{label:'This area',data:loc.idx,borderColor:css('--teal'),backgroundColor:'transparent',tension:.25,pointRadius:3,borderWidth:2}];
  if(cty) ds.push({label:'County',data:cty.idx,borderColor:css('--muted'),backgroundColor:'transparent',tension:.25,pointRadius:3,borderWidth:2,borderDash:[5,4]});
  charts.push(new Chart(el,{type:'line',data:{labels:months.map(mname),datasets:ds},options:{animation:reduce?false:undefined,maintainAspectRatio:false,plugins:{legend:{display:!!cty}},scales:{y:{title:{display:true,text:'% of monthly average'},grace:'8%'},x:{ticks:{maxRotation:0}}}}}));
}

function typeCompareMarkup(){return `<div class="card"><div class="row"><h3>Types against the county mix</h3>${tipI('Share of recorded crimes in this area compared with the county-wide mix over the same type categories. This is a mix, not a rate: a higher share of shoplifting does not mean a higher rate per resident.')}</div>
  <p class="muted" id="tcmp-sum"></p>
  <div style="height:280px"><canvas id="tcmp" aria-label="Crime type mix compared with the county"></canvas></div></div>`}

function drawTypeCompare(el, byType, total){
  if(!el)return;
  const cty=S.overview.byType, ctot=S.overview.total||1, t=total||1;
  const rows=S.categories.map(c=>({id:c.id,name:c.name,loc:((byType[c.id]||0)/t*100),cty:((cty[c.id]||0)/ctot*100)})).filter(r=>r.loc>0||r.cty>0).sort((a,b)=>b.loc-a.loc);
  const gap=rows.map(r=>({...r,diff:r.loc-r.cty})).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff))[0];
  const sum=$('#tcmp-sum');
  if(sum&&gap){const win=typeof getW==='function'&&getW()!==12?' Figures here use the shorter time window; the county mix is the latest 12 months.':'';sum.textContent=(Math.abs(gap.diff)<0.5?'The mix of crime types here is close to the county mix.':`${gap.name} makes up ${gap.loc.toFixed(1)}% of recorded crimes here, against ${gap.cty.toFixed(1)}% county-wide.`)+win}
  chartTheme();
  charts.push(new Chart(el,{type:'bar',data:{labels:rows.map(r=>r.name),datasets:[{label:'This area %',data:rows.map(r=>+r.loc.toFixed(1)),backgroundColor:css('--teal')},{label:'County %',data:rows.map(r=>+r.cty.toFixed(1)),backgroundColor:css('--muted')}]},options:{indexAxis:'y',animation:reduce?false:undefined,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{x:{title:{display:true,text:'Share of recorded crimes (%)'},beginAtZero:true}}}}));
}

function outcomeFunnel(oc){
  const t=oc.reduce((a,b)=>a+b,0); if(!t)return '';
  const asb=oc[6]||0, non=t-asb, pos=(oc[0]||0)+(oc[1]||0);
  const steps=[
    {l:'Recorded crimes',n:t,w:100,tip:'All recorded crimes in this view, including anti-social behaviour.'},
    {l:'Crimes with an outcome category (not ASB)',n:non,w:t?non/t*100:0,tip:'Anti-social behaviour is published without a formal outcome, so it is set aside here.'},
    {l:'Charged, summonsed or out-of-court resolution',n:pos,w:t?pos/t*100:0,tip:'The same resolved group used in the solve rate. Recent crimes may still be under investigation.'},
  ];
  const exits=[
    {l:S.outcomeBuckets[0],n:oc[0],c:'#0f766e'},
    {l:S.outcomeBuckets[1],n:oc[1],c:'#14b8a6'},
    {l:S.outcomeBuckets[2],n:oc[2],c:'#94a3b8'},
    {l:S.outcomeBuckets[3],n:oc[3],c:'#f59e0b'},
    {l:S.outcomeBuckets[4],n:oc[4],c:'#6366f1'},
    {l:S.outcomeBuckets[5],n:oc[5],c:'#a855f7'},
    {l:S.outcomeBuckets[6],n:oc[6],c:'#cbd5e1'},
  ];
  return `<div class="card"><div class="row"><h3>What happens after a report</h3>${tipI('A simple funnel from all recorded crimes to the share that were charged or resolved, then a breakdown of the latest recorded outcome. This is the latest published outcome, not a courtroom result, and newer months still have many cases under investigation.')}</div>
  <div class="funnel" role="list">${steps.map(s=>`<div class="funnel-step" role="listitem" style="--w:${Math.max(28,s.w).toFixed(1)}%"><span>${esc(s.l)}</span><b>${fmt(s.n)} <small>${(s.n/t*100).toFixed(0)}%</small></b></div>`).join('')}</div>
  <ul class="funnel-exits">${exits.filter(e=>e.n).map(e=>`<li><i style="background:${e.c}"></i><span>${esc(e.l)}</span><b>${fmt(e.n)}</b><span class="muted">${(e.n/t*100).toFixed(0)}%</span></li>`).join('')}</ul>
  <p class="muted">Percentages are of all recorded crimes in this view, including ASB.</p></div>`;
}

function spotName(s){return typeof s==='object'&&!Array.isArray(s)?s.name:s[3]}
function spotN(s){return typeof s==='object'&&!Array.isArray(s)?s.n:s[2]}
function spotType(s){if(typeof s==='object'&&!Array.isArray(s))return cn(s.type||s.top||'');return cn(S.categories[s[4]]&&S.categories[s[4]].id)}
function spotLat(s){return typeof s==='object'&&!Array.isArray(s)?s.lat:s[0]}
function spotLon(s){return typeof s==='object'&&!Array.isArray(s)?s.lon:s[1]}

function hotspotCard(spots, opts){
  opts=opts||{};
  if(!spots||!spots.length)return `<div class="card" id="hotspots"><p class="muted">No location list is available for this view.</p></div>`;
  const rows=spots.slice(0,opts.limit||10);
  return `<div class="card" id="hotspots"><div class="row"><h3>${opts.title||'Most recorded locations'}</h3><span class="ctl">${csvBtn(opts.csvId||'hotspots',[['Location','Crimes','Most common type'],...rows.map(s=>[spotName(s),spotN(s),spotType(s)])],'the most recorded locations')}${tipI('Police anonymise each crime to a nearby street or landmark. A name is that snap point, not the exact address of an offence. Two rows can share a name when the force uses the same label at different points (for example two parking areas).')}</span></div>
  <ol class="hotlist">${rows.map((s,i)=>`<li>${opts.clickable?`<button type="button" class="tlink hot-go" data-lat="${spotLat(s)}" data-lon="${spotLon(s)}">${esc(spotName(s))}</button>`:`<b>${esc(spotName(s))}</b>`}<span class="muted">${esc(spotType(s))}${s.d!=null?` · ${s.d.toFixed(2)} mi`:''} · ${svLink(spotLat(s),spotLon(s),{approx:true})}</span><b class="n">${fmt(spotN(s))}</b></li>`).join('')}</ol>
  <p class="muted">${opts.note||'Counts are recorded crimes at each published snap point over the latest 12 months.'}</p></div>`;
}

/* Provisional mid-year STATS19 (unvalidated). Returns null when the file is not published or has no usable rows. */
function provNear(C,la,lo,rMi){
  const pv=C&&C.prov; if(!pv||!pv.points||!pv.meta) return null;
  const mx=(pv.meta.months||[1,6])[1], py=pv.meta.compareYear;
  const pts=pv.points.filter(p=>hav(la,lo,p[0],p[1])<=rMi);
  const prev=(C.points||[]).filter(p=>p[3]===py&&p[6]>=1&&p[6]<=mx&&hav(la,lo,p[0],p[1])<=rMi);
  return {n:pts.length,fatal:pts.filter(p=>p[2]===1).length,serious:pts.filter(p=>p[2]===2).length,cas:pts.reduce((s,p)=>s+(p[3]||0),0),prevN:prev.length,prevFatal:prev.filter(p=>p[2]===1).length,pts};
}
function provRowFor(C,a,isAll){
  const pv=C&&C.prov; if(!pv||!pv.meta) return null;
  return isAll?pv.overview:((pv.districts||[]).find(d=>d.code===(a&&a.code)||d.name===(a&&a.name))||null);
}
function provText(r,C,lead){
  const pv=C&&C.prov; if(!r||!pv||!pv.meta||r.n==null) return '';
  const lab=pv.meta.label, py=pv.meta.compareYear;
  let s=`${lead?'Provisional figures for ':''}${lab}: ${fmt(r.n)} injury collisions (${fmt(r.fatal)} fatal, ${fmt(r.serious)} serious)${r.cas!=null?`, ${fmt(r.cas)} casualties`:''}. For the same months of ${py} (final data) there were ${fmt(r.prevN)}.`;
  s+=` The ${pv.meta.year} figures are unvalidated and can still change`+(r.n+r.prevN<40?', and counts this small move around a lot from one period to the next':'')+'.';
  return s;
}
/* ---------- What changed this month: latest published month against the one before ---------- */
const pctChg=(n,o)=>o?Math.round((n-o)/o*100):null;
const chgWord=d=>d>0?'more':d<0?'fewer':'the same number';
function changeFactsNear(nearAll){
  const li=S.months.length-1; if(li<1||!nearAll||!nearAll.length) return null;
  const last=nearAll.filter(p=>p[3]===li), prev=nearAll.filter(p=>p[3]===li-1), older=nearAll.filter(p=>p[3]<li);
  const cnt=a=>{const o={};a.forEach(p=>{o[p[2]]=(o[p[2]]||0)+1});return o};
  const x=cnt(last), y=cnt(prev);
  const moves=[...new Set([...Object.keys(x),...Object.keys(y)])].map(id=>({id:+id,now:x[id]||0,was:y[id]||0,d:(x[id]||0)-(y[id]||0)})).filter(m=>Math.max(m.now,m.was)>=5&&m.d!==0);
  return {m:S.months[li],pm:S.months[li-1],n:last.length,pn:prev.length,avg:older.length/li,
    rises:moves.filter(m=>m.d>0).sort((a,b)=>b.d-a.d).slice(0,3),falls:moves.filter(m=>m.d<0).sort((a,b)=>a.d-b.d).slice(0,3)};
}
function changeFactsArea(a){
  const ms=S.months, all=S.monthsAll||ms, li=ms.length-1;
  if(!a||!a.monthly||li<1) return null;
  const m=ms[li], pm=ms[li-1], ya=all.length>=13?all[all.length-13]:null;
  const n=a.monthly[m], pn=a.monthly[pm], yn=ya?a.monthly[ya]:null;
  if(n==null||pn==null) return null;
  return {m,pm,ya,n,pn,yn};
}
function changeNearParas(f,cats,where){
  if(!f) return [];
  const out=[], d=f.n-f.pn, pc=pctChg(f.n,f.pn);
  out.push(`In ${mname(f.m)}, the latest month published, ${fmt(f.n)} crimes were recorded ${where}. That is ${d===0?'the same as':`${fmt(Math.abs(d))} ${chgWord(d)} than`} the ${fmt(f.pn)} in ${mname(f.pm)}${pc!=null&&d!==0?` (${pc>0?'+':'−'}${Math.abs(pc)}%)`:''}, and compares with an average of about ${fmt(Math.round(f.avg))} a month over the earlier months in this 12-month window.`);
  if(f.n+f.pn<30) out.push('The numbers here are small, so a month-to-month difference is usually ordinary variation rather than a change worth reading into.');
  else if(f.rises.length||f.falls.length){
    const fmtM=m=>`${esc(cn(cats[m.id]))} (${m.d>0?'+':'−'}${Math.abs(m.d)})`;
    const bits=[];
    if(f.rises.length) bits.push(`the biggest rises were ${joinAnd(f.rises.map(fmtM))}`);
    if(f.falls.length) bits.push(`the biggest falls were ${joinAnd(f.falls.map(fmtM))}`);
    out.push(`By type, ${bits.join('; ')}. Only types with at least 5 crimes in one of the two months are compared.`);
  }
  out.push('Month-to-month changes are partly seasonal, and the latest month can still be topped up by police. This is not a trend and not a safety score.');
  return out;
}
function changeAreaParas(f,where){
  if(!f) return [];
  const d=f.n-f.pn, pc=pctChg(f.n,f.pn), out=[];
  let s=`In ${mname(f.m)}, the latest month published, ${fmt(f.n)} crimes were recorded ${where}. That is ${d===0?'the same as':`${pc!=null?Math.abs(pc)+'% '+(d>0?'higher':'lower')+' than'  :'different from'}`} ${mname(f.pm)} (${fmt(f.pn)})`;
  if(f.yn!=null&&f.yn>0){const y=pctChg(f.n,f.yn); s+=y===0?`, and about the same as ${mname(f.ya)}, the same month a year earlier (${fmt(f.yn)})`:`, and ${Math.abs(y)}% ${y>0?'higher':'lower'} than ${mname(f.ya)}, the same month a year earlier (${fmt(f.yn)})`}
  out.push(s+'.');
  out.push('The same-month comparison is the fairer one, because crime has a seasonal pattern. The latest month can still be topped up by police, so treat small differences as ordinary variation.');
  return out;
}
function changedCardNear(nearAll,cats,rLab){
  const f=changeFactsNear(nearAll); if(!f) return '';
  const d=f.n-f.pn, pc=pctChg(f.n,f.pn);
  const mv=(list,sign)=>list.length?`<ul class="chg-list">${list.map(m=>`<li><b>${esc(cn(cats[m.id]))}</b> <span class="muted">${m.was} → ${m.now}</span> <span class="chg ${sign}">${sign==='up'?'+':'−'}${Math.abs(m.d)}</span></li>`).join('')}</ul>`:'<p class="muted">None big enough to compare.</p>';
  const small=f.n+f.pn<30;
  return `<div class="card" id="changed"><div class="row"><h3>What changed in ${mname(f.m)}</h3>${tipI('The latest published month against the month before, for crimes whose anonymised pin is within the chosen radius. Month-to-month changes are partly seasonal and small counts vary a lot. Not a trend and not a safety score.')}</div>
  <div class="mini">${kpi('shield','Latest month',fmt(f.n),mname(f.m),'Recorded crimes in the latest published month within the radius.')}${kpi('shield','Month before',fmt(f.pn),mname(f.pm),'Recorded crimes in the previous month within the radius.')}${kpi('chart','Change',d===0?'0':(d>0?'+':'−')+fmt(Math.abs(d)),pc!=null&&d!==0?(pc>0?'+':'−')+Math.abs(pc)+'% on '+mname(f.pm):'no change','Difference between the two months.')}${kpi('people','Usual month',fmt(Math.round(f.avg)),'average of the other months','Average monthly count over the earlier months in this 12-month window.')}</div>
  ${small?'<p class="muted">The numbers within '+rLab+' are small, so a month-to-month difference is usually ordinary variation.</p>':`<div class="grid2 chg-grid"><div><h4>Rose most</h4>${mv(f.rises,'up')}</div><div><h4>Fell most</h4>${mv(f.falls,'down')}</div></div>`}
  <p class="muted">Counts within ${rLab} of the postcode. Only crime types with at least 5 crimes in one of the two months are compared. The latest month can still be topped up by police.</p></div>`;
}
function changedCardArea(a,isAll){
  const f=changeFactsArea(a); if(!f) return '';
  const d=f.n-f.pn, pc=pctChg(f.n,f.pn), yc=f.yn?pctChg(f.n,f.yn):null;
  return `<div class="card" id="changed"><div class="row"><h3>What changed in ${mname(f.m)}</h3>${tipI('The latest published month against the month before and the same month a year earlier. Crime has a seasonal pattern, so the same-month comparison is the fairer one. Not a trend and not a safety score.')}</div>
  <div class="mini">${kpi('shield','Latest month',fmt(f.n),mname(f.m),'Recorded crimes in the latest published month.')}${kpi('chart','On '+mname(f.pm),pc==null?'–':pc===0?'about the same':(pc>0?'+':'−')+Math.abs(pc)+'%',fmt(f.pn)+' then','Change on the month before.')}${f.yn!=null&&f.yn>0?kpi('chart','On '+mname(f.ya),yc==null?'–':yc===0?'about the same':(yc>0?'+':'−')+Math.abs(yc)+'%',fmt(f.yn)+' then','Change on the same month a year earlier, the fairer comparison.'):''}</div>
  <p class="muted">${isAll?'Across Cambridgeshire and Peterborough':'In '+esc(a.name)}. The latest month can still be topped up by police. Type-level monthly changes are shown on postcode pages.</p></div>`;
}

function collisionSummary(row, C, opts){
  opts=opts||{};
  if(!row)return '';
  const years=(C.meta&&C.meta.years||[]).join(' and ');
  return `<div class="card" id="roads"><div class="row"><h3>${opts.title||'Injury collisions on the roads'}</h3>${tipI('Personal-injury collisions on public roads reported to the police and recorded on the Department for Transport STATS19 system. Damage-only bumps are not included. These are calendar years, not the monthly crime window. Severity is as recorded.')}</div>
  <div class="mini">${kpi('alert','Injury collisions',fmt(row.n),years,'Total recorded injury collisions in this area over the published calendar years.')}
  ${kpi('alert','Fatal',fmt(row.fatal||0),'as recorded','Collisions in which a fatality was recorded.')}
  ${kpi('car','Serious',fmt(row.serious||0),'as recorded','Serious-injury collisions, as recorded by the police. Reporting practice can affect the serious/slight split.')}
  ${kpi('people','Casualties',fmt(row.cas||0),'people injured or killed','People killed or injured in those collisions, not the number of collisions.')}</div>
  ${opts.prov&&opts.prov.n!=null?`<p class="prov-note"><span class="badge neu">Provisional</span> ${esc(provText(opts.prov,C))}</p>`:''}
  <p class="muted">Source: Department for Transport Road Safety Data (STATS19), Open Government Licence v3.0. ${opts.extra||''}</p></div>`;
}

function sevColor(s){return s===1?'#9f1239':s===2?'#c2410c':'#64748b'}
function sevName(s){return s===1?'Fatal':s===2?'Serious':'Slight'}

async function fillHomeExtras(a,isAll){
  let X=null;
  try{X=await lj('home_extras')}catch{}
  try{
    const H=(X&&X.hotspots)||await lj('hotspots');
    const host=$('#hotspots');
    if(host){
      const spots=isAll?(H.spots||[]).slice(0,10):((H.districts.find(d=>d.code===a.code)||{}).spots||[]);
      host.outerHTML=hotspotCard(spots,{title:isAll?'Most recorded locations in the county':'Most recorded locations in '+a.name,csvId:'homehot'});
    }
  }catch{const h=$('#hotspots'); if(h)h.innerHTML='<p class="muted">The location list could not be loaded just now.</p>'}
  try{
    const C=(X&&X.collisions)||await lj('collisions');
    const host=$('#roads');
    if(host){
      const row=isAll?C.overview:(C.districts.find(d=>d.code===a.code)||C.overview);
      const html=collisionSummary(row,C,{title:isAll?'Injury collisions across the county':'Injury collisions in '+a.name,prov:provRowFor(C,a,isAll),extra:isAll?'':'Figures are for the local authority district, not a postcode radius.'});
      host.outerHTML=html+(row?explain('The main figures are personal-injury collisions reported to the police in calendar years 2024 and 2025 (final data), not the same window as the crime figures. Any provisional 2026 figures are shown separately and are unvalidated. Damage-only bumps are not included.'):'');
    }
  }catch{const h=$('#roads'); if(h)h.innerHTML='<p class="muted">Road collision figures could not be loaded just now.</p>'}
}

const explain=t=>`<p class="explain">${t}</p>`;
function topBand(row){
  if(!row||!row.ct||!row.ctN)return null;
  const letters='ABCDEFGH';
  let i=0; for(let k=1;k<row.ct.length;k++) if(row.ct[k]>(row.ct[i]||0)) i=k;
  return {band:letters[i]||'?',n:row.ct[i]||0,p:row.ctN?Math.round(row.ct[i]/row.ctN*100):null};
}
function contextCard(row,title){
  if(!row)return '';
  const tb=topBand(row);
  const age=row.age||[];
  const tenure=[row.owned!=null?`${row.owned}% owned their home`:'', row.social!=null?`${row.social}% rented socially`:'', row.priv!=null?`${row.priv}% rented privately or lived rent-free`:''].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const ageTxt=age.length?` ${age[4]}% of residents were aged 65 or over and ${age[0]}% were under 15.`:''
  const ctTxt=tb&&row.ctN?` On the council tax list at 31 March 2026, ${fmt(row.ctN)} domestic properties were recorded in this area. The most common band was ${tb.band}${tb.p!=null?' ('+tb.p+'%)':''}.`:'';
  return `<div class="card context-card"><div class="row"><h3>${title||'Households and council tax'}</h3>${tipI('Census 2021 tenure and age, plus Valuation Office council tax stock at 31 March 2026. This is background about the neighbourhood, not a judgement or a safety score. Census figures are from 2021 and will have changed. Council tax bands in England rest on 1991 values.')}</div>
  <p>${row.hh?fmt(row.hh)+' households at Census 2021: ':''}${tenure?tenure+'.':''}${ageTxt}${ctTxt}</p>
  <p class="muted">Shown as context only. Census 2021 (ONS, via Nomis) and VOA council tax stock, OGL. <a href="method.html">How to read this site</a>.</p></div>`;
}
function distToSegMi(la,lo,aLat,aLon,bLat,bLon){
  // Equirectangular, in miles; distance from a point to the straight segment A–B.
  const kx=69.17*Math.cos(((aLat+bLat)/2)*Math.PI/180), ky=69.17;
  const ax=aLon*kx, ay=aLat*ky, bx=bLon*kx, by=bLat*ky, px=lo*kx, py=la*ky;
  const vx=bx-ax, vy=by-ay, l2=vx*vx+vy*vy;
  const t=l2?Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/l2)):0;
  const dx=px-(ax+t*vx), dy=py-(ay+t*vy);
  return Math.sqrt(dx*dx+dy*dy);
}



function countyContext(CX){
  const ds=Object.values((CX&&CX.districts)||{});
  if(!ds.length)return null;
  const hh=ds.reduce((s,d)=>s+(d.hh||0),0), pop=ds.reduce((s,d)=>s+(d.pop21||0),0);
  const wavg=k=>hh?Math.round(ds.reduce((s,d)=>s+(d[k]||0)*(d.hh||0),0)/hh*10)/10:null;
  const age=[0,0,0,0,0]; ds.forEach(d=>{if(d.age&&d.pop21)d.age.forEach((v,i)=>age[i]+=v*d.pop21)});
  const ct=[0,0,0,0,0,0,0,0]; let ctN=0;
  ds.forEach(d=>{if(d.ct)d.ct.forEach((v,i)=>ct[i]+=v); ctN+=d.ctN||0});
  return {hh,owned:wavg('owned'),social:wavg('social'),priv:wavg('priv'),pop21:pop,age:age.map(v=>pop?Math.round(v/pop*10)/10:0),ct,ctN};
}
async function fillContextHost(dist,isAll,lsoaCode){
  const hosts=[...document.querySelectorAll('#ctxhost')];
  if(!hosts.length)return;
  try{
    const CX=await lj('context');
    let row=null, title='Households and council tax';
    if(lsoaCode&&CX.lsoa&&CX.lsoa[lsoaCode]){row=CX.lsoa[lsoaCode]; title='Households and council tax in this neighbourhood'}
    else if(isAll){row=countyContext(CX); title='Households and council tax across the county'}
    else if(dist&&CX.districts&&CX.districts[dist.code]){row=CX.districts[dist.code]; title='Households and council tax in '+dist.name}
    let html=contextCard(row,title);
    if(html&&(isAll||(dist&&!lsoaCode))) html=`<section class="sec context-sec"><h2 class="sr-only">${title||'Households and council tax'}</h2>${html}</section>`;
    hosts.forEach(h=>{if(html)h.outerHTML=html; else h.innerHTML=''});
  }catch{hosts.forEach(h=>h.innerHTML='')}
}
async function loadPointsCorridor(aLat,aLon,bLat,bLon,bandMi){
  const meta=await lj('tiles/meta').catch(()=>null);
  const pad=bandMi/69+0.02;
  const minLa=Math.min(aLat,bLat)-pad, maxLa=Math.max(aLat,bLat)+pad;
  const minLo=Math.min(aLon,bLon)-pad, maxLo=Math.max(aLon,bLon)+pad;
  let pts;
  if(!meta||!meta.cell){
    const PP=await lj('points');
    pts=PP.filter(p=>p[0]>=minLa&&p[0]<=maxLa&&p[1]>=minLo&&p[1]<=maxLo);
  }else{
    const cell=meta.cell;
    const i0=Math.floor(minLa/cell), i1=Math.floor(maxLa/cell);
    const j0=Math.floor(minLo/cell), j1=Math.floor(maxLo/cell);
    const want=new Set();
    for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++) want.add(i+'_'+j);
    const files=[...want].filter(k=>meta.tiles.some(([ti,tj])=>ti+'_'+tj===k));
    const chunks=await Promise.all(files.map(k=>fetch('data/tiles/'+k+'.json').then(r=>r.ok?r.json():[]).catch(()=>[])));
    pts=[]; for(const arr of chunks) for(const p of arr) pts.push(p);
  }
  return pts.filter(p=>distToSegMi(p[0],p[1],aLat,aLon,bLat,bLon)<=bandMi);
}
const _cmp={};
async function maybeCorridor(){
  const host=$('#corridor'); if(!host)return;
  const A=_cmp.a, B=_cmp.b;
  if(!A||!B){host.innerHTML='';return}
  const d=hav(A.la,A.lo,B.la,B.lo);
  host.innerHTML='<div class="card"><p class="muted">Counting recorded crimes along the straight line between the two postcodes…</p></div>';
  try{
    const w=getW(), band=0.1553;
    const pts=(await loadPointsCorridor(A.la,A.lo,B.la,B.lo,band)).filter(p=>inWindow(p,w));
    if(_cmp.a!==A||_cmp.b!==B)return;
    const cats=S.categories.map(c=>c.id), by={};
    pts.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1});
    const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5);
    host.innerHTML=`<div class="card" id="corridorcard"><div class="row"><h2>Along the line between ${esc(A.postcode)} and ${esc(B.postcode)}</h2>${tipI('A count of recorded crimes whose anonymised pin falls within 250 metres of the straight line between the two postcode centroids. This is not a driving, walking or public-transport route, and it is not a commute time.')}</div>
    <div class="ms"><div>Straight-line distance<b>${d.toFixed(1)} mi</b></div><div>Crimes within 250m of the line<b>${fmt(pts.length)}</b></div><div>Time window<b>${esc(wLabel(w))}</b></div></div>
    ${top.length?`<p>Most common along the line: ${top.map(([k,n])=>esc(cn(k))+' ('+fmt(n)+')').join(', ')}.</p>`:''}
    <p class="muted">This is a corridor around a straight line, not a recommended route. Pins are snapped to a public location, so the count is not a street-by-street tally.</p></div>`;
  }catch{if($('#corridor')===host) host.innerHTML='<div class="card"><p class="muted">The line comparison could not be loaded just now.</p></div>'}
}

async function loadNearHotspots(la,lo,rMi,el){
  if(!el)return null;
  try{
    const H=await lj('hotspots');
    const spots=H.spots.map(s=>{const d=hav(la,lo,s[0],s[1]);return d<=rMi?Object.assign([...s],{d}):null}).filter(Boolean).sort((a,b)=>b[2]-a[2]);
    el.outerHTML=hotspotCard(spots,{title:'Most recorded locations within the radius',clickable:true,csvId:'nearhot',note:'Within the chosen radius, over the latest 12 months. The time-window control on the dashboard does not change this list, because snap-point totals are built from the full 12-month file.',limit:12});
    document.querySelectorAll('.hot-go').forEach(b=>b.onclick=()=>{
      const lat=+b.dataset.lat,lon=+b.dataset.lon;
      if(is3d()&&m3)m3.flyTo({center:[lon,lat],zoom:16,duration:reduce?0:800});
      else if(map){map.setView([lat,lon],16); L.popup().setLatLng([lat,lon]).setContent('<b>'+esc(b.textContent)+'</b>').openOn(map)}
    });
    return spots;
  }catch{el.innerHTML='<p class="muted">The location list could not be loaded just now.</p>';return null}
}

async function loadNearCollisions(la,lo,rMi,el){
  if(!el)return null;
  try{
    const C=await lj('collisions');
    const near=C.points.filter(p=>hav(la,lo,p[0],p[1])<=rMi);
    const row={n:near.length,fatal:near.filter(p=>p[2]===1).length,serious:near.filter(p=>p[2]===2).length,slight:near.filter(p=>p[2]===3).length,cas:near.reduce((s,p)=>s+p[4],0)};
    el.outerHTML=collisionSummary(row,C,{title:'Injury collisions within '+ (rMi===0.5?'½':rMi) +' mile'+(rMi===1?'':'s'),extra:'These points can be shown on the map with the Collisions layer. They are not police crime snap points.'});
    return near;
  }catch{el.innerHTML='<p class="muted">Road collision figures could not be loaded just now.</p>';return null}
}

function downloadCard(info){
  const W=1200,H=630,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const dark=document.documentElement.dataset.theme==='dark';
  const bg=dark?'#0b1220':'#14213d', ink='#e7edf5', muted='#a3b1c2', teal='#5eead4', amber='#f59e0b';
  x.fillStyle=bg;x.fillRect(0,0,W,H);
  // soft glows
  const g=x.createRadialGradient(1000, -40, 20, 1000, -40, 520);g.addColorStop(0,'#14b8a655');g.addColorStop(1,'#0000');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle=teal;x.font='bold 28px Inter,system-ui,sans-serif';x.fillText('StreetLens',48,70);
  x.fillStyle=muted;x.font='20px Inter,system-ui,sans-serif';x.fillText('Cambridgeshire & Peterborough',220,70);
  x.fillStyle='#fff';x.font='bold 64px Inter,system-ui,sans-serif';x.fillText(info.title,48,160);
  x.fillStyle=muted;x.font='24px Inter,system-ui,sans-serif';x.fillText(info.where||'',48,200);
  const cols=info.rows||[], cw=(W-96)/Math.max(cols.length,1);
  cols.forEach((r,i)=>{
    const ox=48+i*cw, oy=260;
    x.fillStyle='#ffffff14'; roundRect(x,ox,oy,cw-16,180,16);x.fill();
    x.fillStyle=muted;x.font='600 18px Inter,system-ui,sans-serif';x.fillText(r.lab,ox+20,oy+40);
    x.fillStyle='#fff';x.font='bold 44px Inter,system-ui,sans-serif';x.fillText(String(r.val),ox+20,oy+100);
    if(r.sub){x.fillStyle=teal;x.font='20px Inter,system-ui,sans-serif';x.fillText(String(r.sub),ox+20,oy+140)}
  });
  x.fillStyle=amber;x.fillRect(48,H-86,80,4);
  x.fillStyle=muted;x.font='16px Inter,system-ui,sans-serif';
  const caveat=info.caveat||'Police anonymise locations and rates use resident population, so town centres look higher. Not a safety score.';
  wrapText(x,caveat+'  ·  Independent prototype, not a police service.  ·  streetlens',48,H-56,W-96,22);
  c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='streetlens-'+(info.file||'summary')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2500)},'image/png');
}
function roundRect(x,x0,y0,w,h,r){x.beginPath();x.moveTo(x0+r,y0);x.arcTo(x0+w,y0,x0+w,y0+h,r);x.arcTo(x0+w,y0+h,x0,y0+h,r);x.arcTo(x0,y0+h,x0,y0,r);x.arcTo(x0,y0,x0+w,y0,r);x.closePath()}
function wrapText(x,text,x0,y,max,lh){const words=text.split(' ');let line='',yy=y;for(const w of words){const t=line+w+' ';if(x.measureText(t).width>max&&line){x.fillText(line,x0,yy);line=w+' ';yy+=lh}else line=t}if(line)x.fillText(line,x0,yy)}

function cardBtn(id){return `<button class="btn ghost" id="${id}" type="button" aria-label="Download a PNG summary card" data-tip="Download a PNG summary card you can share or save. It is a snapshot of the figures on screen, not an official certificate.">${ic('image',18)}<span class="sl">Card</span></button>`}

function leagueView(){
  setMeta('District and neighbourhood league — StreetLens','Sortable recorded-crime rates for Cambridgeshire & Peterborough districts and neighbourhoods (LSOAs). The neighbourhood rank is not a safety score.',location.origin+location.pathname+'?view=league');
  const dists=[...S.districts].sort((a,b)=>b.rate-a.rate);
  app.innerHTML=`<div class="wrap league"><section class="sec"><div class="sec-h"><div><h1>District and neighbourhood league</h1><p>Recorded crime rates for the six districts and for neighbourhoods (LSOAs) across Cambridgeshire &amp; Peterborough. Sort any column. This is a rank, not a safety score — town centres look higher because rates use resident population.</p></div>
  ${cardBtn('leaguecard')}</div>
  <div class="card"><div class="row"><h2>Districts</h2><span class="ctl">${csvBtn('leaguedist',[['District','Crimes','Population','Per 1,000','Solve rate %','YoY %'],...dists.map(d=>[d.name,d.total,d.population,d.rate,solveOf(d).toFixed(1),d.yoy==null?'':d.yoy])],'the district league')}</span></div>
  <div style="overflow-x:auto"><table class="sortable" id="ldist"><thead><tr>${[['name','District',0],['total','Crimes',1],['population','Residents',1],['rate','Per 1,000',1],['solve','Solved',1],['yoy','YoY',1]].map(([k,l,n],i)=>`<th class="${n?'n':''}" aria-sort="${k==='rate'?'descending':'none'}"><button type="button" data-k="${k}" data-n="${n}">${l}</button></th>`).join('')}</tr></thead>
  <tbody>${dists.map((d,i)=>`<tr data-name="${esc(d.name)}" data-total="${d.total}" data-population="${d.population}" data-rate="${d.rate}" data-solve="${solveOf(d).toFixed(1)}" data-yoy="${d.yoy==null?'':d.yoy}">
   <td><a class="tlink" href="?${dq(d)}" data-q="${dq(d)}">${esc(d.name)}</a></td><td class="n">${fmt(d.total)}</td><td class="n">${fmt(d.population)}</td><td class="n">${d.rate}</td><td class="n">${solveOf(d).toFixed(1)}%</td><td class="n">${d.yoy==null?'–':`<span class="yoy ${d.yoy>0?'up':d.yoy<0?'down':''}">${d.yoy>0?'+':''}${d.yoy}%</span>`}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="card" style="margin-top:18px"><div class="row"><h2>Neighbourhoods (LSOAs)</h2><span class="ctl"><label class="sr-only" for="lq">Filter neighbourhoods</label><input id="lq" type="search" placeholder="Filter by name or district" aria-controls="lsoa-status" style="min-height:44px;border:1px solid var(--line);border-radius:10px;padding:0 12px;font:inherit;background:var(--card);color:var(--ink);min-width:min(260px,100%)"></span></div>
  <p class="muted" id="lsoa-status" aria-live="polite">Loading neighbourhood rates…</p>
  <div style="overflow-x:auto"><table class="sortable" id="llsoa"><thead><tr>${[['name','Neighbourhood',0],['la','District',0],['n','Crimes',1],['pop','Residents',1],['rate','Per 1,000',1],['pct','Lower than %',1],['band','Band',0]].map(([k,l,n])=>`<th class="${n?'n':''}" aria-sort="${k==='rate'?'descending':'none'}"><button type="button" data-k="${k}" data-n="${n}">${l}</button></th>`).join('')}<th>Trend</th></tr></thead><tbody></tbody></table></div>
  <p class="muted">Approximate LSOA rates: each published crime is assigned to the nearest 2021 LSOA centroid. “Lower than %” is the share of local neighbourhoods with a higher approximate rate. It is not a safety score. The trend sparkline shows how assigned counts moved over the latest 12 months; it is a shape, not a second official total, and is not sortable. <a href="method.html">How to read this site</a>.</p></div>
  </section></div>`;
  wireSort($('#ldist'));
  $('#leaguecard').onclick=()=>downloadCard({title:'Cambridgeshire & Peterborough',where:`District league · ${mname(S.months[0])} – ${mname(S.months.at(-1))}`,file:'league',rows:dists.slice(0,4).map(d=>({lab:d.name,val:d.rate,sub:'per 1,000'})),caveat:'Rates use resident population, so town centres look higher. Neighbourhood ranks on this site are not a safety score.'});
  (async()=>{
    try{
      const lr=await lj('lsoa_rates');
      const rows=Object.entries(lr.lsoa).map(([id,v])=>({id,...v})).sort((a,b)=>b.rate-a.rate);
      const tb=$('#llsoa tbody'), st=$('#lsoa-status');
      const draw=list=>{tb.innerHTML=list.slice(0,516).map(r=>`<tr data-name="${esc(r.name||r.id)}" data-la="${esc(r.la||'')}" data-n="${r.n}" data-pop="${r.pop}" data-rate="${r.rate}" data-pct="${r.pct??''}" data-band="${esc(r.band||'')}">
        <td>${esc(r.name||r.id)}</td><td>${esc(r.la||'')}</td><td class="n">${fmt(r.n)}</td><td class="n">${fmt(r.pop)}</td><td class="n">${r.rate}</td><td class="n">${r.pct==null?'–':r.pct}</td><td><span class="badge ${r.band==='Low'?'good':r.band==='High'?'bad':'neu'}">${esc(r.band||'')}</span></td><td class="sparktd">${r.mv&&r.mv.length?spark(r.mv):'–'}</td></tr>`).join('');
        st.textContent=list.length+' neighbourhoods shown. Approximate rates, not official police LSOA statistics. The trend line is a month-by-month shape from the same nearest-centroid assignment and is not used for sorting.';};
      draw(rows); wireSort($('#llsoa'));
      const inp=$('#lq');
      inp.addEventListener('input',()=>{const q=inp.value.trim().toLowerCase();const list=!q?rows:rows.filter(r=>(r.name||'').toLowerCase().includes(q)||(r.la||'').toLowerCase().includes(q)||(r.id||'').toLowerCase().includes(q));draw(list);wireSort($('#llsoa'))});
    }catch{const st=$('#lsoa-status');if(st)st.textContent='Neighbourhood rates could not be loaded just now.'}
  })();
}

function wireSort(table){
  if(!table)return;
  table.querySelectorAll('th button').forEach(btn=>{
    btn.onclick=()=>{
      const k=btn.dataset.k, num=btn.dataset.n==='1';
      const th=btn.parentElement, cur=th.getAttribute('aria-sort'), dir=cur==='descending'?'ascending':'descending';
      table.querySelectorAll('th').forEach(h=>h.setAttribute('aria-sort','none'));
      th.setAttribute('aria-sort',dir);
      const tb=table.tBodies[0], rows=[...tb.rows];
      rows.sort((a,b)=>{
        const av=a.dataset[k], bv=b.dataset[k];
        const an=num?parseFloat(av):String(av).toLowerCase(), bn=num?parseFloat(bv):String(bv).toLowerCase();
        const aN=an===''||an==null||Number.isNaN(an), bN=bn===''||bn==null||Number.isNaN(bn);
        if(aN&&bN)return 0; if(aN)return 1; if(bN)return -1;
        if(an<bn)return dir==='ascending'?-1:1; if(an>bn)return dir==='ascending'?1:-1; return 0;
      });
      rows.forEach(r=>tb.appendChild(r));
    };
  });
}


function killCharts(){if(typeof m3!=='undefined'&&m3){m3.remove();m3=null}charts.forEach(c=>c.destroy());charts=[]}
function chartTheme(){Chart.defaults.color=css('--muted');Chart.defaults.borderColor=css('--line');Chart.defaults.font.family='Inter,system-ui,sans-serif'}

function outcomeTrend(el, nearAll, months){
  months=months||S.months;
  const labels=months.map(mname), off=S.months.length-months.length;
  const charged=months.map(()=>0), nosus=months.map(()=>0), inv=months.map(()=>0), other=months.map(()=>0);
  nearAll.forEach(p=>{const m=p[3]-off,o=p[4]; if(m==null||m<0||m>=months.length)return;
    if(o===0||o===1)charged[m]++; else if(o===2)nosus[m]++; else if(o===4)inv[m]++; else if(o!==6)other[m]++;});
  chartTheme();
  charts.push(new Chart(el,{type:'line',data:{labels,datasets:[
    {label:'Charged / resolved',data:charged,borderColor:'#0f766e',backgroundColor:'#0f766e22',fill:false,tension:.3,pointRadius:2},
    {label:'No suspect',data:nosus,borderColor:'#94a3b8',backgroundColor:'#94a3b822',fill:false,tension:.3,pointRadius:2},
    {label:'Under investigation',data:inv,borderColor:'#6366f1',backgroundColor:'#6366f122',fill:false,tension:.3,pointRadius:2},
    {label:'Other closed',data:other,borderColor:'#f59e0b',backgroundColor:'#f59e0b22',fill:false,tension:.3,pointRadius:2}
  ]},options:{animation:reduce?false:{duration:400},maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
    plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}}},
    scales:{y:{beginAtZero:true,stacked:false}}}}));
  return {charged,nosus,inv,other}}
function typeTrend(el, nearAll, cats, months){
  months=months||S.months; const off=S.months.length-months.length;
  const totals={}; nearAll.forEach(p=>{const id=cats[p[2]]; totals[id]=(totals[id]||0)+1});
  const top=Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,4).map(e=>e[0]);
  if(!top.length)return;
  const cols=['#f59e0b','#0f766e','#e11d48','#6366f1'];
  const datasets=top.map((id,i)=>{
    const data=months.map(()=>0); nearAll.forEach(p=>{if(cats[p[2]]===id){const m=p[3]-off; if(m>=0&&m<data.length)data[m]++}});
    return {label:cn(id),data,borderColor:cols[i],backgroundColor:cols[i]+'22',fill:false,tension:.3,pointRadius:2}});
  chartTheme();
  charts.push(new Chart(el,{type:'line',data:{labels:months.map(mname),datasets},
    options:{animation:reduce?false:{duration:400},maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}}},scales:{y:{beginAtZero:true}}}}))}
function trend(el,monthly,label='Crimes',months){months=months||S.months;chartTheme();charts.push(new Chart(el,{type:'line',data:{labels:months.map(mname),datasets:[{label,data:months.map(m=>monthly[m]||0),borderColor:css('--teal'),backgroundColor:css('--teal')+'22',fill:true,tension:.35,pointRadius:months.length>12?2:3}]},options:{animation:reduce?false:{duration:500},maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}}))}
function trendAll(el,monthly,months,label='Crimes'){chartTheme();const labs=months.map(mname),data=months.map(m=>monthly[m]||0);charts.push(new Chart(el,{type:'line',data:{labels:labs,datasets:[{label,data,borderColor:css('--teal'),backgroundColor:css('--teal')+'22',fill:true,tension:.35,pointRadius:months.length>12?2:3}]},options:{animation:reduce?false:{duration:500},maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}}))}
function typeYoyCell(y){
  if(!y) return '<td class="n">–</td><td class="n">–</td>';
  if(y.yoy==null) return '<td class="n">'+fmt(y.prev)+'</td><td class="n"><span class="muted">–</span></td>';
  const cls=y.yoy>0?'up':y.yoy<0?'down':'';
  const lab=(y.yoy>0?'+':'')+y.yoy+'%';
  return '<td class="n">'+fmt(y.prev)+'</td><td class="n"><span class="yoy '+cls+'">'+lab+'</span></td>';
}
function typeTable(byType,total,id,typeYoy){
  const rows=Object.entries(byType).filter(e=>e[1]||(typeYoy&&typeYoy[e[0]])).sort((a,b)=>b[1]-a[1]),max=rows[0]?rows[0][1]:1;
  const csvRows=[['Crime type','Count','Share %',...(typeYoy?['Previous 12 months','Change','YoY %']:[])],...rows.map(([k,v])=>{const y=typeYoy&&typeYoy[k];return [cn(k),v,(total?v/total*100:0).toFixed(1),...(y?[y.prev,y.delta,y.yoy==null?'':y.yoy]:[])]})];
  const body=rows.map(([k,v])=>{
    const share=(total?v/total*100:0).toFixed(1);
    const ycells=typeYoy?typeYoyCell(typeYoy[k]):'';
    return '<tr><td>'+cn(k)+'</td><td class="n">'+fmt(v)+'</td><td class="n">'+share+'%</td>'+ycells+'<td><div class="bar"><i style="width:'+(max?v/max*100:0)+'%"></i></div></td></tr>';
  }).join('');
  return `<div class="row"><h3>By crime type</h3><span class="ctl">${csvBtn(id,csvRows,'this crime-type table')}${tipI(typeYoy?'Latest 12 months versus the 12 months before. A year-on-year percentage is only shown when the previous year had at least 20 crimes of that type.':'Each row is a police crime category. Share is its percentage of all crimes shown.')}</span></div>
 <div style="overflow-x:auto"><table><thead><tr><th scope="col">Type</th><th class="n" scope="col">Count</th><th class="n" scope="col">Share</th>${typeYoy?'<th class="n" scope="col">Previous</th><th class="n" scope="col">YoY</th>':''}<th style="width:22%"><span class="sr-only">Share bar</span></th></tr></thead><tbody>${body}</tbody></table></div>`;
}
function movingPanel(a){const ty=a.typeYoy; if(!ty)return '';
 const rows=Object.keys(ty).map(id=>({id,...ty[id]}));
 const ranked=rows.filter(r=>!r.thin&&r.yoy!=null);
 const rising=ranked.filter(r=>r.yoy>0).sort((x,y)=>y.yoy-x.yoy).slice(0,4);
 const falling=ranked.filter(r=>r.yoy<0).sort((x,y)=>x.yoy-y.yoy).slice(0,4);
 const thin=rows.filter(r=>r.thin);
 const line=r=>`<li><span class="mv-n">${cn(r.id)}</span><span class="yoy ${r.yoy>0?'up':r.yoy<0?'down':''}">${r.yoy>0?'+':''}${r.yoy}%</span><span class="muted">${fmt(r.prev)} → ${fmt(r.cur)} (${r.delta>0?'+':''}${fmt(r.delta)})</span></li>`;
 return `<section class="sec"><div class="sec-h"><div><h2>What’s moving</h2><p>Fastest-rising and fastest-falling crime types, latest 12 months versus the 12 months before.</p></div>${tipI('A percentage is only shown when the previous year had at least 20 recorded crimes of that type. Small counts can swing by a large percentage. Changes can reflect recording and policing as well as offending.')}</div>
 <div class="grid2 mvgrid">
  <div class="card"><h3>Rising</h3>${rising.length?`<ul class="mv">${rising.map(line).join('')}</ul>`:'<p class="muted">No type with a reliable rise.</p>'}</div>
  <div class="card"><h3>Falling</h3>${falling.length?`<ul class="mv">${falling.map(line).join('')}</ul>`:'<p class="muted">No type with a reliable fall.</p>'}</div>
 </div>
 ${thin.length?`<p class="muted" style="margin-top:10px">Not ranked, because the previous year had fewer than 20 crimes: ${thin.map(r=>cn(r.id)+' ('+fmt(r.prev)+' → '+fmt(r.cur)+')').join('; ')}.</p>`:''}
 <p class="muted">Overall ${a.yoy==null?'–':((a.yoy>0?'+':'')+a.yoy+'%')}. Counts are police-recorded crimes, not a survey of all offending.</p></section>`}
const OCOL=['#0f766e','#14b8a6','#94a3b8','#f59e0b','#6366f1','#a855f7','#cbd5e1'];
function outTable(oc,id){const t=oc.reduce((a,b)=>a+b,0)||1;
 return `<div class="row"><h3>Outcomes</h3><span class="ctl">${csvBtn(id,[['Outcome','Crimes','Share %'],...S.outcomeBuckets.map((b,i)=>[b,oc[i],(oc[i]/t*100).toFixed(1)])],'the outcome breakdown')}${tipI('Latest police outcome for each crime, grouped. Charged or summonsed and out-of-court resolutions count towards the solve rate.')}</span></div>
 <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;margin:4px 0 10px" role="img" aria-label="Outcome shares">${oc.map((v,i)=>`<i style="width:${v/t*100}%;background:${OCOL[i]}"></i>`).join('')}</div>
 <table><thead><tr><th scope="col">Outcome</th><th class="n" scope="col">Crimes</th><th class="n" scope="col">Share</th></tr></thead><tbody>${S.outcomeBuckets.map((b,i)=>`<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${OCOL[i]};margin-right:8px"></span>${b}</td><td class="n">${fmt(oc[i])}</td><td class="n">${(oc[i]/t*100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`}
const SSOB=['Arrest','Summons / charged','Out-of-court resolution','No further action','Other'];
function ssNear(SS,la,lo,rMi,w){return SS.filter(p=>hav(la,lo,p[0],p[1])<=rMi&&(w==null||p[2]>=S.months.length-w))}
function ssBlock(nearSS,w){const months=wMonths(w||12); const mon=months.map(()=>0), oc=[0,0,0,0,0], off=S.months.length-months.length;
 nearSS.forEach(p=>{const m=p[2]-off; if(m>=0&&m<months.length)mon[m]++; if(p.length>3&&p[3]>=0&&p[3]<oc.length)oc[p[3]]++});
 const hasOut=nearSS.some(p=>p.length>3); const t=oc.reduce((a,b)=>a+b,0)||1;
 return `<div class="card"><div class="row"><h3>Stop and search</h3>${tipI('Cambridgeshire Constabulary stops recorded with a location within the chosen radius and time window. Outcomes are as published; most stops result in no further action. This is not a crime rate.')}</div>
  <p class="muted">${fmt(nearSS.length)} recorded in ${wLabel(w||12)}.</p>
  <div style="height:180px"><canvas id="sstrend" aria-label="Monthly stop and search"></canvas></div>
  ${hasOut?`<table><thead><tr><th>Outcome</th><th class="n">Count</th><th class="n">Share</th></tr></thead><tbody>${SSOB.map((b,i)=>`<tr><td>${b}</td><td class="n">${fmt(oc[i])}</td><td class="n">${(oc[i]/t*100).toFixed(0)}%</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Outcome mix is not available for this extract.</p>'}
 </div>`}
function drawSsTrend(el,nearSS,w){if(!el)return; const months=wMonths(w||12), off=S.months.length-months.length, data=months.map(()=>0);
 nearSS.forEach(p=>{const m=p[2]-off; if(m>=0&&m<data.length)data[m]++});
 chartTheme(); charts.push(new Chart(el,{type:'bar',data:{labels:months.map(mname),datasets:[{label:'Stop and search',data,backgroundColor:css('--teal')}]},options:{animation:reduce?false:{duration:400},maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}}))}
const kpi=(icon,lab,val,sub,tip,extra='')=>`<div class="card kpi"><div class="lab">${ic(icon)}${lab}${tip?tipI(tip):''}</div><div class="val">${val}</div><div class="sub">${sub||''}</div>${extra}</div>`;
/* ---------- tooltips (hover, focus, tap) ---------- */
const tip=$('#tip');let tipEl=null,tipT=0;const touch=matchMedia('(hover:none)').matches;
function showTip(el){const t=el.getAttribute('data-tip');if(!t)return;tipEl=el;tip.textContent=t;tip.classList.add('show');tip.setAttribute('aria-hidden','false');const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
 let x=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8),y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8;tip.style.left=x+'px';tip.style.top=y+'px';el.setAttribute('aria-describedby','tip');if(el.classList.contains('tip-i'))el.setAttribute('aria-expanded','true')}
function hideTip(){if(tipEl){tipEl.removeAttribute('aria-describedby');tipEl.removeAttribute('aria-expanded')}tipEl=null;tip.classList.remove('show');tip.setAttribute('aria-hidden','true')}
document.addEventListener('mouseover',e=>{if(touch)return;const el=e.target.closest('[data-tip]');if(el)showTip(el);else if(tipEl&&!tipEl.classList.contains('tip-i'))hideTip()});
document.addEventListener('focusin',e=>{const el=e.target.closest('[data-tip]');if(el){showTip(el);tipT=Date.now()}else hideTip()});
document.addEventListener('focusout',()=>hideTip());
document.addEventListener('click',e=>{const el=e.target.closest('.tip-i');if(el){e.preventDefault();e.stopPropagation();tipEl===el&&tip.classList.contains('show')&&Date.now()-tipT>400?hideTip():showTip(el)}else if(!e.target.closest('[data-tip]'))hideTip()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip()});addEventListener('scroll',()=>{if(touch)hideTip()},{passive:true});
/* ---------- theme ---------- */
function setThemeBtn(){const d=document.documentElement.dataset.theme==='dark';$('#theme').innerHTML=ic(d?'sun':'moon',22);$('#theme').setAttribute('aria-pressed',d)}
$('#theme').onclick=()=>{const d=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=d;localStorage.setItem('sl-theme',d);setThemeBtn();window._keep=snapState();render()};
function snapState(){if(!$('#mapbox')||!map)return null;const d=is3d()&&m3;const t=document.querySelector('.tab[aria-selected=true]');return {L:[...document.querySelectorAll('.layers input:checked')].map(i=>i.dataset.l),d3:is3d(),cam:d?{center:m3.getCenter(),zoom:m3.getZoom(),pitch:m3.getPitch(),bearing:m3.getBearing()}:null,ll:{c:map.getCenter(),z:map.getZoom()},tab:t&&t.id,y:scrollY,r:getR(),tf:getTypeFilter()?[...getTypeFilter()]:null}}
/* ---------- routing: ?pc=, ?d=, legacy #/ ---------- */
const MODE_KEY='sl-mode';
let _routeGen=0;
function getMode(){
  const q=new URLSearchParams(location.search).get('mode');
  if(q==='simple'||q==='advanced') return q;
  try{const s=localStorage.getItem(MODE_KEY); if(s==='simple'||s==='advanced') return s}catch{}
  return 'simple';
}
function isSimple(){return getMode()==='simple'}
function syncModeToggle(){
  const m=getMode();
  document.documentElement.dataset.mode=m;
  const s=$('#mode-simple'), a=$('#mode-advanced');
  if(s) s.setAttribute('aria-pressed', String(m==='simple'));
  if(a) a.setAttribute('aria-pressed', String(m==='advanced'));
}
function wireModeToggle(){
  const s=$('#mode-simple'), a=$('#mode-advanced');
  if(!s||s.dataset.wired)return;
  s.dataset.wired='1';
  s.onclick=()=>setMode('simple');
  a.onclick=()=>setMode('advanced');
}
function setMode(m){
  if(m!=='simple'&&m!=='advanced')return;
  try{localStorage.setItem(MODE_KEY,m)}catch{}
  const u=new URL(location.href);
  const q=u.searchParams;
  q.set('mode',m);
  if(m==='simple'){
    if(q.get('view')==='league'||q.has('league')){q.delete('view');q.delete('league')}
    if(q.has('compare')){q.delete('compare');q.delete('a');q.delete('b')}
  }
  u.hash='';
  history.replaceState(null,'',u);
  document.documentElement.dataset.mode=m;
  syncModeToggle();
  render();
}
function applyModeFromRoute(){
  const q=new URLSearchParams(location.search);
  const requested=q.get('mode');
  if(requested==='simple'||requested==='advanced'){
    try{localStorage.setItem(MODE_KEY,requested)}catch{}
  }
  const needAdv=(q.get('view')==='league'||q.has('league')||q.has('compare'))&&getMode()==='simple';
  if(needAdv){
    try{localStorage.setItem(MODE_KEY,'advanced')}catch{}
    q.set('mode','advanced');
    const u=new URL(location.href);u.search=q.toString();
    history.replaceState(null,'',u);
  }
  document.documentElement.dataset.mode=getMode();
  syncModeToggle();
}
function syncFooter(){
  const note=$('.foot .note');
  if(!note)return;
  if(!note.dataset.full) note.dataset.full=note.innerHTML;
  if(isSimple()) note.innerHTML='<b>Read with care.</b> Police anonymise crime locations, so a pin appears on a nearby street or landmark, not an exact address. A neighbourhood band is not a safety score. <a href="method.html">How to read this site</a>.';
  else note.innerHTML=note.dataset.full;
}
function seeDetailsBtn(){return `<p class="see-adv"><button type="button" class="btn" id="see-adv">See all the details</button></p>`}
function wireSeeDetails(){const b=$('#see-adv'); if(b) b.onclick=()=>setMode('advanced')}
function yoyLine(yoy,name){
  if(yoy==null) return '';
  const who=name?`In ${esc(name)}, recorded`:'Recorded';
  if(yoy===0) return `${who} crime is about the same as the previous 12 months.`;
  return `${who} crime is ${Math.abs(yoy)}% ${yoy>0?'higher':'lower'} than the previous 12 months.`;
}
function bandWord(band){return band==='Medium'?'Average':(band||'')}
function bandPill(band){
  const w=bandWord(band)||'–';
  const cls=w==='Low'?'good':w==='High'?'bad':'neu';
  const icon=w==='Low'?'check':w==='High'?'shield':'people';
  return `<span class="band-pill badge ${cls}">${ic(icon,16)} ${esc(w)}</span>`;
}
function rLabel(rMi){return rMi===0.5?'½ mile':(rMi+' mile'+(rMi===1?'':'s'))}
function radiusCompareSentence(cur,prev,rMi,postcode){
  if(prev==null) return null;
  const where=`within ${rLabel(rMi)} of ${esc(postcode)}`;
  if(cur<20||prev<20) return `In the last 12 months, ${fmt(cur)} crimes were recorded ${where}. In the 12 months before, ${fmt(prev)} were recorded in the same radius — too few in one or both years for a reliable percentage change.`;
  const ch=(cur-prev)/prev*100, abs=Math.abs(ch);
  const n=abs>=10?Math.round(abs):(Math.round(abs*10)/10);
  if(abs<0.5) return `In the last 12 months, ${fmt(cur)} crimes were recorded ${where}. That is about the same as the 12 months before (${fmt(prev)}), counting pins in the same radius.`;
  return `In the last 12 months, ${fmt(cur)} crimes were recorded ${where}. That is ${n}% ${ch>0?'higher':'lower'} than the 12 months before (${fmt(prev)}), counting pins in the same radius.`;
}
function areaSummarySentence(total,yoy,name){
  const where=name?`in ${esc(name)}`:'across Cambridgeshire and Peterborough';
  let s=`In the last 12 months, ${fmt(total)} crimes were recorded ${where}.`;
  if(yoy==null) return s;
  if(yoy===0) return s+' That is about the same as the 12 months before.';
  return s+` That is ${Math.abs(yoy)}% ${yoy>0?'higher':'lower'} than the 12 months before.`;
}

function joinAnd(arr){
  if(!arr||!arr.length) return '';
  if(arr.length===1) return arr[0];
  if(arr.length===2) return arr[0]+' and '+arr[1];
  return arr.slice(0,-1).join(', ')+' and '+arr.at(-1);
}
function moreToggleMarkup(){
  return `<p class="more-wrap"><button type="button" class="more-link" id="sum-more" aria-expanded="false" aria-controls="sum-detail">Do you want to know more?</button></p>
  <div id="sum-detail" class="sum-detail" hidden>
    <div class="sum-detail-body" id="sum-detail-body"><p class="muted">Loading a fuller picture…</p></div>
    <p class="sum-detail-actions">
      <button type="button" class="more-link" id="sum-less">Show less</button>
      <button type="button" class="btn" id="see-adv-more">See all the details in Advanced view</button>
    </p>
  </div>`;
}
function wireMore(loader){
  const btn=$('#sum-more'), panel=$('#sum-detail'), body=$('#sum-detail-body'), less=$('#sum-less'), adv=$('#see-adv-more');
  if(!btn||!panel)return;
  let loaded=false, loading=false;
  const setOpen=on=>{
    panel.hidden=!on;
    btn.setAttribute('aria-expanded', on?'true':'false');
  };
  const open=async()=>{
    setOpen(true);
    if(loaded||loading) return;
    loading=true;
    try{
      const html=await loader();
      if(body&&$('#sum-detail-body')===body) body.innerHTML=html||'<p>A fuller picture is not available just now.</p>';
      loaded=true;
    }catch{
      if(body&&$('#sum-detail-body')===body) body.innerHTML='<p>A fuller picture could not be loaded just now.</p>';
    }
    loading=false;
  };
  const close=()=>{setOpen(false); btn.focus()};
  btn.onclick=()=>{btn.getAttribute('aria-expanded')==='true'?close():open()};
  if(less) less.onclick=close;
  if(adv) adv.onclick=()=>setMode('advanced');
}
function typeChangeClause(ty){
  if(!ty||ty.thin||ty.yoy==null) return '';
  if(Math.abs(ty.yoy)<0.5) return ', about the same as the year before';
  return `, ${Math.abs(ty.yoy)}% ${ty.yoy>0?'higher':'lower'} than the year before`;
}
function moreParas(parts){return parts.filter(Boolean).map(p=>`<p>${p}</p>`).join('')}
async function moreTextArea(dist){
  const isAll=!dist, a=dist||S.overview;
  const period=`${mname(S.months[0])} to ${mname(S.months.at(-1))}`;
  const where=isAll?'across Cambridgeshire and Peterborough':`in ${esc(a.name)}`;
  const paras=[];
  paras.push(`In the 12 months from ${period}, ${fmt(a.total)} crimes were recorded ${where} — about ${fmt(Math.round(a.total/12))} a month. That is ${a.rate} recorded crimes per 1,000 residents${isAll?'':`, compared with ${S.overview.rate} across the county`}.`);
  if(a.yoy!=null){
    if(a.yoy===0) paras.push('That is about the same as the 12 months before.');
    else paras.push(`That is ${Math.abs(a.yoy)}% ${a.yoy>0?'higher':'lower'} than the 12 months before. This comparison uses the same ${isAll?'county':'district'} totals in both years.`);
  }
  const types=Object.entries(a.byType||{}).sort((x,y)=>y[1]-x[1]).slice(0,3);
  if(types.length){
    const bits=types.map(([k,n])=>`${esc(cn(k))} (${fmt(n)}${typeChangeClause((a.typeYoy||{})[k])})`);
    paras.push(`The most recorded types were ${joinAnd(bits)}.`);
  }
  {const cf=changeFactsArea(a); if(cf) changeAreaParas(cf,where).forEach(x=>paras.push(x))}
  if(a.outcomes){
    const sol=solveOf(a), pos=a.outcomes[0]+a.outcomes[1], nonAsb=a.outcomes.reduce((x,y)=>x+y,0)-a.outcomes[6];
    if(nonAsb){
      const county=solveOf(S.overview);
      paras.push(`The solve rate was ${sol.toFixed(1)}% (${fmt(pos)} of ${fmt(nonAsb)} crimes excluding anti-social behaviour, which has no outcome). That is the share whose latest recorded outcome was a charge, summons or out-of-court resolution.${isAll?'':` The county figure is ${county.toFixed(1)}%.`} Many cases are still under investigation, especially in recent months.`);
    }
  }
  if(a.monthly){
    const loc=monthIndex(a.monthly,S.months);
    if(loc.vals.some(v=>v>0)){
      const peakI=loc.idx.reduce((b,v,i)=>v>loc.idx[b]?i:b,0);
      const lowI=loc.idx.reduce((b,v,i)=>v<loc.idx[b]?i:b,0);
      paras.push(`${mname(S.months[peakI])} was the busiest month, with ${fmt(loc.vals[peakI])} recorded crimes (${loc.idx[peakI]}% of this area’s monthly average). ${mname(S.months[lowI])} was the quietest, with ${fmt(loc.vals[lowI])}. A peak can reflect reporting and police activity as well as offending.`);
    }
  }
  if(isAll&&S.districts&&S.districts.length){
    const ranked=[...S.districts].sort((x,y)=>y.rate-x.rate);
    paras.push(`Among the six districts, ${esc(ranked[0].name)} has the highest recorded rate at ${ranked[0].rate} per 1,000, and ${esc(ranked.at(-1).name)} the lowest at ${ranked.at(-1).rate}. Rates use resident population, so a city centre often looks higher than a rural district.`);
  }
  try{
    const he=await lj('home_extras');
    if(he&&he.hotspots){
      let spots;
      if(isAll) spots=he.hotspots.spots;
      else{
        const d=(he.hotspots.districts||[]).find(x=>x.name===a.name||x.code===a.code);
        spots=d&&d.spots;
      }
      if(spots&&spots.length){
        const top=spots.slice(0,3).map(s=>{
          const typ=spotType(s);
          return `${esc(spotName(s))} (${fmt(spotN(s))}${typ?`, most often ${esc(typ)}`:''})`;
        });
        paras.push(`The busiest published snap points ${isAll?'in the county':`in ${esc(a.name)}`} were ${joinAnd(top)}. These are anonymised “on or near” locations, not exact addresses, over the same 12 months.`);
      }
    }
    if(he&&he.collisions){
      const C=he.collisions;
      const row=isAll?C.overview:((C.districts||[]).find(x=>x.name===a.name||x.code===a.code));
      if(row&&row.n){
        const years=(C.meta&&C.meta.years||[2024,2025]).join(' and ');
        paras.push(`On the roads, ${fmt(row.n)} personal-injury collisions were recorded in calendar years ${years} (${fmt(row.fatal)} fatal, ${fmt(row.serious)} serious, ${fmt(row.slight)} slight), with ${fmt(row.cas)} casualties. These are STATS19 figures, not the same window as the crime counts, and damage-only bumps are not included.`);
        const pr=provRowFor(C,a,isAll); if(pr) paras.push(provText(pr,C,true));
      }
    }
  }catch{}
  paras.push('Police anonymise locations, so a pin is a nearby street or landmark, not an exact address. Police data is published about two months after each month ends. None of these figures is a safety score.');
  return moreParas(paras);
}
async function moreTextPostcode(ctx){
  const {la,lo,postcode,rMi,nearAll,cats,by,row,dist,prevPromise,SC,gen}=ctx;
  const paras=[];
  const period=`${mname(S.months[0])} to ${mname(S.months.at(-1))}`;
  let pool=nearAll, at={[rMi]:nearAll.length};
  try{
    const pts2=await loadPointsNear(la,lo,2);
    if(gen!==_routeGen) return '';
    pool=pts2.filter(p=>inWindow(p,12));
    at={'0.5':pool.filter(p=>hav(la,lo,p[0],p[1])<=0.5).length, 1:pool.filter(p=>hav(la,lo,p[0],p[1])<=1).length, 2:pool.length};
  }catch{}
  if(at['0.5']!=null&&at[1]!=null&&at[2]!=null){
    paras.push(`In the 12 months from ${period}, ${fmt(nearAll.length)} crimes were recorded within ${rLabel(rMi)} of ${esc(postcode)}. In the same window there were ${fmt(at['0.5'])} within ½ mile, ${fmt(at[1])} within 1 mile and ${fmt(at[2])} within 2 miles.`);
  }else{
    paras.push(`In the 12 months from ${period}, ${fmt(nearAll.length)} crimes were recorded within ${rLabel(rMi)} of ${esc(postcode)}.`);
  }
  try{
    const prev=await (prevPromise||loadPrevPointsNear(la,lo,rMi));
    if(gen!==_routeGen) return '';
    const prevN=prev&&prev.pts?prev.pts.length:null;
    if(prevN!=null){
      if(nearAll.length<20||prevN<20) paras.push(`In the 12 months before, ${fmt(prevN)} were recorded in the same radius — too few in one or both years for a reliable percentage change. This counts pins in the same radius, not an official neighbourhood total.`);
      else{
        const ch=(nearAll.length-prevN)/prevN*100, abs=Math.abs(ch);
        const n=abs>=10?Math.round(abs):(Math.round(abs*10)/10);
        if(abs<0.5) paras.push(`That is about the same as the 12 months before (${fmt(prevN)}), counting pins in the same radius, not an official neighbourhood total.`);
        else paras.push(`That is ${n}% ${ch>0?'higher':'lower'} than the 12 months before (${fmt(prevN)}), counting pins in the same radius, not an official neighbourhood total.`);
      }
    }else if(dist&&dist.yoy!=null){
      paras.push(`A year-on-year figure for this radius could not be loaded. ${yoyLine(dist.yoy,dist.name)}`);
    }
  }catch{
    if(dist&&dist.yoy!=null) paras.push(`A year-on-year figure for this radius could not be loaded. ${yoyLine(dist.yoy,dist.name)}`);
  }
  const top=Object.entries(by||{}).sort((x,y)=>y[1]-x[1]).slice(0,3);
  if(top.length) paras.push(`The most recorded types within ${rLabel(rMi)} were ${joinAnd(top.map(([k,n])=>`${esc(cn(k))} (${fmt(n)})`))}.`);
  try{ changeNearParas(changeFactsNear(nearAll),cats,`within ${rLabel(rMi)} of ${esc(postcode)}`).forEach(x=>paras.push(x)) }catch{}
  if(row&&row.rate!=null){
    const bw=bandWord(row.band);
    let s=`The neighbourhood recorded-crime rate is ${row.rate} per 1,000 residents, which is ${esc(bw||'unbanded')} among Cambridgeshire and Peterborough neighbourhoods`;
    if(row.n!=null&&row.pop!=null) s+=` (about ${fmt(row.n)} crimes, population ${fmt(row.pop)})`;
    if(row.pct!=null) s+=`. That is a lower recorded rate than ${row.pct}% of local neighbourhoods`;
    s+=`. This is an approximate rate — each published crime is assigned to the nearest neighbourhood centroid because police anonymise locations — and it is not a safety score. Town centres often look higher because visitors and shoppers are not counted as residents.`;
    paras.push(s);
  }
  const oc=[0,0,0,0,0,0,0];
  nearAll.forEach(p=>{if(p[4]!=null) oc[p[4]]++});
  const nonAsb=nearAll.length-oc[6], pos=oc[0]+oc[1], solve=nonAsb?pos/nonAsb*100:null;
  if(solve!=null){
    paras.push(`The solve rate within ${rLabel(rMi)} was ${solve.toFixed(1)}% (${fmt(pos)} of ${fmt(nonAsb)} crimes excluding anti-social behaviour). ${fmt(pos)} were charged or resolved, ${fmt(oc[2])} had no suspect identified, and ${fmt(oc[4])} were still under investigation. This is the latest published outcome, not a courtroom result.`);
  }
  try{
    const HS=await lj('hotspots');
    if(gen!==_routeGen) return '';
    const nearSpots=HS&&HS.spots?HS.spots.map(s=>{const d=hav(la,lo,s[0],s[1]);return d<=rMi?Object.assign([...s],{d}):null}).filter(Boolean).sort((a,b)=>spotN(b)-spotN(a)):[];
    if(nearSpots.length){
      const bits=nearSpots.slice(0,3).map(s=>{
        const typ=spotType(s);
        return `${esc(spotName(s))} (${fmt(spotN(s))}${typ?`, most often ${esc(typ)}`:''})`;
      });
      paras.push(`The busiest published snap points within ${rLabel(rMi)} were ${joinAnd(bits)}. These are “on or near” a street or landmark, not exact addresses, and the counts cover the latest 12 months.`);
    }
  }catch{}
  try{
    const RA=await lj('rail').catch(()=>[]);
    if(gen!==_routeGen) return '';
    const n250=(lat,lon)=>pool.filter(c=>hav(lat,lon,c[0],c[1])<=0.1553).length;
    const scs=nearest(SC||[],la,lo,3).filter(s=>s.d<=2);
    const rails=nearest(RA||[],la,lo,3).filter(s=>s.d<=2);
    const schoolBits=scs.slice(0,2).map(s=>`${esc(s[2])} (${s.d.toFixed(1)} mi, ${fmt(n250(s[0],s[1]))} recorded crimes within 250m)`);
    const railBits=rails.slice(0,1).map(s=>`${esc(s[2])} (${s.d.toFixed(1)} mi, ${fmt(n250(s[0],s[1]))} recorded crimes within 250m)`);
    if(schoolBits.length||railBits.length){
      let s='';
      if(schoolBits.length) s+=`Nearby schools include ${joinAnd(schoolBits)}. `;
      if(railBits.length) s+=`The nearest station is ${railBits[0]}. `;
      s+='A count within 250m of a school or station is not a count of incidents on that site, because pins are snapped to a public location.';
      paras.push(s);
    }
  }catch{}
  try{
    const CO=await lj('collisions');
    if(gen!==_routeGen) return '';
    const nearCO=CO&&CO.points?CO.points.filter(p=>hav(la,lo,p[0],p[1])<=rMi):[];
    if(nearCO.length){
      const fatal=nearCO.filter(p=>p[2]===1).length;
      const serious=nearCO.filter(p=>p[2]===2).length;
      const slight=nearCO.filter(p=>p[2]===3).length;
      const cas=nearCO.reduce((s,p)=>s+(p[4]||0),0);
      const years=(CO.meta&&CO.meta.years||[2024,2025]).join(' and ');
      const prN=provNear(CO,la,lo,rMi);
      paras.push(`Within ${rLabel(rMi)} there were ${fmt(nearCO.length)} personal-injury collisions in calendar years ${years} (${fmt(fatal)} fatal, ${fmt(serious)} serious, ${fmt(slight)} slight), with ${fmt(cas)} casualties. These are STATS19 figures, not the same window as the crime counts, and damage-only bumps are not included.`);
      if(prN) paras.push(provText(prN,CO,true));
    }
  }catch{}
  if(nearAll.length>=20){
    const mon={}; S.months.forEach(m=>mon[m]=0);
    nearAll.forEach(p=>{if(S.months[p[3]]) mon[S.months[p[3]]]++});
    const loc=monthIndex(mon,S.months);
    const peakI=loc.idx.reduce((b,v,i)=>v>loc.idx[b]?i:b,0);
    const lowI=loc.idx.reduce((b,v,i)=>v<loc.idx[b]?i:b,0);
    paras.push(`Within this radius, ${mname(S.months[peakI])} was the busiest month (${fmt(loc.vals[peakI])} crimes, ${loc.idx[peakI]}% of the local monthly average) and ${mname(S.months[lowI])} was the quietest (${fmt(loc.vals[lowI])}). A peak can reflect reporting and police activity as well as offending.`);
  }
  paras.push('Police anonymise locations, so a pin is a nearby street or landmark, not an exact address. Distances are straight-line. Police data is published about two months after each month ends. None of these figures is a safety score.');
  return moreParas(paras);
}

const HINT_KEY='sl-hint-v1';
function maybeHint(){
  try{if(localStorage.getItem(HINT_KEY))return}catch{return}
  if(!isSimple()||$('#sl-hint'))return;
  const el=document.createElement('div');
  el.id='sl-hint'; el.className='sl-hint'; el.setAttribute('role','region'); el.setAttribute('aria-label','How to read this site');
  el.innerHTML=`<p>This is the simple view: a few headline figures and a map. Recorded crime is not a safety score, and pins sit on a nearby street or landmark, not an exact address. <a href="method.html">How to read this site</a></p><button type="button" class="btn ghost" id="hint-dismiss">Got it</button>`;
  const host=$('#app'); if(!host)return;
  host.prepend(el);
  const b=$('#hint-dismiss'); if(b) b.onclick=()=>{try{localStorage.setItem(HINT_KEY,'1')}catch{} el.remove()};
}
function useMyLocation(){
  const err=m=>{const s=$('#serr'); if(s) s.textContent=m};
  if(!navigator.geolocation){err('Location is not available on this device.');return}
  err('Finding your location…');
  navigator.geolocation.getCurrentPosition(async p=>{
    try{
      const r=await fetch(`https://api.postcodes.io/postcodes?lon=${p.coords.longitude}&lat=${p.coords.latitude}&limit=5`).then(x=>x.json());
      const hit=(r.result||[]).find(pc=>S.districts.some(d=>d.name===pc.admin_district));
      if(hit) go('pc='+encodeURIComponent(hit.postcode));
      else err('You do not appear to be in Cambridgeshire or Peterborough. Type a local postcode instead.');
    }catch{err('Could not look up your postcode.')}
  }, e=>{
    err(e&&e.code===1?'Location permission was refused. Type a postcode instead.':'Could not read your location. Type a postcode instead.');
  }, {enableHighAccuracy:false, timeout:10000, maximumAge:0});
}


function go(q,push=true){const u=new URL(location.href);u.hash='';
  const p=new URLSearchParams(q||'');
  if(!p.has('mode')) p.set('mode',getMode());
  u.search=p.toString()?('?'+p.toString()):'';
  if(push)history.pushState(null,'',u);render();app.focus({preventScroll:true});scrollTo({top:0,behavior:reduce?'auto':'smooth'})}
addEventListener('popstate',render);
document.addEventListener('click',e=>{const a=e.target.closest('a[data-q],a[data-nav]');if(!a||e.metaKey||e.ctrlKey)return;e.preventDefault();go(a.dataset.q||'')});
const dq=d=>'d='+slug(d.name);
function nav(cur){const simple=isSimple();
 $('#nav').innerHTML=`<a href="./" data-nav="home" ${!cur||cur=='home'?'aria-current="page"':''} data-tip="County-wide summary and postcode search.">Overview</a>`+S.districts.map(d=>`<a href="?${dq(d)}" data-q="${dq(d)}" ${cur==slug(d.name)?'aria-current="page"':''} data-tip="${simple?'A short look at recorded crime in '+d.name+'.':'Crime, outcomes and house prices for '+d.name+'.'}">${d.name}</a>`).join('')+(simple?'':`<a href="?view=league" data-q="view=league" ${cur=='league'?'aria-current="page"':''} data-tip="Sortable recorded-crime rates for districts and neighbourhoods. Opens Advanced view.">League</a><a href="?compare=1" data-q="compare=1" ${cur=='compare'?'aria-current="page"':''} data-tip="Compare two postcodes side by side. Opens Advanced view.">Compare</a>`)+`<a href="method.html" data-tip="How rates, maps and outcomes are calculated.">Method</a>`;
 syncModeToggle()}
function render(){hideTip();killCharts();if(map){map.remove();map=null}
 _routeGen++;
 applyModeFromRoute();
 syncFooter();
 const q=new URLSearchParams(location.search),h=decodeURIComponent(location.hash.slice(2));
 if(h){const u=new URL(location.href);u.hash='';if(h.startsWith('postcode/'))u.search='?pc='+h.slice(9);else if(h)u.search='?d='+h;history.replaceState(null,'',u);return render()}
 const pc=q.get('pc'),d=q.get('d');
 if(q.get('compare')!=null){nav('compare');return compareView(q.get('a'),q.get('b'))}
 if(q.get('view')==='league'||q.get('league')!=null){nav('league');return leagueView()}
 if(pc){nav('pc');return dashboard(pc)}
 const dist=S.districts.find(x=>slug(x.name)==d);nav(d||'home');const title=(dist?dist.name+' — ':'')+'StreetLens — Cambridgeshire area insights';
 setMeta(title,dist?`${dist.name}: ${dist.rate} crimes per 1,000 residents, solve rate and house prices from open UK data.`:'Crime, outcomes, schools, GPs, transport and house prices for any Cambridgeshire or Peterborough postcode.',location.origin+location.pathname+(d?'?d='+encodeURIComponent(d):''));home(dist)}
/* ---------- search component ---------- */
function searchBox(){return `<form class="search" id="sf" role="search" autocomplete="off"><div class="sbox">${ic('search',22)}
 <input id="pc" type="text" inputmode="text" autocapitalize="characters" aria-label="Postcode or place" placeholder="Postcode or place, e.g. PE29 3TN or Ely" role="combobox" aria-expanded="false" aria-controls="ac" aria-autocomplete="list" data-tip="Type a Cambridgeshire or Peterborough postcode, or a place name such as Ely or Huntingdon.">
 ${tipI('Search a Cambridgeshire or Peterborough postcode, or a place name (Ely, Huntingdon, a village). Place search uses postcodes.io and then opens the nearest postcode.')}
 <button class="btn lg" data-tip="Show the area dashboard for this postcode.">Explore</button></div><ul class="ac" id="ac" role="listbox" aria-label="Postcode suggestions"></ul>
 <div class="qrow"><button type="button" class="chip" id="geo" data-tip="Use your device location to find the nearest Cambridgeshire or Peterborough postcode. Your location is sent only to postcodes.io for that lookup and is not stored.">${ic('loc',18)} Use my location</button>
 <span class="lbl">Try:</span>${[['Huntingdon','PE29 3TN'],['Cambridge','CB2 1TN'],['Peterborough','PE1 1HL'],['Ely','CB7 4BL']].map(([n,p])=>`<button type="button" class="chip" data-pc="${p}" data-tip="See the dashboard for ${n} (${p}).">${n}</button>`).join('')}</div>
 <div class="err" id="serr" role="alert"></div></form>`}
function wireSearch(){const f=$('#sf'),i=$('#pc'),ac=$('#ac');if(!f||!i)return;let sel=-1,items=[],tmr;
 const close=()=>{ac.classList.remove('open');i.setAttribute('aria-expanded','false');sel=-1};
 const lab=it=>it.label||it.pc;
 const draw=()=>{ac.innerHTML=items.map((it,k)=>`<li role="option" id="ac${k}" aria-selected="${k==sel}" data-i="${k}">${esc(lab(it))}${it.kind==='place'?' <span class="muted">place</span>':''}</li>`).join('');ac.classList.toggle('open',!!items.length);i.setAttribute('aria-expanded',!!items.length);i.setAttribute('aria-activedescendant',sel>=0?'ac'+sel:'')};
 const pick=it=>{if(!it)return; close(); if(it.pc&&it.kind!=='place'){i.value=it.pc; go('pc='+encodeURIComponent(it.pc)); return}
  i.value=it.label||''; goPlace(it)};
 i.oninput=()=>{clearTimeout(tmr);const v=i.value.trim();if(v.length<2){items=[];return close()}tmr=setTimeout(async()=>{
  try{
    const looksPc=/^[A-Za-z]{1,2}\d/.test(v);
    const jobs=[looksPc?fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(v)+'/autocomplete?limit=6').then(r=>r.json()).catch(()=>({})):Promise.resolve({}),
                fetch('https://api.postcodes.io/places?q='+encodeURIComponent(v)+'&limit=6').then(r=>r.json()).catch(()=>({}))];
    const [pc,pl]=await Promise.all(jobs);
    const out=[];
    (pc.result||[]).forEach(p=>out.push({kind:'postcode',pc:p,label:p}));
    (pl.result||[]).filter(placeInArea).forEach(p=>{const label=(p.name_1||'')+(p.district_borough?' ('+p.district_borough+')':''); if(label&&!out.some(x=>x.label===label)) out.push({kind:'place',label,lat:p.latitude,lon:p.longitude,name:p.name_1})});
    items=out.slice(0,8); sel=-1; draw();
  }catch{items=[];close()}
 },180)};
 i.onkeydown=e=>{if(!items.length)return;if(e.key==='ArrowDown'){sel=(sel+1)%items.length;draw();e.preventDefault()}else if(e.key==='ArrowUp'){sel=(sel-1+items.length)%items.length;draw();e.preventDefault()}else if(e.key==='Escape')close();else if(e.key==='Enter'&&sel>=0){e.preventDefault();pick(items[sel])}};
 ac.onmousedown=e=>{const li=e.target.closest('li');if(li){e.preventDefault();pick(items[+li.dataset.i])}};i.onblur=()=>setTimeout(close,150);
 f.onsubmit=e=>{e.preventDefault();const v=i.value.trim();if(!v){$('#serr').textContent='Enter a postcode or place to search.';return i.focus()}
  if(sel>=0&&items[sel])return pick(items[sel]);
  if(/^[A-Za-z]{1,2}\d/.test(v)) return go('pc='+encodeURIComponent(v.toUpperCase()));
  // resolve typed place name
  goPlace({kind:'place',label:v,name:v})};
 f.querySelectorAll('[data-pc]').forEach(b=>{if(b.tagName==='BUTTON')b.onclick=()=>go('pc='+encodeURIComponent(b.dataset.pc))});
 const geo=$('#geo'); if(geo) geo.onclick=useMyLocation;
}
async function goPlace(it){try{
  let lat=it.lat,lon=it.lon;
  if(lat==null){const pl=await fetch('https://api.postcodes.io/places?q='+encodeURIComponent(it.name||it.label)+'&limit=8').then(r=>r.json()); const hit=(pl.result||[]).find(placeInArea); if(!hit){$('#serr').textContent='No matching place in Cambridgeshire or Peterborough.';return} lat=hit.latitude; lon=hit.longitude}
  const r=await fetch(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&limit=5`).then(x=>x.json());
  const hit=(r.result||[]).find(p=>S.districts.some(d=>d.name===p.admin_district))|| (r.result&&r.result[0]);
  if(!hit){$('#serr').textContent='Could not find a postcode for that place.';return}
  go('pc='+encodeURIComponent(hit.postcode));
 }catch{$('#serr').textContent='Could not look up that place.'}}
/* ---------- home & district ---------- */

function simpleCluster(){return L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,iconCreateFunction:g=>{const n=g.getChildCount(),s=n<10?44:n<100?48:54;return L.divIcon({className:'',html:`<div class="cl" style="width:${s}px;height:${s}px;background:${LAYERS.crimes.c}">${n}</div>`,iconSize:[s,s]})}})}
function osmLayer(){return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'})}
function svUrl(lat,lng){
  const a=Number(lat), b=Number(lng);
  if(!isFinite(a)||!isFinite(b)) return '';
  return 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='+a.toFixed(6)+','+b.toFixed(6);
}
function svLink(lat,lng,opts){
  opts=opts||{};
  const href=svUrl(lat,lng); if(!href) return '';
  const approx=!!opts.approx;
  const label=opts.label||'Street View';
  return `<a class="sv-link" href="${href}" target="_blank" rel="noopener" aria-label="${esc(label+(approx?' at an approximate location':''))}">${ic('sv',16)} ${esc(label)}</a>${approx?' <span class="muted">approximate location</span>':''}`;
}
function openStreetView(lat,lng){
  const href=svUrl(lat,lng); if(!href) return;
  window.open(href,'_blank','noopener,noreferrer');
}
function mapCentre(){
  if(typeof is3d==='function'&&is3d()&&typeof m3!=='undefined'&&m3){const c=m3.getCenter(); return {lat:c.lat,lng:c.lng}}
  if(typeof map!=='undefined'&&map){const c=map.getCenter(); return {lat:c.lat,lng:c.lng}}
  return null;
}
function wireStreetViewButton(){
  const b=$('#sv-btn'); if(!b) return;
  b.onclick=()=>{const c=mapCentre(); if(c) openStreetView(c.lat,c.lng)};
}
function wireMapStreetViewContext(leafletMap){
  if(!leafletMap||leafletMap._svCtx) return;
  leafletMap._svCtx=true;
  leafletMap.on('contextmenu', e=>{
    const oe=e.originalEvent; if(oe&&oe.preventDefault) oe.preventDefault();
    if(e.latlng) openStreetView(e.latlng.lat,e.latlng.lng);
  });
  let press=null, sx=0, sy=0;
  const clear=()=>{if(press){clearTimeout(press);press=null}};
  leafletMap.on('touchstart', e=>{
    const touch=e.originalEvent&&e.originalEvent.touches&&e.originalEvent.touches[0];
    sx=touch?touch.clientX:0; sy=touch?touch.clientY:0;
    const ll=e.latlng;
    clear();
    press=setTimeout(()=>{press=null; if(ll) openStreetView(ll.lat,ll.lng)}, 600);
  });
  leafletMap.on('touchmove', e=>{
    const touch=e.originalEvent&&e.originalEvent.touches&&e.originalEvent.touches[0];
    if(!touch||!press) return;
    if(Math.hypot(touch.clientX-sx,touch.clientY-sy)>12) clear();
  });
  leafletMap.on('touchend touchcancel dragstart movestart', clear);
}
function addStreetViewControl(leafletMap){
  if(!leafletMap||!window.L) return;
  const C=L.Control.extend({
    options:{position:'topright'},
    onAdd(){
      const div=L.DomUtil.create('div','sl-sv-ctl');
      div.innerHTML='<button type="button" class="sv-ctl" id="sv-btn" aria-label="Open Street View at the current map centre" title="Open Google Street View at the centre of this map, in a new tab. Imagery is Google\u2019s and may be dated.">'+ic('sv',16)+' Street View</button>';
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      const btn=div.querySelector('button');
      if(btn) btn.onclick=()=>{const c=leafletMap.getCenter(); openStreetView(c.lat,c.lng)};
      return div;
    }
  });
  new C().addTo(leafletMap);
  wireMapStreetViewContext(leafletMap);
}
async function districtExtent(name){
  const lr=await lj('lsoa_rates');
  const pts=Object.values(lr.lsoa).filter(r=>r.la===name&&r.lat!=null);
  if(!pts.length)return null;
  const lat=pts.reduce((s,p)=>s+p.lat,0)/pts.length, lon=pts.reduce((s,p)=>s+p.lon,0)/pts.length;
  return {lat,lon,minLa:Math.min(...pts.map(p=>p.lat)),maxLa:Math.max(...pts.map(p=>p.lat)),minLo:Math.min(...pts.map(p=>p.lon)),maxLo:Math.max(...pts.map(p=>p.lon))};
}
async function fillSimpleOverviewMap(dist){
  const el=$('#smap'); if(!el)return;
  const gen=_routeGen;
  try{
    await ensureLeaflet();
    if(gen!==_routeGen)return;
    if(map){map.remove();map=null}
    if(!dist){
      const extents=await Promise.all(S.districts.map(async d=>({d,e:await districtExtent(d.name)})));
      if(gen!==_routeGen)return;
      map=L.map('smap',{zoomControl:true}).setView([52.35,0.05],9);
      osmLayer().addTo(map);
      const b=[];
      extents.forEach(({d,e})=>{
        if(!e)return;
        b.push([e.lat,e.lon]);
        L.marker([e.lat,e.lon],{icon:L.divIcon({className:'',html:`<div class="pin pin-dist" style="width:44px;height:44px;background:#14213d">${ic('pin',20)}</div>`,iconSize:[44,44],iconAnchor:[22,22]}),title:d.name,keyboard:false,alt:d.name+' — open district overview'}).addTo(map)
          .bindPopup(`<b>${esc(d.name)}</b><br>${d.rate} recorded crimes per 1,000 residents<br><a href="?${dq(d)}" data-q="${dq(d)}">Open ${esc(d.name)}</a>`);
      });
      if(b.length) map.fitBounds(b,{padding:[28,28],maxZoom:10});
      return;
    }
    const e=await districtExtent(dist.name);
    if(gen!==_routeGen)return;
    const bounds=e?[[e.minLa,e.minLo],[e.maxLa,e.maxLo]]:[[52.05,-0.55],[52.75,0.45]];
    map=L.map('smap',{zoomControl:true}).fitBounds(bounds,{padding:[24,24],maxZoom:12});
    osmLayer().addTo(map);
    const pts=await loadPointsInBBox(bounds[0][0],bounds[1][0],bounds[0][1],bounds[1][1]);
    if(gen!==_routeGen)return;
    const cats=S.categories.map(c=>c.id);
    const g=simpleCluster();
    pts.forEach(p=>g.addLayer(L.circleMarker([p[0],p[1]],{radius:6,color:'#fff',weight:1.5,fillColor:LAYERS.crimes.c,fillOpacity:.95}) .bindPopup(`<b>${cn(cats[p[2]])}</b><br>${mname(S.months[p[3]])}<br>${svLink(p[0],p[1],{approx:true})}`)));
    map.addLayer(g);
  }catch{if($('#smap')===el) el.innerHTML='<p class="muted">The map could not be loaded just now.</p>'}
}
function homeSimple(dist){
  const a=dist||S.overview,isAll=!dist,period=`${mname(S.months[0])} – ${mname(S.months.at(-1))}`;
  app.innerHTML=`<section class="hero simple-hero"><div class="in">
    <span class="eyebrow">${ic('pin',16)} ${isAll?'Cambridgeshire &amp; Peterborough':esc(a.name)} · ${period}</span>
    <h1>${isAll?'A simple look at crime in your area':esc(a.name)+' at a glance'}</h1>
    <p class="plain-sum" id="plain-sum">${areaSummarySentence(a.total,a.yoy,isAll?null:a.name)}</p>
    ${moreToggleMarkup()}
    <p class="lead">${isAll?'Search a postcode for a short, plain-English picture of recorded crime nearby.':'A short picture of recorded crime in '+esc(a.name)+'. Search a postcode for street-level detail.'}</p>
    ${searchBox()}
  </div></section>
  <div class="wrap lift simple-view">
    <div class="kpis">
      ${kpi('shield','Recorded crimes',fmt(a.total),'Last 12 months · '+fmt(Math.round(a.total/12))+' a month')}
      ${kpi('people','Per 1,000 residents',a.rate,isAll?'Across the county':'County figure: '+S.overview.rate)}
    </div>
    ${a.yoy!=null?`<p class="explain">${yoyLine(a.yoy,isAll?null:a.name)}</p>`:''}
    <div class="card"><div class="row"><h2>Map</h2></div><div class="simple-map" id="smap" role="region" aria-label="${isAll?'Map of Cambridgeshire and Peterborough districts':'Map of recorded crime in '+esc(a.name)}"></div>
      <p class="muted">${isAll?'Select a district marker or search a postcode to look closer. Crime points appear when you open a postcode or a district.':'Recorded crimes whose pin falls in this district (and slightly beyond its edges). Pins are snapped to a public location.'}</p>
    </div>
    ${isAll?`<div class="simple-dists">${S.districts.map(d=>`<a class="btn ghost" href="?${dq(d)}" data-q="${dq(d)}">${esc(d.name)} · ${d.rate}/1,000</a>`).join('')}</div>`:''}
    <p class="muted">Police anonymise locations, so a pin is a nearby street or landmark, not an exact address. Rates use resident population, so town centres often look higher. A neighbourhood band is not a safety score. <a href="method.html">How to read this site</a>.</p>
    ${seeDetailsBtn()}
  </div>`;
  wireSearch();
  wireSeeDetails();
  maybeHint();
  wireMore(()=>moreTextArea(dist));
  requestAnimationFrame(()=>requestAnimationFrame(()=>fillSimpleOverviewMap(dist)));
}

async function loadNeighbourhoodSimple(la,lo,el){
  if(!el)return;
  const fail=()=>{el.innerHTML='<h2>Local police team</h2><p class="muted">The neighbourhood team could not be loaded just now. Police.uk sometimes blocks requests from this site.</p><p><button type="button" class="btn ghost" id="nb-retry">Try again</button></p>'; const b=$('#nb-retry'); if(b) b.onclick=()=>{el.innerHTML='<p class="muted">Looking up the local police team…</p>'; loadNeighbourhoodSimple(la,lo,el)};};
  try{
    const loc=await fetchJSON(`https://data.police.uk/api/locate-neighbourhood?q=${la},${lo}`, null, 3);
    if(!loc){fail();return}
    if(!loc.force||!loc.neighbourhood){el.innerHTML='<h2>Local police team</h2><p class="muted">No neighbourhood team was found for this point.</p>';return}
    const info=await fetchJSON(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}`, null, 3);
    const ev=await fetchJSON(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}/events`, [], 3);
    const name=(info&&info.name)||loc.neighbourhood.replace(/_/g,' ');
    const url=`https://www.police.uk/pu/your-area/${loc.force}/${loc.neighbourhood.toLowerCase().replace(/_/g,'-')}/`;
    const cd=(info&&info.contact_details)||{};
    const tel=cd.telephone||cd.phone, email=cd.email;
    const upcoming=(Array.isArray(ev)?ev:[]).filter(e=>{
      const d=e&& (e.start_date||e.date||e.start);
      if(!d) return true;
      const t=Date.parse(d);
      return isNaN(t)||t>=Date.now()-86400000;
    }).slice(0,3);
    if(!info){fail();return}
    el.innerHTML=`<h2>Local police team</h2>
      <p><b>${esc(name)}</b></p>
      ${tel?`<p>Phone <a href="tel:${esc(String(tel).replace(/\s+/g,''))}">${esc(tel)}</a></p>`:''}
      ${email?`<p><a href="mailto:${esc(email)}">${esc(email)}</a></p>`:''}
      ${upcoming.length?`<h3>Upcoming events</h3><ul class="simple-strip">${upcoming.map(e=>`<li>${esc(e.title||e.name||'Event')}${e.start_date||e.date?' · '+esc(e.start_date||e.date):''}</li>`).join('')}</ul>`:''}
      <p class="muted">For a non-emergency report use 101. Call 999 in an emergency.</p>
      <p><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Open on police.uk</a></p>`;
  }catch{fail()}
}


async function dashboardSimple(raw){
  const gen=_routeGen;
  const pcq=raw.replace(/\s+/g,'').toUpperCase();
  app.innerHTML=`<div class="wrap simple-view"><h1>${esc(raw.toUpperCase())}</h1><div class="sk" style="height:160px;margin:16px 0"></div><div class="sk" style="height:320px"></div></div>`;
  let r;try{r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq)).then(x=>x.json())}catch{if(gen!==_routeGen)return;return stateView('Could not reach the postcode service','Check your connection and try again.')}
  if(gen!==_routeGen)return;
  if(!r||r.status!=200){let sug=[];try{sug=(await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq.slice(0,-1))+'/autocomplete?limit=4').then(x=>x.json())).result||[]}catch{}
    if(gen!==_routeGen)return;
    return stateView(`We couldn't find “${esc(raw)}”`,'Check the postcode is complete and spelled correctly, for example PE29 3TN.'+(sug.length?' Did you mean: '+sug.map(s=>`<a href="?pc=${encodeURIComponent(s)}" data-q="pc=${encodeURIComponent(s)}">${s}</a>`).join(', ')+'?':''),'search')}
  const R=r.result,{latitude:la,longitude:lo,postcode}=R,ad=R.admin_district,dist=S.districts.find(d=>d.name==ad);
  if(!dist)return stateView(`${postcode} is outside our area`,`${esc(postcode)} is in ${esc(ad||'an unknown area')}. StreetLens currently covers Cambridgeshire and Peterborough only. Try one of these instead:`,'map');
  nav(slug(dist.name));
  const rMi=getR(), period=`${mname(S.months[0])} – ${mname(S.months.at(-1))}`;
  setMeta(`${postcode} · ${ad} — StreetLens`,`A short look at recorded crime within ${rMi===0.5?'½':rMi} mile of ${postcode} (${R.admin_ward?R.admin_ward+', ':''}${ad}).`,location.origin+location.pathname+pcUrl(postcode));
  const [nearLoaded,GP,SC,lr]=await Promise.all([
    loadPointsNear(la,lo,rMi),
    lj('gp').catch(()=>[]),
    lj('schools').catch(()=>[]),
    lj('lsoa_rates').catch(()=>null)
  ]);
  if(gen!==_routeGen)return;
  const nearAll=nearLoaded.filter(p=>inWindow(p,12));
  const cats=S.categories.map(c=>c.id);
  const by={}; nearAll.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1});
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const gps=nearest(GP,la,lo,1)[0], scs=nearest(SC,la,lo,1)[0];
  const code=(R.codes&&(R.codes.lsoa21||R.codes.lsoa))||'';
  const row=lr&&lr.lsoa&&lr.lsoa[code];
  const band=row&&row.band?bandWord(row.band):'–';
  const bandTip=row&&row.rate!=null?`${row.rate} recorded crimes per 1,000 residents in this neighbourhood (approximate).`:'The neighbourhood rate is still loading or could not be matched.';
  app.innerHTML=`<div class="wrap simple-view simple-pc">
    <p class="eyebrow">${ic('pin',16)} ${esc(R.admin_ward||'')}${R.admin_ward?', ':''}${esc(ad)} · ${period}</p>
    <h1>${postcode}</h1>
    <p class="plain-sum" id="plain-sum">In the last 12 months, ${fmt(nearAll.length)} crimes were recorded within ${rLabel(rMi)} of ${esc(postcode)}. Looking up the same radius a year earlier…</p>
    ${moreToggleMarkup()}
    <div class="ctl" style="margin:8px 0 16px">${radiusBar(rMi)}</div>
    <p class="simple-geo"><button type="button" class="chip" id="geo" data-tip="Use your device location to find the nearest Cambridgeshire or Peterborough postcode. Your location is sent only to postcodes.io for that lookup and is not stored.">${ic('loc',18)} Use my location</button> <span class="err" id="serr" role="alert"></span></p>
    <div class="kpis">
      ${kpi('shield','Recorded crimes within '+(rMi===0.5?'½':rMi)+' mile',fmt(nearAll.length),'Last 12 months')}
      ${kpi('map','Neighbourhood band',bandPill(row&&row.band),row&&row.rate!=null?(`${row.rate} per 1,000 residents`):'Approximate band for this neighbourhood')}
    </div>
    <p class="explain">The neighbourhood band is Low, Average or High among Cambridgeshire &amp; Peterborough neighbourhoods. It is an approximate recorded-crime rate, not a safety score — town centres often look higher because visitors are not counted as residents.</p>
    <p class="explain" id="simple-yoy">${dist.yoy!=null?yoyLine(dist.yoy,dist.name):''}</p>
    <div class="card"><h2>Most recorded types</h2>
      ${top.length?`<ol class="simple-types">${top.map(([k,n])=>`<li><b>${esc(cn(k))}</b> <span class="muted">${fmt(n)}</span></li>`).join('')}</ol>`:'<p class="muted">No recorded crimes in this radius in the latest 12 months.</p>'}
    </div>
    <div class="card"><div class="row"><h2>Map</h2></div><div class="simple-map" id="smap" role="region" aria-label="Map of recorded crime near ${esc(postcode)}"></div>
      <p class="muted">Pins are snapped to a public location, so a count is not a precise address tally.</p>
    </div>
    <div class="card" id="about-strip"><h2>About the area</h2>
      <ul class="simple-strip">
        <li><b>Nearest GP</b> ${gps?`${esc(gps[2])} · ${gps.d.toFixed(1)} mi`:'Not found nearby'}</li>
        <li><b>Nearest school</b> ${scs?`${esc(scs[2])} · ${scs.d.toFixed(1)} mi`:'Not found nearby'}</li>
        <li><b>Flood risk</b> <span id="s-flood">Looking up…</span></li>
        <li><b>Broadband</b> <span id="s-bb">Looking up…</span></li>
      </ul>
    </div>
    <div class="card" id="nbhood"><p class="muted">Looking up the local police team…</p></div>
    <p class="muted">Police data is published about two months after each month ends. Distances are straight-line. <a href="method.html">How to read this site</a>.</p>
    ${seeDetailsBtn()}
  </div>`;
  wireSeeDetails();
  maybeHint();
  const geo=$('#geo'); if(geo) geo.onclick=useMyLocation;
  document.querySelectorAll('.rbtn[data-r]').forEach(b=>b.onclick=()=>{setR(parseFloat(b.dataset.r));dashboardSimple(postcode)});
  const u=new URL(location.href);u.search=pcUrl(postcode);history.replaceState(null,'',u);
  loadNeighbourhoodSimple(la,lo,$('#nbhood'));
  const prevP=loadPrevPointsNear(la,lo,rMi);
  wireMore(()=>moreTextPostcode({la,lo,postcode,rMi,nearAll,cats,by,row,dist,prevPromise:prevP,SC,gen}));
  (async()=>{
    try{
      const prev=await prevP;
      if(gen!==_routeGen)return;
      const n=prev&&prev.pts?prev.pts.length:null;
      const sent=radiusCompareSentence(nearAll.length,n,rMi,postcode);
      const el=$('#plain-sum');
      if(sent&&el) el.innerHTML=sent;
      else if(el){
        const fb=dist.yoy!=null?` ${yoyLine(dist.yoy,dist.name)}`:' Looking up the same radius a year earlier was not possible just now.';
        el.innerHTML=`In the last 12 months, ${fmt(nearAll.length)} crimes were recorded within ${rLabel(rMi)} of ${esc(postcode)}.${fb}`;
      }
      if(n!=null&&nearAll.length>=20&&n>=20){
        const ch=(nearAll.length-n)/n*100;
        const yoyEl=$('#simple-yoy');
        if(yoyEl){
          const abs=Math.abs(ch);
          const shown=abs>=10?Math.round(abs):(Math.round(abs*10)/10);
          const dir=abs<0.5?'about the same as':((ch>0?'up ':'down ')+shown+'% on');
          yoyEl.textContent=`In this ${rLabel(rMi)} radius, recorded crime is ${dir} the 12 months before (${fmt(n)} then, ${fmt(nearAll.length)} now).`;
        }
      }
    }catch{
      const el=$('#plain-sum');
      if(el) el.innerHTML=`In the last 12 months, ${fmt(nearAll.length)} crimes were recorded within ${rLabel(rMi)} of ${esc(postcode)}.${dist.yoy!=null?' '+yoyLine(dist.yoy,dist.name):''}`;
    }
  })();
  (async()=>{
    try{
      const ex=await loadAreaExtras(postcode,code);
      if(gen!==_routeGen)return;
      const fl=$('#s-flood'), bb=$('#s-bb');
      if(fl) fl.textContent=ex.fb?bandLabel(ex.fb):'None mapped for rivers and sea';
      if(bb) bb.textContent=ex.gig==null?'Not mapped':(ex.gig+'% of premises can get gigabit broadband'+(ex.secFallback?' (postcode sector)':''));
    }catch{
      const fl=$('#s-flood'), bb=$('#s-bb');
      if(fl) fl.textContent='Not available just now';
      if(bb) bb.textContent='Not available just now';
    }
  })();
  try{
    await ensureLeaflet();
    if(gen!==_routeGen)return;
    if(map){map.remove();map=null}
    map=L.map('smap',{zoomControl:true}).setView([la,lo],rMi<=0.5?15:rMi<=1?14:13);
    osmLayer().addTo(map);
    L.circle([la,lo],{radius:rMi*1609.34,color:'#0f766e',weight:2,fillOpacity:.04}).addTo(map);
    L.marker([la,lo],{icon:L.divIcon({className:'',html:`<div class="pin" style="width:44px;height:44px;background:#14213d">${ic('pin',20)}</div>`,iconSize:[44,44],iconAnchor:[22,22]}),zIndexOffset:1000,keyboard:true,title:postcode}).addTo(map).bindPopup('<b>'+postcode+'</b><br>'+svLink(la,lo,{approx:false}));
    const g=simpleCluster();
    nearAll.forEach(p=>g.addLayer(L.circleMarker([p[0],p[1]],{radius:6,color:'#fff',weight:1.5,fillColor:LAYERS.crimes.c,fillOpacity:.95}) .bindPopup(`<b>${cn(cats[p[2]])}</b><br>${mname(S.months[p[3]])}<br>${svLink(p[0],p[1],{approx:true})}`)));
    map.addLayer(g);
    addStreetViewControl(map);
  }catch{const sm=$('#smap'); if(sm) sm.innerHTML='<p class="muted">The map could not be loaded just now.</p>'}
}

function home(dist){if(isSimple())return homeSimple(dist);
 const a=dist||S.overview,isAll=!dist,period=`${mname(S.months[0])} – ${mname(S.months.at(-1))}`,mv=S.months.map(m=>a.monthly[m]),mAll=(S.monthsAll&&S.monthsAll.length>12)?S.monthsAll:S.months,cs=solveOf(S.overview),as=solveOf(a);
 const price=isAll?null:PR.districts[a.code],cp=countyMedian();
 app.innerHTML=`<section class="hero"><div class="in"><span class="eyebrow">${ic('pin',16)} ${isAll?'Cambridgeshire &amp; Peterborough':'District profile'} · ${period}</span>
 <h1>${isAll?'Know your area before you move, rent or report.':esc(a.name)+': crime, outcomes &amp; homes'}</h1>
 <p class="lead">${isAll?'Police-recorded crime, how often crimes get solved, nearby GPs, dentists, schools, transport and house prices, all for any postcode.':'How '+esc(a.name)+' compares with the rest of the county. Search a postcode for street-level detail.'}</p>${searchBox()}</div></section>
 <div class="wrap lift"><div class="kpis">
 ${kpi('shield','Recorded crimes',fmt(a.total),`12 months · ${fmt(Math.round(a.total/12))} a month`+(a.yoy!=null?` · YoY ${a.yoy>0?'+':''}${a.yoy}%`:''),'Year-on-year compares the latest 12 months with the 12 months before, when available.',spark(mv))}
 ${kpi('people','Per 1,000 residents',a.rate,isAll?'County benchmark':badge(a.rate,S.overview.rate,'county'),'Crimes in 12 months divided by residents (ONS mid-'+S.popYear+'), times 1,000. Busy town centres score higher because visitors are not counted.')}
 ${kpi('check','Solve rate',as.toFixed(1)+'%',isAll?`${fmt(a.outcomes[0]+a.outcomes[1])} crimes resolved`:badge(as,cs,'county',false),'Share of crimes (excluding anti-social behaviour, which has no outcomes) where someone was charged or summonsed, or got an out-of-court resolution such as a caution. Uses the latest recorded outcome.')}
 ${kpi('home','Median house price',price?'£'+fmt(price[0]):'£'+fmt(cp),price?`${badge(price[0],cp,'county',false).replace(/bad|good/,'neu')} ${fmt(price[1])} sales`:'Weighted across districts','Median price of standard residential sales recorded by HM Land Registry, '+PR.from.slice(0,7)+' to '+PR.to.slice(0,7)+'.')}
 </div>
 ${explain((isAll?'Across the county, ':'In '+esc(a.name)+', ')+fmt(a.total)+' crimes were recorded in the latest 12 months, which is '+a.rate+' for every 1,000 residents. Town centres often look higher because visitors are not counted in the population.')}
 ${explain('The solve rate is the share of non-ASB crimes whose latest outcome is a charge, summons or out-of-court resolution. Many cases are still under investigation, especially in recent months.')}
 <div id="ctxhost"></div>
 ${movingPanel(a)}
 ${isAll?`<section class="sec"><div class="sec-h"><div><h2>Districts at a glance</h2><p>Select a district for its full profile.</p></div></div><div class="dcards">${S.districts.map(d=>{const s=solveOf(d);return `<a class="card dcard" href="?${dq(d)}" data-q="${dq(d)}" data-tip="Open the ${d.name} profile."><h3>${d.name} <span aria-hidden="true">→</span></h3>${badge(d.rate,S.overview.rate,'county')}${d.yoy!=null?`<div class="muted" style="font-size:13px;margin:4px 0">YoY ${d.yoy>0?'+':''}${d.yoy}%</div>`:''}<div class="ms"><div>Per 1,000<b>${d.rate}</b></div><div>Solved<b>${s.toFixed(1)}%</b></div><div>Median<b>£${fmt(Math.round(PR.districts[d.code][0]/1000))}k</b></div></div>${spark(S.months.map(m=>d.monthly[m]))}</a>`}).join('')}</div></section>`:''}
 <section class="sec"><div class="sec-h"><div><h2>Crime</h2><p>What is recorded and how it changes month to month.</p></div></div>
 <div class="grid2"><div class="card">${typeTable(a.byType,a.total,'types',a.typeYoy)}</div><div class="card"><div class="row"><h3>Month by month${mAll.length>12?' <span class="muted" style="font-weight:600;font-size:13px">(24 months)</span>':''}</h3><span class="ctl">${csvBtn('monthly',[['Month','Crimes'],...mAll.map(m=>[m,a.monthly[m]||0])],'the monthly counts')}${mAll.length>12?tipI('Uses up to 24 months so you can see the previous year alongside the latest 12. The KPI total above is still the latest 12 months only.'):''}</span></div><div style="height:300px"><canvas id="trend" aria-label="Monthly crime chart"></canvas></div></div></div>
 ${changedCardArea(a,isAll)}
 ${monthHeat(a.monthly,mAll,'Season and year')}
 ${isAll?seasonMarkup({title:'How the year usually moves'}):`<div class="grid2">${typeCompareMarkup()}${seasonMarkup({title:'This year against the county pattern'})}</div>`}
</section>
 <section class="sec"><div class="sec-h"><div><h2>Outcomes &amp; homes</h2><p>How crimes were resolved, and what homes sell for.</p></div></div>
 ${outcomeFunnel(a.outcomes)}
 ${explain('“Charged / resolved” combines a charge or summons with out-of-court results such as a caution. Figures use the latest recorded outcome and can change as cases progress.')}
 <div class="grid2"><div class="card">${outTable(a.outcomes,'out')}</div><div class="card"><div class="row"><h3>House prices</h3>${tipI('Median price of standard residential sales recorded by HM Land Registry in the latest 12 months of data.')}</div>
 <table><thead><tr><th scope="col">Area</th><th class="n" scope="col">Median</th><th class="n" scope="col">Sales</th></tr></thead><tbody>${(isAll?S.districts:[a]).map(d=>`<tr><td>${d.name}</td><td class="n">£${fmt(PR.districts[d.code][0])}</td><td class="n">${fmt(PR.districts[d.code][1])}</td></tr>`).join('')}</tbody></table><p class="muted">${PR.from.slice(0,7)} to ${PR.to.slice(0,7)}</p>
 ${isAll?`<div class="row" style="margin-top:8px"><h3>Crime rate vs median price</h3>${tipI('Each dot is a district: crimes per 1,000 residents against median house price.')}</div><div style="height:240px"><canvas id="scatter" aria-label="Crime rate against house price by district"></canvas></div>`:''}</div></div></section>
 ${isAll?`<section class="sec"><div class="card"><div class="row"><h3>Districts compared</h3><span class="ctl"><a class="tlink" href="?view=league" data-q="view=league">Full league</a> ${csvBtn('districts',[['District','Crimes','Population','Per 1,000','Solve rate %','YoY %','Median price'],...S.districts.map(d=>[d.name,d.total,d.population,d.rate,solveOf(d).toFixed(1),d.yoy==null?'':d.yoy,PR.districts[d.code][0]])],'the district comparison')}${tipI('Districts ranked by crimes per 1,000 residents.')}</span></div>
 <div style="overflow-x:auto"><table><thead><tr><th>District</th><th class="n">Crimes</th><th class="n">Residents</th><th class="n">Per 1,000</th><th class="n">Solved</th><th class="n">YoY</th></tr></thead><tbody>${[...S.districts].sort((x,y)=>y.rate-x.rate).map(d=>`<tr><td><a class="tlink" href="?${dq(d)}" data-q="${dq(d)}" data-tip="Open the ${d.name} profile.">${d.name}</a></td><td class="n">${fmt(d.total)}</td><td class="n">${fmt(d.population)}</td><td class="n">${d.rate}</td><td class="n">${solveOf(d).toFixed(1)}%</td><td class="n">${d.yoy==null?'–':`<span class="yoy ${d.yoy>0?'up':d.yoy<0?'down':''}">${d.yoy>0?'+':''}${d.yoy}%</span>`}</td></tr>`).join('')}</tbody></table></div></div></section>`:''}
 ${isAll?`<section class="sec"><div class="sec-h"><div><h2>Saved areas</h2><p>A short list on this device, plus district feeds if you want a monthly ping in a reader.</p></div></div>${watchPanel()}</section>`:''}
 <section class="sec"><div class="sec-h"><div><h2>Road safety</h2><p>Injury collisions recorded by the police (STATS19): final data for calendar years 2024 and 2025, with provisional January to June 2026 shown separately when available.</p></div>${cardBtn('homecard')}</div><div id="roads"><p class="muted">Loading collision figures…</p></div></section>
 <section class="sec"><div class="sec-h"><div><h2>Most recorded locations</h2><p>Anonymised streets and landmarks where police published the most crimes.</p></div></div><div id="hotspots"><p class="muted">Loading locations…</p></div></section>
 ${openDataBlock(dist)}
 </div>`;
 wireSearch();trendAll($('#trend'),a.monthly,mAll); document.querySelectorAll('.watch-rm').forEach(b=>b.onclick=()=>{watchToggle(b.dataset.pc); home(dist)});
 if($('#season')) drawSeason($('#season'),a.monthly,mAll,isAll?null:S.overview.monthly);
 if($('#tcmp')) drawTypeCompare($('#tcmp'),a.byType,a.total);
 fillHomeExtras(a,isAll);
 fillContextHost(isAll?null:a,isAll);
 const cardh=$('#homecard'); if(cardh) cardh.onclick=()=>downloadCard({title:a.name,where:`${mname(S.months[0])} – ${mname(S.months.at(-1))} · police-recorded crime`,file:slug(a.name),rows:[{lab:'Recorded crimes',val:fmt(a.total),sub:a.yoy==null?'12 months':('YoY '+(a.yoy>0?'+':'')+a.yoy+'%')},{lab:'Per 1,000 residents',val:a.rate,sub:isAll?'County figure':'County '+S.overview.rate},{lab:'Solve rate',val:solveOf(a).toFixed(1)+'%',sub:isAll?'Charged or out-of-court':'County '+solveOf(S.overview).toFixed(1)+'%'}],caveat:'Rates use resident population, so town centres look higher. This card is a snapshot, not a safety score.'});
 const embd=$('#emb-d'); if(embd) embd.onclick=()=>showEmbed('d',slug(a.name));if(isAll){chartTheme();charts.push(new Chart($('#scatter'),{type:'scatter',data:{datasets:[{data:S.districts.map(d=>({x:PR.districts[d.code][0],y:d.rate,n:d.name})),backgroundColor:css('--teal'),pointRadius:8,pointHoverRadius:10}]},options:{animation:reduce?false:undefined,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw.n}: £${fmt(c.raw.x)}, ${c.raw.y} per 1,000`}}},scales:{x:{title:{display:true,text:'Median house price (£)'},ticks:{callback:v=>'£'+v/1000+'k'}},y:{beginAtZero:true,title:{display:true,text:'Crimes per 1,000'}}}}}))}}
function countyMedian(){let n=0,s=0;S.districts.forEach(d=>{const p=PR.districts[d.code];s+=p[0]*p[1];n+=p[1]});return Math.round(s/n/1000)*1000}
/* ---------- states ---------- */
function stateView(title,msg,icon='alert'){app.innerHTML=`<div class="wrap"><div class="card state"><div class="big-ico">${ic(icon,30)}</div><h1>${title}</h1><p>${msg}</p>${searchBox()}</div></div>`;
 const q=$('.state .qrow');wireSearch();setMeta(title+' — StreetLens', typeof msg==='string'?stripHtml(msg).slice(0,160):'StreetLens area search.',location.href)}
function skeleton(pc){app.innerHTML=`<div class="sumbar"><div class="wrap"><h1>${esc(pc)}</h1><div class="schips">${'<div class="sk" style="width:150px;height:44px"></div>'.repeat(5)}</div></div></div>
 <div class="dash" aria-busy="true"><div class="mapcol"><div class="sk" style="height:44px;width:70%"></div><div class="mapbox sk"></div></div><div class="panel"><div class="sk" style="height:56px"></div>${'<div class="sk" style="height:140px;margin-top:16px"></div>'.repeat(3)}</div></div>`}
/* ---------- postcode dashboard ---------- */


function compareView(a,b){
 {const cu=location.origin+location.pathname+'?compare=1'+(a?'&a='+encodeURIComponent(a):'')+(b?'&b='+encodeURIComponent(b):''); setMeta((a&&b)?`${a} vs ${b} — StreetLens`:'Compare postcodes — StreetLens',(a&&b)?`Side-by-side crime, solve rate and LSOA band for ${a} and ${b}.`:'Compare crime, outcomes and local services for two Cambridgeshire postcodes.',cu);} 
 const box=(id,ph)=>`<div class="ccol"><form class="search cform" data-side="${id}"><div class="sbox">${ic('search',20)}<input name="pc" aria-label="Postcode ${id}" placeholder="${ph}" value="${esc(id==='a'?(a||''):(b||''))}"><button class="btn">Go</button></div></form><div class="cbody" id="c-${id}"><p class="muted">Enter a postcode.</p></div></div>`;
 app.innerHTML=`<div class="wrap"><section class="sec"><div class="sec-h"><div><h1>Compare two postcodes</h1><p>Same radius and time window on both sides. Share with <code>?compare=1&a=PE29+3TN&b=CB2+1TN</code>.</p></div>
  <div class="ctl">${radiusBar(getR())}${windowBar(getW())}<button class="btn ghost" id="cswap" type="button">Swap</button></div></div>
  <div class="compare">${box('a','e.g. PE29 3TN')}${box('b','e.g. CB2 1TN')}</div>
  <div id="corridor" style="margin-top:18px"></div>
  <p class="muted">The line comparison, when both postcodes are loaded, counts crimes within 250 metres of the straight line between them — not a driving route. <a href="method.html">How to read these figures</a></p></section></div>`;
 document.querySelectorAll('.rbtn[data-r]').forEach(btn=>btn.onclick=()=>{setR(parseFloat(btn.dataset.r));compareView(a,b)});
 document.querySelectorAll('.rbtn[data-w]').forEach(btn=>btn.onclick=()=>{setW(parseInt(btn.dataset.w,10));compareView(a,b)});
 $('#cswap').onclick=()=>go('compare=1&a='+encodeURIComponent(b||'')+'&b='+encodeURIComponent(a||''));
 document.querySelectorAll('.cform').forEach(f=>f.onsubmit=e=>{e.preventDefault();const v=new FormData(f).get('pc').trim().toUpperCase();const side=f.dataset.side;
  const na=side==='a'?v:(a||''); const nb=side==='b'?v:(b||''); go('compare=1&a='+encodeURIComponent(na)+'&b='+encodeURIComponent(nb))});
 _cmp.a=_cmp.b=null; if(a)fillCompare('a',a); if(b)fillCompare('b',b)}
async function fillCompare(side,raw){const el=$('#c-'+side); el.innerHTML='<div class="sk" style="height:180px"></div>';
 const pcq=raw.replace(/\s+/g,'').toUpperCase(); let r; try{r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq)).then(x=>x.json())}catch{el.innerHTML='<p class="muted">Lookup failed.</p>';_cmp[side]=null;maybeCorridor();return}
 if(!r||r.status!=200){el.innerHTML='<p class="muted">Postcode not found.</p>';_cmp[side]=null;maybeCorridor();return}
 const R=r.result,{latitude:la,longitude:lo,postcode}=R,ad=R.admin_district,dist=S.districts.find(d=>d.name==ad);
 if(!dist){el.innerHTML=`<p class="muted">${esc(postcode)} is outside Cambridgeshire &amp; Peterborough.</p>`;_cmp[side]=null;maybeCorridor();return}
 const rMi=getR(),w=getW(); const near= (await loadPointsNear(la,lo,rMi)).filter(p=>inWindow(p,w));
 const cats=S.categories.map(c=>c.id),by={},oc=[0,0,0,0,0,0,0]; near.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1;oc[p[4]]++});
 const nonAsb=near.length-oc[6],solve=nonAsb?(oc[0]+oc[1])/nonAsb*100:null;
 const busiest=Object.entries(by).sort((x,y)=>y[1]-x[1])[0];
 let lsoaHtml=''; try{const lr=await lj('lsoa_rates'); const row=lr.lsoa[R.codes&&(R.codes.lsoa21||R.codes.lsoa)]; if(row&&row.rate!=null) lsoaHtml=`<div>LSOA rate <b>${row.rate}</b> <span class="badge ${row.band==='Low'?'good':row.band==='High'?'bad':'neu'}">${row.band}</span>${row.pct!=null?`<div class="muted">Lower recorded rate than ${row.pct}% of local neighbourhoods</div>`:''}</div>`}catch{}
 el.innerHTML=`<h2><a class="tlink" href="?pc=${encodeURIComponent(postcode)}" data-q="pc=${encodeURIComponent(postcode)}">${postcode}</a></h2>
  <div class="where">${esc(R.admin_ward||'')}${R.admin_ward?', ':''}${esc(ad)}</div>
  <div class="ms" style="margin-top:12px">
   <div>Crimes ${rMi} mi · ${w} mo<b>${fmt(near.length)}</b></div>
   <div>Solved<b>${solve==null?'–':solve.toFixed(0)+'%'}</b></div>
   <div>District rate<b>${dist.rate}</b></div>
  </div>
  ${lsoaHtml}
  <p class="muted" style="margin-top:10px">Most common: ${busiest?cn(busiest[0])+' ('+fmt(busiest[1])+')':'–'}</p>
  <p><a class="btn ghost" href="?pc=${encodeURIComponent(postcode)}" data-q="pc=${encodeURIComponent(postcode)}">Open full dashboard</a></p>`;
 _cmp[side]={la,lo,postcode}; maybeCorridor()}

const LAYERS={crimes:{n:'Crimes',c:'#f59e0b',i:'shield',t:'Crime points within the chosen radius, clustered. Colour: amber.'},collisions:{n:'Collisions',c:'#c2410c',i:'car',t:'Personal-injury road collisions (DfT STATS19, 2024–2025 final plus provisional Jan–Jun 2026, labelled) within the radius. Red is fatal, orange serious, slate slight. Not crime snap points.'},gp:{n:'GPs',c:'#e11d48',i:'heart',t:'GP surgeries within 5 miles (NHS ODS). Colour: red.'},dent:{n:'Dentists',c:'#7c3aed',i:'tooth',t:'Dental practices within 5 miles (NHS ODS). Colour: purple.'},sch:{n:'Schools',c:'#16a34a',i:'school',t:'Open schools within 5 miles with phase and Ofsted grade (DfE GIAS, Ofsted). Colour: green.'},bus:{n:'Bus stops',c:'#2563eb',i:'bus',t:'Bus stops within 3 miles (NaPTAN), clustered. Colour: blue.'},rail:{n:'Rail',c:'#334155',i:'train',t:'Railway stations (NaPTAN). Colour: slate.'},heat:{n:'Heat columns',c:'#dc2626',i:'chart',t:'3D only: crimes counted in 200m squares within the chosen radius and drawn as columns. Taller and redder means more crimes. Turning this on switches to 3D.'},park:{n:'Parks',c:'#15803d',i:'park',t:'Parks, playing fields, play spaces and similar sites from OS Open Greenspace (centroids). Colour: green.'}};
async function dashboard(raw){if(isSimple())return dashboardSimple(raw);
 const pcq=raw.replace(/\s+/g,'').toUpperCase();skeleton(raw.toUpperCase());
 let r;try{r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq)).then(r=>r.json())}catch{return stateView('Could not reach the postcode service','Check your connection and try again.')}
 if(!r||r.status!=200){let sug=[];try{sug=(await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq.slice(0,-1))+'/autocomplete?limit=4').then(x=>x.json())).result||[]}catch{}
  return stateView(`We couldn't find “${esc(raw)}”`,'Check the postcode is complete and spelled correctly, for example PE29 3TN.'+(sug.length?' Did you mean: '+sug.map(s=>`<a href="?pc=${encodeURIComponent(s)}" data-q="pc=${encodeURIComponent(s)}">${s}</a>`).join(', ')+'?':''),'search')}
 const R=r.result,{latitude:la,longitude:lo,postcode}=R,ad=R.admin_district,dist=S.districts.find(d=>d.name==ad);
 if(!dist)return stateView(`${postcode} is outside our area`,`${esc(postcode)} is in ${esc(ad||'an unknown area')}. StreetLens currently covers Cambridgeshire and Peterborough only. Try one of these instead:`,'map');
 nav(slug(dist.name));
 const rMi=getR(),w=getW(),wm=wMonths(w),degPad=rMi*0.02;
 setMeta(`${postcode} · ${ad} — StreetLens`,`Crime, outcomes, schools and homes within ${rMi===0.5?'½':rMi} mile${rMi===1?'':'s'} of ${postcode} (${R.admin_ward?R.admin_ward+', ':''}${ad}), ${wLabel(w)}.`,location.origin+location.pathname+pcUrl(postcode));
 const [nearLoaded]=await Promise.all([loadPointsNear(la,lo,rMi)]);
 let GP=[],DE=[],SC=[],ST=[],RA=[],SS=[],GS=[],HS=null,CO=null;
 const nearAll=nearLoaded.filter(p=>inWindow(p,w));
 const cats=S.categories.map(c=>c.id);let tf=getTypeFilter();
 const near=(!tf||tf.size===S.categories.length)?nearAll:nearAll.filter(p=>tf.has(cats[p[2]]));
 const by={},mon={},oc=[0,0,0,0,0,0,0];wm.forEach(m=>mon[m]=0);nearAll.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1;mon[S.months[p[3]]]++;oc[p[4]]++});
 const nonAsb=nearAll.length-oc[6],pos=oc[0]+oc[1],solve=nonAsb?pos/nonAsb*100:null,cs=solveOf(S.overview),ds=solveOf(dist);
 let nearSS=[],ssN=0; const sector=postcode.slice(0,-2).trim(),sp=PR.sectors[sector],dp=PR.districts[dist.code];
 let st500='…',rails=[],gps=[],des=[],scs=[],busN=[],parks=[];
 const n250=(lat,lon)=>nearAll.filter(c=>hav(lat,lon,c[0],c[1])<=0.1553).length;
 const busiest=Object.entries(by).sort((a,b)=>b[1]-a[1])[0],mv=wm.map(m=>mon[m]||0);
 let nearSpots=[],nearCO=[],nearProv=[],provRow=null,coRow={n:0,fatal:0,serious:0,slight:0,cas:0};
 let extrasApplied=false, buildExtraLayers=null;
 function applyExtras(){
  extrasApplied=true;
  nearSS=ssNear(SS,la,lo,rMi,w); ssN=nearSS.length;
  st500=ST.filter(p=>Math.abs(p[0]-la)<.01&&hav(la,lo,p[0],p[1])<=0.3107).length;
  rails=nearest(RA,la,lo,3); gps=nearest(GP,la,lo,3); des=nearest(DE,la,lo,3);
  scs=nearest(SC,la,lo,5); busN=nearest(ST,la,lo,3); parks=nearest(GS||[],la,lo,5);
  nearSpots=HS&&HS.spots?HS.spots.map(s=>{const d=hav(la,lo,s[0],s[1]);return d<=rMi?Object.assign([...s],{d}):null}).filter(Boolean).sort((a,b)=>b[2]-a[2]):[];
  nearCO=CO&&CO.points?CO.points.filter(p=>hav(la,lo,p[0],p[1])<=rMi):[];
  coRow={n:nearCO.length,fatal:nearCO.filter(p=>p[2]===1).length,serious:nearCO.filter(p=>p[2]===2).length,slight:nearCO.filter(p=>p[2]===3).length,cas:nearCO.reduce((s,p)=>s+(p[4]||0),0)};
  provRow=provNear(CO,la,lo,rMi);
  nearProv=provRow?provRow.pts.map(p=>[p[0],p[1],p[2],'Jan–Jun '+CO.prov.meta.year+' (provisional)',p[3]]):[];
 }
 // typical 1-mile count across all points in district is costly; compare with district density via share of district crime per sq mile is misleading, so compare with county median of 1-mile counts is skipped. Use district/county rates for context.
 const nl=(arr,key,meta)=>`<ol class="near">${arr.map((x,k)=>`<li><span class="ico" style="background:${LAYERS[key].c}">${ic(LAYERS[key].i,18)}</span><b>${esc(x[2])}</b><span class="d">${x.d.toFixed(1)} mi</span><span class="m">${meta(x)}${(key==='sch'||key==='rail')?`<br>${svLink(x[0],x[1])}`:''}</span></li>`).join('')}</ol>`;
 const schip=(icon,lab,val,tab,t)=>`<button class="schip" data-go="${tab}" data-tip="${esc(t)}">${ic(icon,18)}<span>${lab}</span><b>${val}</b></button>`;
 app.innerHTML=`<div class="sumbar"><div class="wrap"><div><h1>${postcode}</h1><div class="where">${esc(R.admin_ward||'')}${R.admin_ward?', ':''}${esc(ad)}</div></div>
 <div class="schips">${schip('shield','Crimes '+ (rMi===0.5?'½':rMi) +' mi',fmt(nearAll.length),'crime','Crimes recorded within '+rMi+' mile(s) in '+wLabel(w)+'. Open the Crime tab.')}
 ${schip('people','District rate',dist.rate+' <small>vs '+S.overview.rate+'</small>','crime',`${ad}: ${dist.rate} crimes per 1,000 residents against a county figure of ${S.overview.rate}.`)}
 ${schip('check','Solved',solve==null?'–':solve.toFixed(0)+'%','out','Solve rate for crimes within '+rMi+' mile(s). Open the Outcomes tab.')}
 ${schip('home','Median',sp?'£'+fmt(Math.round(sp[0]/1000))+'k':'–','homes','Median sale price in postcode sector '+sector+'. Open the Homes tab.')}
 ${schip('heart','GP','…','health','Nearest GP surgery. Open the Health tab.')}
 ${schip('school','School','…','schools','Nearest school. Open the Schools tab.')}
 ${schip('train','Station','…','transport','Nearest rail station. Open the Transport tab.')}
 ${schip('depr','IMD','…','police','Index of Multiple Deprivation for this neighbourhood. Opens the Police / area tab.')}
 ${schip('flood','Flood','…','police','Rivers and sea flood risk for this postcode.')}
 ${schip('wifi','BB','…','police','Broadband availability.')}
 ${parks[0]?schip('park','Park',parks[0].d.toFixed(1)+' mi','transport','Nearest park or playing field (OS Open Greenspace): '+parks[0][2]+'.'):''}</div>
 <button class="btn ghost" id="share" type="button" aria-label="Share this dashboard" data-tip="Copy a link to this dashboard so you can share it.">${ic('share',18)}<span class="sl">Share</span></button>
 <button class="btn ghost" id="printb" type="button" aria-label="Print a one-page area briefing" data-tip="Print a one-page area briefing for this postcode.">${ic('dl',18)}<span class="sl">Print</span></button> <button class="btn ghost" id="watchb" type="button" aria-label="Save this area on this device" aria-pressed="${watchHas(postcode)}" data-tip="Save this postcode on this device so you can reopen it from the overview. It is not an official alert.">${ic('save',18)}<span class="sl">${watchHas(postcode)?'Saved':'Save area'}</span></button> <button class="btn ghost" id="embedb" type="button" aria-label="Get an embed snippet" data-tip="Get a short snippet to embed this profile on a page you control.">${ic('code',18)}<span class="sl">Embed</span></button> ${cardBtn('cardb')}</div></div>
 <aside class="briefing" id="briefing"><h2>Area briefing · ${postcode}</h2>
  <p>${esc(R.admin_ward||'')}${R.admin_ward?', ':''}${esc(ad)} · ${rMi===0.5?'½':rMi} mile radius · ${wLabel(w)} (${mname(wm[0])} – ${mname(wm.at(-1))})</p>
  <ul>
   <li>Recorded crimes in the radius: ${fmt(nearAll.length)}${busiest?' (most common: '+cn(busiest[0])+')':''}</li>
   <li>Solve rate: ${solve==null?'–':solve.toFixed(1)+'%'} (${fmt(pos)} of ${fmt(nonAsb)} non-ASB)</li>
   <li>Charged / resolved ${fmt(oc[0]+oc[1])} · No suspect ${fmt(oc[2])} · Still investigating ${fmt(oc[4])}</li>
   <li>${ad} rate ${dist.rate} per 1,000${dist.yoy==null?'':'; year-on-year '+((dist.yoy>0?'+':'')+dist.yoy+'%')} (county ${S.overview.rate}, YoY ${S.overview.yoy==null?'–':((S.overview.yoy>0?'+':'')+S.overview.yoy+'%')})</li>
   <li id="brief-x">Flood, broadband and deprivation load below.</li>
   <li id="brief-pct"></li>
   <li id="brief-hot">${nearSpots[0]?('Most recorded location: '+esc(spotName(nearSpots[0]))+' ('+fmt(spotN(nearSpots[0]))+' crimes in 12 months).'):''}</li>
   <li id="brief-co">Injury collisions within the radius, 2024–2025: ${fmt(coRow.n)} (${fmt(coRow.fatal)} fatal, ${fmt(coRow.serious)} serious).${provRow&&CO&&CO.prov?` Provisional ${CO.prov.meta.label}: ${fmt(provRow.n)}.`:''}</li>
  </ul></aside>
 <div class="dash"><div class="mapcol"><div class="maptools">${radiusBar(rMi)}${windowBar(w)}${typeFilterBar(by,tf)}</div><div class="layers" role="group" aria-label="Map layers">${Object.entries(LAYERS).map(([k,v])=>`<label class="lt" style="color:${v.c}" data-tip="${esc(v.t)}"><input type="checkbox" data-l="${k}" ${k=='crimes'?'checked':''}><span class="dot" style="background:${v.c}">${ic(v.i,13)}</span><span class="t">${v.n}</span></label>`).join('')}</div>
 <div class="mapbox" id="mapbox"><div id="map" role="region" aria-label="Map of ${postcode} and surroundings"></div>
 <div class="mapctl"><button id="fs" aria-label="Full screen map" data-tip="Expand the map to full screen. Press Esc or tap again to exit.">${ic('expand')}</button><button id="mode3d" aria-pressed="false" aria-label="Switch to 3D map" data-tip="Switch between the flat 2D map and a tilted 3D view with extruded buildings. In 3D, drag with two fingers or right-click to tilt and rotate.">3D</button><button id="recentre" aria-label="Recentre map" data-tip="Return the map to ${postcode} and the search area.">${ic('target')}</button><button type="button" id="sv-btn" class="sv-btn" aria-label="Open Street View at the current map centre" title="Open Google Street View at the centre of the map, in a new tab. Imagery is Google’s and may be dated. No imagery is embedded on this page.">${ic('sv',16)} Street View</button></div>
 <div class="legend" aria-label="Map legend"><span><i style="background:#0f766e;border-radius:0;height:3px;width:14px;box-shadow:none;border:0"></i>${rMi===0.5?'½':rMi} mi area</span>${Object.values(LAYERS).map(v=>`<span><i style="background:${v.c}"></i>${v.n}</span>`).join('')}</div></div>
 <p class="muted map-alt"><a href="#maptable">View these crimes as a table</a></p></div>
 <div class="panel"><div class="tabs" role="tablist" aria-label="Area topics">${[['crime','Crime','shield'],['out','Outcomes','gavel'],['health','Health','heart'],['schools','Schools','school'],['transport','Transport','bus'],['homes','Homes','home'],['police','Police','people']].map(([k,n,i],x)=>`<button class="tab" role="tab" id="t-${k}" aria-controls="p-${k}" aria-selected="${!x}" tabindex="${x?-1:0}">${ic(i,17)}${n}</button>`).join('')}</div>
 <section class="tp" role="tabpanel" id="p-crime" aria-labelledby="t-crime">
  <h2 class="sr-only">Crime</h2>
  <div class="mini">${kpi('shield','Within '+(rMi===0.5?'½':rMi)+' mi',fmt(nearAll.length),busiest?'Most common: '+cn(busiest[0]):'','Crimes recorded within '+rMi+' mile(s) of '+postcode+' over '+wLabel(w)+'.',spark(mv,'#f59e0b'))}
  ${kpi('people',ad+' rate',dist.rate+' / 1,000',badge(dist.rate,S.overview.rate,'county'),'District crimes per 1,000 residents compared with the county.')}
  ${kpi('map','LSOA rate','…','Loading neighbourhood rate','Crimes per 1,000 in this Lower Super Output Area (approx). Band is relative to Cambridgeshire & Peterborough.')}</div>
  ${explain('These are police-recorded crimes whose anonymised pin falls within '+(rMi===0.5?'½':rMi)+' mile of '+esc(postcode)+' in '+wLabel(w)+'. Pins are snapped to a public location, so a count is not a precise address tally.')}
  <div id="lsoa-explain"></div>
  <div class="card">${typeTable(by,nearAll.length||1,'near')}</div>
  <div class="card"><div class="row"><h3>Month by month</h3><span class="ctl">${csvBtn('nearmonthly',[['Month','Crimes within radius'],...wm.map(m=>[m,mon[m]||0])],'the monthly counts')}${tipI('Crimes recorded each month within the chosen radius of this postcode.')}</span></div><div style="height:220px"><canvas id="trend"></canvas></div></div>
  <div class="card"><div class="row"><h3>Top crime types over time</h3>${tipI('The four most common crime types within the radius, month by month.')}</div><div style="height:220px"><canvas id="typetrend" aria-label="Crime type trends"></canvas></div></div>
  ${changedCardNear(nearAll,cats,rLabel(rMi))}
  ${monthHeat(mon,wm,'Year at a glance')}
  ${typeCompareMarkup()}
  ${seasonMarkup({title:'This year against the county pattern'})}
  <div id="hot-slot"><p class="muted">Loading frequent locations…</p></div>
  ${crimeTable(near,cats,wm)}
  <div class="card" id="nearby"><p class="muted">Looking for nearby neighbourhoods…</p></div>
  <div class="card" id="nearcmp" hidden></div></section>
 <section class="tp" role="tabpanel" id="p-out" aria-labelledby="t-out" hidden>
  <h2 class="sr-only">Outcomes</h2>
  <div class="mini">${kpi('check','Solve rate near you',solve==null?'–':solve.toFixed(1)+'%',`${fmt(pos)} of ${fmt(nonAsb)} crimes ${solve==null?'':badge(solve,cs,'county',false)}`,'Share of crimes within the chosen radius (excluding anti-social behaviour, which has no outcomes) where someone was charged or summonsed, or got an out-of-court resolution such as a caution or community resolution. Recent crimes may still be under investigation.')}
  ${kpi('hand','Stop and searches',fmt(ssN),'Within radius, '+wLabel(w),'Police stop and searches recorded with a location within the chosen radius and time window.')}
  ${kpi('gavel','Charged / resolved',fmt(oc[0]+oc[1]),((nonAsb?(oc[0]+oc[1])/nonAsb*100:0).toFixed(0))+'% of non-ASB','Charged/summonsed plus out-of-court resolutions within the radius.')}
  ${kpi('people','No suspect',fmt(oc[2]),((nonAsb?oc[2]/nonAsb*100:0).toFixed(0))+'% of non-ASB','Crimes closed with no suspect identified.')}
  ${kpi('alert','Still investigating',fmt(oc[4]),((nearAll.length?oc[4]/nearAll.length*100:0).toFixed(0))+'% of all','Latest outcome still under investigation or awaiting update. Newer months tend to look higher.')}</div>
  <div class="card"><div class="row"><h3>How outcomes move month by month</h3>${tipI('For crimes within the chosen radius. ASB has no outcome and is left out of these lines. “Charged / resolved” combines charged/summonsed and out-of-court resolutions.')}</div>
  <div style="height:240px"><canvas id="outtrend" aria-label="Monthly outcome trends"></canvas></div></div>
  ${outcomeFunnel(oc)}
  ${explain('“Charged / resolved” combines a charge or summons with out-of-court results such as a caution. “No suspect” means the case was closed without identifying someone. Figures use the latest recorded outcome and can change.')}
  <div class="card">${outTable(oc,'nearout')}</div><p class="muted">District solve rate ${ds.toFixed(1)}% · county ${cs.toFixed(1)}%. Recent months often show more cases still under investigation.</p>
  <div id="ss-slot"><p class="muted">Loading stop and search…</p></div></section>
 <section class="tp" role="tabpanel" id="p-health" aria-labelledby="t-health" hidden>
  <h2 class="sr-only">Health</h2>
  <div class="card"><div class="row"><h3>Nearest GP surgeries</h3>${tipI('Active GP practices from the NHS Organisation Data Service, by straight-line distance.')}</div><div id="near-gp"><p class="muted">Loading…</p></div></div>
  <div class="card"><div class="row"><h3>Nearest dentists</h3>${tipI('Active dental practices from the NHS Organisation Data Service. Check with the practice whether it takes new NHS patients.')}</div><div id="near-dent"><p class="muted">Loading…</p></div></div></section>
 <section class="tp" role="tabpanel" id="p-schools" aria-labelledby="t-schools" hidden>
  <h2 class="sr-only">Schools</h2>
  <div class="card"><div class="row"><h3>Nearest schools</h3>${tipI('Open schools from DfE Get Information about Schools. The grade is the latest Ofsted overall effectiveness, from a graded inspection or an ungraded check that confirmed the grade. Single-word grades stopped in September 2024. The 250m crime count uses the same time window as the dashboard. Pins are snapped to a public location, so this is not a tally of incidents on the school site.')}</div><div id="near-sch"><p class="muted">Loading schools…</p></div><p class="muted">Crime pins are snapped to a public location, so a count within 250m of a school is not a count of incidents on the school site. The time window matches the dashboard.</p></div></section>
 <section class="tp" role="tabpanel" id="p-transport" aria-labelledby="t-transport" hidden>
  <h2 class="sr-only">Transport</h2>
  <div id="coll-slot"></div>
  <div class="mini" id="trans-kpis">${kpi('bus','Bus stops within 500m','…','From the NaPTAN stop register','Active bus stops within 500 metres of the postcode.')}${kpi('train','Nearest station','…','Loading…','Nearest National Rail station by straight-line distance.')}</div>
  <div class="card"><div class="row"><h3>Nearest rail stations</h3>${tipI('National Rail stations by straight-line distance. The 250m crime count uses the same time window as the dashboard. Pins are snapped to a public location, so this is not a tally of incidents inside the station.')}</div><div id="near-rail"><p class="muted">Loading stations…</p></div><p class="muted">Crime pins are snapped to a public location, so a count within 250m of a station is not a count of incidents on the station site.</p></div>
  <div class="card"><div class="row"><h3>Nearest bus stops</h3></div><div id="near-bus"><p class="muted">Loading bus stops…</p></div></div></section>
 <section class="tp" role="tabpanel" id="p-homes" aria-labelledby="t-homes" hidden>
  <h2 class="sr-only">Homes</h2>
  <div class="mini">${kpi('home','Median price, '+sector,sp?'£'+fmt(sp[0]):'–',sp?`${fmt(sp[1])} sales ${badge(sp[0],dp[0],ad,false).replace(/bad|good/,'neu')}`:'No sales recorded','Median price of standard residential sales in this postcode sector, HM Land Registry Price Paid Data.')}
  ${kpi('chart',ad+' median','£'+fmt(dp[0]),fmt(dp[1])+' sales','District median for comparison.')}</div>
  <p class="muted">Sales from ${PR.from.slice(0,7)} to ${PR.to.slice(0,7)}. Standard residential sales only; excludes repossessions and transfers.</p>
  <div id="ctxhost"></div></section>
 <section class="tp" role="tabpanel" id="p-police" aria-labelledby="t-police" hidden>
  <h2 class="sr-only">Police</h2>
  <div class="card"><div class="row"><h3>Area context</h3>${tipI("Deprivation, flood risk and broadband for this postcode or its LSOA.")}</div><div id="areax"><p class="muted">Loading…</p></div></div>
  <div id="ctxhost"></div>
  <div class="card" id="nbhood"><p class="muted">Loading neighbourhood team…</p></div>
  <div class="card"><div class="row"><h3>Official local messages</h3></div><p>StreetLens is not an alerting service. For official messages from Cambridgeshire Constabulary, including community updates, use <a href="https://www.ecops.org.uk/" target="_blank" rel="noopener">eCops</a> (the force’s Neighbourhood Alert scheme).</p></div>
  <p class="muted"><a href="method.html">How to read these figures</a></p></section>
 </div></div>`;
 // tabs
 const tabs=[...document.querySelectorAll('.tab')];const sel=t=>{tabs.forEach(b=>{const on=b===t;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;$('#'+b.getAttribute('aria-controls')).hidden=!on});
  const lay={health:['gp','dent'],schools:['sch'],transport:['bus','rail']}[t.id.slice(2)];if(lay)lay.forEach(l=>{const c=document.querySelector(`input[data-l=${l}]`);if(!c.checked){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}})};
 tabs.forEach((b,i)=>{b.onclick=()=>sel(b);b.onkeydown=e=>{const k={ArrowRight:1,ArrowLeft:-1}[e.key];if(k){const n=tabs[(i+k+tabs.length)%tabs.length];sel(n);n.focus();e.preventDefault()}}});
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const t=$('#t-'+b.dataset.go);sel(t);t.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'});t.focus({preventScroll:true})});
 $('#printb')&&($('#printb').onclick=()=>window.print());
 const watchb=$('#watchb'); if(watchb) watchb.onclick=()=>{watchToggle(postcode,(R.admin_ward||'')+(R.admin_ward?', ':'')+ad); const on=watchHas(postcode); watchb.setAttribute('aria-pressed',on); const sl=watchb.querySelector('.sl'); if(sl) sl.textContent=on?'Saved':'Save area'};
 $('#embedb')&&($('#embedb').onclick=()=>showEmbed('pc',postcode));
 $('#cardb')&&($('#cardb').onclick=()=>downloadCard({title:postcode,where:`${R.admin_ward?R.admin_ward+', ':''}${ad} · ${rMi===0.5?'½':rMi} mi · ${wLabel(w)} (${mname(wm[0])} – ${mname(wm.at(-1))})`,file:postcode.toLowerCase().replace(/\s+/g,'-'),rows:[{lab:'Crimes in radius',val:fmt(nearAll.length),sub:busiest?cn(busiest[0]):''},{lab:'Solve rate',val:solve==null?'–':solve.toFixed(0)+'%',sub:ad+' rate '+dist.rate},{lab:'Top location',val:nearSpots[0]?fmt(spotN(nearSpots[0])):'–',sub:nearSpots[0]?spotName(nearSpots[0]):'12-month snap points'},{lab:'Injury collisions',val:fmt(coRow.n),sub:'2024–2025 · STATS19'}]}));
 document.querySelectorAll('.hot-go').forEach(b=>b.onclick=()=>{const lat=+b.dataset.lat,lon=+b.dataset.lon; if(is3d()&&typeof m3!=='undefined'&&m3)m3.flyTo({center:[lon,lat],zoom:16,duration:reduce?0:800}); else if(map){map.setView([lat,lon],16); L.popup().setLatLng([lat,lon]).setContent('<b>'+esc(b.textContent)+'</b>').openOn(map)}});
 $('#share').onclick=async()=>{const url=location.origin+location.pathname+pcUrl(postcode);try{if(navigator.share&&touch)await navigator.share({title:'StreetLens: '+postcode,url});else{await navigator.clipboard.writeText(url);$('#share').innerHTML=ic('check',18)+'<span class="sl">Copied</span>'}}catch{}};
 document.querySelectorAll('.rbtn[data-r]').forEach(b=>b.onclick=()=>{setR(parseFloat(b.dataset.r));window._keep=snapState();dashboard(postcode)});
 document.querySelectorAll('.rbtn[data-w]').forEach(b=>b.onclick=()=>{setW(parseInt(b.dataset.w,10));window._keep=snapState();dashboard(postcode)});
 document.querySelectorAll('.tchip').forEach(b=>b.onclick=()=>{let cur=getTypeFilter()||new Set(S.categories.map(c=>c.id));
  if(b.dataset.tf==='all'){setTypeFilter(null)}else{const id=b.dataset.tf;if(cur.has(id)&&cur.size>1)cur.delete(id);else cur.add(id);if(cur.size===S.categories.length)setTypeFilter(null);else setTypeFilter(cur)}
  window._keep=snapState();dashboard(postcode)});
 loadNeighbourhood(la,lo,$('#nbhood'));
 (async()=>{
  try{
   const pack=await Promise.all(['gp','dentists','schools','stops','rail','stopsearch'].map(lj).concat([lj('greenspace').catch(()=>[]), lj('hotspots').catch(()=>null), lj('collisions').catch(()=>null)]));
   if(window._ctx&&window._ctx.postcode!==postcode)return;
   GP=pack[0]||[];DE=pack[1]||[];SC=pack[2]||[];ST=pack[3]||[];RA=pack[4]||[];SS=pack[5]||[];GS=pack[6]||[];HS=pack[7];CO=pack[8];
   applyExtras();
   window._ctx={la,lo,postcode,near,nearAll,cats,rMi,w,GP:within0(GP,la,lo,5),DE:within0(DE,la,lo,5),SC:within0(SC,la,lo,5),ST:within0(ST,la,lo,3),RA:within0(RA,la,lo,15),GS:within0(GS||[],la,lo,5),CO:nearCO.concat(nearProv)};
   const chipUp0=(lab,val,tip)=>{const b=[...document.querySelectorAll('.schip')].find(x=>x.textContent.includes(lab));if(!b)return;const bb=b.querySelector('b');if(bb)bb.innerHTML=val;if(tip)b.setAttribute('data-tip',tip)};
   if(gps[0]) chipUp0('GP',gps[0].d.toFixed(1)+' mi','Nearest GP: '+gps[0][2]+'. Open the Health tab.'); else chipUp0('GP','–');
   if(scs[0]) chipUp0('School',scs[0].d.toFixed(1)+' mi','Nearest school: '+scs[0][2]+'. Open the Schools tab.'); else chipUp0('School','–');
   if(rails[0]) chipUp0('Station',rails[0].d.toFixed(1)+' mi','Nearest rail station: '+rails[0][2]+'. Open the Transport tab.'); else chipUp0('Station','–');
   if(parks[0]){
     const host=document.querySelector('.schips');
     if(host&&![...host.querySelectorAll('.schip')].some(x=>x.textContent.includes('Park'))){
       host.insertAdjacentHTML('beforeend', schip('park','Park',parks[0].d.toFixed(1)+' mi','transport','Nearest park or playing field (OS Open Greenspace): '+parks[0][2]+'.'));
       host.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const t=$('#t-'+b.dataset.go);if(t){sel(t);t.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'});t.focus({preventScroll:true})}});
     }
   }
   const put=(id,html)=>{const el=$(id); if(el) el.outerHTML=html};
   put('#near-gp', nl(gps,'gp',x=>x[3]));
   put('#near-dent', nl(des,'dent',x=>x[3]));
   put('#near-sch', nl(scs,'sch',x=>esc(x[3])+' · '+esc(x[4])+(x[5]?`<br><span class="badge ${/Outstanding|Good/.test(x[5])?'good':/Inadequate|Requires/.test(x[5])?'bad':'neu'}">Ofsted: ${esc(x[5])}</span> ${esc(x[6]||'')}`:'<br><span class="badge neu">No Ofsted grade published</span>')+`<br><span class="muted">${fmt(n250(x[0],x[1]))} recorded crimes within 250m</span>`));
   put('#near-rail', nl(rails,'rail',x=>'National Rail<br><span class="muted">'+fmt(n250(x[0],x[1]))+' recorded crimes within 250m</span>'));
   put('#near-bus', nl(busN,'bus',()=> 'Bus stop'));
   const hs=$('#hot-slot'); if(hs) hs.outerHTML=hotspotCard(nearSpots,{title:'Most recorded locations within the radius',clickable:true,csvId:'nearhot',note:'Within the chosen radius, over the latest 12 months. The time-window control does not change this list, because snap-point totals are built from the full 12-month file.',limit:12});
   document.querySelectorAll('.hot-go').forEach(b=>b.onclick=()=>{const lat=+b.dataset.lat,lon=+b.dataset.lon; if(is3d()&&typeof m3!=='undefined'&&m3)m3.flyTo({center:[lon,lat],zoom:16,duration:reduce?0:800}); else if(map){map.setView([lat,lon],16); L.popup().setLatLng([lat,lon]).setContent('<b>'+esc(b.textContent)+'</b>').openOn(map)}});
   const ss=$('#ss-slot'); if(ss) ss.outerHTML=ssBlock(nearSS,w);
   const cslot=$('#coll-slot'); if(cslot) cslot.innerHTML=(CO?collisionSummary(coRow,CO,{title:'Injury collisions within the radius',prov:provRow,extra:'Turn on the Collisions map layer to see the points (provisional ones are labelled). Final data covers calendar years 2024 and 2025.'}):'')+(CO&&coRow?explain('The main figures are personal-injury collisions reported to the police in calendar years 2024 and 2025 (final data), not the same window as the crime figures. Any provisional 2026 figures are shown separately and are unvalidated. Damage-only bumps are not included.'):'');
   const tk=$('#trans-kpis');
   if(tk) tk.innerHTML=kpi('bus','Bus stops within 500m',st500,'From the NaPTAN stop register','Active bus stops within 500 metres of the postcode.')+kpi('train','Nearest station',rails[0]?esc(rails[0][2]):'–',rails[0]?rails[0].d.toFixed(1)+' miles':'No station found','Nearest National Rail station by straight-line distance.');
   if(typeof buildExtraLayers==='function') buildExtraLayers();
   afterPaint(()=>{if($('#sstrend'))drawSsTrend($('#sstrend'),nearSS,w)});
  }catch(err){console.warn('Optional area layers could not be loaded', err)}
 })();
 (async()=>{const ex=await loadAreaExtras(postcode,(R.codes&&(R.codes.lsoa21||R.codes.lsoa))||'');
  const host=$('#areax'); if(!host)return;
  const chipUp=(lab,val)=>{const b=[...document.querySelectorAll('.schip')].find(x=>x.textContent.includes(lab));if(b){const bb=b.querySelector('b');if(bb)bb.textContent=val}};
  chipUp('IMD',ex.im?('D'+ex.im.d):'–');chipUp('Flood',ex.fb?bandLabel(ex.fb).split(' ')[0]:'None');chipUp('BB',ex.gig==null?'–':ex.gig+'%');
  const bx=$('#brief-x'); if(bx) bx.textContent='Deprivation: '+(ex.im?('IMD decile '+ex.im.d+' ('+decileLabel(ex.im.d)+')'):'not matched')+'. Flood (rivers & sea): '+(ex.fb?bandLabel(ex.fb):'none mapped')+'. Broadband: '+(ex.gig==null?'not mapped':ex.gig+'% gigabit'+(ex.sfbb!=null?', SFBB '+ex.sfbb+'%':'')+(ex.secFallback?' (sector)':''))+'.';
  try{const lr=await lj('lsoa_rates'); const code=(R.codes&&(R.codes.lsoa21||R.codes.lsoa))||''; const row=lr&&lr.lsoa&&lr.lsoa[code];
   const el=[...document.querySelectorAll('.kpi')].find(k=>k.textContent.includes('LSOA rate'));
   if(el&&row&&row.rate!=null){el.querySelector('.val').textContent=row.rate+' / 1,000';
    const pct=row.pct==null?'':` · Lower recorded rate than ${row.pct}% of local neighbourhoods`;
    el.querySelector('.sub').innerHTML=`<span class="badge ${row.band==='Low'?'good':row.band==='High'?'bad':'neu'}">${row.band} for Cambs</span> · ${fmt(row.n)} crimes · pop ${fmt(row.pop)}${pct}`;
    el.querySelector('.lab').innerHTML=ic('map')+'LSOA rate'+tipI('Approximate rate for this LSOA (2021). Crimes are assigned to the nearest LSOA centroid because police anonymise locations. Band is Low/Medium/High among Cambridgeshire & Peterborough LSOAs. “Lower recorded rate than X%” is the share of those LSOAs with a higher approximate rate. It is not a safety score and not an official police statistic. Centres can look high because visitors are not in the resident count.')}
   else if(el){el.querySelector('.val').textContent='–';el.querySelector('.sub').textContent='No LSOA estimate'}
   const lx=$('#lsoa-explain');
   if(lx&&row&&row.rate!=null) lx.outerHTML=explain('The neighbourhood (LSOA) figure is an approximate rate: each published crime is assigned to the nearest 2021 LSOA centroid because police anonymise locations. A band of '+esc(row.band||'Medium')+' is relative to Cambridgeshire & Peterborough only, and it is not a safety score.');
   fillContextHost(dist,false,code);
   const bp=$('#brief-pct'); if(bp&&row&&row.pct!=null) bp.textContent='Lower recorded rate than '+row.pct+'% of Cambridgeshire & Peterborough neighbourhoods (approximate LSOA rate '+row.rate+' per 1,000).';
   const nb=$('#nearby');
   if(nb&&row){const list=nearbyLsoa(lr,code,la,lo);
    nb.innerHTML=list.length?`<div class="row"><h3>Nearby, lower recorded rate</h3>${tipI('Other neighbourhoods (LSOAs) within about 5 miles whose approximate recorded rate is lower than this one. Same-district areas are listed first. This is not a recommendation to move, and rates are estimates because police anonymise locations.')}</div>
      <ul class="nearish">${list.map(v=>`<li><button type="button" class="tlink near-go" data-lat="${v.lat}" data-lon="${v.lon}">${esc(v.name||v.id)}</button> <span class="muted">${esc(v.la||'')} · ${v.dist.toFixed(1)} mi · ${v.rate} / 1,000</span></li>`).join('')}</ul>`:`<p class="muted">No nearby neighbourhoods with a lower approximate recorded rate within about 5 miles.</p>`;
    document.querySelectorAll('.near-go').forEach(b=>b.onclick=async()=>{const lab=b.textContent;b.textContent='Looking up…';try{const r=await fetch(`https://api.postcodes.io/postcodes?lon=${b.dataset.lon}&lat=${b.dataset.lat}&limit=5`).then(x=>x.json());const hit=(r.result||[]).find(p=>S.districts.some(d=>d.name===p.admin_district))||(r.result&&r.result[0]); if(hit) go('pc='+encodeURIComponent(hit.postcode)); else b.textContent='No postcode found'}catch{b.textContent=lab}});}
   else if(nb) nb.innerHTML='';
   const nc=$('#nearcmp');
   if(nc){const ls=row?nearestLsoa(lr,code,la,lo,4):[];
    if(!ls.length){nc.remove()}
    else{
     nc.hidden=false;
     nc.innerHTML=`<div class="row"><h3>Compare with a neighbouring area</h3>${tipI('The four closest neighbourhoods (LSOAs) within about 5 miles, whatever their rate, so you can compare like with like. Compare opens a side-by-side view of '+postcode+' and the nearest postcode in that neighbourhood, using the same radius and time window. Rates are approximate because police anonymise locations. This is not a recommendation to move.')}</div>
     <ul class="nearish nearcmp">${ls.map(v=>`<li><span><b>${esc(v.name||v.id)}</b> <span class="muted">${esc(v.la||'')} · ${v.dist.toFixed(1)} mi · ${v.rate} / 1,000</span></span><button type="button" class="btn ghost near-cmp" data-lat="${v.lat}" data-lon="${v.lon}" aria-label="Compare ${esc(postcode)} with ${esc(v.name||v.id)}">Compare</button></li>`).join('')}</ul><p class="muted nearcmp-msg" role="status" aria-live="polite"></p>`;
     nc.querySelectorAll('.near-cmp').forEach(b=>b.onclick=async()=>{const lab=b.textContent,msg=nc.querySelector('.nearcmp-msg');b.disabled=true;b.textContent='Looking up…';msg.textContent='';
      try{const hit=await postcodeNearPoint(b.dataset.lat,b.dataset.lon); if(hit) go('compare=1&a='+encodeURIComponent(postcode)+'&b='+encodeURIComponent(hit.postcode)); else{msg.textContent='No postcode found inside the area for that neighbourhood.';b.disabled=false;b.textContent=lab}}
      catch{msg.textContent='The postcode service could not be reached. Try again.';b.disabled=false;b.textContent=lab}});
    }}
  }catch{}
  if($('#ctxhost')) fillContextHost(dist,false,(R.codes&&(R.codes.lsoa21||R.codes.lsoa))||'');

  const floodTxt=ex.fb?bandLabel(ex.fb):'None mapped';
  const bbTxt=ex.gig==null?'–':(ex.gig+'% gigabit')+(ex.secFallback?' (sector)':'');
  host.innerHTML=`<div class="mini">
   ${kpi('depr','Deprivation (IMD 2025)',ex.im?('Decile '+ex.im.d):'–',ex.im?decileLabel(ex.im.d):'No LSOA match','Index of Multiple Deprivation 2025 for this LSOA. Decile 1 is the most deprived 10% of neighbourhoods in England.')}
   ${kpi('flood','Flood risk (rivers & sea)',floodTxt,ex.fb?'Highest band for properties in this postcode':'No property in a mapped rivers/sea flood area for this postcode.','Environment Agency Risk of Flooding from Rivers and Sea. Does not cover surface water.')}
   ${kpi('wifi','Broadband',bbTxt,ex.sfbb!=null?('SFBB '+ex.sfbb+'% of premises'):'Ofcom residential coverage','Share of residential premises that can get gigabit-capable and superfast (SFBB) broadband. Ofcom Connected Nations.')}
  </div>
  <p class="muted">Sources: MHCLG IoD 2025 · Environment Agency RoFRS · Ofcom Connected Nations (OGL). <a href="method.html">How to read this</a>.</p>`})();
 const u=new URL(location.href);u.search=pcUrl(postcode);history.replaceState(null,'',u);
 afterPaint(()=>{trend($('#trend'),mon,'Crimes within radius',wm); if($('#season')) drawSeason($('#season'),mon,wm,S.overview.monthly); if($('#tcmp')) drawTypeCompare($('#tcmp'),by,nearAll.length||1); if($('#outtrend'))outcomeTrend($('#outtrend'),nearAll,wm); if($('#typetrend'))typeTrend($('#typetrend'),nearAll,cats,wm)});
 // map
 window._ctx={la,lo,postcode,near,nearAll,cats,rMi,w,GP:within0(GP,la,lo,5),DE:within0(DE,la,lo,5),SC:within0(SC,la,lo,5),ST:within0(ST,la,lo,3),RA:within0(RA,la,lo,15),GS:within0(GS||[],la,lo,5),CO:nearCO.concat(nearProv)};
 await ensureLeaflet(); map=L.map('map',{zoomControl:true}).setView([la,lo],rMi<=0.5?15:rMi<=1?14:13);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
 const area=L.circle([la,lo],{radius:rMi*1609.34,color:'#0f766e',weight:2,fillOpacity:.04}).addTo(map);
 L.marker([la,lo],{icon:L.divIcon({className:'',html:`<div class="pin" style="width:34px;height:34px;background:#14213d">${ic('pin',18)}</div>`,iconSize:[34,34],iconAnchor:[17,17]}),zIndexOffset:1000,keyboard:true,title:postcode}).addTo(map).bindPopup('<b>'+postcode+'</b>');
 const clus=c=>L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,iconCreateFunction:g=>{const n=g.getChildCount(),s=n<10?44:n<100?48:54;return L.divIcon({className:'',html:`<div class="cl" style="width:${s}px;height:${s}px;background:${c}">${n}</div>`,iconSize:[s,s]})}});
 const pinI=(k,s=28)=>L.divIcon({className:'',html:`<div class="pin" style="width:${s}px;height:${s}px;background:${LAYERS[k].c}">${ic(LAYERS[k].i,s*.55|0)}</div>`,iconSize:[s,s],iconAnchor:[s/2,s/2]});
 const crimeL=clus(LAYERS.crimes.c);near.forEach(p=>crimeL.addLayer(L.circleMarker([p[0],p[1]],{radius:6,color:'#fff',weight:1.5,fillColor:LAYERS.crimes.c,fillOpacity:.95}).bindPopup(`<b>${cn(cats[p[2]])}</b><br>${mname(S.months[p[3]])}<br><i>${S.outcomeBuckets[p[4]]}</i><br>${svLink(p[0],p[1],{approx:true})}`)));
 const within=(arr,mi)=>arr.filter(p=>hav(la,lo,p[0],p[1])<=mi);
 const grp=(arr,k,pop,mi=5)=>{const g=clus(LAYERS[k].c);within(arr,mi).forEach(p=>g.addLayer(L.marker([p[0],p[1]],{icon:pinI(k),title:p[2]}).bindPopup(pop(p))));return g};
 const ML={crimes:crimeL,heat:L.layerGroup()};
 let extrasReady=false;
 const pendingLayers=[];
 buildExtraLayers=()=>{
  const busL=clus(LAYERS.bus.c);within(ST,3).forEach(p=>busL.addLayer(L.circleMarker([p[0],p[1]],{radius:5,color:'#fff',weight:1.5,fillColor:LAYERS.bus.c,fillOpacity:.95}).bindPopup('Bus stop: '+esc(p[2]))));
  ML.gp=grp(GP,'gp',p=>`<b>${esc(p[2])}</b><br>GP practice · ${p[3]}`);
  ML.dent=grp(DE,'dent',p=>`<b>${esc(p[2])}</b><br>Dental practice · ${p[3]}`);
  ML.sch=grp(SC,'sch',p=>`<b>${esc(p[2])}</b><br>${esc(p[3])} · ${esc(p[4])}${p[5]?'<br>Ofsted: '+esc(p[5]):''}<br>${svLink(p[0],p[1])}`);
  ML.bus=busL;
  ML.rail=L.layerGroup(within(RA,15).map(p=>L.marker([p[0],p[1]],{icon:pinI('rail',32),title:p[2]}).bindPopup('<b>'+esc(p[2])+'</b><br>'+svLink(p[0],p[1]))));
  ML.park=grp(GS||[],'park',p=>`<b>${esc(p[2])}</b><br>${esc(p[3]||'Greenspace')}`);
  ML.collisions=(()=>{const g=clus(LAYERS.collisions.c);nearCO.concat(nearProv).forEach(p=>g.addLayer(L.circleMarker([p[0],p[1]],{radius:p[2]===1?8:p[2]===2?7:6,color:'#fff',weight:1.2,fillColor:sevColor(p[2]),fillOpacity:.92}).bindPopup(`<b>${sevName(p[2])} injury collision</b><br>${p[3]} · ${p[4]} casualt${p[4]===1?'y':'ies'}`)));return g})();
  extrasReady=true;
  const want=new Set(pendingLayers);
  document.querySelectorAll('.layers input:checked').forEach(i=>{if(i.dataset.l) want.add(i.dataset.l)});
  want.forEach(k=>{const l=ML[k]; if(l&&k!=='crimes'&&map&&!map.hasLayer(l)) map.addLayer(l)});
 };
 if(extrasApplied) buildExtraLayers();
 map.addLayer(ML.crimes);
 $('.layers').onchange=e=>{const k=e.target.dataset.l; if(!k)return; if(!ML[k]&&!extrasReady){if(e.target.checked) pendingLayers.push(k);return} const l=ML[k]; if(!l)return; e.target.checked?map.addLayer(l):map.removeLayer(l);if(k=='heat'){const ci=document.querySelector('input[data-l=crimes]');if(e.target.checked){if(ci.checked){ci.checked=false;map.removeLayer(ML.crimes)}if(!is3d())set3d(true);else heatView()}else if(!ci.checked){ci.checked=true;map.addLayer(ML.crimes)}}m3vis()};
 $('#recentre').onclick=()=>{if(is3d()&&m3)m3.jumpTo(view3d());else map.fitBounds(area.getBounds())};
  wireStreetViewButton();
  wireMapStreetViewContext(map);
 $('#mode3d').onclick=()=>set3d(!is3d());const K=window._keep;window._keep=null;
 if(K){const t=K.tab&&$('#'+K.tab);if(t)sel(t);document.querySelectorAll('.layers input').forEach(i=>{const on=K.L.includes(i.dataset.l);if(on!==i.checked){i.checked=on;on?map.addLayer(ML[i.dataset.l]):map.removeLayer(ML[i.dataset.l])}});map.setView(K.ll.c,K.ll.z,{animate:false});
  window._cam=K.cam;if(K.d3)set3d(true);else m3vis();const sy=()=>scrollTo({top:K.y,behavior:'instant'});sy();requestAnimationFrame(sy);setTimeout(sy,150);setTimeout(sy,600)}
 else if(sessionStorage.getItem('sl-3d')==='1')set3d(true);
 $('#mapbox').addEventListener('pointerdown',()=>hideTip(),true);
 const fsb=$('#fs'),box=$('#mapbox');const setFs=on=>{box.classList.toggle('fs',on);fsb.innerHTML=ic(on?'shrink':'expand');fsb.setAttribute('aria-label',on?'Exit full screen':'Full screen map');setTimeout(()=>{map.invalidateSize();m3&&m3.resize()},60)};
 fsb.onclick=()=>setFs(!box.classList.contains('fs'));document.addEventListener('keydown',function k(e){if(e.key==='Escape'&&box.classList.contains('fs'))setFs(false)});
 setTimeout(()=>map&&map.invalidateSize(),100)}
/* ---------- boot ---------- */
setThemeBtn();app.innerHTML='<div class="wrap"><div class="sk" style="height:320px;margin-top:24px"></div></div>';
wireModeToggle();syncModeToggle();
Promise.all([fetch('data/summary.json').then(r=>r.json()),lj('prices')]).then(([s,pr])=>{S=s;PR=pr;$('#gen').textContent=`Data updated: ${s.generated}, covering ${mname(s.months[0])} – ${mname(s.months.at(-1))}.`;render()}).catch(()=>{app.innerHTML='<div class="wrap"><div class="card state"><h1>Something went wrong</h1><p>The data could not be loaded. Please refresh the page.</p></div></div>'});
if('serviceWorker' in navigator){navigator.serviceWorker.register(new URL('sw.js',location.href)).catch(()=>{});}

/* ---------- 3D map (MapLibre GL + OpenFreeMap vector tiles, keyless) ---------- */
var m3=null,_mlp=null;
function within0(arr,la,lo,mi){return arr.filter(p=>hav(la,lo,p[0],p[1])<=mi)}
const is3d=()=>$('#mode3d')&&$('#mode3d').getAttribute('aria-pressed')==='true';
function loadMl(){return _mlp||(_mlp=new Promise((res,rej)=>{const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';document.head.appendChild(l);
 const s=document.createElement('script');s.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)}))}
function heatOn(){const h=document.querySelector('input[data-l=heat]');return h&&h.checked}
function view3d(){if(window._cam){const v=window._cam;window._cam=null;return v}const c=window._ctx,sm=innerWidth<600;return heatOn()?{center:[c.lo,c.la-0.004],zoom:sm?13.2:13.7,pitch:50,bearing:-20}:{center:[c.lo,c.la],zoom:15.6,pitch:60,bearing:-25}}
function heatView(){m3&&m3.jumpTo(view3d())}
function circlePoly(la,lo,mi,n=72){const pts=[];for(let i=0;i<=n;i++){const a=i/n*2*Math.PI;pts.push([lo+mi/69.17/Math.cos(la*Math.PI/180)*Math.cos(a)*1,la+mi/69.17*Math.sin(a)])}return pts}
function fc(arr,f){return {type:'FeatureCollection',features:arr.map(p=>({type:'Feature',geometry:{type:'Point',coordinates:[p[1],p[0]]},properties:f(p)}))}}
function heatGrid(c){const dla=0.0018,dlo=0.0029,cells={};c.near.forEach(p=>{const i=Math.floor(p[0]/dla),k=Math.floor(p[1]/dlo),key=i+'_'+k;cells[key]=(cells[key]||0)+1});
 const ent=Object.entries(cells),vals=ent.map(e=>e[1]).sort((x,y)=>x-y),mx=vals.at(-1)||1,q=v=>{let lo=0,hi=vals.length;while(lo<hi){const m=(lo+hi)>>1;vals[m]<v?lo=m+1:hi=m}return vals.length>1?lo/(vals.length-1):1};
 const sm=innerWidth<600,rM=(sm?60:40)/111320;const qs=[0,.25,.5,.75,1].map(t=>vals[Math.min(vals.length-1,Math.round(t*(vals.length-1)))]||0);
 return {mx,qs,fc:{type:'FeatureCollection',features:ent.map(([key,n])=>{const [i,k]=key.split('_').map(Number),cy=(i+.5)*dla,cx=(k+.5)*dlo,co=Math.cos(cy*Math.PI/180),ring=[];
 for(let s=0;s<=16;s++){const a=s/16*2*Math.PI;ring.push([cx+rM/co*Math.cos(a),cy+rM*Math.sin(a)])}
 return {type:'Feature',properties:{n,q:q(n),h:Math.max(sm?24:12,Math.sqrt(n/mx)*(sm?320:280))},geometry:{type:'Polygon',coordinates:[ring]}}})}}}
function heatLegend(on){const lg=$('.legend');if(!lg)return;let h=$('#heatlg');if(!on){h&&h.remove();return}if(h)return;const g=m3&&m3._slHeat;if(!g)return;
 h=document.createElement('div');h.id='heatlg';h.innerHTML=`<b>Crimes per 200m square</b><div class="hbar"></div><div class="hnum">${g.qs.map(v=>`<span>${v}</span>`).join('')}</div><div class="muted" style="font-size:12px">Taller and redder = more crimes</div>`;lg.appendChild(h)}
function m3vis(){const hi=document.querySelector('input[data-l=heat]');heatLegend(!!(hi&&hi.checked&&is3d()));if(!m3||!m3._slReady)return;document.querySelectorAll('.layers input').forEach(i=>{const v=i.checked?'visible':'none';(m3._slIds[i.dataset.l]||[]).forEach(id=>m3.getLayer(id)&&m3.setLayoutProperty(id,'visibility',v))})}
async function set3d(on){const b=$('#mode3d'),box=$('#mapbox');if(!b)return;b.setAttribute('aria-pressed',on);b.textContent=on?'2D':'3D';b.setAttribute('aria-label',on?'Switch to 2D map':'Switch to 3D map');sessionStorage.setItem('sl-3d',on?'1':'0');
 let el=$('#map3d');if(!on){heatLegend(false);if(el)el.hidden=true;$('#map').style.visibility='';map&&map.invalidateSize();return}
 if(!el){el=document.createElement('div');el.id='map3d';el.setAttribute('role','region');el.setAttribute('aria-label','3D map');box.insertBefore(el,box.querySelector('.mapctl'))}
 el.hidden=false;$('#map').style.visibility='hidden';
 if(m3){m3.resize();return}
 el.innerHTML='<div class="sk" style="position:absolute;inset:0;border-radius:0"></div>';
 try{await loadMl()}catch{el.innerHTML='<div class="state" style="margin:40px auto">3D map could not load. Try again or use 2D.</div>';return}
 el.innerHTML='';const c=window._ctx,dark=document.documentElement.dataset.theme==='dark';
 m3=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/'+(dark?'dark':'liberty'),...view3d(),maxPitch:75,antialias:false,fadeDuration:reduce?0:300,attributionControl:{compact:true}});
 m3.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-left');
 m3.on('error',e=>console.warn('3D map',e&&e.error&&e.error.message));
 m3.on('load',()=>{const M=m3;if(!M)return;if(M.getLayer('building-3d'))M.removeLayer('building-3d');
  const lbl=M.getStyle().layers.find(l=>l.type==='symbol'&&l.layout&&l.layout['text-field']);
  M.addLayer({id:'sl-bld',type:'fill-extrusion',source:'openmaptiles','source-layer':'building',minzoom:13,paint:{'fill-extrusion-color':dark?'#2a3a58':'#c9bfae','fill-extrusion-height':['coalesce',['get','render_height'],6],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.85}},lbl&&lbl.id);
  M.addSource('sl-area',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:circlePoly(c.la,c.lo,c.rMi||1)}}});
  M.addLayer({id:'sl-area',type:'line',source:'sl-area',paint:{'line-color':dark?'#2dd4bf':'#0f766e','line-width':3}});
  const hg=heatGrid(c);M._slHeat=hg;M.addSource('sl-heat',{type:'geojson',data:hg.fc});
  M.addLayer({id:'sl-heat',type:'fill-extrusion',source:'sl-heat',layout:{visibility:'none'},paint:{'fill-extrusion-height':['get','h'],'fill-extrusion-opacity':.65,'fill-extrusion-vertical-gradient':true,'fill-extrusion-color':['interpolate',['linear'],['get','q'],0,'#fde68a',.4,'#fbbf24',.7,'#f97316',.9,'#dc2626',1,'#7f1d1d']}});
  const hp=new maplibregl.Popup({closeButton:false,closeOnClick:false,offset:8});const hs=e=>{const f=e.features[0];M.getCanvas().style.cursor='pointer';hp.setLngLat(e.lngLat).setHTML(`<b>${fmt(f.properties.n)} crime${f.properties.n==1?'':'s'}</b><br>in this 200m square, ${wLabel(c.w||12)}`).addTo(M)};
  let pin=false;M.on('mousemove','sl-heat',hs);M.on('click','sl-heat',e=>{pin=true;hs(e)});M.on('mouseleave','sl-heat',()=>{M.getCanvas().style.cursor='';if(!pin)hp.remove()});M.on('click',e=>{if(M.getLayer('sl-heat')&&!M.queryRenderedFeatures(e.point,{layers:['sl-heat']}).length){pin=false;hp.remove()}});
  const ids={heat:['sl-heat']};
  const pt=(k,data,cluster,r=7)=>{const col=LAYERS[k].c;M.addSource('sl-'+k,{type:'geojson',data,cluster,clusterRadius:48,clusterMaxZoom:16});
   ids[k]=['sl-'+k+'-pt'];M.addLayer({id:'sl-'+k+'-pt',type:'circle',source:'sl-'+k,filter:['!',['has','point_count']],paint:{'circle-color':col,'circle-radius':r,'circle-stroke-color':'#fff','circle-stroke-width':2,'circle-pitch-alignment':'viewport'}});
   if(cluster){ids[k].push('sl-'+k+'-cl','sl-'+k+'-n');M.addLayer({id:'sl-'+k+'-cl',type:'circle',source:'sl-'+k,filter:['has','point_count'],paint:{'circle-color':col,'circle-radius':['step',['get','point_count'],15,10,19,100,24],'circle-stroke-color':'#ffffffcc','circle-stroke-width':3,'circle-pitch-alignment':'viewport'}});
    M.addLayer({id:'sl-'+k+'-n',type:'symbol',source:'sl-'+k,filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Bold'],'text-size':12,'text-allow-overlap':true},paint:{'text-color':'#fff'}});
    M.on('click','sl-'+k+'-cl',e=>{const f=e.features[0];M.getSource('sl-'+k).getClusterExpansionZoom(f.properties.cluster_id).then(z=>M.easeTo({center:f.geometry.coordinates,zoom:z,duration:reduce?0:400}))})}
   M.on('click','sl-'+k+'-pt',e=>new maplibregl.Popup({maxWidth:'260px'}).setLngLat(e.features[0].geometry.coordinates).setHTML(e.features[0].properties.h).addTo(M));
   ['sl-'+k+'-pt','sl-'+k+'-cl'].forEach(id=>{M.on('mouseenter',id,()=>M.getCanvas().style.cursor='pointer');M.on('mouseleave',id,()=>M.getCanvas().style.cursor='')})};
  pt('crimes',fc(c.near,p=>({h:`<b>${cn(c.cats[p[2]])}</b><br>${mname(S.months[p[3]])}<br><i>${S.outcomeBuckets[p[4]]}</i><br>${svLink(p[0],p[1],{approx:true})}`})),true,5);
  pt('gp',fc(c.GP,p=>({h:`<b>${esc(p[2])}</b><br>GP practice · ${p[3]}`})),true);pt('dent',fc(c.DE,p=>({h:`<b>${esc(p[2])}</b><br>Dental practice · ${p[3]}`})),true);
  pt('sch',fc(c.SC,p=>({h:`<b>${esc(p[2])}</b><br>${esc(p[3])} · ${esc(p[4])}${p[5]?'<br>Ofsted: '+esc(p[5]):''}<br>${svLink(p[0],p[1])}`})),true);
  pt('bus',fc(c.ST,p=>({h:'Bus stop: '+esc(p[2])})),true,4);pt('rail',fc(c.RA,p=>({h:'<b>'+esc(p[2])+'</b><br>'+svLink(p[0],p[1])})),false,9);
  if(c.GS) pt('park',fc(c.GS,p=>({h:`<b>${esc(p[2])}</b><br>${esc(p[3]||'Greenspace')}`})),true);
  if(c.CO&&c.CO.length) pt('collisions',fc(c.CO,p=>({h:`<b>${sevName(p[2])} injury collision</b><br>${p[3]} · ${p[4]} casualt${p[4]===1?'y':'ies'}`})),true,6);
  new maplibregl.Marker({color:'#14213d'}).setLngLat([c.lo,c.la]).setPopup(new maplibregl.Popup().setHTML('<b>'+c.postcode+'</b><br>'+svLink(c.la,c.lo))).addTo(M);
  M._slIds=ids;M._slReady=true;m3vis()})}

