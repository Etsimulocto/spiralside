# Fix: change switchTab to switchView in the spiral tab button

with open('index.html','r',encoding='utf-8') as f:
    content = f.read()

bad  = """onclick="switchTab('spiral')">spiral"""
good = """onclick="switchView('spiral')">∿ spiral"""

if bad in content:
    content = content.replace(bad, good, 1)
    print('fixed: switchTab -> switchView')
else:
    print('ANCHOR NOT FOUND -- check button markup')

with open('index.html','w',encoding='utf-8') as f:
    f.write(content)
print('wrote index.html')
