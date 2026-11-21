// ===== OIP: album gallery + slideshow =====
// Each gallery tile is an album (data-folder). Its photos live in images/oip/<folder>/1.jpg, 2.jpg, …
// We find them by loading 1.jpg, 2.jpg, … until one is missing, so nothing needs listing by hand.
// Clicking an album plays its photos in the big display; after its last photo it moves on to the next album.
(() => {
  const stage = document.getElementById("oip-stage");
  if (!stage) return;
  const slide = document.getElementById("oip-slide");
  const cap = document.getElementById("oip-cap");
  const count = document.getElementById("oip-count");
  const dotsBox = document.getElementById("oip-dots");
  const playBtn = document.getElementById("oip-play");
  const DUR = 4000;       // ms per photo
  const MAX_PHOTOS = 40;  // per album, safety cap
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const albums = [...document.querySelectorAll(".oip-photo")].map((el) => ({
    el,
    name: el.dataset.album,
    folder: el.dataset.folder,
    photos: [],
    done: false,
  }));

  let a = 0;          // current album
  let p = 0;          // current photo in that album
  let timer = null;
  let paused = reduceMotion;
  let dots = [];

  // ---------- find each album's photos ----------
  const loadImg = (src) => new Promise((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(src);
    im.onerror = fail;
    im.src = src;
  });

  async function probe(album) {
    for (let n = 1; n <= MAX_PHOTOS; n++) {
      try { album.photos.push(await loadImg(`images/oip/${album.folder}/${n}.jpg`)); }
      catch { break; }
      if (n === 1) setCover(album);
      onAlbumGrew(album);
    }
    album.done = true;
    onAlbumGrew(album);
  }

  function setCover(album) {
    const img = document.createElement("img");
    img.src = album.photos[0];
    img.alt = "";
    album.el.prepend(img);
    album.el.classList.add("has-cover");
  }

  function onAlbumGrew(album) {
    const badge = album.el.querySelector(".oip-badge");
    const n = album.photos.length;
    badge.hidden = n === 0;
    badge.textContent = n + (n === 1 ? " photo" : " photos");
    if (album === albums[a]) {
      const wasEmpty = !slide.querySelector("img");
      buildDots();
      if (wasEmpty && n > 0) showPhoto();
      else updateMeta();
    }
  }

  // ---------- rendering ----------
  function buildDots() {
    const n = Math.max(1, albums[a].photos.length);
    dotsBox.innerHTML = "";
    dots = Array.from({ length: n }, (_, k) => {
      const d = document.createElement("button");
      d.setAttribute("aria-label", `Show photo ${k + 1}`);
      d.addEventListener("click", () => go(a, k));
      dotsBox.appendChild(d);
      return d;
    });
  }

  function updateMeta() {
    const album = albums[a];
    const n = album.photos.length;
    cap.textContent = album.name;
    count.textContent = n ? `${p + 1} / ${n}` : album.done ? "0 / 0" : "…";
    albums.forEach((x, k) => x.el.classList.toggle("active", k === a));
    dots.forEach((d, k) => {
      d.classList.toggle("done", k < p);
      if (k !== p) d.classList.remove("active");
    });
    if (dots[p] && !dots[p].classList.contains("active")) {
      void dots[p].offsetWidth; // restart progress animation
      dots[p].classList.add("active");
    }
  }

  function showPhoto() {
    const album = albums[a];
    slide.innerHTML = "";
    if (album.photos.length) {
      const img = document.createElement("img");
      img.src = album.photos[p];
      img.alt = `${album.name}, photo ${p + 1}`;
      slide.appendChild(img);
    } else {
      slide.appendChild(album.el.querySelector(".ph").cloneNode(true)); // album still empty
    }
    dots.forEach((d) => d.classList.remove("active"));
    updateMeta();
  }

  // ---------- navigation ----------
  function go(albumIdx, photoIdx) {
    const newAlbum = (albumIdx + albums.length) % albums.length;
    const changed = newAlbum !== a;
    a = newAlbum;
    p = photoIdx;
    if (changed || dots.length !== Math.max(1, albums[a].photos.length)) buildDots();
    showPhoto();
    schedule();
  }

  function step(dir) {
    const n = albums[a].photos.length;
    if (dir > 0) {
      if (p + 1 < n) go(a, p + 1);
      else go(a + 1, 0);                                  // next album
    } else {
      if (p > 0) go(a, p - 1);
      else {
        const prev = albums[(a - 1 + albums.length) % albums.length];
        go(a - 1, Math.max(0, prev.photos.length - 1));   // last photo of previous album
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!paused) timer = setTimeout(() => step(1), DUR);
  }

  function setPaused(v) {
    paused = v;
    stage.classList.toggle("paused", v);
    playBtn.setAttribute("aria-label", v ? "Play slideshow" : "Pause slideshow");
    schedule();
  }

  albums.forEach((album, k) => album.el.addEventListener("click", () => {
    go(k, 0);
    if (window.innerWidth < 1100) stage.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  document.getElementById("oip-prev").addEventListener("click", () => step(-1));
  document.getElementById("oip-next").addEventListener("click", () => step(1));
  playBtn.addEventListener("click", () => setPaused(!paused));

  stage.tabIndex = 0;
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  let x0 = null;
  stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    x0 = null;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(timer);
    else schedule();
  });

  buildDots();
  setPaused(paused);
  // oip.html#zoo, #aquarium, … (linked from the home page tiles) opens that album first
  const startAlbum = Math.max(0, albums.findIndex((x) => "#" + x.folder === location.hash));
  go(startAlbum, 0);
  albums.forEach(probe);
})();
