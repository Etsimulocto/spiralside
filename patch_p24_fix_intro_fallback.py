#!/usr/bin/env python3
import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p,'r',encoding='utf-8') as f: return f.read().replace('\r\n','\n')
def write(p,c):
    with open(p,'w',encoding='utf-8') as f: f.write(c)
def patch(path, old, new, label):
    src = read(path); old=old.replace('\r\n','\n'); new=new.replace('\r\n','\n')
    if old not in src:
        print(f'[MISS] {label}')
        idx=src.find(old[:40])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[not found] '+repr(old[:80])))
        sys.exit(1)
    if src.count(old)>1: print(f'[DUPE] {label}'); sys.exit(1)
    write(path, src.replace(old, new)); print(f'[OK] {label}')

MAIN = 'js/app/main.js'

patch(MAIN,
    """    const valid  = (books || [])
      .filter(b => b.slots && b.slots.some(s => s.type==='image' || (s.type==='text' && s.text)))
      .sort((a, b) => {
        if (introId) {
          if (a.id === introId) return -1;
          if (b.id === introId) return  1;
        }
        return (b.createdAt||0) - (a.createdAt||0);
      });""",
    """    // Only replace Sky intro if user explicitly chose a book as intro
    const valid = introId
      ? (books || []).filter(b => b.id === introId && b.slots &&
          b.slots.some(s => s.type==='image' || (s.type==='text' && s.text)))
      : [];""",
    'main.js: require explicit intro_book_id to replace Sky intro')

print()
print('Deploy:')
print('  git add js/app/main.js')
print('  git commit -m "fix: Sky intro plays by default; user book only when intro_book_id set"')
print('  git push --force origin main')
