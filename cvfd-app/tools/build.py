"""Builds www/ for Capacitor: the shared app code (built in mode "app") + Firebase + the runtime shim."""
import os, re, shutil, subprocess, sys
M = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(M, 'src'); WWW = os.path.join(M, 'www')
SH = os.path.join(M, 'shared')
# Shared app code (same files that build the claude.ai Field Guide / Training Division pages), in "app" mode.
TABS = '''  <a href="#home" data-tab="home">Home</a>
  <a href="#sogs" data-tab="sogs">SOGs</a>
  <a href="#sizeup" data-tab="sizeup">Size-Up</a>
  <a href="#training" data-tab="training">Training</a>
  <a href="#academy" data-tab="academy">Academy</a>
  <a href="#td" data-tab="cadre" id="cadre-tab" hidden>Cadre</a>'''
rd = lambda f: open(os.path.join(SH, f)).read()
body = (rd('head.html') + rd('body.html')).replace('<title>CVFD Field Guide</title>', '<title>CVFD</title>') \
    .replace('__APPNAME__', 'CVFD').replace('__APPSUB__', 'Community VFD').replace('__TABS__', TABS) \
    .replace('__MEBTN__', '    <a class="btn sm" id="me-btn" href="#me">My record</a>').replace('__MODE__', 'app') \
    .replace('__TDSLUG__', 'BJuKvyimsiuppjtLpupMS9').replace('__BADGE__', rd('badge.txt').strip())
body = body.replace('const PUMP_CHART', rd('cadre.js') + '\nconst PUMP_CHART', 1)
left = set(re.findall(r'__[A-Z]+__', body)); assert not left, left
os.makedirs(os.path.join(WWW, 'lib'), exist_ok=True)
for f in ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js']:
    shutil.copy(os.path.join(M, 'node_modules', 'firebase', f), os.path.join(WWW, 'lib', f))
for f in ['shim.js', 'privacy.html', 'sogs.json', 'eo-phase-book.pdf']:
    if os.path.exists(os.path.join(SRC, f)): shutil.copy(os.path.join(SRC, f), os.path.join(WWW, f))
if os.path.isdir(os.path.join(SRC, 'practice')):
    shutil.copytree(os.path.join(SRC, 'practice'), os.path.join(WWW, 'practice'), dirs_exist_ok=True)
if os.path.isdir(os.path.join(SRC, 'seed')):
    shutil.copytree(os.path.join(SRC, 'seed'), os.path.join(WWW, 'seed'), dirs_exist_ok=True)
if not os.path.exists(os.path.join(WWW, 'firebase-config.js')):
    shutil.copy(os.path.join(SRC, 'firebase-config.js'), os.path.join(WWW, 'firebase-config.js'))
for a, b in [('Open the guide while signed in to claude.ai to see them.', 'Check your connection, then reopen the app.'),
             ('Open the guide while signed in to claude.ai to keep your own training record.', 'Sign in to keep your own training record.'),
             ('Your training record needs a signed-in claude.ai account in your organization.', 'Sign in to keep your own training record.'),
             ('Sign in to claude.ai to fill this book out and track your progress.', 'Sign in to fill this book out and track your progress.'),
             ('Sign in to claude.ai to track a book.', 'Sign in to track a book.'),
             ('Open the guide while signed in to Claude to see the live check-in.', 'Check your connection, then reopen the app.'),
             ('<meta name="claude:viewport-fit-sides" content="cover">\n', ''),
             ('<b>Pump Chart ↗</b>', '<b>Pump Chart</b>')]:
    body = body.replace(a, b)
head = '''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1d2328">
<style>html,body{margin:0;padding:0}body{background:var(--bg,#eef0f1)}header.top{padding-top:calc(env(safe-area-inset-top) + 8px)!important}</style>
<script src="lib/firebase-app-compat.js"></script>
<script src="lib/firebase-auth-compat.js"></script>
<script src="lib/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="shim.js"></script>
</head><body>
'''
open(os.path.join(WWW, 'index.html'), 'w').write(head + body + '\n</body></html>\n')
pump = os.path.join(M, '..', 'web', 'index.html')
if os.path.exists(pump):
    t = open(pump).read()
    back = '<a href="index.html" style="display:inline-block;margin:8px 0 0 max(16px,env(safe-area-inset-left,0px));font:600 15px system-ui,sans-serif;color:inherit;text-decoration:none">&lsaquo; CVFD</a>'
    t = t.replace('<body>', '<body>\n' + back, 1)
    open(os.path.join(WWW, 'pump.html'), 'w').write(t)
print('www built:', sorted(os.listdir(WWW)))
