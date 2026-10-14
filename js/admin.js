/* ============================================================
   admin.js – Login & CMS Admin Panel
   Havib Syahputra Portfolio

   ⚠️  PERINGATAN KEAMANAN:
   Autentikasi ini berjalan sepenuhnya di sisi klien (browser).
   Hash SHA-256 disimpan di localStorage. Ini BUKAN keamanan
   sungguhan dan tidak cocok untuk produksi/server nyata.
   Gunakan hanya sebagai demo/proof-of-concept.

   Fitur:
   - Login dengan hash SHA-256 (Web Crypto API)
   - Session di sessionStorage
   - Batas 5x percobaan salah + cooldown 30 detik
   - CRUD Profil, Proyek, Sertifikat
   - Export/Import JSON, Reset ke default
   - Upload foto (kompres via Canvas → Base64 → localStorage)
   ============================================================ */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const toast = (msg, type = 'info') => typeof window.showToast === 'function' && window.showToast(msg, type);

  const AUTH_KEY       = 'portfolio_auth_v1';
  const SESSION_KEY    = 'portfolio_session';
  const ATTEMPT_KEY    = 'portfolio_login_attempts';
  const COOLDOWN_KEY   = 'portfolio_login_cooldown';

  const DEFAULT_USERNAME = 'admin';
  const DEFAULT_PASSWORD = 'admin123';
  const GITHUB_CONFIG_KEY = 'portfolio_github_sync';

  /* ════════════════════════════════════════════════════════════
     GITHUB SYNC (Hosting GitHub Pages - Centralized CMS)
     Kredensial Token HANYA tersimpan di browser Admin ini.
     Pengunjung web tidak memiliki akses ke token ini.
  ════════════════════════════════════════════════════════════ */
  function getGitHubConfig() {
    try {
      const saved = localStorage.getItem(GITHUB_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      owner: '',
      repo: '',
      branch: 'main',
      path: 'data/content.json',
      token: '',
      autoSync: true
    };
  }

  function saveGitHubConfig(cfg) {
    try {
      localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(cfg));
      return true;
    } catch (_) {
      return false;
    }
  }

  async function testGitHubConnection(customCfg = null) {
    const config = customCfg || getGitHubConfig();
    if (!config.token || !config.owner || !config.repo) {
      throw new Error('Mohon lengkapi Username/Owner, Nama Repository, dan GitHub Token.');
    }
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (res.status === 401) throw new Error('Token GitHub tidak valid atau sudah kedaluwarsa.');
    if (res.status === 404) throw new Error('Repository tidak ditemukan atau token tidak memiliki izin repo.');
    if (!res.ok) throw new Error(`GitHub Error: ${res.status} ${res.statusText}`);
    return await res.json();
  }

  async function syncDataToGitHub(commitMsg = null) {
    const config = getGitHubConfig();
    if (!config.token || !config.owner || !config.repo) {
      return { success: false, reason: 'unconfigured' };
    }

    const branch = config.branch || 'main';
    const filePath = config.path || 'data/content.json';
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;

    // 1. Ambil SHA file data/content.json saat ini jika sudah ada
    let currentSha = null;
    try {
      const checkRes = await fetch(`${apiUrl}?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (checkRes.ok) {
        const fileInfo = await checkRes.json();
        currentSha = fileInfo.sha;
      }
    } catch (e) {
      console.warn('[GitHub Sync] File SHA check:', e);
    }

    // 2. Siapkan data portofolio terkini
    const portfolioData = getPortfolioData();
    const localPhoto = localStorage.getItem('portfolio_img_profile');
    if (localPhoto) {
      portfolioData.profile.photo = localPhoto;
    }

    // Encode JSON to UTF-8 Base64 (Aman untuk karakter UTF-8 Indonesia)
    const jsonStr = JSON.stringify(portfolioData, null, 2);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binaryStr = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binaryStr += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Content = btoa(binaryStr);

    // 3. Commit ke GitHub REST API
    const commitBody = {
      message: commitMsg || `Update portfolio content via Admin Panel [skip ci] (${new Date().toLocaleString('id-ID')})`,
      content: base64Content,
      branch: branch
    };
    if (currentSha) {
      commitBody.sha = currentSha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(commitBody)
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `Gagal commit ke GitHub (${putRes.status})`);
    }

    return { success: true, timestamp: Date.now() };
  }

  async function pullDataFromGitHub() {
    const config = getGitHubConfig();
    if (!config.token || !config.owner || !config.repo) {
      throw new Error('Konfigurasi GitHub belum lengkap.');
    }
    const branch = config.branch || 'main';
    const filePath = config.path || 'data/content.json';
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${branch}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil data dari GitHub (${res.status})`);
    }

    const info = await res.json();
    const decodedStr = decodeURIComponent(escape(atob(info.content.replace(/\n/g, ''))));
    const remoteData = JSON.parse(decodedStr);

    if (remoteData && remoteData.profile) {
      savePortfolioData(remoteData);
      return remoteData;
    } else {
      throw new Error('Format data di GitHub tidak sesuai.');
    }
  }

  async function triggerAutoSync(actionName = 'Perubahan') {
    const config = getGitHubConfig();
    if (!config.token || !config.owner || !config.repo || !config.autoSync) {
      return;
    }

    toast(`☁️ Menyinkronkan ${actionName} ke GitHub Pages...`, 'info', 4000);
    try {
      await syncDataToGitHub(`CMS Update: ${actionName} [skip ci]`);
      toast(`✅ Perubahan ${actionName} berhasil dipublikasikan ke GitHub Pages!`, 'success', 5000);
    } catch (err) {
      console.error('[GitHub Auto-Sync Error]', err);
      toast(`⚠️ Gagal sinkron ke GitHub: ${err.message}`, 'error', 6000);
    }
  }

  /* ════════════════════════════════════════════════════════════
     SHA-256 via Web Crypto API
  ════════════════════════════════════════════════════════════ */
  async function sha256(str) {
    const buf    = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /* ════════════════════════════════════════════════════════════
     CREDENTIAL MANAGEMENT
  ════════════════════════════════════════════════════════════ */
  async function getStoredCreds() {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    // Default: buat hash pertama kali
    const usernameHash = await sha256(DEFAULT_USERNAME);
    const passwordHash = await sha256(DEFAULT_PASSWORD);
    return { usernameHash, passwordHash };
  }

  async function saveCredentials(username, password) {
    try {
      const usernameHash = await sha256(username);
      const passwordHash = await sha256(password);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ usernameHash, passwordHash }));
      return true;
    } catch (e) {
      console.error('Gagal menyimpan kredensial:', e);
      return false;
    }
  }

  async function verifyLogin(username, password) {
    const creds = await getStoredCreds();
    const uHash = await sha256(username);
    const pHash = await sha256(password);
    return uHash === creds.usernameHash && pHash === creds.passwordHash;
  }

  /* ════════════════════════════════════════════════════════════
     SESSION
  ════════════════════════════════════════════════════════════ */
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
  }

  function setSession() {
    sessionStorage.setItem(SESSION_KEY, 'authenticated');
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ════════════════════════════════════════════════════════════
     ATTEMPT LIMITER
  ════════════════════════════════════════════════════════════ */
  const MAX_ATTEMPTS = 5;
  const COOLDOWN_MS  = 30000;

  function getAttempts() {
    return parseInt(localStorage.getItem(ATTEMPT_KEY) || '0', 10);
  }

  function incrementAttempts() {
    const n = getAttempts() + 1;
    localStorage.setItem(ATTEMPT_KEY, n);
    if (n >= MAX_ATTEMPTS) {
      localStorage.setItem(COOLDOWN_KEY, Date.now() + COOLDOWN_MS);
    }
    return n;
  }

  function resetAttempts() {
    localStorage.removeItem(ATTEMPT_KEY);
    localStorage.removeItem(COOLDOWN_KEY);
  }

  function isInCooldown() {
    const cooldownUntil = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
    return Date.now() < cooldownUntil;
  }

  function getCooldownRemaining() {
    const cooldownUntil = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
    return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  }

  /* ════════════════════════════════════════════════════════════
     LOGIN FORM
  ════════════════════════════════════════════════════════════ */
  function initLoginForm() {
    const form       = $('#login-form');
    const errorEl    = $('#login-error');
    const submitBtn  = $('#login-submit');
    const btnText    = $('#login-btn-text');
    const pwInput    = $('#login-password');
    const togglePw   = $('#toggle-password');

    if (!form) return;

    // Toggle password visibility
    togglePw?.addEventListener('click', () => {
      const isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      const icon = togglePw.querySelector('i');
      if (icon) icon.className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Cooldown check
      if (isInCooldown()) {
        showError(`Terlalu banyak percobaan. Tunggu ${getCooldownRemaining()} detik.`);
        return;
      }

      const username = $('#login-username').value.trim();
      const password = pwInput.value;

      if (!username || !password) {
        showError('Username dan password harus diisi.');
        return;
      }

      // Loading state
      submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Memverifikasi...';

      try {
        const ok = await verifyLogin(username, password);
        if (ok) {
          resetAttempts();
          setSession();
          showDashboard();
        } else {
          const attempts = incrementAttempts();
          const remaining = MAX_ATTEMPTS - attempts;
          if (isInCooldown()) {
            showError(`Terlalu banyak percobaan gagal. Tunggu ${getCooldownRemaining()} detik.`);
          } else {
            showError(`Username atau password salah. ${remaining > 0 ? `Sisa percobaan: ${remaining}.` : ''}`);
          }
        }
      } catch (err) {
        showError('Terjadi kesalahan. Silakan coba lagi.');
        console.error('Login error:', err);
      } finally {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Masuk';
      }
    });

    function showError(msg) {
      if (!errorEl) return;
      errorEl.innerHTML = `<i class="fas fa-circle-xmark" aria-hidden="true"></i> ${msg}`;
      errorEl.classList.remove('hidden');
      setTimeout(() => errorEl.classList.add('hidden'), 5000);
    }
  }

  /* ════════════════════════════════════════════════════════════
     SHOW / HIDE VIEWS
  ════════════════════════════════════════════════════════════ */
  function checkSession() {
    if (isLoggedIn()) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    $('#admin-login-view')?.classList.remove('hidden');
    $('#admin-dashboard-view')?.classList.add('hidden');
    initLoginForm();
  }

  function showDashboard() {
    $('#admin-login-view')?.classList.add('hidden');
    const dashboard = $('#admin-dashboard-view');
    if (dashboard) dashboard.classList.remove('hidden');
    initDashboard();
  }

  /* ════════════════════════════════════════════════════════════
     LOGOUT
  ════════════════════════════════════════════════════════════ */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#logout-btn')) {
      clearSession();
      showLogin();
      toast('Berhasil logout.', 'success');
    }
  });

  /* ════════════════════════════════════════════════════════════
     DASHBOARD INIT
  ════════════════════════════════════════════════════════════ */
  function initDashboard() {
    initSidebarNav();
    initSidebarToggle();
    renderActivePanel('profile');
    document.title = 'Admin Dashboard – Havib Syahputra';
  }

  /* ── Sidebar navigation ── */
  function initSidebarNav() {
    $$('.admin-nav__item').forEach(item => {
      item.addEventListener('click', () => {
        $$('.admin-nav__item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const panel = item.dataset.panel;
        renderActivePanel(panel);
        closeSidebarMobile();
      });
    });
  }

  /* ── Mobile sidebar toggle ── */
  function initSidebarToggle() {
    const toggle   = $('#sidebar-toggle');
    const sidebar  = $('#admin-sidebar');
    const closeBtn = $('#sidebar-close');

    // Overlay element
    let overlay = $('#admin-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'admin-sidebar-overlay';
      overlay.className = 'admin-sidebar__overlay';
      $('#admin-dashboard-view')?.appendChild(overlay);
    }

    function openSidebar() {
      sidebar?.classList.add('open');
      overlay.classList.add('active');
    }

    function closeSidebar() {
      sidebar?.classList.remove('open');
      overlay.classList.remove('active');
    }

    toggle?.addEventListener('click', openSidebar);
    closeBtn?.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
  }

  function closeSidebarMobile() {
    if (window.innerWidth < 1024) {
      $('#admin-sidebar')?.classList.remove('open');
      $('#admin-sidebar-overlay')?.classList.remove('active');
    }
  }

  /* ════════════════════════════════════════════════════════════
     RENDER PANEL
  ════════════════════════════════════════════════════════════ */
  function renderActivePanel(panelName) {
    // Update topbar title
    const titles = { profile: 'Profil', projects: 'Proyek', certificates: 'Sertifikat', settings: 'Pengaturan' };
    const titleEl = $('#panel-title');
    if (titleEl) titleEl.textContent = titles[panelName] || panelName;

    // Show/hide panels
    $$('.admin-panel').forEach(p => {
      p.classList.remove('active');
      p.classList.add('hidden');
    });
    const activeEl = $(`#panel-${panelName}`);
    if (activeEl) {
      activeEl.classList.remove('hidden');
      activeEl.classList.add('active');
    }

    // Render content
    switch (panelName) {
      case 'profile':      renderProfilePanel();      break;
      case 'projects':     renderProjectsPanel();     break;
      case 'certificates': renderCertsPanel();        break;
      case 'settings':     renderSettingsPanel();     break;
    }
  }

  /* ════════════════════════════════════════════════════════════
     PANEL: PROFIL
  ════════════════════════════════════════════════════════════ */
  function renderProfilePanel() {
    const panel = $('#panel-profile');
    if (!panel) return;
    const data  = getPortfolioData();
    const p     = data.profile;

    panel.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">Edit Profil</h2>
      </div>

      <!-- Foto Profil -->
      <div class="admin-card">
        <h3 style="margin-bottom:1rem;font-size:0.95rem;font-weight:700">Foto Profil</h3>
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <div class="admin-photo-preview" id="profile-photo-preview" aria-label="Preview foto profil">
            ${buildPhotoPreviewHTML()}
          </div>
          <div>
            <input type="file" id="profile-photo-input" accept=".jpeg,.jpg,.png,image/jpeg,image/png,image/jpg" style="display:none" aria-label="Upload foto profil">
            <button class="btn btn--outline btn--sm" onclick="document.getElementById('profile-photo-input').click()" aria-label="Pilih foto profil">
              <i class="fas fa-upload" aria-hidden="true"></i> Upload Foto
            </button>
            <button class="btn btn--ghost btn--sm" id="remove-photo-btn" style="margin-top:0.4rem" aria-label="Hapus foto profil">
              <i class="fas fa-trash" aria-hidden="true"></i> Hapus
            </button>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem">JPG, JPEG, PNG, maks. 600×600 px</p>
          </div>
        </div>
      </div>

      <!-- Info Dasar -->
      <div class="admin-card">
        <h3 style="margin-bottom:1rem;font-size:0.95rem;font-weight:700">Informasi Dasar</h3>
        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr">
          ${buildInput('Nama Lengkap',  'profile-name',     p.name,     'text', 'Nama lengkap Anda')}
          ${buildInput('Lokasi',        'profile-location', p.location, 'text', 'Kota, Provinsi')}
          ${buildInput('Email',         'profile-email',    p.email,    'email','email@example.com')}
          ${buildInput('Telepon',       'profile-phone',    p.phone,    'tel',  '+62-xxx-xxxx-xxxx')}
        </div>
        <div style="margin-top:1rem">
          ${buildTextarea('Headline',  'profile-headline', p.headline, 2)}
          ${buildTextarea('Bio / Tentang Saya', 'profile-bio', p.bio, 5)}
        </div>
      </div>

      <!-- Sosial -->
      <div class="admin-card">
        <h3 style="margin-bottom:1rem;font-size:0.95rem;font-weight:700">Tautan Sosial</h3>
        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr">
          ${buildInput('GitHub',    'profile-github',    p.github,    'url', 'https://github.com/...')}
          ${buildInput('LinkedIn',  'profile-linkedin',  p.linkedin,  'url', 'https://linkedin.com/in/...')}
          ${buildInput('WhatsApp',  'profile-whatsapp',  p.whatsapp,  'url', 'https://wa.me/62...')}
          ${buildInput('Instagram', 'profile-instagram', p.instagram, 'url', 'https://instagram.com/...')}
        </div>
      </div>

      <!-- Typewriter -->
      <div class="admin-card">
        <h3 style="margin-bottom:0.5rem;font-size:0.95rem;font-weight:700">Teks Typewriter</h3>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem">Satu teks per baris</p>
        <textarea class="textarea-field" id="profile-typewriter" rows="4" aria-label="Teks typewriter">${(p.typewriterTexts || []).join('\n')}</textarea>
      </div>

      <!-- Open to Work -->
      <div class="admin-card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem">
          <div>
            <h3 style="font-size:0.95rem;font-weight:700">Status Open to Work</h3>
            <p style="font-size:0.8rem;color:var(--text-muted)">Tampilkan badge "Open to Work" di halaman utama</p>
          </div>
          <label class="toggle-switch" aria-label="Toggle Open to Work">
            <input type="checkbox" id="profile-otw" ${p.openToWork ? 'checked' : ''}>
            <span class="toggle-switch__slider"></span>
          </label>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        <button class="btn btn--primary" id="save-profile-btn" aria-label="Simpan perubahan profil">
          <i class="fas fa-save" aria-hidden="true"></i> Simpan Perubahan
        </button>
      </div>
    `;

    // Photo upload
    const photoInput = $('#profile-photo-input');
    photoInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await processUploadedFile(file, 600, 0.85);
        const stored = saveStorageItem('portfolio_img_profile', result.data);
        if (!stored) { toast('Storage penuh, tidak dapat menyimpan foto.', 'error'); return; }
        
        // Update data profil
        const data = getPortfolioData();
        data.profile.photo = result.data;
        savePortfolioData(data);

        // Update preview
        const preview = $('#profile-photo-preview');
        if (preview) preview.innerHTML = `<img src="${result.data}" alt="Foto profil">`;
        toast('Foto berhasil diupload.', 'success');
        if (window.MainModule) window.MainModule.refresh();
        triggerAutoSync('Foto Profil');
      } catch (err) {
        toast(err.message || 'Gagal memproses gambar.', 'error');
      }
    });

    // Remove photo
    $('#remove-photo-btn')?.addEventListener('click', () => {
      localStorage.removeItem('portfolio_img_profile');
      const data = getPortfolioData();
      data.profile.photo = '';
      savePortfolioData(data);

      const preview = $('#profile-photo-preview');
      if (preview) preview.innerHTML = buildPhotoPreviewHTML();
      toast('Foto profil dihapus.', 'info');
      if (window.MainModule) window.MainModule.refresh();
      triggerAutoSync('Hapus Foto Profil');
    });

    // Save profile
    $('#save-profile-btn')?.addEventListener('click', () => {
      const data = getPortfolioData();
      data.profile.name         = $('#profile-name')?.value.trim()      || data.profile.name;
      data.profile.location     = $('#profile-location')?.value.trim()  || data.profile.location;
      data.profile.email        = $('#profile-email')?.value.trim()     || data.profile.email;
      data.profile.phone        = $('#profile-phone')?.value.trim()     || data.profile.phone;
      data.profile.headline     = $('#profile-headline')?.value.trim()  || data.profile.headline;
      data.profile.bio          = $('#profile-bio')?.value.trim()       || data.profile.bio;
      data.profile.github       = $('#profile-github')?.value.trim();
      data.profile.linkedin     = $('#profile-linkedin')?.value.trim();
      data.profile.whatsapp     = $('#profile-whatsapp')?.value.trim();
      data.profile.instagram    = $('#profile-instagram')?.value.trim();
      data.profile.openToWork   = $('#profile-otw')?.checked || false;
      const twRaw = $('#profile-typewriter')?.value || '';
      data.profile.typewriterTexts = twRaw.split('\n').map(s => s.trim()).filter(Boolean);

      const savedPhoto = localStorage.getItem('portfolio_img_profile');
      if (savedPhoto) {
        data.profile.photo = savedPhoto;
      }

      if (savePortfolioData(data)) {
        toast('Profil berhasil disimpan!', 'success');
        if (window.MainModule) window.MainModule.refresh();
        triggerAutoSync('Profil');
      } else {
        toast('Gagal menyimpan (storage penuh).', 'error');
      }
    });
  }

  function buildPhotoPreviewHTML() {
    const src = getProfileImage();
    return src
      ? `<img src="${src}" alt="Foto profil">`
      : `<div style="width:100%;height:100%;display:grid;place-items:center;font-family:Poppins,sans-serif;font-size:1.5rem;font-weight:800;background:var(--gradient-main);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">HS</div>`;
  }

  /* ════════════════════════════════════════════════════════════
     PANEL: PROYEK
  ════════════════════════════════════════════════════════════ */
  let editingProjectId = null;

  function renderProjectsPanel() {
    const panel = $('#panel-projects');
    if (!panel) return;
    const data  = getPortfolioData();

    panel.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">Manajemen Proyek</h2>
        <button class="btn btn--primary btn--sm" id="add-project-btn" aria-label="Tambah proyek baru">
          <i class="fas fa-plus" aria-hidden="true"></i> Tambah Proyek
        </button>
      </div>

      <div id="project-form-wrapper" class="admin-card hidden" aria-label="Form proyek">
        <h3 style="margin-bottom:1rem;font-size:0.95rem;font-weight:700" id="project-form-title">Tambah Proyek</h3>
        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr">
          ${buildInput('Judul Proyek',   'pf-title',    '', 'text', 'Nama proyek')}
          ${buildInput('Tahun',          'pf-year',     '', 'number','2025')}
          <div class="form-group">
            <label class="form-label" for="pf-category">Kategori</label>
            <select class="select-field" id="pf-category" aria-label="Kategori proyek">
              <option value="Web">Web</option>
              <option value="Mobile">Mobile</option>
              <option value="WordPress">WordPress</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Teknologi <small style="color:var(--text-muted)">(Enter untuk tambah)</small></label>
            <div class="tag-input-container" id="pf-tech-container" aria-label="Input teknologi">
              <input class="tag-input-field" id="pf-tech-input" placeholder="mis. Laravel, MySQL..." aria-label="Masukkan teknologi">
            </div>
          </div>
        </div>
        ${buildTextarea('Deskripsi', 'pf-desc', '', 3)}
        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr;margin-top:1rem">
          ${buildInput('Link Demo', 'pf-demo', '', 'url', 'https://...')}
          ${buildInput('Link Repo', 'pf-repo', '', 'url', 'https://github.com/...')}
        </div>
        <div class="form-group" style="margin-top:1rem">
          <label class="form-label">Gambar Proyek (JPEG, JPG, PNG)</label>
          <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
            <div id="pf-img-preview" style="width:120px;height:68px;border-radius:8px;overflow:hidden;background:var(--bg-card);border:1px solid var(--glass-border);display:grid;place-items:center">
              <i class="fas fa-image" style="color:var(--text-muted);font-size:1.5rem" aria-hidden="true"></i>
            </div>
            <div>
              <input type="file" id="pf-img-input" accept=".jpeg,.jpg,.png,image/jpeg,image/png,image/jpg" style="display:none" aria-label="Upload gambar proyek">
              <button type="button" class="btn btn--outline btn--sm" onclick="document.getElementById('pf-img-input').click()" aria-label="Upload gambar">
                <i class="fas fa-upload" aria-hidden="true"></i> Upload Gambar
              </button>
              <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.35rem">Mendukung: JPEG, JPG, PNG</div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:0.75rem;margin-top:1.25rem;flex-wrap:wrap">
          <button class="btn btn--primary btn--sm" id="pf-save-btn" aria-label="Simpan proyek">
            <i class="fas fa-save" aria-hidden="true"></i> Simpan
          </button>
          <button class="btn btn--ghost btn--sm" id="pf-cancel-btn" aria-label="Batal">Batal</button>
        </div>
      </div>

      <div id="projects-admin-list" style="display:flex;flex-direction:column;gap:0.75rem">
        ${data.projects.map(p => buildProjectListItem(p)).join('')}
      </div>
    `;

    // Tambah proyek
    $('#add-project-btn')?.addEventListener('click', () => {
      editingProjectId = null;
      $('#project-form-title').textContent = 'Tambah Proyek';
      resetProjectForm();
      $('#project-form-wrapper')?.classList.remove('hidden');
    });

    // Batal
    $('#pf-cancel-btn')?.addEventListener('click', () => {
      $('#project-form-wrapper')?.classList.add('hidden');
      editingProjectId = null;
    });

    // Tag input
    initTagInput('pf-tech-input', 'pf-tech-container', []);

    // Image upload
    $('#pf-img-input')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await processUploadedFile(file, 1280, 0.85);
        const preview = $('#pf-img-preview');
        if (preview) preview.innerHTML = `<img src="${result.data}" alt="Preview gambar" style="width:100%;height:100%;object-fit:cover">`;
        $('#pf-img-input').dataset.b64 = result.data;
        toast(`Gambar "${file.name}" berhasil dipilih.`, 'success');
      } catch (err) { toast(err.message || 'Gagal memproses gambar.', 'error'); }
    });

    // Simpan proyek
    $('#pf-save-btn')?.addEventListener('click', saveProject);

    // Edit & Delete
    $('#projects-admin-list')?.addEventListener('click', (e) => {
      const editBtn   = e.target.closest('[data-edit-project]');
      const deleteBtn = e.target.closest('[data-delete-project]');
      if (editBtn)   openEditProject(editBtn.dataset.editProject);
      if (deleteBtn) deleteProject(deleteBtn.dataset.deleteProject);
    });
  }

  function buildProjectListItem(p) {
    return `
      <div class="admin-list-item" data-project-item="${p.id}">
        <div class="admin-list-item__info">
          <div class="admin-list-item__title">${p.title}</div>
          <div class="admin-list-item__subtitle">${p.category} · ${p.year}</div>
        </div>
        <div class="admin-list-item__actions">
          <button class="btn btn--ghost btn--sm" data-edit-project="${p.id}" aria-label="Edit proyek ${p.title}">
            <i class="fas fa-pen" aria-hidden="true"></i>
          </button>
          <button class="btn btn--danger btn--sm" data-delete-project="${p.id}" aria-label="Hapus proyek ${p.title}">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
  }

  function resetProjectForm() {
    ['pf-title','pf-year','pf-demo','pf-repo','pf-desc'].forEach(id => {
      const el = $(`#${id}`);
      if (el) el.value = '';
    });
    $('#pf-category').value = 'Web';
    clearTagInput('pf-tech-container');
    const preview = $('#pf-img-preview');
    if (preview) preview.innerHTML = `<i class="fas fa-image" style="color:var(--text-muted);font-size:1.5rem" aria-hidden="true"></i>`;
    const imgInput = $('#pf-img-input');
    if (imgInput) { imgInput.value = ''; imgInput.dataset.b64 = ''; }
  }

  function openEditProject(projectId) {
    const data    = getPortfolioData();
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;

    editingProjectId = projectId;
    $('#project-form-title').textContent = 'Edit Proyek';
    $('#project-form-wrapper')?.classList.remove('hidden');
    $('#project-form-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Fill form
    const set = (id, val) => { const el = $(`#${id}`); if (el) el.value = val || ''; };
    set('pf-title', project.title);
    set('pf-year',  project.year);
    set('pf-desc',  project.description);
    set('pf-demo',  project.demo);
    set('pf-repo',  project.repo);
    const catSel = $('#pf-category');
    if (catSel) catSel.value = project.category || 'Web';

    // Tags
    clearTagInput('pf-tech-container');
    initTagInput('pf-tech-input', 'pf-tech-container', project.technologies || []);

    // Preview image
    const imgSrc = getProjectImage(projectId, project.image);
    const preview = $('#pf-img-preview');
    if (preview && imgSrc) {
      preview.innerHTML = `<img src="${imgSrc}" alt="Preview" style="width:100%;height:100%;object-fit:cover">`;
    }
  }

  function saveProject() {
    const title    = $('#pf-title')?.value.trim();
    const year     = $('#pf-year')?.value.trim();
    const category = $('#pf-category')?.value;
    const desc     = $('#pf-desc')?.value.trim();
    const demo     = $('#pf-demo')?.value.trim();
    const repo     = $('#pf-repo')?.value.trim();
    const tech     = getTagValues('pf-tech-container');
    const imgB64   = $('#pf-img-input')?.dataset.b64;

    if (!title) { toast('Judul proyek wajib diisi.', 'warning'); return; }

    const data = getPortfolioData();
    const newId = editingProjectId || slugify(title);
    const existing = editingProjectId ? data.projects.find(p => p.id === editingProjectId) : null;

    if (imgB64) {
      saveStorageItem(`portfolio_img_project_${newId}`, imgB64);
    }

    const projectData = {
      id:           newId,
      title,
      year:         year || String(new Date().getFullYear()),
      category:     category || 'Web',
      description:  desc || '',
      technologies: tech,
      image:        imgB64 || (existing ? existing.image : ''),
      demo:         demo || '',
      repo:         repo || ''
    };

    if (editingProjectId) {
      const idx = data.projects.findIndex(p => p.id === editingProjectId);
      if (idx !== -1) data.projects[idx] = projectData;
    } else {
      data.projects.push(projectData);
    }

    if (savePortfolioData(data)) {
      toast(`Proyek "${title}" berhasil disimpan!`, 'success');
      renderProjectsPanel();
      if (window.MainModule) window.MainModule.refresh();
      triggerAutoSync(`Proyek: ${title}`);
    } else {
      toast('Gagal menyimpan (storage penuh).', 'error');
    }
  }

  function deleteProject(projectId) {
    if (!confirm('Yakin ingin menghapus proyek ini?')) return;
    const data = getPortfolioData();
    data.projects = data.projects.filter(p => p.id !== projectId);
    localStorage.removeItem(`portfolio_img_project_${projectId}`);
    if (savePortfolioData(data)) {
      toast('Proyek berhasil dihapus.', 'info');
      renderProjectsPanel();
      if (window.MainModule) window.MainModule.refresh();
      triggerAutoSync(`Hapus Proyek: ${projectId}`);
    }
  }

  /* ════════════════════════════════════════════════════════════
     PANEL: SERTIFIKAT
  ════════════════════════════════════════════════════════════ */
  let editingCertId = null;

  function renderCertsPanel() {
    const panel = $('#panel-certificates');
    if (!panel) return;
    const data  = getPortfolioData();

    panel.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">Manajemen Sertifikat</h2>
        <button class="btn btn--primary btn--sm" id="add-cert-btn" aria-label="Tambah sertifikat baru">
          <i class="fas fa-plus" aria-hidden="true"></i> Tambah Sertifikat
        </button>
      </div>

      <div id="cert-form-wrapper" class="admin-card hidden" aria-label="Form sertifikat">
        <h3 style="margin-bottom:1rem;font-size:0.95rem;font-weight:700" id="cert-form-title">Tambah Sertifikat</h3>
        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr">
          ${buildInput('Judul',   'cf-title',  '', 'text',   'Nama sertifikat')}
          ${buildInput('Penerbit','cf-issuer', '', 'text',   'Lembaga penerbit')}
          ${buildInput('Tahun',   'cf-year',   '', 'number', '2025')}
          <div class="form-group">
            <label class="form-label" for="cf-category">Kategori</label>
            <select class="select-field" id="cf-category" aria-label="Kategori sertifikat">
              <option value="Kompetensi">Kompetensi</option>
              <option value="Prestasi">Prestasi</option>
              <option value="Bahasa">Bahasa</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:1rem">
          <label class="form-label">File Sertifikat (PDF, JPEG, JPG, PNG)</label>
          <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
            <div id="cf-img-preview" style="width:180px;height:120px;border-radius:8px;overflow:hidden;background:var(--bg-card);border:1px solid var(--glass-border);display:grid;place-items:center">
              <i class="fas fa-certificate" style="color:var(--text-muted);font-size:2rem" aria-hidden="true"></i>
            </div>
            <div>
              <input type="file" id="cf-img-input" accept=".pdf,.jpeg,.jpg,.png,application/pdf,image/jpeg,image/png,image/jpg" style="display:none" aria-label="Upload file sertifikat">
              <button type="button" class="btn btn--outline btn--sm" onclick="document.getElementById('cf-img-input').click()" aria-label="Upload file">
                <i class="fas fa-upload" aria-hidden="true"></i> Upload Gambar / PDF
              </button>
              <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.35rem">Mendukung: PDF, JPEG, JPG, PNG (Maks 4MB)</div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:0.75rem;margin-top:1.25rem;flex-wrap:wrap">
          <button class="btn btn--primary btn--sm" id="cf-save-btn" aria-label="Simpan sertifikat">
            <i class="fas fa-save" aria-hidden="true"></i> Simpan
          </button>
          <button class="btn btn--ghost btn--sm" id="cf-cancel-btn" aria-label="Batal">Batal</button>
        </div>
      </div>

      <div id="certs-admin-list" style="display:flex;flex-direction:column;gap:0.75rem">
        ${data.certificates.map(c => buildCertListItem(c)).join('')}
      </div>
    `;

    $('#add-cert-btn')?.addEventListener('click', () => {
      editingCertId = null;
      $('#cert-form-title').textContent = 'Tambah Sertifikat';
      resetCertForm();
      $('#cert-form-wrapper')?.classList.remove('hidden');
    });

    $('#cf-cancel-btn')?.addEventListener('click', () => {
      $('#cert-form-wrapper')?.classList.add('hidden');
      editingCertId = null;
    });

    $('#cf-img-input')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await processUploadedFile(file, 1200, 0.85);
        renderCertPreviewInAdmin(result.data, file.name);
        $('#cf-img-input').dataset.b64 = result.data;
        toast(`${result.type === 'pdf' ? 'Dokumen PDF' : 'Gambar'} "${file.name}" berhasil dipilih!`, 'success');
      } catch (err) { toast(err.message || 'Gagal memproses file.', 'error'); }
    });

    $('#cf-save-btn')?.addEventListener('click', saveCert);

    $('#certs-admin-list')?.addEventListener('click', (e) => {
      const editBtn   = e.target.closest('[data-edit-cert]');
      const deleteBtn = e.target.closest('[data-delete-cert]');
      if (editBtn)   openEditCert(editBtn.dataset.editCert);
      if (deleteBtn) deleteCert(deleteBtn.dataset.deleteCert);
    });
  }

  function buildCertListItem(c) {
    return `
      <div class="admin-list-item">
        <div class="admin-list-item__info">
          <div class="admin-list-item__title">${c.title}</div>
          <div class="admin-list-item__subtitle">${c.issuer} · ${c.year} · ${c.category}</div>
        </div>
        <div class="admin-list-item__actions">
          <button class="btn btn--ghost btn--sm" data-edit-cert="${c.id}" aria-label="Edit ${c.title}">
            <i class="fas fa-pen" aria-hidden="true"></i>
          </button>
          <button class="btn btn--danger btn--sm" data-delete-cert="${c.id}" aria-label="Hapus ${c.title}">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderCertPreviewInAdmin(src, title = '') {
    const preview = $('#cf-img-preview');
    if (!preview) return;
    if (!src) {
      preview.innerHTML = `<i class="fas fa-certificate" style="color:var(--text-muted);font-size:2rem" aria-hidden="true"></i>`;
      return;
    }
    if (typeof isPdfUrl === 'function' && isPdfUrl(src)) {
      preview.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;text-align:center;padding:0.5rem;background:rgba(239,68,68,0.12);border:1px dashed rgba(239,68,68,0.4);border-radius:6px">
          <i class="fas fa-file-pdf" style="color:#ef4444;font-size:2.2rem;margin-bottom:0.25rem" aria-hidden="true"></i>
          <span style="font-size:0.72rem;font-weight:600;color:var(--text-primary);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title || 'Dokumen PDF'}</span>
          <span style="font-size:0.65rem;color:#ef4444;font-weight:600">Dokumen PDF Terpasang</span>
        </div>
      `;
    } else {
      preview.innerHTML = `<img src="${src}" alt="Preview" style="width:100%;height:100%;object-fit:cover">`;
    }
  }

  function resetCertForm() {
    ['cf-title','cf-issuer','cf-year'].forEach(id => {
      const el = $(`#${id}`); if (el) el.value = '';
    });
    $('#cf-category').value = 'Kompetensi';
    renderCertPreviewInAdmin(null);
    const imgInput = $('#cf-img-input');
    if (imgInput) { imgInput.value = ''; imgInput.dataset.b64 = ''; }
  }

  function openEditCert(certId) {
    const data = getPortfolioData();
    const cert = data.certificates.find(c => c.id === certId);
    if (!cert) return;

    editingCertId = certId;
    $('#cert-form-title').textContent = 'Edit Sertifikat';
    $('#cert-form-wrapper')?.classList.remove('hidden');
    $('#cert-form-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const set = (id, val) => { const el = $(`#${id}`); if (el) el.value = val || ''; };
    set('cf-title',  cert.title);
    set('cf-issuer', cert.issuer);
    set('cf-year',   cert.year);
    const catSel = $('#cf-category');
    if (catSel) catSel.value = cert.category || 'Kompetensi';

    const imgSrc = getCertImage(certId, cert.image);
    renderCertPreviewInAdmin(imgSrc, cert.title);
    const imgInput = $('#cf-img-input');
    if (imgInput) {
      imgInput.value = '';
      imgInput.dataset.b64 = imgSrc || '';
    }
  }

  function saveCert() {
    const title    = $('#cf-title')?.value.trim();
    const issuer   = $('#cf-issuer')?.value.trim();
    const year     = $('#cf-year')?.value.trim();
    const category = $('#cf-category')?.value;
    const imgB64   = $('#cf-img-input')?.dataset.b64;

    if (!title) { toast('Judul sertifikat wajib diisi.', 'warning'); return; }

    const data  = getPortfolioData();
    const newId = editingCertId || slugify(title);
    const existing = editingCertId ? data.certificates.find(c => c.id === editingCertId) : null;

    if (imgB64) {
      saveStorageItem(`portfolio_img_cert_${newId}`, imgB64);
    }

    const certData = {
      id: newId,
      title,
      issuer: issuer || '',
      year: year || '',
      category: category || 'Kompetensi',
      image: imgB64 || (existing ? existing.image : '')
    };

    if (editingCertId) {
      const idx = data.certificates.findIndex(c => c.id === editingCertId);
      if (idx !== -1) data.certificates[idx] = certData;
    } else {
      data.certificates.push(certData);
    }

    if (savePortfolioData(data)) {
      toast(`Sertifikat "${title}" berhasil disimpan!`, 'success');
      renderCertsPanel();
      if (window.MainModule) window.MainModule.refresh();
      triggerAutoSync(`Sertifikat: ${title}`);
    } else {
      toast('Gagal menyimpan (storage penuh).', 'error');
    }
  }

  function deleteCert(certId) {
    if (!confirm('Yakin ingin menghapus sertifikat ini?')) return;
    const data = getPortfolioData();
    data.certificates = data.certificates.filter(c => c.id !== certId);
    localStorage.removeItem(`portfolio_img_cert_${certId}`);
    if (savePortfolioData(data)) {
      toast('Sertifikat berhasil dihapus.', 'info');
      renderCertsPanel();
      if (window.MainModule) window.MainModule.refresh();
      triggerAutoSync(`Hapus Sertifikat: ${certId}`);
    }
  }

  /* ════════════════════════════════════════════════════════════
     PANEL: PENGATURAN
  ════════════════════════════════════════════════════════════ */
  function renderSettingsPanel() {
    const panel = $('#panel-settings');
    if (!panel) return;

    const ghCfg = getGitHubConfig();
    const isGhConnected = !!(ghCfg.token && ghCfg.owner && ghCfg.repo);

    panel.innerHTML = `
      <div class="admin-section-header">
        <h2 class="admin-section-title">Pengaturan</h2>
      </div>

      <!-- Sinkronisasi GitHub Pages (Centralized Multi-User CMS) -->
      <div class="admin-card" style="border: 1px solid rgba(99,102,241,0.35); background: linear-gradient(135deg, rgba(99,102,241,0.04), rgba(168,85,247,0.04));">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
          <div>
            <h3 style="font-size:1.05rem;font-weight:700;display:flex;align-items:center;gap:0.5rem">
              <i class="fab fa-github" style="font-size:1.25rem" aria-hidden="true"></i> Sinkronisasi GitHub Pages
            </h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">
              Hubungkan ke repositori GitHub agar semua perubahan (profil, foto, proyek, sertifikat) otomatis terlihat oleh semua pengunjung web.
            </p>
          </div>
          <div>
            <span class="badge ${isGhConnected ? 'badge--primary' : 'badge--outline'}" id="gh-status-badge" style="font-size:0.75rem;padding:0.35rem 0.75rem">
              <i class="fas ${isGhConnected ? 'fa-circle-check' : 'fa-circle-notch'}" aria-hidden="true"></i>
              ${isGhConnected ? `Terhubung: ${escapeHTML(ghCfg.owner)}/${escapeHTML(ghCfg.repo)}` : 'Belum Dikonfigurasi'}
            </span>
          </div>
        </div>

        <div class="admin-form-grid" style="grid-template-columns:1fr 1fr">
          ${buildInput('GitHub Username / Owner', 'gh-owner', ghCfg.owner, 'text', 'mis. havibsyahputra')}
          ${buildInput('Nama Repository', 'gh-repo', ghCfg.repo, 'text', 'mis. Portofolio-Diri')}
          ${buildInput('Branch', 'gh-branch', ghCfg.branch || 'main', 'text', 'main')}
          
          <div class="form-group">
            <label class="form-label" for="gh-token">Personal Access Token (PAT)</label>
            <div class="input-wrapper" style="position:relative">
              <input type="password" class="form-input" id="gh-token" value="${escapeHTML(ghCfg.token || '')}"
                     placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="padding-left:1rem;padding-right:2.5rem" aria-label="GitHub Token">
              <button type="button" id="gh-toggle-token" style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0.25rem">
                <i class="fas fa-eye" aria-hidden="true"></i>
              </button>
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.3rem">
              🔒 <strong>Hanya tersimpan di browser Anda:</strong> Token tidak pernah disimpan di kode publik atau server.
            </div>
          </div>
        </div>

        <div style="margin-top:1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0.75rem;background:var(--bg-glass);border-radius:8px;border:1px solid var(--glass-border)">
          <div>
            <div style="font-size:0.85rem;font-weight:600">Otomatis Sinkronkan Saat Menyimpan</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Setiap kali Anda klik simpan profil, proyek, atau sertifikat, otomatis kirim ke GitHub Pages</div>
          </div>
          <label class="toggle-switch" aria-label="Toggle Auto-Sync">
            <input type="checkbox" id="gh-autosync" ${ghCfg.autoSync !== false ? 'checked' : ''}>
            <span class="toggle-switch__slider"></span>
          </label>
        </div>

        <!-- Tombol Aksi GitHub -->
        <div style="display:flex;gap:0.75rem;margin-top:1.25rem;flex-wrap:wrap">
          <button class="btn btn--primary btn--sm" id="gh-save-btn">
            <i class="fas fa-plug" aria-hidden="true"></i> Tes &amp; Simpan Konfigurasi
          </button>
          <button class="btn btn--outline btn--sm" id="gh-push-btn">
            <i class="fas fa-cloud-arrow-up" aria-hidden="true"></i> Sinkronkan Sekarang (Push)
          </button>
          <button class="btn btn--ghost btn--sm" id="gh-pull-btn">
            <i class="fas fa-cloud-arrow-down" aria-hidden="true"></i> Tarik Data dari GitHub (Pull)
          </button>
          ${isGhConnected ? `
            <button class="btn btn--danger btn--sm" id="gh-disconnect-btn" style="margin-left:auto">
              <i class="fas fa-unlink" aria-hidden="true"></i> Putus Koneksi
            </button>
          ` : ''}
        </div>

        <!-- Panduan Pembuatan Token GitHub -->
        <details style="margin-top:1.25rem;background:rgba(0,0,0,0.15);padding:0.75rem 1rem;border-radius:8px;font-size:0.8rem">
          <summary style="cursor:pointer;font-weight:600;color:var(--primary-color)">
            <i class="fas fa-question-circle" aria-hidden="true"></i> Panduan: Cara membuat Token GitHub (Gratis &amp; 1 Menit)
          </summary>
          <ol style="margin-top:0.75rem;padding-left:1.25rem;line-height:1.6;color:var(--text-secondary)">
            <li>Buka <strong>github.com</strong> dan login ke akun Anda.</li>
            <li>Klik foto profil Anda di pojok kanan atas → pilih <strong>Settings</strong>.</li>
            <li>Scroll ke bawah di menu kiri, pilih <strong>Developer Settings</strong>.</li>
            <li>Pilih <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong>.</li>
            <li>Klik <strong>Generate new token (classic)</strong>.</li>
            <li>Beri nama di kolom Note (contoh: <code>Portofolio CMS</code>) dan atur Expiration (bisa 90 hari atau No expiration).</li>
            <li>Centang kotak izin: <strong>repo</strong> (Full control of private and public repositories).</li>
            <li>Klik tombol hijau <strong>Generate token</strong> di bawah.</li>
            <li>Salin token yang diawali <code>ghp_...</code> dan tempel di formulir di atas, lalu klik <strong>Tes &amp; Simpan Konfigurasi</strong>.</li>
          </ol>
        </details>
      </div>

      <!-- Ubah Kredensial -->
      <div class="admin-card">
        <h3 style="margin-bottom:1rem;font-size:0.95rem;font-weight:700">Ubah Username &amp; Password Login Admin</h3>
        <div class="admin-form-grid" style="grid-template-columns:1fr">
          ${buildInput('Username Baru',    'new-username', '', 'text',     'Username baru')}
          ${buildInput('Password Baru',    'new-password', '', 'password', '•••••••••')}
          ${buildInput('Konfirmasi Password','confirm-password','','password','•••••••••')}
        </div>
        <button class="btn btn--primary btn--sm" id="save-credentials-btn" style="margin-top:1rem" aria-label="Simpan kredensial baru">
          <i class="fas fa-key" aria-hidden="true"></i> Simpan Kredensial
        </button>
      </div>

      <!-- Export / Import -->
      <div class="admin-card">
        <h3 style="margin-bottom:1rem;font-size:0.95rem;font-weight:700">Backup &amp; Restore (File JSON Lokal)</h3>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
          <button class="btn btn--outline btn--sm" id="export-btn" aria-label="Ekspor data JSON">
            <i class="fas fa-file-export" aria-hidden="true"></i> Export JSON
          </button>
          <label class="btn btn--ghost btn--sm" style="cursor:pointer" aria-label="Impor data JSON">
            <i class="fas fa-file-import" aria-hidden="true"></i> Import JSON
            <input type="file" id="import-file" accept=".json" style="display:none">
          </label>
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem">Import akan mengganti data portofolio di browser ini.</p>
      </div>

      <!-- Reset -->
      <div class="admin-card" style="border-color:rgba(239,68,68,0.3)">
        <h3 style="margin-bottom:0.5rem;font-size:0.95rem;font-weight:700;color:#ef4444">Reset ke Data Default</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">Menghapus semua perubahan dan mengembalikan ke data awal. Tindakan ini tidak dapat dibatalkan.</p>
        <button class="btn btn--danger btn--sm" id="reset-btn" aria-label="Reset semua data ke default">
          <i class="fas fa-rotate-left" aria-hidden="true"></i> Reset Semua Data
        </button>
      </div>
    `;

    // Toggle token visibility
    $('#gh-toggle-token')?.addEventListener('click', () => {
      const inp = $('#gh-token');
      if (!inp) return;
      const isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      const icon = $('#gh-toggle-token i');
      if (icon) icon.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    // Save & Test GitHub Config
    $('#gh-save-btn')?.addEventListener('click', async () => {
      const owner    = $('#gh-owner')?.value.trim();
      const repo     = $('#gh-repo')?.value.trim();
      const branch   = $('#gh-branch')?.value.trim() || 'main';
      const token    = $('#gh-token')?.value.trim();
      const autoSync = $('#gh-autosync')?.checked !== false;

      if (!owner || !repo || !token) {
        toast('Lengkapi Owner, Repository, dan Token GitHub.', 'warning');
        return;
      }

      const saveBtn = $('#gh-save-btn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Menghubungkan...`;

      try {
        const testCfg = { owner, repo, branch, path: 'data/content.json', token, autoSync };
        await testGitHubConnection(testCfg);
        saveGitHubConfig(testCfg);
        toast(`✅ Berhasil terhubung ke repositori GitHub ${owner}/${repo}!`, 'success', 4000);
        renderSettingsPanel();
      } catch (err) {
        toast(`Gagal terhubung: ${err.message}`, 'error', 5000);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<i class="fas fa-plug" aria-hidden="true"></i> Tes &amp; Simpan Konfigurasi`;
        }
      }
    });

    // Manual Push to GitHub
    $('#gh-push-btn')?.addEventListener('click', async () => {
      const pushBtn = $('#gh-push-btn');
      pushBtn.disabled = true;
      pushBtn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Menyinkronkan...`;
      try {
        await syncDataToGitHub('Manual sync from Admin Panel [skip ci]');
        toast('✅ Data portofolio berhasil di-push ke GitHub Pages!', 'success', 5000);
      } catch (err) {
        toast(`Gagal sync: ${err.message}`, 'error', 5000);
      } finally {
        if (pushBtn) {
          pushBtn.disabled = false;
          pushBtn.innerHTML = `<i class="fas fa-cloud-arrow-up" aria-hidden="true"></i> Sinkronkan Sekarang (Push)`;
        }
      }
    });

    // Manual Pull from GitHub
    $('#gh-pull-btn')?.addEventListener('click', async () => {
      if (!confirm('Tarik data dari GitHub akan menggantikan data yang ada di browser saat ini. Lanjutkan?')) return;
      const pullBtn = $('#gh-pull-btn');
      pullBtn.disabled = true;
      pullBtn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengambil data...`;
      try {
        await pullDataFromGitHub();
        toast('✅ Data terbaru dari GitHub berhasil dimuat ke admin!', 'success');
        if (window.MainModule) window.MainModule.refresh();
        renderActivePanel('profile');
      } catch (err) {
        toast(`Gagal mengambil data: ${err.message}`, 'error', 5000);
      } finally {
        if (pullBtn) {
          pullBtn.disabled = false;
          pullBtn.innerHTML = `<i class="fas fa-cloud-arrow-down" aria-hidden="true"></i> Tarik Data dari GitHub (Pull)`;
        }
      }
    });

    // Disconnect GitHub
    $('#gh-disconnect-btn')?.addEventListener('click', () => {
      if (!confirm('Putus koneksi GitHub? Token akan dihapus dari browser Anda.')) return;
      localStorage.removeItem(GITHUB_CONFIG_KEY);
      toast('Koneksi GitHub telah diputus.', 'info');
      renderSettingsPanel();
    });

    // Save credentials
    $('#save-credentials-btn')?.addEventListener('click', async () => {
      const u  = $('#new-username')?.value.trim();
      const p1 = $('#new-password')?.value;
      const p2 = $('#confirm-password')?.value;

      if (!u || !p1) { toast('Username dan password wajib diisi.', 'warning'); return; }
      if (p1 !== p2) { toast('Password tidak cocok.', 'error'); return; }
      if (p1.length < 6) { toast('Password minimal 6 karakter.', 'warning'); return; }

      const ok = await saveCredentials(u, p1);
      ok ? toast('Kredensial berhasil diperbarui!', 'success') : toast('Gagal menyimpan kredensial.', 'error');
    });

    // Export
    $('#export-btn')?.addEventListener('click', () => {
      exportDataAsJSON();
      toast('Data berhasil diekspor.', 'success');
    });

    // Import
    $('#import-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!imported.profile || !imported.projects) throw new Error('Format tidak valid');
          if (savePortfolioData(imported)) {
            toast('Data berhasil diimport!', 'success');
            if (window.MainModule) window.MainModule.refresh();
            renderActivePanel('profile');
            triggerAutoSync('Import JSON');
          } else {
            toast('Gagal mengimport (storage penuh).', 'error');
          }
        } catch (err) {
          toast('File JSON tidak valid.', 'error');
        }
      };
      reader.readAsText(file);
    });

    // Reset
    $('#reset-btn')?.addEventListener('click', () => {
      if (!confirm('PERINGATAN: Semua data dan gambar akan dihapus dan dikembalikan ke default. Lanjutkan?')) return;
      if (resetToDefault()) {
        toast('Data berhasil direset ke default.', 'success');
        if (window.MainModule) window.MainModule.refresh();
        renderActivePanel('profile');
        triggerAutoSync('Reset Default');
      } else {
        toast('Gagal mereset data.', 'error');
      }
    });
  }

  /* ════════════════════════════════════════════════════════════
     UTILITAS FORM
  ════════════════════════════════════════════════════════════ */
  function buildInput(label, id, value = '', type = 'text', placeholder = '') {
    return `
      <div class="form-group">
        <label class="form-label" for="${id}">${label}</label>
        <div class="input-wrapper">
          <input type="${type}" class="form-input" id="${id}" value="${escapeHTML(String(value || ''))}"
                 placeholder="${placeholder}" aria-label="${label}" style="padding-left:1rem">
        </div>
      </div>
    `;
  }

  function buildTextarea(label, id, value = '', rows = 3) {
    return `
      <div class="form-group" style="margin-bottom:1rem">
        <label class="form-label" for="${id}">${label}</label>
        <textarea class="textarea-field" id="${id}" rows="${rows}" aria-label="${label}">${escapeHTML(String(value || ''))}</textarea>
      </div>
    `;
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Tag Input ── */
  function initTagInput(inputId, containerId, initialTags = []) {
    const container = $(`#${containerId}`);
    const input     = $(`#${inputId}`);
    if (!container || !input) return;

    // Hapus tag lama selain input
    $$('.tag-item', container).forEach(t => t.remove());

    // Tambah initial tags
    initialTags.forEach(tag => addTag(container, input, tag));

    input.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
        e.preventDefault();
        addTag(container, input, input.value.trim());
        input.value = '';
      }
      if (e.key === 'Backspace' && !input.value) {
        const tags = $$('.tag-item', container);
        if (tags.length) tags[tags.length - 1].remove();
      }
    });

    container.addEventListener('click', () => input.focus());
  }

  function addTag(container, input, text) {
    if (!text) return;
    const tag = document.createElement('span');
    tag.className = 'tag-item';
    tag.innerHTML = `${escapeHTML(text)} <span class="tag-item__remove" role="button" tabindex="0" aria-label="Hapus tag ${text}">×</span>`;
    tag.querySelector('.tag-item__remove').addEventListener('click', () => tag.remove());
    container.insertBefore(tag, input);
  }

  function clearTagInput(containerId) {
    $$(`#${containerId} .tag-item`).forEach(t => t.remove());
  }

  function getTagValues(containerId) {
    return $$(`#${containerId} .tag-item`).map(t => t.childNodes[0].textContent.trim());
  }

  /* ════════════════════════════════════════════════════════════
     UTILITAS LAIN
  ════════════════════════════════════════════════════════════ */
  function slugify(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
      + '-' + Date.now().toString(36);
  }

  /**
   * Wrapper saveStorage yang menangani QuotaExceededError
   */
  function saveStorageItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        toast('Storage penuh! Hapus gambar lama terlebih dahulu.', 'error');
        return false;
      }
      return false;
    }
  }

  /* ════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════ */
  window.AdminModule = { checkSession };

  /* ════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════ */
  // Dipanggil oleh main.js saat navigasi ke #admin
  // Tidak perlu DOMContentLoaded karena main.js sudah menangani routing

})();
