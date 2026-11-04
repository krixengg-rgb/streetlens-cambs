let S,P,chart,map;const $=s=>document.querySelector(s),fmt=n=>n.toLocaleString('en-GB');
const slug=s=>s.toLowerCase().replace(/[^a-z]+/g,'-');
const mname=m=>new Date(m+'-01').toLocaleDateString('en-GB',{month:'short',year:'2-digit'});
const cn=id=>(S.categories.find(c=>c.id==id)||{name:id}).name;
function csv(name,rows){const b=new Blob([rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click()}
function typeTable(byType,total,id){const rows=Object.entries(byType).filter(e=>e[1]).sort((a,b)=>b[1]-a[1]);const max=rows[0]?rows[0][1]:1;
 window['_'+id]=[['Crime type','Count','Share %'],...rows.map(([k,v])=>[cn(k),v,(v/total*100).toFixed(1)])];
 return `<div class="row"><h2>By crime type</h2><span class="ctl"><button class="btn" data-tip="Download this crime-type table as a CSV file for Excel or Sheets." onclick="csv('${id}.csv',_${id})">Download CSV</button>${tipI('Each row is a police crime category; share is its percentage of all crimes shown here.')}</span></div><table><tr><th>Type</th><th class="n">Count</th><th class="n">Share</th><th style="width:30%"></th></tr>${rows.map(([k,v])=>`<tr><td>${cn(k)}</td><td class="n">${fmt(v)}</td><td class="n">${(v/total*100).toFixed(1)}%</td><td><div class="bar"><i style="width:${v/max*100}%"></i></div></td></tr>`).join('')}</table>`}
function trend(monthly){if(chart)chart.destroy();chart=new Chart($('#trend'),{type:'line',data:{labels:S.months.map(mname),datasets:[{data:S.months.map(m=>monthly[m]),borderColor:'#0f766e',backgroundColor:'#0f766e22',fill:true,tension:.3}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}})}
function areaView(a,isAll){const period=`${mname(S.months[0])} – ${mname(S.months.at(-1))}`;
 $('#htitle').textContent=isAll?'Crime in Cambridgeshire, made clear':`Crime in ${a.name}`;
 let html=`<div class="cards"><div class="card"><div class="muted">Recorded crimes, ${period}</div><div class="big">${fmt(a.total)}</div></div>
 <div class="card"><div class="muted">Per 1,000 residents (12 months)</div><div class="big">${a.rate}</div>${isAll?'':`<div class="muted">County average ${S.overview.rate}</div>`}</div>
 <div class="card"><div class="muted">Residents (ONS mid-${S.popYear})</div><div class="big">${fmt(a.population)}</div></div>
 <div class="card"><div class="muted">Monthly average</div><div class="big">${fmt(Math.round(a.total/12))}</div></div></div>
 <div class="grid2"><div class="card">${typeTable(a.byType,a.total,'types')}</div><div class="card"><div class="row"><h2>Month by month</h2><button class="btn" onclick="csv('monthly.csv',[['Month','Crimes'],...S.months.map(m=>[m,${JSON.stringify(a.monthly)}[m]])])" data-tip="Download the monthly crime counts as a CSV file.">Download CSV</button></div><canvas id="trend" height="220"></canvas></div></div>`;
 if(isAll){window._d=[['District','Crimes','Population','Per 1,000'],...S.districts.map(d=>[d.name,d.total,d.population,d.rate])];
 html+=`<div class="card dist" style="margin-top:16px"><div class="row"><h2>Districts compared</h2><span class="ctl"><button class="btn" data-tip="Download the district comparison as a CSV file." onclick="csv('districts.csv',_d)">Download CSV</button>${tipI('Districts ranked by crimes per 1,000 residents. Click a name to open that district.')}</span></div><table><tr><th>District</th><th class="n">Crimes</th><th class="n">Residents</th><th class="n">Per 1,000</th></tr>${[...S.districts].sort((a,b)=>b.rate-a.rate).map(d=>`<tr><td><a href="#/${slug(d.name)}" data-tip="Open the ${d.name} page with its full breakdown and trend.">${d.name}</a></td><td class="n">${fmt(d.total)}</td><td class="n">${fmt(d.population)}</td><td class="n">${d.rate}</td></tr>`).join('')}</table></div>`}
 $('#app').innerHTML=html;trend(a.monthly)}
function hav(a,b,c,d){const R=3958.8,r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
async function postcodeView(pc){$('#pcerr').textContent='';$('#app').innerHTML='Looking up postcode…';
 const r=await fetch('https://api.postcodes.io/postcodes/'+encodeURIComponent(pc)).then(r=>r.json()).catch(()=>null);
 if(!r||r.status!=200){$('#pcerr').textContent='Postcode not found.';return route()}
 const {latitude:la,longitude:lo,postcode,admin_district}=r.result;$('#htitle').textContent=`Within 1 mile of ${postcode}`;
 if(!P)P=await fetch('data/points.json').then(r=>r.json());
 const near=P.filter(p=>Math.abs(p[0]-la)<.02&&Math.abs(p[1]-lo)<.03&&hav(la,lo,p[0],p[1])<=1);
 const cats=S.categories.map(c=>c.id),by={},mon={};S.months.forEach(m=>mon[m]=0);near.forEach(p=>{by[cats[p[2]]]=(by[cats[p[2]]]||0)+1;mon[S.months[p[3]]]++});
 if(!near.length&&!S.districts.some(d=>d.name==admin_district)){$('#app').innerHTML=`<div class="card">${postcode} is in ${admin_district}, outside Cambridgeshire. This prototype only covers Cambridgeshire & Peterborough for now.</div>`;return}
 const busiest=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
 $('#app').innerHTML=`<div class="cards"><div class="card"><div class="muted">Crimes within 1 mile, last 12 months</div><div class="big">${fmt(near.length)}</div></div><div class="card"><div class="muted">Most common</div><div class="big" style="font-size:20px">${busiest?cn(busiest[0]):'–'}</div></div><div class="card"><div class="muted">District</div><div class="big" style="font-size:20px">${admin_district}</div></div></div>
 <div class="card" style="margin-bottom:16px"><div id="map"></div><div class="muted" style="margin-top:6px">Markers show anonymised map points; numbers in circles are grouped crimes.</div></div>
 <div class="grid2"><div class="card">${typeTable(by,near.length||1,'near')}</div><div class="card"><div class="row"><h2>Month by month</h2>${tipI('Crimes recorded each month within 1 mile of this postcode.')}</div><canvas id="trend" height="220"></canvas></div></div>`;
 trend(mon);if(map)map.remove();map=L.map('map').setView([la,lo],14);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
 L.circle([la,lo],{radius:1609,color:'#0f766e',fill:false}).addTo(map);L.marker([la,lo]).addTo(map).bindPopup(postcode);
 const cl=L.markerClusterGroup();near.forEach(p=>cl.addLayer(L.circleMarker([p[0],p[1]],{radius:5,color:'#f59e0b'}).bindPopup(`${cn(cats[p[2]])}<br>${mname(S.months[p[3]])}`)));map.addLayer(cl)}
function route(){const h=decodeURIComponent(location.hash.slice(2));
 $('#nav').innerHTML=`<a href="#/" data-tip="County-wide summary for Cambridgeshire &amp; Peterborough." class="${!h?'on':''}">Overview</a>`+S.districts.map(d=>`<a href="#/${slug(d.name)}" data-tip="Crime figures for ${d.name} district." class="${h==slug(d.name)?'on':''}">${d.name}</a>`).join('');
 if(h.startsWith('postcode/'))return postcodeView(h.slice(9));const d=S.districts.find(d=>slug(d.name)==h);areaView(d||S.overview,!d)}
$('#pcform').onsubmit=e=>{e.preventDefault();const v=$('#pc').value.trim();if(v)location.hash='#/postcode/'+v.replace(/\s+/g,'')};
fetch('data/summary.json').then(r=>r.json()).then(s=>{S=s;$('#gen').textContent=`Data ${s.months[0]} to ${s.months.at(-1)}, built ${s.generated}.`;addEventListener('hashchange',route);route()});

function tipI(t){return `<button type="button" class="tip-i" aria-label="Help" data-tip="${t}"></button>`}
const tip=document.getElementById('tip');let tipEl=null;
function showTip(el){const t=el.getAttribute('data-tip');if(!t)return;tipEl=el;tip.textContent=t;tip.classList.add('show');
 const r=el.getBoundingClientRect(),w=tip.offsetWidth,hh=tip.offsetHeight;let x=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8),y=r.bottom+8;if(y+hh>innerHeight-8)y=r.top-hh-8;
 tip.style.left=x+'px';tip.style.top=y+'px';el.setAttribute('aria-describedby','tip');if(el.classList.contains('tip-i'))el.setAttribute('aria-expanded','true')}
function hideTip(){if(tipEl){tipEl.removeAttribute('aria-describedby');tipEl.removeAttribute('aria-expanded')}tipEl=null;tip.classList.remove('show')}
const touch=matchMedia('(hover:none)').matches;
document.addEventListener('mouseover',e=>{if(touch)return;const el=e.target.closest('[data-tip]');if(el)showTip(el);else if(tipEl&&!tipEl.classList.contains('tip-i'))hideTip()});
document.addEventListener('focusin',e=>{const el=e.target.closest('[data-tip]');if(el){showTip(el);tipT=Date.now()}else hideTip()});let tipT=0;
document.addEventListener('focusout',()=>hideTip());
document.addEventListener('click',e=>{const el=e.target.closest('.tip-i');if(el){e.preventDefault();tipEl===el&&tip.classList.contains('show')&&Date.now()-tipT>400?hideTip():showTip(el)}else if(!e.target.closest('[data-tip]'))hideTip()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip()});addEventListener('scroll',()=>{if(touch)hideTip()},{passive:true});
