/* dashboard.js — the opening screen.
   Club-wide numbers, footfall, pipeline, the centre scoreboard and
   the two lists that drive the day: renewals and unpaid invoices. */
"use strict";

/* ============================================================
   DASHBOARD
   ============================================================ */
function viewDashboard(){
  const act = activeMembers();
  const mStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const pStart = new Date(TODAY.getFullYear(), TODAY.getMonth()-1, 1);
  const pSame  = new Date(TODAY.getFullYear(), TODAY.getMonth()-1, TODAY.getDate()+1);
  const inMTD  = d => new Date(d)>=mStart;
  const inPrev = d => { const x=new Date(d); return x>=pStart && x<pSame; };
  const mem = B(S.members), inv = B(S.invoices), chk = B(S.checkins), lds = B(S.leads);

  const joinsMTD = mem.filter(m=>inMTD(m.joined)).length;
  const joinsPrev= mem.filter(m=>inPrev(m.joined)).length;
  const revMTD   = inv.filter(i=>inMTD(i.date)).reduce((s,i)=>s+i.paid,0);
  const revPrev  = inv.filter(i=>inPrev(i.date)).reduce((s,i)=>s+i.paid,0);
  const dues     = inv.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.amount-i.paid),0);
  const dueCnt   = inv.filter(i=>i.status!=="paid").length;
  const todayIn  = chk.filter(c=>isToday(c.ts)).length;
  const risk     = act.filter(m=>atRisk(m)>=14);
  const expiring = act.filter(m=>{const l=days(m.end,TODAY);return l>=0&&l<=30;}).sort((a,b)=>new Date(a.end)-new Date(b.end));
  const fSquad   = fighters();
  const camp     = fSquad.map(m=>({m, r:readiness(m)}));
  const ready    = camp.filter(x=>x.r.total>=75).length;
  const bouts    = fSquad.filter(m=>m.nextBout).sort((a,b)=>new Date(a.nextBout)-new Date(b.nextBout));
  const trials   = lds.filter(l=>l.stage==="trial");
  const dueFollow= lds.filter(l=>OPEN_STAGES.includes(l.stage) && days(TODAY,l.followUp)>=0);
  const delta = (a,b)=> b ? `<span class="delta ${a>=b?"up":"down"}">${a>=b?"▲":"▼"} ${Math.abs(Math.round((a-b)/b*100))}%</span>` : "";

  const trend=[]; for(let d=13;d>=0;d--){const day=addD(TODAY,-d);trend.push({d:day,n:chk.filter(c=>iso(c.ts)===iso(day)).length});}
  const tmax = Math.max(...trend.map(t=>t.n),1);
  const todayClasses = B(S.classes).filter(c=>c.dow===TODAY.getDay()).sort((a,b)=>a.time.localeCompare(b.time));

  // branch scoreboard, only worth showing when looking at everything
  const scoreboard = UI.branch!=="ALL" ? "" : `
    <div class="card">
      <div class="card-head"><h3>Centre scoreboard</h3><span class="hint">this month so far</span></div>
      <div class="card-body tight"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Centre</th><th>Manager</th><th>Active</th><th>Joined MTD</th><th>Checked in today</th>
          <th>Fight squad</th><th class="ta-r">Collected MTD</th><th class="ta-r">Outstanding</th></tr></thead>
        <tbody>${BRANCHES.map(br=>{
          const bm = S.members.filter(m=>m.branchId===br.id && !m.cancelled && new Date(m.end)>=TODAY);
          const bi = S.invoices.filter(i=>i.branchId===br.id);
          return `<tr data-branch="${br.id}">
            <td><b style="font-weight:600">${br.name}</b><div class="muted" style="font-size:11px">${esc(br.area)}</div></td>
            <td class="muted">${esc(br.manager)}</td>
            <td class="num">${bm.length}</td>
            <td class="num">${S.members.filter(m=>m.branchId===br.id&&inMTD(m.joined)).length}</td>
            <td class="num">${S.checkins.filter(c=>c.branchId===br.id&&isToday(c.ts)).length}</td>
            <td class="num">${bm.filter(m=>m.track==="fight").length}</td>
            <td class="ta-r num">${money(bi.filter(i=>inMTD(i.date)).reduce((s,i)=>s+i.paid,0))}</td>
            <td class="ta-r num" style="color:var(--crit)">${money(bi.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.amount-i.paid),0))}</td>
          </tr>`;}).join("")}</tbody>
      </table></div></div>
    </div>`;

  return `<div class="stack">
    <div class="kpis">
      ${kpi("Active members", act.length, `${joinsMTD} joined this month ${delta(joinsMTD,joinsPrev)}`, "var(--accent)")}
      ${kpi("Checked in today", todayIn, `${act.length?Math.round(todayIn/act.length*100):0}% of the roster`, "var(--data)")}
      ${kpi("Collected this month", money(revMTD), `${money(revPrev)} by this day last month ${delta(revMTD,revPrev)}`, "var(--good)")}
      ${kpi("Outstanding dues", money(dues), `${dueCnt} unsettled invoice${dueCnt===1?"":"s"}`, "var(--crit)")}
      ${kpi("Renewals in 30 days", expiring.length, `${money(expiring.reduce((s,m)=>s+planById(m.planId).price,0))} at stake`, "var(--warn)")}
      ${kpi("Camp ready", ready+" / "+fSquad.length, "fighters scoring 75+", "var(--accent)")}
    </div>

    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Footfall, last 14 days</h3><span class="spacer"></span>
          <span class="hint">peak ${tmax} · avg ${Math.round(trend.reduce((s,t)=>s+t.n,0)/14)}/day</span></div>
        <div class="card-body">
          <div class="bars">${trend.map(t=>`<div class="bar ${t.n===tmax?"hi":""}" style="height:${Math.max(2,t.n/tmax*100)}%" title="${fmtD(t.d)} · ${t.n} check-ins"></div>`).join("")}</div>
          <div class="bars-x">${trend.map(t=>`<span>${t.d.getDate()}</span>`).join("")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Pipeline</h3><span class="spacer"></span>
          <button class="btn btn-sm" data-go="leads">Open board</button></div>
        <div class="card-body">
          ${OPEN_STAGES.map(sid=>{
            const st=stageById(sid), n=lds.filter(l=>l.stage===sid).length;
            const max=Math.max(...OPEN_STAGES.map(x=>lds.filter(l=>l.stage===x).length),1);
            return `<div style="margin-bottom:10px"><div class="mini" style="border:0;padding:0 0 4px">
              <span>${st.name}</span><b class="num">${n}</b></div>${bar(n,max)}</div>`;}).join("")}
          <div class="mini" style="margin-top:11px;border-top:1px solid var(--line);padding-top:10px">
            <span>Trials booked, not yet attended</span><b class="num" style="color:var(--warn)">${trials.length}</b></div>
          <div class="mini"><span>Follow-ups due or overdue</span><b class="num" style="color:${dueFollow.length?"var(--crit)":"inherit"}">${dueFollow.length}</b></div>
          <div class="mini"><span>Pipeline value</span><b class="num">${money(lds.filter(l=>OPEN_STAGES.includes(l.stage)).reduce((s,l)=>s+l.value,0))}</b></div>
        </div>
      </div>
    </div>

    ${scoreboard}

    <div class="split3">
      <div class="card">
        <div class="card-head"><h3>Renewals due</h3><span class="spacer"></span><button class="btn btn-sm" data-go="members">Members</button></div>
        <div class="card-body tight"><div class="tbl-wrap"><table class="tbl"><tbody>
          ${expiring.slice(0,7).map(m=>`<tr data-member="${m.id}"><td>${memberCell(m,true)}</td>
            <td class="muted">${planById(m.planId).name}</td>
            <td class="ta-r"><span class="${statusOf(m).cls}">${statusOf(m).label}</span></td></tr>`).join("")
            || emptyRow(3,"No renewals in the next 30 days.")}
        </tbody></table></div></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Payments to chase</h3><span class="spacer"></span><button class="btn btn-sm" data-go="billing">Billing</button></div>
        <div class="card-body tight"><div class="tbl-wrap"><table class="tbl"><tbody>
          ${inv.filter(i=>i.status!=="paid").sort((a,b)=>new Date(a.due)-new Date(b.due)).slice(0,7).map(i=>{
            const m=memberById(i.memberId); return `<tr data-member="${i.memberId}">
            <td>${m?memberCell(m,true):i.memberId}</td>
            <td class="num ta-r">${money(i.amount-i.paid)}</td>
            <td class="ta-r"><span class="pill ${i.status==="overdue"?"pill-crit":"pill-warn"}">${i.status}</span></td></tr>`;}).join("")
            || emptyRow(3,"Every invoice is settled.")}
        </tbody></table></div></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Today on the floor</h3><span class="spacer"></span><span class="hint">${DAYNAMES[TODAY.getDay()]}</span></div>
        <div class="card-body tight" style="max-height:330px;overflow-y:auto"><div class="tbl-wrap"><table class="tbl"><tbody>
          ${todayClasses.map(c=>`<tr data-class="${c.id}">
            <td><b style="font-weight:600">${esc(c.name)}</b><div class="muted" style="font-size:11px">${esc(coachById(c.coachId).name)}${UI.branch==="ALL"?" · "+branchById(c.branchId).name:" · "+c.room}</div></td>
            <td class="num muted">${c.time}</td>
            <td class="ta-r" style="min-width:92px"><div class="num" style="font-size:11.5px">${c.booked.length}/${c.cap}${c.waitlist.length?` <span class="muted">+${c.waitlist.length}</span>`:""}</div>
              ${bar(c.booked.length,c.cap)}</td></tr>`).join("") || emptyRow(3,"No classes scheduled today.")}
        </tbody></table></div></div>
      </div>
    </div>

    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Retention risk</h3>
          <span class="hint">active members who have stopped turning up</span>
          <span class="spacer"></span><button class="btn btn-sm" data-go="checkin">Attendance</button></div>
        <div class="card-body tight"><div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Member</th><th>Last visit</th><th>Visits / 30d</th><th>Membership</th><th></th></tr></thead>
          <tbody>${risk.sort((a,b)=>atRisk(b)-atRisk(a)).slice(0,8).map(m=>`<tr data-member="${m.id}">
            <td>${memberCell(m,true)}</td>
            <td><span class="pill ${atRisk(m)>=30?"pill-crit":"pill-warn"}">${atRisk(m)}d ago</span></td>
            <td class="num">${visitsSince(m.id,30)}</td>
            <td><span class="${statusOf(m).cls}">${statusOf(m).label}</span></td>
            <td class="ta-r"><button class="btn btn-sm" data-nudge="${m.id}">Log win-back call</button></td></tr>`).join("")
            || emptyRow(5,"Nobody is drifting. Good week.")}</tbody>
        </table></div></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Fight camp</h3><span class="spacer"></span><button class="btn btn-sm" data-go="fighters">Squad</button></div>
        <div class="card-body">
          ${bouts.length?`<div class="sec-title">Next bouts</div>
            ${bouts.slice(0,4).map(m=>{const r=readiness(m);return `<div class="mini" style="cursor:pointer" data-member="${m.id}">
              <span><b style="font-weight:600">${esc(m.name)}</b><div class="muted" style="font-size:11px">${m.weightClass} · ${fmtDs(m.nextBout)} (${days(m.nextBout,TODAY)}d)</div></span>
              <span class="pill pill-${r.band}">${r.total}</span></div>`;}).join("")}`
            :'<div class="hint">No bouts on the calendar.</div>'}
          <div class="sec-title" style="margin-top:14px">Squad readiness</div>
          ${["good","warn","crit"].map(band=>{
            const n = camp.filter(x=>x.r.band===band).length;
            const label = {good:"Camp ready (75+)",warn:"Needs a block (50-74)",crit:"Off the pace (under 50)"}[band];
            return `<div style="margin-bottom:9px"><div class="mini" style="border:0;padding:0 0 4px">
              <span>${label}</span><b class="num">${n}</b></div>
              <div class="meter ${band}"><i style="width:${camp.length?n/camp.length*100:0}%"></i></div></div>`;
          }).join("")}
          <div class="mini" style="margin-top:11px;border-top:1px solid var(--line);padding-top:10px">
            <span>Sparring rounds logged, last 30 days</span>
            <b class="num">${B(S.spars).filter(s=>days(TODAY,s.ts)<=30).reduce((t,s)=>t+s.rounds,0)}</b></div>
        </div>
      </div>
    </div>
  </div>`;
}
