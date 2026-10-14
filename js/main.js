/* ============================================================
   main.js – Navigasi SPA, render konten, animasi, tema
   Havib Syahputra Portfolio

   Dibungkus IIFE agar tidak mencemari scope global.
   ============================================================ */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════ */

  /** Shorthand querySelector */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /**
   * Tampilkan toast notifikasi
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration ms
   */
  function showToast(message, type = 'info', duration = 3500) {
    const container = $('#toast-container');
    if (!container) return;

    const icons = {
      success: 'fa-circle-check',
      error:   'fa-circle-xmark',
      info:    'fa-circle-info',
      warning: 'fa-triangle-exclamation'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info} toast__icon" aria-hidden="true"></i>
      <span class="toast__text">${message}</span>
      <button class="toast__close" aria-label="Tutup notifikasi"><i class="fas fa-xmark"></i></button>
    `;

    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    container.appendChild(toast);

    const timer = setTimeout(() => removeToast(toast), duration);
    toast._timer = timer;
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._timer);
    toast.classList.add('toast--fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400); // failsafe
  }

  // Expose globally so admin.js can use it
  window.showToast = showToast;

  /* ════════════════════════════════════════════════════════════
     TEMA (DARK / LIGHT)
  ════════════════════════════════════════════════════════════ */
  (function initTheme() {
    const html       = document.documentElement;
    const toggleBtn  = $('#theme-toggle');
    const themeIcon  = $('#theme-icon');

    function applyTheme(theme) {
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
      }
      // Update meta theme-color
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#090a0f' : '#f8f9fa');
      }
    }

    function toggleTheme() {
      const current = html.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    // Set ikon sesuai tema saat load
    applyTheme(html.getAttribute('data-theme') || 'dark');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }
  })();

  /* ════════════════════════════════════════════════════════════
     NAVBAR
  ════════════════════════════════════════════════════════════ */
  (function initNavbar() {
    const navbar     = $('#navbar');
    const hamburger  = $('#hamburger');
    const navMenu    = $('#nav-menu');

    // Glassmorphism saat scroll
    window.addEventListener('scroll', () => {
      if (!navbar) return;
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    // Hamburger toggle
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
        navMenu.classList.toggle('mobile-open', isOpen);
      });

      // Tutup menu saat link diklik
      navMenu.addEventListener('click', (e) => {
        if (e.target.matches('.navbar__link')) {
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('mobile-open');
        }
      });

      // Tutup menu saat klik di luar
      document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('mobile-open');
        }
      });
    }
  })();

  /* ════════════════════════════════════════════════════════════
     SPA ROUTING (Hash-based)
  ════════════════════════════════════════════════════════════ */
  const PAGES = {
    home:         { el: '#page-home',         title: 'Havib Syahputra – Junior Web Developer' },
    projects:     { el: '#page-projects',     title: 'Proyek – Havib Syahputra' },
    certificates: { el: '#page-certificates', title: 'Sertifikat – Havib Syahputra' },
    admin:        { el: '#page-admin',        title: 'Admin – Havib Syahputra' }
  };

  let currentPage = null;

  function navigateTo(page) {
    // Validasi page
    if (!PAGES[page]) page = 'home';

    // Sembunyikan semua halaman
    $$('.page').forEach(p => p.classList.add('hidden'));

    // Tampilkan halaman target
    const targetEl = $(PAGES[page].el);
    if (targetEl) {
      targetEl.classList.remove('hidden');
      // Trigger animasi scroll
      reinitScrollAnimations(targetEl);
    }

    // Update document title
    document.title = PAGES[page].title;

    // Update navbar active link
    $$('.navbar__link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' });

    currentPage = page;

    // Admin check
    if (page === 'admin') {
      if (typeof window.AdminModule !== 'undefined') {
        window.AdminModule.checkSession();
      }
    }
  }

  function resolvePageFromLocation() {
    const rawHash = (window.location.hash || '').toLowerCase();
    const rawPath = (window.location.pathname || '').toLowerCase();
    const rawSearch = (window.location.search || '').toLowerCase();

    // Deteksi akses admin fleksibel:
    // Mendukung #admin, #/admin, #home/admin, ?admin, /admin, dll.
    if (
      rawHash.includes('admin') ||
      rawPath.endsWith('/admin') ||
      rawPath.endsWith('/admin/') ||
      rawPath.endsWith('/admin.html') ||
      rawSearch.includes('admin')
    ) {
      return 'admin';
    }

    const cleanHash = rawHash.replace(/^#\/?/, '').replace(/\/$/, '');
    if (PAGES[cleanHash]) {
      return cleanHash;
    }

    return 'home';
  }

  function handleRoute() {
    const page = resolvePageFromLocation();
    navigateTo(page);
  }

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('popstate', handleRoute);
  // Expose untuk admin.js
  window.navigateTo = navigateTo;

  /* ════════════════════════════════════════════════════════════
     INTERSECTIONOBSERVER – Scroll Animations
  ════════════════════════════════════════════════════════════ */
  let scrollObserver = null;

  function initScrollAnimations(root = document) {
    const elements = $$('[data-animate]', root);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('animated'));
      return;
    }

    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('animated');
          }, parseInt(delay, 10));
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => scrollObserver.observe(el));
  }

  function reinitScrollAnimations(container) {
    // Reset dan re-observe
    $$('[data-animate]', container).forEach(el => {
      el.classList.remove('animated');
    });
    setTimeout(() => initScrollAnimations(container), 50);
  }

  /* ════════════════════════════════════════════════════════════
     COUNT-UP ANIMATION
  ════════════════════════════════════════════════════════════ */
  function initCountUp() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  function animateCount(el) {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1500;
    const step     = target / (duration / 16);
    let current    = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current);
    }, 16);
  }

  /* ════════════════════════════════════════════════════════════
     TYPEWRITER EFFECT
  ════════════════════════════════════════════════════════════ */
  function initTypewriter(texts) {
    const el = $('#typewriter-text');
    if (!el || !texts || !texts.length) return;

    let textIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout;

    function type() {
      const currentText = texts[textIdx];
      const displayed   = isDeleting
        ? currentText.slice(0, charIdx--)
        : currentText.slice(0, charIdx++);

      el.textContent = displayed;

      let speed = isDeleting ? 50 : 90;

      if (!isDeleting && charIdx > currentText.length) {
        // Pause setelah selesai mengetik
        speed = 1800;
        isDeleting = true;
      } else if (isDeleting && charIdx < 0) {
        isDeleting = false;
        charIdx    = 0;
        textIdx    = (textIdx + 1) % texts.length;
        speed      = 400;
      }

      timeout = setTimeout(type, speed);
    }

    clearTimeout(timeout);
    type();
  }

  /* ════════════════════════════════════════════════════════════
     BACK TO TOP
  ════════════════════════════════════════════════════════════ */
  (function initBackToTop() {
    const btn = $('#back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('hidden', window.scrollY < 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  /* ════════════════════════════════════════════════════════════
     FOOTER
  ════════════════════════════════════════════════════════════ */
  function renderFooter() {
    const yearEl = $('#footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ════════════════════════════════════════════════════════════
     RENDER – FOTO PROFIL (dengan fallback HS)
  ════════════════════════════════════════════════════════════ */
  function renderProfilePhoto(containerSelector, size = 'hero') {
    const container = $(containerSelector);
    if (!container) return;

    const imgSrc = getProfileImage();

    if (!imgSrc) {
      container.innerHTML = `<div class="photo-fallback" aria-label="Inisial HS">HS</div>`;
      return;
    }

    const img = document.createElement('img');
    img.src   = imgSrc;
    img.alt   = 'Foto profil Havib Syahputra';
    img.loading = 'lazy';
    img.onerror = () => {
      container.innerHTML = `<div class="photo-fallback" aria-label="Inisial HS">HS</div>`;
    };
    container.innerHTML = '';
    container.appendChild(img);
  }

  /* ════════════════════════════════════════════════════════════
     RENDER – HERO SECTION
  ════════════════════════════════════════════════════════════ */
  function renderHero(data) {
    const profile = data.profile;

    // Badge Open to Work
    const badge = $('#open-to-work-badge');
    if (badge) {
      badge.style.display = profile.openToWork ? 'inline-flex' : 'none';
    }

    // Nama
    const nameEl = $('#hero-name');
    if (nameEl) nameEl.textContent = profile.name;

    // Lokasi
    const locEl = $('#hero-location');
    if (locEl) locEl.textContent = profile.location;

    // Foto hero
    renderProfilePhoto('#hero-photo');

    // Typewriter
    initTypewriter(profile.typewriterTexts);

    // Social links (hero)
    renderSocialLinks('#hero-socials', profile);

    // Tombol Download CV
    const cvBtn = $('#btn-download-cv');
    if (cvBtn) {
      cvBtn.addEventListener('click', () => {
        if (CONFIG.cvFile) {
          const a = document.createElement('a');
          a.href     = CONFIG.cvFile;
          a.download = 'CV-Havib-Syahputra.pdf';
          a.target   = '_blank';
          a.rel      = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          showToast('CV belum tersedia saat ini.', 'warning');
        }
      });
    }
  }

  /* ════════════════════════════════════════════════════════════
     RENDER – SOCIAL LINKS
  ════════════════════════════════════════════════════════════ */
  function renderSocialLinks(selector, profile) {
    const container = $(selector);
    if (!container) return;

    const socials = [
      { key: 'github',    icon: 'fab fa-github',    label: 'GitHub',    href: profile.github    },
      { key: 'linkedin',  icon: 'fab fa-linkedin-in',label: 'LinkedIn',  href: profile.linkedin  },
      { key: 'email',     icon: 'fas fa-envelope',   label: 'Email',     href: profile.email || `mailto:${profile.email}` },
      { key: 'whatsapp',  icon: 'fab fa-whatsapp',   label: 'WhatsApp',  href: profile.whatsapp  },
      { key: 'instagram', icon: 'fab fa-instagram',  label: 'Instagram', href: profile.instagram }
    ];

    container.innerHTML = socials
      .filter(s => s.href && s.href !== 'mailto:')
      .map(s => `
        <a href="${s.href}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${s.label}">
          <i class="${s.icon}" aria-hidden="true"></i>
        </a>
      `).join('');
  }

  /* ════════════════════════════════════════════════════════════
     RENDER – ABOUT SECTION
  ════════════════════════════════════════════════════════════ */
  function renderAbout(data) {
    const profile = data.profile;

    const bioEl = $('#about-bio');
    if (bioEl) bioEl.textContent = profile.bio;

    renderProfilePhoto('#about-photo');
  }

  /* ════════════════════════════════════════════════════════════
     RENDER – SKILLS
  ════════════════════════════════════════════════════════════ */
  function renderSkills(data) {
    const grid = $('#skills-grid');
    if (!grid) return;

    grid.innerHTML = data.skills.map((cat, idx) => `
      <div class="skill-category glass" data-animate="fade-up" data-delay="${idx * 80}" role="region" aria-labelledby="skill-cat-${idx}">
        <div class="skill-category__header">
          <div class="skill-category__icon" aria-hidden="true">
            <i class="${cat.icon}"></i>
          </div>
          <h3 class="skill-category__title" id="skill-cat-${idx}">${cat.category}</h3>
        </div>
        <div class="skill-badges" role="list" aria-label="Keahlian ${cat.category}">
          ${cat.items.map(item => {
            const skillName = typeof item === 'string' ? item : item.name;
            return `
              <span class="skill-badge" role="listitem">
                <span class="skill-badge__dot" aria-hidden="true"></span>
                <span class="skill-badge__name">${skillName}</span>
              </span>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  /* ════════════════════════════════════════════════════════════
     RENDER – TIMELINE
  ════════════════════════════════════════════════════════════ */
  function renderTimeline(data) {
    const container = $('#timeline-container');
    if (!container) return;

    const typeLabels = {
      education:    { label: 'Pendidikan',  class: 'education'    },
      work:         { label: 'Kerja/Magang', class: 'work'        },
      organization: { label: 'Organisasi',  class: 'organization' }
    };

    function renderItems(filter) {
      const items = filter === 'all'
        ? data.timeline
        : data.timeline.filter(t => t.type === filter);

      container.innerHTML = items.map((item, idx) => {
        const typeInfo = typeLabels[item.type] || { label: item.type, class: '' };
        return `
          <article class="timeline-item" data-animate="fade-up" data-delay="${idx * 60}" data-type="${item.type}">
            <div class="timeline-card glass">
              <div class="timeline-card__top">
                <h3 class="timeline-card__title">${item.title}</h3>
                <span class="timeline-card__badge timeline-card__badge--${typeInfo.class}">${typeInfo.label}</span>
              </div>
              <p class="timeline-card__subtitle">${item.subtitle}</p>
              <p class="timeline-card__period">
                <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                ${item.period}
              </p>
              <p class="timeline-card__desc">${item.desc}</p>
            </div>
          </article>
        `;
      }).join('');

      // Re-init animasi
      initScrollAnimations(container);
    }

    // Render awal
    renderItems('all');

    // Tab filter
    $$('.timeline-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.timeline-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        renderItems(tab.dataset.filter);
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     RENDER – FOOTER SOCIALS
  ════════════════════════════════════════════════════════════ */
  function renderFooterSocials(data) {
    const container = $('#footer-socials');
    if (!container) return;
    renderSocialLinks('#footer-socials', data.profile);
  }

  /* ════════════════════════════════════════════════════════════
     PROJECTS PAGE
  ════════════════════════════════════════════════════════════ */
  let allProjects = [];

  function renderProjects(data) {
    allProjects = data.projects || [];
    renderProjectGrid(allProjects);

    // Filter tabs
    $$('#page-projects .filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('#page-projects .filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        applyProjectFilters();
      });
    });

    // Search
    const searchInput = $('#project-search');
    if (searchInput) {
      searchInput.addEventListener('input', applyProjectFilters);
    }
  }

  function applyProjectFilters() {
    const activeFilter = ($('#page-projects .filter-tab.active')?.dataset.filter) || 'all';
    const searchQuery  = ($('#project-search')?.value || '').toLowerCase().trim();

    let filtered = allProjects;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(p => p.category === activeFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery) ||
        (p.technologies || []).some(t => t.toLowerCase().includes(searchQuery))
      );
    }

    renderProjectGrid(filtered);
  }

  function renderProjectGrid(projects) {
    const grid   = $('#projects-grid');
    const empty  = $('#projects-empty');
    if (!grid) return;

    if (!projects.length) {
      grid.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    grid.innerHTML = projects.map((p, idx) => {
      const imgSrc = getProjectImage(p.id, p.image);
      const tech   = (p.technologies || []).slice(0, 4).map(t => `<span class="tech-badge">${t}</span>`).join('');
      const hasDemo = p.demo && p.demo.trim();
      const hasRepo = p.repo && p.repo.trim();

      return `
        <article class="project-card" data-animate="fade-up" data-delay="${(idx % 3) * 80}"
                 data-id="${p.id}" role="button" tabindex="0" aria-label="Buka detail proyek ${p.title}">
          <div class="project-card__image">
            ${imgSrc
              ? `<img src="${imgSrc}" alt="Screenshot proyek ${p.title}" loading="lazy"
                     onerror="this.parentNode.innerHTML=getProjectFallback('${p.category}')">`
              : getProjectFallback(p.category)
            }
          </div>
          <div class="project-card__body">
            <div class="project-card__header">
              <h3 class="project-card__title">${p.title}</h3>
              <span class="project-card__year">${p.year}</span>
            </div>
            <p class="project-card__desc">${p.description}</p>
            <div class="project-card__tech">${tech}</div>
            <div class="project-card__actions">
              <button class="btn btn--primary btn--sm" onclick="openProjectModal('${p.id}')" aria-label="Lihat detail proyek ${p.title}">
                <i class="fas fa-eye" aria-hidden="true"></i> Detail
              </button>
              ${hasDemo ? `<a href="${p.demo}" target="_blank" rel="noopener noreferrer" class="btn btn--outline btn--sm" aria-label="Demo proyek ${p.title}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Demo</a>` : ''}
              ${hasRepo ? `<a href="${p.repo}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost btn--sm" aria-label="Repositori proyek ${p.title}"><i class="fab fa-github" aria-hidden="true"></i> Repo</a>` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');

    initScrollAnimations(grid);
  }

  function getProjectFallback(category) {
    const icons = {
      Web:       'fa-globe',
      Mobile:    'fa-mobile-screen',
      WordPress: 'fa-wordpress'
    };
    const icon = icons[category] || 'fa-code';
    return `
      <div class="project-card__image-fallback">
        <i class="fas ${icon}" aria-hidden="true"></i>
        <span>${category}</span>
      </div>
    `;
  }

  // Expose globally
  window.getProjectFallback = getProjectFallback;

  /* ── Project Modal ── */
  let currentProjectData = null;

  function openProjectModal(projectId) {
    const data    = getPortfolioData();
    const project = (data.projects || []).find(p => p.id === projectId);
    if (!project) return;

    currentProjectData = project;
    const overlay  = $('#project-modal-overlay');
    const content  = $('#project-modal-content');
    if (!overlay || !content) return;

    const imgSrc   = getProjectImage(project.id, project.image);
    const tech     = (project.technologies || []).map(t => `<span class="tech-badge">${t}</span>`).join('');
    const hasDemo  = project.demo?.trim();
    const hasRepo  = project.repo?.trim();

    content.innerHTML = `
      ${imgSrc
        ? `<img class="project-modal__img" src="${imgSrc}" alt="Screenshot ${project.title}" loading="lazy" onerror="this.outerHTML=getProjectFallback('${project.category}')">`
        : `<div class="project-modal__img-fallback"><i class="fas fa-code" aria-hidden="true"></i></div>`
      }
      <h2 class="project-modal__title" id="project-modal-title">${project.title}</h2>
      <p class="project-modal__year"><i class="fas fa-calendar" aria-hidden="true"></i> ${project.year} &bull; ${project.category}</p>
      <p class="project-modal__desc">${project.description}</p>
      <p class="project-modal__tech-label">Teknologi</p>
      <div class="project-modal__tech">${tech}</div>
      ${(hasDemo || hasRepo) ? `
        <p class="project-modal__links-label">Tautan</p>
        <div class="project-modal__links">
          ${hasDemo ? `<a href="${project.demo}" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--sm" aria-label="Demo langsung ${project.title}"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Demo Langsung</a>` : ''}
          ${hasRepo ? `<a href="${project.repo}" target="_blank" rel="noopener noreferrer" class="btn btn--outline btn--sm" aria-label="Lihat kode sumber ${project.title}"><i class="fab fa-github" aria-hidden="true"></i> Source Code</a>` : ''}
        </div>
      ` : ''}
    `;

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#project-modal-close')?.focus();
  }

  window.openProjectModal = openProjectModal;

  function closeProjectModal() {
    const overlay = $('#project-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Event listeners modal
  $('#project-modal-close')?.addEventListener('click', closeProjectModal);
  $('#project-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeProjectModal();
  });

  /* ════════════════════════════════════════════════════════════
     CERTIFICATES PAGE
  ════════════════════════════════════════════════════════════ */
  let allCerts = [];
  let currentCertIdx = 0;
  let filteredCerts  = [];

  function renderCertificates(data) {
    allCerts = data.certificates || [];
    filteredCerts = [...allCerts];
    renderCertGrid(allCerts);

    // Filter tabs
    $$('#page-certificates .filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('#page-certificates .filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.filter;
        filteredCerts = filter === 'all' ? [...allCerts] : allCerts.filter(c => c.category === filter);
        renderCertGrid(filteredCerts);
      });
    });
  }

  function renderCertGrid(certs) {
    const grid  = $('#certificates-grid');
    const empty = $('#cert-empty');
    if (!grid) return;

    if (!certs.length) {
      grid.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    grid.innerHTML = certs.map((c, idx) => {
      const imgSrc = getCertImage(c.id, c.image);
      const isPdf  = typeof isPdfUrl === 'function' && isPdfUrl(imgSrc);

      const thumbMarkup = isPdf
        ? `<div class="cert-card__pdf-thumb">
             <div class="cert-card__pdf-icon-wrap">
               <i class="fas fa-file-pdf" aria-hidden="true"></i>
             </div>
             <span class="cert-card__pdf-badge">Dokumen PDF</span>
             <span class="cert-card__pdf-name">${c.title}</span>
           </div>`
        : (imgSrc
            ? `<img src="${imgSrc}" alt="Sertifikat ${c.title}" loading="lazy"
                   onerror="this.parentNode.innerHTML=getCertFallback()">`
            : getCertFallback()
          );

      return `
        <article class="cert-card" data-animate="fade-up" data-delay="${(idx % 3) * 80}"
                 data-id="${c.id}" tabindex="0" role="button" aria-label="Buka ${c.title}">
          <div class="cert-card__image">
            ${thumbMarkup}
            <div class="cert-card__overlay">
              <button class="cert-card__view-btn" onclick="openCertModal(${idx})" aria-label="Lihat sertifikat ${c.title}">
                <i class="fas ${isPdf ? 'fa-file-pdf' : 'fa-expand'}" aria-hidden="true"></i> ${isPdf ? 'Lihat PDF' : 'Lihat'}
              </button>
            </div>
          </div>
          <div class="cert-card__body">
            <div class="cert-card__header">
              <h3 class="cert-card__title">${c.title}</h3>
              <span class="cert-card__badge cert-card__badge--${c.category}">${c.category}</span>
            </div>
            <p class="cert-card__issuer"><i class="fas fa-building" aria-hidden="true"></i> ${c.issuer}</p>
            <p class="cert-card__year"><i class="fas fa-calendar" aria-hidden="true"></i> ${c.year}</p>
          </div>
        </article>
      `;
    }).join('');

    // Click/keyboard on card
    $$('.cert-card').forEach((card, idx) => {
      card.addEventListener('click', () => openCertModal(idx));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCertModal(idx);
        }
      });
    });

    initScrollAnimations(grid);
  }

  function getCertFallback() {
    return `
      <div class="cert-card__image-fallback">
        <i class="fas fa-certificate" aria-hidden="true"></i>
      </div>
    `;
  }

  window.getCertFallback = getCertFallback;

  function openCertModal(idx) {
    currentCertIdx = idx;
    const overlay = $('#cert-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderCertModalContent();
    $('#cert-modal-close')?.focus();
  }

  window.openCertModal = openCertModal;

  function renderCertModalContent() {
    const content = $('#cert-modal-content');
    const counter = $('#cert-counter');
    if (!content) return;

    const cert   = filteredCerts[currentCertIdx];
    if (!cert) return;

    const imgSrc = getCertImage(cert.id, cert.image);
    const isPdf  = typeof isPdfUrl === 'function' && isPdfUrl(imgSrc);

    content.innerHTML = isPdf
      ? `
        <div class="cert-modal__pdf-view">
          <div class="cert-modal__pdf-header">
            <div class="cert-card__pdf-icon-wrap" style="width:44px;height:44px;font-size:1.35rem;flex-shrink:0">
              <i class="fas fa-file-pdf" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="cert-modal__title" id="cert-modal-title" style="margin:0">${cert.title}</h2>
              <p class="cert-modal__issuer" style="margin:0.2rem 0 0"><i class="fas fa-building" aria-hidden="true"></i> ${cert.issuer} &bull; ${cert.year} &bull; ${cert.category}</p>
            </div>
          </div>
          <div class="cert-modal__pdf-embed-wrapper">
            <iframe src="${imgSrc}#toolbar=1" class="cert-modal__pdf-frame" title="Dokumen Sertifikat ${cert.title}"></iframe>
          </div>
          <div class="cert-modal__pdf-actions">
            <a href="${imgSrc}" target="_blank" download="${cert.title}.pdf" class="btn btn--primary btn--sm">
              <i class="fas fa-arrow-down" aria-hidden="true"></i> Unduh / Buka Dokumen PDF
            </a>
          </div>
        </div>
      `
      : `
        ${imgSrc
          ? `<img class="cert-modal__img" src="${imgSrc}" alt="Sertifikat ${cert.title}" loading="lazy"
                 onerror="this.outerHTML='<div class=cert-modal__img-fallback><i class=fas fa-certificate></i></div>'">`
          : `<div class="cert-modal__img-fallback"><i class="fas fa-certificate" aria-hidden="true"></i></div>`
        }
        <h2 class="cert-modal__title" id="cert-modal-title">${cert.title}</h2>
        <p class="cert-modal__issuer"><i class="fas fa-building" aria-hidden="true"></i> ${cert.issuer}</p>
        <p class="cert-modal__year"><i class="fas fa-calendar" aria-hidden="true"></i> ${cert.year} &bull; ${cert.category}</p>
      `;

    if (counter) {
      counter.textContent = `${currentCertIdx + 1} / ${filteredCerts.length}`;
    }
  }

  function closeCertModal() {
    const overlay = $('#cert-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Cert modal navigation
  $('#cert-modal-close')?.addEventListener('click', closeCertModal);
  $('#cert-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCertModal();
  });
  $('#cert-prev')?.addEventListener('click', () => {
    if (!filteredCerts.length) return;
    currentCertIdx = (currentCertIdx - 1 + filteredCerts.length) % filteredCerts.length;
    renderCertModalContent();
  });
  $('#cert-next')?.addEventListener('click', () => {
    if (!filteredCerts.length) return;
    currentCertIdx = (currentCertIdx + 1) % filteredCerts.length;
    renderCertModalContent();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const certOpen    = !$('#cert-modal-overlay').classList.contains('hidden');
    const projectOpen = !$('#project-modal-overlay').classList.contains('hidden');

    if (e.key === 'Escape') {
      if (certOpen)    closeCertModal();
      if (projectOpen) closeProjectModal();
    }
    if (certOpen) {
      if (e.key === 'ArrowLeft')  $('#cert-prev')?.click();
      if (e.key === 'ArrowRight') $('#cert-next')?.click();
    }
  });

  /* ════════════════════════════════════════════════════════════
     RENDER SEMUA KONTEN HOME
  ════════════════════════════════════════════════════════════ */
  function renderHome(data) {
    renderHero(data);
    renderAbout(data);
    renderSkills(data);
    renderTimeline(data);
    renderFooterSocials(data);
  }

  /* ════════════════════════════════════════════════════════════
     PUBLIC API – dipakai admin.js untuk refresh konten
  ════════════════════════════════════════════════════════════ */
  window.MainModule = {
    refresh() {
      const data = getPortfolioData();
      renderHome(data);
      renderProjects(data);
      renderCertificates(data);
    },
    renderProjects(data) { renderProjects(data); },
    renderCertificates(data) { renderCertificates(data); }
  };

  /* ════════════════════════════════════════════════════════════
     INIT – Jalankan semua saat DOM siap
  ════════════════════════════════════════════════════════════ */
  async function init() {
    // Muat data terbaru dari data/content.json (sinkronisasi GitHub Pages)
    if (typeof loadRemotePortfolioData === 'function') {
      try {
        await loadRemotePortfolioData();
      } catch (_) {}
    }

    const data = getPortfolioData();

    renderFooter();
    renderHome(data);
    renderProjects(data);
    renderCertificates(data);

    // Routing
    handleRoute();

    // Animasi scroll & count-up
    initScrollAnimations();
    initCountUp();

    // Smooth internal anchor link (#about, #skills, dll) pada home page
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');

      // Abaikan link halaman utama (SPA pages)
      if (['#home','#projects','#certificates','#admin'].includes(href)) return;

      // Handle anchor dalam halaman (mis. #about, #skills, #contact)
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Btn "Lihat Proyek"
    $('#btn-lihat-proyek')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#projects';
    });
  }

  // Jalankan setelah DOM dan semua script dimuat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
