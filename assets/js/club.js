/* club.js — the club itself.
   Centres, plans, disciplines, weight classes, coaching staff and the
   weekly timetable template. Edit this file to re-shape the business. */
"use strict";

/* ---------------- the club ---------------- */
const BRANCHES = [
  {id:"VSH", name:"Vashi",   city:"Navi Mumbai", area:"Sector 30, Vashi",   manager:"Sumit",        phone:"98217 94867", opened:2011},
  {id:"NRL", name:"Nerul",   city:"Navi Mumbai", area:"Nerul East",          manager:"Rahul Khadpe", phone:"93217 86341", opened:2016},
  {id:"WGH", name:"Wagholi", city:"Pune",        area:"Wagholi",             manager:"Jayesh",       phone:"91379 13036", opened:2021},
];
const branchById = id => BRANCHES.find(b=>b.id===id) || BRANCHES[0];

const PLANS = [
  {id:"FIT-M", name:"Fitness Monthly",        months:1,  price:2000,  track:"fitness"},
  {id:"FIT-Q", name:"Fitness Quarterly",      months:3,  price:5000,  track:"fitness"},
  {id:"FIT-Y", name:"Fitness Annual",         months:12, price:15000, track:"fitness"},
  {id:"WAR-M", name:"Warrior Conditioning",   months:1,  price:2200,  track:"fitness"},
  {id:"CF-M",  name:"CrossFit Monthly",       months:1,  price:3000,  track:"fitness"},
  {id:"MMA-M", name:"MMA Basic Monthly",      months:1,  price:2500,  track:"fight"},
  {id:"MMA-Q", name:"MMA Basic Quarterly",    months:3,  price:6500,  track:"fight"},
  {id:"PRO-Q", name:"MMA Pro Quarterly",      months:3,  price:9000,  track:"fight"},
  {id:"ALL-Y", name:"All-Access Annual",      months:12, price:24000, track:"fight"},
];
const planById = id => PLANS.find(p=>p.id===id) || PLANS[0];

const DISCIPLINES = [
  {id:"BOX", name:"Boxing",              short:"Boxing",   fight:true},
  {id:"KBX", name:"Kick Boxing",         short:"Kickbox",  fight:true},
  {id:"MTH", name:"Muay Thai",           short:"Muay Thai",fight:true},
  {id:"WRS", name:"Wrestling",           short:"Wrestling",fight:true},
  {id:"BJJ", name:"Brazilian Jiu Jitsu", short:"BJJ",      fight:true},
  {id:"WAR", name:"Warrior Conditioning",short:"Warrior",  fight:false},
  {id:"CRF", name:"CrossFit",            short:"CrossFit", fight:false},
  {id:"WGT", name:"Weight Training",     short:"Weights",  fight:false},
];
const discById = id => DISCIPLINES.find(d=>d.id===id) || DISCIPLINES[0];

const LEVELS = ["Beginner","Intermediate","Advanced","Professional"];
const BELTS = [
  {name:"White",  color:"#F2EFEA"}, {name:"Blue",   color:"#1F5FBF"},
  {name:"Purple", color:"#6C3FA8"}, {name:"Brown",  color:"#6B4526"},
  {name:"Black",  color:"#161314"},
];
const WEIGHT_CLASSES = [
  {name:"Flyweight",         limit:56.7}, {name:"Bantamweight",     limit:61.2},
  {name:"Featherweight",     limit:65.8}, {name:"Lightweight",      limit:70.3},
  {name:"Welterweight",      limit:77.1}, {name:"Middleweight",     limit:83.9},
  {name:"Light Heavyweight", limit:93.0}, {name:"Heavyweight",      limit:120.2},
];
const classFor = kg => WEIGHT_CLASSES.find(w=>kg<=w.limit) || WEIGHT_CLASSES[WEIGHT_CLASSES.length-1];

/* Coaching staff. Founder and centre managers are the club's real
   staff listed publicly; the remaining coaches are demo entries. */
const COACHES = [
  {id:"CH1", name:"Sanjivan Padwal", role:"Founder & Head Coach", branchId:"VSH", disc:["WRS","MTH","BOX"], rate:1200, since:2011, phone:"99302 24405"},
  {id:"CH2", name:"Rahul Khadpe",    role:"Centre Manager · Boxing", branchId:"NRL", disc:["BOX","KBX"], rate:900, since:2016, phone:"93217 86341"},
  {id:"CH3", name:"Sumit",           role:"Centre Manager · Muay Thai", branchId:"VSH", disc:["MTH","KBX"], rate:900, since:2014, phone:"98217 94867"},
  {id:"CH4", name:"Jayesh",          role:"Centre Manager · Conditioning", branchId:"WGH", disc:["WAR","CRF"], rate:900, since:2021, phone:"91379 13036"},
  {id:"CH5", name:"Aditya Raut",     role:"BJJ Coach",           branchId:"NRL", disc:["BJJ","WRS"], rate:1000, since:2018, phone:"98190 22110"},
  {id:"CH6", name:"Faiz Ansari",     role:"Kickboxing Coach",    branchId:"VSH", disc:["KBX","BOX"], rate:850,  since:2019, phone:"98190 33221"},
  {id:"CH7", name:"Sneha Kulkarni",  role:"CrossFit & Warrior",  branchId:"WGH", disc:["CRF","WAR"], rate:850,  since:2021, phone:"98190 44332"},
  {id:"CH8", name:"Vikrant More",    role:"Strength Coach",      branchId:"NRL", disc:["WGT","WAR"], rate:800,  since:2022, phone:"98190 55443"},
  {id:"CH9", name:"Prathamesh Salunkhe", role:"Boxing Coach",    branchId:"WGH", disc:["BOX","KBX"], rate:850,  since:2022, phone:"98190 66554"},
  {id:"CH10",name:"Rutuja Pawar",    role:"Wrestling & BJJ Coach", branchId:"WGH", disc:["WRS","BJJ"], rate:900, since:2023, phone:"98190 77665"},
];
const coachById = id => COACHES.find(c=>c.id===id);

const SOURCES = ["Walk-in","Instagram","Website trial form","Google Search","Referral","Meta Ads","Justdial","Corporate tie-up"];
const STAGES = [
  {id:"new",       name:"New enquiry",   color:"var(--ink-3)"},
  {id:"contacted", name:"Contacted",     color:"#8A7F80"},
  {id:"trial",     name:"Trial booked",  color:"var(--warn)"},
  {id:"trialdone", name:"Trial attended",color:"var(--data)"},
  {id:"negotiate", name:"Negotiating",   color:"var(--accent)"},
  {id:"won",       name:"Joined",        color:"var(--good)"},
  {id:"lost",      name:"Lost",          color:"var(--ink-3)"},
];
const stageById = id => STAGES.find(s=>s.id===id) || STAGES[0];
const OPEN_STAGES = ["new","contacted","trial","trialdone","negotiate"];

const FIRST = ["Aarav","Vivaan","Aditya","Rohit","Ishaan","Kabir","Manav","Nikhil","Siddharth","Yash","Ananya","Diya","Saanvi","Meera","Kavya","Riya","Tanvi","Aditi","Sneha","Pooja","Rahul","Karan","Farhan","Imran","Joseph","Deepak","Sameer","Varun","Anjali","Shreya","Nandini","Rakesh","Suresh","Lakshmi","Divya","Harsha","Gaurav","Ritika","Naveen","Preeti","Zoya","Aman","Ishita","Vishal","Mitali","Omkar","Prathamesh","Shweta","Tejas","Rutuja","Sagar","Mrunal","Chinmay","Snehal"];
const LAST  = ["Sharma","Reddy","Nair","Iyer","Menon","Patel","Gowda","Kulkarni","Bhat","Rao","Verma","Kapoor","Joshi","Pillai","Shetty","Desai","Chatterjee","Bose","Mehta","Singh","Khan","Fernandes","Prasad","Naidu","Hegde","Jadhav","Deshmukh","Sawant","Bhosale","Salunkhe","Gaikwad","Chavan","Pawar","Kadam"];
const newName = () => pick(FIRST)+" "+pick(LAST);
const newPhone = () => "9"+int(1,8)+int(100,999)+" "+int(10000,99999);
const GOALS = ["Fat loss","Muscle gain","General fitness","Fight preparation","Self defence","Strength","Endurance","Stress relief"];

/* class timetable per branch */
const TIMETABLE = [
  {name:"Boxing",              disc:"BOX", level:"Beginner",     time:"06:30", dur:60, cap:18, room:"Ring",     days:[1,3,5]},
  {name:"Boxing Pro",          disc:"BOX", level:"Professional", time:"19:30", dur:75, cap:12, room:"Ring",     days:[2,4]},
  {name:"Kick Boxing",         disc:"KBX", level:"Intermediate", time:"18:00", dur:60, cap:20, room:"Mat A",    days:[1,3,5]},
  {name:"Muay Thai",           disc:"MTH", level:"Intermediate", time:"07:30", dur:60, cap:18, room:"Mat A",    days:[2,4,6]},
  {name:"Muay Thai Pro",       disc:"MTH", level:"Professional", time:"20:00", dur:75, cap:10, room:"Ring",     days:[1,4]},
  {name:"Wrestling",           disc:"WRS", level:"Intermediate", time:"19:00", dur:60, cap:14, room:"Mat B",    days:[2,5]},
  {name:"Brazilian Jiu Jitsu", disc:"BJJ", level:"Beginner",     time:"08:30", dur:60, cap:16, room:"Mat B",    days:[0,3,6]},
  {name:"BJJ Advanced",        disc:"BJJ", level:"Advanced",     time:"20:00", dur:75, cap:12, room:"Mat B",    days:[2,5]},
  {name:"Warrior Conditioning",disc:"WAR", level:"Beginner",     time:"06:00", dur:45, cap:24, room:"Turf",     days:[1,2,3,4,5]},
  {name:"CrossFit WOD",        disc:"CRF", level:"Intermediate", time:"18:30", dur:60, cap:20, room:"Box",      days:[1,3,5]},
  {name:"Open Sparring",       disc:"BOX", level:"Advanced",     time:"18:00", dur:90, cap:20, room:"Ring",     days:[6]},
];
const DAYNAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
