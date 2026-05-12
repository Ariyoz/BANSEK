/* ================================================
   BANSEK Pure Water — nav.js
   Navbar toggle + scroll effect (no imports needed)
   ================================================ */

// ── Mobile menu toggle ────────────────────────────
function toggleMenu() {
  document.getElementById('nav-menu').classList.toggle('open');
}
window.toggleMenu = toggleMenu;

// ── Close menu when a link is clicked ────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('#nav-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      document.getElementById('nav-menu').classList.remove('open');
    });
  });
});

// ── Navbar scroll effect ──────────────────────────
window.addEventListener('scroll', function () {
  var nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Scroll-in animation ───────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(
    '.product-card, .feature-card, .testimonial-card, .faq-item, .stat-item, .process-step, .about-float-card, .about-float-card2'
  ).forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});
