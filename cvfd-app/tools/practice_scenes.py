import random, json
W,H=400,260
class D:
    def __init__(s,pid,night=False,seed=1):
        s.p=pid; s.n=night; s.o=[]; s.r=random.Random(seed)
    def add(s,x): s.o.append(x)
    def svg(s,ground_y=212):
        p=s.p
        sky=('#1b2433','#3a4660') if s.n else ('#9cc7e4','#dcebf5')
        defs=f'''<defs><linearGradient id="{p}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky[0]}"/><stop offset="1" stop-color="{sky[1]}"/></linearGradient>
<filter id="{p}bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="{p}bl2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
<radialGradient id="{p}gl"><stop offset="0" stop-color="#ffd25a" stop-opacity=".9"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient></defs>'''
        bg=f'<rect width="{W}" height="{H}" fill="url(#{p}sk)"/>'
        if s.n: bg+=''.join(f'<circle cx="{s.r.randint(5,395)}" cy="{s.r.randint(5,90)}" r="0.9" fill="#fff" opacity=".6"/>' for _ in range(18))
        gc='#3d4a3a' if s.n else '#7fa36a'
        bg+=f'<rect y="{ground_y}" width="{W}" height="{H-ground_y}" fill="{gc}"/><rect y="{H-26}" width="{W}" height="26" fill="{"#2a2d31" if s.n else "#55595e"}"/>'
        bg+=''.join(f'<rect x="{x}" y="{H-14}" width="18" height="2.5" fill="#e8d36a" opacity=".8"/>' for x in range(8,400,40))
        return f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img">{defs}{bg}{"".join(s.o)}</svg>'
    def rect(s,x,y,w,h,fill,stroke='#222',sw=1.2,extra=''): s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>')
    def poly(s,pts,fill,stroke='#222',sw=1.2): s.add(f'<polygon points="{" ".join(f"{a},{b}" for a,b in pts)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
    def text(s,x,y,t,size=9,fill='#fff',weight=700): s.add(f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="middle">{t}</text>')
    def window(s,x,y,w,h,state='ok'):
        lit=s.n and state=='ok' and s.r.random()<.35
        f={'ok':('#f3d98a' if lit else ('#2c3a4a' if s.n else '#8fb3cc')),'smoke':'#3b3b3b','fire':'#ff8a1c','dark':'#1b1b1b'}[state]
        s.rect(x,y,w,h,f,'#e9e4da' if not s.n else '#9a958c',2)
        if state=='ok' and not lit: s.add(f'<line x1="{x+w/2}" y1="{y}" x2="{x+w/2}" y2="{y+h}" stroke="#e9e4da" stroke-width="1" opacity=".7"/>')
        if state=='fire':
            s.add(f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w*1.4}" ry="{h*1.2}" fill="url(#{s.p}gl)"/>')
            s.flame(x+w/2,y+3,w*0.9,h*0.9+10)
        if state in('smoke','fire'): s.smoke(x+w/2,y-2,0.6 if state=='smoke' else 0.8,'#2a2a2a' if state=='fire' else '#555')
    def flame(s,cx,base,w,h):
        r=s.r
        for k,col in enumerate(['#ff5a00','#ff9a1a','#ffd84a']):
            ww=w*(1-k*.28); hh=h*(1-k*.25)
            pts=[(cx-ww/2,base)]
            n=5
            for i in range(n):
                xi=cx-ww/2+ww*(i+.5)/n; pts.append((xi+r.uniform(-2,2),base-hh*r.uniform(.6,1)))
                pts.append((cx-ww/2+ww*(i+1)/n,base-hh*r.uniform(.15,.35)))
            pts[-1]=(cx+ww/2,base)
            s.add(f'<path d="M{pts[0][0]:.1f},{pts[0][1]:.1f} '+' '.join(f'Q{(a+b)/2:.1f},{c:.1f} {b:.1f},{d:.1f}' for (a,c),(b,d) in zip(pts,pts[1:]))+f' Z" fill="{col}" opacity=".95"/>')
    def smoke(s,x,y,scale,color,drift=1.0,n=9,opacity=.85):
        r=s.r; out=[]
        for i in range(n):
            t=i/n
            cx=x+drift*t*90*scale+r.uniform(-6,6); cy=y-t*150*scale-r.uniform(0,8)
            rad=(8+t*30)*scale+r.uniform(0,4)
            out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rad:.1f}" fill="{color}" opacity="{opacity*(1-t*.55):.2f}"/>')
        s.add(f'<g filter="url(#{s.p}bl)">{"".join(out)}</g>')
    def door(s,x,y,w,h,c='#6b4a2f'): s.rect(x,y,w,h,c,'#222',1.2); s.add(f'<circle cx="{x+w-4}" cy="{y+h/2}" r="1.2" fill="#ddd"/>')
    def tree(s,x,y,sz=1):
        s.rect(x-2*sz,y-18*sz,4*sz,18*sz,'#5a3d25','none',0)
        s.add(f'<circle cx="{x}" cy="{y-26*sz}" r="{13*sz}" fill="{"#23361f" if s.n else "#3f6e34"}"/>')
    def car(s,x,y,c='#a33'):
        s.rect(x,y-10,40,10,c,'#222',1,'rx="3"'); s.rect(x+8,y-17,22,8,c,'#222',1,'rx="3"')
        s.add(f'<circle cx="{x+9}" cy="{y}" r="4" fill="#111"/><circle cx="{x+31}" cy="{y}" r="4" fill="#111"/>')

def gable(d,x,y,w,h,roof,over=8,rh=34):
    d.poly([(x-over,y),(x+w/2,y-rh),(x+w+over,y)],roof)

scenes=[]
def add(id,kind,title,info,d,irr,notes,ask):
    scenes.append(dict(id=id,kind=kind,title=title,info=info,svg=d.svg(),irr=irr,notes=notes,ask=ask))

# 1 small ranch, light smoke from eaves
d=D('h1',seed=11)
d.tree(40,212,1.2); d.tree(360,212,1)
d.rect(90,150,220,62,'#d9c7a3'); d.smoke(200,138,.55,'#9a9a9a',1,10,.6); d.smoke(130,140,.4,'#a3a3a3',.8,7,.5); d.smoke(270,140,.4,'#a3a3a3',1.2,7,.5)
d.poly([(80,150),(120,118),(280,118),(320,150)],'#5b4a3f')
d.window(110,165,34,26); d.window(250,165,34,26); d.door(186,170,26,42)
d.rect(150,212,100,3,'#bbb','none',0)
add('house-1','house','Smoke from the eaves','Dispatched 1:40 pm: smell of smoke, caller outside. 1418 Pecan St.',d,
 'Westcom, Engine 1 on location of a small one-story single-family residence with light smoke showing from the eaves. Engine 1 is going offensive, investigating with a line. Captain Engine 1 will be Pecan Street Command in investigative mode. Continue all units.',
 ['Light smoke from the eaves with clear windows points to the attic. Bring a hook and check the ceiling early.','Caller is outside: confirm everyone is out before you commit to a search.','Small one-story ranch: one line, 1-3/4", is usually enough.'],
 'Light smoke only. Where do you think the fire is?')

# 2 two-story, fire 2nd floor side A, night
d=D('h2',night=True,seed=22)
d.tree(55,212,1.3)
d.rect(110,110,180,102,'#c9b8a0'); gable(d,110,110,180,0,'#3f3530',10,40)
d.window(128,124,30,26); d.window(185,124,30,26,'fire'); d.window(242,124,30,26,'smoke')
d.window(128,170,30,26); d.window(242,170,30,26); d.door(188,170,24,42)
d.car(300,212,'#2f5d8a'); d.smoke(200,95,1.0,'#202020',1.2,11,.9)
add('house-2','house','Fire showing, second floor','Dispatched 2:15 am: house fire, unknown if occupied. 907 Main St.',d,
 'Westcom, Engine 1 on location of a medium two-story single-family residence with fire showing from the second floor, side Alpha. Engine 1 is going offensive, pulling a 1-3/4" line to the second floor. Captain Engine 1 will be Main Street Command in fast-attack mode. Continue all units. Engine 2, establish water supply.',
 ['2 am with a car in the driveway: assume people are inside, likely in the bedrooms upstairs.','Fire in one room with smoke in the next: get water between the fire and the bedrooms.','Next-in companies: water supply and primary search on the second floor.'],
 'Night call, car in the driveway. What does that tell you about occupants?')

# 3 attached garage, fire through garage roof
d=D('h3',seed=33)
d.tree(30,212,1)
d.rect(80,150,170,62,'#e1d5bd'); d.poly([(72,150),(105,120),(225,120),(258,150)],'#6a5a4a')
d.window(98,165,32,26); d.window(150,165,32,26); d.door(200,170,24,42)
d.rect(250,140,100,72,'#e1d5bd'); d.poly([(244,140),(300,108),(356,140)],'#6a5a4a')
d.rect(262,165,76,47,'#cfc6b4'); [d.add(f'<line x1="262" y1="{y}" x2="338" y2="{y}" stroke="#999"/>') for y in range(172,212,8)]
d.add('<ellipse cx="300" cy="125" rx="60" ry="30" fill="url(#h3gl)"/>'); d.flame(300,132,70,45); d.smoke(300,95,1.05,'#1c1c1c',1.1,11,.9)
add('house-3','house','Attached garage','Dispatched 4:50 pm: garage on fire, family is out. 2210 Cedar Ln.',d,
 'Westcom, Engine 1 on location of a medium one-story single-family residence with fire showing through the roof of the attached garage, side Bravo. Engine 1 is going offensive, pulling a 1-3/4" line through the front door to protect the interior from the garage. Captain Engine 1 will be Cedar Lane Command in fast-attack mode. Continue all units. Engine 2, establish water supply.',
 ['Fire through the garage roof: the attic over the garage often connects to the house attic.','Protect the house first. Get a line to the door between the garage and the living space.','Expect cars, fuel and chemicals in the garage. Watch the overhead door and roof.'],
 'Fire is in the garage. Where does your first line go?')

# 4 garden apartment, second floor unit smoke
d=D('a1',seed=44)
d.rect(30,120,340,92,'#c4a98a'); d.rect(22,112,356,10,'#4f4640')
for i,x in enumerate([45,105,165,235,295]):
    if x==165: continue
    d.window(x,132,34,24,'smoke' if x==105 else 'ok'); d.window(x,178,34,24)
d.rect(176,124,48,88,'#8d7a66'); d.text(200,140,'BLDG C',8,'#fff')
for y in range(150,212,8): d.add(f'<line x1="180" y1="{y}" x2="220" y2="{y-8}" stroke="#555" stroke-width="2"/>')
d.door(110,186,20,26,'#4a5f73'); d.smoke(122,110,.75,'#3a3a3a',1,10,.85); d.car(330,232,'#777')
add('apt-1','apt','Garden apartment, second floor','Dispatched 6:30 pm: smoke in the hallway, Bldg C. 515 Ridge Rd.',d,
 'Westcom, Engine 1 on location of a large two-story multi-family apartment building with heavy smoke showing from a second-floor unit, side Alpha. Engine 1 is going offensive, pulling a 1-3/4" line up the stairwell to the second floor. Captain Engine 1 will be Ridge Road Command in fast-attack mode. Continue all units and request an additional engine and truck.',
 ['The open stairwell is the only way out for upstairs units. Protect it.','Top-floor unit: check the attic. Many garden apartments share one attic across units.','Lots of occupants means lots of searching. Ask for more help early.'],
 'Many occupants and one stairwell. What do you ask for?')

# 5 three-story, occupant on balcony
d=D('a2',seed=55)
d.rect(60,70,280,142,'#b9a690'); d.rect(52,62,296,10,'#4f4640')
for fl,y in enumerate([84,126,168]):
    for x in [80,150,220,290]:
        st='ok'
        if fl==0 and x==150: st='fire'
        if fl==0 and x==220: st='smoke'
        d.window(x,y,34,26,st)
d.rect(212,110,50,4,'#555','none',0); [d.add(f'<line x1="{x}" y1="110" x2="{x}" y2="98" stroke="#555"/>') for x in range(214,262,6)]
d.add('<circle cx="242" cy="90" r="4" fill="#f1c9a5"/><rect x="238" y="94" width="8" height="12" fill="#c33"/><line x1="246" y1="96" x2="254" y2="86" stroke="#f1c9a5" stroke-width="2.5"/>')
d.smoke(170,60,1.1,'#1f1f1f',1.1,11,.9)
add('apt-2','apt','Third floor, person on balcony','Dispatched 9:05 am: fire on the third floor, people trapped. 1200 Elm St, 3-story apartments.',d,
 'Westcom, Engine 1 on location of a large three-story multi-family apartment building with fire showing from the third floor, side Alpha, and an occupant on a third-floor balcony. Engine 1 is going offensive, rescue is our first priority. Captain Engine 1 will be Elm Street Command in fast-attack mode. Request a second alarm. Truck 1, ladder the third-floor balcony on side Alpha.',
 ['A visible victim comes first. Say it on the radio so every company hears it.','Fire on the top floor goes into the attic fast. Plan on pulling ceilings.','A 3-story building with a known rescue: a second alarm is reasonable from the start.'],
 'You can see someone trapped. What comes first?')

# 6 garden apartment, fire through roof
d=D('a3',seed=66)
d.rect(30,125,340,87,'#cbb59a'); d.poly([(20,125),(70,95),(330,95),(380,125)],'#4c4038')
for x in [45,105,245,305]:
    d.window(x,140,32,22,'smoke' if x in(105,245) else 'ok'); d.window(x,180,32,22)
d.rect(170,128,60,84,'#8d7a66')
d.add('<ellipse cx="200" cy="95" rx="70" ry="30" fill="url(#a3gl)"/>'); d.flame(200,100,90,50); d.flame(150,104,40,24)
d.smoke(200,70,1.2,'#1c1c1c',1.0,12,.92)
add('apt-3','apt','Fire through the roof','Dispatched 3:20 pm: apartment fire, multiple calls. 88 Lakeview Dr.',d,
 'Westcom, Engine 1 on location of a large two-story multi-family apartment building with fire through the roof, center of the building. Engine 1 is going offensive, pulling a 1-3/4" line to the second floor to get ahead of the attic fire. Captain Engine 1 will be Lakeview Drive Command in fast-attack mode. Request a second alarm. Engine 2, establish water supply.',
 ['Fire through the roof of a garden apartment means a big attic fire that will travel both ways.','Get ahead of it: pull ceilings in the units next to the fire, not under it.','Set a trigger to go defensive, like fire through the roof at both ends or a sagging roof line.'],
 'The roof is already burning. Offensive or defensive, and what would change your mind?')

# 7 strip mall
d=D('c1',seed=77)
d.rect(20,130,360,82,'#c9bfae'); d.rect(16,122,368,12,'#7a6e60')
names=['DONUTS','TAX','NAILS','PHONES','PIZZA']
for i,nm in enumerate(names):
    x=24+i*72
    d.rect(x,138,64,12,'#2b4b6b' if i!=2 else '#333','none',0); d.text(x+32,147,nm,8)
    d.rect(x+4,156,56,50,'#9ab7c9' if i!=2 else '#2e2e2e','#555',1.5)
    if i==2: d.smoke(x+32,154,.55,'#333',1,8,.8)
d.smoke(168,118,.95,'#2a2a2a',1.1,11,.88); d.car(40,232,'#2f6f4a'); d.car(300,232,'#888')
add('com-1','commercial','Strip mall, middle unit','Dispatched 10:10 pm: smoke from the nail salon, businesses closed. 3300 Hwy 6.',d,
 'Westcom, Engine 1 on location of a large one-story commercial strip mall with heavy smoke showing from the middle unit, side Alpha. Engine 1 is going offensive, pulling a 2-1/2" line through the front of the nail salon. Captain Engine 1 will be Highway 6 Command in fast-attack mode. Request a second alarm. Truck 1, forcible entry and check the exposures on both sides.',
 ['Strip malls often share one open cockloft. Check the units on both sides early.','Closed businesses mean forcible entry, front and rear. Assign it.','Lightweight truss roofs fail fast. Watch the roof line over the fire unit.'],
 'Which units are exposures, and how do you check them?')

# 8 warehouse
d=D('c2',seed=88)
d.rect(30,120,340,92,'#a9b2b8'); d.poly([(26,120),(200,104),(374,120)],'#7d868c')
for x in range(34,370,10): d.add(f'<line x1="{x}" y1="122" x2="{x}" y2="212" stroke="#98a1a7" stroke-width="1"/>')
for x in [60,140,220]: d.rect(x,150,56,62,'#6e777d','#333',1.5)
d.rect(232,175,32,37,'#222','none',0); d.smoke(248,170,.7,'#1a1a1a',1,9,.9)
d.door(310,180,22,32,'#556'); d.text(200,140,'SUPPLY CO.',10,'#2b3a46')
d.smoke(150,100,1.1,'#151515',1.2,12,.92); d.smoke(260,100,1.0,'#1e1e1e',1.0,11,.9)
add('com-2','commercial','Metal warehouse','Dispatched 5:45 am: smoke from a warehouse, no one on site. 4100 Industrial Blvd.',d,
 'Westcom, Engine 1 on location of a large one-story commercial metal warehouse with heavy black smoke showing from the roof and the open bay door, side Alpha. Engine 1 is investigating and establishing water supply, pulling a 2-1/2" line to side Alpha. Captain Engine 1 will be Industrial Boulevard Command in investigative mode. Request a second alarm and the closest truck.',
 ['Big open box, high fire load, unknown contents. Find out what is stored inside before going deep.','Thick, fast black smoke from the roof means a lot of fire. Unprotected steel roofs can fail early.','Nobody on site: the life hazard is mostly your own crews. Weigh that when you pick a strategy.'],
 'No one is inside. How does that change your risk?')

# 9 restaurant
d=D('c3',seed=99)
d.tree(30,212,1)
d.rect(90,140,220,72,'#d8b48a'); d.rect(84,132,232,10,'#5b3a29')
d.rect(105,155,70,45,'#9ab7c9','#555',1.5); d.rect(225,155,70,45,'#9ab7c9','#555',1.5); d.door(186,165,28,47,'#5b3a29')
d.rect(130,145,140,10,'#7a2a1f','none',0); d.text(200,153,'TEX-MEX DINER',8)
d.rect(250,112,24,20,'#777','#333',1); d.add('<ellipse cx="262" cy="108" rx="26" ry="16" fill="url(#c3gl)"/>'); d.flame(262,114,26,30)
d.smoke(262,92,.9,'#262626',1.1,10,.88); d.smoke(200,160,.35,'#777',.6,6,.5)
d.car(30,232,'#a33'); d.car(320,232,'#335')
add('com-3','commercial','Restaurant kitchen hood','Dispatched 12:20 pm: fire in the kitchen, restaurant open. 650 Market St.',d,
 'Westcom, Engine 1 on location of a medium one-story commercial restaurant with fire showing from the roof exhaust duct and light smoke from the front door, side Alpha. Engine 1 is going offensive, pulling a 1-3/4" line to the kitchen. Captain Engine 1 will be Market Street Command in fast-attack mode. Continue all units. Truck 1, roof to check the duct and exhaust fan.',
 ['Fire from the exhaust duct usually starts in the hood and grease duct. Make sure the hood suppression has gone off.','Shut off the gas to the cooking line.','Lunchtime with an open restaurant: confirm everyone is out and do a quick search.'],
 'Where did this fire most likely start, and what do you shut off?')

json.dump(scenes,open('/tmp/claude-0/-home-claude/42084d97-d34b-56f5-9d5e-12fbfa496c41/scratchpad/practice/scenes.json','w'))
html='<html><body style="margin:0;display:grid;grid-template-columns:repeat(3,400px);gap:6px;background:#888">'+''.join(f'<div>{s["svg"]}</div>' for s in scenes)+'</body></html>'
open('/tmp/claude-0/-home-claude/42084d97-d34b-56f5-9d5e-12fbfa496c41/scratchpad/practice/preview.html','w').write(html)
print(len(scenes), sum(len(s['svg']) for s in scenes))
