let sim;

window.addEventListener('DOMContentLoaded', () => {
  const sldSpeed  = document.getElementById('sldSpeed');
  const sldCars   = document.getElementById('sldCars');
  const sldPolice = document.getElementById('sldPolice');
  const lblSpeed  = document.getElementById('lblSpeed');
  const lblCars   = document.getElementById('lblCars');
  const lblPolice = document.getElementById('lblPolice');
  const btnStart  = document.getElementById('btnStart');
  const btnPause  = document.getElementById('btnPause');
  const btnReset  = document.getElementById('btnReset');

  sim = new Simulation(parseInt(sldCars.value), parseInt(sldPolice.value));

  sldSpeed.addEventListener('input', () => {
    const v = parseInt(sldSpeed.value);
    lblSpeed.textContent = v + '×';
    sim.speed = v;
  });
  sldCars.addEventListener('input',   () => lblCars.textContent   = sldCars.value);
  sldPolice.addEventListener('input', () => lblPolice.textContent = sldPolice.value);

  btnStart.addEventListener('click', () => {
    sim.start();
    btnStart.disabled = true;
    btnPause.disabled = false;
  });
  btnPause.addEventListener('click', () => {
    sim.pause();
    btnStart.disabled = false;
    btnPause.disabled = true;
  });
  btnReset.addEventListener('click', () => {
    sim.reset(parseInt(sldCars.value), parseInt(sldPolice.value));
    btnStart.disabled = false;
    btnPause.disabled = true;
  });
});
