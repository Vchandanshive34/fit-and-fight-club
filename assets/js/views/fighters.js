/* fighters.js — the fight squad.
   Weight against class limit, sparring volume, mat time and camp
   readiness, plus squad breakdowns by weight class and discipline. */
"use strict";

/* ============================================================
   FIGHT SQUAD
   ============================================================ */
function viewFighters(){
  let squad = fighters();
  if(UI.fFilter==="bout")  squad = squad.filter(m=>m.nextBout);
  if(UI.fFilter==="over")  squad = squad.filter(m=>readiness(m).over>0);
  if(UI.fFilter==="pro")   squad = squad.filter(m=>m.level==="Professional");
  if(UI.fFilter==="cold")  squad = squad.filter(m=>readiness(m).total<50);
  const rows = squad.map(m=>({m, r:readiness(m)}));
  const sorters = {
    readiness:(a,b)=>b.r.total-a.r.total,
    bout:(a,b)=>(a.m.nextBout?new Date(a.m.nextBout):8e15)-(b.m.nextBout?new Date(b.m.nextBout):8e15),
    weight:(a,b)=>b.r.over-a.r.over,
    rounds:(a,b)=>b.r.r30-a.r.r30,
    name:(a,b)=>a.m.name.localeCompare(b.m.name),
  };
  rows.sort(sorters[UI.fSort]);

  const all = fighters();
  const counts = {all:all.length, bout:all.filter(m=>m.nextBout).length,
    over:all.filter(m=>readiness(m).over>0).length, pro:all.filter(m=>m.level==="Professional").length,
    cold:all.filter(m=>readiness(m).total<50).length};
  const chip=(id,l)=>`<button class="chip" data-ffilter="${id}" aria-pressed="${UI.fFilter===id}">${l} <span class="num muted">${counts[id]}</span></button>`;

  const byClass = WEIGHT_CLASSES.map(w=>({w, n:all.filter(m=>m.weightClass===w.name).length})).filter(x=>x.n);
  const cmax = Math.max(...byClass.map(x=>x.n),1);
  const byDisc = DISCIPLINES.filter(d=>d.fight).map(d=>({d, n:all.filter(m=>m.disciplines.includes(d.id)).length})).sort((a,b)=>b.n-a.n);
  const dmax = Math.max(...byDisc.map(x=>x.n),1);
  const rounds30 = B(S.spars).filter(s=>days(TODAY,s.ts)<=30).reduce((t,s)=>t+s.rounds,0);

  return `<div class="stack">
    <div class="kpis">
      ${kpi("Fight squad", all.length, `${Math.round(all.length/Math.max(activeMembers().length,1)*100)}% of active members`, "var(--accent)")}
      ${kpi("Camp ready", all.filter(m=>readiness(m).total>=75).length, "scoring 75 or better", "var(--good)")}
      ${kpi("Over their limit", counts.over, "need a cut before the weigh-in", counts.over?"var(--warn)":"var(--good)")}
      ${kpi("Rounds this month", rounds30, "sparring rounds logged", "var(--data)")}
      ${kpi("Bouts booked", counts.bout, counts.bout?"next in "+Math.min(...all.filter(m=>m.nextBout).map(m=>days(m.nextBout,TODAY)))+" days":"calendar clear", "var(--accent)")}
    </div>

    <div class="row">
      <div class="filters">${chip("all","Whole squad")}${chip("bout","Bout booked")}${chip("pro","Professional")}
        ${chip("over","Over weight")}${chip("cold","Off the pace")}</div>
      <div style="margin-left:auto" class="row">
        <select id="fsort" class="chip" style="padding:6px 10px">
          ${[["readiness","Readiness"],["bout","Next bout"],["weight","Weight to cut"],["rounds","Rounds (30d)"],["name","Name"]]
            .map(([v,l])=>`<option value="${v}"${UI.fSort===v?" selected":""}>Sort: ${l}</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="card"><div class="card-body tight"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Fighter</th>${UI.branch==="ALL"?"<th>Centre</th>":""}<th>Level</th><th>Disciplines</th>
        <th>Weight class</th><th>On weight</th><th>Rounds / 30d</th><th>Mat / 30d</th><th>Readiness</th><th>Next bout</th></tr></thead>
      <tbody>${rows.map(({m,r})=>`<tr data-member="${m.id}" data-mtabjump="fight">
        <td>${memberCell(m)}${m.record?`<div class="num" style="font-size:11px;color:var(--ink-3);padding-left:39px">${m.record.w}-${m.record.l}-${m.record.d}</div>`:""}</td>
        ${UI.branch==="ALL"?`<td class="muted">${branchById(m.branchId).name}</td>`:""}
        <td><span class="pill${m.level==="Professional"?" pill-crit":""}">${m.level}</span>${m.belt?`<div style="margin-top:4px">${beltChip(m.belt)}</div>`:""}</td>
        <td>${discTags(m.disciplines)}</td>
        <td><b style="font-weight:600">${m.weightClass}</b><div class="muted num" style="font-size:11px">${m.weight.toFixed(1)} / ${r.limit} kg</div></td>
        <td>${r.over>0?`<span class="pill pill-crit">+${r.over.toFixed(1)} kg</span>`:`<span class="pill pill-good">on weight</span>`}</td>
        <td class="num">${r.r30}</td>
        <td class="num">${r.v30}</td>
        <td style="min-width:104px"><div class="row" style="gap:7px">
          <div style="flex:1">${bar(r.total,100,r.band)}</div>
          <b class="num" style="font-size:12px;color:var(--${r.band})">${r.total}</b></div></td>
        <td class="num muted">${m.nextBout?fmtDs(m.nextBout)+" · "+days(m.nextBout,TODAY)+"d":"—"}</td>
      </tr>`).join("") || emptyRow(10,"No fighters match this filter.")}</tbody>
    </table></div></div></div>

    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Squad by weight class</h3><span class="hint">who you can match against whom</span></div>
        <div class="card-body">${byClass.map(x=>`<div style="margin-bottom:10px">
          <div class="mini" style="border:0;padding:0 0 4px"><span>${x.w.name} <span class="muted num">≤ ${x.w.limit} kg</span></span>
            <b class="num">${x.n}</b></div>${bar(x.n,cmax)}</div>`).join("")}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Discipline coverage</h3></div>
        <div class="card-body">${byDisc.map(x=>`<div style="margin-bottom:10px">
          <div class="mini" style="border:0;padding:0 0 4px"><span>${x.d.name}</span><b class="num">${x.n}</b></div>
          ${bar(x.n,dmax)}</div>`).join("")}</div>
      </div>
    </div>
  </div>`;
}
