/* members.js — roster and the member record drawer.
   The drawer is tabbed: overview, attendance, fight (fighters only)
   and billing. */
"use strict";

/* ============================================================
   MEMBERS
   ============================================================ */
function viewMembers(){
  const f = UI.mFilter;
  const all = B(S.members);
  let list = all.filter(m=>{
    const k = statusOf(m).key;
    if(f==="all")   return !m.cancelled;
    if(f==="risk")  return !m.cancelled && atRisk(m)>=14 && k!=="expired";
    if(f==="dues")  return duesOf(m.id)>0;
    if(f==="fight") return m.track==="fight" && !m.cancelled;
    if(f==="pt")    return S.pt.some(p=>p.memberId===m.id && p.used<p.total);
    return k===f;
  });
  if(UI.mQuery){ const q=UI.mQuery.toLowerCase();
    list = list.filter(m=>(m.name+" "+m.id+" "+m.phone).toLowerCase().includes(q)); }
  const sorters = {
    name:(a,b)=>a.name.localeCompare(b.name),
    expiry:(a,b)=>new Date(a.end)-new Date(b.end),
    joined:(a,b)=>new Date(b.joined)-new Date(a.joined),
    visits:(a,b)=>visitsSince(b.id,30)-visitsSince(a.id,30),
    dues:(a,b)=>duesOf(b.id)-duesOf(a.id),
  };
  list = list.sort(sorters[UI.mSort]);
  const c = {
    all: all.filter(m=>!m.cancelled).length,
    active: all.filter(m=>statusOf(m).key==="active").length,
    expiring: all.filter(m=>statusOf(m).key==="expiring").length,
    expired: all.filter(m=>statusOf(m).key==="expired").length,
    frozen: all.filter(m=>statusOf(m).key==="frozen").length,
    fight: all.filter(m=>m.track==="fight" && !m.cancelled).length,
    risk: all.filter(m=>!m.cancelled && atRisk(m)>=14 && statusOf(m).key!=="expired").length,
    dues: all.filter(m=>duesOf(m.id)>0).length,
    pt: all.filter(m=>S.pt.some(p=>p.memberId===m.id && p.used<p.total)).length,
  };
  const chip=(id,l)=>`<button class="chip" data-mfilter="${id}" aria-pressed="${f===id}">${l} <span class="num muted">${c[id]}</span></button>`;

  return `<div class="stack">
    <div class="row">
      <div class="filters">${chip("all","Everyone")}${chip("active","Active")}${chip("expiring","Expiring")}
        ${chip("expired","Expired")}${chip("frozen","Frozen")}${chip("fight","Fight track")}
        ${chip("risk","At risk")}${chip("dues","Owes money")}${chip("pt","On PT")}</div>
      <div style="margin-left:auto" class="row">
        <input id="mq" class="chip" style="width:186px;padding:6px 10px" placeholder="Filter this list" value="${esc(UI.mQuery)}">
        <select id="msort" class="chip" style="padding:6px 10px">
          ${[["name","Name"],["expiry","Expiry date"],["joined","Recently joined"],["visits","Visits (30d)"],["dues","Dues"]]
            .map(([v,l])=>`<option value="${v}"${UI.mSort===v?" selected":""}>Sort: ${l}</option>`).join("")}
        </select>
        <button class="btn btn-sm" id="exportBtn">Export CSV</button>
      </div>
    </div>
    <div class="card"><div class="card-body tight"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Member</th>${UI.branch==="ALL"?"<th>Centre</th>":""}<th>Plan</th><th>Trains</th>
        <th>Membership</th><th>Expires</th><th>Visits / 30d</th><th>Coach</th><th class="ta-r">Dues</th><th></th></tr></thead>
      <tbody>${list.map(m=>{
        const st=statusOf(m), d=duesOf(m.id), v30=visitsSince(m.id,30);
        return `<tr data-member="${m.id}">
          <td>${memberCell(m)}</td>
          ${UI.branch==="ALL"?`<td class="muted">${branchById(m.branchId).name}</td>`:""}
          <td class="muted">${planById(m.planId).name}</td>
          <td>${discTags(m.disciplines.slice(0,3))}</td>
          <td><span class="${st.cls}">${st.label}</span></td>
          <td class="num muted">${fmtDs(m.end)}</td>
          <td style="min-width:70px"><div class="num" style="font-size:11.5px">${v30}</div>${bar(v30,20)}</td>
          <td class="muted">${m.coachId?esc(coachById(m.coachId).name.split(" ")[0]):"—"}</td>
          <td class="ta-r num" style="color:${d?"var(--crit)":"var(--ink-3)"}">${d?money(d):"—"}</td>
          <td class="ta-r"><button class="btn btn-sm" data-renew="${m.id}">Renew</button></td></tr>`;
      }).join("") || emptyRow(10,"No members match this filter.")}</tbody>
    </table></div></div></div>
    <div class="hint">${list.length} of ${c.all} members shown · ${bLabel()}. Click a row to open the record.</div>
  </div>`;
}

/* ---------------- member drawer ---------------- */
function openMember(id, tab){
  const m = memberById(id); if(!m) return;
  const isFighter = m.track==="fight";
  const tabs = ["overview","attendance", ...(isFighter?["fight"]:[]), "billing"];
  UI.tab = tabs.includes(tab||UI.tab) ? (tab||UI.tab) : "overview"; UI.tabId = id;
  const st=statusOf(m), plan=planById(m.planId), co=m.coachId?coachById(m.coachId):null, br=branchById(m.branchId);
  const pkg = S.pt.find(p=>p.memberId===id);
  const invs = S.invoices.filter(i=>i.memberId===id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const visits = S.checkins.filter(c=>c.memberId===id).sort((a,b)=>b.ts.localeCompare(a.ts));
  const d = duesOf(id);
  const klasses = S.classes.filter(c=>c.booked.includes(id)||c.waitlist.includes(id));

  const panes = {
    overview:()=>`
      <div><div class="sec-title">Membership</div><dl class="dl">
        <dt>Centre</dt><dd>${br.name} <span class="muted">· ${esc(br.area)}</span></dd>
        <dt>Plan</dt><dd>${plan.name} · ${money(plan.price)} / ${plan.months}mo</dd>
        <dt>Status</dt><dd><span class="${st.cls}">${st.label}</span></dd>
        <dt>Cycle</dt><dd class="num">${fmtD(m.start)} → ${fmtD(m.end)}</dd>
        <dt>Member since</dt><dd class="num">${fmtD(m.joined)} <span class="muted">(${Math.floor(days(TODAY,m.joined)/30)} months)</span></dd>
        <dt>Track</dt><dd>${isFighter?'<span class="pill pill-crit">Fight track</span>':'<span class="pill">Fitness track</span>'} <span class="muted">· ${m.level}</span></dd>
        <dt>Trains</dt><dd>${discTags(m.disciplines)}</dd>
        <dt>Coach</dt><dd>${co?esc(co.name)+' <span class="muted">· '+esc(co.role)+'</span>':"Not assigned"}</dd>
        <dt>Goal</dt><dd>${esc(m.goal)}</dd>
        <dt>Came from</dt><dd>${esc(m.source)}</dd>
      </dl></div>
      <div><div class="sec-title">Contact</div><dl class="dl">
        <dt>Phone</dt><dd class="num">${esc(m.phone)}</dd>
        <dt>Email</dt><dd style="word-break:break-all">${esc(m.email)}</dd>
        <dt>Age / sex</dt><dd class="num">${m.age} · ${m.gender}</dd>
        <dt>Emergency</dt><dd>${esc(m.emergency)}</dd>
      </dl></div>
      ${pkg?`<div><div class="sec-title">Personal training</div>
        <div class="mini"><span>${pkg.total}-session pack with ${esc(coachById(pkg.coachId).name)}</span><b class="num">${pkg.total-pkg.used} left</b></div>
        <div style="margin-top:7px">${bar(pkg.used,pkg.total)}</div>
        <div class="mini" style="margin-top:7px"><span class="muted">Expires ${fmtD(pkg.expiry)}</span>
          <button class="btn btn-sm" data-usept="${id}">Log a session</button></div></div>`:""}
      ${klasses.length?`<div><div class="sec-title">Booked classes</div>
        ${klasses.map(c=>`<div class="mini"><span>${esc(c.name)} · ${DAYNAMES[c.dow]} ${c.time}</span>
          <span class="pill ${c.booked.includes(id)?"pill-good":"pill-warn"}">${c.booked.includes(id)?"Confirmed":"Waitlist"}</span></div>`).join("")}</div>`:""}
      <div><div class="sec-title">Notes</div>
        <textarea id="mnote" rows="3" style="width:100%;padding:9px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2)" placeholder="Injuries, preferences, conversations...">${esc(m.notes)}</textarea>
        <button class="btn btn-sm" style="margin-top:7px" data-savenote="${id}">Save note</button></div>`,

    attendance:()=>{
      const grid=[]; for(let w=11;w>=0;w--) for(let dd=6;dd>=0;dd--){
        const day=addD(TODAY,-(w*7+dd)); grid.push({day, hit:visits.some(v=>iso(v.ts)===iso(day))});
      }
      return `<div><div class="sec-title">Last 12 weeks</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">
          ${grid.map(c=>`<i title="${fmtD(c.day)}${c.hit?" · trained":""}" style="display:block;height:14px;border-radius:2px;background:${c.hit?"var(--data)":"var(--surface-3)"}"></i>`).join("")}</div>
        <div class="legend"><i style="background:var(--surface-3)"></i> rest <i></i> trained</div>
        <div class="mini" style="margin-top:13px"><span>Visits, last 30 days</span><b class="num">${visitsSince(id,30)}</b></div>
        <div class="mini"><span>Visits, last 90 days</span><b class="num">${visitsSince(id,90)}</b></div>
        <div class="mini"><span>Last visit</span><b class="num">${visits[0]?fmtD(visits[0].ts):"never"}</b></div>
        <div class="mini"><span>Usual slot</span><b class="num">${visits.length?(visits.filter(v=>new Date(v.ts).getHours()<12).length>visits.length/2?"Mornings":"Evenings"):"—"}</b></div>
      </div>
      <div><div class="sec-title">Recent check-ins</div>
        ${visits.slice(0,14).map(v=>`<div class="mini"><span class="num">${fmtD(v.ts)}</span>
          <span class="muted num">${new Date(v.ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span></div>`).join("")
          || '<div class="empty">No check-ins recorded.</div>'}</div>`;
    },

    fight:()=>{
      const r = readiness(m);
      const sp = sparsOf(id).sort((a,b)=>b.ts.localeCompare(a.ts));
      const pctOfScale = clamp(m.weight/r.limit*100, 0, 118);
      const rows = [["Mat time","35",r.parts.mat,`${r.v30} sessions in 30 days`],
                    ["Sparring","30",r.parts.spar,`${r.r30} rounds in 30 days`],
                    ["On weight","20",r.parts.weight, r.over>0?`${r.over.toFixed(1)} kg over the limit`:"inside the limit"],
                    ["Freshness","15",r.parts.fresh, r.ls?`last spar ${days(TODAY,r.ls)} days ago`:"no sparring logged"]];
      return `<div>
        <div class="row" style="gap:14px;align-items:center">
          ${ring(r.total, r.band)}
          <div><div class="disp" style="font-size:22px;text-transform:uppercase">${r.verdict}</div>
            <div class="hint">Readiness score out of 100${m.nextBout?` · bout in ${days(m.nextBout,TODAY)} days`:""}</div></div>
        </div>
        <div style="margin-top:14px">${rows.map(([l,max,val,note])=>`
          <div style="margin-bottom:10px"><div class="mini" style="border:0;padding:0 0 4px">
            <span>${l} <span class="muted">${note}</span></span><b class="num">${val}/${max}</b></div>
            ${bar(val,Number(max), val/Number(max)>=.75?"good":val/Number(max)>=.45?"warn":"crit")}</div>`).join("")}</div>
      </div>
      <div><div class="sec-title">Weight</div>
        <div class="wclass" style="margin-bottom:7px">
          <span class="disp" style="font-size:24px">${m.weight.toFixed(1)} kg</span>
          <span class="pill ${r.over>0?"pill-crit":"pill-good"}">${m.weightClass}</span>
          <span class="hint">limit ${r.limit} kg</span></div>
        <div class="scale">
          <div class="now ${r.over>0?"over":""}" style="width:${pctOfScale}%"></div>
          <div class="limit" style="left:100%"></div>
          <b>${r.over>0?"+"+r.over.toFixed(1)+" kg to cut":(r.limit-m.weight).toFixed(1)+" kg of room"}</b>
        </div>
        <div class="row" style="margin-top:9px">
          <input id="wIn" type="number" step="0.1" value="${m.weight}" style="width:96px;padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2)">
          <button class="btn btn-sm" data-weigh="${id}">Record weigh-in</button>
        </div>
      </div>
      <div><div class="sec-title">Record</div>
        ${m.record?`<div class="row" style="gap:12px">
          <span class="record">${m.record.w}<span class="muted">W</span> · ${m.record.l}<span class="muted">L</span> · ${m.record.d}<span class="muted">D</span></span>
          <span class="pill">${m.level}</span>${m.belt?beltChip(m.belt):""}</div>`
          :`<div class="hint">No bouts yet · ${m.level}${m.belt?" · "+m.belt+" belt":""}</div>`}
        <div class="mini" style="margin-top:9px"><span>Next bout</span><b class="num">${m.nextBout?fmtD(m.nextBout)+" ("+days(m.nextBout,TODAY)+"d)":"not scheduled"}</b></div>
        <div class="mini"><span>Rounds, last 90 days</span><b class="num">${roundsSince(id,90)}</b></div>
      </div>
      <div><div class="sec-title">Sparring log</div>
        <div class="row" style="margin-bottom:9px">
          <input id="spRounds" type="number" min="1" max="15" value="5" style="width:70px;padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2)">
          <select id="spType" style="padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2)">
            <option value="live">Live</option><option value="technical">Technical</option><option value="drill">Drill</option></select>
          <button class="btn btn-sm btn-primary" data-spar="${id}">Log rounds</button>
        </div>
        ${sp.slice(0,12).map(s=>`<div class="mini"><span class="num">${fmtD(s.ts)}</span>
          <span><span class="tag">${s.partner}</span> <b class="num">${s.rounds} rds</b></span></div>`).join("")
          || '<div class="hint">No sparring logged yet.</div>'}</div>`;
    },

    billing:()=>`
      <div><div class="sec-title">Account</div>
        <div class="mini"><span>Lifetime paid</span><b class="num">${money(invs.reduce((s,i)=>s+i.paid,0))}</b></div>
        <div class="mini"><span>Outstanding</span><b class="num" style="color:${d?"var(--crit)":"inherit"}">${money(d)}</b></div>
        <div class="mini"><span>Next renewal</span><b class="num">${fmtD(m.end)} · ${money(plan.price)}</b></div></div>
      <div><div class="sec-title">Invoices</div><div class="tbl-wrap"><table class="tbl"><tbody>
        ${invs.map(i=>`<tr class="norow"><td><b style="font-weight:600" class="num">${i.id}</b>
          <div class="muted" style="font-size:11px">${esc(i.item)} · ${fmtD(i.date)}</div></td>
          <td class="ta-r num">${money(i.amount)}${i.paid&&i.paid<i.amount?`<div class="muted" style="font-size:10.5px">${money(i.paid)} paid</div>`:""}</td>
          <td class="ta-r"><span class="pill ${i.status==="paid"?"pill-good":i.status==="overdue"?"pill-crit":"pill-warn"}">${i.status}</span>
            ${i.status!=="paid"?`<div style="margin-top:5px"><button class="btn btn-sm" data-pay="${i.id}">Record payment</button></div>`:""}</td></tr>`).join("")
          || emptyRow(3,"No invoices yet.")}
      </tbody></table></div></div>`,
  };

  openDrawer(`
    <div class="drawer-head">
      <div class="avatar lg${isFighter?" fighter":""}">${initials(m.name)}</div>
      <div style="flex:1;min-width:0">
        <h2 style="font-size:24px;text-transform:uppercase">${esc(m.name)}</h2>
        <div class="muted num" style="font-size:12px">${m.id} · ${esc(m.phone)} · ${br.name}</div>
        <div class="row" style="margin-top:7px;gap:5px">
          <span class="${st.cls}">${st.label}</span>
          <span class="pill">${plan.name}</span>
          ${isFighter?`<span class="pill pill-crit">${m.weightClass}</span>`:""}
          ${d?`<span class="pill pill-crit">${money(d)} due</span>`:""}
          ${checkedInToday(m.id)?'<span class="pill pill-good">In today</span>':""}
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" data-close="1" aria-label="Close">✕</button>
    </div>
    <div class="tabs">${tabs.map(t=>`<button class="tab" data-mtab="${t}" aria-selected="${UI.tab===t}">${t}</button>`).join("")}</div>
    <div class="drawer-body">${panes[UI.tab]()}</div>
    <div style="padding:12px 17px;border-top:1px solid var(--line);display:flex;gap:7px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" data-renew="${m.id}">Renew</button>
      ${checkedInToday(m.id)?"":`<button class="btn btn-sm" data-checkin="${m.id}">Check in</button>`}
      <button class="btn btn-sm" data-freeze="${m.id}">${m.frozen?"Unfreeze":"Freeze"}</button>
      <button class="btn btn-sm" data-track="${m.id}">${isFighter?"Move to fitness":"Move to fight track"}</button>
      <button class="btn btn-sm btn-danger" data-cancel="${m.id}">Cancel</button>
    </div>`);
}
