# ship.sh - one-command gamemaker deploy loop
# 1) install newest Bloom export from Downloads (mtime + identity gates)
/c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe update_gamemaker.py || exit 1
# 2) commit everything the installer touched
git add .
git commit -m "gamemaker: design iteration"
# 3) plain push - NEVER force (v18 rule, webhook safety)
git push origin main
