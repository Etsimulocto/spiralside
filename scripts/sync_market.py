# ============================================================
# SPIRALSIDE - SYNC BLOOMCORE MARKET
# Copies the public store (Etsimulocto/quarterbitgamesSTORE) into
# spiralside/market/ so it is served at https://spiralside.com/market/
#
# The store repo is the source of truth. Never edit files inside
# spiralside/market/ by hand - edit the store repo, then run this.
#
# HOW TO USE (Git Bash, from the spiralside folder):
#   1. In the store repo: add photos + listings, push as usual
#   2. Here:
#        C:/Users/quart/AppData/Local/Programs/Python/Python313/python.exe scripts/sync_market.py
#      (or pass the store folder if it lives somewhere else:
#        ... scripts/sync_market.py "C:/Users/quart/Documents/quarterbitgamesSTORE")
#   3. git add market && git commit -m "market: sync store" && git push origin main
#
# Only the public storefront files are copied: index.html, assets/, data/.
# README, .git and anything else in the store repo stay out.
# ============================================================

import os        # paths and folder walking
import shutil    # copying files and removing the old copy
import sys       # reading the optional command-line argument

# Folder this script lives in -> spiralside/scripts
HERE = os.path.dirname(os.path.abspath(__file__))
# The spiralside repo root is one level up
SPIRALSIDE = os.path.dirname(HERE)
# Where the store gets copied to inside spiralside
TARGET = os.path.join(SPIRALSIDE, 'market')

# Default store location: Documents/quarterbitgamesSTORE (what the store README uses)
DEFAULT_STORE = os.path.join(os.path.expanduser('~'), 'Documents', 'quarterbitgamesSTORE')
# Use the folder given on the command line if there is one, else the default
STORE = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_STORE

# The only things that belong on the public page
KEEP = ['index.html', 'assets', 'data']

# Safety check 1: the store folder must exist and look like the store
if not os.path.isfile(os.path.join(STORE, 'index.html')):
    print('Store not found at: ' + STORE)
    print('Pass the store folder as an argument, see the top of this file.')
    sys.exit(1)

# Safety check 2: never copy the private admin tools into the public site
for bad in ['admin.html', os.path.join('assets', 'admin.js')]:
    if os.path.exists(os.path.join(STORE, bad)):
        print('STOP: ' + bad + ' found. That is the PRIVATE build repo, not the public store.')
        sys.exit(1)

# Start clean so deleted listings/photos also disappear from the copy
if os.path.isdir(TARGET):
    shutil.rmtree(TARGET)
os.makedirs(TARGET)

# Copy each kept item (folders recursively, files directly)
for name in KEEP:
    src = os.path.join(STORE, name)
    dst = os.path.join(TARGET, name)
    if os.path.isdir(src):
        shutil.copytree(src, dst)
    elif os.path.isfile(src):
        shutil.copy2(src, dst)

# Warn about huge photos: phone photos are ~4-5 MB each and load slowly
BIG = 1.5 * 1024 * 1024   # 1.5 MB
for root, _dirs, files in os.walk(os.path.join(TARGET, 'assets', 'products')):
    for f in files:
        size = os.path.getsize(os.path.join(root, f))
        if size > BIG:
            print('heads up, big photo (%.1f MB): %s  - shrink to ~1600px wide' % (size / 1048576.0, f))

print('market synced from ' + STORE + ' -> ' + TARGET)
