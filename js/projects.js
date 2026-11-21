// ===== PROJECTS: carousel arrows + dots, filter chips, search =====
(() => {
  const section = document.querySelector("#projects");
  if (!section) return;

  const track = section.querySelector(".proj-track");
  const cards = [...section.querySelectorAll(".proj-card")];
  const chips = [...section.querySelectorAll(".chip")];
  const prev = section.querySelector(".car-btn.prev");
  const next = section.querySelector(".car-btn.next");
  const dotsBox = section.querySelector(".car-dots");
  const empty = section.querySelector(".proj-empty");
  const searchBox = section.querySelector(".proj-search");
  const searchInput = searchBox.querySelector("input");
  const searchBtn = searchBox.querySelector(".search-btn");

  let filter = "all";
  let query = "";

  // width of one card + the gap = how far one "step" scrolls
  const step = () => {
    const card = cards.find((c) => !c.hidden);
    if (!card) return track.clientWidth;
    return card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
  };
  const maxScroll = () => track.scrollWidth - track.clientWidth;

  function buildDots() {
    const pages = maxScroll() > 2 ? Math.round(maxScroll() / step()) + 1 : 1;
    dotsBox.innerHTML = "";
    if (pages < 2) return;
    for (let i = 0; i < pages; i++) {
      const d = document.createElement("button");
      d.tabIndex = -1;
      d.addEventListener("click", () => track.scrollTo({ left: i * step() }));
      dotsBox.appendChild(d);
    }
  }

  function update() {
    const x = track.scrollLeft;
    prev.disabled = x <= 2;
    next.disabled = x >= maxScroll() - 2;
    const i = Math.min(dotsBox.children.length - 1, Math.round(x / (step() || 1)));
    [...dotsBox.children].forEach((d, n) => d.classList.toggle("active", n === i));
  }

  function apply() {
    let shown = 0;
    cards.forEach((c) => {
      const okFilter = filter === "all" || c.dataset.cats.split(" ").includes(filter);
      const okQuery = !query || c.textContent.toLowerCase().includes(query);
      c.hidden = !(okFilter && okQuery);
      if (!c.hidden) shown++;
    });
    empty.hidden = shown > 0;
    track.scrollLeft = 0;
    buildDots();
    update();
  }

  prev.addEventListener("click", () => track.scrollBy({ left: -step() }));
  next.addEventListener("click", () => track.scrollBy({ left: step() }));

  let ticking = false;
  track.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  });
  window.addEventListener("resize", () => { buildDots(); update(); });

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("active", c === chip));
      filter = chip.dataset.filter;
      apply();
    })
  );

  searchBtn.addEventListener("click", () => {
    const open = searchBox.classList.toggle("open");
    if (open) searchInput.focus();
    else { searchInput.value = ""; query = ""; apply(); }
  });
  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    apply();
  });

  apply();
})();
