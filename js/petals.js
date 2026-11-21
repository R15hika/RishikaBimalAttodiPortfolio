// ===== Falling cherry blossom petals =====
// Petals spawn at random gaps (not a fixed beat) and each starts at a random point in its fall,
// so they drift down one by one instead of in waves. Spawning pauses while the tab is hidden,
// so no backlog of petals drops all at once when you come back.
const petals = document.querySelector(".petals");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MAX_PETALS = 22;

function spawnPetal(midFall = false) {
  if (petals.childElementCount >= MAX_PETALS) return;
  const p = document.createElement("span");
  p.className = "petal";
  const size = 10 + Math.random() * 8;
  const duration = 8 + Math.random() * 7;
  p.style.left = Math.random() * 100 + "vw";
  p.style.width = size + "px";
  p.style.height = size + "px";
  p.style.setProperty("--drift", (Math.random() * 200 - 100) + "px");
  p.style.animationDuration = duration + "s";
  // on page load, start some petals part-way down so the screen isn't empty and they're staggered
  if (midFall) p.style.animationDelay = -(Math.random() * duration * 0.8) + "s";
  petals.appendChild(p);
  p.addEventListener("animationend", () => p.remove());
}

function scheduleNext() {
  setTimeout(() => {
    if (!document.hidden) spawnPetal();
    scheduleNext();
  }, 500 + Math.random() * 1400); // random gap between 0.5s and 1.9s
}

if (petals && !reduceMotion) {
  for (let i = 0; i < 8; i++) spawnPetal(true);
  scheduleNext();
}
