class DQN {
  constructor() {
    this.epsilon      = 1.0;
    this.epsilonMin   = 0.05;
    this.epsilonDecay = 0.9998;
    this.gamma        = 0.95;
    this.batchSize    = 64;
    this.maxMemory    = 30000;
    this.memory       = [];
    this._pending     = false;
    this._trainCount  = 0;
    this._syncEvery   = 300;
    this.online       = this._net();
    this.target       = this._net();
    this._sync();
  }

  _net() {
    const m = tf.sequential();
    m.add(tf.layers.dense({ inputShape: [STATE_SIZE], units: 128, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 64,  activation: 'relu' }));
    m.add(tf.layers.dense({ units: ACTION_SIZE, activation: 'linear' }));
    m.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
    return m;
  }

  _sync() {
    this.target.setWeights(this.online.getWeights().map(w => w.clone()));
  }

  push(s, a, r, ns, done) {
    if (this.memory.length >= this.maxMemory) this.memory.shift();
    this.memory.push([s, a, r, ns, done]);
  }

  // Efficient batch inference for all birds
  actBatch(states) {
    const actions = new Array(states.length);
    const gi = [];
    for (let i = 0; i < states.length; i++) {
      if (Math.random() < this.epsilon) actions[i] = Math.floor(Math.random() * ACTION_SIZE);
      else gi.push(i);
    }
    if (gi.length > 0) {
      const gs = tf.tidy(() =>
        this.online.predict(tf.tensor2d(gi.map(i => states[i]))).argMax(1).dataSync()
      );
      for (let j = 0; j < gi.length; j++) actions[gi[j]] = gs[j];
    }
    return actions;
  }

  async trainAsync() {
    if (this._pending || this.memory.length < this.batchSize) return;
    this._pending = true;
    const batch = Array.from({ length: this.batchSize }, () =>
      this.memory[Math.floor(Math.random() * this.memory.length)]
    );
    const stT  = tf.tensor2d(batch.map(b => b[0]));
    const nsT  = tf.tensor2d(batch.map(b => b[3]));
    const qCur = await this.online.predict(stT).array();
    const qNxt = await this.target.predict(nsT).array();
    for (let i = 0; i < this.batchSize; i++) {
      const [, a, r, , done] = batch[i];
      qCur[i][a] = done ? r : r + this.gamma * Math.max(...qNxt[i]);
    }
    const tgtT = tf.tensor2d(qCur);
    await this.online.fit(stT, tgtT, { epochs: 1, verbose: 0 });
    stT.dispose(); nsT.dispose(); tgtT.dispose();
    this._trainCount++;
    if (this._trainCount % this._syncEvery === 0) this._sync();
    if (this.epsilon > this.epsilonMin) this.epsilon *= this.epsilonDecay;
    this._pending = false;
  }
}
