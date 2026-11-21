// ===== NAV: mobile menu + highlight the link for the section you're on =====
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav-links a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);

// highlight the nav link for the section in view
const links = [...document.querySelectorAll(".nav-links a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => s && navObserver.observe(s));
