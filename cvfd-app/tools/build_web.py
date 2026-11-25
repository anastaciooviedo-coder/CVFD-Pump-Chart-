"""Builds the combined CVFD web site (Field Guide + Training Division on Firebase) for Netlify.
Runs tools/build.py, then copies www/ to dist-web/ with icons, a web manifest and headers, and zips it.
Usage: python3 tools/build_web.py [zip path]"""
import json, os, re, shutil, subprocess, sys
M = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(M, 'www'); OUT = os.path.join(M, 'dist-web')
if os.path.exists(os.path.join(WWW, 'firebase-config.js')): os.remove(os.path.join(WWW, 'firebase-config.js'))
subprocess.check_call([sys.executable, os.path.join(M, 'tools', 'build.py')])
shutil.rmtree(OUT, ignore_errors=True)
# eo-phase-book.pdf stays out: the site is public and the book view doesn't use the PDF.
shutil.copytree(WWW, OUT, ignore=shutil.ignore_patterns('eo-phase-book.pdf', 'seed.json'))
# Task books (book page, hub, officer review) live in the private cvfd-taskbooks repo, branch firebase-site.
TB = os.environ.get('CVFD_TASKBOOKS', os.path.join(M, '..', '..', 'cvfd-taskbooks', 'site-tb'))
if os.path.isdir(TB):
    shutil.copytree(TB, os.path.join(OUT, 'tb'))
    # CVFD Playbook look for the task book pages: charcoal bar, apparatus red, rounder cards, a way back home.
    open(os.path.join(OUT, 'tb', 'playbook.css'), 'w').write(
        ':root{--navy:#17191c;--blue:#1f63c6;--red:#c8102e;--bg:#f3f2ef;--line:#e1ded7;--shade:#ebe9e4;--radius:16px}'
        'body{font-family:"Barlow",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:16px}'
        '.btn{border-radius:12px;min-height:40px}.tb-back{display:none!important}'
        '.pb-back{display:flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;background:#0e0f11;color:#f2f2f0;'
        'font:600 15px "Barlow",system-ui,sans-serif;text-decoration:none}.pb-back b{color:#e8283f;font-weight:700}')
    for f in os.listdir(os.path.join(OUT, 'tb')):
        if f.endswith('.html'):
            fp = os.path.join(OUT, 'tb', f); s = open(fp).read()
            s = s.replace('</head>', '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="playbook.css">\n</head>', 1)
            s = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n<a class="pb-back" href="../#home">&lsaquo; <b>CVFD</b> Playbook</a>', s, count=1)
            open(fp, 'w').write(s)
else: print('note: task books not included (no', TB, ')')
for f in os.listdir(os.path.join(M, 'resources', 'web')):
    shutil.copy(os.path.join(M, 'resources', 'web', f), os.path.join(OUT, f))
json.dump({"name": "CVFD Playbook", "short_name": "Playbook", "start_url": "/", "display": "standalone",
           "background_color": "#0e0f11", "theme_color": "#0e0f11",
           "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
                     {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}]},
          open(os.path.join(OUT, 'manifest.webmanifest'), 'w'))
open(os.path.join(OUT, '_headers'), 'w').write(
    "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n  X-Frame-Options: DENY\n"
    "/index.html\n  Cache-Control: no-cache\n/shim.js\n  Cache-Control: no-cache\n/firebase-config.js\n  Cache-Control: no-cache\n")
p = os.path.join(OUT, 'index.html'); t = open(p).read()
t = t.replace('<meta name="theme-color" content="#0e0f11">',
    '<meta name="theme-color" content="#0e0f11">\n<meta name="apple-mobile-web-app-title" content="Playbook">\n'
    '<meta name="apple-mobile-web-app-capable" content="yes">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n<link rel="manifest" href="/manifest.webmanifest">', 1)
open(p, 'w').write(t)
if len(sys.argv) > 1:
    z = sys.argv[1]; os.makedirs(os.path.dirname(z), exist_ok=True)
    if os.path.exists(z): os.remove(z)
    shutil.make_archive(z[:-4], 'zip', OUT)
    print('zip:', z)
print('dist-web:', sorted(os.listdir(OUT)))
