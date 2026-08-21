/* core.js — helpers, formatters and the seeded RNG.
   Everything here is pure: no DOM, no state. */
"use strict";

const $  = (s,r=document)=>r.querySelector(s);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DAY = 864e5;
const TODAY = (()=>{const d=new Date();d.setHours(0,0,0,0);return d;})();
const iso  = d => new Date(d).toISOString().slice(0,10);
const days = (a,b) => Math.round((new Date(a)-new Date(b))/DAY);
const addD = (d,n) => new Date(new Date(d).getTime()+n*DAY);
const fmtD = d => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const fmtDs= d => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"});
const money= n => "₹" + Math.round(n).toLocaleString("en-IN");
const initials = n => n.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

let _s = 20260821;
const rnd  = () => (_s = (_s*1664525+1013904223)%4294967296)/4294967296;
const pick = a => a[Math.floor(rnd()*a.length)];
const int  = (a,b) => a + Math.floor(rnd()*(b-a+1));
const chance = p => rnd() < p;
