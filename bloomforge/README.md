# /bloomforge — BloomForge laser-cut drafting editor on spiralside.com

This folder is a **copy** of the web app from
[Etsimulocto/BloomForge](https://github.com/Etsimulocto/BloomForge)
(`main`, commit `10af7a2`, build 0.1.33). It is served at
**spiralside.com/bloomforge/** and opened from the "bloomforge" button in the
Spiralside header.

- Single self-contained `index.html`: no build step, no backend, no login.
- Projects save/open as JSON and export SVG for xTool Creative Space, same as on the Pi.
- BloomForge's repo is the source of truth. Don't edit these files here.

## Updating to the latest BloomForge

```bash
# pull the newest BloomForge
cd ~/BloomForge && git checkout main && git pull
# copy only the web app files into Spiralside
cp index.html bloomforge-icon.svg ~/spiralside/bloomforge/
# ship it
cd ~/spiralside && git add bloomforge && git commit -m "Update BloomForge" && git push origin main
```
