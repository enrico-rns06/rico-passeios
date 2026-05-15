/* =============================================
   RICO PASSEIOS — app.js
   Avaliações salvas no Supabase (banco de dados na nuvem)
============================================= */

/* ─────────────────────────────────────────────────────────────────────
   ✏️  CONFIGURAÇÃO DO SUPABASE
   
   1. Crie sua conta gratuita em https://supabase.com
   2. Crie um novo projeto
   3. Vá em Project Settings → API
   4. Copie a "Project URL" e a "anon public key"
   5. Cole abaixo nos campos correspondentes
───────────────────────────────────────────────────────────────────── */
const SUPABASE_URL = 'https://iovuyuuuncoymubvgufj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8aWULP_5SMSuWC4dgSgJuQ_7iGbwEQt';

/* ─────────────────────────────────────────────────────────────────────
   ✏️  FOTOS DA GALERIA
───────────────────────────────────────────────────────────────────── */
const GALLERY_PHOTOS = [
  { src: 'fotos/alianca.jpeg',   label: '',  featured: true  },
  { src: 'fotos/balanco.jpeg',   label: '',  featured: true  },
  { src: 'fotos/amigas.jpeg',    label: '',  featured: true  },
  { src: 'fotos/maraca.jpeg',    label: '',  featured: true  },
  { src: 'fotos/amigos.jpeg',    label: '',  featured: true  },
  { src: 'fotos/irmas.jpeg',     label: '',  featured: false },
  { src: 'fotos/empe1.jpeg',     label: '',  featured: false },
  { src: 'fotos/deitada1.jpeg',  label: '',  featured: false },
  { src: 'fotos/deitada2.jpeg',  label: '',  featured: false },
  { src: 'fotos/deitada3.jpeg',  label: '',  featured: false },
  { src: 'fotos/crianca1.jpeg',  label: '',  featured: false },
  { src: 'fotos/homem.jpeg',     label: '',  featured: false },
  { src: 'fotos/crianca3.jpeg',  label: '',  featured: false },
  { src: 'fotos/familia.jpeg',   label: '',  featured: false },
  { src: 'fotos/familia1.jpeg',  label: '',  featured: false },
  { src: 'fotos/balanco1.jpeg',  label: '',  featured: false },
];

/* ─────────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  { bg: '#faecda', fg: '#854f0b' },
  { bg: '#e1f5ee', fg: '#0f6e56' },
  { bg: '#e6f1fb', fg: '#185fa5' },
  { bg: '#fbeaf0', fg: '#993556' },
  { bg: '#eeedfe', fg: '#534ab7' },
  { bg: '#eaf3de', fg: '#3b6d11' },
];

let reviews        = [];
let selectedRating = 0;

/* ── lightbox state ── */
let lightboxPhotos = [];
let lightboxIndex  = 0;

/* ── Supabase client ── */
let supabase = null;

document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  setupStarPicker();
  setupForm();
  setupCharCount();
  setupNavToggle();
  setupNavScroll();
  setupScrollReveal();
  buildGallery();
  setupGalleryModal();
  setupLightbox();

  // Preenche o select de anos dinamicamente (últimos 5 anos até o atual)
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearSelect = document.getElementById('inputYear');
  for (let y = currentYear; y >= currentYear - 5; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  // Atualiza o campo hidden sempre que mês ou ano mudar
  function syncDate() {
    const m = document.getElementById('inputMonth').value;
    const y = document.getElementById('inputYear').value;
    document.getElementById('inputDate').value = (m && y) ? `${y}-${m}` : '';
  }
  document.getElementById('inputMonth').addEventListener('change', syncDate);
  document.getElementById('inputYear').addEventListener('change', syncDate);

  await loadReviews();
  renderReviews();
  updateOverallStats();
});

/* =============================================
   SUPABASE
============================================= */
function initSupabase() {
  if (SUPABASE_URL === 'COLE_SUA_URL_AQUI' || SUPABASE_KEY === 'COLE_SUA_CHAVE_AQUI') {
    console.warn('⚠️  Configure SUPABASE_URL e SUPABASE_KEY no app.js');
    return;
  }
  // Usa o cliente global carregado via CDN no index.html
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

async function loadReviews() {
  if (!supabase) {
    reviews = [];
    return;
  }
  try {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    reviews = data || [];
  } catch (err) {
    console.error('Erro ao carregar avaliações:', err);
    reviews = [];
  }
}

async function saveReview(review) {
  if (!supabase) {
    showToast('⚠️ Banco de dados não configurado.');
    return false;
  }
  try {
    const { error } = await supabase
      .from('avaliacoes')
      .insert([{
        name:   review.name,
        date:   review.date,
        rating: review.rating,
        text:   review.text,
      }]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err);
    return false;
  }
}

/* =============================================
   GALERIA
============================================= */
function buildGallery() {
  const featured = GALLERY_PHOTOS.filter(p => p.featured).slice(0, 5);
  const total    = GALLERY_PHOTOS.length;
  const grid     = document.getElementById('galleryGrid');
  const moreWrap = document.getElementById('galleryMoreWrap');
  const moreBtn  = document.getElementById('galleryMoreBtn');
  const moreCnt  = document.getElementById('galleryMoreCount');

  grid.innerHTML = '';

  featured.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    const img = new Image();
    img.onload = () => {
      const el = document.createElement('img');
      el.src = photo.src;
      el.alt = photo.label || '';
      el.className = 'gallery-photo';
      item.prepend(el);
      item.classList.remove('no-photo');
    };
    img.onerror = () => {
      item.classList.add('no-photo');
      const ph = document.createElement('div');
      ph.className = 'gallery-placeholder';
      ph.innerHTML = `📷`;
      item.prepend(ph);
    };
    img.src = photo.src;

    const zoom = document.createElement('span');
    zoom.className = 'gallery-zoom-icon';
    zoom.textContent = '🔍';
    item.appendChild(zoom);

    if (photo.label) {
      const label = document.createElement('span');
      label.className = 'gallery-label';
      label.textContent = photo.label;
      item.appendChild(label);
    }

    item.addEventListener('click', () => openLightbox(featured, i));
    grid.appendChild(item);
  });

  if (total > 5) {
    const extra = total - 5;
    moreCnt.textContent = `+${extra} fotos`;
    moreWrap.style.display = 'flex';
    moreBtn.addEventListener('click', openGalleryModal);
  }
}

/* =============================================
   MODAL GALERIA COMPLETA
============================================= */
function setupGalleryModal() {
  document.getElementById('galleryModalClose').addEventListener('click', closeGalleryModal);
  document.getElementById('galleryModalBackdrop').addEventListener('click', closeGalleryModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('galleryModal').classList.contains('open')) {
      closeGalleryModal();
    }
  });
}

function openGalleryModal() {
  const modal    = document.getElementById('galleryModal');
  const grid     = document.getElementById('galleryModalGrid');
  const subLabel = document.getElementById('galleryModalSub');

  subLabel.textContent = `${GALLERY_PHOTOS.length} fotos`;
  grid.innerHTML = '';

  GALLERY_PHOTOS.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-modal-item';

    const img = new Image();
    img.onload = () => {
      const el = document.createElement('img');
      el.src = photo.src;
      el.alt = photo.label || '';
      item.classList.remove('no-photo-modal');
      item.appendChild(el);

      if (photo.label) {
        const lbl = document.createElement('div');
        lbl.className = 'modal-item-label';
        lbl.textContent = photo.label;
        item.appendChild(lbl);
      }
    };
    img.onerror = () => {
      item.classList.add('no-photo-modal');
      item.textContent = '📷';
      item.title = photo.label;
    };
    img.src = photo.src;

    item.addEventListener('click', () => {
      closeGalleryModal();
      setTimeout(() => openLightbox(GALLERY_PHOTOS, i), 180);
    });

    grid.appendChild(item);
  });

  modal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeGalleryModal() {
  document.getElementById('galleryModal').classList.remove('open');
  document.body.classList.remove('modal-open');
}

/* =============================================
   LIGHTBOX
============================================= */
function setupLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxBackdrop').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  let touchStartX = 0;
  const lb = document.getElementById('lightbox');
  lb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 40) navigateLightbox(dx < 0 ? 1 : -1);
  });
}

function openLightbox(photos, index) {
  lightboxPhotos = photos;
  lightboxIndex  = index;
  document.getElementById('lightbox').classList.add('open');
  document.body.classList.add('modal-open');
  renderLightboxPhoto();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function navigateLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxPhotos.length) % lightboxPhotos.length;
  renderLightboxPhoto();
}

function renderLightboxPhoto() {
  const photo   = lightboxPhotos[lightboxIndex];
  const img     = document.getElementById('lightboxImg');
  const label   = document.getElementById('lightboxLabel');
  const counter = document.getElementById('lightboxCounter');
  const prev    = document.getElementById('lightboxPrev');
  const next    = document.getElementById('lightboxNext');

  img.src = photo.src;
  img.alt = photo.label || '';
  label.textContent   = photo.label || '';
  counter.textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;

  const solo = lightboxPhotos.length <= 1;
  prev.classList.toggle('hidden', solo);
  next.classList.toggle('hidden', solo);
}

/* =============================================
   AVALIAÇÕES
============================================= */
function setupScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

function renderReviews() {
  const container = document.getElementById('reviewsList');
  container.innerHTML = '';

  if (reviews.length === 0) {
    container.innerHTML = `<div class="reviews-empty">🌊 Seja o primeiro a compartilhar sua experiência!</div>`;
    return;
  }
  reviews.forEach((r, i) => container.appendChild(createReviewCard(r, i)));
}

function createReviewCard(review, index) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const card  = document.createElement('div');
  card.className = 'review-card';
  card.style.animationDelay = `${Math.min(index, 5) * 70}ms`;
  card.innerHTML = `
    <div class="review-stars">${buildStars(review.rating)}</div>
    <p class="review-text">"${escapeHTML(review.text)}"</p>
    <div class="review-author">
      <div class="review-avatar" style="background:${color.bg}; color:${color.fg};">${getInitials(review.name)}</div>
      <div>
        <p class="review-name">${escapeHTML(review.name)}</p>
        <p class="review-date">${formatDate(review.date)}</p>
      </div>
    </div>`;
  return card;
}

function updateOverallStats() {
  const scoreEl  = document.getElementById('overallScore');
  const countEl  = document.getElementById('overallCount');
  const statNota = document.getElementById('stat-nota');

  if (reviews.length === 0) {
    scoreEl.textContent = '—';
    countEl.textContent = 'Sem avaliações ainda';
    statNota.textContent = '—';
    return;
  }
  const avg     = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;
  scoreEl.textContent  = rounded.toFixed(1);
  countEl.textContent  = `/ 5 · ${reviews.length} avaliação${reviews.length !== 1 ? 'ões' : ''}`;
  statNota.textContent = rounded.toFixed(1);
}

function setupStarPicker() {
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.value);
      document.getElementById('inputRating').value = selectedRating;
      highlightStars(selectedRating);
    });
    btn.addEventListener('mouseenter', () => highlightStars(parseInt(btn.dataset.value)));
    btn.addEventListener('mouseleave', () => highlightStars(selectedRating));
  });
}

function highlightStars(count) {
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.value) <= count);
  });
}

function setupForm() {
  document.getElementById('reviewForm').addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  const nameEl    = document.getElementById('inputName');
  const dateEl    = document.getElementById('inputDate');
  const textEl    = document.getElementById('inputText');
  const errorEl   = document.getElementById('formError');
  const submitBtn = document.querySelector('.btn-submit');
  const consentEl = document.getElementById('consentCheck');

  [nameEl, dateEl, textEl].forEach(el => el.classList.remove('error'));
  errorEl.textContent = '';

  const name = nameEl.value.trim();
  const date = dateEl.value;
  const text = textEl.value.trim();

  if (!name)           { nameEl.classList.add('error'); errorEl.textContent = 'Por favor, informe seu nome.'; nameEl.focus(); return; }
  if (!date) {
    document.getElementById('inputMonth').classList.add('error');
    document.getElementById('inputYear').classList.add('error');
    errorEl.textContent = 'Por favor, informe quando foi o passeio.';
    return;
  }
  document.getElementById('inputMonth').classList.remove('error');
  document.getElementById('inputYear').classList.remove('error');
  if (!selectedRating) { errorEl.textContent = 'Por favor, selecione uma nota de 1 a 5 estrelas.'; return; }
  if (text.length < 10){ textEl.classList.add('error'); errorEl.textContent = 'Conte um pouquinho mais (mín. 10 caracteres).'; textEl.focus(); return; }
  if (!consentEl.checked) { errorEl.textContent = 'Você precisa concordar com o uso dos dados para enviar.'; consentEl.focus(); return; }

  // Desabilita botão durante envio
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  const ok = await saveReview({ name, date, rating: selectedRating, text });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Enviar avaliação ✦';

  if (!ok) {
    errorEl.textContent = 'Erro ao enviar. Tente novamente em instantes.';
    return;
  }

  // Recarrega lista atualizada do banco
  await loadReviews();
  renderReviews();
  updateOverallStats();

  document.getElementById('reviewForm').reset();
  document.getElementById('inputMonth').value = '';
  document.getElementById('inputYear').value = '';
  document.getElementById('inputDate').value = '';
  consentEl.checked  = false;
  selectedRating     = 0;
  highlightStars(0);
  document.getElementById('charCount').textContent = '0';
  showToast('✦ Avaliação enviada! Obrigado, ' + name.split(' ')[0] + '!');
  setTimeout(() => document.getElementById('reviewsList').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

function setupCharCount() {
  const ta = document.getElementById('inputText');
  const sp = document.getElementById('charCount');
  ta.addEventListener('input', () => sp.textContent = ta.value.length);
}

function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3400);
}

function setupNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

function setupNavScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.08)' : 'none';
  }, { passive: true });
}

/* =============================================
   UTILS
============================================= */
function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function buildStars(rating) {
  return Array.from({ length: 5 }, (_, i) => i < rating ? '★' : '☆').join('');
}

function formatDate(ym) {
  if (!ym) return '';
  const [year, month] = ym.split('-');
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${months[parseInt(month, 10) - 1]}. de ${year}`;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}