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


/* =====================================================================
   Project Showcase Carousel - live from GitHub
   Fetches the six most recent repositories for the configured GitHub user
   and renders each as a carousel slide with a live landing-page screenshot,
   a short description, and the tools it was built with.
   ===================================================================== */
(function initGithubCarousel() {
  const wrap = document.getElementById('showcase-carousel');
  if (!wrap) return; // Only runs on the projects page.

  // ---- Config -------------------------------------------------------
  const GITHUB_USER = wrap.dataset.githubUser || 'Oluwafemi-iDEAR';
  const PROJECT_COUNT = 6;
  // Sort key for "latest": 'created' = most recently uploaded repos,
  // 'pushed' = most recently worked on. Change this one line to switch.
  const SORT_BY = 'created';
  // Repos to never show (e.g. this portfolio itself). Lowercase names.
  const EXCLUDE = [];
  // Cache lifetime so repeat visits don't hit GitHub's rate limit.
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
  const CACHE_KEY = 'gh-showcase:' + GITHUB_USER;
  const AUTOPLAY_MS = 7000;

  // Hand-authored copy for specific repos. Anything omitted falls back to
  // live GitHub data. Keys are the exact lowercase repo name.
  // Add descriptions/topics on GitHub to enrich cards automatically instead.
  const PROJECT_OVERRIDES = {
    'sirelab': {
      title: 'SIRE: Sustainable Infrastructure Research',
      badge: 'Flagship Research Platform',
      description:
        'SIRE is a full research-group platform I built as a fast, content-driven website. The frontend is a React and TypeScript single-page app (Vite) styled with Tailwind and animated with Framer Motion, pulling all of its content (research areas, team members, publications, events, courses and student spotlights) live from a Sanity headless CMS through TanStack Query. It ships a validated contact form (React Hook Form and Zod) backed by a serverless email endpoint, per-route SEO metadata, and Swiper-powered carousels for highlights.',
      tags: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Sanity CMS', 'Framer Motion']
    },
    'sirelab_studio': {
      title: 'SIRE Studio: Headless CMS',
      badge: 'Content Backend',
      description:
        'The Sanity Studio that powers the SIRE research platform: the editing environment where every piece of site content is modelled and managed. I designed the full content schema (site settings, research areas, team and students, publications, events, courses, milestones and FAQs) with a custom grouped desk structure, singletons, orderable lists and generated TypeScript types, so the frontend stays type-safe end to end.',
      tags: ['Sanity', 'TypeScript', 'Structured Content', 'Schema Design', 'TypeGen']
    },
    'portfolio-website': {
      badge: 'Personal Site',
      description:
        'The site you are looking at: a hand-built developer portfolio in plain HTML, CSS and JavaScript, deliberately framework-free. Its standout piece is this Project Showcase, which pulls my latest repositories straight from the GitHub API at runtime and renders each one with a live screenshot of its deployed landing page, an auto-generated tool list and description, so the portfolio keeps itself up to date without a rebuild.',
      tags: ['HTML', 'CSS', 'JavaScript', 'GitHub API', 'Vercel']
    },
    'sire': {
      title: 'SIRE: Emerging Tech and Applied STEM',
      badge: 'Static Research Hub',
      description:
        'An earlier, fully static version of the SIRE research hub for an Emerging Tech and Applied STEM group, built with hand-written HTML and Tailwind CSS. It brings research fields, research highlights, upcoming events, a publications spotlight and conferences and workshops together into a clean, fast, no-build department site, and was the predecessor that later evolved into the CMS-driven SIRE platform.',
      tags: ['HTML', 'Tailwind CSS', 'Research Hub', 'Static Site']
    },
    'smart_waste': {
      title: 'Smart Waste Management',
      badge: 'AI and IoT Waste Optimization',
      description:
        'Smart Waste Management is a React dashboard for monitoring and optimising municipal waste collection, built as a team project. It combines Firebase authentication (login and register), a Zustand-managed application state and React Router navigation with map-based bin locations, analytics views and collection scheduling, turning live fill-level data into clear operational decisions and more efficient routes.',
      tags: ['React', 'Vite', 'Tailwind CSS', 'Firebase', 'Zustand']
    },
    'temporal-': {
      badge: 'Frontend Template',
      description:
        'A frontend build exploring a component-driven landing-page system using Pug templating and a Tailwind CSS design theme, compiled through a Gulp and Browsersync workflow with live reload. It is a smaller experiment focused on templating structure, reusable partials and theme configuration rather than a deployed product.',
      tags: ['Pug', 'Tailwind CSS', 'Gulp', 'Frontend']
    },
    'my-family-tree': {
      title: 'Kindred: Family Tree Builder',
      badge: 'Full-Stack App',
      description:
        'Kindred is an interactive family-tree application for mapping and exploring relationships across generations. Built with React and TypeScript (Vite) on a Supabase backend (Postgres, authentication and SQL migrations), it renders the tree as a pannable, zoomable node graph with React Flow, manages client state with Zustand and server data with TanStack Query, and adds guided onboarding (driver.js) plus multi-language support (i18n) for a polished, production-minded experience.',
      tags: ['React', 'TypeScript', 'Supabase', 'React Flow', 'TanStack Query', 'Zustand']
    },
    'email_manager': {
      title: 'Email Manager: Bulk Mail Merge',
      badge: 'Python Tool',
      description:
        'A self-hosted bulk mail-merge email manager built on a FastAPI backend with a lightweight web UI. It manages multiple sending accounts with SMTP auto-detection and encrypted credential storage, parses and builds recipient lists, personalises each message with mail-merge fields, supports multipart HTML and plain-text bodies with attachments, and streams progress through the send loop, so you can run reliable campaigns from your own email accounts.',
      tags: ['Python', 'FastAPI', 'SMTP', 'Mail Merge', 'Uvicorn']
    },
    'ican-usa': {
      title: 'ICAN-USA: Membership Platform',
      badge: 'Organisation Platform',
      description:
        'A complete web presence for ICAN-USA, the USA District of the Institute of Chartered Accountants of Nigeria. It pairs a fast marketing site (membership, programs, governance, conferences and more) with a Next.js members platform featuring authentication (NextAuth), a Prisma and Postgres data layer, Sanity CMS-managed content, PayPal dues payments, transactional email (Resend) and QR-code generation for members and events, supported by a Python crawler toolkit used to migrate and model the legacy site content.',
      tags: ['Next.js', 'TypeScript', 'Prisma', 'Sanity CMS', 'NextAuth', 'PayPal']
    }
  };

  // ---- Helpers ------------------------------------------------------
  const nav = document.getElementById('carousel-nav');
  const panel = document.getElementById('carousel-panel');

  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const titleize = (name) =>
    String(name)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const prettyHost = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      return 'Live site';
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'Not available';
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Not available';
    }
  };

  // A screenshot of the live landing page via WordPress mShots (free +
  // unlimited). It generates asynchronously: the first request for a new
  // URL returns a 400x300 placeholder, then the real 1200x900 shot once
  // ready. We detect the placeholder by size and poll (see primeShot).
  // The GitHub repo card is a guaranteed fallback if a shot never resolves.
  const SHOT_W = 1200;
  const SHOT_H = 900;
  const shotUrl = (liveUrl) =>
    'https://s.wordpress.com/mshots/v1/' +
    encodeURIComponent(liveUrl) +
    '?w=' +
    SHOT_W +
    '&h=' +
    SHOT_H;
  const ogFallback = (repo) =>
    'https://opengraph.githubassets.com/1/' + GITHUB_USER + '/' + repo;

  // Inline SVG icons (inherit text colour via currentColor).
  const ICON_LOCK =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
    '<path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const ICON_EXTERNAL =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>';

  // Shown in the preview panel for a private repo that has no landing page.
  const PRIVATE_PLACEHOLDER =
    '<div class="shot-private-inner">' +
    '<span class="shot-lock" aria-hidden="true">' + ICON_LOCK + '</span>' +
    '<strong>Private project</strong>' +
    '<span>Contact me to request access</span>' +
    '</div>';

  // ---- Data loading -------------------------------------------------
  // Unified project shape consumed by render():
  //   { name, isPrivate, live, viewUrl, showCode, repoUrl, language,
  //     languages[], topics[], githubDescription, pushedAt, serverOverride }
  //
  // Primary source is the /api/projects backend (supports private repos +
  // the dashboard toggles). If that backend isn't deployed (e.g. running the
  // static files locally), we fall back to reading public repos straight
  // from the GitHub API.

  async function loadProjects() {
    // 1) Live backend (private repos + curated on/off list).
    try {
      const res = await fetch('/api/projects', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.configured && Array.isArray(data.items) && data.items.length) {
          return data.items.map(normalizeApiItem);
        }
      }
    } catch (e) {
      /* backend unavailable - fall through to the public GitHub fallback */
    }
    // 2) Public fallback.
    return fetchPublicProjects();
  }

  function normalizeApiItem(it) {
    return {
      name: it.name,
      isPrivate: Boolean(it.isPrivate),
      live: (it.live || '').trim(),
      viewUrl: it.viewUrl || '',
      showCode: Boolean(it.showCode),
      repoUrl: it.repoUrl || '',
      language: it.language || '',
      languages: Array.isArray(it.languages) ? it.languages : [],
      topics: Array.isArray(it.topics) ? it.topics : [],
      githubDescription: it.githubDescription || '',
      pushedAt: it.pushedAt || '',
      serverOverride: it.override || {}
    };
  }

  // ---- Public GitHub fallback (with localStorage cache) -------------
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.time > CACHE_TTL_MS) return null;
      return parsed.projects;
    } catch (e) {
      return null;
    }
  }

  function writeCache(projects) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), projects }));
    } catch (e) {
      /* storage full or unavailable - non-fatal */
    }
  }

  async function fetchPublicProjects() {
    const cached = readCache();
    if (cached && cached.length) return cached;

    const listUrl =
      'https://api.github.com/users/' +
      GITHUB_USER +
      '/repos?sort=' +
      SORT_BY +
      '&direction=desc&per_page=100';

    const res = await fetch(listUrl, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('GitHub API responded ' + res.status);

    let repos = await res.json();
    repos = repos
      .filter((r) => !r.fork && !r.archived)
      .filter((r) => EXCLUDE.indexOf(r.name.toLowerCase()) === -1)
      .slice(0, PROJECT_COUNT);

    // Fetch the language breakdown for each repo (used for the tool chips).
    const projects = await Promise.all(
      repos.map(async (r) => {
        let languages = [];
        try {
          const lr = await fetch(r.languages_url, {
            headers: { Accept: 'application/vnd.github+json' }
          });
          if (lr.ok) {
            const langMap = await lr.json();
            languages = Object.keys(langMap).sort((a, b) => langMap[b] - langMap[a]);
          }
        } catch (e) {
          /* ignore - fall back to primary language */
        }
        const homepage = (r.homepage || '').trim();
        return {
          name: r.name,
          isPrivate: false,
          live: homepage,
          viewUrl: homepage || r.html_url,
          showCode: true,
          repoUrl: r.html_url,
          language: r.language || '',
          languages: languages,
          topics: r.topics || [],
          githubDescription: r.description || '',
          pushedAt: r.pushed_at,
          serverOverride: {}
        };
      })
    );

    writeCache(projects);
    return projects;
  }

  // ---- Rendering ----------------------------------------------------
  // Tool chips derived purely from GitHub data (languages + topics).
  function tagsFromData(p) {
    const tags = [];
    (p.languages || []).forEach((l) => tags.indexOf(l) === -1 && tags.push(l));
    (p.topics || []).forEach((t) => tags.indexOf(t) === -1 && tags.push(titleize(t)));
    if (!tags.length && p.language) tags.push(p.language);
    return tags.slice(0, 6);
  }

  // Resolve the copy for a project. Precedence:
  //   dashboard override (KV)  >  local PROJECT_OVERRIDES  >  GitHub data.
  function resolveCopy(p) {
    const so = p.serverOverride || {};
    const co = PROJECT_OVERRIDES[p.name.toLowerCase()] || {};
    const title = so.title || co.title || titleize(p.name);
    const badge =
      so.badge ||
      co.badge ||
      (p.topics && p.topics[0] ? titleize(p.topics[0]) : p.language || 'Project');
    const description =
      so.description ||
      co.description ||
      p.githubDescription ||
      'A ' +
        (p.language || 'software') +
        ' project. Open the live site or the repository to explore it in detail.';
    let tags;
    if (so.tags && so.tags.length) tags = so.tags.slice(0, 6);
    else if (co.tags && co.tags.length) tags = co.tags.slice(0, 6);
    else tags = tagsFromData(p);
    return { title, badge, description, tags };
  }

  function render(projects) {
    nav.innerHTML = '';
    panel.innerHTML = '';

    projects.forEach((p, i) => {
      const { title, badge, description, tags } = resolveCopy(p);
      const live = p.live;
      const isPrivate = p.isPrivate;
      const viewUrl = p.viewUrl || live || p.repoUrl || '#';

      // --- nav button ---
      const btn = document.createElement('button');
      btn.className = 'carousel-btn' + (i === 0 ? ' active' : '');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.setAttribute('aria-controls', 'slide-' + i);
      btn.id = 'tab-' + i;
      btn.dataset.slide = String(i);
      // Tab buttons show only the title; full copy lives in the slide body.
      btn.innerHTML = '<strong>' + esc(title) + '</strong>';
      nav.appendChild(btn);

      // --- slide panel ---
      const slide = document.createElement('article');
      slide.className = 'slide' + (i === 0 ? ' active' : '');
      slide.id = 'slide-' + i;
      slide.setAttribute('role', 'tabpanel');
      slide.setAttribute('aria-labelledby', 'tab-' + i);

      const chips = tags.map((t) => '<span class="stack-chip">' + esc(t) + '</span>').join('');

      // Action buttons. Private repos never expose a code link.
      let actions = '';
      if (live) {
        actions +=
          '<a class="btn btn-primary" href="' +
          esc(live) +
          '" target="_blank" rel="noreferrer">View Live ' + ICON_EXTERNAL + '</a>';
      }
      if (isPrivate && !live) {
        actions +=
          '<a class="btn btn-primary" href="contact.html">Request Access</a>';
      }
      if (p.showCode && p.repoUrl) {
        actions +=
          '<a class="btn btn-secondary" href="' +
          esc(p.repoUrl) +
          '" target="_blank" rel="noreferrer">View Code</a>';
      }

      // Preview: screenshot of the live page, or the GitHub card for public
      // repos with no site, or a "private" placeholder that points to contact.
      let previewInner;
      const shotSrc = live ? shotUrl(live) : isPrivate ? '' : ogFallback(p.name);
      if (shotSrc) {
        previewInner =
          '<div class="shot-frame">' +
          '<img class="project-shot" src="' +
          esc(shotSrc) +
          '" alt="Landing page of ' +
          esc(title) +
          '" data-live="' +
          (live ? '1' : '') +
          '" data-shot="' +
          esc(shotSrc) +
          '" data-og="' +
          esc(isPrivate ? '' : ogFallback(p.name)) +
          '" />' +
          '</div>';
      } else {
        previewInner = '<div class="shot-frame shot-private">' + PRIVATE_PLACEHOLDER + '</div>';
      }

      const topPillRight = live ? 'Live' : isPrivate ? 'Request access' : 'Repo';
      const topPillLeft = live ? prettyHost(live) : isPrivate ? 'Private' : 'GitHub';

      slide.innerHTML =
        '<div class="slide-hero">' +
        '<div>' +
        '<span class="project-badge">' +
        esc(badge) +
        '</span>' +
        (isPrivate ? '<span class="project-badge badge-private">Private</span>' : '') +
        '<h3>' +
        esc(title) +
        '</h3>' +
        '<p>' +
        esc(description) +
        '</p>' +
        '<div class="stack-row" style="margin-top:16px;">' +
        chips +
        '</div>' +
        '<div class="slide-actions">' +
        actions +
        '</div>' +
        '</div>' +
        '<a class="mock-surface shot-surface" href="' +
        esc(viewUrl) +
        '"' +
        (viewUrl.charAt(0) === '/' ? '' : ' target="_blank" rel="noreferrer"') +
        ' aria-label="Open ' +
        esc(title) +
        '">' +
        '<div class="mock-topbar">' +
        '<span class="mock-pill">' +
        esc(topPillLeft) +
        '</span>' +
        '<span class="mock-pill">' +
        esc(topPillRight) +
        ' ' +
        ICON_EXTERNAL +
        '</span>' +
        '</div>' +
        previewInner +
        '</a>' +
        '</div>' +
        '<div class="metrics">' +
        '<div class="metric-card"><strong>Primary Stack</strong><span>' +
        esc(p.language || (tags[0] || 'Not specified')) +
        '</span></div>' +
        '<div class="metric-card"><strong>Last Updated</strong><span>' +
        esc(formatDate(p.pushedAt)) +
        '</span></div>' +
        '<div class="metric-card"><strong>Visibility</strong><span>' +
        (isPrivate ? 'Private repository' : 'Public repository') +
        '</span></div>' +
        '</div>';
      panel.appendChild(slide);
    });

    wireInteractions();
  }

  // ---- Interactions (tabs, arrows, dots, autoplay, images) ----------
  function wireInteractions() {
    const tabs = Array.prototype.slice.call(nav.querySelectorAll('.carousel-btn'));
    const slides = Array.prototype.slice.call(panel.querySelectorAll('.slide'));
    if (!tabs.length) return;

    let current = 0;
    let timer = null;

    // Build the prev / dots / next control bar under the slides.
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'carousel-arrow';
    prevBtn.setAttribute('aria-label', 'Previous project');
    prevBtn.innerHTML = '&#8249;';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'carousel-arrow';
    nextBtn.setAttribute('aria-label', 'Next project');
    nextBtn.innerHTML = '&#8250;';

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to project ' + (i + 1));
      dot.addEventListener('click', () => {
        activate(i);
        restart();
      });
      dots.appendChild(dot);
    });
    const dotEls = Array.prototype.slice.call(dots.children);

    controls.appendChild(prevBtn);
    controls.appendChild(dots);
    controls.appendChild(nextBtn);
    panel.appendChild(controls);

    function activate(index) {
      current = index;
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      dotEls.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Autoplay always runs (the user wants it automatic); reduced-motion is
    // still respected because the slide fade transitions are disabled via CSS.
    function start() {
      if (slides.length < 2) return;
      stop();
      timer = setInterval(() => activate((current + 1) % slides.length), AUTOPLAY_MS);
    }

    function restart() {
      start();
    }

    prevBtn.addEventListener('click', () => {
      activate((current - 1 + slides.length) % slides.length);
      restart();
    });
    nextBtn.addEventListener('click', () => {
      activate((current + 1) % slides.length);
      restart();
    });

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        activate(index);
        restart();
      });
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(index);
          restart();
        }
      });
    });

    // Pause autoplay while the user is hovering/focused, resume on leave.
    wrap.addEventListener('mouseenter', stop);
    wrap.addEventListener('mouseleave', start);
    wrap.addEventListener('focusin', stop);
    wrap.addEventListener('focusout', start);

    // Reveal screenshots as they load. mShots returns a 400x300 placeholder
    // while it generates the shot, so we poll (with a cache-buster) until the
    // real 1200x900 image arrives, then fall back to the GitHub repo card.
    panel.querySelectorAll('.project-shot').forEach(primeShot);

    start();
  }

  // Handles the mShots async-generation lifecycle for a single screenshot.
  function primeShot(img) {
    const MAX_RETRIES = 6;
    const RETRY_DELAY = 3000; // ms between polls while generating
    const isLiveShot = img.dataset.live === '1';
    let retries = 0;
    let usedFallback = false;

    function reveal() {
      img.classList.add('loaded');
    }

    function fallBackToCard() {
      if (usedFallback) {
        reveal();
        return;
      }
      usedFallback = true;
      const og = img.dataset.og;
      if (og) {
        img.src = og; // GitHub OG repo card (public repos only)
      } else {
        // Private repo screenshot failed and there is no public card to show.
        const frame = img.closest('.shot-frame');
        if (frame) {
          frame.classList.add('shot-private');
          frame.innerHTML = PRIVATE_PLACEHOLDER;
        }
      }
    }

    function onLoad() {
      // The mShots "generating" placeholder is 400x300; real shots are larger.
      const isPlaceholder = isLiveShot && !usedFallback && img.naturalWidth > 0 && img.naturalWidth < 600;
      if (isPlaceholder) {
        if (retries < MAX_RETRIES) {
          retries += 1;
          setTimeout(() => {
            img.src = img.dataset.shot + '&r=' + retries; // safe cache-buster
          }, RETRY_DELAY);
        } else {
          fallBackToCard();
        }
        return;
      }
      reveal();
    }

    img.addEventListener('load', onLoad);
    img.addEventListener('error', fallBackToCard);
    if (img.complete && img.naturalWidth > 0) onLoad();
  }

  function showError() {
    if (nav) nav.innerHTML = '';
    panel.innerHTML =
      '<div class="carousel-status error">' +
      '<strong>Could not load projects from GitHub right now.</strong>' +
      '<span>This can happen if GitHub is rate-limiting. ' +
      'You can browse everything directly at ' +
      '<a href="https://github.com/' +
      esc(GITHUB_USER) +
      '?tab=repositories" target="_blank" rel="noreferrer">github.com/' +
      esc(GITHUB_USER) +
      '</a>.</span>' +
      '</div>';
  }

  // ---- Boot ---------------------------------------------------------
  loadProjects()
    .then((projects) => {
      if (!projects || !projects.length) {
        showError();
        return;
      }
      render(projects);
    })
    .catch((err) => {
      console.error('Showcase carousel failed:', err);
      showError();
    });
})();