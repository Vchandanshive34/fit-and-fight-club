/* checkin.js — front desk console.
   Search-and-check-in, today's log, an eight-week peak-hours heatmap
   and the members who have stopped turning up. */
"use strict";

/* ============================================================
   CHECK-IN
   ============================================================ */
function viewCheckin(){
  const chk = B(S.checkins);
  const today = chk.filter(c=>isToday(c.ts)).sort((a,b)=>b.ts.localeCompare(a.ts));
  const act = activeMembers();
  const q = UI.cQuery.toLowerCase();
  const matches = q ? B(S.members).filter(m=>!m.cancelled && (m.name+" "+m.id+" "+m.phone).toLowerCase().includes(q)).slice(0,8) : [];

  const HRS=[...Array(16)].map((_,i)=>i+6);
  const heat = DAYNAMES.map((_,d)=>HRS.map(h=>chk.filter(c=>{const t=new Date(c.ts);
    return days(TODAY,c.ts)<=56 && t.getDay()===d && t.getHours()===h;}).length));
  const hmax = Math.max(...heat.flat(),1);
  const risk = act.filter(m=>atRisk(m)>=10).sort((a,b)=>atRisk(b)-atRisk(a));
  const streak = act.map(m=>({m,n:visitsSince(m.id,30)})).sort((a,b)=>b.n-a.n).slice(0,8);

  return `<div class="stack">
    <div class="kpis">
      ${kpi("Checked in today", today.length, `${act.length?Math.round(today.length/act.length*100):0}% of the roster`, "var(--accent)")}
      ${kpi("In the building", today.filter(c=>(Date.now()-new Date(c.ts))<9e6).length, "checked in within 2.5 hours", "var(--good)")}
      ${kpi("Visits this week", chk.filter(c=>days(TODAY,c.ts)<7).length, "across all members", "var(--data)")}
      ${kpi("Not seen in 10+ days", risk.length, "worth a message", risk.length?"var(--warn)":"var(--good)")}
    </div>

    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Front desk</h3><span class="spacer"></span><span class="hint">name, member ID or phone</span></div>
        <div class="card-body">
          <input id="cq" placeholder="Search a member to check in..." value="${esc(UI.cQuery)}"
            style="width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:7px;background:var(--surface-2);font-size:15px">
          ${matches.length?`<div style="margin-top:11px;display:flex;flex-direction:column;gap:7px">
            ${matches.map(m=>{const st=statusOf(m),dd=duesOf(m.id),inn=checkedInToday(m.id);
              return `<div class="row" style="padding:9px 11px;border:1px solid var(--line);border-radius:7px;background:var(--surface-2)">
                <div class="avatar${m.track==="fight"?" fighter":""}">${initials(m.name)}</div>
                <div style="flex:1;min-width:0"><b style="font-weight:600">${esc(m.name)}</b>
                  <div class="muted num" style="font-size:11px">${m.id} · ${planById(m.planId).name} · ${branchById(m.branchId).name}</div></div>
                <span class="${st.cls}">${st.label}</span>
                ${dd?`<span class="pill pill-crit">${money(dd)} due</span>`:""}
                ${inn?'<span class="pill pill-good">Already in</span>'
                  :st.key==="expired"?`<button class="btn btn-sm btn-primary" data-renew="${m.id}">Renew to enter</button>`
                  :`<button class="btn btn-sm btn-primary" data-checkin="${m.id}">Check in</button>`}
              </div>`;}).join("")}</div>`
            : q ? '<div class="empty">No member matches that.</div>' : ""}
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Today's log</h3><span class="spacer"></span><span class="num muted">${today.length}</span></div>
        <div class="card-body tight" style="max-height:410px;overflow-y:auto"><div class="tbl-wrap"><table class="tbl"><tbody>
          ${today.map(c=>{const m=memberById(c.memberId); if(!m) return "";
            return `<tr data-member="${m.id}"><td>${memberCell(m,true)}</td>
              <td class="ta-r num muted">${new Date(c.ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td></tr>`;}).join("")
            || emptyRow(2,"Nobody has checked in yet today.")}
        </tbody></table></div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>When the floor is busy</h3>
        <span class="hint">check-ins by hour, last 8 weeks — use it to staff the desk and place classes</span></div>
      <div class="card-body"><div class="heat">
        <span></span>${HRS.map(h=>`<span class="hh">${h}</span>`).join("")}
        ${DAYNAMES.map((dn,di)=>`<span class="hd">${dn}</span>`+HRS.map((h,hi)=>{
          const v=heat[di][hi];
          return `<i style="opacity:${v?(0.14+0.86*v/hmax).toFixed(2):0.06}" title="${dn} ${h}:00 — ${v} check-ins"></i>`;}).join("")).join("")}
      </div>
      <div class="legend"><span>quiet</span><i style="opacity:.1"></i><i style="opacity:.35"></i><i style="opacity:.65"></i><i></i><span>peak (${hmax})</span></div></div>
    </div>

    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Drifting away</h3><span class="spacer"></span><span class="hint">${risk.length} members</span></div>
        <div class="card-body tight" style="max-height:400px;overflow-y:auto"><div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Member</th><th>Last visit</th><th>Expires</th><th></th></tr></thead>
          <tbody>${risk.slice(0,12).map(m=>`<tr data-member="${m.id}">
            <td>${memberCell(m,true)}</td>
            <td><span class="pill ${atRisk(m)>=30?"pill-crit":"pill-warn"}">${atRisk(m)}d</span></td>
            <td class="num muted">${fmtDs(m.end)}</td>
            <td class="ta-r"><button class="btn btn-sm" data-nudge="${m.id}">Log win-back call</button></td></tr>`).join("")
            || emptyRow(4,"Everyone is showing up.")}</tbody>
        </table></div></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Most consistent</h3><span class="hint">last 30 days</span></div>
        <div class="card-body tight"><div class="tbl-wrap"><table class="tbl"><tbody>
          ${streak.map(s=>`<tr data-member="${s.m.id}"><td>${memberCell(s.m,true)}</td>
            <td style="min-width:86px">${bar(s.n,streak[0].n||1)}</td><td class="ta-r num">${s.n}</td></tr>`).join("")
            || emptyRow(3,"No attendance yet.")}
        </tbody></table></div></div>
      </div>
    </div>
  </div>`;
}
