/* events.js — delegation, global search and boot.
   One click listener for the whole app: every interactive element is a
   data-* attribute, so re-rendering never loses its handlers. */
"use strict";

/* ============================================================
   EVENTS
   ============================================================ */
document.addEventListener("click", e=>{
  const t = e.target.closest("[data-go],[data-branch],[data-member],[data-lead],[data-class],[data-mfilter],[data-bfilter],[data-ffilter],[data-mtab],[data-renew],[data-dorenew],[data-pay],[data-dopay],[data-checkin],[data-freeze],[data-cancel],[data-track],[data-nudge],[data-move],[data-setstage],[data-addlog],[data-called],[data-convert],[data-booktrial],[data-savenote],[data-usept],[data-weigh],[data-spar],[data-book],[data-unbook],[data-promote],[data-close]");
  if(!t) return;
  const d = t.dataset, two = k => (d[k]||"").split(":");

  if(d.close!==undefined){ closeOverlays(); return; }
  if(d.go){ e.stopPropagation(); closeOverlays(); go(d.go); return; }
  if(d.branch){ e.stopPropagation(); closeOverlays(); UI.branch=d.branch; UI.mQuery=""; UI.cQuery=""; render(); return; }

  if(d.mfilter){ UI.mFilter=d.mfilter; render(); return; }
  if(d.bfilter){ UI.bFilter=d.bfilter; render(); return; }
  if(d.ffilter){ UI.fFilter=d.ffilter; render(); return; }
  if(d.mtab){ openMember(UI.tabId, d.mtab); return; }

  if(d.renew){ e.stopPropagation(); renewModal(d.renew); return; }
  if(d.dorenew){ doRenew(d.dorenew); return; }
  if(d.pay){ e.stopPropagation(); payModal(d.pay); return; }
  if(d.dopay){ doPay(d.dopay); return; }
  if(d.checkin){ e.stopPropagation(); doCheckin(d.checkin); return; }

  if(d.freeze){
    const m=memberById(d.freeze); m.frozen=!m.frozen; render(); openMember(m.id, UI.tab);
    toast(m.name+(m.frozen?" frozen — billing paused":" unfrozen — back on the floor")); return;
  }
  if(d.cancel){ const m=memberById(d.cancel); m.cancelled=true; closeOverlays(); render(); toast(m.name+" cancelled"); return; }
  if(d.track){
    const m=memberById(d.track);
    m.track = m.track==="fight" ? "fitness" : "fight";
    if(m.track==="fight" && !m.disciplines.some(x=>discById(x).fight)) m.disciplines.unshift("BOX");
    render(); openMember(m.id, m.track==="fight"?"fight":"overview");
    toast(m.name+" moved to the "+(m.track==="fight"?"fight":"fitness")+" track"); return;
  }
  if(d.nudge){
    e.stopPropagation(); const m=memberById(d.nudge);
    m.notes = (m.notes?m.notes+"\n":"")+fmtD(TODAY)+" — win-back call logged.";
    toast("Win-back call logged for "+m.name); save(); return;
  }
  if(d.savenote){ const m=memberById(d.savenote); m.notes=$("#mnote").value; save(); toast("Note saved"); return; }
  if(d.usept){
    const p=S.pt.find(x=>x.memberId===d.usept);
    if(p && p.used<p.total){ p.used++; openMember(d.usept, UI.tab); toast("Session logged · "+(p.total-p.used)+" left"); save(); }
    else toast("That pack is fully used — sell a renewal.");
    return;
  }
  if(d.weigh){
    const m=memberById(d.weigh), w=Number($("#wIn").value);
    if(!w || w<25 || w>200){ toast("Enter a weight between 25 and 200 kg."); return; }
    const before = m.weightClass;
    m.weight = Math.round(w*10)/10; m.weightClass = classFor(m.weight).name;
    render(); openMember(m.id, "fight");
    toast(`${m.name} weighed in at ${m.weight} kg`+(before!==m.weightClass?` · now ${m.weightClass}`:""));
    return;
  }
  if(d.spar){
    const m=memberById(d.spar), r=clamp(Number($("#spRounds").value)||0,1,15);
    S.spars.push({memberId:m.id, branchId:m.branchId, ts:iso(TODAY), rounds:r, partner:$("#spType").value});
    render(); openMember(m.id, "fight");
    toast(`${r} rounds logged for ${m.name} · readiness ${readiness(m).total}`);
    return;
  }

  if(d.move){ e.stopPropagation(); const [id,dir]=two("move"); moveLead(id, Number(dir)); return; }
  if(d.setstage){ e.stopPropagation(); const [id,st]=two("setstage"); setStage(id, st); return; }
  if(d.booktrial){
    const l=S.leads.find(x=>x.id===d.booktrial);
    l.trialDate = iso(addD(TODAY,2)); l.stage="trial";
    l.log.push({ts:iso(TODAY), text:"Free trial booked for "+fmtD(l.trialDate)});
    render(); openLead(l.id); toast("Free trial booked for "+fmtD(l.trialDate)); return;
  }
  if(d.called){
    e.stopPropagation(); const l=S.leads.find(x=>x.id===d.called);
    l.log.push({ts:iso(TODAY), text:"Call logged by "+l.owner});
    l.followUp = iso(addD(TODAY,2));
    if(l.stage==="new") l.stage="contacted";
    render(); if($("#drawer").classList.contains("on")) openLead(l.id);
    toast("Call logged · following up "+fmtDs(l.followUp)); return;
  }
  if(d.addlog){
    const l=S.leads.find(x=>x.id===d.addlog), v=($("#logtxt").value||"").trim();
    if(!v) return; l.log.push({ts:iso(TODAY), text:v}); openLead(l.id); save(); return;
  }
  if(d.convert){
    const l=S.leads.find(x=>x.id===d.convert);
    newMemberModal({name:l.name, phone:l.phone, source:l.source, interest:l.interest, branchId:l.branchId,
      wants:l.wants, fight:DISCIPLINES.find(x=>x.id===l.wants).fight, leadId:l.id});
    return;
  }

  if(d.book){
    const c=S.classes.find(x=>x.id===d.book), mid=$("#bookSel").value;
    if(!mid){ toast("No eligible members at this centre."); return; }
    (c.booked.length<c.cap ? c.booked : c.waitlist).push(mid);
    openClass(c.id); render();
    toast(memberById(mid).name+(c.booked.includes(mid)?" booked into ":" waitlisted for ")+c.name); return;
  }
  if(d.unbook){
    const [cid,mid]=two("unbook"), c=S.classes.find(x=>x.id===cid);
    c.booked=c.booked.filter(x=>x!==mid); c.waitlist=c.waitlist.filter(x=>x!==mid);
    if(c.booked.length<c.cap && c.waitlist.length) c.booked.push(c.waitlist.shift());
    openClass(cid); render(); toast("Removed from "+c.name); return;
  }
  if(d.promote){
    const [cid,mid]=two("promote"), c=S.classes.find(x=>x.id===cid);
    c.waitlist=c.waitlist.filter(x=>x!==mid); c.booked.push(mid);
    openClass(cid); render(); toast(memberById(mid).name+" moved off the waitlist"); return;
  }

  if(d.lead){ openLead(d.lead); return; }
  if(d.class){ openClass(d.class); return; }
  if(d.member){ openMember(d.member, d.mtabjump || undefined); return; }
});

document.addEventListener("input", e=>{
  if(e.target.id==="mq"||e.target.id==="cq"){
    const which = e.target.id, p = e.target.selectionStart;
    if(which==="mq") UI.mQuery = e.target.value; else UI.cQuery = e.target.value;
    render();
    const el = $("#"+which); if(el){ el.focus(); el.setSelectionRange(p,p); }
  }
  if(e.target.id==="gsearch") globalSearch(e.target.value);
});
document.addEventListener("change", e=>{
  if(e.target.id==="msort"){ UI.mSort=e.target.value; render(); }
  if(e.target.id==="fsort"){ UI.fSort=e.target.value; render(); }
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeOverlays(); $("#gpop").innerHTML=""; } });

$("#scrim").addEventListener("click", closeOverlays);
$("#newBtn").addEventListener("click", ()=>newMemberModal());
$("#checkinBtn").addEventListener("click", ()=>{ go("checkin"); setTimeout(()=>{const el=$("#cq"); if(el) el.focus();},40); });
$("#resetBtn").addEventListener("click", ()=>{
  S = seed(); Object.assign(UI,{branch:"ALL",mFilter:"all",mQuery:"",cQuery:"",bFilter:"all",fFilter:"all",fSort:"readiness"});
  closeOverlays(); render(); toast("Demo data restored");
});
$("#themeBtn").addEventListener("click", ()=>{
  const cur = document.documentElement.getAttribute("data-theme");
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const next = cur ? (cur==="dark"?"light":"dark") : (sysDark?"light":"dark");
  document.documentElement.setAttribute("data-theme", next);
  try{ localStorage.setItem(KEY+"-theme", next); }catch(err){}
});
try{ const th=localStorage.getItem(KEY+"-theme"); if(th) document.documentElement.setAttribute("data-theme", th); }catch(e){}

document.addEventListener("click", e=>{
  if(e.target.id==="newLead"){ newLeadModal(); return; }
  if(e.target.id==="doNewLead"){ doNewLead(); return; }
  if(e.target.dataset && e.target.dataset.donew!==undefined){ doNewMember(e.target.dataset.donew); return; }
  if(e.target.id==="exportBtn"){
    showCsv("Members export", csv([["Member ID","Centre","Name","Phone","Plan","Track","Disciplines","Level","Weight class","Status","Start","Expires","Visits 30d","Dues"]]
      .concat(B(S.members).filter(m=>!m.cancelled).map(m=>[m.id,branchById(m.branchId).name,m.name,m.phone,planById(m.planId).name,
        m.track,m.disciplines.map(x=>discById(x).short).join(" / "),m.level,m.weightClass,statusOf(m).key,m.start,m.end,
        visitsSince(m.id,30),duesOf(m.id)]))));
    return;
  }
  if(e.target.id==="exportInv"){
    showCsv("Invoices export", csv([["Invoice","Centre","Member","Item","Issued","Due","Amount","Paid","Status","Method"]]
      .concat(B(S.invoices).map(i=>{const m=memberById(i.memberId);
        return [i.id,branchById(i.branchId).name,m?m.name:"",i.item,i.date,i.due,i.amount,i.paid,i.status,i.method||""];}))));
    return;
  }
  if(e.target.id==="copyCsv"){
    const ta=$("#csvOut"); ta.select();
    if(navigator.clipboard) navigator.clipboard.writeText(ta.value).then(()=>toast("Copied")).catch(()=>toast("Select the text and copy"));
    else toast("Select the text and copy");
    return;
  }
  if(!e.target.closest(".search")) $("#gpop").innerHTML = "";
});

/* ---------------- global search ---------------- */
function globalSearch(q){
  q = (q||"").trim().toLowerCase();
  const pop = $("#gpop");
  if(q.length<2){ pop.innerHTML=""; return; }
  const hits = [];
  S.members.filter(m=>(m.name+" "+m.id+" "+m.phone).toLowerCase().includes(q)).slice(0,6)
    .forEach(m=>hits.push({kind:"member", id:m.id, title:m.name,
      sub:m.id+" · "+branchById(m.branchId).name+" · "+planById(m.planId).name+" · "+statusOf(m).label}));
  S.leads.filter(l=>(l.name+" "+l.id+" "+l.phone).toLowerCase().includes(q)).slice(0,4)
    .forEach(l=>hits.push({kind:"lead", id:l.id, title:l.name, sub:"Lead · "+branchById(l.branchId).name+" · "+stageById(l.stage).name}));
  S.invoices.filter(i=>i.id.toLowerCase().includes(q)).slice(0,3)
    .forEach(i=>{const m=memberById(i.memberId);
      hits.push({kind:"member", id:i.memberId, title:i.id, sub:(m?m.name+" · ":"")+money(i.amount)+" · "+i.status});});
  S.classes.filter(c=>c.name.toLowerCase().includes(q)).slice(0,3)
    .forEach(c=>hits.push({kind:"class", id:c.id, title:c.name,
      sub:branchById(c.branchId).name+" · "+DAYNAMES[c.dow]+" "+c.time+" · "+c.room}));
  pop.innerHTML = hits.length
    ? `<div class="search-pop">${hits.map(h=>`<button data-${h.kind}="${h.id}">
        <b style="font-weight:600;font-size:13px">${esc(h.title)}</b>
        <div class="muted" style="font-size:11px">${esc(h.sub)}</div></button>`).join("")}</div>`
    : `<div class="search-pop"><div class="empty">Nothing matches "${esc(q)}"</div></div>`;
}

/* ---------------- clock ---------------- */
function tick(){
  const now = new Date();
  $("#clock").textContent = now.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"})
    + " · " + now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
}
tick(); setInterval(tick, 30000);
render();
