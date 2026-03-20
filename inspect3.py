# inspect3.py — run from ~/spiralside
import os

print("=== js/app/vault.js (old) — first 60 lines ===")
with open('js/app/vault.js','r',encoding='utf-8',errors='ignore') as f:
    lines = f.readlines()
for i,l in enumerate(lines[:60]):
    print(f"{i+1:3}: {l}", end='')

print("\n\n=== js/app/views/vault.js — first 10 lines ===")
with open('js/app/views/vault.js','r',encoding='utf-8',errors='ignore') as f:
    lines2 = f.readlines()
for i,l in enumerate(lines2[:10]):
    print(f"{i+1:3}: {l}", end='')

print("\n\n=== ui.js switchView full function ===")
with open('js/app/ui.js','r',encoding='utf-8') as f:
    ui = f.read()
idx = ui.find('export function switchView')
if idx == -1: idx = ui.find('function switchView')
print(repr(ui[idx:idx+600]))

print("\n\n=== main.js — loadVaultFromDB and initVaultView area ===")
with open('js/app/main.js','r',encoding='utf-8') as f:
    m = f.read()
for kw in ['loadVaultFromDB','initVaultView','views/vault']:
    i = m.find(kw)
    if i != -1:
        print(f"  [{kw}]:", repr(m[max(0,i-60):i+120]))
