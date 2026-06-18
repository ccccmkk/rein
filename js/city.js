const TILE = { ROAD: 0, HOME: 1, RESTAURANT: 2, HOSPITAL: 3, PARK: 4, WORKPLACE: 5 };
const TILE_CLR = ['#0d0d2a', '#c0392b', '#e67e22', '#2980b9', '#27ae60', '#8e44ad'];
const TILE_SIZE = 16;
const GRID = 40;

class City {
  constructor() {
    this.grid = Array.from({ length: GRID }, () => new Array(GRID).fill(TILE.ROAD));
    this.buildings = {
      [TILE.HOME]: [],
      [TILE.RESTAURANT]: [],
      [TILE.HOSPITAL]: [],
      [TILE.PARK]: [],
      [TILE.WORKPLACE]: []
    };
    this._used = new Set();
    this._build();
  }

  _canPlace(x, y, w, h) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 1 || ny < 1 || nx >= GRID - 1 || ny >= GRID - 1) return false;
        if (this._used.has(ny * GRID + nx)) return false;
      }
    return true;
  }

  _place(type, x, y, w, h) {
    if (!this._canPlace(x, y, w, h)) return false;
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) {
        this.grid[y + dy][x + dx] = type;
        this._used.add((y + dy) * GRID + (x + dx));
      }
    this.buildings[type].push({ x: x + Math.floor(w / 2), y: y + Math.floor(h / 2) });
    return true;
  }

  _build() {
    // Parks (5x5) in quadrants and center
    [[8, 8], [26, 8], [8, 26], [26, 26], [17, 17]]
      .forEach(([x, y]) => this._place(TILE.PARK, x, y, 5, 5));

    // Hospitals (3x3)
    [[17, 2], [17, 35], [2, 17], [35, 17]]
      .forEach(([x, y]) => this._place(TILE.HOSPITAL, x, y, 3, 3));

    // Workplaces (3x3)
    [[3, 3], [34, 3], [3, 34], [34, 34],
     [17, 11], [17, 26], [11, 17], [26, 17]]
      .forEach(([x, y]) => this._place(TILE.WORKPLACE, x, y, 3, 3));

    // Restaurants (3x2)
    [[10, 2], [26, 2], [10, 36], [26, 36],
     [2, 10], [36, 10], [2, 26], [36, 26],
     [14, 14], [24, 24]]
      .forEach(([x, y]) => this._place(TILE.RESTAURANT, x, y, 3, 2));

    // Homes (2x2) fill remaining spots on a 4-tile grid
    for (let y = 1; y < GRID - 3; y += 4)
      for (let x = 1; x < GRID - 3; x += 4)
        this._place(TILE.HOME, x, y, 2, 2);
  }

  tile(x, y) {
    if (x < 0 || x >= GRID || y < 0 || y >= GRID) return TILE.ROAD;
    return this.grid[y][x];
  }

  nearest(x, y, type) {
    const arr = this.buildings[type];
    if (!arr || !arr.length) return { pos: { x: 20, y: 20 }, dist: GRID * 2 };
    let best = arr[0], bd = Infinity;
    for (const b of arr) {
      const d = Math.abs(b.x - x) + Math.abs(b.y - y);
      if (d < bd) { bd = d; best = b; }
    }
    return { pos: best, dist: bd };
  }

  randomRoad() {
    let x, y, tries = 0;
    do {
      x = 1 + Math.floor(Math.random() * (GRID - 2));
      y = 1 + Math.floor(Math.random() * (GRID - 2));
      tries++;
    } while (this.grid[y][x] !== TILE.ROAD && tries < 1000);
    return { x, y };
  }
}
