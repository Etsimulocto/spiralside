import sys
FILE = r"C:/Users/quart/spiralside/js/app/ui.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Find handlePayPalReturn success block and add plan refresh + toast
OLD = '''if(r.ok){await loadUsage();window.history.replaceState({},document.title,window.location.pathname);openPanel("store");setTimeout(()=>alert(`Payment successful! ${data.credits_added} credits added.`),300);}'''

NEW = '''if(r.ok){
          await loadUsage();
          window.history.replaceState({},document.title,window.location.pathname);
          // Refresh plan status if it was a storage purchase
          if (typeof window.refreshPlanStatus === 'function') await window.refreshPlanStatus();
          // Show store tab
          if (typeof window.switchView === 'function') window.switchView('store');
          else openPanel("store");
          // Only show credits alert if credits were actually added
          if (data.credits_added > 0) {
            setTimeout(()=>alert('Payment successful! ' + data.credits_added.toLocaleString() + ' credits added.'),300);
          }
        }'''

if OLD not in src:
    print("MISS: handlePayPalReturn success block")
    idx = src.find("credits_added")
    print(repr(src[max(0,idx-100):idx+200]))
    sys.exit(1)

src = src.replace(OLD, NEW)
with open(FILE, "w", encoding="utf-8") as f:
    f.write(src)
print("DONE")
