/* billing.js — invoices, payments and dues.
   Collections trend, monthly recurring revenue by plan and the full
   invoice ledger. */
"use strict";

/* ============================================================
   BILLING
   ============================================================ */
function viewBilling(){
  const f = UI.bFilter;
  const inv = B(S.invoices);
  let list = inv.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(f!=="all") list = list.filter(i=> f==="unpaid" ? i.status!=="paid" : i.status===f);

  const mStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const collected = inv.filter(i=>new Date(i.date)>=mStart).reduce((s,i)=>s+i.paid,0);
  const billed    = inv.filter(i=>new Date(i.date)>=mStart).reduce((s,i)=>s+i.amount,0);
  const dues      = inv.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.amount-i.paid),0);
  const overdue   = inv.filter(i=>i.status==="overdue");

  const months=[];
  for(let k=5;k>=0;k--){
    const from=new Date(TODAY.getFullYear(),TODAY.getMonth()-k,1), to=new Date(TODAY.getFullYear(),TODAY.getMonth()-k+1,1);
    months.push({label:from.toLocaleDateString("en-IN",{month:"short"}),
      v:inv.filter(i=>{const d=new Date(i.date);return d>=from&&d<to;}).reduce((s,i)=>s+i.paid,0)});
  }
  const rmax = Math.max(...months.map(m=>m.v),1);
  const act = activeMembers();
  const byPlan = PLANS.map(p=>({p, n:act.filter(m=>m.planId===p.id).length}))
    .map(x=>({...x, mrr:x.n*x.p.price/x.p.months})).filter(x=>x.n).sort((a,b)=>b.mrr-a.mrr);
  const mrr = byPlan.reduce((s,x)=>s+x.mrr,0);
  const c = {all:inv.length, unpaid:inv.filter(i=>i.status!=="paid").length, overdue:overdue.length,
    partial:inv.filter(i=>i.status==="partial").length, paid:inv.filter(i=>i.status==="paid").length};
  const chip=(id,l)=>`<button class="chip" data-bfilter="${id}" aria-pressed="${f===id}">${l} <span class="num muted">${c[id]}</span></button>`;

  return `<div class="stack">
    <div class="kpis">
      ${kpi("Collected this month", money(collected), `of ${money(billed)} billed`, "var(--good)")}
      ${kpi("Monthly recurring", money(mrr), "normalised across all plans", "var(--accent)")}
      ${kpi("Outstanding", money(dues), `${c.unpaid} open invoices`, "var(--crit)")}
      ${kpi("Overdue", overdue.length, money(overdue.reduce((s,i)=>s+(i.amount-i.paid),0))+" past the due date", overdue.length?"var(--crit)":"var(--good)")}
    </div>
    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Collections, last 6 months</h3><span class="hint">the current month is still in progress</span></div>
        <div class="card-body">
          <div class="bars">${months.map(m=>`<div class="bar ${m.v===rmax?"hi":""}" style="height:${Math.max(2,m.v/rmax*100)}%" title="${m.label} · ${money(m.v)}"></div>`).join("")}</div>
          <div class="bars-x">${months.map(m=>`<span>${m.label}</span>`).join("")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Revenue by plan</h3><span class="hint">monthly equivalent</span></div>
        <div class="card-body">${byPlan.map(x=>`<div style="margin-bottom:10px">
          <div class="mini" style="border:0;padding:0 0 4px"><span>${x.p.name} <span class="muted num">· ${x.n}</span></span>
            <b class="num">${money(x.mrr)}</b></div>${bar(x.mrr, byPlan[0].mrr||1, x.p.track==="fight"?"crit":"")}</div>`).join("")}
          <div class="legend"><i style="background:var(--crit)"></i> fight track <i></i> fitness track</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div class="filters">${chip("all","All")}${chip("unpaid","Unpaid")}${chip("overdue","Overdue")}${chip("partial","Partial")}${chip("paid","Paid")}</div>
        <span class="spacer"></span><button class="btn btn-sm" id="exportInv">Export CSV</button></div>
      <div class="card-body tight"><div class="tbl-wrap" style="max-height:560px;overflow-y:auto"><table class="tbl">
        <thead><tr><th>Invoice</th><th>Member</th>${UI.branch==="ALL"?"<th>Centre</th>":""}<th>Item</th><th>Issued</th><th>Due</th>
          <th class="ta-r">Amount</th><th class="ta-r">Balance</th><th>Status</th><th></th></tr></thead>
        <tbody>${list.slice(0,140).map(i=>{const m=memberById(i.memberId), bal=i.amount-i.paid;
          return `<tr data-member="${i.memberId}">
          <td class="num"><b style="font-weight:600">${i.id}</b></td>
          <td>${m?`<b style="font-weight:600">${esc(m.name)}</b>`:"—"}</td>
          ${UI.branch==="ALL"?`<td class="muted">${branchById(i.branchId).name}</td>`:""}
          <td class="muted">${esc(i.item)}</td>
          <td class="num muted">${fmtDs(i.date)}</td>
          <td class="num muted">${fmtDs(i.due)}</td>
          <td class="ta-r num">${money(i.amount)}</td>
          <td class="ta-r num" style="color:${bal?"var(--crit)":"var(--ink-3)"}">${bal?money(bal):"—"}</td>
          <td><span class="pill ${i.status==="paid"?"pill-good":i.status==="overdue"?"pill-crit":i.status==="partial"?"pill-warn":""}">${i.status}</span></td>
          <td class="ta-r">${i.status!=="paid"?`<button class="btn btn-sm" data-pay="${i.id}">Record payment</button>`
            :`<span class="muted" style="font-size:11px">${esc(i.method||"")}</span>`}</td></tr>`;}).join("")
          || emptyRow(10,"No invoices match this filter.")}</tbody>
      </table></div></div>
    </div>
  </div>`;
}
