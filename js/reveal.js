// ===== Fade sections in as you scroll + footer year =====
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const revealEls = [...document.querySelectorAll(".reveal")];
const show = (el) => el.classList.add("visible");

// Show a section as soon as any part of it comes on screen (a high threshold can miss tall sections).
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { show(e.target); revealObserver.unobserve(e.target); }
    }), { threshold: 0, rootMargin: "0px 0px -40px 0px" })
  : null;

if (revealObserver) revealEls.forEach((el) => revealObserver.observe(el));

// Backup check on scroll/resize: anything that has reached the screen (or been scrolled past) is shown,
// so a section can never stay invisible.
function revealCheck() {
  const h = window.innerHeight;
  revealEls.forEach((el) => {
    if (!el.classList.contains("visible") && el.getBoundingClientRect().top < h - 20) show(el);
  });
}
window.addEventListener("scroll", revealCheck, { passive: true });
window.addEventListener("resize", revealCheck);
window.addEventListener("load", revealCheck);
revealCheck();
