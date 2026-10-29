# /bloomcircuit — BloomCircuit wiring editor on spiralside.com

This folder is a **copy** of the web app from
[Etsimulocto/BloomCircuit](https://github.com/Etsimulocto/BloomCircuit)
(`main`, commit `53f11b4`). It is served at **spiralside.com/bloomcircuit/**
and opened from the "bloomcircuit" button in the Spiralside header.

- Pure static HTML/CSS/JS — no build step, no backend, no login.
- Projects and custom component packs save in the browser (localStorage)
  and export as JSON / laser-ready SVG, same as the Pi offline app.
- BloomCircuit's repo is the source of truth. Don't edit these files here.

## Updating to the latest BloomCircuit

```bash
# pull the newest BloomCircuit
cd ~/BloomCircuit && git checkout main && git pull
# copy only the web app files into Spiralside
cp index.html styles.css app.js components.js bloomcircuit.svg LICENSE ~/spiralside/bloomcircuit/
# ship it
cd ~/spiralside && git add bloomcircuit && git commit -m "Update BloomCircuit" && git push origin main
```
