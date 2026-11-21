// ===== PROJECT DETAIL: gallery + YouTube demo + full-size screenshot viewer =====
// The demo video is a YouTube link in the stage's data-youtube attribute. With no link yet,
// the gallery works as screenshots only and the button reads "Demo video coming soon".
(() => {
  const stage = document.getElementById("pd-stage");
  if (!stage) return;
  const still = document.getElementById("pd-still");
  const ph = document.getElementById("pd-ph");
  const yt = document.getElementById("pd-yt");
  const bigPlay = document.getElementById("pd-bigplay");
  const watch = document.getElementById("pd-watch");
  const thumbs = [...document.querySelectorAll(".pd-thumb")];
  const videoThumb = thumbs.find((t) => t.dataset.kind === "video");

  // ---------- YouTube link ----------
  function youtubeId(url) {
    if (!url) return null;
    const m = url.trim().match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(url.trim()) ? url.trim() : null);
  }
  const ytId = youtubeId(stage.dataset.youtube);
  const hasVideo = !!ytId;
  document.body.classList.toggle("has-video", hasVideo);

  if (videoThumb && hasVideo) {
    videoThumb.closest("li").hidden = false;
    const img = videoThumb.querySelector("img[data-yt-thumb]");
    if (img) img.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  }
  if (watch) {
    const label = watch.querySelector(".pd-watch-label");
    if (label) label.textContent = "Demo Video";
  }

  const visible = (t) => !t.closest("li").hidden;
  const isPlayable = (t) => t === videoThumb && hasVideo;
  let current = thumbs.find((t) => t.classList.contains("active") && visible(t)) || thumbs.find(visible);

  // ---------- which screenshots can be opened full size ----------
  function shots() {
    return thumbs.filter((t) => visible(t) && !isPlayable(t) && !t.dataset.clip).map((t) => {
      const img = t.querySelector(".pd-thumb-img img");
      return img && img.getAttribute("src")
        ? { t, src: img.src, cap: t.dataset.alt || t.querySelector(".pd-thumb-cap")?.textContent || "" }
        : null;
    }).filter(Boolean);
  }
  const canZoom = () => !yt.innerHTML && shots().some((s) => s.t === current);

  const expand = document.createElement("button");
  expand.type = "button";
  expand.className = "pd-expand";
  expand.setAttribute("aria-label", "View screenshot full size");
  expand.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  stage.appendChild(expand);

  function updateZoomable() {
    const z = canZoom();
    stage.classList.toggle("zoomable", z);
    expand.hidden = !z;
  }

  // ---------- gallery ----------
  let clip = null;
  function stopVideo() {
    yt.innerHTML = "";
    yt.hidden = true;
    if (clip) { clip.pause(); clip.hidden = true; }
  }
  function playClip(thumb) {
    if (!clip) {
      clip = document.createElement("video");
      clip.className = "pd-clip";
      clip.muted = true; clip.loop = true; clip.playsInline = true; clip.autoplay = true;
      clip.setAttribute("muted", ""); clip.setAttribute("playsinline", "");
      stage.insertBefore(clip, still.nextSibling);
    }
    const src = new URL(thumb.dataset.clip, location.href).href;
    if (clip.src !== src) { clip.poster = thumb.querySelector(".pd-thumb-img img")?.src || ""; clip.src = src; }
    clip.setAttribute("aria-label", thumb.dataset.alt || "Gameplay clip");
    clip.hidden = false;
    still.hidden = true;
    ph.hidden = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { clip.controls = true; } else { clip.play().catch(() => { clip.controls = true; }); }
  }

  function show(thumb) {
    if (!thumb) return;
    current = thumb;
    stopVideo();
    thumbs.forEach((t) => t.classList.toggle("active", t === thumb));
    const img = thumb.querySelector(".pd-thumb-img img");
    if (img && img.getAttribute("src")) {
      still.src = img.src;
      still.alt = thumb.dataset.alt || thumb.querySelector(".pd-thumb-cap")?.textContent || "";
      stage.style.setProperty("--still", `url("${img.src}")`); // blurred backdrop behind uncropped shots
      still.hidden = false;
      ph.hidden = true;
    } else {
      // no screenshot yet -> show the illustration big
      still.hidden = true;
      ph.innerHTML = "";
      const ill = thumb.querySelector(".ill");
      if (ill) ph.appendChild(ill.cloneNode(true));
      ph.setAttribute("aria-label", thumb.dataset.alt || "");
      ph.hidden = false;
    }
    if (thumb.dataset.clip) playClip(thumb);
    bigPlay.hidden = !isPlayable(thumb);
    updateZoomable();
  }

  function playVideo() {
    if (!hasVideo) return;
    show(videoThumb);
    yt.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1"
      title="Demo video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    yt.hidden = false;
    bigPlay.hidden = true;
    updateZoomable();
  }

  // ---------- right-hand text: the overview, or what the picked screenshot shows ----------
  const lead = document.getElementById("pd-lead");
  const kicker = document.getElementById("pd-kicker");
  const overviewHtml = lead ? lead.innerHTML : "";
  function describe(thumb) {
    if (!lead || !kicker) return;
    const tpl = thumb && thumb.querySelector("template.pd-desc");
    const html = tpl ? tpl.innerHTML : overviewHtml;
    if (lead.innerHTML === html) return;
    lead.innerHTML = html;
    kicker.hidden = !tpl;
    if (tpl) document.getElementById("pd-kicker-name").textContent = thumb.querySelector(".pd-thumb-cap").textContent;
    lead.classList.remove("swap"); void lead.offsetWidth; lead.classList.add("swap");
  }
  const back = document.getElementById("pd-feature-back");
  if (back) back.addEventListener("click", () => describe(null));

  thumbs.forEach((t) => t.addEventListener("click", () => {
    if (isPlayable(t)) playVideo(); else show(t);
    describe(t);
  }));
  bigPlay.addEventListener("click", (e) => { e.stopPropagation(); playVideo(); });
  if (watch) watch.addEventListener("click", () => {
    stage.scrollIntoView({ behavior: "smooth", block: "center" });
    playVideo();
  });

  // ---------- full-size viewer ----------
  const box = document.createElement("div");
  box.className = "pd-lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Screenshot viewer");
  box.innerHTML = `
    <img alt="" />
    <p></p>
    <button class="pd-lb-close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <button class="pd-lb-prev" aria-label="Previous screenshot"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
    <button class="pd-lb-next" aria-label="Next screenshot"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>`;
  document.body.appendChild(box);
  const boxImg = box.querySelector("img");
  const boxCap = box.querySelector("p");
  const btnPrev = box.querySelector(".pd-lb-prev");
  const btnNext = box.querySelector(".pd-lb-next");
  let list = [];
  let at = 0;
  let returnFocus = null;

  function render() {
    const s = list[at];
    boxImg.src = s.src;
    boxImg.alt = s.cap;
    boxCap.textContent = list.length > 1 ? `${s.cap}  ·  ${at + 1} / ${list.length}` : s.cap;
    btnPrev.hidden = btnNext.hidden = list.length < 2;
  }
  function open() {
    list = shots();
    if (!list.length) return;
    at = Math.max(0, list.findIndex((s) => s.t === current));
    returnFocus = document.activeElement;
    render();
    box.hidden = false;
    document.body.style.overflow = "hidden";
    box.querySelector(".pd-lb-close").focus();
  }
  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    show(list[at].t); // keep the page on the last screenshot viewed
    describe(list[at].t);
    if (returnFocus) returnFocus.focus();
  }
  const step = (d) => { at = (at + d + list.length) % list.length; render(); };

  expand.addEventListener("click", (e) => { e.stopPropagation(); open(); });
  stage.addEventListener("click", (e) => {
    if (e.target.closest(".pd-yt")) return;
    if (isPlayable(current) && !yt.innerHTML) playVideo();
    else if (canZoom()) open();
  });
  box.querySelector(".pd-lb-close").addEventListener("click", close);
  btnPrev.addEventListener("click", () => step(-1));
  btnNext.addEventListener("click", () => step(1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Tab") { // keep focus inside the viewer
      const f = [...box.querySelectorAll("button:not([hidden])")];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  let x0 = null;
  box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40 && list.length > 1) step(dx < 0 ? 1 : -1);
    x0 = null;
  });

  show(current);
})();
