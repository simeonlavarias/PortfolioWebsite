/* ----- SAFE STORAGE (private browsing can block localStorage) ----- */
function readStoredTheme() {
  try {
    return localStorage.getItem("theme");
  } catch (e) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    /* theme just won't persist */
  }
}

/* ----- NAVIGATION BAR FUNCTION ----- */
function myMenuFunction(btn) {
  const menuBtn = document.getElementById("myNavMenu");
  const isOpen = menuBtn.classList.toggle("responsive");
  if (btn) {
    btn.setAttribute("aria-expanded", String(isOpen));
    const icon = btn.querySelector("i");
    if (icon) icon.className = isOpen ? "uil uil-times" : "uil uil-bars";
  }
}

function closeMobileMenu() {
  const menuBtn = document.getElementById("myNavMenu");
  if (!menuBtn.classList.contains("responsive")) return;
  menuBtn.classList.remove("responsive");
  const hamburger = document.querySelector(".hamburger-btn");
  if (hamburger) {
    hamburger.setAttribute("aria-expanded", "false");
    const icon = hamburger.querySelector("i");
    if (icon) icon.className = "uil uil-bars";
  }
}

document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", closeMobileMenu));

// Close the mobile menu when tapping outside the nav bar
document.addEventListener("click", e => {
  if (!e.target.closest("#header")) closeMobileMenu();
});

/* ----- IMAGE LIGHTBOX FOR EXPERIENCE ATTACHMENTS ----- */
const lightboxOverlay = document.createElement("div");
lightboxOverlay.className = "lightbox-overlay";
lightboxOverlay.innerHTML = '<img class="lightbox-img" alt="">';
document.body.appendChild(lightboxOverlay);
const lightboxImg = lightboxOverlay.querySelector(".lightbox-img");

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || "";
  lightboxOverlay.classList.add("active");
}

function closeLightbox() {
  lightboxOverlay.classList.remove("active");
}

document.querySelectorAll(".exp-attachment-img").forEach(thumb => {
  thumb.addEventListener("click", () => openLightbox(thumb.src, thumb.alt));
});

lightboxOverlay.addEventListener("click", closeLightbox);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeLightbox();
    closeMobileMenu();
  }
});

/* ----- HEADER STATE ON SCROLL ----- */
function headerShadow() {
  const navHeader = document.getElementById("header");
  navHeader.classList.toggle("scrolled", document.documentElement.scrollTop > 50);
}

/* ----- SCROLL REVEAL (native IntersectionObserver — no CDN needed) ----- */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('active', entry.isIntersecting);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ----- 3D TILT + SPOTLIGHT ON CARDS -----
   Elements with data-tilt="<max degrees>" rotate toward the pointer.
   .is-hovered drives the "pop-out" of inner elements; .is-tilting keeps the
   perspective transform alive until the card has eased back flat. */
function initTilt() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduceMotion) return;

  const states = [];

  document.querySelectorAll("[data-tilt]").forEach(el => {
    const max = parseFloat(el.dataset.tilt) || 8;
    const s = { rect: null, tx: 0, ty: 0, x: 0, y: 0, hover: false, leftAt: 0, raf: 0 };
    states.push(s);

    const tick = () => {
      s.x += (s.tx - s.x) * 0.15;
      s.y += (s.ty - s.y) * 0.15;
      el.style.setProperty("--rx", s.y.toFixed(3) + "deg");
      el.style.setProperty("--ry", s.x.toFixed(3) + "deg");

      const settled = Math.abs(s.x) < 0.01 && Math.abs(s.y) < 0.01;
      if (s.hover || !settled || performance.now() - s.leftAt < 700) {
        s.raf = requestAnimationFrame(tick);
      } else {
        s.raf = 0;
        el.classList.remove("is-tilting");
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
      }
    };

    const run = () => {
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    };

    el.addEventListener("pointerenter", e => {
      if (e.pointerType === "touch") return;
      s.hover = true;
      s.rect = el.getBoundingClientRect();
      el.classList.add("is-tilting", "is-hovered");
      run();
    });

    el.addEventListener("pointermove", e => {
      if (!s.hover) return;
      const r = s.rect || (s.rect = el.getBoundingClientRect());
      const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      s.tx = (px - 0.5) * 2 * max;
      s.ty = (0.5 - py) * 2 * max;
      el.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      run();
    });

    el.addEventListener("pointerleave", () => {
      s.hover = false;
      s.tx = 0;
      s.ty = 0;
      s.rect = null;
      s.leftAt = performance.now();
      el.classList.remove("is-hovered");
      run();
    });
  });

  // Cached rects go stale when the page scrolls under a hovered card
  window.addEventListener("scroll", () => states.forEach(s => { s.rect = null; }), { passive: true });
}

/* ----- CHANGE ACTIVE NAV LINK ----- */
const sections = document.querySelectorAll('section[id]');

function scrollActive() {
  const scrollY = window.scrollY;
  sections.forEach(current => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 50;
    const sectionId = current.getAttribute('id');
    const link = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
    if (!link) return;
    link.classList.toggle('active-link', scrollY > sectionTop && scrollY <= sectionTop + sectionHeight);
  });
}

/* ----- SINGLE THROTTLED SCROLL HANDLER ----- */
const progressBar = document.getElementById("scrollProgressBar");
const scrollTopBtn = document.getElementById("scrollTopBtn");
let scrollTicking = false;

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      headerShadow();
      scrollActive();
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + "%";
      scrollTopBtn.classList.toggle("show", scrollTop > 300);
      scrollTicking = false;
    });
    scrollTicking = true;
  }
});

/* ----- DARK / LIGHT THEME TOGGLE ----- */
const toggleButton = document.getElementById("theme-toggle");

function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  // Keep the pre-paint class in sync, otherwise switching dark -> light
  // left the page background dark.
  document.documentElement.classList.toggle("dark-theme-preload", isDark);
  toggleButton.innerHTML = isDark ? "𖤓 Light Mode" : "⏾ Dark Mode";
  storeTheme(theme);
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

setTheme(readStoredTheme() || 'light');

toggleButton.addEventListener("click", () => {
  setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark");
});

/* ----- PROJECTS CATEGORY TOGGLE ----- */
function showProjects(category) {
  document.getElementById("projectCategories").style.display = "none";
  document.getElementById("backButton").style.display = "block";
  ["software", "networking", "ml"].forEach(id => {
    const section = document.getElementById(id);
    const isActive = id === category;
    section.style.display = isActive ? "grid" : "none";
    section.classList.toggle("show", isActive);
    if (isActive) {
      // stagger the cards' entrance animation
      section.querySelectorAll(".project-card").forEach((card, i) => card.style.setProperty("--i", i));
    }
  });
}

function goBack() {
  document.getElementById("projectCategories").style.display = "";
  document.getElementById("backButton").style.display = "none";
  ["software", "networking", "ml"].forEach(id => {
    const section = document.getElementById(id);
    section.style.display = "none";
    section.classList.remove("show");
  });
}

/* ----- SHOW UNAVAILABLE TOOLTIP FOR EMPTY LINKS ----- */
function showUnavailableMessage(button, event) {
  event.preventDefault();
  if (button.getAttribute('href') !== '#') return;

  const tooltip = document.createElement('span');
  tooltip.className = "unavailable-tip";
  tooltip.textContent = "Not available yet!";

  const rect = button.getBoundingClientRect();
  tooltip.style.left = rect.left + window.scrollX + 'px';
  tooltip.style.top = rect.top + window.scrollY - 38 + 'px';

  document.body.appendChild(tooltip);
  requestAnimationFrame(() => tooltip.classList.add("show"));

  setTimeout(() => {
    tooltip.classList.remove("show");
    setTimeout(() => tooltip.remove(), 400);
  }, 1600);
}

/* ----- SCROLL TO TOP ----- */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ----- FORM ERROR DISPLAY ----- */
function showFormError(msg) {
  let err = document.getElementById('form-error');
  if (!err) {
    err = document.createElement('p');
    err.id = 'form-error';
    err.style.cssText = 'color:#e53e3e;font-size:14px;margin-top:8px;';
    document.querySelector('.form-button').insertAdjacentElement('afterend', err);
  }
  err.textContent = msg;
  setTimeout(() => { err.textContent = ''; }, 4000);
}

/* ----- LOADING SCREEN + TYPED.JS ----- */
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".container").classList.remove("visible");

  initTilt();

  const loadingText = document.getElementById("loading-text");
  const fullText = "<Hello, world! />";
  let index = 0;

  function typeLoaderText() {
    if (index < fullText.length) {
      loadingText.textContent += fullText.charAt(index++);
      setTimeout(typeLoaderText, 100);
    } else {
      setTimeout(() => {
        document.getElementById("loader").classList.add("hidden");
        setTimeout(() => {
          document.querySelector(".container").classList.add("visible");
          // Tell the 3D scene (hero3d.js) to start its fly-in
          document.documentElement.classList.add("site-ready");
          document.dispatchEvent(new Event("site:ready"));
          initReveal();

          if (window.Typed) {
            new Typed(".typedText", {
              strings: ["Simeon Carlos Lavarias.", "a Cybersecurity GRC Engineer!"],
              loop: true,
              typeSpeed: 100,
              backSpeed: 80,
              backDelay: 2000
            });
          } else {
            // typed.js CDN unavailable: still show the name
            document.querySelector(".typedText").textContent = "Simeon Carlos Lavarias.";
          }
        }, 500);
      }, 800);
    }
  }

  typeLoaderText();

  /* ----- KEYBOARD NAVIGATION FOR PROJECT CATEGORIES ----- */
  const projectBoxes = document.querySelectorAll('#projectCategories .project-box');
  projectBoxes.forEach((box, i) => {
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        projectBoxes[(i + 1) % projectBoxes.length].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        projectBoxes[(i - 1 + projectBoxes.length) % projectBoxes.length].focus();
      }
    });
  });

  /* ----- FORM VALIDATION ----- */
  const form = document.querySelector('.form-control form');
  if (form) {
    form.addEventListener('submit', e => {
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      if (!name || !email || !message) {
        e.preventDefault();
        showFormError('Please fill in all fields.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.preventDefault();
        showFormError('Please enter a valid email address.');
      }
    });
  }
});
