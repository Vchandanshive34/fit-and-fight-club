/* seed.js — the demo dataset.
   Deterministic: the same seed always produces the same club, so
   screenshots and numbers are stable. Replace with API calls when a
   backend exists. */
"use strict";

function seed(){
  _s = 20260821;
  const members=[], checkins=[], invoices=[], pt=[], leads=[], classes=[], spars=[];
  let mSeq=1000, iSeq=7000, lSeq=3000;

  const SIZE = {VSH:62, NRL:54, WGH:38};
  BRANCHES.forEach(br=>{
    const branchCoaches = COACHES.filter(c=>c.branchId===br.id);
    for(let i=0;i<SIZE[br.id];i++){
      const name = newName();
      const plan = pick(PLANS.concat([PLANS[0],PLANS[1],PLANS[5],PLANS[6]]));
      const joined = addD(TODAY, -int(4, br.id==="WGH"?600:900));
      let start = new Date(joined), cyc = 1;
      while(days(TODAY,start) > plan.months*30){ start = addD(start, plan.months*30); cyc++; }
      if(cyc>1 && chance(.17)){ start = addD(start, -plan.months*30); cyc--; }
      const end = addD(start, plan.months*30);
      const id = "FF-"+(++mSeq);

      const isFighter = plan.track==="fight" && chance(.72);
      const disc = [];
      if(isFighter){
        const pool = DISCIPLINES.filter(d=>d.fight).map(d=>d.id);
        const n = int(1,3);
        while(disc.length<n){ const d=pick(pool); if(!disc.includes(d)) disc.push(d); }
        if(chance(.5) && !disc.includes("WGT")) disc.push("WGT");
      } else {
        const pool = ["WAR","CRF","WGT"];
        const n = int(1,2);
        while(disc.length<n){ const d=pick(pool); if(!disc.includes(d)) disc.push(d); }
        if(plan.track==="fight") disc.unshift(pick(["BOX","KBX","MTH"]));
      }
      const months = Math.floor(days(TODAY,joined)/30);
      const level = isFighter
        ? (months>17 ? pick(["Advanced","Professional","Professional"]) : months>9 ? pick(["Intermediate","Advanced"]) : months>4 ? "Intermediate" : "Beginner")
        : (months>14 ? "Intermediate" : "Beginner");
      const gender = chance(.34) ? "F" : "M";
      const weight = Math.round((gender==="F" ? 48+rnd()*28 : 58+rnd()*38)*10)/10;

      const m = {
        id, branchId:br.id, name, phone:newPhone(),
        email:name.toLowerCase().replace(/[^a-z]/g,".")+"@mail.com",
        gender, age:int(16,52), weight,
        planId:plan.id, joined:iso(joined), start:iso(start), end:iso(end),
        frozen:chance(.045), cancelled:false,
        source:pick(SOURCES), goal: isFighter ? pick(["Fight preparation","Self defence","Strength","Fat loss"]) : pick(GOALS),
        track: isFighter ? "fight" : "fitness",
        disciplines: disc, level,
        belt: disc.includes("BJJ") ? BELTS[clamp(Math.floor(months/16),0,4)].name : null,
        coachId: (isFighter || chance(.3)) && branchCoaches.length ? pick(branchCoaches).id : null,
        record: isFighter && level!=="Beginner" ? {w:int(0,9), l:int(0,5), d:int(0,1)} : null,
        nextBout: isFighter && ["Advanced","Professional"].includes(level) && chance(.4) ? iso(addD(TODAY,int(9,95))) : null,
        notes:"", emergency:newName()+" · "+newPhone(),
      };
      /* Competition class is declared, not derived: plenty of fighters
         book a division below their walking weight and cut into it. */
      const natural = WEIGHT_CLASSES.indexOf(classFor(m.weight));
      m.weightClass = WEIGHT_CLASSES[isFighter && natural>0 && chance(.45) ? natural-1 : natural].name;
      members.push(m);

      /* attendance */
      const habit = rnd();
      const perWeek = habit<.10 ? 0 : habit<.26 ? 1 : habit<.55 ? 3 : habit<.84 ? 4 : 6;
      const span = Math.min(90, Math.max(1, days(TODAY, joined)));
      for(let d=span; d>=0; d--){
        const day = addD(TODAY,-d);
        if(day > new Date(m.end)) continue;
        if(m.frozen && d < 30) continue;
        if(rnd() > perWeek/7) continue;
        const hh = chance(.5) ? int(6,10) : int(17,21);
        checkins.push({memberId:id, branchId:br.id, ts:new Date(addD(TODAY,-d).getTime()+hh*36e5+int(0,59)*6e4).toISOString()});
      }
      /* sparring log — fighters only */
      if(isFighter && level!=="Beginner"){
        for(let d=90; d>=0; d--){
          if(!chance(perWeek>=4 ? .09 : .04)) continue;
          spars.push({memberId:id, branchId:br.id, ts:iso(addD(TODAY,-d)), rounds:int(3,8),
                      partner: pick(["drill","live","technical"])});
        }
      }
      /* invoices, one per billing cycle */
      for(let c=Math.min(cyc,14)-1;c>=0;c--){
        const issued = addD(start, -c*plan.months*30);
        if(issued > TODAY) continue;
        const roll = rnd(), isCur = c===0;
        let status = !isCur ? "paid" : roll<.71 ? "paid" : roll<.83 ? "partial" : "due";
        const paidAmt = status==="paid" ? plan.price : status==="partial" ? Math.round(plan.price*pick([.3,.4,.5,.6])/100)*100 : 0;
        const due = addD(issued,7);
        if(status==="due" && due < TODAY) status = "overdue";
        invoices.push({id:"INV-"+(++iSeq), memberId:id, branchId:br.id, date:iso(issued), due:iso(due),
          item:plan.name, amount:plan.price, paid:paidAmt, status,
          method: paidAmt ? pick(["UPI","Card","Cash","Bank transfer"]) : null});
      }
      /* personal training packages */
      if(m.coachId && chance(.3)){
        const total = pick([8,12,16,24]);
        pt.push({memberId:id, branchId:br.id, coachId:m.coachId, total, used:int(0,total),
                 start:iso(addD(TODAY,-int(5,120))), expiry:iso(addD(TODAY,int(-10,150))),
                 price: total*coachById(m.coachId).rate});
      }
    }

    /* leads per branch */
    const mix = ["new","new","contacted","contacted","contacted","trial","trial","trialdone","trialdone",
                 "negotiate","won","won","won","lost","lost"];
    for(let i=0;i<(br.id==="WGH"?14:20);i++){
      const created = addD(TODAY,-int(0,42));
      const stage = pick(mix);
      const interest = pick(PLANS);
      const trialSet = ["trial","trialdone","negotiate","won"].includes(stage);
      leads.push({
        id:"LD-"+(++lSeq), branchId:br.id, name:newName(), phone:newPhone(),
        source:pick(SOURCES), stage, owner:br.manager, created:iso(created),
        followUp: iso(addD(TODAY, OPEN_STAGES.includes(stage) ? int(-5,9) : int(3,20))),
        interest:interest.id, value:interest.price,
        // a booked trial is still ahead of them; an attended one is behind
        trialDate: stage==="trial" ? iso(addD(TODAY, int(0,7)))
                 : trialSet ? iso(addD(created, int(1,6))) : null,
        trialAttended: ["trialdone","negotiate","won"].includes(stage),
        wants: pick(DISCIPLINES).id,
        log:[{ts:iso(created), text:"Enquiry captured · "+"src"}],
      });
    }

    /* timetable per branch */
    TIMETABLE.forEach((t,ti)=>{
      if(br.id==="WGH" && ["Boxing Pro","Muay Thai Pro","BJJ Advanced"].includes(t.name)) return;
      // spread the timetable across whoever at this centre can teach it
      const pool = branchCoaches.filter(c=>c.disc.includes(t.disc));
      const bag = pool.length ? pool : branchCoaches;
      const coach = bag[ti % bag.length];
      t.days.forEach(d=>classes.push({
        id:"CL-"+br.id+"-"+ti+"-"+d, branchId:br.id, name:t.name, disc:t.disc, level:t.level,
        coachId:coach.id, dow:d, time:t.time, dur:t.dur, cap:t.cap, room:t.room, booked:[], waitlist:[],
      }));
    });
  });

  leads.forEach(l=>{ l.log[0].text = "Enquiry captured · "+l.source; });

  /* fill class rosters from each branch's own active members */
  classes.forEach(c=>{
    const pool = members.filter(m=>m.branchId===c.branchId && new Date(m.end)>=TODAY && !m.cancelled
                   && (m.disciplines.includes(c.disc) || !DISCIPLINES.find(d=>d.id===c.disc).fight));
    if(!pool.length) return;
    const target = Math.min(c.cap+4, Math.round(c.cap*(0.5+rnd()*0.75)));
    const seen = new Set(); let guard=0;
    while(seen.size < target && guard++ < target*14){
      const m = pick(pool); if(!m || seen.has(m.id)) continue; seen.add(m.id);
      (c.booked.length < c.cap ? c.booked : c.waitlist).push(m.id);
    }
  });

  return {members, checkins, invoices, pt, leads, classes, spars, seq:{m:mSeq,i:iSeq,l:lSeq}};
}
