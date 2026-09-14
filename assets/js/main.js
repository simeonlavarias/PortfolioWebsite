/* ----- NAVIGATION BAR FUNCTION ----- */
function myMenuFunction() {
  const menuBtn = document.getElementById("myNavMenu");
  menuBtn.className = menuBtn.className === "nav-menu" ? "nav-menu responsive" : "nav-menu";
}

/* ----- HEADER SHADOW ----- */
function headerShadow() {
  const navHeader = document.getElementById("header");
  const scrolled = document.documentElement.scrollTop > 50;
  navHeader.style.boxShadow = scrolled ? "0 1px 6px rgba(0, 0, 0, 0.1)" : "none";
  navHeader.style.height = scrolled ? "70px" : "90px";
  navHeader.style.lineHeight = scrolled ? "70px" : "90px";
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
      progressBar.style.width = (scrollTop / docHeight) * 100 + "%";
      scrollTopBtn.classList.toggle("show", scrollTop > 300);
      scrollTicking = false;
    });
    scrollTicking = true;
  }
});

/* ----- DARK / LIGHT THEME TOGGLE ----- */
const toggleButton = document.getElementById("theme-toggle");

function setTheme(theme) {
  document.body.classList.toggle("dark-theme", theme === "dark");
  toggleButton.innerHTML = theme === "dark" ? "𖤓 Light Mode" : "⏾ Dark Mode";
  localStorage.setItem('theme', theme);
}

setTheme(localStorage.getItem('theme') || 'light');

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
  });
}

function goBack() {
  document.getElementById("projectCategories").style.display = "flex";
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
  tooltip.textContent = "Not available yet!";
  tooltip.style.cssText = 'position:absolute;background:#333;color:#fff;padding:5px 10px;border-radius:5px;font-size:12px;z-index:1000;opacity:0;transition:opacity 0.4s ease;pointer-events:none;';

  const rect = button.getBoundingClientRect();
  tooltip.style.left = rect.left + window.scrollX + 'px';
  tooltip.style.top = rect.top + window.scrollY - 30 + 'px';

  document.body.appendChild(tooltip);
  requestAnimationFrame(() => { tooltip.style.opacity = 1; });

  setTimeout(() => {
    tooltip.style.opacity = 0;
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
          initReveal();

          new Typed(".typedText", {
            strings: ["Simeon Carlos Lavarias.", "an aspiring Software Engineer!"],
            loop: true,
            typeSpeed: 100,
            backSpeed: 80,
            backDelay: 2000
          });
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
