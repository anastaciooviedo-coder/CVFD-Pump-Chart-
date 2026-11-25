import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from r360 import Scene, GY, VW

OUT = []

def scenario(sid, kind, title, info, ask, irr, followup, sides, notes, b, draw, night=False, dusk=False, seed=1):
    svgs = {}
    for side in 'ABCD':
        sc = Scene(sid, side, b, night=night, dusk=dusk, seed=seed)
        sc.build_pre = None
        draw(sc, side)
        svgs[side] = sc.svg()
    OUT.append(dict(id=sid, kind=kind, title=title, info=info, ask=ask, irr=irr, followup=followup, sidenotes=sides, notes=notes, svgs=svgs))

# ---------------------------------------------------------------- H1
def h1(s, side):
    s.build()
    if side == 'A':
        s.street(); s.driveway(s.x0 + s.W * .72, 150)
        s.window(.14, 0); s.window(.32, 0); s.window(.5, 0, kind='door', wft=3.2, hft=7, sill=0)
        s.window(.64, 0, wft=5, hft=4.6); s.window(.86, 0, kind='garage', wft=16, hft=7.5, sill=0)
        s.shrubs(s.x0 + 20, s.x0 + s.W * .45)
        s.eave_smoke(.6, '#a29e98', .5, (0, .6)); s.ridge_smoke(.35, '#8b8781', .45, (.15, .4))
        s.tree(140, 1.1, front=True); s.hydrant(1080); s.car(s.x0 + s.W * .73, '#6e7378')
    if side == 'B':
        s.window(.3, 0); s.window(.7, 0); s.ac(.5); s.gable_vent('smoke'); s.fence(s.x0 + s.W * .9, VW - 40, 6)
        s.tree(1040, 1.2)
    if side == 'C':
        s.patio(s.x0 + s.W * .55, s.x0 + s.W * .95)
        s.window(.12, 0, 'fire'); s.window(.3, 0, 'heavy'); s.window(.5, 0, 'smoke', kind='slider', wft=8, hft=7, sill=0)
        s.window(.75, 0, wft=8, hft=7, sill=0, kind='slider'); s.window(.92, 0)
        s.ridge_smoke(.9, '#3a3733', .75, (.1, .4)); s.grill(s.x0 + s.W * .66)
        s.fence(40, s.x0 - 60, 6); s.fence(s.x0 + s.W + 60, VW - 40, 6)
    if side == 'D':
        s.window(.25, 0); s.window(.72, 0, 'heavy'); s.meter(.45); s.meter(.55, 'gas'); s.service_drop(.47, from_left=False)
        s.gable_vent('heavy'); s.fence(40, s.x0 + s.W * .15, 6)
        s.front.append(f'<rect x="{s.x0+s.W*.08:.1f}" y="{GY-150}" width="70" height="40" fill="#fff"/><text x="{s.x0+s.W*.08+35:.1f}" y="{GY-124}" font-family="Arial" font-weight="700" font-size="15" fill="#b3121f" text-anchor="middle">BEWARE DOG</text>')

scenario('r-house-1', 'house', 'Ranch house, smoke from the eaves',
 'Dispatched 2:15 pm: smoke coming from a house, caller across the street. 1520 Mesquite Ln.',
 'From the street it looks like light smoke. Walk all four sides before you decide where the fire is.',
 'Westcom, Engine 1 on location of a medium one-story single-family residence with light smoke showing from the eaves and roof. Engine 1 will be investigating with a 1-3/4" line. Captain Engine 1 will be Mesquite Lane Command in fast-attack mode. Continue all units.',
 'Command, 360 complete. Fire showing from a rear bedroom window on Charlie, Charlie/Delta corner, heavy smoke on Delta. No basement. Power and gas meters on Delta. Dog in the Delta yard. No victims seen. Confirming offensive, attack through the front door to the rear bedroom. Engine 2, water supply and secure utilities.',
 {'A': 'Light smoke from the eaves and ridge, and nothing showing in the front windows. Easy to under-call from here.',
  'B': 'Quiet side. The gable vent is pushing a little smoke. AC unit and a fence line.',
  'C': 'Here it is: fire through the bedroom window at the Charlie/Delta corner, heavy smoke next to it. Patio with a propane grill.',
  'D': 'Heavy smoke from the bedroom window and gable vent. Electric and gas meters and the overhead service drop are here. Beware of dog sign.'},
 ['The front view hid a working fire. That is why the 360 matters before you commit.', 'The fire room is at the far rear corner, so the front door gives the longest but protected path. Know your stretch.', 'Utilities and a dog on Delta: assign someone to them.'],
 dict(w=62, d=34, stories=1, roof='gable', mat='brick', wall='#d9d2c3', trim='#f1efe8', roofc='#4a4542', wind='B'), h1, seed=11)


# ---------------------------------------------------------------- H2 walkout basement, night
def h2(s, side):
    s.build()
    if side == 'A':
        s.street(); s.driveway(s.x0 + s.W * .05, 110)
        s.window(.2, 0, 'smoke'); s.window(.5, 0, kind='door', wft=3.2, hft=7, sill=0); s.window(.8, 0, 'smoke')
        s.window(.2, 1); s.window(.5, 1, wft=2.6); s.window(.8, 1)
        s.eave_smoke(.5, '#8f8b85', .45); s.shrubs(s.x0 + s.W * .25, s.x0 + s.W * .45); s.hydrant(1100); s.tree(1050, 1.2, front=True)
        s.car(s.x0 + s.W * .05 - 20, '#2d3a5a')
    if side == 'B':
        s.window(.3, -1, 'glow', wft=4, hft=2.2, sill=1.5); s.smoke_from(s.x0 + s.W * .3, GY - s.fh * .2, 40, .9, '#2b2926', .85)
        s.window(.3, 0, 'smoke'); s.window(.72, 0); s.window(.5, 1); s.gable_vent('smoke'); s.slope('right')
    if side == 'C':
        s.window(.3, -1, 'fire', kind='slider', wft=8, hft=7, sill=0); s.window(.72, -1, 'heavy', wft=4, hft=3)
        s.window(.25, 0, 'heavy'); s.window(.72, 0, 'smoke', kind='slider', wft=7, hft=7, sill=0)
        s.window(.25, 1); s.window(.72, 1, 'person')
        s.front.append(f'<rect x="{s.x0+s.W*.55:.1f}" y="{GY-s.fh-6:.1f}" width="{s.W*.42:.1f}" height="8" fill="#6b5a46"/>' + ''.join(f'<rect x="{s.x0+s.W*.55+k*14:.1f}" y="{GY-s.fh-48:.1f}" width="3" height="44" fill="#6b5a46"/>' for k in range(int(s.W*.42/14)+1)) + f'<rect x="{s.x0+s.W*.55:.1f}" y="{GY-s.fh-50:.1f}" width="{s.W*.42:.1f}" height="5" fill="#6b5a46"/>')
        s.front.append(f'<rect x="{s.x0+s.W*.6:.1f}" y="{GY-s.fh:.1f}" width="8" height="{s.fh:.1f}" fill="#5a4a38"/><rect x="{s.x0+s.W*.92:.1f}" y="{GY-s.fh:.1f}" width="8" height="{s.fh:.1f}" fill="#5a4a38"/>')
        s.tree(90, 1.3); s.tree(1120, 1.1)
    if side == 'D':
        s.window(.7, -1, 'heavy', wft=4, hft=2.2, sill=1.5); s.meter(.4, 'gas'); s.ac(.25)
        s.window(.3, 0); s.window(.7, 0, 'smoke'); s.window(.5, 1); s.gable_vent('ok'); s.slope('left')

scenario('r-house-2', 'house', 'Night fire, walkout basement',
 'Dispatched 11:40 pm: smoke alarm and smoke in the house. Caller says the family is out. 905 Ridgeview Ct.',
 'Two stories from the street. How many on the back, and where is the fire?',
 'Westcom, Engine 1 on location of a medium two-story single-family residence with light smoke showing from the first floor and eaves. Engine 1 will be investigating with a 1-3/4" line. Captain Engine 1 will be Ridgeview Court Command in fast-attack mode. Continue all units.',
 'Command, 360 complete. Walkout basement on Charlie, three stories in the rear. Fire in the basement at the Charlie slider. Possible victim at a second-floor window, Charlie/Bravo side. Confirming offensive. Engine 1 is going in through the Charlie slider at basement level to attack. Truck 1, primary search second floor, ground ladder to the Charlie window. Engine 2, water supply. Request an additional engine for RIT.',
 {'A': 'Two stories, light smoke from the first floor and the eaves. Nothing tells you the fire is below you.',
  'B': 'The grade drops toward Charlie. A basement window is glowing and pushing dark smoke.',
  'C': 'Three stories here. Basement slider is full of fire, and someone is at a second-floor window above the deck.',
  'D': 'Smoke from the basement window. Gas meter at basement level.'},
 ['The caller said everyone is out. The 360 found someone at a window. Never take "all out" as fact until it is confirmed.', 'Fire below you: do not send a crew across the first floor above a basement fire. Attack from the walkout.', 'Report the building as three stories on Charlie so everyone uses the same floor numbers.'],
 dict(w=46, d=36, stories=2, roof='gable', mat='siding', wall='#c9c2b0', trim='#f1efe8', roofc='#3f3b38', walkout={'B': 1, 'C': 1, 'D': 1}, wind='D'), h2, night=True, seed=22)

# ---------------------------------------------------------------- H3 attached garage
def h3(s, side):
    s.build()
    if side == 'A':
        s.street(); s.driveway(s.x0 + s.W * .73, 190)
        s.window(.1, 0); s.window(.26, 0); s.window(.4, 0, kind='door', wft=3.2, hft=7, sill=0); s.window(.54, 0)
        s.window(.82, 0, 'heavy', kind='garage', wft=18, hft=7.5, sill=0)
        s.eave_smoke(.8, '#55524e', .6, (.65, 1)); s.ridge_smoke(.6, '#3f3c39', .7, (.75, .95))
        s.car(s.x0 + s.W * .76, '#7a1a1a'); s.neighbor(left=False, gap=70); s.shrubs(s.x0 + 10, s.x0 + s.W * .35)
    if side == 'B':
        s.window(.3, 0); s.window(.7, 0); s.gable_vent('ok'); s.tree(150, 1.3); s.ac(.5)
    if side == 'C':
        s.window(.13, 0, 'fire', kind='door', wft=3, hft=7, sill=0); s.window(.32, 0, 'heavy'); s.window(.55, 0, 'smoke', kind='slider', wft=7, hft=7, sill=0); s.window(.8, 0)
        s.ridge_smoke(.9, '#2f2c29', .8, (.1, .35)); s.fence(30, s.x0 - 40, 6); s.fence(s.x0 + s.W + 40, VW - 30, 6)
    if side == 'D':
        s.window(.5, 0, 'fire', wft=3, hft=3, sill=4); s.gable_vent('heavy'); s.service_drop(.35, from_left=True); s.meter(.3)
        s.propane(s.x0 + s.W * .85, big=False)

scenario('r-house-3', 'house', 'Attached garage fire',
 'Dispatched 4:50 pm: garage on fire, owner says a car is inside. 2210 Cedar Ridge Dr.',
 'The garage is on the Delta end. What is between the garage and the living space?',
 'Westcom, Engine 1 on location of a medium one-story single-family residence with heavy smoke showing from the attached garage, Alpha/Delta corner. Engine 1 is going offensive, pulling a 1-3/4" line to the garage. Captain Engine 1 will be Cedar Ridge Command in fast-attack mode. Continue all units. Engine 2, establish water supply and check the Delta exposure.',
 'Command, 360 complete. Fire through the garage side door on Charlie and the garage window on Delta. Smoke now in the house on Charlie. No basement. Propane cylinders and the electric meter on Delta. Confirming offensive. Line two into the house through the front door to hold the fire at the garage wall. Truck 1, primary search and utilities.',
 {'A': 'Smoke seeping around the garage door and from the eaves on the garage end. Neighbor house is close on Delta.',
  'B': 'Clear. The far end of the house is your best spot to check that the living space is still clean.',
  'C': 'Fire out the garage service door, and smoke now showing from the rear rooms of the house. It is getting in.',
  'D': 'Fire from the garage window, smoke from the gable. Propane cylinders and the electric service on this wall.'},
 ['Garage fires spread into the attic and the house fast. Get a second line between the fire and the living space.', 'Cars, gas cans and propane: expect a fast, hot fire and possible container failure.', 'The Delta exposure is close. Assign someone to check it.'],
 dict(w=74, d=34, stories=1, roof='gable', mat='siding', wall='#d6cfbf', trim='#f6f4ee', roofc='#55504b', wind='C'), h3, seed=33)

# ---------------------------------------------------------------- A1 garden apartments, balcony on C
def a1(s, side):
    s.build()
    if side == 'A':
        s.parking(); s.stair_opening(.3); s.stair_opening(.7)
        for f in range(3):
            for xf in (.08, .18, .42, .58, .82, .92): s.window(xf, f, 'ok', wft=3.6)
        s.eave_smoke(.5, '#8f8b85', .5, (.45, .8)); s.car(120, '#5a6470'); s.car(880, '#e5e2da')
    if side == 'B':
        for f in range(3):
            s.window(.25, f, 'person' if f == 2 else 'ok'); s.window(.75, f)
        s.gable_vent('smoke'); s.tree(150, 1.2)
    if side == 'C':
        for f in range(3):
            for xf in (.12, .38, .62, .88): s.window(xf - .05, f, 'ok', kind='slider', wft=6, hft=7, sill=0)
        for f in range(1, 3):
            for xf in (.12, .38, .62, .88):
                st = 'fire' if (xf == .38 and f == 1) else ('stuff' if xf in (.12, .88) else 'ok')
                s.balcony(xf, f, 12, st)
        s.window(.33, 2, 'heavy', kind='slider', wft=6, hft=7, sill=0)
        s.balcony(.12, 0, 12, 'stuff'); s.balcony(.62, 0, 12, 'stuff')
        s.eave_smoke(.9, '#3f3c39', .7, (.25, .5))
    if side == 'D':
        for f in range(3): s.window(.25, f); s.window(.75, f)
        s.gable_vent('ok'); s.dumpster(s.x0 + s.W + 40)

scenario('r-apt-1', 'apt', 'Garden apartments, fire on the back balconies',
 'Dispatched 7:20 pm: fire on a patio, Bldg 6. Several callers. 3100 Oak Hollow Apts.',
 'Your front view shows a little smoke. What is happening on the back, and who is trapped?',
 'Westcom, Engine 1 on location of a large three-story multi-family apartment building with light smoke showing from the roof, Alpha side. Engine 1 is going offensive, pulling a 1-3/4" line up the Bravo stairwell. Captain Engine 1 will be Oak Hollow Command in fast-attack mode. Request a second alarm. Engine 2, establish water supply.',
 'Command, 360 complete. Fire on a second-floor balcony on Charlie extending to the third-floor unit and the eaves. One victim at a third-floor window on Bravo. No basement. Confirming offensive. Engine 1 to the second-floor unit through the Bravo stair. Truck 1, ladder the Bravo window for rescue. Engine 2, line to the third floor above the fire. Request EMS.',
 {'A': 'Two breezeway stairs, light smoke from the eaves over the middle of the building. Nothing showing in the front windows.',
  'B': 'Someone at a third-floor window, waving. Smoke from the gable vent: the attic is involved.',
  'C': 'Balcony fire on the second floor, already into the third-floor unit and toward the eaves.',
  'D': 'Clear end wall. Dumpster and parking. Good place to stage.'},
 ['Balcony fires on the back are common and invisible from the front. The 360 found the fire and a victim.', 'Rescue comes first: a ground ladder to the Bravo window is the fastest way out.', 'Fire going up the outside will get into the attic. Check above early.'],
 dict(w=130, d=42, stories=3, roof='gable', mat='siding', wall='#cfc6b2', trim='#f1efe8', roofc='#3f3b38', bands='#a39a86', wind='D'), a1, dusk=True, seed=44)

# ---------------------------------------------------------------- A2 attic fire, night
def a2(s, side):
    s.build()
    if side == 'A':
        s.parking()
        for f in range(2):
            for xf in (.08, .2, .35, .5, .65, .8, .92):
                st = 'fire' if (f == 1 and xf == .65) else ('smoke' if (f == 1 and xf in (.5, .8)) else 'ok')
                s.window(xf, f, st, wft=3.4)
        s.ridge_smoke(1.1, '#2b2926', .85, (.35, .9)); s.eave_smoke(.9, '#4a4743', .7, (.3, 1))
        s.car(200, '#3a3f45')
    if side == 'B':
        s.window(.3, 0); s.window(.7, 0); s.window(.3, 1); s.window(.7, 1, 'smoke'); s.gable_vent('heavy')
    if side == 'C':
        for f in range(2):
            for xf in (.12, .38, .62, .88): s.window(xf, f, 'person' if (f == 1 and xf == .38) else ('smoke' if f == 1 else 'ok'), kind='slider', wft=6, hft=7, sill=0)
        for xf in (.12, .62, .88): s.balcony(xf, 1, 12, 'stuff' if xf == .88 else 'ok')
        s.eave_smoke(1.0, '#3a3733', .75, (0, .8)); s.ridge_smoke(1.0, '#2b2926', .85, (.1, .6))
    if side == 'D':
        s.window(.3, 0); s.window(.7, 0); s.window(.3, 1, 'smoke'); s.window(.7, 1); s.gable_vent('fire')

scenario('r-apt-2', 'apt', 'Two-story apartments, fire in the attic',
 'Dispatched 2:05 am: fire alarm and smoke, Bldg C. 1450 Wilshire Commons.',
 'Smoke from the whole ridge at 2 am. Where is the fire, and how many people are still inside?',
 'Westcom, Engine 1 on location of a large two-story multi-family apartment building with fire showing from a second-floor window and heavy smoke from the roof, Alpha side. Engine 1 is going offensive, pulling a 1-3/4" line to the second floor. Captain Engine 1 will be Wilshire Command in fast-attack mode. Request a second alarm. Engine 2, establish water supply.',
 'Command, 360 complete. Fire in the attic, venting from the Delta gable. Heavy smoke from the eaves across Charlie. Occupant at a second-floor slider on Charlie. No basement. Confirming offensive. Engine 1 hits the second-floor unit and pulls ceilings. Truck 1, ladder and remove the Charlie occupant, then search second floor. Second alarm companies to check the attic and get ahead of it toward Bravo.',
 {'A': 'Fire in one second-floor window, heavy smoke along the ridge and eaves. That is an attic fire.',
  'B': 'Heavy smoke pushing from the gable vent. The fire is traveling this way in the attic.',
  'C': 'Smoke across the whole back eave, and someone at a second-floor slider.',
  'D': 'Fire venting from the gable. The attic is fully involved at this end.'},
 ['At 2 am expect everyone to be home and asleep. Search is a top priority.', 'An open attic over many units lets fire run the length of the building. Get ahead of it.', 'Watch for roof collapse with heavy fire in a truss attic. Keep crews out from under a burning roof.'],
 dict(w=110, d=36, stories=2, roof='gable', mat='siding', wall='#bfb7a5', trim='#e9e7df', roofc='#3a3633', bands='#8f8775', wind='B'), a2, night=True, seed=55)

# ---------------------------------------------------------------- A3 laundry room, ground floor, B end
def a3(s, side):
    s.build()
    if side == 'A':
        s.parking(); s.stair_opening(.5)
        for f in range(3):
            for xf in (.08, .22, .36, .64, .78, .92):
                s.window(xf, f, 'heavy' if (f == 0 and xf == .08) else 'ok', wft=3.6)
        s.car(500, '#2f4a6a'); s.car(780, '#8a8f94')
    if side == 'B':
        s.window(.8, 0, 'fire', wft=4.4); s.window(.4, 0)
        s.window(.8, 1, 'smoke'); s.window(.4, 1); s.window(.8, 2, 'person'); s.window(.4, 2)
        s.gable_vent('ok'); s.tree(1080, 1.1)
    if side == 'C':
        for f in range(3):
            for xf in (.15, .4, .65, .9): s.window(xf, f, 'smoke' if (f == 0 and xf == .9) else 'ok', kind='slider', wft=6, hft=7, sill=0)
        for f in range(1, 3):
            for xf in (.15, .4, .65, .9): s.balcony(xf, f, 12, 'stuff' if (xf + f) % .5 < .2 else 'ok')
    if side == 'D':
        for f in range(3): s.window(.3, f); s.window(.7, f)
        s.gable_vent('ok'); s.dumpster(s.x0 - 160); s.parking()

scenario('r-apt-3', 'apt', 'Ground-floor fire, end unit',
 'Dispatched 9:15 am: smoke from a first-floor apartment, Bldg 2. 640 Meadow Park Apts.',
 'The fire is on the first floor. Who is above it?',
 'Westcom, Engine 1 on location of a large three-story multi-family apartment building with heavy smoke showing from a first-floor unit, Alpha/Bravo corner. Engine 1 is going offensive, pulling a 1-3/4" line to the first-floor unit. Captain Engine 1 will be Meadow Park Command in fast-attack mode. Continue all units. Engine 2, establish water supply.',
 'Command, 360 complete. Fire through a first-floor window on Bravo, smoke extending into the second-floor unit above. Occupant at a third-floor window on Bravo. No basement. Confirming offensive. Engine 1 attacks the first-floor unit. Truck 1, ladder the Bravo window and search the floors above. Engine 2, line to the second floor.',
 {'A': 'Heavy smoke from the first-floor window at the Bravo end. Center breezeway stair.',
  'B': 'Fire out the first-floor window. Smoke in the unit above, and a person at the third-floor window.',
  'C': 'Smoke at the first-floor slider on the Bravo end. Balconies above with furniture and grills.',
  'D': 'Clear. Parking and a dumpster. Good place for the second-due units.'},
 ['Fire on the first floor puts everyone above it at risk. Search above the fire right away.', 'Smoke and heat ride up the outside wall into the units above. Check the second floor early.', 'The center stair is the only interior way up. Keep it clear of smoke with door control.'],
 dict(w=120, d=40, stories=3, roof='gable', mat='brick', brick='#8c4632', brick2='#7a3c2a', trim='#ebe8e0', roofc='#3a3633', wind='A'), a3, seed=66)

# ---------------------------------------------------------------- C1 strip center
def c1(s, side):
    s.build()
    if side == 'A':
        s.parking()
        names = [('DONUTS', '#b3121f'), ('PHONE REPAIR', '#1f4fa0'), ('TAX PREP', '#2f6b3a'), ('LAUNDRY', '#5a2f7a'), ('NAILS', '#a01f6a')]
        for i, (nm, c) in enumerate(names):
            xf = .1 + i * .2
            st = 'heavy' if i == 4 else ('smoke' if i == 3 else 'ok')
            s.window(xf - .03, 0, st, kind='store', wft=18, hft=9, sill=0, label=(nm, '#fff'))
            s.window(xf + .07, 0, 'ok' if i < 4 else 'heavy', kind='door', wft=3.4, hft=7.2, sill=0)
        s.rooftop(.9, 'hvac', 'heavy'); s.rooftop(.5, 'hvac')
        s.car(60, '#8a1f1f'); s.car(400, '#e9e6de'); s.car(860, '#40464d')
    if side == 'B':
        s.meter(.3); s.window(.6, 0, 'ok', kind='steel', wft=3.4, hft=7.2, sill=0); s.tree(1100, 1.2)
    if side == 'C':
        for i in range(5):
            xf = .1 + i * .2
            s.window(xf, 0, 'heavy' if i == 0 else 'ok', kind='steel', wft=3.4, hft=7.2, sill=0)
            s.meter(xf + .05, 'gas')
        s.dumpster(s.x0 + s.W * .28); s.dumpster(s.x0 + s.W * .68, '#3a4f7a'); s.rooftop(.1, 'hvac', 'heavy')
        s.add(f'<rect y="{GY+6}" width="{VW}" height="{144}" fill="url(#{s.p}asph)"/>')
    if side == 'D':
        s.window(.35, 0, 'fire', wft=6, hft=4, sill=4); s.window(.75, 0, 'heavy', kind='steel', wft=3.4, hft=7.2, sill=0)
        s.front.append(f'<rect x="{s.x0+s.W+80:.1f}" y="{GY-70}" width="90" height="70" fill="#4f6b4a"/>')
        s.parking()

scenario('r-com-1', 'commercial', 'Strip center, end unit',
 'Dispatched 6:30 pm: smoke in a nail salon, stores open. 7700 FM 1960 shopping center.',
 'Smoke in two storefronts. Which way is the fire going, and how do you get into the rear?',
 'Westcom, Engine 1 on location of a large one-story commercial strip center with heavy smoke showing from the end unit, Alpha/Delta corner, and smoke in the unit next to it. Engine 1 is going offensive, pulling a 2-1/2" line through the front of the fire unit. Captain Engine 1 will be FM 1960 Command in fast-attack mode. Request a second alarm. Engine 2, establish water supply.',
 'Command, 360 complete. Fire through a side window on Delta. Heavy smoke from the fire unit rear door on Charlie and the rooftop unit. Steel rear doors, gas meters on Charlie. No basement. Confirming offensive. Truck 1, force the Charlie door on the fire unit and check the cockloft over the exposure units. Second alarm companies to the Bravo-side exposures.',
 {'A': 'Heavy smoke in the end unit, light smoke in the next store over. Smoke from the rooftop unit: the fire is in the cockloft.',
  'B': 'Clear end wall. Utilities and a rear service door.',
  'C': 'Steel rear doors, one per store, with gas meters. Heavy smoke from the fire unit door. Dumpsters along the wall.',
  'D': 'Fire through the side window and heavy smoke at the side door. Pad-mounted transformer nearby.'},
 ['Strip centers often share one cockloft. Smoke in the next store means it is already spreading.', 'Rear steel doors take time to force. Get a crew and tools to Charlie early.', 'Shut off gas at the meters on Charlie and get the power to the fire unit cut.'],
 dict(w=170, d=60, stories=1, fh=16, roof='flat', mat='brick', brick='#a2765a', brick2='#94694f', parapet=4, parapetc='#a2765a', trim='#3a3d40', wind='B'), c1, seed=77)

# ---------------------------------------------------------------- C2 bowstring warehouse
def c2(s, side):
    s.build()
    if side == 'A':
        s.parking()
        s.window(.25, 0, 'ok', kind='rollup', wft=14, hft=14, sill=0); s.window(.55, 0, 'ok', kind='rollup', wft=14, hft=14, sill=0)
        s.window(.82, 0, 'ok', kind='door', wft=3.4, hft=7.2, sill=0); s.window(.9, 0, 'ok', wft=4, hft=4)
        s.sign('ACE SUPPLY', .5, s.top + 18, '#1f3d6b', '#fff', 30)
        s.ridge_smoke(1.1, '#2b2926', .85, (.0, 1))
    if side == 'B':
        s.placard(.25, 0, '1993', '3'); s.propane(s.x0 + s.W * .55, big=True)
        for xf in (.15, .45, .75): s.rooftop(xf, 'vent', 'heavy')
        s.window(.6, 0, 'ok', kind='steel', wft=3.4, hft=7.2, sill=0)
        s.add(f'<rect y="{GY+6}" width="{VW}" height="{144}" fill="url(#{s.p}asph)"/>')
    if side == 'C':
        s.add(f'<rect y="{GY+6}" width="{VW}" height="{144}" fill="url(#{s.p}asph)"/>')
        s.rect(s.x0, GY - 4 * s.sc, s.W, 4 * s.sc, f'url(#{s.p}conc)')
        s.window(.35, 0, 'fire', kind='rollup', wft=12, hft=12, sill=4); s.window(.65, 0, 'heavy', kind='rollup', wft=12, hft=12, sill=4)
        s.ridge_smoke(1.2, '#1f1d1b', .9, (.2, .8))
    if side == 'D':
        s.service_drop(.6, from_left=False); s.meter(.62)
        s.propane(s.x0 + s.W * .2)
        for xf in (.15, .45, .75): s.rooftop(xf, 'vent', 'heavy')
        s.parking()

scenario('r-com-2', 'commercial', 'Warehouse with a bowstring truss roof',
 'Dispatched 8:10 pm: smoke from a warehouse, closed for the night. 1200 Industrial Blvd.',
 'Look at the roof shape. What does it tell you about how long you can stay inside?',
 'Westcom, Engine 1 on location of a large one-story commercial warehouse with heavy smoke showing from the roof, bowstring truss roof. Engine 1 is going defensive until the 360 is complete. Captain Engine 1 will be Industrial Command. Request a second alarm and a ladder company. Engine 2, establish water supply.',
 'Command, 360 complete. Fire through the rear roll-up door on Charlie, heavy smoke from all roof vents. Placarded tank, UN 1993 flammable liquid, and a large propane tank on Bravo. Propane cylinders and the electric service on Delta. Building closed, no reports of anyone inside. Confirming defensive. Set collapse zones on all sides. Master streams from Alpha and Charlie. Cool the Bravo tank.',
 {'A': 'Arched roof line: a bowstring truss. Heavy smoke from the whole roof. Roll-up doors closed.',
  'B': 'Placard 1993 on the tank, and a large propane tank. Heavy smoke from every roof vent.',
  'C': 'Fire out the rear roll-up door at the loading dock. A lot of fire load inside.',
  'D': 'Power service and a propane cylinder cage. Heavy smoke from the roof vents.'},
 ['Bowstring truss roofs are known for sudden collapse in fire. Plan for it and keep crews out of the collapse zone.', 'A closed building at night with no one inside is a reason to choose the defensive strategy, not take a risk.', 'Look up the placard in the ERG (Guide 128 for UN 1993) and protect the tanks.'],
 dict(w=110, d=200, stories=1, fh=24, roof='bow', mat='panel', wall='#c9ccce', trim='#5b6064', wind='D'), c2, dusk=True, seed=88)

# ---------------------------------------------------------------- C3 restaurant
def c3(s, side):
    s.build()
    if side == 'A':
        s.parking()
        s.window(.2, 0, 'ok', kind='store', wft=14, hft=8, sill=0); s.window(.5, 0, 'smoke', kind='door', wft=6, hft=7.4, sill=0); s.window(.8, 0, 'ok', kind='store', wft=14, hft=8, sill=0)
        s.sign('TEX-MEX DINER', .5, s.top + 8, '#7a2a1f', '#ffe9b0', 34)
        s.rooftop(.75, 'hood', 'fire'); s.rooftop(.3, 'hvac')
        s.car(60, '#b8b4aa'); s.car(900, '#3b5a40')
        for k in range(4): s.front.append(f'<g><circle cx="{700+k*28}" cy="{GY+18}" r="9" fill="#2a211b"/><rect x="{693+k*28}" y="{GY+27}" width="14" height="38" rx="5" fill="{["#4a6fa5","#a54a4a","#5a5a5a","#c9a25a"][k]}"/></g>')
    if side == 'B':
        s.window(.4, 0, 'ok', wft=5, hft=4, sill=3.5, label=('DRIVE-THRU', '#fff')); s.parking(); s.rooftop(.6, 'hood', 'fire')
    if side == 'C':
        s.add(f'<rect y="{GY+6}" width="{VW}" height="{144}" fill="url(#{s.p}asph)"/>')
        s.window(.3, 0, 'smoke', kind='steel', wft=3.4, hft=7.2, sill=0); s.meter(.45, 'gas'); s.meter(.55)
        s.dumpster(s.x0 + s.W * .7); s.front.append(f'<rect x="{s.x0+s.W*.1:.1f}" y="{GY-50}" width="70" height="50" fill="#3d3d3d"/><text x="{s.x0+s.W*.1+35:.1f}" y="{GY-20}" font-family="Arial" font-size="13" font-weight="700" fill="#ddd" text-anchor="middle">GREASE</text>')
        s.rooftop(.25, 'hood', 'fire')
    if side == 'D':
        s.window(.5, 0, 'ok', kind='store', wft=12, hft=8, sill=0); s.patio(s.x0, s.x0 + s.W); s.tables(s.x0 + 40, 3); s.rooftop(.75, 'hood', 'fire')

scenario('r-com-3', 'commercial', 'Restaurant, fire in the exhaust',
 'Dispatched 12:20 pm: fire on the roof of a restaurant, lunch crowd. 650 Market St.',
 'Fire on the roof, light smoke inside. Where did it start, and what do you shut off?',
 'Westcom, Engine 1 on location of a medium one-story commercial restaurant with fire showing from the roof exhaust and light smoke from the front door, Alpha side. Engine 1 is going offensive, pulling a 1-3/4" line to the kitchen. Captain Engine 1 will be Market Street Command in fast-attack mode. Continue all units. Truck 1, to the roof to check the exhaust fan and duct.',
 'Command, 360 complete. Fire limited to the hood exhaust on the roof, light smoke at the kitchen door on Charlie. Gas and electric meters and the grease bin on Charlie. Patio on Delta is clear. No basement. Occupants are out on Alpha. Confirming offensive. Engine 2, shut off the gas at the Charlie meter. Truck 1, open the duct access and check for extension.',
 {'A': 'Fire from the exhaust hood on the roof. Customers are out front. Light smoke at the door.',
  'B': 'Drive-thru window. The roof hood is visible from here.',
  'C': 'Kitchen door with light smoke. Gas and electric meters, grease bin and dumpster.',
  'D': 'Patio seating, clear. Easy access to the roof from this side.'},
 ['Duct fires start at the hood. Make sure the hood suppression system went off.', 'Shut off the gas to the cooking line at the meter on Charlie.', 'Grease ducts can carry fire into the walls and attic. Check along the duct path.'],
 dict(w=64, d=80, stories=1, fh=14, roof='flat', mat='stucco', wall='#d8c7a6', parapet=3.5, parapetc='#c9b48f', trim='#3a3d40', wind='C'), c3, seed=99)
json.dump(OUT, open(os.path.join(os.path.dirname(__file__), 's360.json'), 'w'))
print(len(OUT))
