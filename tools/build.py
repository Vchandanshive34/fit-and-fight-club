#!/usr/bin/env python3
"""Generates the Fit and Fight Club static site.

This is a authoring convenience, not a build step the site depends on:
it writes plain HTML files that are served exactly as they are. Run it
only if you want to change the shared header/footer in one place.
"""
import os, html, json

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SITE = "https://www.fitandfightclub.com"
SLOGAN = "Be stronger, harder, faster, better today than yesterday"

SOCIAL = {
    "instagram": "https://www.instagram.com/fitandfightclub",
    "facebook":  "https://www.facebook.com/FitNFightClub",
    "youtube":   "https://www.youtube.com/@FitandFightClub",
}
EVENT_URL = "https://www.fitandfightclub.com/event-details/warriors-dream-series-15-fight-night"

BRANCHES = [
    dict(slug="vashi", name="Vashi", full="FFC Vashi", city="Navi Mumbai",
         address="Hope and Care Building 41/1, 1st floor, next to Keshav Kunj 1, Sector 30, Vashi, Navi Mumbai 400703",
         locality="Vashi, Navi Mumbai", pin="400703",
         manager="Sumit Jadhav", manager_role="Centre Manager",
         phone="+91 98217 94867", wa="919821794867",
         maps="https://www.google.com/maps/search/?api=1&query=Fit+and+Fight+Club+Sector+30+Vashi+Navi+Mumbai",
         blurb="The flagship floor. Full mat space, a ring, and the widest timetable of the three — most of the club's competitive fighters train here.",
         trains=["Mixed Martial Arts","Muay Thai","Boxing","Kick Boxing","Wrestling","Brazilian Jiu Jitsu","Warrior Conditioning","HIIT","Personal Training"],
         landmark="Next to Keshav Kunj 1, a short walk from Vashi station."),
    dict(slug="nerul", name="Nerul", full="FFC Nerul", city="Navi Mumbai",
         address="4th Floor, Bhanushali Wadi, Sector 19A, near Ryan International School, Nerul East, Navi Mumbai, Maharashtra 400706",
         locality="Nerul East, Navi Mumbai", pin="400706",
         manager="Ashok Bagade", manager_role="Centre Manager",
         phone="+91 93217 86341", wa="919321786341", contact_person="Rahul Khadpe",
         maps="https://www.google.com/maps/search/?api=1&query=Fit+and+Fight+Club+Sector+19A+Nerul+East+Navi+Mumbai",
         blurb="Striking-heavy and busy through the evening. Strong beginner intake — a good place to take a first class if you have never trained before.",
         trains=["Mixed Martial Arts","Muay Thai","Boxing","Kick Boxing","Brazilian Jiu Jitsu","Warrior Conditioning","Karate for kids","Personal Training"],
         landmark="Near Ryan International School, Sector 19A."),
    dict(slug="wagholi", name="Wagholi", full="FFC Wagholi", city="Pune",
         address="Satav Patil Sports, Domkhel Wasti, BAIF Road, Wagholi, Pune, Maharashtra 412207",
         locality="Wagholi, Pune", pin="412207",
         manager="Jayesh Wavele", manager_role="Centre Manager",
         phone="+91 91379 13036", wa="919137913036",
         maps="https://www.google.com/maps/search/?api=1&query=Fit+and+Fight+Club+Satav+Patil+Sports+Wagholi+Pune",
         blurb="The Pune centre, inside Satav Patil Sports on BAIF Road. Conditioning and grappling lead the timetable, with striking through the week.",
         trains=["Mixed Martial Arts","Muay Thai","Boxing","Kick Boxing","Wrestling","Warrior Conditioning","HIIT","Personal Training"],
         landmark="Inside Satav Patil Sports, Domkhel Wasti, off BAIF Road."),
]
B = {b["slug"]: b for b in BRANCHES}

TEAM = [
    dict(slug="sanjivan-padwal", name="Sanjivan Padwal", role="Founder & Head Coach",
         phone="+91 99302 24405",
         bio="Opened the first Fit and Fight Club floor in Kharghar in 2011 and still takes the fight classes himself. Coaches wrestling, Muay Thai and boxing."),
    dict(slug="sumit-jadhav", name="Sumit Jadhav", role="Manager, FFC Vashi",
         phone="+91 98217 94867",
         bio="Runs the Vashi floor day to day — memberships, timetable and the competitive squad's camp schedule."),
    dict(slug="ashok-bagade", name="Ashok Bagade", role="Manager, FFC Nerul",
         phone="+91 93217 86341",
         bio="Runs the Nerul centre and looks after new-member intake, from a first free trial through to the first grading."),
    dict(slug="jayesh-wavele", name="Jayesh Wavele", role="Manager, FFC Wagholi, Pune",
         phone="+91 91379 13036",
         bio="Heads up the Pune centre and leads the conditioning and CrossFit-style sessions."),
]

DISCIPLINES = [
    dict(slug="mma", name="Mixed Martial Arts", who="All levels · 14+",
         text="The full sport: striking, grappling and ground fighting drawn together from boxing, Muay Thai, wrestling and jiu jitsu. You start with the basics of each range and learn to move between them under pressure."),
    dict(slug="muay-thai", name="Muay Thai", who="All levels · 14+",
         text="The art of eight limbs. Fists, elbows, knees and shins, plus the clinch work that separates Thai boxing from every other stand-up style. Pad rounds every session."),
    dict(slug="boxing", name="Boxing", who="All levels · 12+",
         text="Footwork, guard, timing and combinations. The cleanest place to build fight fitness and the discipline everything else at the club is layered on top of."),
    dict(slug="kick-boxing", name="Kick Boxing", who="All levels · 12+",
         text="The sharpness of martial arts with the agility of boxing. Fast, high-volume rounds on the bag and the pads — the most popular class for people training purely for fitness."),
    dict(slug="wrestling", name="Wrestling", who="Intermediate · 14+",
         text="Clinch fighting, throws and take-downs, plus the scrambles that follow. Hard conditioning built in — the class most fighters credit for their engine."),
    dict(slug="bjj", name="Brazilian Jiu Jitsu", who="All levels · 12+",
         text="Taking an opponent to the ground, controlling them there, and finishing with a submission. Technical, low-injury, and the one discipline where size matters least."),
    dict(slug="warrior-conditioning", name="Warrior Conditioning", who="All levels · 14+",
         text="Strength and conditioning built on functional movement — squat, hinge, push, pull, carry — run at an intensity that holds up under a fighter's workload. No martial arts experience needed."),
    dict(slug="hiit", name="HIIT", who="All levels · 14+",
         text="Short, hard anaerobic intervals against short recoveries. Forty-five minutes, in and out, for anyone whose main goal is fat loss and a working heart rate."),
    dict(slug="karate", name="Karate for Kids", who="Children · 5–13",
         text="Strength, discipline and self-confidence, taught as a martial art rather than a workout. Structured belt progression so children can see how far they have come."),
]

PILLARS = [
    dict(title="Warrior Conditioning",
         text="Strength and conditioning with functional movements — squats, push-ups, weight lifting — run at high intensity. Where most members start.",
         tags=["Strength","Conditioning","HIIT"]),
    dict(title="Mixed Martial Arts",
         text="Boxing, Kick Boxing, Muay Thai, Wrestling and Brazilian Jiu Jitsu, taught separately and then put together. From a first class to a professional camp.",
         tags=["Boxing","Muay Thai","Wrestling","BJJ"]),
    dict(title="Personal Training",
         text="One-to-one with a coach, on a plan written around your goal — weight loss, weight gain, self defence, or a fight on the calendar.",
         tags=["1-to-1","Nutrition","Fight camp"]),
]

# ------------------------------------------------------------------ helpers
def e(s): return html.escape(str(s), quote=False)

def rel(depth, path):
    """Path from a page at `depth` directories deep back to the site root."""
    return ("../" * depth) + path

ICON = {
 "pin":'<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
 "phone":'<path d="M5 3h3.6l1.6 4-2.2 1.6a13 13 0 0 0 6.4 6.4L16 12.8l4 1.6V18a2.6 2.6 0 0 1-2.9 2.6A16.6 16.6 0 0 1 3.4 5.9 2.6 2.6 0 0 1 6 3Z"/>',
 "clock":'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
}
def icon(n):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % ICON[n])

MARK = ('<svg viewBox="0 0 36 36" aria-hidden="true">'
        '<rect width="36" height="36" rx="5" fill="#171313"/>'
        '<path d="M0 0h13L0 13Z" fill="#E03A32"/>'
        '<path d="M36 36H23L36 23Z" fill="#3B7BDE"/>'
        '<text x="18" y="25.5" text-anchor="middle" fill="#F7F3F1" '
        'font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="800" font-size="20">FF</text>'
        '</svg>')

SOCIAL_SVG = {
 "instagram":'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/>',
 "facebook":'<path d="M14 8.5V7a1.6 1.6 0 0 1 1.7-1.6H17V2.6h-2.4A4.3 4.3 0 0 0 10.4 7v1.5H8V11.7h2.4v9.7H14v-9.7h2.4l.6-3.2Z"/>',
 "youtube":'<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.3 9.6l5 2.4-5 2.4Z"/>',
}

def header(depth, current):
    r = lambda p: rel(depth, p)
    def link(href, label, key):
        cur = ' aria-current="page"' if current == key else ""
        return f'<a href="{href}"{cur}>{label}</a>'
    centre_items = "".join(
        f'<a href="{r(b["slug"]+"/")}"><b>FFC {e(b["name"])}</b><i>{e(b["locality"])}</i></a>'
        for b in BRANCHES)
    centre_open = ' aria-current="page"' if current in ("vashi","nerul","wagholi") else ""
    return f'''<a class="skip" href="#main">Skip to content</a>
<!-- HEADER — identical on every page -->
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="{r("")}" aria-label="Fit and Fight Club, home">
      {MARK}
      <span><b>Fit and Fight Club</b><span>Navi Mumbai &amp; Pune</span></span>
    </a>
    <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span></button>
    <nav class="nav" id="nav" aria-label="Primary">
      {link(r(""), "Home", "home")}
      {link(r("classes/"), "Classes", "classes")}
      <div class="has-menu">
        <button type="button" aria-expanded="false"{centre_open}>Centres</button>
        <div class="menu">{centre_items}</div>
      </div>
      {link(r("about/"), "About", "about")}
      <a href="{EVENT_URL}" target="_blank" rel="noopener">Fight nights</a>
      {link(r("contact/"), "Contact", "contact")}
      <a class="btn btn-primary btn-sm" href="{r("contact/#trial")}">Book a free trial</a>
    </nav>
  </div>
</header>'''

def footer(depth):
    r = lambda p: rel(depth, p)
    socials = "".join(
        f'<a href="{u}" target="_blank" rel="noopener" aria-label="{k.title()}">'
        f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
        f'stroke-linecap="round" stroke-linejoin="round">{SOCIAL_SVG[k]}</svg></a>'
        for k, u in SOCIAL.items())
    centres = "".join(
        f'<li><a href="{r(b["slug"]+"/")}">FFC {e(b["name"])} — {e(b["city"])}</a></li>' for b in BRANCHES)
    return f'''<!-- FOOTER — identical on every page -->
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="{r("")}" style="margin-bottom:14px">
          {MARK}
          <span><b>Fit and Fight Club</b><span>Est. 2011</span></span>
        </a>
        <p class="muted" style="font-size:.92rem;max-width:30ch">
          A mixed martial arts and fitness training centre for every level — weight loss, self defence,
          or a professional fight camp.</p>
        <div class="socials">{socials}</div>
      </div>
      <div>
        <h4>Centres</h4>
        <ul>{centres}</ul>
      </div>
      <div>
        <h4>Train</h4>
        <ul>
          <li><a href="{r("classes/")}">All classes</a></li>
          <li><a href="{r("classes/#mma")}">Mixed Martial Arts</a></li>
          <li><a href="{r("classes/#warrior-conditioning")}">Warrior Conditioning</a></li>
          <li><a href="{r("classes/#karate")}">Karate for kids</a></li>
          <li><a href="{r("contact/#trial")}">Book a free trial</a></li>
        </ul>
      </div>
      <div>
        <h4>Club</h4>
        <ul>
          <li><a href="{r("about/")}">About us</a></li>
          <li><a href="{EVENT_URL}" target="_blank" rel="noopener">Fight nights</a></li>
          <li><a href="{r("contact/")}">Contact</a></li>
          <li><a href="tel:+919930224405">+91 99302 24405</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-base">
      <span>&copy; <span data-year>2026</span> Fit and Fight Club. All rights reserved.</span>
      <span>Fighters compete under <a href="https://www.instagram.com/nmmmaa_official" target="_blank" rel="noopener">NAMM</a>.</span>
    </div>
  </div>
</footer>'''

def page(path, depth, current, title, description, body, jsonld=None, hero_img=None):
    r = lambda p: rel(depth, p)
    ld = f'\n  <script type="application/ld+json">{json.dumps(jsonld, indent=2)}</script>' if jsonld else ""
    doc = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)}</title>
  <meta name="description" content="{html.escape(description, quote=True)}">
  <meta name="theme-color" content="#0A0909">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Fit and Fight Club">
  <meta property="og:title" content="{html.escape(title, quote=True)}">
  <meta property="og:description" content="{html.escape(description, quote=True)}">
  <link rel="icon" href="{r("assets/favicon.svg")}" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600&family=Barlow:wght@400;500;600&family=Big+Shoulders+Display:wght@700;800&display=swap">
  <link rel="stylesheet" href="{r("assets/css/styles.css")}">{ld}
</head>
<body>
{header(depth, current)}
<main id="main">
{body}
</main>
{footer(depth)}
<script src="{r("assets/js/site.js")}"></script>
</body>
</html>
'''
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w").write(doc)
    print("wrote", path, len(doc))

# ------------------------------------------------------------------ shared blocks
def ropes():
    return '<div class="wrap"><div class="ropes"><span></span><span></span><span></span></div></div>'

def cta(depth, heading="Your first class is free", sub="Walk in, try a session, decide afterwards. No card, no joining fee, no commitment."):
    r = lambda p: rel(depth, p)
    return f'''<section class="cta">
  <div class="wrap">
    <p class="eyebrow" style="justify-content:center">Book a free trial</p>
    <h2 class="d2">{e(heading)}</h2>
    <p class="lead" style="margin:1.1rem auto 0;text-align:center">{e(sub)}</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="{r("contact/#trial")}">Book your free trial</a>
      <a class="btn btn-ghost" href="tel:+919930224405">Call +91 99302 24405</a>
    </div>
  </div>
</section>'''

def centre_cards(depth):
    r = lambda p: rel(depth, p)
    out = []
    for b in BRANCHES:
        out.append(f'''      <a class="card centre-card reveal" href="{r(b["slug"]+"/")}">
        <div class="card-media"><span class="tagline">{e(b["city"])}</span>
          <img src="{r("assets/img/centre-"+b["slug"]+".svg")}" alt="FFC {e(b["name"])}" width="1200" height="750" loading="lazy"></div>
        <div class="card-body">
          <h3>FFC {e(b["name"])}</h3>
          <div class="centre-meta">
            <span class="row">{icon("pin")}<span>{e(b["locality"])}</span></span>
            <span class="row">{icon("phone")}<span>{e(b["manager"])} · {e(b["phone"])}</span></span>
          </div>
          <span class="card-more">Centre details</span>
        </div>
      </a>''')
    return "\n".join(out)

def enquiry_form(depth, preselect=None):
    opts = "".join(
        f'<option value="{e(b["name"])}" data-phone="{b["wa"]}" data-name="FFC {e(b["name"])}"'
        f'{" selected" if preselect == b["slug"] else ""}>FFC {e(b["name"])} — {e(b["city"])}</option>'
        for b in BRANCHES)
    disc = "".join(f'<option>{e(d["name"])}</option>' for d in DISCIPLINES)
    return f'''<form class="form" data-enquiry novalidate>
  <div class="field-row">
    <div class="field"><label for="f-name">Your name</label>
      <input id="f-name" name="name" type="text" autocomplete="name" placeholder="Full name" required></div>
    <div class="field"><label for="f-phone">Phone</label>
      <input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="98XXX XXXXX" required></div>
  </div>
  <div class="field"><label for="f-centre">Which centre</label>
    <select id="f-centre" name="centre">{opts}</select></div>
  <div class="field-row">
    <div class="field"><label for="f-interest">Interested in</label>
      <select id="f-interest" name="interest">{disc}<option>Personal Training</option><option>Not sure yet</option></select></div>
    <div class="field"><label for="f-exp">Experience</label>
      <select id="f-exp" name="experience">
        <option>Complete beginner</option><option>Trained before</option>
        <option>Train regularly</option><option>Competing</option></select></div>
  </div>
  <div class="field"><label for="f-msg">Anything we should know</label>
    <textarea id="f-msg" name="message" rows="3" placeholder="Injuries, preferred timings, goals..."></textarea></div>
  <button class="btn btn-primary" type="submit">Send on WhatsApp</button>
  <p class="form-note" data-sent hidden></p>
  <p class="form-note">This opens WhatsApp with your details already filled in — nothing is stored on this site.
    Prefer to speak to someone? Call the centre directly on the number listed below.</p>
</form>'''

# ================================================================== pages
def build_home():
    d = 0
    r = lambda p: rel(d, p)
    pillars = "\n".join(
        f'''      <div class="pillar reveal">
        <h3>{e(p["title"])}</h3>
        <p>{e(p["text"])}</p>
        <ul>{"".join(f"<li>{e(t)}</li>" for t in p["tags"])}</ul>
      </div>''' for p in PILLARS)
    team = "\n".join(
        f'''      <article class="card coach reveal">
        <div class="card-media"><img src="{r("assets/img/coach-"+t["slug"]+".svg")}" alt="{e(t["name"])}" width="800" height="800" loading="lazy"></div>
        <div class="card-body">
          <h3>{e(t["name"])}</h3>
          <p class="role">{e(t["role"])}</p>
          <a class="tel" href="tel:{t["phone"].replace(" ","")}">{e(t["phone"])}</a>
        </div>
      </article>''' for t in TEAM)

    body = f'''<section class="hero">
  <div class="hero-media"><img src="{r("assets/img/hero.svg")}" alt="" width="1600" height="900" fetchpriority="high"></div>
  <div class="wrap">
    <p class="eyebrow">Est. 2011 · Navi Mumbai &amp; Pune</p>
    <h1 class="d1">Be stronger, harder, faster, <em>better today than yesterday</em></h1>
    <p class="lead">A mixed martial arts and fitness training centre for every level — whether you are here to
      lose weight, learn to defend yourself, or fight professionally. Three centres, one standard.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="{r("contact/#trial")}">Book a free trial</a>
      <a class="btn btn-ghost" href="{r("classes/")}">See the classes</a>
    </div>
  </div>
</section>

<div class="stats">
  <div class="stat"><b>2011</b><span>Founded in Kharghar</span></div>
  <div class="stat"><b>5,000+</b><span>Members trained</span></div>
  <div class="stat"><b>3</b><span>Centres</span></div>
  <div class="stat"><b>9</b><span>Disciplines taught</span></div>
</div>

<section class="section" id="train">
  <div class="wrap">
    <div class="head-row">
      <div>
        <p class="eyebrow">Train with us</p>
        <h2 class="d2">Three ways in</h2>
        <p class="prose">Most people arrive wanting one of three things. Whichever you start with, you can
          move between them on the same membership — plenty of members come for conditioning and end up
          on the mats.</p>
      </div>
      <a class="btn btn-ghost" href="{r("classes/")}">All nine classes</a>
    </div>
    <div class="grid g3">
{pillars}
    </div>
  </div>
</section>

{ropes()}

<section class="section" id="centres">
  <div class="wrap">
    <div class="head-row">
      <div>
        <p class="eyebrow blue">Our centres</p>
        <h2 class="d2">Vashi · Nerul · Wagholi</h2>
        <p class="prose">Two floors across Navi Mumbai and one in Pune. Each centre has its own manager,
          its own timetable and its own coaching staff — pick the one nearest you and call ahead.</p>
      </div>
    </div>
    <div class="grid g3">
{centre_cards(d)}
    </div>
  </div>
</section>

<section class="section band" id="philosophy">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Our philosophy</p>
      <blockquote class="quote">Fitness is not a look. It is what you can still do in the last round.
        <cite>Sanjivan Padwal · Founder &amp; Head Coach</cite></blockquote>
    </div>
    <div class="prose">
      <p>We started in 2011 with a 500 square foot room in Kharghar and a heavy bag. The method has not
        changed since: teach the technique properly, condition hard enough that it holds up when you are
        tired, and treat a first-timer with the same seriousness as a fighter in camp.</p>
      <p>Our coaches come from Wushu, Karate, Wrestling and Boxing backgrounds, and every one of them
        still trains. Programmes are written per member — including modified work for anyone carrying an
        injury or a health condition. <strong>Nobody is turned away for being unfit. That is the point of
        walking in.</strong></p>
    </div>
  </div>
</section>

<section class="section" id="team">
  <div class="wrap">
    <div class="head-row">
      <div>
        <p class="eyebrow">Our core team</p>
        <h2 class="d2">Who you will train under</h2>
      </div>
      <a class="btn btn-ghost" href="{r("about/")}">More about the club</a>
    </div>
    <div class="grid g4">
{team}
    </div>
  </div>
</section>

<section class="section band" id="fight-nights">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Our coaches' wins</p>
      <h2 class="d2">We compete, not just train</h2>
      <p class="prose" style="margin-top:1.1rem">Fit and Fight Club fighters compete on amateur and
        professional cards across Maharashtra under NAMM sanctioning, and the club runs its own
        Warriors Dream Series fight nights. The ambition our coaches train for is the one they say
        out loud — ONE, Bellator, UFC.</p>
      <div class="btn-row" style="margin-top:1.8rem">
        <a class="btn btn-primary" href="{EVENT_URL}" target="_blank" rel="noopener">WDS 15 Fight Night</a>
        <a class="btn btn-ghost" href="{SOCIAL["youtube"]}" target="_blank" rel="noopener">Watch on YouTube</a>
      </div>
    </div>
    <div class="panel corner" style="padding:26px 24px">
      <p class="eyebrow" style="margin-bottom:.9rem">Fight record board</p>
      <ul class="wins">
        <li><span class="mark">W</span><span><b>Warriors Dream Series</b><span>Club-run amateur MMA fight night, Navi Mumbai</span></span></li>
        <li><span class="mark">W</span><span><b>NAMM sanctioned bouts</b><span>Amateur and professional cards across Maharashtra</span></span></li>
        <li><span class="mark">W</span><span><b>Inter-club competitions</b><span>Boxing, Muay Thai, wrestling and BJJ tournaments</span></span></li>
      </ul>
      <p class="form-note" style="margin-top:16px">Replace these three lines with your actual results —
        see the README.</p>
    </div>
  </div>
</section>

{cta(d)}
'''
    page("index.html", 0, "home",
         "Fit and Fight Club | MMA & Fitness in Navi Mumbai and Pune",
         "Mixed martial arts and fitness training in Vashi, Nerul and Wagholi. Boxing, Muay Thai, wrestling, Brazilian Jiu Jitsu, Warrior Conditioning and personal training. Book a free trial.",
         body,
         jsonld={"@context":"https://schema.org","@type":"SportsActivityLocation","name":"Fit and Fight Club",
                 "description":"Mixed martial arts and fitness training centre with three locations across Navi Mumbai and Pune.",
                 "url":SITE,"foundingDate":"2011","sameAs":list(SOCIAL.values()),
                 "department":[{"@type":"SportsActivityLocation","name":f"Fit and Fight Club, {b['name']}",
                                "telephone":b["phone"],"address":{"@type":"PostalAddress","streetAddress":b["address"],
                                "addressLocality":b["city"],"postalCode":b["pin"],"addressRegion":"Maharashtra","addressCountry":"IN"}}
                               for b in BRANCHES]})

def build_classes():
    d = 1
    r = lambda p: rel(d, p)
    tiles = "\n".join(
        f'''      <article class="disc reveal" id="{dd["slug"]}">
        <img src="{r("assets/img/disc-"+dd["slug"]+".svg")}" alt="{e(dd["name"])} at Fit and Fight Club" width="1000" height="800" loading="lazy">
        <div class="disc-body">
          <h3>{e(dd["name"])}</h3>
          <p>{e(dd["text"])}</p>
          <p class="who">{e(dd["who"])}</p>
        </div>
      </article>''' for dd in DISCIPLINES)
    body = f'''<section class="page-hero">
  <div class="wrap">
    <p class="crumbs"><a href="{r("")}">Home</a> / Classes</p>
    <h1 class="d2">Train with us</h1>
    <p class="lead" style="margin-top:1.2rem">A weekly schedule for every individual, at every stage of
      life. Nine disciplines plus one-to-one coaching — taught separately, then put together.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="grid g3">
{tiles}
    </div>
  </div>
</section>

<section class="section band">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Personal training</p>
      <h2 class="d3">One coach, one plan, one goal</h2>
      <p class="prose" style="margin-top:1rem">Group classes take you a long way. A fight camp, a weight
        target with a date on it, or coming back from an injury needs something written for you alone.
        Personal training is available at all three centres, in packs of 8, 12, 16 or 24 sessions.</p>
      <div class="btn-row" style="margin-top:1.6rem">
        <a class="btn btn-primary" href="{r("contact/#trial")}">Ask about PT</a>
      </div>
    </div>
    <div class="panel corner" style="padding:26px 24px">
      <p class="eyebrow" style="margin-bottom:1rem">Getting started</p>
      <ul class="info-list">
        <li><span class="k">Step 1</span><span class="v">Book a free trial class at the centre nearest you.</span></li>
        <li><span class="k">Step 2</span><span class="v">Turn up in shorts and a t-shirt. Gloves and pads are at the gym.</span></li>
        <li><span class="k">Step 3</span><span class="v">Train a full session with the group — not a watered-down taster.</span></li>
        <li><span class="k">Step 4</span><span class="v">Talk to the coach afterwards about which classes suit your goal.</span></li>
      </ul>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <p class="eyebrow">Timetables</p>
    <h2 class="d3">Class timings differ by centre</h2>
    <p class="prose" style="margin-top:1rem">Each centre runs its own weekly schedule and it changes with
      the season and with fight camps. Call the centre for the current timetable — the numbers are on
      each centre page.</p>
    <div class="grid g3" style="margin-top:2rem">
{centre_cards(d)}
    </div>
  </div>
</section>

{cta(d, "Try any class free", "Pick a discipline, pick a centre, and take a full session on us before you decide.")}
'''
    page("classes/index.html", 1, "classes",
         "Classes | MMA, Muay Thai, Boxing, BJJ & Conditioning | Fit and Fight Club",
         "Nine disciplines taught across three centres: Mixed Martial Arts, Muay Thai, Boxing, Kick Boxing, Wrestling, Brazilian Jiu Jitsu, Warrior Conditioning, HIIT and Karate for kids.",
         body)

def build_about():
    d = 1
    r = lambda p: rel(d, p)
    team = "\n".join(
        f'''      <article class="card coach reveal">
        <div class="card-media"><img src="{r("assets/img/coach-"+t["slug"]+".svg")}" alt="{e(t["name"])}" width="800" height="800" loading="lazy"></div>
        <div class="card-body">
          <h3>{e(t["name"])}</h3>
          <p class="role">{e(t["role"])}</p>
          <p style="font-size:.92rem;color:var(--fg-2)">{e(t["bio"])}</p>
          <a class="tel" href="tel:{t["phone"].replace(" ","")}">{e(t["phone"])}</a>
        </div>
      </article>''' for t in TEAM)
    body = f'''<section class="page-hero">
  <div class="wrap">
    <p class="crumbs"><a href="{r("")}">Home</a> / About us</p>
    <h1 class="d2">About the club</h1>
    <p class="lead" style="margin-top:1.2rem">A mixed martial arts and fitness training centre that caters
      to every fitness need — weight loss or gain, self defence, or professional martial arts.</p>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="prose">
      <p class="eyebrow">Our story</p>
      <h2 class="d3" style="margin-bottom:1.1rem">From 500 square feet to three centres</h2>
      <p>Fit and Fight Club was established in <strong>2011</strong> in Kharghar, Navi Mumbai, in a room
        of about five hundred square feet. In 2013 we opened a second floor in Seawoods. Since then the
        club has grown into three professionally managed centres — <strong>Vashi</strong> and
        <strong>Nerul</strong> in Navi Mumbai, and <strong>Wagholi</strong> in Pune.</p>
      <p>Along the way we have trained <strong>more than 5,000 people</strong>: office workers who had
        never thrown a punch, children learning their first kata, and fighters preparing for a card.
        Every one of them gets a programme built for them, including modified work for members training
        around a health condition or an injury.</p>
      <p>Our coaching team are practising MMA fighters from a mix of backgrounds — Wushu, Karate,
        Wrestling and Boxing. They train alongside the members, and they compete. The stated goal has
        never been modest: to put fighters from this club on the biggest platforms in the sport —
        ONE, Bellator, UFC.</p>
    </div>
    <div class="panel corner">
      <img src="{r("assets/img/about.svg")}" alt="Fit and Fight Club since 2011" width="1400" height="900" loading="lazy">
    </div>
  </div>
</section>

<section class="section band">
  <div class="wrap">
    <div class="head-row"><div>
      <p class="eyebrow">Our philosophy</p>
      <h2 class="d2">How we coach</h2>
    </div></div>
    <div class="grid g3">
      <div class="pillar reveal"><h3>Technique before intensity</h3>
        <p>Anyone can make a beginner tired. We would rather make you competent first — the conditioning
          arrives on its own once the movement is right.</p></div>
      <div class="pillar reveal"><h3>Everyone spars eventually</h3>
        <p>Not on day one, and never carelessly. But a martial art you have only ever practised on a bag
          is a hobby, not a skill. We build up to contact carefully and supervise every round.</p></div>
      <div class="pillar reveal"><h3>The programme fits the person</h3>
        <p>A fifty-year-old with a bad knee and a twenty-two-year-old in fight camp do not train the same
          way. Both get a plan. Both get watched.</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="head-row"><div>
      <p class="eyebrow">Our core team</p>
      <h2 class="d2">The people who run the floors</h2>
    </div></div>
    <div class="grid g4">
{team}
    </div>
  </div>
</section>

{cta(d, "Come and see the place", "The best way to judge a gym is to stand in it. Book a free trial at whichever centre is nearest.")}
'''
    page("about/index.html", 1, "about",
         "About Us | Fit and Fight Club | MMA & Fitness since 2011",
         "Fit and Fight Club began in Kharghar in 2011 and now runs three centres across Navi Mumbai and Pune, having trained more than 5,000 members.",
         body)

def build_branch(b):
    d = 1
    r = lambda p: rel(d, p)
    others = [x for x in BRANCHES if x["slug"] != b["slug"]]
    trains = "".join(f'<li>{e(t)}</li>' for t in b["trains"])
    contact_row = ""
    if b.get("contact_person"):
        contact_row = f'<li><span class="k">Enquiries</span><span class="v">{e(b["contact_person"])} · <a href="tel:{b["phone"].replace(" ","")}">{e(b["phone"])}</a></span></li>'
    else:
        contact_row = f'<li><span class="k">Phone</span><span class="v"><a href="tel:{b["phone"].replace(" ","")}">{e(b["phone"])}</a></span></li>'
    other_cards = "\n".join(
        f'''      <a class="card centre-card reveal" href="{r(o["slug"]+"/")}">
        <div class="card-media"><span class="tagline">{e(o["city"])}</span>
          <img src="{r("assets/img/centre-"+o["slug"]+".svg")}" alt="FFC {e(o["name"])}" width="1200" height="750" loading="lazy"></div>
        <div class="card-body"><h3>FFC {e(o["name"])}</h3>
          <p>{e(o["locality"])}</p><span class="card-more">Centre details</span></div>
      </a>''' for o in others)

    body = f'''<section class="page-hero">
  <div class="wrap">
    <p class="crumbs"><a href="{r("")}">Home</a> / Centres / FFC {e(b["name"])}</p>
    <p class="eyebrow">{e(b["city"])}</p>
    <h1 class="d2">Fit and Fight Club<br>{e(b["name"])}</h1>
    <p class="lead" style="margin-top:1.2rem">{e(b["blurb"])}</p>
    <div class="btn-row" style="margin-top:2rem">
      <a class="btn btn-primary" href="#trial">Book a free trial here</a>
      <a class="btn btn-ghost" href="tel:{b["phone"].replace(" ","")}">Call {e(b["phone"])}</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="panel corner">
      <img src="{r("assets/img/centre-"+b["slug"]+".svg")}" alt="Fit and Fight Club {e(b["name"])}" width="1200" height="750">
    </div>
    <div>
      <p class="eyebrow">Find us</p>
      <h2 class="d3" style="margin-bottom:1.2rem">{e(b["landmark"])}</h2>
      <ul class="info-list">
        <li><span class="k">Address</span><span class="v">{e(b["address"])}</span></li>
        <li><span class="k">Manager</span><span class="v">{e(b["manager"])}</span></li>
        {contact_row}
        <li><span class="k">WhatsApp</span><span class="v"><a href="https://wa.me/{b["wa"]}" target="_blank" rel="noopener">Message the centre</a></span></li>
        <li><span class="k">Map</span><span class="v"><a href="{b["maps"]}" target="_blank" rel="noopener">Open in Google Maps</a></span></li>
        <li><span class="k">Timings</span><span class="v">Call the centre for this week's timetable.</span></li>
      </ul>
    </div>
  </div>
</section>

<section class="section band">
  <div class="wrap">
    <div class="head-row"><div>
      <p class="eyebrow blue">Trained here</p>
      <h2 class="d2">What runs at {e(b["name"])}</h2>
      <p class="prose">Every discipline below is taught at this centre. Timings vary through the week —
        ring {e(b["manager"])} and ask which class suits you.</p>
    </div>
    <a class="btn btn-ghost" href="{r("classes/")}">What each class involves</a></div>
    <ul class="pillar" style="display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:22px 20px">
      {trains}
    </ul>
  </div>
</section>

<section class="section" id="trial">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Free trial</p>
      <h2 class="d2">Train here once, free</h2>
      <p class="prose" style="margin-top:1.1rem">Fill this in and it opens WhatsApp with your details
        already written out, addressed to {e(b["name"])}. {e(b["manager"])} will confirm a time.</p>
      <ul class="info-list" style="margin-top:1.6rem">
        <li><span class="k">Bring</span><span class="v">Shorts, a t-shirt and water. Gloves and pads are here.</span></li>
        <li><span class="k">Cost</span><span class="v">Nothing. No card, no joining fee.</span></li>
        <li><span class="k">Level</span><span class="v">Complete beginners welcome — most first-timers have never trained.</span></li>
      </ul>
    </div>
    <div class="panel" style="padding:26px 24px">
      {enquiry_form(d, preselect=b["slug"])}
    </div>
  </div>
</section>

<section class="section band">
  <div class="wrap">
    <div class="head-row"><div>
      <p class="eyebrow">Other centres</p>
      <h2 class="d3">Not the closest one to you?</h2>
    </div></div>
    <div class="grid g2">
{other_cards}
    </div>
  </div>
</section>
'''
    page(f"{b['slug']}/index.html", 1, b["slug"],
         f"FFC {b['name']} | Fit and Fight Club, {b['locality']}",
         f"Fit and Fight Club {b['name']} — {b['address']}. MMA, Muay Thai, boxing, wrestling, BJJ and Warrior Conditioning. Call {b['phone']} to book a free trial.",
         body,
         jsonld={"@context":"https://schema.org","@type":"SportsActivityLocation",
                 "name":f"Fit and Fight Club, {b['name']}","telephone":b["phone"],
                 "parentOrganization":{"@type":"Organization","name":"Fit and Fight Club","url":SITE},
                 "url":f"{SITE}/{b['slug']}/","sameAs":list(SOCIAL.values()),
                 "address":{"@type":"PostalAddress","streetAddress":b["address"],"addressLocality":b["city"],
                            "postalCode":b["pin"],"addressRegion":"Maharashtra","addressCountry":"IN"}})

def build_contact():
    d = 1
    r = lambda p: rel(d, p)
    cards = "\n".join(
        f'''      <div class="pillar reveal">
        <h3>FFC {e(b["name"])}</h3>
        <p style="font-size:.92rem">{e(b["address"])}</p>
        <ul class="info-list" style="margin-top:.9rem">
          <li><span class="k">Manager</span><span class="v">{e(b["manager"])}</span></li>
          <li><span class="k">Phone</span><span class="v"><a href="tel:{b["phone"].replace(" ","")}">{e(b["phone"])}</a></span></li>
          <li><span class="k">Map</span><span class="v"><a href="{b["maps"]}" target="_blank" rel="noopener">Google Maps</a></span></li>
        </ul>
        <div class="btn-row" style="margin-top:1.2rem">
          <a class="btn btn-ghost btn-sm" href="{r(b["slug"]+"/")}">Centre page</a>
          <a class="btn btn-ghost btn-sm" href="https://wa.me/{b["wa"]}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>''' for b in BRANCHES)
    body = f'''<section class="page-hero">
  <div class="wrap">
    <p class="crumbs"><a href="{r("")}">Home</a> / Contact</p>
    <h1 class="d2">Get in touch</h1>
    <p class="lead" style="margin-top:1.2rem">Call the centre nearest you, message us on WhatsApp, or fill
      in the form below and we will confirm a free trial slot.</p>
  </div>
</section>

<section class="section" id="trial">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Book a free trial</p>
      <h2 class="d2">One full class, on us</h2>
      <p class="prose" style="margin-top:1.1rem">Not a watered-down taster — a real session with the
        group, with a coach watching you. Afterwards you decide whether to join. Nothing is stored on
        this website: the form simply opens WhatsApp with your details written out.</p>
      <ul class="info-list" style="margin-top:1.6rem">
        <li><span class="k">Head coach</span><span class="v">Sanjivan Padwal · <a href="tel:+919930224405">+91 99302 24405</a></span></li>
        <li><span class="k">Instagram</span><span class="v"><a href="{SOCIAL["instagram"]}" target="_blank" rel="noopener">@fitandfightclub</a></span></li>
        <li><span class="k">YouTube</span><span class="v"><a href="{SOCIAL["youtube"]}" target="_blank" rel="noopener">Fit and Fight Club</a></span></li>
        <li><span class="k">Facebook</span><span class="v"><a href="{SOCIAL["facebook"]}" target="_blank" rel="noopener">FitNFightClub</a></span></li>
      </ul>
    </div>
    <div class="panel" style="padding:26px 24px">
      {enquiry_form(d)}
    </div>
  </div>
</section>

<section class="section band">
  <div class="wrap">
    <div class="head-row"><div>
      <p class="eyebrow blue">Our centres</p>
      <h2 class="d2">Three floors, three numbers</h2>
    </div></div>
    <div class="grid g3">
{cards}
    </div>
  </div>
</section>
'''
    page("contact/index.html", 1, "contact",
         "Contact | Fit and Fight Club | Vashi, Nerul & Wagholi",
         "Get in touch with Fit and Fight Club. Phone numbers, addresses and WhatsApp for our Vashi, Nerul and Wagholi centres, and book a free trial class.",
         body)

if __name__ == "__main__":
    build_home()
    build_classes()
    build_about()
    for b in BRANCHES:
        build_branch(b)
    build_contact()
