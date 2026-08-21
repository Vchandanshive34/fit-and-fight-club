/* coaches.js — coaching staff.
   Personal-training load, sessions delivered versus owed, class
   occupancy and estimated payouts. */
"use strict";

/* ============================================================
   COACHES
   ============================================================ */
function viewCoaches(){
  const staff = UI.branch==="ALL" ? COACHES : COACHES.filter(c=>c.branchId===UI.branch);
  const rows = staff.map(t=>{
    const pkgs = S.pt.filter(p=>p.coachId===t.id);
    const clients = S.members.filter(m=>m.coachId===t.id && !m.cancelled);
    const klasses = S.classes.filter(c=>c.coachId===t.id);
    const delivered = pkgs.reduce((s,p)=>s+p.used,0);
    const remaining = pkgs.reduce((s,p)=>s+(p.total-p.used),0);
    const seats = klasses.reduce((s,c)=>s+c.booked.length,0);
    const caps  = klasses.reduce((s,c)=>s+c.cap,0);
    const fightersCoached = clients.filter(m=>m.track==="fight").length;
    const payout = delivered*t.rate*0.5 + klasses.length*500;
    return {t,pkgs,clients,klasses,delivered,remaining,seats,caps,payout,fightersCoached};
  }).sort((a,b)=>b.payout-a.payout);

  return `<div class="stack">
    <div class="kpis">
      ${kpi("Coaches", staff.length, `${S.pt.filter(p=>staff.some(s=>s.id===p.coachId)).length} personal-training packs`, "var(--accent)")}
      ${kpi("PT sessions delivered", rows.reduce((s,r)=>s+r.delivered,0), "lifetime across packs", "var(--good)")}
      ${kpi("Sessions owed", rows.reduce((s,r)=>s+r.remaining,0), "prepaid and not yet used", "var(--warn)")}
      ${kpi("Estimated payouts", money(rows.reduce((s,r)=>s+r.payout,0)), "PT commission + class fees", "var(--data)")}
    </div>
    <div class="split3">
      ${rows.map(r=>`<div class="card ${r.t.disc.some(d=>discById(d).fight)?"corner-red":"corner-blue"}">
        <div class="card-head">
          <div class="avatar lg fighter">${initials(r.t.name)}</div>
          <div style="flex:1;min-width:0">
            <h3 style="font-size:19px">${esc(r.t.name)}</h3>
            <div class="muted" style="font-size:12px">${esc(r.t.role)} · ${branchById(r.t.branchId).name} · since ${r.t.since}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="row" style="gap:5px;margin-bottom:11px">
            ${discTags(r.t.disc)}<span class="tag num">${money(r.t.rate)}/session</span></div>
          <div class="mini"><span>PT clients</span><b class="num">${r.clients.length}</b></div>
          <div class="mini"><span>Fighters coached</span><b class="num">${r.fightersCoached}</b></div>
          <div class="mini"><span>Sessions delivered</span><b class="num">${r.delivered}</b></div>
          <div class="mini"><span>Sessions owed</span><b class="num" style="color:${r.remaining>40?"var(--warn)":"inherit"}">${r.remaining}</b></div>
          <div class="mini"><span>Classes / week</span><b class="num">${r.klasses.length}</b></div>
          <div class="mini"><span>Class occupancy</span><b class="num">${r.caps?Math.round(r.seats/r.caps*100):0}%</b></div>
          <div class="mini"><span>Estimated payout</span><b class="num">${money(r.payout)}</b></div>
          <div class="sec-title" style="margin-top:12px">Class load</div>
          ${r.klasses.length?r.klasses.sort((a,b)=>a.dow-b.dow||a.time.localeCompare(b.time)).map(c=>`
            <div class="mini" style="cursor:pointer" data-class="${c.id}">
              <span>${DAYNAMES[c.dow]} ${c.time} · ${esc(c.name)}</span>
              <span class="num muted">${c.booked.length}/${c.cap}</span></div>`).join("")
            :'<div class="hint">No group classes assigned.</div>'}
        </div>
      </div>`).join("")}
    </div>
  </div>`;
}
