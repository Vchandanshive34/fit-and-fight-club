/* ui.js — chrome and shared view helpers.
   Routing, navigation, the branch picker, overlays and the small
   building blocks (KPI tiles, pills, meters) every view reuses. */
"use strict";

/* ---------------- chrome ---------------- */
const ROUTES = [
  {group:"Front desk", items:[{id:"dashboard",name:"Dashboard",icon:"grid"},{id:"checkin",name:"Check-in",icon:"scan"}]},
  {group:"Sales",      items:[{id:"leads",name:"Leads & trials",icon:"funnel"}]},
  {group:"Membership", items:[{id:"members",name:"Members",icon:"users"},{id:"billing",name:"Billing",icon:"rupee"}]},
  {group:"The floor",  items:[{id:"fighters",name:"Fight squad",icon:"glove"},{id:"classes",name:"Timetable",icon:"calendar"},{id:"coaches",name:"Coaches",icon:"whistle"}]},
];
const ICONS = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  scan:'<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M7 12h10"/>',
  funnel:'<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2"/><path d="M16.5 5.4a3.2 3.2 0 0 1 0 5.9M17.5 14.4c2.3.5 3.5 2.3 3.5 4.6"/>',
  rupee:'<circle cx="12" cy="12" r="9"/><path d="M9 8h6M9 11h6M13.5 8c1.5 0 2 1.2 2 2s-.6 2.6-3 2.6H9l4 4"/>',
  glove:'<path d="M7 11V6.5a2 2 0 0 1 4 0V10M11 10V5.5a2 2 0 0 1 4 0V10M15 10V7.5a2 2 0 0 1 4 0V14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-2.5a1.8 1.8 0 0 1 3.6 0"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  whistle:'<circle cx="9" cy="13" r="5"/><path d="M14 11h7l-2 3h-5M9 8V5h5"/>',
};
const icon = n => '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[n]||"")+'</svg>';

let route = "dashboard";
const badges = () => ({
  leads:    B(S.leads).filter(l=>OPEN_STAGES.includes(l.stage)).length,
  members:  activeMembers().length,
  fighters: fighters().length,
  billing:  B(S.invoices).filter(i=>i.status==="overdue").length || "",
  checkin:  B(S.checkins).filter(c=>isToday(c.ts)).length,
});
function renderNav(){
  const b = badges();
  $("#nav").innerHTML = ROUTES.map(g=>`
    <div class="nav-group">
      <div class="nav-label">${g.group}</div>
      ${g.items.map(it=>`<button class="nav-item" data-go="${it.id}" ${route===it.id?'aria-current="page"':""}>
        ${icon(it.icon)}<span>${it.name}</span>
        ${b[it.id]!==undefined&&b[it.id]!==""?`<span class="nav-count">${b[it.id]}</span>`:""}</button>`).join("")}
    </div>`).join("");
}
function renderBranches(){
  $("#branchPick").innerHTML = [{id:"ALL",name:"All centres"}].concat(BRANCHES)
    .map(b=>`<button data-branch="${b.id}" aria-pressed="${UI.branch===b.id}">${b.name}</button>`).join("");
}
const TITLES = {
  dashboard:["Dashboard","What is happening across the club today"],
  checkin:  ["Check-in","Front desk console and attendance history"],
  leads:    ["Leads & trials","Enquiries, free trials and follow-ups"],
  members:  ["Members","Roster, memberships and renewals"],
  fighters: ["Fight squad","Weight, sparring volume and camp readiness"],
  billing:  ["Billing","Invoices, payments and outstanding dues"],
  classes:  ["Timetable","Weekly schedule, bookings and waitlists"],
  coaches:  ["Coaches","Roster, personal-training load and payouts"],
};
function go(r){ route=r; render(); window.scrollTo({top:0}); }
function render(){
  const [t,s] = TITLES[route];
  $("#ptitle").textContent = t;
  $("#psub").textContent = s + " · " + bLabel();
  renderNav(); renderBranches();
  $("#view").innerHTML = ({dashboard:viewDashboard, checkin:viewCheckin, leads:viewLeads, members:viewMembers,
    fighters:viewFighters, billing:viewBilling, classes:viewClasses, coaches:viewCoaches})[route]();
  save();
}

/* ---------------- overlays ---------------- */
function toast(msg){
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg;
  $("#toasts").appendChild(el); setTimeout(()=>el.remove(), 2700);
}
function closeOverlays(){ $("#drawer").classList.remove("on"); $("#modal").classList.remove("on"); $("#scrim").classList.remove("on"); }
function openModal(h){ $("#modal").innerHTML=h; $("#modal").classList.add("on"); $("#scrim").classList.add("on");
  const f=$("#modal input,#modal select"); if(f) f.focus(); }
function openDrawer(h){ $("#drawer").innerHTML=h; $("#drawer").classList.add("on"); $("#scrim").classList.add("on"); }

/* ---------------- view helpers ---------------- */
const bar = (v,max,cls) => `<div class="meter ${cls||""}"><i style="width:${max?clamp(v/max*100,0,100):0}%"></i></div>`;
function kpi(label, value, foot, stripe){
  return `<div class="kpi" style="--stripe:${stripe||"var(--line-strong)"}"><span class="eyebrow">${label}</span>
    <div class="kpi-val">${value}</div><div class="kpi-foot">${foot||""}</div></div>`;
}
function memberCell(m, showBranch){
  return `<div class="cell-name"><div class="avatar${m.track==="fight"?" fighter":""}">${initials(m.name)}</div>
    <div><b>${esc(m.name)}</b><span>${m.id}${showBranch&&UI.branch==="ALL"?" · "+branchById(m.branchId).name:""}</span></div></div>`;
}
const discTags = ds => ds.map(d=>`<span class="tag">${esc(discById(d).short)}</span>`).join(" ");
const emptyRow = (c,m) => `<tr class="norow"><td colspan="${c}"><div class="empty">${m}</div></td></tr>`;
function ring(pct, band){
  return `<div class="ring" style="--pct:${pct};--rc:var(--${band})"><i>${pct}</i></div>`;
}
const beltChip = b => { const bt=BELTS.find(x=>x.name===b); return bt?`<span class="belt" style="--bc:${bt.color}">${bt.name} belt</span>`:""; };
