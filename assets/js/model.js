/* model.js — application state and derived selectors.
   `S` is the whole database. Everything the views show is computed from
   it here, including the fight-readiness score. */
"use strict";

/* ---------------- derived helpers ---------------- */
let S = null;

const UI = {branch:"ALL", mFilter:"all", mSort:"name", mQuery:"", cQuery:"", bFilter:"all",
            fSort:"readiness", fFilter:"all", tab:"overview", tabId:null};

const inB   = x => UI.branch==="ALL" || x.branchId===UI.branch;
const B     = arr => UI.branch==="ALL" ? arr : arr.filter(x=>x.branchId===UI.branch);
const bLabel= () => UI.branch==="ALL" ? "All three centres" : branchById(UI.branch).name+" · "+branchById(UI.branch).city;

function statusOf(m){
  if(m.cancelled) return {key:"cancelled", label:"Cancelled", cls:"pill"};
  if(m.frozen)    return {key:"frozen",    label:"Frozen",    cls:"pill pill-data"};
  const left = days(m.end, TODAY);
  if(left < 0)   return {key:"expired",  label:"Expired",   cls:"pill pill-crit dot", left};
  if(left <= 14) return {key:"expiring", label:left+"d left", cls:"pill pill-warn dot", left};
  return {key:"active", label:"Active", cls:"pill pill-good dot", left};
}
const memberById = id => S.members.find(m=>m.id===id);
const lastVisit  = id => { let t=null; for(const c of S.checkins) if(c.memberId===id && (!t||c.ts>t)) t=c.ts; return t; };
const visitsSince= (id,n) => S.checkins.filter(c=>c.memberId===id && days(TODAY,c.ts)<=n).length;
const duesOf     = id => S.invoices.filter(i=>i.memberId===id && i.status!=="paid").reduce((s,i)=>s+(i.amount-i.paid),0);
const isToday    = ts => iso(ts)===iso(TODAY);
const checkedInToday = id => S.checkins.some(c=>c.memberId===id && isToday(c.ts));
const sparsOf    = id => S.spars.filter(s=>s.memberId===id);
const roundsSince= (id,n) => sparsOf(id).filter(s=>days(TODAY,s.ts)<=n).reduce((t,s)=>t+s.rounds,0);
const lastSpar   = id => { const a=sparsOf(id).map(s=>s.ts).sort(); return a.length?a[a.length-1]:null; };
const activeMembers = () => B(S.members).filter(m=>!m.cancelled && new Date(m.end)>=TODAY);
const fighters = () => B(S.members).filter(m=>m.track==="fight" && !m.cancelled && new Date(m.end)>=TODAY);

function atRisk(m){
  const k = statusOf(m).key;
  if(k==="expired"||k==="cancelled"||k==="frozen") return 0;
  const lv = lastVisit(m.id);
  return lv ? days(TODAY,lv) : days(TODAY,m.start);
}

/* Fight readiness — four things a corner actually cares about:
   mat time, sparring volume, how close to weight, and how fresh
   the last hard round was. Scored out of 100. */
function readiness(m){
  const v30 = visitsSince(m.id,30);
  const r30 = roundsSince(m.id,30);
  const ls  = lastSpar(m.id);
  const limit = (WEIGHT_CLASSES.find(w=>w.name===m.weightClass)||WEIGHT_CLASSES[0]).limit;
  const over  = Math.max(0, m.weight - limit);
  const parts = {
    mat:    Math.round(clamp(v30/12,0,1)*35),
    spar:   Math.round(clamp(r30/24,0,1)*30),
    weight: Math.round(clamp(1 - over/5, 0, 1)*20),
    fresh:  ls ? Math.round(clamp(1 - days(TODAY,ls)/28, 0, 1)*15) : 0,
  };
  const total = parts.mat+parts.spar+parts.weight+parts.fresh;
  return {total, parts, v30, r30, ls, over, limit,
          band: total>=75 ? "good" : total>=50 ? "warn" : "crit",
          verdict: total>=75 ? "Camp ready" : total>=50 ? "Needs a block" : "Off the pace"};
}

/* ---------------- persistence ---------------- */
const KEY = "fnf-crm-v1";
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function load(){ try{ const r=localStorage.getItem(KEY); if(r){ const p=JSON.parse(r); if(p&&p.members&&p.spars) return p; } }catch(e){} return null; }
S = load() || seed();
