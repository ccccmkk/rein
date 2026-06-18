const COLS = 7, ROWS = 7, SPACING = 12;
const SPEED_LIMIT = 5;   // units/sec
const LIGHT_CYCLE = 6;   // seconds per phase
const ROAD_W      = 4;   // road width (visual)

class RoadNetwork {
  constructor() {
    this.nodes = [];
    this.adj   = [];
    this._build();
  }

  _build() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = r * COLS + c;
        this.nodes.push({
          id,
          x: (c - (COLS - 1) / 2) * SPACING,
          z: (r - (ROWS - 1) / 2) * SPACING,
          phase: Math.random() < 0.5 ? 'EW' : 'NS',
          timer: Math.random() * LIGHT_CYCLE
        });
        this.adj.push([]);
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = r * COLS + c;
        if (c + 1 < COLS) { const n = r * COLS + c + 1; this.adj[id].push(n); this.adj[n].push(id); }
        if (r + 1 < ROWS) { const n = (r+1)*COLS+c;    this.adj[id].push(n); this.adj[n].push(id); }
      }
    }
  }

  update(dt) {
    for (const n of this.nodes) {
      n.timer += dt;
      if (n.timer >= LIGHT_CYCLE) { n.timer -= LIGHT_CYCLE; n.phase = n.phase === 'EW' ? 'NS' : 'EW'; }
    }
  }

  // Can the car coming from `fromId` enter intersection `nodeId`?
  canGo(nodeId, fromId) {
    const node = this.nodes[nodeId], from = this.nodes[fromId];
    const isEW = Math.abs(node.x - from.x) > 0.1;
    return (isEW && node.phase === 'EW') || (!isEW && node.phase === 'NS');
  }

  getPos(fromId, toId, t) {
    const a = this.nodes[fromId], b = this.nodes[toId];
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
  }

  findPath(from, to) {
    if (from === to) return [from];
    const visited = new Set([from]);
    const queue = [[from, [from]]];
    while (queue.length) {
      const [cur, path] = queue.shift();
      for (const next of this.adj[cur]) {
        if (next === to) return [...path, next];
        if (!visited.has(next)) { visited.add(next); queue.push([next, [...path, next]]); }
      }
    }
    return [from];
  }

  randomNode() { return Math.floor(Math.random() * this.nodes.length); }
}
