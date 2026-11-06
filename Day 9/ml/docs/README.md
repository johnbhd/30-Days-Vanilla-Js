# ML Heroes - 2D MOBA Prototype

A browser-based 2D MOBA prototype featuring 10 Mobile Legends: Bang Bang heroes on a 3-lane map (Land of Dawn inspired).

## Project Structure

```
ml/
├── index.html              # Entry point
├── css/
│   └── style.css           # Game UI styling
├── js/
│   ├── config.js           # Game constants + 10 hero definitions
│   ├── utils.js            # Math helpers, image loader
│   ├── input.js            # Click/touch to move
│   ├── map.js              # Tile map, lanes, jungle, bases, turrets
│   ├── hero.js             # Hero class (movement, rendering, stats)
│   ├── renderer.js         # Canvas rendering
│   └── main.js             # Game loop, camera follow
├── assets/
│   ├── sprites/heroes/     # 10 hero folders (miya, tigreal, alucard, layla, angela, gusion, pharsa, balmond, nana, saber)
│   ├── sprites/tiles/      # Map tile sprites
│   ├── sprites/effects/    # Skill effect sprites
│   ├── sprites/ui/         # HUD, buttons, health bars
│   └── maps/
│       └── land_of_dawn.json
└── docs/
    ├── RULES.md            # Mandatory development & context logging rules
    ├── context/            # Dated context markdown files for all features & fixes
    ├── GAMEPLAY_PHASES.md  # Multi-phase development roadmap
    ├── HERO_DESIGN.md      # Detailed specs for all 10 heroes
    ├── MAP_LAYOUT.md       # Land of Dawn map design notes
    ├── PROJECT_OVERVIEW.md # Architecture & controls summary
    ├── TECHNICAL_SPEC.md   # Low-level engine specifications
    └── README.md           # Quick start summary
```

## The 10 Heroes

| Hero | Role | Lane |
|------|------|------|
| Miya | Marksman | Gold Lane |
| Layla | Marksman | Gold Lane |
| Tigreal | Tank | Roam |
| Angela | Support | Roam |
| Alucard | Fighter / Assassin | Jungle |
| Balmond | Fighter | Jungle / EXP |
| Gusion | Assassin | Jungle |
| Saber | Assassin | Jungle / Roam |
| Pharsa | Mage | Mid Lane |
| Nana | Mage | Mid Lane |

## How to Run

1. Open `index.html` in a modern browser, or serve with a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   # Then visit http://localhost:8000/ml/index.html
   ```
2. Click anywhere on the map to move your hero.
3. The camera follows the selected hero.

## Adding Hero Sprites

Place sprite images in each hero folder, e.g.:
- `assets/sprites/heroes/miya/idle.png`
- `assets/sprites/heroes/alucard/idle.png`

If no sprite exists, the hero renders as a colored circle with their initial.

## Map Layout

- 3 vertical lanes: Gold (x=8), Mid (x=16), EXP (x=24)
- Horizontal river through the middle
- Jungle patches between lanes
- Blue base (left) and Red base (right) with crystals
- Turrets along each lane (3 per side per lane)

## Next Steps

- Add hero selection screen to pick from all 10 heroes
- Add skill buttons (Q/W/E/R) per hero
- Add minion waves spawning down lanes
- Add turret combat and base crystal destruction
- Add Turtle and Lord river objectives
- Add multiplayer (WebSocket) or bots
