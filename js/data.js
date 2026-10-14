/* ============================================================
   data.js – Data konten & konfigurasi aset portofolio
   Havib Syahputra | havib0102@gmail.com

   CARA MENGISI:
   - Ganti nilai string pada CONFIG sesuai file asli Anda.
   - Kosongkan string ("") jika file belum tersedia.
   - Data CV default ada di PORTFOLIO_DATA dan bisa diedit dari Admin Panel.
   ============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════
   KONFIGURASI ASET
   Semua path aset dan link sosial dipusatkan di sini.
════════════════════════════════════════════════════════════ */
const CONFIG = {
  /* ── Foto Profil (600×600 px, WebP/JPG, < 200 KB) ── */
  profilePhoto: 'assets/img/profile.jpg',

  /* ── File CV (PDF) ── */
  cvFile: 'assets/CV-Havib-Syahputra.pdf',

  /* ── Sosial Media (kosongkan jika tidak ada) ── */
  social: {
    github:    'https://github.com/havibsyahputra',   // Ganti dengan username GitHub Anda
    linkedin:  'https://linkedin.com/in/havib-syahputra',
    email:     'mailto:havib0102@gmail.com',
    whatsapp:  'https://wa.me/6287810139688',
    instagram: ''                                      // Opsional
  },

  /* ── Gambar Proyek (1280×720 px, WebP/JPG, < 300 KB) ── */
  projectImages: {
    'ss-mart-ecommerce': 'assets/projects/ss-mart-ecommerce.png',
    'ss-mart-kasir':     'assets/projects/ss-mart-kasir.png',
    'inventory':         'assets/projects/inventory.png',
    'flashcard-anatomi': 'assets/projects/flashcard.png',
    'company-sekolah':   'assets/projects/sekolah.png',
    'company-salon':     'assets/projects/salon.png'
  },

  /* ── Link Demo & Repo per Proyek ── */
  projectLinks: {
    'ss-mart-ecommerce': { demo: '', repo: '' },
    'ss-mart-kasir':     { demo: '', repo: '' },
    'inventory':         { demo: '', repo: '' },
    'flashcard-anatomi': { demo: '', repo: '' },
    'company-sekolah':   { demo: '', repo: '' },
    'company-salon':     { demo: '', repo: '' }
  },

  /* ── Gambar Sertifikat (1200×850 px, WebP/JPG, < 300 KB) ── */
  certificateImages: {
    'bnsp-web-pratama':    'assets/certificates/bnsp-web-pratama.jpg',
    'revou-coding-camp':   'assets/certificates/revou-coding-camp.jpg',
    'junior-web-dev-vnue': 'assets/certificates/junior-web-dev-vnue.jpg',
    'toeic':               'assets/certificates/toeic.jpg',
    'toefl':               'assets/certificates/toefl.jpg',
    'olympiad-undip':      'assets/certificates/olympiad-undip.jpg'
  },

  /* ── Status Open to Work ── */
  openToWork: true,

  /* ── URL Site (untuk Open Graph) ── */
  siteUrl: ''
};

/* ════════════════════════════════════════════════════════════
   DATA PORTOFOLIO DEFAULT
   Digunakan jika localStorage kosong atau belum ada data tersimpan.
   Semua data bisa diedit via Admin Panel.
════════════════════════════════════════════════════════════ */
const PORTFOLIO_DATA_DEFAULT = {

  /* ── Profil ── */
  profile: {
    name:       'Havib Syahputra',
    headline:   'Junior Web Developer | Software Engineering Graduate | UI Designer',
    location:   'Depok, Jawa Barat',
    email:      'havib0102@gmail.com',
    phone:      '+62-878-1013-9688',
    linkedin:   'https://linkedin.com/in/havib-syahputra',
    github:     CONFIG.social.github,
    whatsapp:   'https://wa.me/6287810139688',
    instagram:  '',
    openToWork: true,
    bio: 'Lulusan SMK Informatika Utama jurusan Rekayasa Perangkat Lunak yang disiplin, adaptif, dan memiliki semangat belajar tinggi. Menguasai pemrograman web (PHP, Laravel, HTML, CSS), FlutterFlow, serta desain grafis (Figma, Photoshop, Canva, CorelDraw). Aktif berorganisasi dan berpengalaman memimpin sehingga terlatih dalam komunikasi, koordinasi, dan kerja sama tim.',
    typewriterTexts: [
      'Junior Web Developer',
      'Laravel Developer',
      'UI/UX Enthusiast',
      'Mobile App Developer'
    ]
  },

  /* ── Proyek ── */
  projects: [
    {
      id:          'ss-mart-ecommerce',
      title:       'Aplikasi E-Commerce SS-MART',
      year:        '2026',
      category:    'Web',
      technologies: ['Laravel 10', 'MySQL', 'Bootstrap', 'PHP'],
      description: 'Platform e-commerce lengkap untuk toko SS-MART yang mencakup manajemen produk, keranjang belanja, proses checkout, dan sistem pembayaran berbasis web.',
      image:       CONFIG.projectImages['ss-mart-ecommerce'],
      demo:        CONFIG.projectLinks['ss-mart-ecommerce']?.demo || '',
      repo:        CONFIG.projectLinks['ss-mart-ecommerce']?.repo || ''
    },
    {
      id:          'ss-mart-kasir',
      title:       'Aplikasi Kasir SS-MART',
      year:        '2025',
      category:    'Web',
      technologies: ['Laravel 10', 'MySQL', 'JavaScript', 'PHP'],
      description: 'Sistem kasir berbasis web untuk memudahkan proses transaksi penjualan di toko SS-MART, dilengkapi laporan penjualan harian dan manajemen stok.',
      image:       CONFIG.projectImages['ss-mart-kasir'],
      demo:        CONFIG.projectLinks['ss-mart-kasir']?.demo || '',
      repo:        CONFIG.projectLinks['ss-mart-kasir']?.repo || ''
    },
    {
      id:          'inventory',
      title:       'Aplikasi Inventory Barang',
      year:        '2025',
      category:    'Web',
      technologies: ['Laravel 8', 'MySQL', 'Blade', 'PHP'],
      description: 'Sistem manajemen inventaris barang berbasis web untuk memantau stok masuk/keluar, kategori produk, dan laporan persediaan secara real-time.',
      image:       CONFIG.projectImages['inventory'],
      demo:        CONFIG.projectLinks['inventory']?.demo || '',
      repo:        CONFIG.projectLinks['inventory']?.repo || ''
    },
    {
      id:          'flashcard-anatomi',
      title:       'Aplikasi Android Flashcard Anatomi',
      year:        '2025',
      category:    'Mobile',
      technologies: ['FlutterFlow', 'Firebase', 'Dart'],
      description: 'Aplikasi Android edukatif berupa flashcard interaktif untuk mempelajari anatomi tubuh manusia, dibangun dengan FlutterFlow dan Firebase sebagai backend.',
      image:       CONFIG.projectImages['flashcard-anatomi'],
      demo:        CONFIG.projectLinks['flashcard-anatomi']?.demo || '',
      repo:        CONFIG.projectLinks['flashcard-anatomi']?.repo || ''
    },
    {
      id:          'company-sekolah',
      title:       'Website Company Profile Sekolah',
      year:        '2025',
      category:    'WordPress',
      technologies: ['WordPress', 'Elementor', 'PHP', 'CSS'],
      description: 'Website company profile resmi sekolah yang menampilkan informasi akademik, galeri kegiatan, berita terkini, dan profil tenaga pengajar.',
      image:       CONFIG.projectImages['company-sekolah'],
      demo:        CONFIG.projectLinks['company-sekolah']?.demo || '',
      repo:        CONFIG.projectLinks['company-sekolah']?.repo || ''
    },
    {
      id:          'company-salon',
      title:       'Website Company Profile Beauty Salon',
      year:        '2025',
      category:    'WordPress',
      technologies: ['WordPress', 'Elementor', 'CSS'],
      description: 'Website profil perusahaan untuk salon kecantikan yang menampilkan layanan, galeri, harga, dan informasi kontak dengan desain elegan dan responsif.',
      image:       CONFIG.projectImages['company-salon'],
      demo:        CONFIG.projectLinks['company-salon']?.demo || '',
      repo:        CONFIG.projectLinks['company-salon']?.repo || ''
    }
  ],

  /* ── Sertifikat & Prestasi ── */
  certificates: [
    {
      id:       'olympiad-undip',
      title:    'Juara 1 Agama Islam – Brilliant Academic Olympiad UNDIP',
      issuer:   'Universitas Diponegoro (UNDIP)',
      year:     '2025',
      category: 'Prestasi',
      image:    CONFIG.certificateImages['olympiad-undip'] || ''
    },
    {
      id:       'bnsp-web-pratama',
      title:    'Pengembang Web Pratama',
      issuer:   'LSP TIK Global (BNSP)',
      year:     '2026',
      category: 'Kompetensi',
      image:    CONFIG.certificateImages['bnsp-web-pratama'] || ''
    },
    {
      id:       'revou-coding-camp',
      title:    'Coding Camp Software Engineering',
      issuer:   'ReVoU Career Kickstart',
      year:     '2026',
      category: 'Kompetensi',
      image:    CONFIG.certificateImages['revou-coding-camp'] || ''
    },
    {
      id:       'junior-web-dev-vnue',
      title:    'Junior Web Developer',
      issuer:   'PT Vnue Teknologi Indonesia',
      year:     '2025',
      category: 'Kompetensi',
      image:    CONFIG.certificateImages['junior-web-dev-vnue'] || ''
    },
    {
      id:       'toeic',
      title:    'TOEIC Certificate',
      issuer:   'ETS',
      year:     '2025',
      category: 'Bahasa',
      image:    CONFIG.certificateImages['toeic'] || ''
    },
    {
      id:       'toefl',
      title:    'TOEFL Certificate',
      issuer:   'ETS',
      year:     '2025',
      category: 'Bahasa',
      image:    CONFIG.certificateImages['toefl'] || ''
    }
  ],

  /* ── Skills ── */
  skills: [
    {
      category: 'Web Development',
      icon: 'fa-solid fa-code',
      items: ['Laravel', 'PHP', 'HTML', 'CSS', 'WordPress']
    },
    {
      category: 'Mobile & Backend',
      icon: 'fa-solid fa-mobile-screen',
      items: ['FlutterFlow', 'Firebase', 'MySQL']
    },
    {
      category: 'Desain',
      icon: 'fa-solid fa-palette',
      items: ['Figma', 'Canva', 'Photoshop', 'CorelDraw', 'CapCut']
    },
    {
      category: 'Office & Produktivitas',
      icon: 'fa-solid fa-briefcase',
      items: ['Microsoft Word', 'Microsoft PowerPoint', 'Microsoft Excel']
    },
    {
      category: 'Soft Skills',
      icon: 'fa-solid fa-people-group',
      items: ['Komunikasi', 'Kerja Tim', 'Problem Solving', 'Manajemen Waktu', 'Tanggung Jawab', 'Adaptif', 'Proaktif']
    }
  ],

  /* ── Timeline (Pengalaman, Organisasi, Pendidikan) ── */
  timeline: [
    {
      type:     'education',
      title:    'SMK Informatika Utama',
      subtitle: 'Rekayasa Perangkat Lunak',
      period:   '2023 – 2026',
      desc:     'Mengambil jurusan Rekayasa Perangkat Lunak dengan fokus pada pengembangan web dan mobile, serta aktif dalam berbagai kegiatan organisasi sekolah.'
    },
    {
      type:     'education',
      title:    'SMP Plus Sirajussa\'adah',
      subtitle: 'Sekolah Menengah Pertama',
      period:   '2020 – 2023',
      desc:     'Menyelesaikan pendidikan tingkat SMP dan membangun fondasi akademik yang kuat.'
    },
    {
      type:     'work',
      title:    'Junior Web Developer (Magang)',
      subtitle: 'PT Idemu Sistem Sinergi Sistemkode',
      period:   'Jan – Mar 2025',
      desc:     'Mengembangkan aplikasi Android Flashcard Anatomi Tubuh menggunakan FlutterFlow dan Firebase. Berperan aktif dalam tim desain untuk menciptakan antarmuka UI/UX yang modern dan intuitif.'
    },
    {
      type:     'work',
      title:    'Waiters / Server',
      subtitle: 'Prompt Space, Kota Wisata Cibubur',
      period:   'Jul – Agu 2025',
      desc:     'Melayani pelanggan dengan standar pelayanan tinggi, berkoordinasi dengan tim dapur, dan bekerja secara efektif di bawah tekanan pada jam-jam sibuk.'
    },
    {
      type:     'organization',
      title:    'Div. Kerohanian OSIS',
      subtitle: 'SMK Informatika Utama',
      period:   '2023 – 2025',
      desc:     'Mengelola dan menjalankan program kerja bidang kerohanian dengan ketepatan alokasi dana 100%, serta menggerakkan kegiatan Sholat Dhuha berjamaah rutin.'
    },
    {
      type:     'organization',
      title:    'Pradana Putra – Dewan Ambalan Pramuka',
      subtitle: 'SMK Informatika Utama',
      period:   '2023 – 2025',
      desc:     'Memimpin dan mengoordinasikan seluruh program kerja Pramuka, pembagian tugas antar anggota, dan pengambilan keputusan strategis dalam kegiatan kepramukaan.'
    },
    {
      type:     'organization',
      title:    'Master of Ceremony – Employee Volunteering Program',
      subtitle: 'PT PLN (Persero)',
      period:   'Juni 2025',
      desc:     'Bertugas sebagai MC dan perwakilan siswa/OSIS dalam program Employee Volunteering bersama karyawan PLN Pusat.'
    },
    {
      type:     'organization',
      title:    'Volunteer – Bakti Sosial Khitanan Massal',
      subtitle: 'YBM PLN',
      period:   'Des 2024 & Jul 2025',
      desc:     'Berpartisipasi aktif sebagai relawan dalam kegiatan bakti sosial khitanan massal yang diselenggarakan oleh Yayasan Baitul Maal PLN.'
    }
  ]
};

/* ════════════════════════════════════════════════════════════
   STORAGE KEY & REMOTE DATA
════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'portfolio_data_v1';
window.CURRENT_PORTFOLIO_DATA = null;

/**
 * Muat data portofolio dari file data/content.json (untuk sinkronisasi GitHub Pages)
 * dengan fallback aman ke localStorage atau default.
 * @returns {Promise<Object>}
 */
async function loadRemotePortfolioData() {
  try {
    const res = await fetch(`data/content.json?v=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.profile) {
        window.CURRENT_PORTFOLIO_DATA = data;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
        return data;
      }
    }
  } catch (err) {
    // Fallback otomatis saat offline atau di protokol file://
  }
  return getPortfolioData();
}

/**
 * Ambil data portofolio aktif.
 * Prioritas: in-memory remote data > localStorage > PORTFOLIO_DATA_DEFAULT
 * @returns {Object} Data portofolio aktif
 */
function getPortfolioData() {
  if (window.CURRENT_PORTFOLIO_DATA) {
    return JSON.parse(JSON.stringify(window.CURRENT_PORTFOLIO_DATA));
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        profile:      parsed.profile      || PORTFOLIO_DATA_DEFAULT.profile,
        projects:     parsed.projects     || PORTFOLIO_DATA_DEFAULT.projects,
        certificates: parsed.certificates || PORTFOLIO_DATA_DEFAULT.certificates,
        skills:       parsed.skills       || PORTFOLIO_DATA_DEFAULT.skills,
        timeline:     parsed.timeline     || PORTFOLIO_DATA_DEFAULT.timeline
      };
    }
  } catch (e) {
    console.warn('[Portfolio] Gagal membaca localStorage:', e);
  }
  return JSON.parse(JSON.stringify(PORTFOLIO_DATA_DEFAULT)); // deep clone
}

/**
 * Simpan data portofolio ke state lokal.
 * @param {Object} data – Data portofolio lengkap
 */
function savePortfolioData(data) {
  try {
    window.CURRENT_PORTFOLIO_DATA = JSON.parse(JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('[Portfolio] localStorage penuh atau tidak tersedia:', e);
    return false;
  }
}

/**
 * Reset semua data ke default, hapus semua gambar tersimpan.
 */
function resetToDefault() {
  try {
    window.CURRENT_PORTFOLIO_DATA = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('portfolio_img_profile');
    const data = getPortfolioData();
    (data.projects || []).forEach(p => {
      localStorage.removeItem(`portfolio_img_project_${p.id}`);
    });
    (data.certificates || []).forEach(c => {
      localStorage.removeItem(`portfolio_img_cert_${c.id}`);
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Ambil gambar profil: prioritas data.profile.photo > localStorage > CONFIG path
 * @returns {string} Data URI atau path file
 */
function getProfileImage() {
  const data = getPortfolioData();
  return (data.profile && data.profile.photo) || localStorage.getItem('portfolio_img_profile') || CONFIG.profilePhoto || '';
}

/**
 * Ambil gambar proyek: prioritas data.projects[id].image > localStorage > fallback
 * @param {string} projectId
 * @param {string} fallbackPath
 * @returns {string}
 */
function getProjectImage(projectId, fallbackPath) {
  const data = getPortfolioData();
  const found = data.projects && data.projects.find(p => p.id === projectId);
  if (found && found.image) return found.image;
  return localStorage.getItem(`portfolio_img_project_${projectId}`) || fallbackPath || '';
}

/**
 * Ambil gambar sertifikat: prioritas data.certificates[id].image > localStorage > fallback
 * @param {string} certId
 * @param {string} fallbackPath
 * @returns {string}
 */
function getCertImage(certId, fallbackPath) {
  const data = getPortfolioData();
  const found = data.certificates && data.certificates.find(c => c.id === certId);
  if (found && found.image) return found.image;
  return localStorage.getItem(`portfolio_img_cert_${certId}`) || fallbackPath || '';
}

/**
 * Ekspor data portofolio sebagai file JSON (download)
 */
function exportDataAsJSON() {
  const data = getPortfolioData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'portfolio-data-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Kompres gambar via Canvas, kembalikan Data URI base64.
 * Mendukung JPEG, JPG, PNG.
 * @param {File} file – File gambar
 * @param {number} maxSize – Ukuran maks sisi terpanjang (px)
 * @param {number} quality – Kualitas JPEG 0-1
 * @returns {Promise<string>}
 */
function compressImage(file, maxSize = 600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width  = maxSize;
        } else if (height > maxSize) {
          width  = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const isPng = file.type === 'image/png' || (file.name && file.name.toLowerCase().endsWith('.png'));
        if (isPng) {
          ctx.drawImage(img, 0, 0, width, height);
          const pngData = canvas.toDataURL('image/png');
          // Jika file PNG hasil konversi terlalu besar (> 1.2MB), gunakan JPEG berlatar putih agar hemat localStorage
          if (pngData.length > 1.2 * 1024 * 1024) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(pngData);
          }
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = () => reject(new Error('Format gambar tidak valid atau tidak dapat dimuat.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Cek apakah string URL/data URI adalah dokumen PDF.
 * @param {string} url
 * @returns {boolean}
 */
function isPdfUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf');
}

/**
 * Memproses unggahan file (Mendukung: PDF, JPEG, JPG, PNG).
 * Mengembalikan objek { type: 'pdf'|'image', data: string, name: string }.
 * @param {File} file
 * @param {number} maxSize
 * @param {number} quality
 * @returns {Promise<{type: string, data: string, name: string}>}
 */
async function processUploadedFile(file, maxSize = 1200, quality = 0.85) {
  if (!file) throw new Error('Tidak ada file yang dipilih.');

  const fileName = file.name || '';
  const ext = fileName.split('.').pop().toLowerCase();
  const mime = (file.type || '').toLowerCase();

  const isPDF = ext === 'pdf' || mime === 'application/pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mime.startsWith('image/');

  if (!isPDF && !isImage) {
    throw new Error('Format file tidak didukung. Harap gunakan file PDF, JPEG, JPG, atau PNG.');
  }

  // Penanganan PDF
  if (isPDF) {
    // Batas file PDF maksimal 4MB agar muat di localStorage
    const maxPdfBytes = 4 * 1024 * 1024;
    if (file.size > maxPdfBytes) {
      throw new Error(`Ukuran file PDF (${(file.size / 1024 / 1024).toFixed(1)}MB) melebihi batas 4MB.`);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ type: 'pdf', data: e.target.result, name: fileName });
      reader.onerror = () => reject(new Error('Gagal membaca file PDF.'));
      reader.readAsDataURL(file);
    });
  }

  // Penanganan Gambar (JPEG, JPG, PNG)
  const compressedData = await compressImage(file, maxSize, quality);
  return { type: 'image', data: compressedData, name: fileName };
}

/* Export semua fungsi dan data ke window untuk digunakan modul lain */
window.CONFIG              = CONFIG;
window.PORTFOLIO_DATA_DEFAULT = PORTFOLIO_DATA_DEFAULT;
window.STORAGE_KEY         = STORAGE_KEY;
window.getPortfolioData    = getPortfolioData;
window.savePortfolioData   = savePortfolioData;
window.resetToDefault      = resetToDefault;
window.getProfileImage     = getProfileImage;
window.getProjectImage     = getProjectImage;
window.getCertImage        = getCertImage;
window.loadRemotePortfolioData = loadRemotePortfolioData;
window.exportDataAsJSON    = exportDataAsJSON;
window.compressImage       = compressImage;
window.isPdfUrl            = isPdfUrl;
window.processUploadedFile = processUploadedFile;
