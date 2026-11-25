"""Realistic-style 360 scene renderer: one building, four elevation views (A, B, C, D).
Outputs SVG strings at 1200x750; render.js turns them into JPGs."""
import random, math

VW, VH = 1200, 750
GY = 610  # ground line at the building face

SIDE_NAMES = {'A': 'ALPHA', 'B': 'BRAVO', 'C': 'CHARLIE', 'D': 'DELTA'}
# wind drift as seen from each side: wind blowing toward side X
def drift_for(view, wind_to):
    order = 'ABCD'
    # from a view, left neighbor and right neighbor (standing outside facing the building)
    left = {'A': 'B', 'B': 'C', 'C': 'D', 'D': 'A'}[view]
    right = {'A': 'D', 'B': 'A', 'C': 'B', 'D': 'C'}[view]
    if wind_to == left: return -1.0
    if wind_to == right: return 1.0
    return 0.15 if wind_to == view else -0.15


class Scene:
    def __init__(s, pid, side, b, night=False, dusk=False, seed=1):
        s.p = pid + side; s.side = side; s.b = b; s.n = night; s.dusk = dusk
        s.r = random.Random(seed * 7 + ord(side))
        s.o = []; s.fxl = []; s.front = []
        s.drift = drift_for(side, b.get('wind', 'D'))

    def add(s, x): s.o.append(x)

    # ---------- defs ----------
    def defs(s):
        p = s.p
        if s.n: sky = ('#0d1420', '#1f2a3d', '#3b3f4f')
        elif s.dusk: sky = ('#3d5a80', '#c98b6b', '#f2c48d')
        else: sky = ('#5f9fd3', '#a9cde9', '#e4eef5')
        return f'''<defs>
<linearGradient id="{p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky[0]}"/><stop offset=".65" stop-color="{sky[1]}"/><stop offset="1" stop-color="{sky[2]}"/></linearGradient>
<filter id="{p}smk" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="4" seed="{s.r.randint(1,999)}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="70" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="5"/></filter>
<filter id="{p}smk2" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="{s.r.randint(1,999)}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="30" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="2.5"/></filter>
<filter id="{p}fl" x="-40%" y="-60%" width="180%" height="200%"><feTurbulence type="turbulence" baseFrequency="0.035 0.08" numOctaves="3" seed="{s.r.randint(1,999)}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="1.4"/></filter>
<filter id="{p}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="{p}blur4"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="{p}grass" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.25" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in" result="m"/><feBlend in="SourceGraphic" in2="m" mode="multiply"/></filter>
<filter id="{p}rough" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="9" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in" result="m"/><feBlend in="SourceGraphic" in2="m" mode="multiply"/></filter>
<radialGradient id="{p}glow"><stop offset="0" stop-color="#ffcf5a" stop-opacity=".95"/><stop offset=".35" stop-color="#ff7a1a" stop-opacity=".55"/><stop offset="1" stop-color="#ff4a00" stop-opacity="0"/></radialGradient>
<radialGradient id="{p}glowbig"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
<linearGradient id="{p}shadeH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<linearGradient id="{p}eaveAO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="{p}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{'#1c2634' if s.n else '#b9d3e6'}"/><stop offset=".45" stop-color="{'#273445' if s.n else '#6d8ea8'}"/><stop offset=".5" stop-color="{'#33445a' if s.n else '#c9dcea'}"/><stop offset="1" stop-color="{'#141c26' if s.n else '#4b6880'}"/></linearGradient>
<linearGradient id="{p}lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#e9a752"/></linearGradient>
<linearGradient id="{p}flg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff0b0"/><stop offset=".25" stop-color="#ffc038"/><stop offset=".6" stop-color="#ff6a10"/><stop offset=".9" stop-color="#c22a05" stop-opacity=".85"/><stop offset="1" stop-color="#7a1a05" stop-opacity="0"/></linearGradient>
<linearGradient id="{p}fireglass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset=".5" stop-color="#ff7a1a"/><stop offset="1" stop-color="#9a2a05"/></linearGradient>
<linearGradient id="{p}smokeglass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1e1e"/><stop offset="1" stop-color="#4a4743"/></linearGradient>
<linearGradient id="{p}lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{'#1f2a1c' if s.n else '#6f8f4e'}"/><stop offset="1" stop-color="{'#2a3826' if s.n else '#4f7336'}"/></linearGradient>
<linearGradient id="{p}asph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{'#1b1d20' if s.n else '#5b5e62'}"/><stop offset="1" stop-color="{'#111214' if s.n else '#3f4245'}"/></linearGradient>
<linearGradient id="{p}conc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{'#4a4a48' if s.n else '#c9c5bb'}"/><stop offset="1" stop-color="{'#3a3a38' if s.n else '#a9a59b'}"/></linearGradient>
<linearGradient id="{p}metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8dadc"/><stop offset=".5" stop-color="#b9bcbf"/><stop offset="1" stop-color="#9ea2a6"/></linearGradient>
<pattern id="{p}siding" width="40" height="9" patternUnits="userSpaceOnUse"><rect width="40" height="9" fill="{s.b.get('wall','#d9d2c3')}"/><rect y="7" width="40" height="2" fill="#000" opacity=".16"/><rect y="0" width="40" height="1" fill="#fff" opacity=".25"/></pattern>
<pattern id="{p}brick" width="24" height="10" patternUnits="userSpaceOnUse"><rect width="24" height="10" fill="#d8d2c6"/><rect x="0.6" y="0.6" width="22.8" height="4" fill="{s.b.get('brick','#9b4a32')}"/><rect x="-11.4" y="5.6" width="22.8" height="4" fill="{s.b.get('brick2','#8a3f2a')}"/><rect x="12.6" y="5.6" width="22.8" height="4" fill="{s.b.get('brick','#9b4a32')}"/></pattern>
<pattern id="{p}stucco" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="{s.b.get('wall','#d9cdb3')}"/></pattern>
<pattern id="{p}panel" width="22" height="40" patternUnits="userSpaceOnUse"><rect width="22" height="40" fill="{s.b.get('wall','#c9ccce')}"/><rect x="0" width="3" height="40" fill="#000" opacity=".18"/><rect x="3" width="2" height="40" fill="#fff" opacity=".3"/><rect x="12" width="2" height="40" fill="#000" opacity=".08"/></pattern>
<pattern id="{p}shingle" width="26" height="12" patternUnits="userSpaceOnUse"><rect width="26" height="12" fill="{s.b.get('roofc','#4a4542')}"/><rect y="10.5" width="26" height="1.5" fill="#000" opacity=".35"/><rect x="0" y="0" width="1.2" height="5.5" fill="#000" opacity=".3"/><rect x="13" y="5.5" width="1.2" height="5.5" fill="#000" opacity=".3"/><rect x="5" y="1" width="6" height="4" fill="#fff" opacity=".05"/></pattern>
<pattern id="{p}garage" width="10" height="26" patternUnits="userSpaceOnUse"><rect width="10" height="26" fill="#ecebe6"/><rect y="24" width="10" height="2" fill="#000" opacity=".18"/></pattern>
<pattern id="{p}rollup" width="10" height="7" patternUnits="userSpaceOnUse"><rect width="10" height="7" fill="#9ea3a8"/><rect y="5.5" width="10" height="1.5" fill="#000" opacity=".25"/></pattern>
<linearGradient id="{p}vign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
</defs>'''

    # ---------- primitives ----------
    def rect(s, x, y, w, h, fill, stroke='none', sw=0, extra=''):
        s.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>')

    def poly(s, pts, fill, stroke='none', sw=0, extra='', to=None):
        el = f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a, b in pts)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'
        (to if to is not None else s.o).append(el)

    # ---------- background ----------
    def background(s):
        p = s.p; o = []
        o.append(f'<rect width="{VW}" height="{VH}" fill="url(#{p}sky)"/>')
        if s.n:
            o += [f'<circle cx="{s.r.randint(5,1195)}" cy="{s.r.randint(5,250)}" r="{s.r.choice([0.8,1,1.3])}" fill="#fff" opacity="{s.r.uniform(.3,.8):.2f}"/>' for _ in range(60)]
        else:
            for _ in range(4):
                cx, cy = s.r.randint(50, 1150), s.r.randint(40, 200)
                o.append(f'<g filter="url(#{p}smk2)" opacity=".75">' + ''.join(f'<ellipse cx="{cx+s.r.randint(-80,80)}" cy="{cy+s.r.randint(-12,12)}" rx="{s.r.randint(40,90)}" ry="{s.r.randint(14,26)}" fill="#fff"/>' for _ in range(5)) + '</g>')
        # distant tree line
        tl = '#18221a' if s.n else '#55734a'; tl2 = '#121a14' if s.n else '#476440'
        g = []
        x = -40
        while x < VW + 40:
            r_ = s.r.randint(28, 60); g.append(f'<circle cx="{x}" cy="{GY-30-s.r.randint(10,70)}" r="{r_}" fill="{tl if s.r.random()<.6 else tl2}"/>'); x += s.r.randint(22, 45)
        g.append(f'<rect x="0" y="{GY-60}" width="{VW}" height="60" fill="{tl}"/>')
        o.append(f'<g filter="url(#{p}smk2)" opacity=".85">{"".join(g)}</g>')
        o.append(f'<rect y="{GY-160}" width="{VW}" height="160" fill="{"#1f2a3d" if s.n else "#c5dbea"}" opacity=".35"/>')
        # ground
        o.append(f'<rect y="{GY-8}" width="{VW}" height="{VH-GY+8}" fill="url(#{p}lawn)" filter="url(#{p}grass)"/>')
        s.o = o + s.o

    def street(s):
        p = s.p
        s.add(f'<rect y="{GY+70}" width="{VW}" height="{VH-GY-70}" fill="url(#{p}asph)" filter="url(#{p}rough)"/>')
        s.add(f'<rect y="{GY+64}" width="{VW}" height="8" fill="url(#{p}conc)"/>')
        for x in range(30, VW, 110): s.add(f'<rect x="{x}" y="{VH-26}" width="55" height="5" fill="#e5cf5a" opacity=".85"/>')

    def driveway(s, x, w):
        s.poly([(x, GY), (x + w, GY), (x + w + 40, GY + 66), (x - 40, GY + 66)], f'url(#{s.p}conc)', extra=f'filter="url(#{s.p}rough)"')

    def parking(s):
        p = s.p
        s.add(f'<rect y="{GY+6}" width="{VW}" height="{VH-GY}" fill="url(#{p}asph)" filter="url(#{p}rough)"/>')
        for x in range(40, VW, 120): s.add(f'<polygon points="{x},{GY+40} {x+6},{GY+40} {x-14},{VH} {x-24},{VH}" fill="#e9e6da" opacity=".7"/>')

    # ---------- building ----------
    def build(s):
        b = s.b; side = s.side
        wide = side in 'AC'
        Wft = b['w'] if wide else b['d']
        fh = b.get('fh', 10)
        stories = b['stories']
        base = b.get('walkout', {}).get(side, 0)  # extra exposed basement floors on this side
        roof = b.get('roof', 'gable')
        rise_ft = (b['d'] / 2) * b.get('pitch', 0.42) if roof in ('gable', 'hip') else (b['w'] * 0.12 if roof == 'bow' else 0)
        tot_h = (stories + base) * fh + (rise_ft if (roof == 'gable' and not wide) or roof == 'hip' or (roof == 'bow' and wide) else rise_ft * 0.55)
        sc = min((1080 if Wft > 100 else 900) / Wft, 430 / max(tot_h + 4, 1))
        s.sc = sc
        W = Wft * sc; x0 = (VW - W) / 2 + b.get('shift', {}).get(side, 0)
        s.x0, s.W = x0, W
        top = GY - (stories + base) * fh * sc
        s.top = top; s.fh = fh * sc; s.base = base
        mat = b.get('mat', 'siding')
        if isinstance(mat, dict): mat = mat.get(side, mat.get('*', 'siding'))
        fill = {'siding': f'url(#{s.p}siding)', 'brick': f'url(#{s.p}brick)', 'stucco': f'url(#{s.p}stucco)', 'panel': f'url(#{s.p}panel)'}[mat]
        # ground shadow
        s.add(f'<ellipse cx="{x0+W/2+30}" cy="{GY+6}" rx="{W/2+50}" ry="16" fill="#000" opacity=".35" filter="url(#{s.p}blur4)"/>')
        # walls
        s.rect(x0, top, W, GY - top, fill, extra=f'filter="url(#{s.p}rough)"' if mat in ('stucco', 'brick') else '')
        if base:
            s.rect(x0, GY - base * s.fh, W, base * s.fh, f'url(#{s.p}conc)', extra=f'filter="url(#{s.p}rough)"')
        # floor band lines for multi-story
        if b.get('bands'):
            for f in range(1, stories):
                y = GY - (base + f) * s.fh
                s.rect(x0, y - 3, W, 6, b['bands'])
        s.rect(x0, top, W, GY - top, f'url(#{s.p}shadeH)')
        # roof
        rc = f'url(#{s.p}shingle)'
        ov = 12 * sc / 3
        if roof == 'gable':
            if wide:
                rh = rise_ft * sc * 0.55
                s.poly([(x0 - ov, top + 4), (x0 + W + ov, top + 4), (x0 + W + ov * 0.2, top - rh), (x0 - ov * 0.2, top - rh)], rc)
                s.rect(x0 - ov, top + 1, W + 2 * ov, 7, b.get('trim', '#efeee8'))
                s.ridge = (x0, x0 + W, top - rh)
            else:
                rh = rise_ft * sc
                s.poly([(x0 - 2, top), (x0 + W / 2, top - rh), (x0 + W + 2, top)], fill, extra=f'filter="url(#{s.p}rough)"' if mat == 'brick' else '')
                s.poly([(x0 - 2, top), (x0 + W / 2, top - rh), (x0 + W + 2, top)], f'url(#{s.p}shadeH)')
                # rake boards / roof edge
                s.add(f'<polyline points="{x0-ov:.1f},{top+6:.1f} {x0+W/2:.1f},{top-rh-6:.1f} {x0+W+ov:.1f},{top+6:.1f}" fill="none" stroke="{b.get("roofc","#4a4542")}" stroke-width="{max(6,sc*1.6):.1f}"/>')
                s.add(f'<polyline points="{x0-ov:.1f},{top+10:.1f} {x0+W/2:.1f},{top-rh-2:.1f} {x0+W+ov:.1f},{top+10:.1f}" fill="none" stroke="{b.get("trim","#efeee8")}" stroke-width="3"/>')
                s.ridge = (x0 + W / 2 - 2, x0 + W / 2 + 2, top - rh)
                s.gable = (x0 + W / 2, top - rh * 0.45)
        elif roof == 'hip':
            rh = rise_ft * sc * 0.6
            inset = W * 0.22 if wide else W * 0.45
            s.poly([(x0 - ov, top + 4), (x0 + W + ov, top + 4), (x0 + W - inset, top - rh), (x0 + inset, top - rh)], rc)
            s.rect(x0 - ov, top + 1, W + 2 * ov, 7, b.get('trim', '#efeee8'))
            s.ridge = (x0 + inset, x0 + W - inset, top - rh)
        elif roof == 'flat':
            ph = b.get('parapet', 3) * sc
            s.rect(x0 - 3, top - ph, W + 6, ph, b.get('parapetc', '#8c8778'))
            s.rect(x0 - 5, top - ph - 4, W + 10, 5, '#c9c6bd')
            s.ridge = (x0, x0 + W, top - ph)
        elif roof == 'bow':
            if wide:
                rh = rise_ft * sc
                s.add(f'<path d="M{x0-4:.1f},{top+2:.1f} Q{x0+W/2:.1f},{top-rh*2:.1f} {x0+W+4:.1f},{top+2:.1f} Z" fill="url(#{s.p}panel)"/>')
                s.add(f'<path d="M{x0-8:.1f},{top+2:.1f} Q{x0+W/2:.1f},{top-rh*2-8:.1f} {x0+W+8:.1f},{top+2:.1f}" fill="none" stroke="#6b6f73" stroke-width="7"/>')
                s.ridge = (x0 + W * 0.3, x0 + W * 0.7, top - rh)
            else:
                rh = rise_ft * sc * 0.5
                s.poly([(x0 - 4, top + 2), (x0 + W + 4, top + 2), (x0 + W + 4, top - rh), (x0 - 4, top - rh)], '#7b8084')
                s.ridge = (x0, x0 + W, top - rh)
        # eave shadow
        s.rect(x0, top, W, 26, f'url(#{s.p}eaveAO)')

    # ---------- openings ----------
    def fx(s, xf, f, wft, hft, sill=3):
        """xf: 0..1 across face; f: floor index from ground (0 = first above-grade floor on A; on walkout sides, basement is f=-1)."""
        sc = s.sc
        w, h = wft * sc, hft * sc
        cx = s.x0 + xf * s.W
        floor_base = GY - (s.base + f) * s.fh
        y = floor_base - sill * sc - h
        return cx - w / 2, y, w, h

    def window(s, xf, f, state='ok', wft=3.2, hft=4.6, kind='win', sill=3, label=None):
        x, y, w, h = s.fx(xf, f, wft, hft, sill)
        p = s.p
        trim = s.b.get('trim', '#efeee8')
        if kind in ('win', 'slider'):
            s.rect(x - 4, y - 4, w + 8, h + 8, trim)
            s.rect(x - 7, y + h + 2, w + 14, 5, trim)
            gl = {'ok': f'url(#{p}glass)', 'lit': f'url(#{p}lit)', 'smoke': f'url(#{p}smokeglass)', 'heavy': f'url(#{p}smokeglass)',
                  'fire': f'url(#{p}fireglass)', 'vented': '#0b0b0b', 'dark': '#101317', 'person': '#c9a978', 'glow': f'url(#{p}fireglass)'}[state]
            if state == 'ok' and s.n and s.r.random() < .4: gl = f'url(#{p}lit)'
            s.rect(x, y, w, h, gl)
            if state in ('ok',):
                s.add(f'<polygon points="{x+w*.1:.1f},{y+h:.1f} {x+w*.45:.1f},{y:.1f} {x+w*.6:.1f},{y:.1f} {x+w*.25:.1f},{y+h:.1f}" fill="#fff" opacity=".18"/>')
                if s.r.random() < .5: s.rect(x, y, w, h * s.r.uniform(.15, .45), '#f1ebe0', extra='opacity=".85"')  # blinds
            if state == 'vented':
                s.add(f'<polygon points="{x:.1f},{y:.1f} {x+w*.3:.1f},{y:.1f} {x:.1f},{y+h*.35:.1f}" fill="{"#6d8ea8" if not s.n else "#273445"}" opacity=".8"/>')
            if kind == 'win':
                s.rect(x, y + h / 2 - 2, w, 4, trim)
                if w > 30 * s.sc / 3: s.rect(x + w / 2 - 1.5, y, 3, h, trim)
            else:
                s.rect(x + w / 2 - 2, y, 4, h, trim)
            if state == 'person':
                px = x + w * .5; py = y + h * .35
                s.add(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{w*.13:.1f}" fill="#1b1410"/><path d="M{px-w*.25:.1f},{y+h:.1f} Q{px:.1f},{py:.1f} {px+w*.25:.1f},{y+h:.1f} Z" fill="#2a1d16"/><path d="M{px+w*.18:.1f},{py+w*.1:.1f} l{w*.3:.1f},{-w*.35:.1f}" stroke="#2a1d16" stroke-width="{w*.08:.1f}" stroke-linecap="round"/>')
                s.smoke_from(x + w / 2, y + 4, w * .8, 0.5, '#4d4a46', .55)
        elif kind == 'door':
            s.rect(x - 4, y - 4, w + 8, h + 4, trim)
            col = s.b.get('door', '#5a3b28')
            s.rect(x, y, w, h, col if state in ('ok', 'lit') else ('#0e0e0e' if state != 'fire' else f'url(#{p}fireglass)'))
            if state in ('ok', 'lit'):
                s.rect(x + w * .15, y + h * .1, w * .7, h * .32, '#000', extra='opacity=".12"'); s.rect(x + w * .15, y + h * .52, w * .7, h * .36, '#000', extra='opacity=".12"')
                s.add(f'<circle cx="{x+w*.82:.1f}" cy="{y+h*.52:.1f}" r="{max(2,w*.04):.1f}" fill="#d8c27a"/>')
        elif kind == 'garage':
            s.rect(x - 5, y - 5, w + 10, h + 5, trim)
            s.rect(x, y, w, h, f'url(#{p}garage)')
            for i in range(1, 4): s.rect(x + w * i / 4 - 1, y, 2, h, '#000', extra='opacity=".08"')
            if state in ('smoke', 'heavy', 'fire'):
                s.rect(x, y, w, 4, '#111')
                s.rect(x, y + h - 3, w, 3, '#111')
        elif kind == 'store':
            s.rect(x - 5, y - 5, w + 10, h + 5, '#3a3d40')
            s.rect(x, y, w, h, {'ok': f'url(#{p}glass)', 'lit': f'url(#{p}lit)', 'smoke': f'url(#{p}smokeglass)', 'heavy': f'url(#{p}smokeglass)', 'fire': f'url(#{p}fireglass)', 'vented': '#0b0b0b', 'dark': '#101317'}[state])
            for i in range(1, 4): s.rect(x + w * i / 4 - 2, y, 4, h, '#3a3d40')
            if state == 'ok': s.add(f'<polygon points="{x+w*.05:.1f},{y+h:.1f} {x+w*.3:.1f},{y:.1f} {x+w*.42:.1f},{y:.1f} {x+w*.17:.1f},{y+h:.1f}" fill="#fff" opacity=".2"/>')
        elif kind == 'rollup':
            s.rect(x - 5, y - 5, w + 10, h + 5, '#5b6064')
            s.rect(x, y, w, h, f'url(#{p}rollup)')
            if state in ('fire',):
                oh = h * .45
                s.rect(x, y + h - oh, w, oh, f'url(#{p}fireglass)')
        elif kind == 'steel':
            s.rect(x - 3, y - 3, w + 6, h + 3, '#55595c'); s.rect(x, y, w, h, '#7d8286')
            s.add(f'<rect x="{x+w*.7:.1f}" y="{y+h*.48:.1f}" width="{w*.18:.1f}" height="3" fill="#2a2a2a"/>')
            if state in ('smoke', 'heavy'): s.rect(x, y, w, 3, '#111')
        if label:
            s.add(f'<text x="{x+w/2:.1f}" y="{y-12:.1f}" font-family="Arial Narrow,Arial,sans-serif" font-size="{max(11,s.sc*2.2):.0f}" font-weight="700" fill="{label[1]}" text-anchor="middle">{label[0]}</text>')
        # conditions
        if state == 'fire':
            s.glow(x + w / 2, y + h / 2, max(w, h) * 2.4)
            s.flame(x + w / 2, y + h * 0.55, w * 1.05, h * 1.25)
            s.flame(x + w / 2, y + h * 0.1, w * 1.25, h * 1.9)
            s.smoke_from(x + w / 2, y - h * 1.2, w * 1.7, 1.25, '#1f1d1b', .92)
        elif state == 'glow':
            s.glow(x + w / 2, y + h / 2, max(w, h) * 1.8)
        elif state == 'heavy':
            s.smoke_from(x + w / 2, y + 4, w * 1.3, 1.0, '#2b2926', .9)
        elif state == 'smoke':
            s.smoke_from(x + w / 2, y + 4, min(w * .7, 40), 0.42, '#6e6a65', .6)
        if kind == 'rollup' and state == 'fire':
            s.flame(x + w / 2, y + h * .62, w * .9, h * .7)
            s.smoke_from(x + w / 2, y, w * 1.2, 1.2, '#1f1d1b', .9)

    # ---------- fire and smoke ----------
    def glow(s, cx, cy, rad):
        s.fxl.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rad:.1f}" ry="{rad*.8:.1f}" fill="url(#{s.p}glow)" style="mix-blend-mode:screen"/>')
        if s.n: s.fxl.append(f'<ellipse cx="{cx:.1f}" cy="{GY:.1f}" rx="{rad*2.2:.1f}" ry="{rad*.7:.1f}" fill="url(#{s.p}glowbig)" style="mix-blend-mode:screen"/>')

    def flame(s, cx, base, w, h):
        r = s.r; p = s.p; out = []
        # many tongues; each a teardrop with a vertical gradient (yellow base -> orange -> dark red tip)
        n = 7
        for j in range(n):
            t = (j + .5) / n
            xo = cx - w / 2 + w * t + r.uniform(-w * .06, w * .06)
            hh = h * (1 - abs(t - .5) * 1.1) * r.uniform(.75, 1.1)
            ww = w / n * r.uniform(1.6, 2.4)
            tipx = xo + r.uniform(-ww * .5, ww * .5) + s.drift * hh * .15
            out.append(f'<path d="M{xo-ww/2:.1f},{base:.1f} C{xo-ww*.6:.1f},{base-hh*.45:.1f} {tipx-ww*.15:.1f},{base-hh*.7:.1f} {tipx:.1f},{base-hh:.1f} C{tipx+ww*.15:.1f},{base-hh*.7:.1f} {xo+ww*.6:.1f},{base-hh*.45:.1f} {xo+ww/2:.1f},{base:.1f} Z" fill="url(#{p}flg)"/>')
        core = f'<ellipse cx="{cx:.1f}" cy="{base-h*.18:.1f}" rx="{w*.28:.1f}" ry="{h*.13:.1f}" fill="#ffe9a8" opacity=".7"/>'
        s.fxl.append(f'<g filter="url(#{p}fl)">{"".join(out)}{core}</g>')
        s.fxl.append(f'<g filter="url(#{p}blur4)" opacity=".55" style="mix-blend-mode:screen">{"".join(out)}</g>')

    def smoke_from(s, x, y, width, vol, color, op, rise=1.0):
        """A plume leaving at (x,y). vol ~0.4 light .. 1.4 heavy."""
        r = s.r; out = []
        width = min(width, 70)
        n = int(10 + vol * 14)
        length = (180 + vol * 320) * rise
        for i in range(n):
            t = i / n
            cx = x + s.drift * (t ** 1.4) * length * .9 + r.uniform(-width * .3, width * .3) * (1 + t)
            cy = y - t * length + r.uniform(-10, 10)
            rad = width * .45 + t * (40 + vol * 90) + r.uniform(0, 12)
            c = color
            if t > .55 and not s.n: c = _mix(color, '#8f8c86', (t - .55) * 1.3)
            out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rad:.1f}" fill="{c}" opacity="{op*(1-t*.6):.2f}"/>')
        s.fxl.append(f'<g filter="url(#{s.p}smk)">{"".join(out)}</g>')

    def eave_smoke(s, vol, color='#9d9993', op=.45, xs=(0, 1)):
        x0, W, top = s.x0, s.W, s.top
        n = 5
        for i in range(n):
            xf = xs[0] + (xs[1] - xs[0]) * (i + .5) / n
            s.smoke_from(x0 + xf * W, top + 6, 18, vol * .35, color, op * .7, .4)

    def ridge_smoke(s, vol, color='#4f4b47', op=.75, xs=(.2, .8)):
        a, b2, y = s.ridge
        if b2 - a < 10: xs = (.5, .5)
        n = 1 if xs[0] == xs[1] else 4
        for i in range(n):
            xf = xs[0] if n == 1 else xs[0] + (xs[1] - xs[0]) * i / (n - 1)
            s.smoke_from(a + (b2 - a) * xf, y, 40, vol, color, op)

    def gable_vent(s, state='ok'):
        if not hasattr(s, 'gable'): return
        gx, gy = s.gable; w = 3.2 * s.sc; h = 2.6 * s.sc
        s.rect(gx - w / 2 - 3, gy - h / 2 - 3, w + 6, h + 6, s.b.get('trim', '#efeee8'))
        s.rect(gx - w / 2, gy - h / 2, w, h, '#3a3a38' if state != 'ok' else '#8f8f88')
        for i in range(5): s.rect(gx - w / 2, gy - h / 2 + i * h / 5 + 2, w, h / 10, '#d8d6cf' if state == 'ok' else '#5a5854')
        if state == 'smoke': s.smoke_from(gx, gy - h / 2, w, .45, '#77736e', .6)
        if state == 'heavy': s.smoke_from(gx, gy - h / 2, w * 1.2, .9, '#2c2a27', .85)
        if state == 'fire':
            s.glow(gx, gy, w * 3); s.flame(gx, gy - h * .2, w * 1.1, h * 2.4); s.smoke_from(gx, gy - h * 2, w * 1.4, 1.2, '#1f1d1b', .9)

    # ---------- props ----------
    def tree(s, x, size=1.0, front=False):
        tgt = s.front if front else s.o
        h = 150 * size; tc = '#1d2a1c' if s.n else '#3d5f30'; tc2 = '#2a3b26' if s.n else '#557d41'
        g = [f'<rect x="{x-6*size:.1f}" y="{GY-h*.45:.1f}" width="{12*size:.1f}" height="{h*.45+6:.1f}" fill="#4a3727"/>']
        for i in range(7):
            g.append(f'<circle cx="{x+s.r.uniform(-45,45)*size:.1f}" cy="{GY-h*.55-s.r.uniform(0,h*.45):.1f}" r="{s.r.uniform(30,52)*size:.1f}" fill="{tc if i%2 else tc2}"/>')
        tgt.append(f'<g filter="url(#{s.p}smk2)">{"".join(g)}</g>')

    def shrubs(s, x0, x1):
        for x in range(int(x0), int(x1), 34):
            s.add(f'<ellipse cx="{x+s.r.uniform(-5,5):.1f}" cy="{GY-10:.1f}" rx="{s.r.uniform(18,26):.1f}" ry="{s.r.uniform(13,19):.1f}" fill="{"#1d2a1c" if s.n else "#45683a"}" filter="url(#{s.p}smk2)"/>')

    def car(s, x, color='#8a1f1f', y=None, front=True):
        y = y or GY + 60; tgt = s.front if front else s.o
        g = f'''<g><ellipse cx="{x+80}" cy="{y+4}" rx="92" ry="9" fill="#000" opacity=".4"/>
<path d="M{x},{y-12} q0,-30 30,-34 l28,-26 q8,-6 20,-6 h52 q14,0 22,8 l24,24 q34,4 38,16 q4,6 4,18 z" fill="{color}"/>
<path d="M{x+64},{y-70} h48 q10,0 16,6 l20,20 h-90 z" fill="#2b3a48" opacity=".9"/>
<rect x="{x+4}" y="{y-26}" width="186" height="4" fill="#000" opacity=".2"/>
<circle cx="{x+44}" cy="{y-6}" r="17" fill="#141414"/><circle cx="{x+44}" cy="{y-6}" r="8" fill="#8d8f92"/>
<circle cx="{x+150}" cy="{y-6}" r="17" fill="#141414"/><circle cx="{x+150}" cy="{y-6}" r="8" fill="#8d8f92"/></g>'''
        tgt.append(g)

    def fence(s, x0, x1, h=6, wood=True):
        sc = s.sc; y = GY - h * sc
        col = '#8b6a48' if wood else '#9aa0a4'
        if s.n: col = '#4a3a2a' if wood else '#55595c'
        s.front.append(f'<rect x="{x0:.1f}" y="{y:.1f}" width="{x1-x0:.1f}" height="{h*sc:.1f}" fill="{col}"/>')
        for x in range(int(x0), int(x1), 9): s.front.append(f'<rect x="{x}" y="{y:.1f}" width="1.5" height="{h*sc:.1f}" fill="#000" opacity=".25"/>')
        s.front.append(f'<rect x="{x0:.1f}" y="{y+h*sc*.2:.1f}" width="{x1-x0:.1f}" height="3" fill="#000" opacity=".2"/>')

    def meter(s, xf, kind='elec'):
        x = s.x0 + xf * s.W; y = GY - 5 * s.sc
        if kind == 'elec':
            s.rect(x - 9, y - 14, 18, 26, '#9da3a8'); s.add(f'<circle cx="{x:.1f}" cy="{y-3:.1f}" r="6" fill="#d8e1e6" stroke="#666"/>')
            s.rect(x - 2, y - 14 - (s.top - (s.top - 0)) - 60, 4, 60, '#7a7f84')
        else:
            s.add(f'<path d="M{x-8:.1f},{GY:.1f} v-30 h16 v30" fill="none" stroke="#b8a64a" stroke-width="4"/>'); s.rect(x - 12, GY - 48, 24, 20, '#b9b9b0')

    def service_drop(s, xf, from_left=True):
        x = s.x0 + xf * s.W; y = s.top + 20
        px = 30 if from_left else VW - 30
        s.front.append(f'<rect x="{px-5}" y="{GY-430}" width="10" height="440" fill="#5a4530"/><rect x="{px-30}" y="{GY-420}" width="60" height="6" fill="#5a4530"/>')
        s.front.append(f'<path d="M{px},{GY-418} Q{(px+x)/2:.1f},{GY-300:.1f} {x:.1f},{y:.1f}" fill="none" stroke="#111" stroke-width="2.2"/>')
        s.front.append(f'<path d="M{px-28},{GY-418} Q{(px+x)/2:.1f},{GY-330:.1f} {VW if from_left else 0},{GY-400}" fill="none" stroke="#111" stroke-width="2"/>')

    def ac(s, xf):
        x = s.x0 + xf * s.W
        s.rect(x - 22, GY - 34, 44, 34, '#c7cacc'); s.add(f'<circle cx="{x:.1f}" cy="{GY-17:.1f}" r="12" fill="#55595c"/>')

    def propane(s, x, big=False):
        if big:
            s.front.append(f'<rect x="{x-70}" y="{GY-46}" width="140" height="44" rx="22" fill="#f2f2ee" stroke="#999"/><rect x="{x-50}" y="{GY-6}" width="10" height="10" fill="#777"/><rect x="{x+40}" y="{GY-6}" width="10" height="10" fill="#777"/>')
        else:
            for i in range(3):
                s.front.append(f'<rect x="{x+i*22-10}" y="{GY-48}" width="18" height="48" rx="8" fill="#e9e9e4" stroke="#888"/>')
            s.front.append(f'<rect x="{x-16}" y="{GY-58}" width="72" height="58" fill="none" stroke="#888" stroke-width="2" stroke-dasharray="4 3"/>')

    def grill(s, x):
        s.front.append(f'<rect x="{x-24}" y="{GY-52}" width="48" height="26" rx="6" fill="#1f1f1f"/><rect x="{x-20}" y="{GY-26}" width="4" height="26" fill="#333"/><rect x="{x+16}" y="{GY-26}" width="4" height="26" fill="#333"/><rect x="{x+26}" y="{GY-30}" width="14" height="30" rx="6" fill="#e9e9e4"/>')

    def patio(s, x0, x1):
        s.poly([(x0, GY), (x1, GY), (x1 + 30, GY + 40), (x0 - 30, GY + 40)], f'url(#{s.p}conc)')

    def dumpster(s, x, color='#2f5d3a'):
        s.front.append(f'<rect x="{x}" y="{GY-60}" width="120" height="60" fill="{color}"/><rect x="{x-4}" y="{GY-66}" width="128" height="8" fill="#1d1d1d"/><rect x="{x}" y="{GY-30}" width="120" height="3" fill="#000" opacity=".3"/>')

    def balcony(s, xf, f, wft=10, state='ok'):
        x, y, w, h = s.fx(xf, f, wft, 3.4, sill=0)
        y = GY - (s.base + f) * s.fh - 3.4 * s.sc
        s.front.append(f'<rect x="{x:.1f}" y="{y+h-6:.1f}" width="{w:.1f}" height="8" fill="#6f6a62"/>')
        for i in range(int(w // 9) + 1): s.front.append(f'<rect x="{x+i*9:.1f}" y="{y:.1f}" width="2" height="{h:.1f}" fill="#2d2d2d"/>')
        s.front.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="4" fill="#2d2d2d"/>')
        if state == 'fire':
            s.glow(x + w / 2, y, w * 1.3); s.flame(x + w / 2, y + h * .9, w * .8, s.fh * 1.25); s.smoke_from(x + w / 2, y - s.fh * .7, w, 1.3, '#1f1d1b', .92)
        if state == 'stuff':
            s.front.append(f'<rect x="{x+w*.15:.1f}" y="{y+h*.35:.1f}" width="{w*.2:.1f}" height="{h*.6:.1f}" fill="#7d5a3b"/><circle cx="{x+w*.7:.1f}" cy="{y+h*.6:.1f}" r="{h*.3:.1f}" fill="#3f6e34"/>')

    def stair_opening(s, xf, wft=10):
        x0 = s.x0 + xf * s.W - wft * s.sc / 2; w = wft * s.sc
        s.rect(x0, s.top + 10, w, GY - s.top - 10, '#25221f')
        for f in range(s.b['stories']):
            yb = GY - f * s.fh
            s.add(f'<polygon points="{x0:.1f},{yb:.1f} {x0+w:.1f},{yb-s.fh*.5:.1f} {x0+w:.1f},{yb-s.fh*.5+8:.1f} {x0:.1f},{yb+8:.1f}" fill="#8c877d"/>')
            s.add(f'<polygon points="{x0+w:.1f},{yb-s.fh*.5:.1f} {x0:.1f},{yb-s.fh:.1f} {x0:.1f},{yb-s.fh+8:.1f} {x0+w:.1f},{yb-s.fh*.5+8:.1f}" fill="#9c978d"/>')
            s.rect(x0, yb - s.fh * .5 - 34, w, 4, '#2d2d2d')

    def sign(s, text, xf=.5, y=None, color='#b3121f', fg='#fff', wft=None):
        w = (wft or len(text) * 2.2) * s.sc; x = s.x0 + xf * s.W - w / 2
        y = y if y is not None else s.top + 12
        s.rect(x, y, w, 9 * s.sc / 2.2 if s.sc < 4 else 34, color)
        fs = min(30, 9 * s.sc / 2.2 * .62)
        s.add(f'<text x="{x+w/2:.1f}" y="{y+fs*1.15:.1f}" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="{fs:.0f}" fill="{fg}" text-anchor="middle" letter-spacing="1">{text}</text>')

    def placard(s, xf, f=0, num='1075', cls='2'):
        x = s.x0 + xf * s.W; y = GY - (s.base + f) * s.fh - 6 * s.sc
        d = 26
        s.add(f'<g transform="translate({x:.1f},{y:.1f}) rotate(45)"><rect x="{-d}" y="{-d}" width="{2*d}" height="{2*d}" fill="#c8102e" stroke="#fff" stroke-width="3"/></g>')
        s.add(f'<text x="{x:.1f}" y="{y+6:.1f}" font-family="Arial" font-weight="700" font-size="15" fill="#fff" text-anchor="middle">{num}</text>')

    def rooftop(s, xf, kind='hvac', state='ok'):
        a, b2, y = s.ridge
        x = s.x0 + xf * s.W
        if kind == 'hvac':
            s.rect(x - 40, y - 40, 80, 40, '#a9adb0'); s.rect(x - 40, y - 40, 80, 6, '#888')
        elif kind == 'hood':
            s.rect(x - 22, y - 52, 44, 52, '#b6b9bb'); s.rect(x - 34, y - 64, 68, 14, '#9da1a4')
        elif kind == 'vent':
            s.rect(x - 12, y - 26, 24, 26, '#9da1a4'); s.add(f'<path d="M{x-18:.1f},{y-26:.1f} q18,-16 36,0 z" fill="#888"/>')
        if state == 'fire':
            s.glow(x, y - 50, 90); s.flame(x, y - 40, 60, 80); s.smoke_from(x, y - 90, 60, 1.2, '#1f1d1b', .92)
        elif state == 'heavy':
            s.smoke_from(x, y - 30, 50, 1.1, '#2b2926', .9)
        elif state == 'smoke':
            s.smoke_from(x, y - 30, 40, .7, '#5e5b57', .75)

    def hydrant(s, x):
        s.front.append(f'<rect x="{x-9}" y="{GY+28}" width="18" height="34" rx="4" fill="#c8b21a"/><rect x="{x-14}" y="{GY+36}" width="28" height="8" rx="3" fill="#c8b21a"/><rect x="{x-12}" y="{GY+24}" width="24" height="7" rx="3" fill="#8f7f10"/>')

    def neighbor(s, left=True, mat='siding', gap=90):
        """Edge of a neighboring building (exposure)."""
        w = 260
        x = (s.x0 - gap - w) if left else (s.x0 + s.W + gap)
        top = max(s.top - 10, GY - 260)
        s.rect(x, top, w, GY - top, '#b9b2a4' if mat == 'siding' else f'url(#{s.p}brick)')
        s.rect(x, top, w, GY - top, '#000', extra='opacity=".18"')
        s.poly([(x - 10, top), (x + w + 10, top), (x + w + 10, top - 50), (x - 10, top - 50)], f'url(#{s.p}shingle)')
        for i in range(2):
            for f in range(2):
                wx = x + 50 + i * 120; wy = top + 30 + f * (GY - top) / 2
                s.rect(wx, wy, 40, 50, f'url(#{s.p}glass)')

    def slope(s, high='right'):
        """Cover the exposed basement on a walkout side so grade climbs toward side A."""
        h = s.base * s.fh
        if not h: return
        x0, W = s.x0, s.W
        if high == 'right': pts = [(x0 + W * .25, GY + 2), (x0 + W + 60, GY - h - 6), (VW, GY - h - 6), (VW, GY + 10), (x0, GY + 10)]
        else: pts = [(x0 + W * .75, GY + 2), (x0 - 60, GY - h - 6), (0, GY - h - 6), (0, GY + 10), (x0 + W, GY + 10)]
        s.poly(pts, f'url(#{s.p}lawn)', extra=f'filter="url(#{s.p}grass)"', to=s.front)

    def tables(s, x0, n=3):
        for i in range(n):
            x = x0 + i * 120
            s.front.append(f'<rect x="{x}" y="{GY+10}" width="70" height="6" fill="#3d3d3d"/><rect x="{x+32}" y="{GY+16}" width="6" height="34" fill="#3d3d3d"/><path d="M{x-10},{GY+8} L{x+35},{GY-60} L{x+80},{GY+8} Z" fill="#b3121f" opacity=".9"/><rect x="{x+33}" y="{GY-60}" width="4" height="70" fill="#555"/>')

    def label(s):
        t = SIDE_NAMES[s.side]
        s.front.append(f'<g><rect x="28" y="26" width="{48+len(t)*19}" height="52" rx="8" fill="#111" opacity=".78"/><text x="48" y="64" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="30" fill="#fff" letter-spacing="2">{t}</text></g>')

    def svg(s):
        s.background()
        s.label()
        night = f'<rect width="{VW}" height="{VH}" fill="#0a1020" opacity=".25" style="mix-blend-mode:multiply"/>' if s.n else ''
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" width="{VW}" height="{VH}">{s.defs()}'
                + ''.join(s.o) + night + ''.join(s.fxl) + ''.join(s.front)
                + f'<rect width="{VW}" height="{VH}" fill="url(#{s.p}vign)"/></svg>')


def _mix(a, b, t):
    t = max(0, min(1, t))
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{int(x + (y - x) * t):02x}' for x, y in zip(ca, cb))
