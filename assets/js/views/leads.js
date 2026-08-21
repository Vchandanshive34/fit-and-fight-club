/* leads.js — enquiries, free trials and follow-ups.
   Kanban pipeline, today's call list, the free-trial funnel the website
   CTA feeds, and conversion by source and by centre. */
"use strict";

/* ============================================================
   LEADS & TRIALS
   ============================================================ */
function viewLeads(){
  const lds  = B(S.leads);
  const open = lds.filter(l=>OPEN_STAGES.includes(l.stage));
  const won  = lds.filter(l=>l.stage==="won");
  const lost = lds.filter(l=>l.stage==="lost");
  const closed = won.length+lost.length;
  const dueFollow = open.filter(l=>days(TODAY,l.followUp)>=0).sort((a,b)=>new Date(a.followUp)-new Date(b.followUp));
  const booked = lds.filter(l=>l.trialDate);
  const attended = lds.filter(l=>l.trialAttended);
  const trialWon = won.filter(l=>l.trialAttended);
  const upcoming = lds.filter(l=>l.stage==="trial" && l.trialDate).sort((a,b)=>new Date(a.trialDate)-new Date(b.trialDate));

  const bySource = SOURCES.map(s=>({s, total:lds.filter(l=>l.source===s).length, won:won.filter(l=>l.source===s).length}))
                    .filter(x=>x.total).sort((a,b)=>b.total-a.total);
  const smax = Math.max(...bySource.map(x=>x.total),1);
  const byBranch = BRANCHES.map(b=>{
    const bl = S.leads.filter(l=>l.branchId===b.id);
    const bw = bl.filter(l=>l.stage==="won").length, bc = bl.filter(l=>["won","lost"].includes(l.stage)).length;
    return {b, open:bl.filter(l=>OPEN_STAGES.includes(l.stage)).length, won:bw, rate: bc?Math.round(bw/bc*100):0};
  });

  // the free-trial funnel the website's CTA feeds
  const funnel = [
    {label:"Enquiries", n:lds.length},
    {label:"Trial booked", n:booked.length},
    {label:"Trial attended", n:attended.length},
    {label:"Joined after trial", n:trialWon.length},
  ];

  return `<div class="stack">
    <div class="kpis">
      ${kpi("Open enquiries", open.length, `${money(open.reduce((s,l)=>s+l.value,0))} in play`, "var(--accent)")}
      ${kpi("Follow-ups due", dueFollow.length, "today or overdue", dueFollow.length?"var(--crit)":"var(--good)")}
      ${kpi("Trials this week", upcoming.filter(l=>days(l.trialDate,TODAY)<=7&&days(l.trialDate,TODAY)>=-1).length, `${upcoming.length} booked in total`, "var(--warn)")}
      ${kpi("Trial → member", (attended.length?Math.round(trialWon.length/attended.length*100):0)+"%", `${trialWon.length} of ${attended.length} who showed up`, "var(--good)")}
      ${kpi("Overall conversion", (closed?Math.round(won.length/closed*100):0)+"%", `${won.length} joined · ${lost.length} lost`, "var(--data)")}
    </div>

    <div class="card">
      <div class="card-head"><h3>Pipeline</h3><span class="hint">click a card to open it · ← → move the stage</span>
        <span class="spacer"></span><button class="btn btn-sm btn-primary" id="newLead">Add enquiry</button></div>
      <div class="card-body"><div class="board">
        ${STAGES.map(st=>{
          const ls = lds.filter(l=>l.stage===st.id).sort((a,b)=>new Date(a.followUp)-new Date(b.followUp));
          return `<div class="col">
            <div class="col-head"><span class="stage-dot" style="background:${st.color}"></span><b>${st.name}</b><span class="n">${ls.length}</span></div>
            <div class="col-body">${ls.map(l=>{
              const isOpen = OPEN_STAGES.includes(l.stage);
              const late = isOpen && days(TODAY,l.followUp)>0, now = isOpen && days(TODAY,l.followUp)===0;
              return `<div class="lead" data-lead="${l.id}">
                <b>${esc(l.name)}</b>
                <div class="meta"><span class="num">${esc(l.phone)}</span>${UI.branch==="ALL"?`<span class="tag">${branchById(l.branchId).name}</span>`:""}</div>
                <div class="meta"><span class="tag">${esc(l.source)}</span><span class="tag">${esc(discById(l.wants).short)}</span><span class="num">${money(l.value)}</span></div>
                ${l.trialDate&&l.stage==="trial"?`<div class="meta"><span class="pill pill-warn">Trial ${fmtDs(l.trialDate)}</span></div>`:""}
                <div class="meta" style="margin-top:5px;justify-content:space-between">
                  <span class="${late?"pill pill-crit":now?"pill pill-warn":"tag"}">${isOpen?(late?days(TODAY,l.followUp)+"d late":now?"today":fmtDs(l.followUp)):esc(l.owner)}</span>
                  <span style="display:flex;gap:2px">
                    <button class="btn btn-sm btn-ghost" data-move="${l.id}:-1" aria-label="Move back">←</button>
                    <button class="btn btn-sm btn-ghost" data-move="${l.id}:1" aria-label="Move forward">→</button></span>
                </div></div>`;}).join("") || '<div class="hint" style="padding:7px 3px">Empty</div>'}
            </div></div>`;}).join("")}
      </div></div>
    </div>

    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Today's call list</h3><span class="spacer"></span><span class="hint">${dueFollow.length} to work through</span></div>
        <div class="card-body tight"><div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Lead</th><th>Stage</th><th>Wants</th><th>Owner</th><th>Due</th><th></th></tr></thead>
          <tbody>${dueFollow.slice(0,10).map(l=>{const late=days(TODAY,l.followUp)>0;
            return `<tr data-lead="${l.id}">
            <td><div class="cell-name"><div class="avatar">${initials(l.name)}</div>
              <div><b>${esc(l.name)}</b><span>${esc(l.phone)}</span></div></div></td>
            <td><span class="pill">${stageById(l.stage).name}</span></td>
            <td>${discTags([l.wants])}</td>
            <td class="muted">${esc(l.owner)}</td>
            <td><span class="pill ${late?"pill-crit":"pill-warn"}">${late?days(TODAY,l.followUp)+"d late":"today"}</span></td>
            <td class="ta-r"><button class="btn btn-sm" data-called="${l.id}">Log call</button></td></tr>`;}).join("")
            || emptyRow(6,"Nothing overdue. The pipeline is current.")}</tbody>
        </table></div></div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Free-trial funnel</h3><span class="hint">where the website CTA lands</span></div>
        <div class="card-body">
          ${funnel.map((f,i)=>`<div style="margin-bottom:11px">
            <div class="mini" style="border:0;padding:0 0 4px"><span>${f.label}</span>
              <span><b class="num">${f.n}</b>${i?` <span class="muted num" style="font-size:11px">${funnel[i-1].n?Math.round(f.n/funnel[i-1].n*100):0}%</span>`:""}</span></div>
            <div class="meter ${i===3?"good":""}"><i style="width:${funnel[0].n?f.n/funnel[0].n*100:0}%"></i></div></div>`).join("")}
          ${upcoming.length?`<div class="sec-title" style="margin-top:14px">Trials coming up</div>
            ${upcoming.slice(0,5).map(l=>`<div class="mini" style="cursor:pointer" data-lead="${l.id}">
              <span>${esc(l.name)} <span class="muted">· ${discById(l.wants).short}</span></span>
              <span class="num muted">${fmtDs(l.trialDate)}</span></div>`).join("")}`:""}
        </div>
      </div>
    </div>

    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Where enquiries come from</h3><span class="hint">and which sources actually join</span></div>
        <div class="card-body">${bySource.map(x=>`<div style="margin-bottom:11px">
          <div class="mini" style="border:0;padding:0 0 4px"><span>${esc(x.s)}</span>
            <span><b class="num">${x.total}</b> <span class="muted num" style="font-size:11px">· ${x.won} joined</span></span></div>
          ${bar(x.total,smax)}</div>`).join("")}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Conversion by centre</h3></div>
        <div class="card-body tight"><div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Centre</th><th>Manager</th><th>Open</th><th>Joined</th><th class="ta-r">Close rate</th></tr></thead>
          <tbody>${byBranch.map(x=>`<tr data-branch="${x.b.id}">
            <td><b style="font-weight:600">${x.b.name}</b></td><td class="muted">${esc(x.b.manager)}</td>
            <td class="num">${x.open}</td><td class="num">${x.won}</td>
            <td class="ta-r"><div class="row" style="gap:7px;justify-content:flex-end">
              <div style="width:70px">${bar(x.rate,100,x.rate>=50?"good":x.rate>=30?"warn":"crit")}</div>
              <b class="num" style="font-size:12px">${x.rate}%</b></div></td></tr>`).join("")}</tbody>
        </table></div></div>
      </div>
    </div>
  </div>`;
}

function openLead(id){
  const l = S.leads.find(x=>x.id===id); if(!l) return;
  const st = stageById(l.stage), br = branchById(l.branchId);
  openDrawer(`
    <div class="drawer-head">
      <div class="avatar lg">${initials(l.name)}</div>
      <div style="flex:1;min-width:0">
        <h2 style="font-size:24px;text-transform:uppercase">${esc(l.name)}</h2>
        <div class="muted num" style="font-size:12px">${l.id} · ${esc(l.phone)} · ${br.name}</div>
        <div class="row" style="margin-top:7px;gap:5px">
          <span class="pill" style="color:${st.color}">${st.name}</span>
          <span class="pill">${esc(l.source)}</span>
          <span class="pill pill-data">${esc(discById(l.wants).name)}</span>
          <span class="pill num">${money(l.value)}</span></div>
      </div>
      <button class="btn btn-ghost btn-sm" data-close="1" aria-label="Close">✕</button>
    </div>
    <div class="drawer-body">
      <div><div class="sec-title">Enquiry</div><dl class="dl">
        <dt>Centre</dt><dd>${br.name} · ${esc(br.area)}</dd>
        <dt>Owner</dt><dd>${esc(l.owner)}</dd>
        <dt>Created</dt><dd class="num">${fmtD(l.created)} <span class="muted">(${days(TODAY,l.created)}d ago)</span></dd>
        <dt>Interested in</dt><dd>${planById(l.interest).name} · ${money(planById(l.interest).price)}</dd>
        <dt>Free trial</dt><dd>${l.trialDate?fmtD(l.trialDate)+(l.trialAttended?' <span class="pill pill-good">attended</span>':' <span class="pill pill-warn">booked</span>'):"not booked"}</dd>
        <dt>Next follow-up</dt><dd class="num">${fmtD(l.followUp)}</dd>
      </dl></div>
      <div><div class="sec-title">Move stage</div><div class="filters">
        ${STAGES.map(s=>`<button class="chip" data-setstage="${l.id}:${s.id}" aria-pressed="${l.stage===s.id}">${s.name}</button>`).join("")}
      </div></div>
      <div><div class="sec-title">Activity</div>
        ${l.log.slice().reverse().map(e=>`<div class="mini"><span>${esc(e.text)}</span><span class="muted num">${fmtDs(e.ts)}</span></div>`).join("")}
        <div class="row" style="margin-top:9px">
          <input id="logtxt" placeholder="Log a call, message or visit..." style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2)">
          <button class="btn btn-sm" data-addlog="${l.id}">Add</button></div>
      </div>
    </div>
    <div style="padding:12px 17px;border-top:1px solid var(--line);display:flex;gap:7px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" data-convert="${l.id}">Convert to member</button>
      ${l.trialDate?"":`<button class="btn btn-sm" data-booktrial="${l.id}">Book free trial</button>`}
      <button class="btn btn-sm" data-called="${l.id}">Log call &amp; snooze 2d</button>
      <button class="btn btn-sm btn-danger" data-setstage="${l.id}:lost">Mark lost</button>
    </div>`);
}
