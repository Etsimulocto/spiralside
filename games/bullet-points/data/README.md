# Editing game data

These JSON files are meant to be easy to edit with a text editor. Keep the JSON punctuation intact: double quotes around names and values, commas between items, and no comma after the last item.

## Files

- `settings.json` — paper/ink colors, scroll speeds, player defaults, display options, sidewall glyphs, and Wall of Death setup
- `controls.json` — keyboard keys, gamepad axes/buttons, and touch dead zone
- `weapons.json` — weapon names and starter tuning values
- `pickups.json` — pickup names and effects
- `enemies.json` — enemy stats and behavior identifiers
- `obstacles.json` — walls, doors, and collision behavior
- `word-sets/default.json` — background and entity words, including the editable `horizontalWalls` word bank
- `spawn-patterns.json` — groups and arrangements of enemies or obstacles
- `menu.json` — menu button labels and settings-menu wording, including slot actions
- `feeds/default.json` — selects which files a feed uses

Weapons and pickups are loaded by the current game loop. Weapon entries define glyphs, rate, spread, projectile count, and beam settings; pickup entries define their effect, amount, weight, and duration. Other combat content is still a starter schema. Behavior names such as `chase` or `restoreHealth` are identifiers, not code you should need to edit for routine tuning.


The settings dialog reads its button and status wording from `menu.json`. Three browser-local save slots currently preserve the scaffold player's position and settings; expand the save snapshot when game progress is added.


Press F8 to open the built-in JSON editor. It supports one data file at a time, JSON validation, browser-local drafts, downloads, and reset to the repository copy. Weapons, pickups, and the random drop generator connect to gameplay. Horizontal wall words come from `word-sets/default.json`, alternate their open side, and cap at 90% of the interior room width so a route remains around each wall.
