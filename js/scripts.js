 const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!siteNav.contains(e.target) && !navToggle.contains(e.target)) {
        siteNav.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }


//   Project script for filtering and sorting projects
const tabs = document.querySelectorAll('.carousel-btn');
    const slides = document.querySelectorAll('.slide');

    function activateSlide(index) {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateSlide(index));
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateSlide(index);
        }
      });
    });

    let currentSlide = 0;
    setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      activateSlide(currentSlide);
    }, 7000);