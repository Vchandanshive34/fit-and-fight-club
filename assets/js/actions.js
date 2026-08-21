/* actions.js — everything that changes state.
   Check-ins, renewals, payments, new members and leads, stage moves,
   weigh-ins, sparring and CSV export. Each one mutates `S` then
   re-renders. */
"use strict";

/* ============================================================
   ACTIONS
   ============================================================ */
const nextInvoiceId = () => "INV-"+(++S.seq.i);
const nextMemberId  = () => "FF-"+(++S.seq.m);
const defaultBranch = () => UI.branch==="ALL" ? BRANCHES[0].id : UI.branch;

function doCheckin(id){
  const m = memberById(id); if(!m) return;
  const st = statusOf(m);
  if(st.key==="expired"){ toast(m.name+" — membership expired on "+fmtD(m.end)); return; }
  if(checkedInToday(id)){ toast(m.name+" is already checked in."); return; }
  S.checkins.push({memberId:id, branchId:m.branchId, ts:new Date().toISOString()});
  const d = duesOf(id);
  toast(m.name+" checked in"+(d?` · ${money(d)} still due`:"")+(st.key==="expiring"?` · ${st.label}`:""));
  UI.cQuery=""; render();
  if($("#drawer").classList.contains("on")) openMember(id, UI.tab);
}

function renewModal(id){
  const m = memberById(id); if(!m) return;
  const cur = planById(m.planId);
  openModal(`
    <div class="modal-head"><h2 style="font-size:22px;text-transform:uppercase">Renew ${esc(m.name)}</h2>
      <div class="hint" style="margin-top:3px">${branchById(m.branchId).name} · current cycle ends ${fmtD(m.end)}</div></div>
    <div class="modal-body">
      <div class="field"><label>Plan</label><select id="rPlan">
        ${PLANS.map(p=>`<option value="${p.id}"${p.id===cur.id?" selected":""}>${p.name} — ${money(p.price)} / ${p.months} month${p.months>1?"s":""}</option>`).join("")}
      </select></div>
      <div class="grid2">
        <div class="field"><label>Starts</label><input id="rStart" type="date" value="${iso(new Date(m.end)>TODAY?m.end:TODAY)}"></div>
        <div class="field"><label>Discount (₹)</label><input id="rDisc" type="number" min="0" step="100" value="0"></div>
      </div>
      <div class="field"><label>Payment</label><select id="rPay">
        <option value="UPI">Paid now — UPI</option><option value="Card">Paid now — Card</option>
        <option value="Cash">Paid now — Cash</option><option value="">Invoice it, collect later</option></select></div>
    </div>
    <div class="modal-foot"><button class="btn" data-close="1">Cancel</button>
      <button class="btn btn-primary" data-dorenew="${id}">Confirm renewal</button></div>`);
}
function doRenew(id){
  const m = memberById(id);
  const plan = planById($("#rPlan").value);
  const start = new Date($("#rStart").value || TODAY);
  const disc = Math.max(0, Number($("#rDisc").value)||0);
  const method = $("#rPay").value;
  const amount = Math.max(0, plan.price - disc);
  m.planId = plan.id; m.start = iso(start); m.end = iso(addD(start, plan.months*30));
  m.frozen = false; m.cancelled = false;
  S.invoices.push({id:nextInvoiceId(), memberId:id, branchId:m.branchId, date:iso(TODAY), due:iso(addD(TODAY,7)),
    item:plan.name, amount, paid:method?amount:0, status:method?"paid":"due", method:method||null});
  closeOverlays(); render();
  toast(`${m.name} renewed on ${plan.name} to ${fmtD(m.end)}`);
}

function payModal(invId){
  const i = S.invoices.find(x=>x.id===invId); if(!i) return;
  const m = memberById(i.memberId), bal = i.amount-i.paid;
  openModal(`
    <div class="modal-head"><h2 style="font-size:22px;text-transform:uppercase">Record payment</h2>
      <div class="hint" style="margin-top:3px">${i.id} · ${m?esc(m.name):""} · ${esc(i.item)}</div></div>
    <div class="modal-body">
      <div class="mini"><span>Invoice total</span><b class="num">${money(i.amount)}</b></div>
      <div class="mini"><span>Already paid</span><b class="num">${money(i.paid)}</b></div>
      <div class="mini"><span>Balance</span><b class="num" style="color:var(--crit)">${money(bal)}</b></div>
      <div class="grid2">
        <div class="field"><label>Amount received</label><input id="pAmt" type="number" min="1" max="${bal}" value="${bal}"></div>
        <div class="field"><label>Method</label><select id="pMethod"><option>UPI</option><option>Card</option><option>Cash</option><option>Bank transfer</option></select></div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" data-close="1">Cancel</button>
      <button class="btn btn-primary" data-dopay="${invId}">Record payment</button></div>`);
}
function doPay(invId){
  const i = S.invoices.find(x=>x.id===invId);
  const amt = Math.min(i.amount-i.paid, Math.max(0, Number($("#pAmt").value)||0));
  i.paid += amt; i.method = $("#pMethod").value;
  i.status = i.paid >= i.amount ? "paid" : "partial";
  const m = memberById(i.memberId);
  closeOverlays(); render();
  toast(`${money(amt)} recorded against ${i.id}${m?" · "+m.name:""}`);
}

function newMemberModal(p){
  p = p || {};
  openModal(`
    <div class="modal-head"><h2 style="font-size:22px;text-transform:uppercase">${p.name?"Convert "+esc(p.name):"New member"}</h2>
      <div class="hint" style="margin-top:3px">Creates the membership and its first invoice</div></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Full name</label><input id="nName" value="${esc(p.name||"")}" placeholder="e.g. Omkar Jadhav"></div>
        <div class="field"><label>Phone</label><input id="nPhone" value="${esc(p.phone||"")}" placeholder="98450 00000"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Centre</label><select id="nBranch">
          ${BRANCHES.map(b=>`<option value="${b.id}"${(p.branchId||defaultBranch())===b.id?" selected":""}>${b.name} — ${b.city}</option>`).join("")}</select></div>
        <div class="field"><label>Plan</label><select id="nPlan">
          ${PLANS.map(pl=>`<option value="${pl.id}"${p.interest===pl.id?" selected":""}>${pl.name} — ${money(pl.price)}</option>`).join("")}</select></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Age</label><input id="nAge" type="number" min="12" max="80" value="26"></div>
        <div class="field"><label>Weight (kg)</label><input id="nWeight" type="number" step="0.1" min="30" max="180" value="72"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Sex</label><select id="nSex"><option>M</option><option>F</option></select></div>
        <div class="field"><label>Track</label><select id="nTrack">
          <option value="fitness">Fitness</option><option value="fight"${p.fight?" selected":""}>Fight</option></select></div>
      </div>
      <div class="field"><label>Primary discipline</label><select id="nDisc">
        ${DISCIPLINES.map(d=>`<option value="${d.id}"${p.wants===d.id?" selected":""}>${d.name}</option>`).join("")}</select></div>
      <div class="grid2">
        <div class="field"><label>Goal</label><select id="nGoal">${GOALS.map(g=>`<option>${g}</option>`).join("")}</select></div>
        <div class="field"><label>Source</label><select id="nSource">${SOURCES.map(s=>`<option${p.source===s?" selected":""}>${s}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Assign a coach</label><select id="nCoach"><option value="">No coach</option>
        ${COACHES.map(c=>`<option value="${c.id}">${c.name} — ${c.role}</option>`).join("")}</select></div>
      <div class="field"><label>Payment</label><select id="nPay">
        <option value="UPI">Paid now — UPI</option><option value="Card">Paid now — Card</option>
        <option value="Cash">Paid now — Cash</option><option value="">Invoice it, collect later</option></select></div>
    </div>
    <div class="modal-foot"><button class="btn" data-close="1">Cancel</button>
      <button class="btn btn-primary" data-donew="${p.leadId||""}">Create membership</button></div>`);
}
function doNewMember(leadId){
  const name = ($("#nName").value||"").trim();
  if(!name){ toast("Give the member a name first."); $("#nName").focus(); return; }
  const plan = planById($("#nPlan").value);
  const method = $("#nPay").value;
  const weight = Number($("#nWeight").value)||72;
  const track = $("#nTrack").value;
  const id = nextMemberId();
  const m = {
    id, branchId:$("#nBranch").value, name, phone:($("#nPhone").value||"").trim()||newPhone(),
    email:name.toLowerCase().replace(/[^a-z]/g,".")+"@mail.com",
    gender:$("#nSex").value, age:Number($("#nAge").value)||26, weight,
    planId:plan.id, joined:iso(TODAY), start:iso(TODAY), end:iso(addD(TODAY,plan.months*30)),
    frozen:false, cancelled:false, source:$("#nSource").value, goal:$("#nGoal").value,
    track, disciplines:[$("#nDisc").value], level:"Beginner",
    belt: $("#nDisc").value==="BJJ" ? "White" : null,
    coachId:$("#nCoach").value||null, record:null, nextBout:null,
    notes:"", emergency:"—", weightClass:classFor(weight).name,
  };
  S.members.push(m);
  S.invoices.push({id:nextInvoiceId(), memberId:id, branchId:m.branchId, date:iso(TODAY), due:iso(addD(TODAY,7)),
    item:plan.name, amount:plan.price, paid:method?plan.price:0, status:method?"paid":"due", method:method||null});
  if(leadId){ const l=S.leads.find(x=>x.id===leadId);
    if(l){ l.stage="won"; l.log.push({ts:iso(TODAY), text:"Converted to member "+id}); } }
  closeOverlays(); route="members"; render();
  toast(name+" is now a member · "+id);
  openMember(id);
}

function newLeadModal(){
  openModal(`
    <div class="modal-head"><h2 style="font-size:22px;text-transform:uppercase">New enquiry</h2>
      <div class="hint" style="margin-top:3px">Walk-in, call, DM or the website trial form</div></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Name</label><input id="lName" placeholder="e.g. Tejas Sawant"></div>
        <div class="field"><label>Phone</label><input id="lPhone" placeholder="98450 00000"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Centre</label><select id="lBranch">
          ${BRANCHES.map(b=>`<option value="${b.id}"${defaultBranch()===b.id?" selected":""}>${b.name}</option>`).join("")}</select></div>
        <div class="field"><label>Source</label><select id="lSource">${SOURCES.map(s=>`<option>${s}</option>`).join("")}</select></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Interested in</label><select id="lPlan">${PLANS.map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></div>
        <div class="field"><label>Wants to train</label><select id="lWants">${DISCIPLINES.map(d=>`<option value="${d.id}">${d.name}</option>`).join("")}</select></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Free trial on</label><input id="lTrial" type="date" value="${iso(addD(TODAY,2))}"></div>
        <div class="field"><label>Follow up on</label><input id="lDate" type="date" value="${iso(addD(TODAY,1))}"></div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" data-close="1">Cancel</button>
      <button class="btn btn-primary" id="doNewLead">Add to pipeline</button></div>`);
}
function doNewLead(){
  const name = ($("#lName").value||"").trim();
  if(!name){ toast("Give the enquiry a name first."); $("#lName").focus(); return; }
  const plan = planById($("#lPlan").value);
  const br = branchById($("#lBranch").value);
  const trial = $("#lTrial").value || null;
  const l = {id:"LD-"+(++S.seq.l), branchId:br.id, name, phone:($("#lPhone").value||"").trim()||newPhone(),
    source:$("#lSource").value, stage: trial?"trial":"new", owner:br.manager, created:iso(TODAY),
    followUp:$("#lDate").value||iso(addD(TODAY,1)), interest:plan.id, value:plan.price,
    trialDate:trial, trialAttended:false, wants:$("#lWants").value,
    log:[{ts:iso(TODAY), text:"Enquiry captured · "+$("#lSource").value}]};
  if(trial) l.log.push({ts:iso(TODAY), text:"Free trial booked for "+fmtD(trial)});
  S.leads.push(l);
  closeOverlays(); route="leads"; render();
  toast(name+" added to the "+br.name+" pipeline");
}

function moveLead(id, dir){
  const l = S.leads.find(x=>x.id===id); if(!l) return;
  const i = STAGES.findIndex(s=>s.id===l.stage);
  const n = clamp(i+dir, 0, STAGES.length-1);
  if(n!==i) setStage(id, STAGES[n].id);
}
function setStage(id, stage){
  const l = S.leads.find(x=>x.id===id); if(!l) return;
  if(stage==="won"){ newMemberModal({name:l.name, phone:l.phone, source:l.source, interest:l.interest,
    branchId:l.branchId, wants:l.wants, fight:DISCIPLINES.find(d=>d.id===l.wants).fight, leadId:l.id}); return; }
  l.stage = stage;
  if(stage==="trial" && !l.trialDate) l.trialDate = iso(addD(TODAY,2));
  if(stage==="trialdone"){ l.trialAttended = true; if(!l.trialDate) l.trialDate = iso(TODAY); }
  l.log.push({ts:iso(TODAY), text:"Moved to "+stageById(stage).name});
  if(OPEN_STAGES.includes(stage) && days(TODAY,l.followUp)>=0) l.followUp = iso(addD(TODAY,2));
  render(); if($("#drawer").classList.contains("on")) openLead(id);
  toast(l.name+" → "+stageById(stage).name);
}

const csv = rows => rows.map(r=>r.map(c=>{
  const s=String(c??""); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }).join(",")).join("\n");
function showCsv(title, text){
  openModal(`
    <div class="modal-head"><h2 style="font-size:22px;text-transform:uppercase">${esc(title)}</h2>
      <div class="hint" style="margin-top:3px">Select all and copy — downloads are blocked inside the preview frame.</div></div>
    <div class="modal-body"><textarea id="csvOut" rows="12" readonly
      style="width:100%;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2)">${esc(text)}</textarea></div>
    <div class="modal-foot"><button class="btn" data-close="1">Close</button>
      <button class="btn btn-primary" id="copyCsv">Copy to clipboard</button></div>`);
}
