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
pin:'<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',loc:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
people:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/>',
gavel:'<path d="M14 4l6 6M11 7l6 6M12.5 5.5l-5 5M18.5 11.5l-5 5M3 21l7-7"/>',hand:'<path d="M8 13V5.5a1.5 1.5 0 013 0V11M11 10V4.5a1.5 1.5 0 013 0V11M14 10V5.5a1.5 1.5 0 013 0V14c0 4-3 7-6.5 7S5 19 4 16l-1.5-3.5a1.5 1.5 0 012.6-1.4L8 14"/>',
expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',shrink:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',flood:'<path d="M12 3c4 6 7 9 7 12a7 7 0 11-14 0c0-3 3-6 7-12z"/>',wifi:'<path d="M5 12.5a9 9 0 0114 0M8.5 16a5 5 0 017 0"/><circle cx="12" cy="20" r="1.2"/>',depr:'<path d="M4 20V10l8-6 8 6v10"/><path d="M10 20v-6h4v6"/>',map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',park:'<path d="M12 22V11"/><path d="M12 14c-4-1-7-4-7-8 5 0 7 3 7 5 0-2 2-5 7-5 0 4-3 7-7 8z"/><path d="M7 22h10"/>'};
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
window._csv={};const csvBtn=(id,rows,what)=>{window._csv[id]=rows;return `<button class="btn ghost" data-tip="Download ${what} as a CSV file for Excel or Google Sheets." onclick="csv('${id}.csv',_csv['${id}'])">${ic('dl',18)} CSV</button>`};
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
function pcUrl(postcode){const w=getW(); return '?pc='+encodeURIComponent(postcode)+(w===12?'':'&w='+w)}
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

async function loadAreaExtras(postcode,lsoa){const pc=postcode.replace(/\s+/g,'').toUpperCase(),sec=pc.length>=5?pc.slice(0,-2):pc;
 const [imd,fl,bb]=await Promise.all(['imd','flood','broadband'].map(n=>lj(n).catch(()=>null)));
 const im=imd&&imd.lsoa&&imd.lsoa[lsoa];
 const fb=fl&&fl.pc?fl.pc[pc]:null;
 let gig=null,sfbb=null; if(bb){const hit=bb.pc&&bb.pc[pc]; const s=hit||(bb.sector&&bb.sector[sec]); if(s){gig=s[0];sfbb=s[1]}}
 return {im,fb,gig,sfbb,secFallback:!(bb&&bb.pc&&bb.pc[pc])}}

async function loadNeighbourhood(la,lo,el){try{
 const loc=await fetch(`https://data.police.uk/api/locate-neighbourhood?q=${la},${lo}`).then(r=>r.ok?r.json():null);
 if(!loc||!loc.force||!loc.neighbourhood){el.innerHTML='<p class="muted">No neighbourhood team found for this point.</p>';return}
 const [info,pri]=await Promise.all([
  fetch(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}`).then(r=>r.ok?r.json():null),
  fetch(`https://data.police.uk/api/${loc.force}/${loc.neighbourhood}/priorities`).then(r=>r.ok?r.json():[])
 ]);
 const name=(info&&info.name)||loc.neighbourhood.replace(/_/g,' ');
 const url=`https://www.police.uk/pu/your-area/${loc.force}/${loc.neighbourhood.toLowerCase().replace(/_/g,'-')}/`;
 const issue=pri&&pri[0]?stripHtml(pri[0].issue).slice(0,220):'';
 el.innerHTML=`<div class="row"><h3>Local policing</h3>${tipI('Neighbourhood team from data.police.uk for this location. Priorities are set by the force and change over time.')}</div>
 <p><b>${esc(name)}</b> · ${esc(loc.force.replace(/-/g,' '))}</p>
 ${issue?`<p class="muted">${esc(issue)}${issue.length>=220?'…':''}</p>`:''}
 <p><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Open on police.uk</a></p>`}
 catch{el.innerHTML='<p class="muted">Could not load neighbourhood details right now.</p>'}}

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
 <div style="overflow-x:auto"><table><thead><tr><th>Type</th><th class="n">Count</th><th class="n">Share</th>${typeYoy?'<th class="n">Previous</th><th class="n">YoY</th>':''}<th style="width:22%"><span class="sr">Bar</span></th></tr></thead><tbody>${body}</tbody></table></div>`;
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
 <table><tbody>${S.outcomeBuckets.map((b,i)=>`<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${OCOL[i]};margin-right:8px"></span>${b}</td><td class="n">${fmt(oc[i])}</td><td class="n">${(oc[i]/t*100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`}
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
function showTip(el){const t=el.getAttribute('data-tip');if(!t)return;tipEl=el;tip.textContent=t;tip.classList.add('show');const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
 let x=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8),y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8;tip.style.left=x+'px';tip.style.top=y+'px';el.setAttribute('aria-describedby','tip');if(el.classList.contains('tip-i'))el.setAttribute('aria-expanded','true')}
function hideTip(){if(tipEl){tipEl.removeAttribute('aria-describedby');tipEl.removeAttribute('aria-expanded')}tipEl=null;tip.classList.remove('show')}
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
function go(q,push=true){const u=new URL(location.href);u.hash='';u.search=q?'?'+q:'';if(push)history.pushState(null,'',u);render();app.focus({preventScroll:true});scrollTo({top:0,behavior:reduce?'auto':'smooth'})}
addEventListener('popstate',render);
document.addEventListener('click',e=>{const a=e.target.closest('a[data-q],a[data-nav]');if(!a||e.metaKey||e.ctrlKey)return;e.preventDefault();go(a.dataset.q||'')});
const dq=d=>'d='+slug(d.name);
function nav(cur){$('#nav').innerHTML=`<a href="./" data-nav="home" ${!cur||cur=='home'?'aria-current="page"':''} data-tip="County-wide summary and postcode search.">Overview</a>`+S.districts.map(d=>`<a href="?${dq(d)}" data-q="${dq(d)}" ${cur==slug(d.name)?'aria-current="page"':''} data-tip="Crime, outcomes and house prices for ${d.name}.">${d.name}</a>`).join('')+`<a href="?compare=1" data-q="compare=1" ${cur=='compare'?'aria-current="page"':''} data-tip="Compare two postcodes side by side.">Compare</a><a href="method.html" data-tip="How rates, maps and outcomes are calculated.">Method</a>`}
function render(){hideTip();killCharts();if(map){map.remove();map=null}
 const q=new URLSearchParams(location.search),h=decodeURIComponent(location.hash.slice(2));
 if(h){const u=new URL(location.href);u.hash='';if(h.startsWith('postcode/'))u.search='?pc='+h.slice(9);else if(h)u.search='?d='+h;history.replaceState(null,'',u);return render()}
 const pc=q.get('pc'),d=q.get('d');
 if(q.get('compare')!=null){nav('compare');return compareView(q.get('a'),q.get('b'))}
 if(pc){nav('pc');return dashboard(pc)}
 const dist=S.districts.find(x=>slug(x.name)==d);nav(d||'home');const title=(dist?dist.name+' — ':'')+'StreetLens — Cambridgeshire area insights';
 setMeta(title,dist?`${dist.name}: ${dist.rate} crimes per 1,000 residents, solve rate and house prices from open UK data.`:'Crime, outcomes, schools, GPs, transport and house prices for any Cambridgeshire or Peterborough postcode.',location.origin+location.pathname+(d?'?d='+encodeURIComponent(d):''));home(dist)}
/* ---------- search component ---------- */
function searchBox(){return `<form class="search" id="sf" role="search" autocomplete="off"><div class="sbox">${ic('search',22)}
 <input id="pc" type="text" inputmode="text" autocapitalize="characters" aria-label="Postcode" placeholder="Enter a postcode, e.g. PE29 3TN" role="combobox" aria-expanded="false" aria-controls="ac" aria-autocomplete="list" data-tip="Type a Cambridgeshire or Peterborough postcode. Suggestions appear as you type.">
 ${tipI('Search any Cambridgeshire or Peterborough postcode to see crime, outcomes, GPs, dentists, schools, transport and house prices nearby.')}
 <button class="btn lg" data-tip="Show the area dashboard for this postcode.">Explore</button></div><ul class="ac" id="ac" role="listbox" aria-label="Postcode suggestions"></ul>
 <div class="qrow"><button type="button" class="chip" id="geo" data-tip="Use your device location to find your nearest postcode. Your location is only sent to postcodes.io to look up the postcode.">${ic('loc',18)} Use my location</button>
 <span class="lbl">Try:</span>${[['Huntingdon','PE29 3TN'],['Cambridge','CB2 1TN'],['Peterborough','PE1 1HL'],['Ely','CB7 4BL']].map(([n,p])=>`<button type="button" class="chip" data-pc="${p}" data-tip="See the dashboard for ${n} (${p}).">${n}</button>`).join('')}</div>
 <div class="err" id="serr" role="alert"></div></form>`}
function wireSearch(){const f=$('#sf'),i=$('#pc'),ac=$('#ac');let sel=-1,items=[],tmr;
 const close=()=>{ac.classList.remove('open');i.setAttribute('aria-expanded','false');sel=-1};
 const draw=()=>{ac.innerHTML=items.map((p,k)=>`<li role="option" id="ac${k}" aria-selected="${k==sel}" data-pc="${p}">${p}</li>`).join('');ac.classList.toggle('open',!!items.length);i.setAttribute('aria-expanded',!!items.length);i.setAttribute('aria-activedescendant',sel>=0?'ac'+sel:'')};
 i.oninput=()=>{clearTimeout(tmr);const v=i.value.trim();if(v.length<2){items=[];return close()}tmr=setTimeout(async()=>{try{const r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(v)+'/autocomplete?limit=6').then(r=>r.json());items=(r.result||[]);sel=-1;draw()}catch{}},180)};
 i.onkeydown=e=>{if(!items.length)return;if(e.key==='ArrowDown'){sel=(sel+1)%items.length;draw();e.preventDefault()}else if(e.key==='ArrowUp'){sel=(sel-1+items.length)%items.length;draw();e.preventDefault()}else if(e.key==='Escape')close();else if(e.key==='Enter'&&sel>=0){e.preventDefault();i.value=items[sel];close();f.requestSubmit()}};
 ac.onmousedown=e=>{const li=e.target.closest('li');if(li){e.preventDefault();i.value=li.dataset.pc;close();f.requestSubmit()}};i.onblur=()=>setTimeout(close,150);
 f.onsubmit=e=>{e.preventDefault();const v=i.value.trim();if(!v){$('#serr').textContent='Enter a postcode to search.';return i.focus()}go('pc='+encodeURIComponent(v.toUpperCase()))};
 f.querySelectorAll('[data-pc]').forEach(b=>{if(b.tagName==='BUTTON')b.onclick=()=>go('pc='+encodeURIComponent(b.dataset.pc))});
 $('#geo').onclick=()=>{if(!navigator.geolocation){$('#serr').textContent='Location is not available on this device.';return}$('#serr').textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(async p=>{try{const r=await fetch(`https://api.postcodes.io/postcodes?lon=${p.coords.longitude}&lat=${p.coords.latitude}&limit=1`).then(r=>r.json());if(r.result&&r.result[0])go('pc='+encodeURIComponent(r.result[0].postcode));else $('#serr').textContent='No postcode found near you.'}catch{$('#serr').textContent='Could not look up your postcode.'}},()=>{$('#serr').textContent='Location permission was refused. Type a postcode instead.'},{timeout:10000})}}
/* ---------- home & district ---------- */
function home(dist){const a=dist||S.overview,isAll=!dist,period=`${mname(S.months[0])} – ${mname(S.months.at(-1))}`,mv=S.months.map(m=>a.monthly[m]),mAll=(S.monthsAll&&S.monthsAll.length>12)?S.monthsAll:S.months,cs=solveOf(S.overview),as=solveOf(a);
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
 ${movingPanel(a)}
 ${isAll?`<section class="sec"><div class="sec-h"><div><h2>Districts at a glance</h2><p>Select a district for its full profile.</p></div></div><div class="dcards">${S.districts.map(d=>{const s=solveOf(d);return `<a class="card dcard" href="?${dq(d)}" data-q="${dq(d)}" data-tip="Open the ${d.name} profile."><h3>${d.name} <span aria-hidden="true">→</span></h3>${badge(d.rate,S.overview.rate,'county')}${d.yoy!=null?`<div class="muted" style="font-size:13px;margin:4px 0">YoY ${d.yoy>0?'+':''}${d.yoy}%</div>`:''}<div class="ms"><div>Per 1,000<b>${d.rate}</b></div><div>Solved<b>${s.toFixed(1)}%</b></div><div>Median<b>£${fmt(Math.round(PR.districts[d.code][0]/1000))}k</b></div></div>${spark(S.months.map(m=>d.monthly[m]))}</a>`}).join('')}</div></section>`:''}
 <section class="sec"><div class="sec-h"><div><h2>Crime</h2><p>What is recorded and how it changes month to month.</p></div></div>
 <div class="grid2"><div class="card">${typeTable(a.byType,a.total,'types',a.typeYoy)}</div><div class="card"><div class="row"><h3>Month by month${mAll.length>12?' <span class="muted" style="font-weight:600;font-size:13px">(24 months)</span>':''}</h3><span class="ctl">${csvBtn('monthly',[['Month','Crimes'],...mAll.map(m=>[m,a.monthly[m]||0])],'the monthly counts')}${mAll.length>12?tipI('Uses up to 24 months so you can see the previous year alongside the latest 12. The KPI total above is still the latest 12 months only.'):''}</span></div><div style="height:300px"><canvas id="trend" aria-label="Monthly crime chart"></canvas></div></div></div></section>
 <section class="sec"><div class="sec-h"><div><h2>Outcomes &amp; homes</h2><p>How crimes were resolved, and what homes sell for.</p></div></div>
 <div class="grid2"><div class="card">${outTable(a.outcomes,'out')}</div><div class="card"><div class="row"><h3>House prices</h3>${tipI('Median price of standard residential sales recorded by HM Land Registry in the latest 12 months of data.')}</div>
 <table><thead><tr><th>Area</th><th class="n">Median</th><th class="n">Sales</th></tr></thead><tbody>${(isAll?S.districts:[a]).map(d=>`<tr><td>${d.name}</td><td class="n">£${fmt(PR.districts[d.code][0])}</td><td class="n">${fmt(PR.districts[d.code][1])}</td></tr>`).join('')}</tbody></table><p class="muted">${PR.from.slice(0,7)} to ${PR.to.slice(0,7)}</p>
 ${isAll?`<div class="row" style="margin-top:8px"><h3>Crime rate vs median price</h3>${tipI('Each dot is a district: crimes per 1,000 residents against median house price.')}</div><div style="height:240px"><canvas id="scatter" aria-label="Crime rate against house price by district"></canvas></div>`:''}</div></div></section>
 ${isAll?`<section class="sec"><div class="card"><div class="row"><h3>Districts compared</h3><span class="ctl">${csvBtn('districts',[['District','Crimes','Population','Per 1,000','Solve rate %','YoY %','Median price'],...S.districts.map(d=>[d.name,d.total,d.population,d.rate,solveOf(d).toFixed(1),d.yoy==null?'':d.yoy,PR.districts[d.code][0]])],'the district comparison')}${tipI('Districts ranked by crimes per 1,000 residents.')}</span></div>
 <div style="overflow-x:auto"><table><thead><tr><th>District</th><th class="n">Crimes</th><th class="n">Residents</th><th class="n">Per 1,000</th><th class="n">Solved</th><th class="n">YoY</th></tr></thead><tbody>${[...S.districts].sort((x,y)=>y.rate-x.rate).map(d=>`<tr><td><a class="tlink" href="?${dq(d)}" data-q="${dq(d)}" data-tip="Open the ${d.name} profile.">${d.name}</a></td><td class="n">${fmt(d.total)}</td><td class="n">${fmt(d.population)}</td><td class="n">${d.rate}</td><td class="n">${solveOf(d).toFixed(1)}%</td><td class="n">${d.yoy==null?'–':`<span class="yoy ${d.yoy>0?'up':d.yoy<0?'down':''}">${d.yoy>0?'+':''}${d.yoy}%</span>`}</td></tr>`).join('')}</tbody></table></div></div></section>`:''}
 </div>`;
 wireSearch();trendAll($('#trend'),a.monthly,mAll);if(isAll){chartTheme();charts.push(new Chart($('#scatter'),{type:'scatter',data:{datasets:[{data:S.districts.map(d=>({x:PR.districts[d.code][0],y:d.rate,n:d.name})),backgroundColor:css('--teal'),pointRadius:8,pointHoverRadius:10}]},options:{animation:reduce?false:undefined,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw.n}: £${fmt(c.raw.x)}, ${c.raw.y} per 1,000`}}},scales:{x:{title:{display:true,text:'Median house price (£)'},ticks:{callback:v=>'£'+v/1000+'k'}},y:{beginAtZero:true,title:{display:true,text:'Crimes per 1,000'}}}}}))}}
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
  <p class="muted"><a href="method.html">How to read these figures</a></p></section></div>`;
 document.querySelectorAll('.rbtn[data-r]').forEach(btn=>btn.onclick=()=>{setR(parseFloat(btn.dataset.r));compareView(a,b)});
 document.querySelectorAll('.rbtn[data-w]').forEach(btn=>btn.onclick=()=>{setW(parseInt(btn.dataset.w,10));compareView(a,b)});
 $('#cswap').onclick=()=>go('compare=1&a='+encodeURIComponent(b||'')+'&b='+encodeURIComponent(a||''));
 document.querySelectorAll('.cform').forEach(f=>f.onsubmit=e=>{e.preventDefault();const v=new FormData(f).get('pc').trim().toUpperCase();const side=f.dataset.side;
  const na=side==='a'?v:(a||''); const nb=side==='b'?v:(b||''); go('compare=1&a='+encodeURIComponent(na)+'&b='+encodeURIComponent(nb))});
 if(a)fillCompare('a',a); if(b)fillCompare('b',b)}
async function fillCompare(side,raw){const el=$('#c-'+side); el.innerHTML='<div class="sk" style="height:180px"></div>';
 const pcq=raw.replace(/\s+/g,'').toUpperCase(); let r; try{r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq)).then(x=>x.json())}catch{el.innerHTML='<p class="muted">Lookup failed.</p>';return}
 if(!r||r.status!=200){el.innerHTML='<p class="muted">Postcode not found.</p>';return}
 const R=r.result,{latitude:la,longitude:lo,postcode}=R,ad=R.admin_district,dist=S.districts.find(d=>d.name==ad);
 if(!dist){el.innerHTML=`<p class="muted">${esc(postcode)} is outside Cambridgeshire &amp; Peterborough.</p>`;return}
 const rMi=getR(),w=getW(); const near= (await loadPointsNear(la,lo,rMi)).filter(p=>inWindow(p,w));
 const cats=S.categories.map(c=>c.id),by={},oc=[0,0,0,0,0,0,0]; near.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1;oc[p[4]]++});
 const nonAsb=near.length-oc[6],solve=nonAsb?(oc[0]+oc[1])/nonAsb*100:null;
 const busiest=Object.entries(by).sort((x,y)=>y[1]-x[1])[0];
 let lsoaHtml=''; try{const lr=await lj('lsoa_rates'); const row=lr.lsoa[R.codes&&(R.codes.lsoa21||R.codes.lsoa)]; if(row&&row.rate!=null) lsoaHtml=`<div>LSOA rate <b>${row.rate}</b> <span class="badge ${row.band==='Low'?'good':row.band==='High'?'bad':'neu'}">${row.band}</span></div>`}catch{}
 el.innerHTML=`<h2><a class="tlink" href="?pc=${encodeURIComponent(postcode)}" data-q="pc=${encodeURIComponent(postcode)}">${postcode}</a></h2>
  <div class="where">${esc(R.admin_ward||'')}${R.admin_ward?', ':''}${esc(ad)}</div>
  <div class="ms" style="margin-top:12px">
   <div>Crimes ${rMi} mi · ${w} mo<b>${fmt(near.length)}</b></div>
   <div>Solved<b>${solve==null?'–':solve.toFixed(0)+'%'}</b></div>
   <div>District rate<b>${dist.rate}</b></div>
  </div>
  ${lsoaHtml}
  <p class="muted" style="margin-top:10px">Most common: ${busiest?cn(busiest[0])+' ('+fmt(busiest[1])+')':'–'}</p>
  <p><a class="btn ghost" href="?pc=${encodeURIComponent(postcode)}" data-q="pc=${encodeURIComponent(postcode)}">Open full dashboard</a></p>`}

const LAYERS={crimes:{n:'Crimes',c:'#f59e0b',i:'shield',t:'Crime points within the chosen radius, clustered. Colour: amber.'},gp:{n:'GPs',c:'#e11d48',i:'heart',t:'GP surgeries within 5 miles (NHS ODS). Colour: red.'},dent:{n:'Dentists',c:'#7c3aed',i:'tooth',t:'Dental practices within 5 miles (NHS ODS). Colour: purple.'},sch:{n:'Schools',c:'#16a34a',i:'school',t:'Open schools within 5 miles with phase and Ofsted grade (DfE GIAS, Ofsted). Colour: green.'},bus:{n:'Bus stops',c:'#2563eb',i:'bus',t:'Bus stops within 3 miles (NaPTAN), clustered. Colour: blue.'},rail:{n:'Rail',c:'#334155',i:'train',t:'Railway stations (NaPTAN). Colour: slate.'},heat:{n:'Heat columns',c:'#dc2626',i:'chart',t:'3D only: crimes counted in 200m squares within the chosen radius and drawn as columns. Taller and redder means more crimes. Turning this on switches to 3D.'},park:{n:'Parks',c:'#15803d',i:'park',t:'Parks, playing fields, play spaces and similar sites from OS Open Greenspace (centroids). Colour: green.'}};
async function dashboard(raw){const pcq=raw.replace(/\s+/g,'').toUpperCase();skeleton(raw.toUpperCase());
 let r;try{r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq)).then(r=>r.json())}catch{return stateView('Could not reach the postcode service','Check your connection and try again.')}
 if(!r||r.status!=200){let sug=[];try{sug=(await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pcq.slice(0,-1))+'/autocomplete?limit=4').then(x=>x.json())).result||[]}catch{}
  return stateView(`We couldn't find “${esc(raw)}”`,'Check the postcode is complete and spelled correctly, for example PE29 3TN.'+(sug.length?' Did you mean: '+sug.map(s=>`<a href="?pc=${encodeURIComponent(s)}" data-q="pc=${encodeURIComponent(s)}">${s}</a>`).join(', ')+'?':''),'search')}
 const R=r.result,{latitude:la,longitude:lo,postcode}=R,ad=R.admin_district,dist=S.districts.find(d=>d.name==ad);
 if(!dist)return stateView(`${postcode} is outside our area`,`${esc(postcode)} is in ${esc(ad||'an unknown area')}. StreetLens currently covers Cambridgeshire and Peterborough only. Try one of these instead:`,'map');
 nav(slug(dist.name));
 const rMi=getR(),w=getW(),wm=wMonths(w),degPad=rMi*0.02;
 setMeta(`${postcode} · ${ad} — StreetLens`,`Crime, outcomes, schools and homes within ${rMi===0.5?'½':rMi} mile${rMi===1?'':'s'} of ${postcode} (${R.admin_ward?R.admin_ward+', ':''}${ad}), ${wLabel(w)}.`,location.origin+location.pathname+pcUrl(postcode));
 const [nearLoaded,GP,DE,SC,ST,RA,SS,GS]=await Promise.all([loadPointsNear(la,lo,rMi), ...['gp','dentists','schools','stops','rail','stopsearch'].map(lj), lj('greenspace').catch(()=>[])]);
 const nearAll=nearLoaded.filter(p=>inWindow(p,w));
 const cats=S.categories.map(c=>c.id);let tf=getTypeFilter();
 const near=(!tf||tf.size===S.categories.length)?nearAll:nearAll.filter(p=>tf.has(cats[p[2]]));
 const by={},mon={},oc=[0,0,0,0,0,0,0];wm.forEach(m=>mon[m]=0);nearAll.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1;mon[S.months[p[3]]]++;oc[p[4]]++});
 const nonAsb=nearAll.length-oc[6],pos=oc[0]+oc[1],solve=nonAsb?pos/nonAsb*100:null,cs=solveOf(S.overview),ds=solveOf(dist);
 const nearSS=ssNear(SS,la,lo,rMi,w),ssN=nearSS.length,sector=postcode.slice(0,-2).trim(),sp=PR.sectors[sector],dp=PR.districts[dist.code];
 const st500=ST.filter(p=>Math.abs(p[0]-la)<.01&&hav(la,lo,p[0],p[1])<=0.3107).length,rails=nearest(RA,la,lo,3);
 const gps=nearest(GP,la,lo,3),des=nearest(DE,la,lo,3),scs=nearest(SC,la,lo,5),busN=nearest(ST,la,lo,3),parks=nearest(GS||[],la,lo,5);
 const busiest=Object.entries(by).sort((a,b)=>b[1]-a[1])[0],mv=wm.map(m=>mon[m]||0);
 // typical 1-mile count across all points in district is costly; compare with district density via share of district crime per sq mile is misleading, so compare with county median of 1-mile counts is skipped. Use district/county rates for context.
 const nl=(arr,key,meta)=>`<ol class="near">${arr.map((x,k)=>`<li><span class="ico" style="background:${LAYERS[key].c}">${ic(LAYERS[key].i,18)}</span><b>${esc(x[2])}</b><span class="d">${x.d.toFixed(1)} mi</span><span class="m">${meta(x)}</span></li>`).join('')}</ol>`;
 const schip=(icon,lab,val,tab,t)=>`<button class="schip" data-go="${tab}" data-tip="${esc(t)}">${ic(icon,18)}<span>${lab}</span><b>${val}</b></button>`;
 app.innerHTML=`<div class="sumbar"><div class="wrap"><div><h1>${postcode}</h1><div class="where">${esc(R.admin_ward||'')}${R.admin_ward?', ':''}${esc(ad)}</div></div>
 <div class="schips">${schip('shield','Crimes '+ (rMi===0.5?'½':rMi) +' mi',fmt(nearAll.length),'crime','Crimes recorded within '+rMi+' mile(s) in '+wLabel(w)+'. Open the Crime tab.')}
 ${schip('people','District rate',dist.rate+' <small>vs '+S.overview.rate+'</small>','crime',`${ad}: ${dist.rate} crimes per 1,000 residents against a county figure of ${S.overview.rate}.`)}
 ${schip('check','Solved',solve==null?'–':solve.toFixed(0)+'%','out','Solve rate for crimes within '+rMi+' mile(s). Open the Outcomes tab.')}
 ${schip('home','Median',sp?'£'+fmt(Math.round(sp[0]/1000))+'k':'–','homes','Median sale price in postcode sector '+sector+'. Open the Homes tab.')}
 ${schip('heart','GP',gps[0].d.toFixed(1)+' mi','health','Nearest GP: '+gps[0][2]+'. Open the Health tab.')}
 ${schip('school','School',scs[0].d.toFixed(1)+' mi','schools','Nearest school: '+scs[0][2]+'. Open the Schools tab.')}
 ${schip('train','Station',rails[0].d.toFixed(1)+' mi','transport','Nearest rail station: '+rails[0][2]+'. Open the Transport tab.')}
 ${schip('depr','IMD','…','police','Index of Multiple Deprivation for this neighbourhood. Opens the Police / area tab.')}
 ${schip('flood','Flood','…','police','Rivers and sea flood risk for this postcode.')}
 ${schip('wifi','BB','…','police','Broadband availability.')}
 ${parks[0]?schip('park','Park',parks[0].d.toFixed(1)+' mi','transport','Nearest park or playing field (OS Open Greenspace): '+parks[0][2]+'.'):''}</div>
 <button class="btn ghost" id="share" data-tip="Copy a link to this dashboard so you can share it.">${ic('share',18)}<span class="sl">Share</span></button>
 <button class="btn ghost" id="printb" data-tip="Print a one-page area briefing for this postcode.">${ic('dl',18)}<span class="sl">Print</span></button></div></div>
 <aside class="briefing" id="briefing"><h2>Area briefing · ${postcode}</h2>
  <p>${esc(R.admin_ward||'')}${R.admin_ward?', ':''}${esc(ad)} · ${rMi===0.5?'½':rMi} mile radius · ${wLabel(w)} (${mname(wm[0])} – ${mname(wm.at(-1))})</p>
  <ul>
   <li>Recorded crimes in the radius: ${fmt(nearAll.length)}${busiest?' (most common: '+cn(busiest[0])+')':''}</li>
   <li>Solve rate: ${solve==null?'–':solve.toFixed(1)+'%'} (${fmt(pos)} of ${fmt(nonAsb)} non-ASB)</li>
   <li>Charged / resolved ${fmt(oc[0]+oc[1])} · No suspect ${fmt(oc[2])} · Still investigating ${fmt(oc[4])}</li>
   <li>${ad} rate ${dist.rate} per 1,000${dist.yoy==null?'':'; year-on-year '+((dist.yoy>0?'+':'')+dist.yoy+'%')} (county ${S.overview.rate}, YoY ${S.overview.yoy==null?'–':((S.overview.yoy>0?'+':'')+S.overview.yoy+'%')})</li>
   <li id="brief-x">Flood, broadband and deprivation load below.</li>
  </ul></aside>
 <div class="dash"><div class="mapcol"><div class="maptools">${radiusBar(rMi)}${windowBar(w)}${typeFilterBar(by,tf)}</div><div class="layers" role="group" aria-label="Map layers">${Object.entries(LAYERS).map(([k,v])=>`<label class="lt" style="color:${v.c}" data-tip="${esc(v.t)}"><input type="checkbox" data-l="${k}" ${k=='crimes'?'checked':''}><span class="dot" style="background:${v.c}">${ic(v.i,13)}</span><span class="t">${v.n}</span></label>`).join('')}</div>
 <div class="mapbox" id="mapbox"><div id="map" role="region" aria-label="Map of ${postcode} and surroundings"></div>
 <div class="mapctl"><button id="fs" aria-label="Full screen map" data-tip="Expand the map to full screen. Press Esc or tap again to exit.">${ic('expand')}</button><button id="mode3d" aria-pressed="false" aria-label="Switch to 3D map" data-tip="Switch between the flat 2D map and a tilted 3D view with extruded buildings. In 3D, drag with two fingers or right-click to tilt and rotate.">3D</button><button id="recentre" aria-label="Recentre map" data-tip="Return the map to ${postcode} and the search area.">${ic('target')}</button></div>
 <div class="legend" aria-label="Map legend"><span><i style="background:#0f766e;border-radius:0;height:3px;width:14px;box-shadow:none;border:0"></i>${rMi===0.5?'½':rMi} mi area</span>${Object.values(LAYERS).map(v=>`<span><i style="background:${v.c}"></i>${v.n}</span>`).join('')}</div></div></div>
 <div class="panel"><div class="tabs" role="tablist" aria-label="Area topics">${[['crime','Crime','shield'],['out','Outcomes','gavel'],['health','Health','heart'],['schools','Schools','school'],['transport','Transport','bus'],['homes','Homes','home'],['police','Police','people']].map(([k,n,i],x)=>`<button class="tab" role="tab" id="t-${k}" aria-controls="p-${k}" aria-selected="${!x}" tabindex="${x?-1:0}">${ic(i,17)}${n}</button>`).join('')}</div>
 <section class="tp" role="tabpanel" id="p-crime" aria-labelledby="t-crime">
  <div class="mini">${kpi('shield','Within '+(rMi===0.5?'½':rMi)+' mi',fmt(nearAll.length),busiest?'Most common: '+cn(busiest[0]):'','Crimes recorded within '+rMi+' mile(s) of '+postcode+' over '+wLabel(w)+'.',spark(mv,'#f59e0b'))}
  ${kpi('people',ad+' rate',dist.rate+' / 1,000',badge(dist.rate,S.overview.rate,'county'),'District crimes per 1,000 residents compared with the county.')}
  ${kpi('map','LSOA rate','…','Loading neighbourhood rate','Crimes per 1,000 in this Lower Super Output Area (approx). Band is relative to Cambridgeshire & Peterborough.')}</div>
  <div class="card">${typeTable(by,nearAll.length||1,'near')}</div>
  <div class="card"><div class="row"><h3>Month by month</h3><span class="ctl">${csvBtn('nearmonthly',[['Month','Crimes within radius'],...wm.map(m=>[m,mon[m]||0])],'the monthly counts')}${tipI('Crimes recorded each month within the chosen radius of this postcode.')}</span></div><div style="height:220px"><canvas id="trend"></canvas></div></div>
  <div class="card"><div class="row"><h3>Top crime types over time</h3>${tipI('The four most common crime types within the radius, month by month.')}</div><div style="height:220px"><canvas id="typetrend" aria-label="Crime type trends"></canvas></div></div></section>
 <section class="tp" role="tabpanel" id="p-out" aria-labelledby="t-out" hidden>
  <div class="mini">${kpi('check','Solve rate near you',solve==null?'–':solve.toFixed(1)+'%',`${fmt(pos)} of ${fmt(nonAsb)} crimes ${solve==null?'':badge(solve,cs,'county',false)}`,'Share of crimes within the chosen radius (excluding anti-social behaviour, which has no outcomes) where someone was charged or summonsed, or got an out-of-court resolution such as a caution or community resolution. Recent crimes may still be under investigation.')}
  ${kpi('hand','Stop and searches',fmt(ssN),'Within radius, '+wLabel(w),'Police stop and searches recorded with a location within the chosen radius and time window.')}
  ${kpi('gavel','Charged / resolved',fmt(oc[0]+oc[1]),((nonAsb?(oc[0]+oc[1])/nonAsb*100:0).toFixed(0))+'% of non-ASB','Charged/summonsed plus out-of-court resolutions within the radius.')}
  ${kpi('people','No suspect',fmt(oc[2]),((nonAsb?oc[2]/nonAsb*100:0).toFixed(0))+'% of non-ASB','Crimes closed with no suspect identified.')}
  ${kpi('alert','Still investigating',fmt(oc[4]),((nearAll.length?oc[4]/nearAll.length*100:0).toFixed(0))+'% of all','Latest outcome still under investigation or awaiting update. Newer months tend to look higher.')}</div>
  <div class="card"><div class="row"><h3>How outcomes move month by month</h3>${tipI('For crimes within the chosen radius. ASB has no outcome and is left out of these lines. “Charged / resolved” combines charged/summonsed and out-of-court resolutions.')}</div>
  <div style="height:240px"><canvas id="outtrend" aria-label="Monthly outcome trends"></canvas></div></div>
  <div class="card">${outTable(oc,'nearout')}</div><p class="muted">District solve rate ${ds.toFixed(1)}% · county ${cs.toFixed(1)}%. Recent months often show more cases still under investigation.</p>
  ${ssBlock(nearSS,w)}</section>
 <section class="tp" role="tabpanel" id="p-health" aria-labelledby="t-health" hidden>
  <div class="card"><div class="row"><h3>Nearest GP surgeries</h3>${tipI('Active GP practices from the NHS Organisation Data Service, by straight-line distance.')}</div>${nl(gps,'gp',x=>x[3])}</div>
  <div class="card"><div class="row"><h3>Nearest dentists</h3>${tipI('Active dental practices from the NHS Organisation Data Service. Check with the practice whether it takes new NHS patients.')}</div>${nl(des,'dent',x=>x[3])}</div></section>
 <section class="tp" role="tabpanel" id="p-schools" aria-labelledby="t-schools" hidden>
  <div class="card"><div class="row"><h3>Nearest schools</h3>${tipI('Open schools from DfE Get Information about Schools. The grade is the latest Ofsted overall effectiveness, from a graded inspection or an ungraded check that confirmed the grade. Single-word grades stopped in September 2024.')}</div>${nl(scs,'sch',x=>esc(x[3])+' · '+esc(x[4])+(x[5]?`<br><span class="badge ${/Outstanding|Good/.test(x[5])?'good':/Inadequate|Requires/.test(x[5])?'bad':'neu'}">Ofsted: ${esc(x[5])}</span> ${esc(x[6]||'')}`:'<br><span class="badge neu">No Ofsted grade published</span>'))}</div></section>
 <section class="tp" role="tabpanel" id="p-transport" aria-labelledby="t-transport" hidden>
  <div class="mini">${kpi('bus','Bus stops within 500m',st500,'From the NaPTAN stop register','Active bus stops within 500 metres of the postcode.')}${kpi('train','Nearest station',esc(rails[0][2]),rails[0].d.toFixed(1)+' miles','Nearest National Rail station by straight-line distance.')}</div>
  <div class="card"><div class="row"><h3>Nearest rail stations</h3></div>${nl(rails,'rail',()=> 'National Rail')}</div>
  <div class="card"><div class="row"><h3>Nearest bus stops</h3></div>${nl(busN,'bus',()=> 'Bus stop')}</div></section>
 <section class="tp" role="tabpanel" id="p-homes" aria-labelledby="t-homes" hidden>
  <div class="mini">${kpi('home','Median price, '+sector,sp?'£'+fmt(sp[0]):'–',sp?`${fmt(sp[1])} sales ${badge(sp[0],dp[0],ad,false).replace(/bad|good/,'neu')}`:'No sales recorded','Median price of standard residential sales in this postcode sector, HM Land Registry Price Paid Data.')}
  ${kpi('chart',ad+' median','£'+fmt(dp[0]),fmt(dp[1])+' sales','District median for comparison.')}</div>
  <p class="muted">Sales from ${PR.from.slice(0,7)} to ${PR.to.slice(0,7)}. Standard residential sales only; excludes repossessions and transfers.</p></section>
 <section class="tp" role="tabpanel" id="p-police" aria-labelledby="t-police" hidden>
  <div class="card"><div class="row"><h3>Area context</h3>${tipI("Deprivation, flood risk and broadband for this postcode or its LSOA.")}</div><div id="areax"><p class="muted">Loading…</p></div></div>
  <div class="card" id="nbhood"><p class="muted">Loading neighbourhood team…</p></div>
  <p class="muted"><a href="method.html">How to read these figures</a></p></section>
 </div></div>`;
 // tabs
 const tabs=[...document.querySelectorAll('.tab')];const sel=t=>{tabs.forEach(b=>{const on=b===t;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;$('#'+b.getAttribute('aria-controls')).hidden=!on});
  const lay={health:['gp','dent'],schools:['sch'],transport:['bus','rail']}[t.id.slice(2)];if(lay)lay.forEach(l=>{const c=document.querySelector(`input[data-l=${l}]`);if(!c.checked){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}})};
 tabs.forEach((b,i)=>{b.onclick=()=>sel(b);b.onkeydown=e=>{const k={ArrowRight:1,ArrowLeft:-1}[e.key];if(k){const n=tabs[(i+k+tabs.length)%tabs.length];sel(n);n.focus();e.preventDefault()}}});
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const t=$('#t-'+b.dataset.go);sel(t);t.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'});t.focus({preventScroll:true})});
 $('#printb')&&($('#printb').onclick=()=>window.print());
 $('#share').onclick=async()=>{const url=location.origin+location.pathname+pcUrl(postcode);try{if(navigator.share&&touch)await navigator.share({title:'StreetLens: '+postcode,url});else{await navigator.clipboard.writeText(url);$('#share').innerHTML=ic('check',18)+'<span class="sl">Copied</span>'}}catch{}};
 document.querySelectorAll('.rbtn[data-r]').forEach(b=>b.onclick=()=>{setR(parseFloat(b.dataset.r));window._keep=snapState();dashboard(postcode)});
 document.querySelectorAll('.rbtn[data-w]').forEach(b=>b.onclick=()=>{setW(parseInt(b.dataset.w,10));window._keep=snapState();dashboard(postcode)});
 document.querySelectorAll('.tchip').forEach(b=>b.onclick=()=>{let cur=getTypeFilter()||new Set(S.categories.map(c=>c.id));
  if(b.dataset.tf==='all'){setTypeFilter(null)}else{const id=b.dataset.tf;if(cur.has(id)&&cur.size>1)cur.delete(id);else cur.add(id);if(cur.size===S.categories.length)setTypeFilter(null);else setTypeFilter(cur)}
  window._keep=snapState();dashboard(postcode)});
 loadNeighbourhood(la,lo,$('#nbhood'));
 (async()=>{const ex=await loadAreaExtras(postcode,(R.codes&&(R.codes.lsoa21||R.codes.lsoa))||'');
  const host=$('#areax'); if(!host)return;
  const chipUp=(lab,val)=>{const b=[...document.querySelectorAll('.schip')].find(x=>x.textContent.includes(lab));if(b){const bb=b.querySelector('b');if(bb)bb.textContent=val}};
  chipUp('IMD',ex.im?('D'+ex.im.d):'–');chipUp('Flood',ex.fb?bandLabel(ex.fb).split(' ')[0]:'None');chipUp('BB',ex.gig==null?'–':ex.gig+'%');
  const bx=$('#brief-x'); if(bx) bx.textContent='Deprivation: '+(ex.im?('IMD decile '+ex.im.d+' ('+decileLabel(ex.im.d)+')'):'not matched')+'. Flood (rivers & sea): '+(ex.fb?bandLabel(ex.fb):'none mapped')+'. Broadband: '+(ex.gig==null?'not mapped':ex.gig+'% gigabit'+(ex.sfbb!=null?', SFBB '+ex.sfbb+'%':'')+(ex.secFallback?' (sector)':''))+'.';
  try{const lr=await lj('lsoa_rates'); const row=lr&&lr.lsoa&&lr.lsoa[(R.codes&&(R.codes.lsoa21||R.codes.lsoa))||''];
   const el=[...document.querySelectorAll('.kpi')].find(k=>k.textContent.includes('LSOA rate'));
   if(el&&row&&row.rate!=null){el.querySelector('.val').textContent=row.rate+' / 1,000';el.querySelector('.sub').innerHTML=`<span class="badge ${row.band==='Low'?'good':row.band==='High'?'bad':'neu'}">${row.band} for Cambs</span> · ${fmt(row.n)} crimes · pop ${fmt(row.pop)}`;
    el.querySelector('.lab').innerHTML=ic('map')+'LSOA rate'+tipI('Approximate rate for this LSOA (2021). Crimes are assigned to the nearest LSOA centroid because police anonymise locations. Band is Low/Medium/High among Cambridgeshire & Peterborough LSOAs. Not an official police LSOA statistic.')}
   else if(el){el.querySelector('.val').textContent='–';el.querySelector('.sub').textContent='No LSOA estimate'}}catch{}

  const floodTxt=ex.fb?bandLabel(ex.fb):'None mapped';
  const bbTxt=ex.gig==null?'–':(ex.gig+'% gigabit')+(ex.secFallback?' (sector)':'');
  host.innerHTML=`<div class="mini">
   ${kpi('depr','Deprivation (IMD 2025)',ex.im?('Decile '+ex.im.d):'–',ex.im?decileLabel(ex.im.d):'No LSOA match','Index of Multiple Deprivation 2025 for this LSOA. Decile 1 is the most deprived 10% of neighbourhoods in England.')}
   ${kpi('flood','Flood risk (rivers & sea)',floodTxt,ex.fb?'Highest band for properties in this postcode':'No property in a mapped rivers/sea flood area for this postcode.','Environment Agency Risk of Flooding from Rivers and Sea. Does not cover surface water.')}
   ${kpi('wifi','Broadband',bbTxt,ex.sfbb!=null?('SFBB '+ex.sfbb+'% of premises'):'Ofcom residential coverage','Share of residential premises that can get gigabit-capable and superfast (SFBB) broadband. Ofcom Connected Nations.')}
  </div>
  <p class="muted">Sources: MHCLG IoD 2025 · Environment Agency RoFRS · Ofcom Connected Nations (OGL). <a href="method.html">How to read this</a>.</p>`})();
 const u=new URL(location.href);u.search=pcUrl(postcode);history.replaceState(null,'',u);
 trend($('#trend'),mon,'Crimes within radius',wm); if($('#outtrend'))outcomeTrend($('#outtrend'),nearAll,wm); if($('#typetrend'))typeTrend($('#typetrend'),nearAll,cats,wm); if($('#sstrend'))drawSsTrend($('#sstrend'),nearSS,w);
 // map
 window._ctx={la,lo,postcode,near,nearAll,cats,rMi,w,GP:within0(GP,la,lo,5),DE:within0(DE,la,lo,5),SC:within0(SC,la,lo,5),ST:within0(ST,la,lo,3),RA:within0(RA,la,lo,15),GS:within0(GS||[],la,lo,5)};
 map=L.map('map',{zoomControl:true}).setView([la,lo],rMi<=0.5?15:rMi<=1?14:13);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
 const area=L.circle([la,lo],{radius:rMi*1609.34,color:'#0f766e',weight:2,fillOpacity:.04}).addTo(map);
 L.marker([la,lo],{icon:L.divIcon({className:'',html:`<div class="pin" style="width:34px;height:34px;background:#14213d">${ic('pin',18)}</div>`,iconSize:[34,34],iconAnchor:[17,17]}),zIndexOffset:1000,keyboard:true,title:postcode}).addTo(map).bindPopup('<b>'+postcode+'</b>');
 const clus=c=>L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,iconCreateFunction:g=>{const n=g.getChildCount(),s=n<10?30:n<100?38:46;return L.divIcon({className:'',html:`<div class="cl" style="width:${s}px;height:${s}px;background:${c}">${n}</div>`,iconSize:[s,s]})}});
 const pinI=(k,s=28)=>L.divIcon({className:'',html:`<div class="pin" style="width:${s}px;height:${s}px;background:${LAYERS[k].c}">${ic(LAYERS[k].i,s*.55|0)}</div>`,iconSize:[s,s],iconAnchor:[s/2,s/2]});
 const crimeL=clus(LAYERS.crimes.c);near.forEach(p=>crimeL.addLayer(L.circleMarker([p[0],p[1]],{radius:6,color:'#fff',weight:1.5,fillColor:LAYERS.crimes.c,fillOpacity:.95}).bindPopup(`<b>${cn(cats[p[2]])}</b><br>${mname(S.months[p[3]])}<br><i>${S.outcomeBuckets[p[4]]}</i>`)));
 const within=(arr,mi)=>arr.filter(p=>hav(la,lo,p[0],p[1])<=mi);
 const grp=(arr,k,pop,mi=5)=>{const g=clus(LAYERS[k].c);within(arr,mi).forEach(p=>g.addLayer(L.marker([p[0],p[1]],{icon:pinI(k),title:p[2]}).bindPopup(pop(p))));return g};
 const busL=clus(LAYERS.bus.c);within(ST,3).forEach(p=>busL.addLayer(L.circleMarker([p[0],p[1]],{radius:5,color:'#fff',weight:1.5,fillColor:LAYERS.bus.c,fillOpacity:.95}).bindPopup('Bus stop: '+esc(p[2]))));
 const ML={crimes:crimeL,gp:grp(GP,'gp',p=>`<b>${esc(p[2])}</b><br>GP practice · ${p[3]}`),dent:grp(DE,'dent',p=>`<b>${esc(p[2])}</b><br>Dental practice · ${p[3]}`),
  sch:grp(SC,'sch',p=>`<b>${esc(p[2])}</b><br>${esc(p[3])} · ${esc(p[4])}${p[5]?'<br>Ofsted: '+esc(p[5]):''}`),heat:L.layerGroup(),bus:busL,rail:L.layerGroup(within(RA,15).map(p=>L.marker([p[0],p[1]],{icon:pinI('rail',32),title:p[2]}).bindPopup('<b>'+esc(p[2])+'</b>'))),park:grp(GS||[],'park',p=>`<b>${esc(p[2])}</b><br>${esc(p[3]||'Greenspace')}`)};
 map.addLayer(ML.crimes);
 $('.layers').onchange=e=>{const k=e.target.dataset.l,l=ML[k];e.target.checked?map.addLayer(l):map.removeLayer(l);if(k=='heat'){const ci=document.querySelector('input[data-l=crimes]');if(e.target.checked){if(ci.checked){ci.checked=false;map.removeLayer(ML.crimes)}if(!is3d())set3d(true);else heatView()}else if(!ci.checked){ci.checked=true;map.addLayer(ML.crimes)}}m3vis()};
 $('#recentre').onclick=()=>{if(is3d()&&m3)m3.jumpTo(view3d());else map.fitBounds(area.getBounds())};
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
Promise.all([fetch('data/summary.json').then(r=>r.json()),lj('prices')]).then(([s,pr])=>{S=s;PR=pr;$('#gen').textContent=`Data updated: ${s.generated}, covering ${mname(s.months[0])} – ${mname(s.months.at(-1))}.`;render()}).catch(()=>{app.innerHTML='<div class="wrap"><div class="card state"><h1>Something went wrong</h1><p>The data could not be loaded. Please refresh the page.</p></div></div>'});

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
  pt('crimes',fc(c.near,p=>({h:`<b>${cn(c.cats[p[2]])}</b><br>${mname(S.months[p[3]])}<br><i>${S.outcomeBuckets[p[4]]}</i>`})),true,5);
  pt('gp',fc(c.GP,p=>({h:`<b>${esc(p[2])}</b><br>GP practice · ${p[3]}`})),true);pt('dent',fc(c.DE,p=>({h:`<b>${esc(p[2])}</b><br>Dental practice · ${p[3]}`})),true);
  pt('sch',fc(c.SC,p=>({h:`<b>${esc(p[2])}</b><br>${esc(p[3])} · ${esc(p[4])}${p[5]?'<br>Ofsted: '+esc(p[5]):''}`})),true);
  pt('bus',fc(c.ST,p=>({h:'Bus stop: '+esc(p[2])})),true,4);pt('rail',fc(c.RA,p=>({h:'<b>'+esc(p[2])+'</b>'})),false,9);
  if(c.GS) pt('park',fc(c.GS,p=>({h:`<b>${esc(p[2])}</b><br>${esc(p[3]||'Greenspace')}`})),true);
  new maplibregl.Marker({color:'#14213d'}).setLngLat([c.lo,c.la]).setPopup(new maplibregl.Popup().setHTML('<b>'+c.postcode+'</b>')).addTo(M);
  M._slIds=ids;M._slReady=true;m3vis()})}

