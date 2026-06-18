let sim;

window.addEventListener('DOMContentLoaded', () => {
  const sldSpeed = document.getElementById('sldSpeed');
  const sldBirds = document.getElementById('sldBirds');
  const lblSpeed = document.getElementById('lblSpeed');
  const lblBirds = document.getElementById('lblBirds');
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnReset = document.getElementById('btnReset');

  sim = new Simulation(parseInt(sldBirds.value));

  sldSpeed.addEventListener('input', () => {
    lblSpeed.textContent = sldSpeed.value + '×';
    sim.speed = parseInt(sldSpeed.value);
  });
  sldBirds.addEventListener('input', () => lblBirds.textContent = sldBirds.value);

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
    sim.reset(parseInt(sldBirds.value));
    btnStart.disabled = false;
    btnPause.disabled = true;
  });
});
