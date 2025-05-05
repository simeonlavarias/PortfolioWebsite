/* ----- NAVIGATION BAR FUNCTION ----- */
function myMenuFunction(){
  var menuBtn = document.getElementById("myNavMenu");

  if(menuBtn.className === "nav-menu"){
    menuBtn.className += " responsive";
  } else {
    menuBtn.className = "nav-menu";
  }
}

/* ----- ADD SHADOW ON NAVIGATION BAR WHILE SCROLLING ----- */
window.onscroll = function() {headerShadow()};

function headerShadow() {
  const navHeader =document.getElementById("header");

  if (document.body.scrollTop > 50 || document.documentElement.scrollTop >  50) {

    navHeader.style.boxShadow = "0 1px 6px rgba(0, 0, 0, 0.1)";
    navHeader.style.height = "70px";
    navHeader.style.lineHeight = "70px";

  } else {

    navHeader.style.boxShadow = "none";
    navHeader.style.height = "90px";
    navHeader.style.lineHeight = "90px";

  }
}

/* ----- ## -- SCROLL REVEAL ANIMATION -- ## ----- */
const sr = ScrollReveal({
      origin: 'top',
      distance: '80px',
      duration: 2000,
      reset: true     
})

/* -- HOME -- */
sr.reveal('.featured-text-card',{})
sr.reveal('.featured-name',{delay: 100})
sr.reveal('.featured-text-info',{delay: 200})
sr.reveal('.featured-text-btn',{delay: 200})
sr.reveal('.social_icons',{delay: 200})
sr.reveal('.featured-image',{delay: 300})


/* -- PROJECT BOX -- */
sr.reveal('.project-box',{interval: 200})

/* -- HEADINGS -- */
sr.reveal('.top-header',{})

/* ----- ## -- SCROLL REVEAL LEFT_RIGHT ANIMATION -- ## ----- */

/* -- ABOUT INFO & CONTACT INFO -- */
const srLeft = ScrollReveal({
origin: 'left',
distance: '80px',
duration: 2000,
reset: true
})

srLeft.reveal('.about-info',{delay: 100})
srLeft.reveal('.contact-info',{delay: 100})

/* -- ABOUT SKILLS & FORM BOX -- */
const srRight = ScrollReveal({
origin: 'right',
distance: '80px',
duration: 2000,
reset: true
})

srRight.reveal('.skills-box',{delay: 100})
srRight.reveal('.form-control',{delay: 100})



/* ----- CHANGE ACTIVE LINK ----- */

const sections = document.querySelectorAll('section[id]')

function scrollActive() {
const scrollY = window.scrollY;

sections.forEach(current =>{
  const sectionHeight = current.offsetHeight,
      sectionTop = current.offsetTop - 50,
    sectionId = current.getAttribute('id')

  if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) { 

    document.querySelectorAll('.nav-menu a').forEach(link => {
      if (link.getAttribute('href') === `#${sectionId}`) {
        link.classList.add('active-link');
      } else {
        link.classList.remove('active-link');
      }
    });
  }  else {

    document.querySelector('.nav-menu a[href*=' + sectionId + ']').classList.remove('active-link')

  }
})
}

window.addEventListener('scroll', scrollActive)

const toggleButton = document.getElementById("theme-toggle");

function setTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-theme");
        toggleButton.innerHTML = "𖤓 Light Mode";
    } else {
        document.body.classList.remove("dark-theme");
        toggleButton.innerHTML = "⏾ Dark Mode";
    }
    // localStorage.setItem("theme", theme); // ← Remove or comment this out
}

// Always start in light mode
setTheme("light");

toggleButton.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark-theme") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
});

function showProjects(category) {
  // Hide categories
  document.getElementById("projectCategories").style.display = "none";
  document.getElementById("backButton").style.display = "block";

  // Show selected category's projects
  ["software", "networking", "ml"].forEach(id => {
    const section = document.getElementById(id);
    section.style.display = id === category ? "grid" : "none";
    if (id === category) {
      section.classList.add("show");
    } else {
      section.classList.remove("show");
    }
  });  
}

function goBack() {
  // Show categories again
  document.getElementById("projectCategories").style.display = "flex";
  document.getElementById("backButton").style.display = "none";

  // Hide all project cards
  ["software", "networking", "ml"].forEach(id => {
    const section = document.getElementById(id);
    section.style.display = "none";
    section.classList.remove("show");
  });  
}

/* ----- SHOW UNAVAILABLE TOOLTIP FOR EMPTY LINKS ----- */
function showUnavailableMessage(button) {
  event.preventDefault(); // prevent default link behavior

  if (button.getAttribute('href') === '#') {
    const tooltip = document.createElement('span');
    tooltip.textContent = "Not available yet!";
    tooltip.style.position = 'absolute';
    tooltip.style.background = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = 1000;
    tooltip.style.opacity = 0;
    tooltip.style.transition = 'opacity 0.4s ease';

    // Calculate button position
    const rect = button.getBoundingClientRect();
    tooltip.style.left = rect.left + window.scrollX + 'px';
    tooltip.style.top = rect.top + window.scrollY - 30 + 'px';

    document.body.appendChild(tooltip);

    // Trigger fade-in
    requestAnimationFrame(() => {
      tooltip.style.opacity = 1;
    });

    // Fade out and remove after 2s
    setTimeout(() => {
      tooltip.style.opacity = 0;
      setTimeout(() => {
        tooltip.remove();
      }, 400); // Wait for fade-out to complete
    }, 1600);
  }
}

// Typing animation for loading screen
const loadingText = document.getElementById("loading-text");
const fullText = "<Hello, world! />";
let index = 0;

function typeLoaderText() {
  if (index < fullText.length) {
    loadingText.textContent += fullText.charAt(index);
    index++;
    setTimeout(typeLoaderText, 100);
  } else {
    // Done typing, fade out loader
    setTimeout(() => {
      document.getElementById("loader").classList.add("hidden");

      // Only start animations and name typing AFTER loader is hidden
      setTimeout(() => {
        document.querySelector(".container").classList.add("visible");

        // Start ScrollReveal
        ScrollReveal().reveal('.featured-text-card', {});
        ScrollReveal().reveal('.featured-name', { delay: 100 });
        ScrollReveal().reveal('.featured-text-info', { delay: 200 });
        ScrollReveal().reveal('.featured-text-btn', { delay: 200 });
        ScrollReveal().reveal('.social_icons', { delay: 200 });
        ScrollReveal().reveal('.featured-image', { delay: 300 });

        // Now start typing your name
        new Typed(".typedText", {
          strings: ["Simeon Carlos Lavarias.", "an aspiring Software Engineer!"],
          loop: true,
          typeSpeed: 100,
          backSpeed: 80,
          backDelay: 2000
        });
      }, 500); // Slight delay after loader is gone
    }, 800);
  }
}


// Delay site animations until loader finishes
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".container").classList.remove("visible");
  typeLoaderText();
});

window.addEventListener("load", () => {
  setTimeout(() => {
    document.querySelector(".container").classList.add("visible");
  }, 1800); // After loader fades out
});
