/* classes.js — weekly timetable.
   Seven-day grid, per-session roster management with waitlists, and
   which formats actually fill up. */
"use strict";

/* ============================================================
   TIMETABLE
   ============================================================ */
function viewClasses(){
  const all = B(S.classes);
  const seats = all.reduce((s,c)=>s+c.cap,0);
  const bookd = all.reduce((s,c)=>s+c.booked.length,0);
  const waits = all.reduce((s,c)=>s+c.waitlist.length,0);
  const full  = all.filter(c=>c.booked.length>=c.cap).length;
  const byName = {};
  all.forEach(c=>{ byName[c.name] = byName[c.name] || {cap:0,booked:0,n:0,disc:c.disc,level:c.level};
    byName[c.name].cap+=c.cap; byName[c.name].booked+=c.booked.length; byName[c.name].n++; });
  const ranked = Object.entries(byName).map(([name,v])=>({name,...v,fill:v.booked/v.cap})).sort((a,b)=>b.fill-a.fill);

  return `<div class="stack">
    <div class="kpis">
      ${kpi("Weekly sessions", all.length, `${Object.keys(byName).length} formats · ${B(COACHES).length} coaches`, "var(--accent)")}
      ${kpi("Seat occupancy", (seats?Math.round(bookd/seats*100):0)+"%", `${bookd} of ${seats} seats booked`, "var(--good)")}
      ${kpi("Sessions at capacity", full, full?"consider adding a slot":"room everywhere", full?"var(--warn)":"var(--good)")}
      ${kpi("On waitlists", waits, "members wanting a seat", waits?"var(--warn)":"var(--line-strong)")}
    </div>
    <div class="card">
      <div class="card-head"><h3>This week</h3><span class="hint">click a session to manage its roster</span>
        <span class="spacer"></span><span class="hint">${bLabel()}</span></div>
      <div class="card-body"><div class="sched">
        ${DAYNAMES.map((dn,d)=>`<div class="day-col">
          <div class="day-name ${d===TODAY.getDay()?"today":""}">${dn}${d===TODAY.getDay()?" · today":""}</div>
          ${all.filter(c=>c.dow===d).sort((a,b)=>a.time.localeCompare(b.time)).map(c=>{
            const co=coachById(c.coachId), fill=c.booked.length/c.cap;
            const col = fill>=1?"var(--crit)":fill>=.8?"var(--warn)":DISCIPLINES.find(x=>x.id===c.disc).fight?"var(--accent)":"var(--data)";
            return `<div class="klass" data-class="${c.id}" style="border-left-color:${col}">
              <span class="t">${c.time}</span><b>${esc(c.name)}</b>
              <div class="muted" style="font-size:10.5px">${esc(co.name.split(" ")[0])} · ${esc(c.room)}${UI.branch==="ALL"?" · "+branchById(c.branchId).name:""}</div>
              <div class="cap"><span class="num">${c.booked.length}/${c.cap}</span>
                ${c.waitlist.length?`<span class="num" style="color:var(--warn)">+${c.waitlist.length} wl</span>`:""}</div>
              <div style="margin-top:4px">${bar(c.booked.length,c.cap)}</div></div>`;}).join("")
            || '<div class="hint" style="padding:5px 2px">—</div>'}
        </div>`).join("")}
      </div></div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Which formats fill up</h3>
        <span class="hint">average occupancy across the week — the low ones are costing you floor time</span></div>
      <div class="card-body tight"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Format</th><th>Discipline</th><th>Level</th><th>Sessions / week</th><th>Occupancy</th><th class="ta-r">Booked</th></tr></thead>
        <tbody>${ranked.map(r=>`<tr class="norow">
          <td><b style="font-weight:600">${esc(r.name)}</b></td>
          <td>${discTags([r.disc])}</td>
          <td class="muted">${r.level}</td>
          <td class="num">${r.n}</td>
          <td style="min-width:146px"><div class="row" style="gap:8px">
            <div style="flex:1">${bar(r.booked,r.cap, r.fill>=.85?"good":r.fill<.55?"crit":"")}</div>
            <b class="num" style="font-size:12px">${Math.round(r.fill*100)}%</b></div></td>
          <td class="ta-r num">${r.booked}/${r.cap}</td></tr>`).join("") || emptyRow(6,"No classes at this centre.")}</tbody>
      </table></div></div>
    </div>
  </div>`;
}

function openClass(id){
  const c = S.classes.find(x=>x.id===id); if(!c) return;
  const co = coachById(c.coachId), br = branchById(c.branchId);
  const row = (mid, wait) => {
    const m = memberById(mid); if(!m) return "";
    return `<div class="mini"><span style="display:flex;gap:8px;align-items:center">
      <span class="avatar${m.track==="fight"?" fighter":""}" style="width:24px;height:24px;font-size:11px">${initials(m.name)}</span>
      <span>${esc(m.name)}</span></span>
      <span style="display:flex;gap:6px;align-items:center">
        ${wait?`<button class="btn btn-sm" data-promote="${c.id}:${mid}">Give seat</button>`:""}
        <button class="btn btn-sm btn-ghost" data-unbook="${c.id}:${mid}">Remove</button></span></div>`;
  };
  const eligible = S.members.filter(m=>m.branchId===c.branchId && !m.cancelled && new Date(m.end)>=TODAY
                     && !c.booked.includes(m.id) && !c.waitlist.includes(m.id))
                   .sort((a,b)=>a.name.localeCompare(b.name));
  openDrawer(`
    <div class="drawer-head">
      <div style="flex:1">
        <div class="eyebrow">${DAYNAMES[c.dow]} · ${c.time} · ${c.dur} min · ${br.name}</div>
        <h2 style="font-size:24px;margin-top:4px;text-transform:uppercase">${esc(c.name)}</h2>
        <div class="muted" style="font-size:12px">${esc(co.name)} · ${esc(c.room)} · ${c.level}</div>
      </div>
      <button class="btn btn-ghost btn-sm" data-close="1" aria-label="Close">✕</button>
    </div>
    <div class="drawer-body">
      <div><div class="sec-title">Capacity</div>
        <div class="mini" style="border:0;padding:0 0 6px"><span>${c.booked.length} of ${c.cap} seats taken</span>
          <b class="num">${Math.round(c.booked.length/c.cap*100)}%</b></div>
        ${bar(c.booked.length,c.cap)}
        <div class="row" style="margin-top:11px">
          <select id="bookSel" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2)">
            ${eligible.map(m=>`<option value="${m.id}">${esc(m.name)} · ${m.id}</option>`).join("") || '<option value="">No eligible members</option>'}
          </select>
          <button class="btn btn-sm btn-primary" data-book="${c.id}">Book</button></div>
      </div>
      <div><div class="sec-title">Roster (${c.booked.length})</div>
        ${c.booked.map(m=>row(m,false)).join("") || '<div class="empty">No bookings yet.</div>'}</div>
      ${c.waitlist.length?`<div><div class="sec-title">Waitlist (${c.waitlist.length})</div>
        ${c.waitlist.map(m=>row(m,true)).join("")}</div>`:""}
    </div>`);
}
