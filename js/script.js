/* ==========================================================
   Moksh Travel — shared script (js/script.js)
   Loaded by every page as a normal <script defer> (works when the
   files are opened straight from a folder as well as on the web).
   The page type is read from <body class="pg-...">:
     pg-route   route pages (routes/*.html) + blog + routes hub
     pg-index / pg-about / pg-trip / pg-reviews / pg-cancel  root pages
   Firebase is loaded lazily (only when a form / data call needs it),
   so a Firebase or network problem can never break the menu, FAQ etc.
   ========================================================== */
(function () {

const EMAILJS_PUBLIC_KEY = 'shZzGfL3Tpe1cy09F';

// ---- Firebase (Firestore) — loaded lazily from Google's CDN ------------
// Same project / helpers as js/firebase-config.js (which admin.html still uses).
// Loaded here with import() so it also works when a page is opened straight
// from a folder (file://), not only on a web server.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCqxT97xCnww9P8csG2xyDYrs6jOOLVC7o",
  authDomain: "moksh-tours-and-travel-e29ab.firebaseapp.com",
  projectId: "moksh-tours-and-travel-e29ab",
  storageBucket: "moksh-tours-and-travel-e29ab.firebasestorage.app",
  messagingSenderId: "511906793574",
  appId: "1:511906793574:web:c54d18ec742b294fa205a7",
  measurementId: "G-FN4ND9C4TM"
  };
let _fbPromise = null;
function loadFirebase() {
  if (!_fbPromise) {
    _fbPromise = (async () => {
      const V = 'https://www.gstatic.com/firebasejs/10.12.0/';
      const [appM, fsM] = await Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-firestore.js')]);
      const app = appM.initializeApp(FIREBASE_CONFIG);
      import(V + 'firebase-analytics.js').then(a => { try { a.getAnalytics(app); } catch (e) {} }).catch(() => {});
      const db = fsM.getFirestore(app);
      return {
        saveDocument: (name, data) => fsM.addDoc(fsM.collection(db, name), { ...data, received: fsM.serverTimestamp() }),
        fetchCollection: async (name, orderField = 'received', direction = 'desc') => {
          try {
            const ref = fsM.collection(db, name);
            const q = orderField ? fsM.query(ref, fsM.orderBy(orderField, direction)) : fsM.query(ref);
            const snap = await fsM.getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (e) {
            console.warn('fetchCollection(' + name + '):', e.message);
            return [];
          }
        }
      };
    })().catch(err => { _fbPromise = null; throw err; });
  }
  return _fbPromise;
}
const saveDocument = (...a) => loadFirebase().then(m => m.saveDocument(...a));
const fetchCollection = (...a) => loadFirebase().then(m => m.fetchCollection(...a));

// ---- EmailJS (library is loaded by the page with its own <script> tag) --
try { if (window.emailjs) window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) {}

const isPage = c => document.body.classList.contains('pg-' + c);

// ---- shared: header shadow on scroll, mobile menu, FAQ accordion --------
function initCommon() {
  window.addEventListener('scroll', () => {
    const h = document.getElementById('siteHeader');
    if (h) h.classList.toggle('scrolled', window.scrollY > 40);
  });
  window.toggleMenu = function () {
    const menu = document.getElementById('mainMenu');
    const icon = document.getElementById('hamburgerIcon');
    menu.classList.toggle('open');
    icon.className = menu.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
  };
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => {
    const menu = document.getElementById('mainMenu');
    const icon = document.getElementById('hamburgerIcon');
    if (menu) menu.classList.remove('open');
    if (icon) icon.className = 'fas fa-bars';
  }));
  window.toggleFaq = function (btn) {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = null;
      }
    });
    if (wasOpen) {
      item.classList.remove('open');
      answer.style.maxHeight = null;
    } else {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  };
}

// ---- routes hub: live search box ---------------------------------------
function initRouteSearch() {
  const box = document.querySelector('[data-route-search]');
  if (!box) return;
  const items = document.querySelectorAll('[data-route-item]');
  const empty = document.getElementById('hubEmpty');
  box.addEventListener('input', () => {
    const q = box.value.trim().toLowerCase();
    let shown = 0;
    items.forEach(li => { const ok = li.textContent.toLowerCase().includes(q); li.hidden = !ok; if (ok) shown++; });
    if (empty) empty.hidden = shown !== 0;
  });
}

// ---- blog index: 9 guides per page with prev / 1 2 3 / next ------------
function initBlogPager() {
  const nav = document.getElementById('blogPager');
  const grid = document.querySelector('.blog-grid');
  if (!nav || !grid) return;
  const PER_PAGE = 9;
  const cards = Array.from(grid.querySelectorAll('.blog-card'));
  const pages = Math.max(1, Math.ceil(cards.length / PER_PAGE));
  let current = 1;
  const fromUrl = () => {
    const n = parseInt(new URLSearchParams(location.search).get('page'), 10);
    return n >= 1 && n <= pages ? n : 1;
  };
  function render(scroll) {
    cards.forEach((c, i) => { c.hidden = Math.floor(i / PER_PAGE) + 1 !== current; });
    nav.hidden = pages < 2;
    let h = '<button type="button" class="pg-btn pg-arrow" data-go="' + (current - 1) + '" aria-label="Previous page"' + (current === 1 ? ' disabled' : '') + '><span class="pg-txt">&lsaquo;</span></button>';
    for (let n = 1; n <= pages; n++) {
      h += '<button type="button" class="pg-btn' + (n === current ? ' active' : '') + '" data-go="' + n + '" aria-label="Page ' + n + '"' + (n === current ? ' aria-current="page"' : '') + '>' + n + '</button>';
    }
    h += '<button type="button" class="pg-btn pg-arrow" data-go="' + (current + 1) + '" aria-label="Next page"' + (current === pages ? ' disabled' : '') + '><span class="pg-txt">&rsaquo;</span></button>';
    nav.innerHTML = h;
    if (scroll) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  nav.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (!b || b.disabled) return;
    current = parseInt(b.dataset.go, 10);
    try { history.pushState({ page: current }, '', current === 1 ? location.pathname : '?page=' + current); } catch (err) {}
    render(true);
  });
  window.addEventListener('popstate', () => { current = fromUrl(); render(false); });
  current = fromUrl();
  render(false);
}

// ---- route pages: booking forms (pickup / drop come from <body data-pick data-drop>)
async function initRoutePage() {
  const PICK = document.body.dataset.pick || 'Ahmedabad';
  const DROP = document.body.dataset.drop || '';

function toDMY(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
function to12Hour(time24) {
  if (!time24) return '';
  let [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2,'0')} ${period}`;
}

function showSuccessModal(message) {
  const modal = document.getElementById('successModal');
  const msgEl = document.getElementById('successMessage');
  const progress = document.getElementById('successProgress');
  msgEl.innerHTML = message;
  modal.style.display = 'flex';
  progress.style.animation = 'none';
  void progress.offsetWidth;
  progress.style.animation = 'drainBar 3s linear forwards';
  clearTimeout(window._successTimer);
  window._successTimer = setTimeout(closeSuccessModal, 3000);
}
function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  const card = document.getElementById('successCard');
  card.style.animation = 'fadeOutModal 0.35s cubic-bezier(0.4,0,0.2,1) forwards';
  setTimeout(() => { modal.style.display = 'none'; card.style.animation = ''; }, 350);
}
window.closeSuccessModal = closeSuccessModal;
document.getElementById('successModal').addEventListener('click', function(e){ if(e.target === this) closeSuccessModal(); });

window.openQuoteModal = function(){
  document.getElementById('quoteForm').reset();
  document.getElementById('qPickup').value = PICK;
  document.getElementById('qDrop').value = DROP;
  document.getElementById('quoteModal').style.display = 'flex';
  document.getElementById('quoteModalCard').style.animation = 'successSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) both';
};
window.closeQuoteModal = function(){
  const modal = document.getElementById('quoteModal');
  const card = document.getElementById('quoteModalCard');
  card.style.animation = 'fadeOutModal 0.3s cubic-bezier(0.4,0,0.2,1) forwards';
  setTimeout(() => { modal.style.display = 'none'; card.style.animation = ''; }, 300);
};
document.getElementById('quoteModal').addEventListener('click', function(e){ if(e.target === this) closeQuoteModal(); });

document.getElementById('quoteForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const name    = document.getElementById('qName').value.trim();
  const mobile  = document.getElementById('qMobile').value.trim();
  const pickup  = document.getElementById('qPickup').value.trim();
  const dest    = document.getElementById('qDrop').value.trim();
  const date    = document.getElementById('qDate').value;
  const time    = document.getElementById('qTime').value;

  if(!mobile || mobile.length !== 10 || isNaN(mobile)){
    showToast('Please enter a valid 10-digit mobile number', true); return;
  }

  const btn = document.getElementById('qSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending&hellip;';

  try {
    await saveDocument('bookings', { name, mobile, pickup, destination:dest, date, time, car:'Not specified', passenger:'Not specified', trip:`${PICK} to ${DROP} - One Way`, received:new Date() });
  } catch(err) { console.error('Firebase save error:', err); }

  try {
    await emailjs.send('service_xmnox9n', 'template_lqoj3yg', {
      mobile, pickup, destination: dest,
      date: toDMY(date), returnDate: '', time: to12Hour(time),
      trip: `${PICK} to ${DROP} - One Way (${name})`,
      rentalHours: ''
    });
  } catch(err) { console.error('EmailJS error:', err); }

  const qWaMsg =
`━━━━━━━━━━━━━━━━━━━━━━━━━
🚖 I WANT TO BOOK CAB
━━━━━━━━━━━━━━━━━━━━━━━━━
▪️ Name : ${name}
▪️ Contact Number : ${mobile}
▪️ Pickup Location : ${pickup}
▪️ Destination : ${dest}
▪️ Pickup Date : ${date}
▪️ Pickup Time : ${time}
▪️ Trip Type : One Way
━━━━━━━━━━━━━━━━━━━━━━━━━`;
  const qWaUrl = 'https://wa.me/919727729334?text=' + encodeURIComponent(qWaMsg);

  closeQuoteModal();
  setTimeout(() => {
    showSuccessModal(`Your quote request has been received successfully.<br><br>Our team will contact you shortly on <strong style="color:var(--gold)">${mobile}</strong> with pricing and availability for your ${PICK} to ${DROP} trip. Redirecting you to WhatsApp&hellip;`);
  }, 320);

  setTimeout(() => {
    window.open(qWaUrl, '_blank');
  }, 1400);

  btn.disabled = false;
  btn.innerHTML = '<i class="fab fa-whatsapp"></i> Send Booking Request';
});

// ── HERO BOOKING FORM (pickup date / time / mobile) ──
const heroBookForm = document.getElementById('heroBookForm');
if (heroBookForm) {
  const heroDateEl = document.getElementById('heroDate');
  const heroTimeEl = document.getElementById('heroTime');
  const heroNow = new Date();
  heroDateEl.min = heroNow.toISOString().slice(0,10);
  heroDateEl.value = heroNow.toISOString().slice(0,10);
  heroTimeEl.value = String(heroNow.getHours()).padStart(2,'0') + ':' + String(heroNow.getMinutes()).padStart(2,'0');

  heroBookForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const date   = heroDateEl.value;
    const time   = heroTimeEl.value;
    const mobile = document.getElementById('heroMobile').value.trim();

    if(!mobile || mobile.length !== 10 || isNaN(mobile)){
      showToast('Please enter a valid 10-digit mobile number', true); return;
    }

    const heroBtn = document.getElementById('heroBookBtn');
    heroBtn.disabled = true;
    const heroOriginalBtnHtml = heroBtn.innerHTML;
    heroBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending&hellip;';

    try {
      await saveDocument('bookings', { name:'Not specified', mobile, pickup:PICK, destination:DROP, date, time, car:'Not specified', passenger:'Not specified', trip:`${PICK} to ${DROP} - One Way`, received:new Date() });
    } catch(err) { console.error('Firebase save error:', err); }

    try {
      await emailjs.send('service_xmnox9n', 'template_lqoj3yg', {
        mobile, pickup: PICK, destination: DROP,
        date: toDMY(date), returnDate: '', time: to12Hour(time),
        trip: `${PICK} to ${DROP} - One Way`,
        rentalHours: ''
      });
    } catch(err) { console.error('EmailJS error:', err); }

    const hWaMsg =
`━━━━━━━━━━━━━━━━━━━━━━━━━
🚖 I WANT TO BOOK CAB
━━━━━━━━━━━━━━━━━━━━━━━━━
▪️ Contact Number : ${mobile}
▪️ Pickup Location : ${PICK}
▪️ Destination : ${DROP}
▪️ Pickup Date : ${date}
▪️ Pickup Time : ${time}
▪️ Trip Type : One Way
━━━━━━━━━━━━━━━━━━━━━━━━━`;
    const hWaUrl = 'https://wa.me/919727729334?text=' + encodeURIComponent(hWaMsg);

    setTimeout(() => {
      showSuccessModal(`Your booking request has been received successfully.<br><br>Our team will contact you shortly on <strong style="color:var(--gold)">${mobile}</strong> with pricing and availability for your ${PICK} to ${DROP} trip. Redirecting you to WhatsApp&hellip;`);
    }, 150);

    setTimeout(() => {
      window.open(hWaUrl, '_blank');
    }, 1300);

    heroBookForm.reset();
    heroDateEl.value = heroNow.toISOString().slice(0,10);
    heroTimeEl.value = String(heroNow.getHours()).padStart(2,'0') + ':' + String(heroNow.getMinutes()).padStart(2,'0');
    heroBtn.disabled = false;
    heroBtn.innerHTML = heroOriginalBtnHtml;
  });
}

function showToast(msg, isError){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.className = '', 3500);
}
window.showToast = showToast;

}

// ===== page-specific code carried over unchanged from the original inline scripts =====

async function initAbout() {
function showSuccessModal(message) {
  const modal = document.getElementById('successModal');
  const msgEl = document.getElementById('successMessage');
  const progress = document.getElementById('successProgress');
  msgEl.innerHTML = message;
  modal.style.display = 'flex';
  progress.style.animation = 'none';
  void progress.offsetWidth;
  progress.style.animation = 'drainBar 3s linear forwards';
  clearTimeout(window._successTimer);
  window._successTimer = setTimeout(closeSuccessModal, 3000);
}
function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  const card = document.getElementById('successCard');
  card.style.animation = 'fadeOutModal 0.35s cubic-bezier(0.4,0,0.2,1) forwards';
  setTimeout(() => { modal.style.display = 'none'; card.style.animation = ''; }, 350);
}
window.closeSuccessModal = closeSuccessModal;
document.getElementById('successModal').addEventListener('click', function(e){ if(e.target === this) closeSuccessModal(); });

window.openQuoteModal = function(){
  document.getElementById('quoteForm').reset();
  document.getElementById('quoteModal').style.display = 'flex';
  document.getElementById('quoteModalCard').style.animation = 'successSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) both';
};
window.closeQuoteModal = function(){
  const modal = document.getElementById('quoteModal');
  const card = document.getElementById('quoteModalCard');
  card.style.animation = 'fadeOutModal 0.3s cubic-bezier(0.4,0,0.2,1) forwards';
  setTimeout(() => { modal.style.display = 'none'; card.style.animation = ''; }, 300);
};
document.getElementById('quoteModal').addEventListener('click', function(e){ if(e.target === this) closeQuoteModal(); });

document.getElementById('quoteForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const name    = document.getElementById('qName').value.trim();
  const mobile  = document.getElementById('qMobile').value.trim();
  const pickup  = document.getElementById('qPickup').value.trim();
  const dest    = document.getElementById('qDrop').value.trim();
  const date    = document.getElementById('qDate').value;
  const time    = document.getElementById('qTime').value;

  if(!mobile || mobile.length !== 10 || isNaN(mobile)){
    showToast('Please enter a valid 10-digit mobile number', true); return;
  }

  const btn = document.getElementById('qSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

  try {
    await saveDocument('bookings', { name, mobile, pickup, destination:dest, date, time, car:'Not specified', passenger:'Not specified', trip:'General Inquiry', received:new Date() });
  } catch(err) { console.error('Firebase save error:', err); }

  closeQuoteModal();
  setTimeout(() => {
    showSuccessModal(`Your quote request has been received successfully.<br><br>Our team will contact you shortly on <strong style="color:var(--gold)">${mobile}</strong> with pricing and availability.`);
  }, 320);

  btn.disabled = false;
  btn.innerHTML = '<i class="fab fa-whatsapp"></i> Send Booking Request';
});

function showToast(msg, isError){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.className = '', 3500);
}
window.showToast = showToast;

window.addEventListener('scroll', () => {
  document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 40);
});
function toggleMenu(){
  const menu = document.getElementById('mainMenu');
  const icon = document.getElementById('hamburgerIcon');
  menu.classList.toggle('open');
  icon.className = menu.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
}
document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => {
  document.getElementById('mainMenu').classList.remove('open');
  document.getElementById('hamburgerIcon').className = 'fas fa-bars';
}));

  // functions used by inline onclick="..." attributes must be global
  try { if (typeof closeQuoteModal === 'function' && !window.closeQuoteModal) window.closeQuoteModal = closeQuoteModal; } catch (e) {}
  try { if (typeof openQuoteModal === 'function' && !window.openQuoteModal) window.openQuoteModal = openQuoteModal; } catch (e) {}
  try { if (typeof toggleMenu === 'function' && !window.toggleMenu) window.toggleMenu = toggleMenu; } catch (e) {}
}

async function initTrip() {
function esc(str) {
  return (str || '').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function parseItinerary(text) {
  if (!text) return [];
  return text.split(/\r?\n\s*\r?\n/).map(block => {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    return { heading: lines[0], lines: lines.slice(1) };
  }).filter(Boolean);
}

let currentPkg = null;

function toDMY(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
function to12Hour(time24) {
  if (!time24) return '';
  let [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2,'0')} ${period}`;
}

function revealHeroText() {
  document.getElementById('tdHeroSkeleton').style.display = 'none';
  document.getElementById('tdPageTitle').style.display = 'block';
  document.getElementById('tdPageSub').style.display = 'block';
}

function renderPackage(pkg) {
  currentPkg = pkg;
  document.title = `${pkg.title || 'Trip Darshan Package'} | Moksh Travel`;
  document.getElementById('tdPageTitle').textContent = pkg.title || 'Trip Darshan Package';
  document.getElementById('tdPageSub').textContent = pkg.route
    ? `An all-inclusive Trip Darshan package covering ${pkg.route}.`
    : 'An all-inclusive Trip Darshan package by Moksh Travel.';
  document.getElementById('tdBreadcrumbTitle').textContent = pkg.title || 'Package';

  const heroBg = document.getElementById('tdHeroBg');
  if (pkg.image) {
    heroBg.style.backgroundImage = `url('${pkg.image}')`;
    heroBg.classList.add('is-visible');
  } else {
    heroBg.classList.remove('is-visible');
  }

  document.getElementById('tdInfoRoute').textContent = pkg.route || '—';
  document.getElementById('tdInfoDuration').textContent = pkg.duration || pkg.badge || '—';
  document.getElementById('tdInfoDistance').textContent = pkg.distance || '—';
  document.getElementById('tdSidePrice').textContent = pkg.price || '—';

  const inclusions = (pkg.inclusions || '').split(',').map(s => s.trim()).filter(Boolean);
  if (inclusions.length) {
    document.getElementById('tdInclusionsBlock').style.display = 'block';
    document.getElementById('tdInclusionsPills').innerHTML = inclusions
      .map(i => `<div class="td-pill"><i class="fas fa-check"></i> ${esc(i)}</div>`).join('');
  }

  const bestFor = (pkg.bestFor || '').split(',').map(s => s.trim()).filter(Boolean);
  if (bestFor.length) {
    document.getElementById('tdBestForBlock').style.display = 'block';
    document.getElementById('tdBestForPills').innerHTML = bestFor
      .map(i => `<div class="td-pill alt"><i class="fas fa-heart"></i> ${esc(i)}</div>`).join('');
  }

  const days = parseItinerary(pkg.itinerary);
  if (days.length) {
    document.getElementById('tdItineraryBlock').style.display = 'block';
    document.getElementById('tdItineraryList').innerHTML = days.map(d => `
      <div class="td-day-block">
        <div class="td-day-heading"><i class="fas fa-map-marker-alt"></i> ${esc(d.heading)}</div>
        <ul class="td-day-list">${d.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      </div>
    `).join('');
  }

  const waMsg =
`🏔️ TRIP DARSHAN BOOKING ENQUIRY
━━━━━━━━━━━━━━━━━━━━
📦 Package: ${pkg.title || ''}
📍 Route: ${pkg.route || ''}
💰 Price: ₹${pkg.price || ''}
━━━━━━━━━━━━━━━━━━━━
Please share availability and full details.`;
  document.getElementById('tdWaBtn').href = 'https://wa.me/919727729334?text=' + encodeURIComponent(waMsg);

  revealHeroText();
  document.getElementById('tdSkeleton').style.display = 'none';
  document.getElementById('tdContent').style.display = 'block';
}

function renderPackageCard(p) {
  return `
    <a href="/tripdarshan?id=${encodeURIComponent(p.id)}" class="td-card">
      <div class="td-img-wrap">
        ${p.badge ? `<div class="td-badge">${esc(p.badge)}</div>` : ''}
        <img src="${p.image || ''}" alt="${esc(p.title || '')}">
      </div>
      <div class="td-body">
        <h3>${esc(p.title || '')}</h3>
        <div class="td-route"><i class="fas fa-route"></i>&nbsp; ${esc(p.route || '')}</div>
        <div class="td-footer">
          <div class="td-price">₹${esc(p.price || '')}<span>&nbsp;onwards</span></div>
          <div class="td-arrow"><i class="fas fa-arrow-right"></i></div>
        </div>
      </div>
    </a>
  `;
}

function renderAllPackages(list) {
  document.title = 'Trip Darshan Packages | Moksh Travel';
  document.getElementById('tdPageTitle').textContent = 'All Trip Darshan Packages';
  document.getElementById('tdPageSub').textContent = 'Explore our all-inclusive pilgrimage & sightseeing tour packages from Ahmedabad — transparent pricing, day-by-day planning.';
  document.getElementById('tdBreadcrumbTitle').textContent = 'All Packages';
  revealHeroText();
  document.getElementById('tdSkeleton').style.display = 'none';

  if (!list.length) {
    document.getElementById('tdNotFoundTitle').textContent = 'No Packages Available';
    document.getElementById('tdNotFoundText').textContent = 'Please check back soon — new Trip Darshan packages are added regularly.';
    document.getElementById('tdNotFound').style.display = 'block';
    return;
  }

  document.getElementById('tdAllGrid').innerHTML = list.map(renderPackageCard).join('');
  document.getElementById('tdAllPackages').style.display = 'block';
}

function renderMorePackages(list, currentId) {
  const others = list.filter(p => p.id !== currentId).slice(0, 3);
  if (!others.length) return;
  const section = document.getElementById('tdMore');
  const grid = document.getElementById('tdMoreGrid');
  grid.innerHTML = others.map(renderPackageCard).join('');
  section.style.display = 'block';
}

const params = new URLSearchParams(window.location.search);
const id = params.get('id');

fetchCollection('tripDarshan', 'order', 'asc').then(list => {
  if (!id) {
    renderAllPackages(list);
    return;
  }
  const pkg = list.find(p => p.id === id);
  if (!pkg) {
    document.getElementById('tdSkeleton').style.display = 'none';
    document.getElementById('tdPageTitle').textContent = 'Package Not Found';
    document.getElementById('tdPageSub').textContent = 'Please choose a package from the list below.';
    document.getElementById('tdNotFoundTitle').textContent = 'Package Not Found';
    document.getElementById('tdNotFoundText').textContent = 'This Trip Darshan package may have been removed, or the link is incorrect. Please choose a package from the list below.';
    document.getElementById('tdNotFound').style.display = 'block';
    revealHeroText();
    if (list.length) {
      document.getElementById('tdAllGrid').innerHTML = list.map(renderPackageCard).join('');
      document.getElementById('tdAllPackages').style.display = 'block';
    }
    return;
  }
  renderPackage(pkg);
  renderMorePackages(list, pkg.id);
}).catch(err => {
  console.error('Failed to load trip darshan package:', err);
  document.getElementById('tdSkeleton').style.display = 'none';
  document.getElementById('tdNotFound').style.display = 'block';
  document.getElementById('tdPageTitle').textContent = 'Something Went Wrong';
  document.getElementById('tdPageSub').textContent = 'Please try again in a moment.';
  revealHeroText();
});

// ── TRIP DARSHAN BOOKING FORM (pickup date / time / mobile) ──
const tdBookForm = document.getElementById('tdBookForm');
tdBookForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn    = document.getElementById('tdBookBtn');
  const date   = document.getElementById('tdDate').value;
  const time   = document.getElementById('tdTime').value;
  const mobile = document.getElementById('tdMobile').value.trim();

  if (!date) { alert('Please choose a pickup date.'); return; }
  if (!time) { alert('Please choose a pickup time.'); return; }
  if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }

  const pkgTitle = (currentPkg && currentPkg.title) || document.getElementById('tdPageTitle').textContent || 'Trip Darshan Package';
  const pkgRoute = (currentPkg && currentPkg.route) || '';
  const pkgPrice = (currentPkg && currentPkg.price) || '';

  btn.disabled = true;
  const originalBtnHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

  // Save to Firestore
  if (window.saveBookingToFirebase) {
    try {
      await window.saveBookingToFirebase('tripDarshanBookings', {
        package: pkgTitle, route: pkgRoute, price: pkgPrice,
        mobile, date, time, received: new Date()
      });
    } catch (err) {
      console.error('Firebase save error:', err);
    }
  }

  // Send booking details to email
  try {
    await emailjs.send('service_xmnox9n', 'template_lqoj3yg', {
      mobile,
      pickup: pkgTitle,
      destination: pkgRoute,
      date: toDMY(date),
      returnDate: '',
      time: to12Hour(time),
      trip: `Trip Darshan (₹${pkgPrice})`,
      rentalHours: ''
    });
  } catch (err) {
    console.error('EmailJS error:', err);
  }

  const waMsg =
`🏔️ TRIP DARSHAN BOOKING ENQUIRY
━━━━━━━━━━━━━━━━━━━━
📦 Package: ${pkgTitle}
📍 Route: ${pkgRoute}
💰 Price: ₹${pkgPrice}
📅 Pickup Date: ${date}
⏰ Pickup Time: ${time}
📱 Mobile: ${mobile}
━━━━━━━━━━━━━━━━━━━━
Please confirm availability and final pricing.`;
  const waUrl = 'https://wa.me/919727729334?text=' + encodeURIComponent(waMsg);

  btn.innerHTML = '<i class="fas fa-check"></i> Booking Sent!';
  setTimeout(() => {
    window.open(waUrl, '_blank');
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
  }, 1200);
});

// Prefill pickup date/time with today's date and current time
(function() {
  const dateEl = document.getElementById('tdDate');
  const timeEl = document.getElementById('tdTime');
  const now = new Date();
  if (dateEl) {
    dateEl.min = now.toISOString().slice(0, 10);
    dateEl.value = now.toISOString().slice(0, 10);
  }
  if (timeEl) {
    timeEl.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }
})();

window.addEventListener('scroll', () => {
  document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 40);
});
function toggleMenu(){
  const menu = document.getElementById('mainMenu');
  const icon = document.getElementById('hamburgerIcon');
  menu.classList.toggle('open');
  icon.className = menu.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
}
document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => {
  document.getElementById('mainMenu').classList.remove('open');
  document.getElementById('hamburgerIcon').className = 'fas fa-bars';
}));

  // functions used by inline onclick="..." attributes must be global
  try { if (typeof toggleMenu === 'function' && !window.toggleMenu) window.toggleMenu = toggleMenu; } catch (e) {}
}

async function initReviews() {
// ── Header scroll ──────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile menu ────────────────────────────────────────
function toggleMenu() {
  const menu = document.getElementById('mainMenu');
  const icon = document.getElementById('hamburgerIcon');
  menu.classList.toggle('open');
  icon.className = menu.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
}
document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => {
  document.getElementById('mainMenu').classList.remove('open');
  document.getElementById('hamburgerIcon').className = 'fas fa-bars';
}));

// ── Rating bar animation ───────────────────────────────
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.rating-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width;
      });
      barObserver.disconnect();
    }
  });
}, { threshold: 0.3 });
barObserver.observe(document.querySelector('.rating-strip'));

// ── Reviews: show first 8, hide rest ──────────────────
const allCards = Array.from(document.querySelectorAll('.review-card'));
const INITIAL_COUNT = 8;
let currentFilter = 'all';
let visibleCount = INITIAL_COUNT;

function getFiltered() {
  if (currentFilter === 'all') return allCards;
  return allCards.filter(c => c.dataset.category === currentFilter);
}

function renderCards() {
  const filtered = getFiltered();
  allCards.forEach(c => {
    c.classList.remove('visible');
    c.style.animationDelay = '';
  });
  filtered.slice(0, visibleCount).forEach((c, i) => {
    c.style.animationDelay = (i * 0.05) + 's';
    c.classList.add('visible');
  });
  const btn = document.getElementById('loadMoreBtn');
  btn.classList.toggle('hidden', filtered.length <= visibleCount);
}

function loadMore() {
  visibleCount += 4;
  renderCards();
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    visibleCount = INITIAL_COUNT;
    renderCards();
  });
});

// Initial render
renderCards();

// ── Google review prompt (once, after 90s) ─────────────
setTimeout(() => {
  if (!localStorage.getItem('reviewPopup')) {
    if (confirm('Thank you for visiting Moksh Travel.\n\nWould you like to leave a Google Review?')) {
      window.open('https://g.page/r/CTQaIJuvHQ3REBE/review', '_blank');
    }
    localStorage.setItem('reviewPopup', 'yes');
  }
}, 90000);

  // functions used by inline onclick="..." attributes must be global
  try { if (typeof loadMore === 'function' && !window.loadMore) window.loadMore = loadMore; } catch (e) {}
  try { if (typeof toggleMenu === 'function' && !window.toggleMenu) window.toggleMenu = toggleMenu; } catch (e) {}
}

async function initIndex() {
// ── LOCATIONS DATA ─────────────────────────────────────
const gujaratLocations = [
  "Ahmedabad","Gandhinagar","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Junagadh",
  "Porbandar","Anand","Nadiad","Mehsana","Patan","Palanpur","Bharuch","Navsari","Valsad","Vapi",
  "Morbi","Surendranagar","Amreli","Gandhidham","Bhuj","Mundra","Dwarka","Somnath","Gir Somnath",
  "Sasan Gir","Ambaji","Saputara","White Rann","Dhordo","Dholavira","Statue of Unity","Kevadia",
  "Mount Abu","Rani Ki Vav","Modhera Sun Temple","Lothal","Adalaj","Palitana","Girnar",
  "Ahmedpur Mandvi Beach","Mandvi Beach","Polo Forest","Sabarmati Ashram","Akshardham Gandhinagar",
  "Daman","Diu","Vadnagar","Siddhpur","Mumbai","Pune","Jaipur"
];

const airportLocations = [
  "Ahmedabad Airport (SVPI)","Surat Airport","Vadodara Airport",
  "Rajkot Airport (Hirasar)","Bhavnagar Airport","Mumbai Airport (CSMT)"
];
let pickupLocationList = gujaratLocations;

function setupLocationAutocomplete(inputId, dropdownId, getList) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  let highlightedIndex = -1;
  let currentMatches = [];
  const listSource = getList || (() => gujaratLocations);

  function filterLocations(query) {
    const list = listSource();
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 8);
    return list.filter(loc => loc.toLowerCase().includes(q)).slice(0, 8);
  }

  function renderDropdown(matches) {
    currentMatches = matches;
    highlightedIndex = -1;
    if (matches.length === 0) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('open');
      return;
    }
    dropdown.innerHTML = matches.map((loc, i) =>
      `<div class="loc-dropdown-item" data-index="${i}">${loc}</div>`
    ).join('');
    dropdown.classList.add('open');
  }

  function updateHighlight(items) {
    items.forEach((item, i) => item.classList.toggle('highlighted', i === highlightedIndex));
    if (highlightedIndex >= 0) items[highlightedIndex].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', () => renderDropdown(filterLocations(input.value)));
  input.addEventListener('focus', () => renderDropdown(filterLocations(input.value)));
  input.addEventListener('blur', () => setTimeout(() => dropdown.classList.remove('open'), 150));

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.loc-dropdown-item');
    if (!dropdown.classList.contains('open') || items.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1); updateHighlight(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlightedIndex = Math.max(highlightedIndex - 1, 0); updateHighlight(items); }
    else if (e.key === 'Enter' && highlightedIndex >= 0) { e.preventDefault(); input.value = currentMatches[highlightedIndex]; dropdown.classList.remove('open'); }
    else if (e.key === 'Escape') { dropdown.classList.remove('open'); }
  });

  dropdown.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.loc-dropdown-item');
    if (!item) return;
    e.preventDefault();
    input.value = currentMatches[parseInt(item.dataset.index, 10)];
    dropdown.classList.remove('open');
  });
}

document.getElementById('bPickup').value = 'Ahmedabad';
setupLocationAutocomplete('bPickup', 'bPickupDropdown', () => pickupLocationList);
setupLocationAutocomplete('bDestination', 'bDestinationDropdown');


// ── SWAP FROM / TO ─────────────────────────────────────
document.getElementById('swapBtn').addEventListener('click', () => {
  const pickupEl = document.getElementById('bPickup');
  const destEl   = document.getElementById('bDestination');
  const temp = pickupEl.value;
  pickupEl.value = destEl.value;
  destEl.value = temp;
});

// Prevent past-date selection
document.getElementById('bDate').min = new Date().toISOString().split('T')[0];
document.getElementById('bReturnDate').min = new Date().toISOString().split('T')[0];

// ── TRIP TYPE PILLS ────────────────────────────────────
let selectedTrip = 'One Way';
document.querySelectorAll('.trip-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.trip-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedTrip = pill.dataset.trip;

    const rentalCard  = document.getElementById('rentalHoursCard');
    const returnCard   = document.getElementById('returnDateCard');
    const pickupLabel  = document.getElementById('bPickupLabel');
    const pickupInput  = document.getElementById('bPickup');

    rentalCard.style.display = 'none';
    returnCard.style.display = 'none';

    if (selectedTrip === 'Rental') {
      rentalCard.style.display = 'block';
    } else if (selectedTrip === 'Round Trip') {
      returnCard.style.display = 'block';
    }

    if (selectedTrip === 'Airport') {
      pickupLocationList = airportLocations;
      pickupLabel.textContent = 'Which Airport';
      pickupInput.placeholder = 'Select airport';
      pickupInput.value = '';
    } else {
      pickupLocationList = gujaratLocations;
      pickupLabel.textContent = 'From';
      pickupInput.placeholder = 'Enter pickup city';
    }
  });
});

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.className = '', 3500);
}
window.showToast = showToast;

function showSuccessModal(message) {
  const modal    = document.getElementById('successModal');
  const msgEl    = document.getElementById('successMessage');
  const progress = document.getElementById('successProgress');
  msgEl.innerHTML = message;
  modal.style.display = 'flex';
  progress.style.animation = 'none';
  void progress.offsetWidth;
  progress.style.animation = 'drainBar 2.5s linear forwards';
  clearTimeout(window._successTimer);
  window._successTimer = setTimeout(closeSuccessModal, 2600);
}
function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  const card  = document.getElementById('successCard');
  card.style.animation = 'fadeOutModal 0.35s cubic-bezier(0.4,0,0.2,1) forwards';
  setTimeout(() => { modal.style.display = 'none'; card.style.animation = ''; }, 350);
}
window.closeSuccessModal = closeSuccessModal;

function toDMY(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function to12Hour(time24) {
  if (!time24) return '';
  let [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2,'0')} ${period}`;
}


// ── MAIN BOOKING FORM ─────────────────────────────────
document.getElementById('bookingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn        = document.getElementById('bookBtn');
  const mobile     = document.getElementById('bMobile').value.trim();
  const pickup     = document.getElementById('bPickup').value.trim();
  const dest       = document.getElementById('bDestination').value.trim();
  const date       = document.getElementById('bDate').value;
  const returnDate = document.getElementById('bReturnDate').value;
  const time       = document.getElementById('bTime').value;
  const rentalHours = document.getElementById('bRentalHours').value;
  const trip       = selectedTrip;

  if (!pickup) { showToast(trip === 'Airport' ? 'Please select an airport' : 'Please select a pickup city', true); return; }
  if (!dest) { showToast('Please select a destination city', true); return; }
  if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
    showToast('Please enter a valid 10-digit mobile number', true); return;
  }
  if (!time) {
    showToast('Please select a pickup time', true); return;
  }
  if (trip === 'Round Trip' && !returnDate) {
    showToast('Please select a return date', true); return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing…';
  document.getElementById('loadingScreen').style.display = 'flex';

  if (window.saveBookingToFirebase) {
    try {
      await window.saveBookingToFirebase('bookings', {
        mobile, pickup, destination: dest, date,
        returnDate: trip === 'Round Trip' ? returnDate : '',
        rentalHours: trip === 'Rental' ? rentalHours : '',
        time, trip, received: new Date()
      });
    } catch(err) {
      console.error('Firebase save error:', err);
    }
  }

  try {
    await emailjs.send('service_xmnox9n', 'template_lqoj3yg', {
      mobile, pickup, destination: dest,
      date: toDMY(date),
      returnDate: trip === 'Round Trip' ? toDMY(returnDate) : '',
      time: to12Hour(time),
      trip,
      rentalHours: trip === 'Rental' ? rentalHours : ''
    });
  } catch(err) {
    console.error('EmailJS error:', err);
  }
  

  const waMsg =
`━━━━━━━━━━━━━━━━━━━━━━━━━
🚖 I WANT TO BOOK CAB
━━━━━━━━━━━━━━━━━━━━━━━━━
▪️ Contact Number : ${mobile}
▪️ Pickup Location : ${pickup}
▪️ Destination : ${dest}
▪️ Pickup Date : ${date}${trip === 'Round Trip' ? `\n▪️ Return Date : ${returnDate}` : ''}
▪️ Pickup Time : ${time}
▪️ Trip Type : ${trip}${trip === 'Rental' ? `\n▪️ Rental Package : ${rentalHours}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const waUrl = 'https://wa.me/919727729334?text=' + encodeURIComponent(waMsg);

  document.getElementById('loadingScreen').style.display = 'none';
  showSuccessModal('Booking saved! Redirecting you to WhatsApp to confirm with our team.');

  setTimeout(() => {
    window.open(waUrl, '_blank');
    document.getElementById('bookingForm').reset();
    document.getElementById('bPickup').value = 'Ahmedabad';
    document.getElementById('bDestination').value = '';
    document.querySelectorAll('.trip-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('.trip-pill[data-trip="One Way"]').classList.add('active');
    selectedTrip = 'One Way';
    pickupLocationList = gujaratLocations;
    document.getElementById('bPickupLabel').textContent = 'From';
    document.getElementById('bPickup').placeholder = 'Enter pickup city';
    document.getElementById('rentalHoursCard').style.display = 'none';
    document.getElementById('returnDateCard').style.display = 'none';
    btn.disabled = false;
    btn.innerHTML = '<i class="fab fa-whatsapp"></i> Confirm Booking on WhatsApp';
  }, 1200);
});

// ── ROUTE BOOKING ─────────────────────────────────────
window.bookRoute = async function(route, sedan, suv) {
  const mobile = prompt('Enter your 10-digit mobile number to book this route:');
  if (!mobile || mobile.length !== 10 || isNaN(mobile)) { alert('Please enter a valid 10-digit mobile number.'); return; }

  if (window.saveBookingToFirebase) {
    try { await window.saveBookingToFirebase('routeInquiries', { route, sedan, suv, mobile, received: new Date() }); }
    catch(err) { console.error('Firebase error:', err); }
  }

  try {
    await emailjs.send('service_xmnox9n', 'template_lqoj3yg', {
      mobile,
      pickup: 'Route Inquiry',
      destination: route,
      date: '',
      returnDate: '',
      time: '',
      trip: `Route Booking — Sedan ₹${sedan} / SUV ₹${suv}`,
      rentalHours: ''
    });
  } catch(err) { console.error('EmailJS error:', err); }

  const waMsg =
`🚖 I WANT TO BOOK CAB
━━━━━━━━━━━━━━━━━━━━
📍 Route: ${route}
💺 Sedan Price: ₹${sedan}
🚙 SUV Price: ₹${suv}
📱 Customer Number: ${mobile}
━━━━━━━━━━━━━━━━━━━━`;

  window.open('https://wa.me/919727729334?text=' + encodeURIComponent(waMsg), '_blank');
};

// ── ROUND TRIP BOOKING ────────────────────────────────
window.bookRoundTrip = function(car, rate) {
  window._rtCar  = car;
  window._rtRate = rate;
  document.getElementById('rtPhone').value = '';
  document.getElementById('rtPhoneErr').style.display = 'none';
  document.getElementById('rtModalVehicle').innerHTML =
    `<i class="fas fa-circle" style="font-size:7px;color:var(--teal)"></i>
     <span style="color:var(--ice);font-weight:700">${car}</span>
     <span style="color:var(--gold);font-family:'Space Grotesk'">₹${rate} / km</span>`;
  document.getElementById('rtModal').style.display = 'flex';
  setTimeout(() => document.getElementById('rtPhone').focus(), 100);
};

window.closeRtModal = function() {
  document.getElementById('rtModal').style.display = 'none';
};

window.submitRtWA = async function() {
  const mobile = document.getElementById('rtPhone').value.trim();
  const errEl  = document.getElementById('rtPhoneErr');
  if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
    errEl.style.display = 'block';
    document.getElementById('rtPhone').focus();
    return;
  }
  errEl.style.display = 'none';
  const car  = window._rtCar;
  const rate = window._rtRate;
  closeRtModal();

  if (window.saveBookingToFirebase) {
    try {
      await window.saveBookingToFirebase('roundTripRequests', { car, rate, mobile, received: new Date() });
    } catch(err) { console.error('Firebase error:', err); }
  }

  try {
    await emailjs.send('service_xmnox9n', 'template_lqoj3yg', {
      mobile,
      pickup: 'Round Trip Request',
      destination: car,
      date: '',
      returnDate: '',
      time: '',
      trip: `Round Trip — ₹${rate}/km`,
      rentalHours: ''
    });
  } catch(err) { console.error('EmailJS error:', err); }

  const waMsg =
`🚖 ROUND TRIP BOOKING
━━━━━━━━━━━━━━━━━━━━
🚘 Vehicle : ${car}
💰 Rate : ₹${rate}/KM
📱 Customer Number : ${mobile}
━━━━━━━━━━━━━━━━━━━━`;

  window.open('https://wa.me/919727729334?text=' + encodeURIComponent(waMsg), '_blank');
};

document.getElementById('rtPhone').addEventListener('keydown', e => {
  if (e.key === 'Enter') window.submitRtWA();
  if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault();
});
document.getElementById('rtModal').addEventListener('click', function(e) {
  if (e.target === this) closeRtModal();
});

// ── REVIEW MODAL ──────────────────────────────────────
const reviewTemplates = [
  "Outstanding cab service! The driver was punctual, the car was spotless, and the entire trip was smooth and comfortable. Transparent pricing with no hidden charges. Moksh Travel is the best cab service in Ahmedabad — will definitely book again!",
  "Excellent experience with Moksh Travel! Professional driver, well-maintained vehicle, and on-time pickup. The pricing was fair and completely transparent. Highly recommend for anyone looking for a reliable cab service in Ahmedabad or Gujarat.",
  "Very impressed with Moksh Travel. From easy booking to a comfortable journey, everything was perfect. The driver was courteous and took the best route. Loved the clean car and professional service. 5 stars without any hesitation!",
  "Booked a cab with Moksh Travel and had a wonderful experience. The vehicle was clean, AC was perfect, driver was polite and professional. Arrived on time and the trip was stress-free. Best cab service in Ahmedabad!",
  "Absolutely wonderful service by Moksh Travel! Quick response, punctual driver, and a comfortable ride throughout. The pricing was exactly as quoted — no hidden charges. Perfect for outstation trips from Ahmedabad. Highly recommended!",
  "Moksh Travel deserves all 5 stars! From prompt booking confirmation to a smooth, comfortable journey, they exceeded expectations. The driver was experienced and friendly. This is the most trustworthy cab service I have used in Gujarat."
];

window.openReviewModal = function() {
  document.getElementById('reviewModal').style.display = 'flex';
  const content = document.getElementById('reviewModalContent');
  content.innerHTML = `
    <div class="rm-loader">
      <div class="rm-spinner"></div>
      <p>Generating your personalised review…</p>
    </div>`;

  setTimeout(() => {
    const review = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
    window._currentReview = review;
    content.innerHTML = `
      <div class="rm-stars">★★★★★</div>
      <div class="rm-tag">✦ Your Review is Ready ✦</div>
      <div class="rm-review-text" id="rmReviewText">${review}</div>
      <button class="rm-copy-btn" id="rmCopyBtn" onclick="copyReview()">
        <i class="fas fa-copy"></i> Copy Review
      </button>
      <p class="rm-redirect-hint">
        After copying, click <strong>"Go to Google Reviews"</strong> and paste your review there.<br>
        <a href="https://g.page/r/CTQaIJuvHQ3REBE/review" target="_blank" id="rmGoogleLink" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;background:var(--gold-dim);border:1px solid rgba(184,134,44,0.3);padding:10px 20px;border-radius:30px;font-weight:700;font-size:13.5px;">
          <i class="fab fa-google"></i> Go to Google Reviews
        </a>
      </p>`;
  }, 1400);
};

window.copyReview = function() {
  const review = window._currentReview || '';
  navigator.clipboard.writeText(review).then(() => {
    const btn = document.getElementById('rmCopyBtn');
    btn.classList.add('copied');
    btn.innerHTML = '<i class="fas fa-check"></i> Copied! Now paste on Google';
    showToast('Review copied to clipboard!');
    setTimeout(() => { window.open('https://g.page/r/CTQaIJuvHQ3REBE/review', '_blank'); }, 1500);
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = review;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    const btn = document.getElementById('rmCopyBtn');
    btn.classList.add('copied');
    btn.innerHTML = '<i class="fas fa-check"></i> Copied! Now paste on Google';
    showToast('Review copied!');
    setTimeout(() => { window.open('https://g.page/r/CTQaIJuvHQ3REBE/review', '_blank'); }, 1500);
  });
};

window.closeReviewModal = function() {
  document.getElementById('reviewModal').style.display = 'none';
};
document.getElementById('reviewModal').addEventListener('click', function(e) {
  if (e.target === this) closeReviewModal();
});

// Header scroll
window.addEventListener('scroll', () => {
  document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile menu
function toggleMenu() {
  const menu = document.getElementById('mainMenu');
  const icon = document.getElementById('hamburgerIcon');
  menu.classList.toggle('open');
  icon.className = menu.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
}
document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => {
  document.getElementById('mainMenu').classList.remove('open');
  document.getElementById('hamburgerIcon').className = 'fas fa-bars';
}));

// ── DYNAMIC ROUTES RENDER ─────────────────────────────
window.renderRoutesGrid = function(routes) {
  const grid = document.getElementById('routesGrid');
  // Keep hardcoded fallback if Firebase has no data yet
  if (!routes || !routes.length) return;
  grid.innerHTML = routes.map(r => `
    <div class="route-card">
      <img src="${r.image || ''}" alt="${r.name}">
      <div class="route-body">
        <h3>${r.name}</h3>
        <div class="route-prices">
          <div class="route-price">Sedan: <span>₹${r.sedan}</span></div>
          <div class="route-price">SUV: <span>₹${r.suv}</span></div>
        </div>
        <button class="route-btn" onclick="bookRoute('${(r.name||'').replace(/'/g, "\\'")}','${r.sedan}','${r.suv}')"><i class="fas fa-arrow-right"></i> Book Now</button>
      </div>
    </div>
  `).join('');
};

// ── FARE TABLE ROWS → TAP ANYWHERE TO OPEN ROUTE PAGE ──
document.querySelectorAll('.fare-table tbody tr[data-href]').forEach(function(row) {
  row.addEventListener('click', function(e) {
    if (e.target.closest('a')) return; // let the link's own click behave normally
    window.location.href = row.getAttribute('data-href');
  });
});

// ── FAQ ACCORDION ─────────────────────────────────────
window.toggleFaq = function(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const wasOpen = item.classList.contains('open');

  document.querySelectorAll('.faq-item.open').forEach(other => {
    if (other !== item) {
      other.classList.remove('open');
      other.querySelector('.faq-answer').style.maxHeight = null;
    }
  });

  if (wasOpen) {
    item.classList.remove('open');
    answer.style.maxHeight = null;
  } else {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
};

// Show more reviews
function showMoreReviews() {
  document.querySelectorAll('.hidden-review').forEach(r => r.style.display = 'block');
  document.querySelector('.see-more-btn').style.display = 'none';
}

// Round trip count-up animation on scroll
function initRoundTripCountUp() {
  const rateNums = document.querySelectorAll('.rt-rate-num');
  function animateCount(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = 'true';
    const target = parseInt(el.dataset.target, 10);
    const duration = 900;
    const start = Date.now();
    el.classList.add('animate');
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) animateCount(entry.target); });
  }, { threshold: 0.4 });
  rateNums.forEach(el => observer.observe(el));
}

// ── DYNAMIC ROUND TRIP RENDER ─────────────────────────
window.renderRoundTripGrid = function(rates) {
  const grid = document.getElementById('roundtripGrid');
  const wrap = document.getElementById('roundtripSliderWrap');
  // Keep hardcoded fallback if Firebase has no data yet
  if (!rates || !rates.length) return;
  // Desktop only becomes a slider once there are more than 3 cards;
  // mobile is always a slider (handled purely by the CSS media query).
  if (wrap) {
    grid.classList.toggle('rt-slider', rates.length > 3);
    wrap.classList.toggle('is-slider', rates.length > 3);
  }
  grid.innerHTML = rates.map(r => {
    const theme = r.theme || 'ertiga';
    const features = (r.features || '').split(',').map(f => f.trim()).filter(Boolean);
    const featuresHtml = features.map(f => `<div class="rt-feature-pill"><i class="fas fa-check"></i> ${f}</div>`).join('');
    const badgeHtml = r.badge ? `<div class="rt-badge">${r.badge}</div>` : '';
    const nameEsc = (r.name || '').replace(/'/g, "\\'");
    return `
    <div class="rt-card ${theme}">
      <div class="rt-img-wrap">
        ${badgeHtml}
        <img src="${r.image || ''}" alt="${r.name}">
      </div>
      <h3>${r.name}</h3>
      <div class="capacity"><span><i class="fas fa-user"></i> ${r.persons} Persons</span><span>·</span><span><i class="fas fa-briefcase"></i> ${r.bags} Bags</span></div>
      <div class="rt-rate-block">
        <div class="rt-rate-label">Round Trip Rate</div>
        <div class="rt-rate"><span class="rt-rate-sym">₹</span><span class="rt-rate-num" data-target="${r.rate}">${r.rate}</span><span class="rt-rate-unit">&nbsp;/ km</span></div>
      </div>
      <div class="rt-divider"><i class="fas fa-circle" style="font-size:5px"></i></div>
      <div class="rt-features">${featuresHtml}</div>
      <button class="rt-book-btn" onclick="bookRoundTrip('${nameEsc}','${r.rate}')"><i class="fab fa-whatsapp"></i> &nbsp;Book on WhatsApp</button>
    </div>`;
  }).join('');
  initRoundTripCountUp();
  initRoundTripNav();
  initRoundTripAutoSlide();
};

// ── ROUND TRIP SLIDER NAV ─────────────────────────
function scrollRoundTrip(dir) {
  const grid = document.getElementById('roundtripGrid');
  if (!grid) return;
  const card = grid.querySelector('.rt-card');
  let step;
  if (card) {
    const cs = getComputedStyle(card);
    const marginLeft = parseFloat(cs.marginLeft) || 0;
    const marginRight = parseFloat(cs.marginRight) || 0;
    const gap = parseFloat(getComputedStyle(grid).columnGap || getComputedStyle(grid).gap || '0') || 0;
    step = card.getBoundingClientRect().width + marginLeft + marginRight + gap;
  } else {
    step = grid.clientWidth * 0.85;
  }
  grid.scrollBy({ left: dir * step, behavior: 'smooth' });
}
window.scrollRoundTrip = scrollRoundTrip;

function initRoundTripNav() {
  const grid = document.getElementById('roundtripGrid');
  const wrap = document.getElementById('roundtripSliderWrap');
  if (!grid || !wrap || grid.dataset.navBound) return;
  grid.dataset.navBound = '1';
  const prevBtn = wrap.querySelector('.rt-nav-prev');
  const nextBtn = wrap.querySelector('.rt-nav-next');
  const updateNav = () => {
    const max = grid.scrollWidth - grid.clientWidth - 2;
    if (prevBtn) prevBtn.disabled = grid.scrollLeft <= 2;
    if (nextBtn) nextBtn.disabled = grid.scrollLeft >= max;
  };
  grid.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);
  updateNav();
}

// ── ROUND TRIP AUTO SLIDE ─────────────────────────
let rtAutoSlideTimer = null;
let rtAutoSlidePaused = false;
let rtAutoSlideResumeTimeout = null;

function rtAdvanceSlide() {
  if (rtAutoSlidePaused) return;
  const grid = document.getElementById('roundtripGrid');
  if (!grid) return;
  const max = grid.scrollWidth - grid.clientWidth - 2;
  if (max <= 0) return; // nothing to slide
  if (grid.scrollLeft >= max) {
    grid.scrollTo({ left: 0, behavior: 'smooth' }); // loop back to start
  } else {
    scrollRoundTrip(1);
  }
}

function rtPauseAutoSlide() {
  rtAutoSlidePaused = true;
  clearTimeout(rtAutoSlideResumeTimeout);
}

function rtResumeAutoSlideSoon() {
  clearTimeout(rtAutoSlideResumeTimeout);
  rtAutoSlideResumeTimeout = setTimeout(() => { rtAutoSlidePaused = false; }, 4000);
}

function initRoundTripAutoSlide() {
  const wrap = document.getElementById('roundtripSliderWrap');
  const grid = document.getElementById('roundtripGrid');
  if (!wrap || !grid || wrap.dataset.autoBound) return;
  wrap.dataset.autoBound = '1';

  wrap.addEventListener('mouseenter', rtPauseAutoSlide);
  wrap.addEventListener('mouseleave', () => { rtAutoSlidePaused = false; });
  wrap.addEventListener('touchstart', rtPauseAutoSlide, { passive: true });
  wrap.addEventListener('touchend', rtResumeAutoSlideSoon, { passive: true });
  wrap.querySelectorAll('.rt-nav').forEach(btn => {
    btn.addEventListener('click', () => { rtPauseAutoSlide(); rtResumeAutoSlideSoon(); });
  });

  if (!rtAutoSlideTimer) rtAutoSlideTimer = setInterval(rtAdvanceSlide, 2500);
}

// ── DYNAMIC TRIP DARSHAN RENDER ─────────────────────────
window.renderTripDarshanGrid = function(list) {
  const grid = document.getElementById('tripDarshanGrid');
  const wrap = document.getElementById('tripDarshanSliderWrap');
  if (!grid) return;
  // Keep hardcoded fallback if Firebase has no data yet
  if (!list || !list.length) return;
  if (wrap) {
    grid.classList.toggle('rt-slider', list.length > 3);
    wrap.classList.toggle('is-slider', list.length > 3);
  }
  grid.innerHTML = list.map(p => `
    <a href="/tripdarshan?id=${encodeURIComponent(p.id)}" class="td-card">
      <div class="td-img-wrap">
        ${p.badge ? `<div class="td-badge">${p.badge}</div>` : ''}
        <img src="${p.image || ''}" alt="${p.title || ''}">
      </div>
      <div class="td-body">
        <h3>${p.title || ''}</h3>
        <div class="td-route"><i class="fas fa-route"></i>&nbsp; ${p.route || ''}</div>
        <div class="td-footer">
          <div class="td-price">₹${p.price || ''}<span>&nbsp;onwards</span></div>
          <div class="td-arrow"><i class="fas fa-arrow-right"></i></div>
        </div>
      </div>
    </a>
  `).join('');
  initTripDarshanNav();
  initTripDarshanAutoSlide();
};

// ── TRIP DARSHAN SLIDER NAV ─────────────────────────
function scrollTripDarshan(dir) {
  const grid = document.getElementById('tripDarshanGrid');
  if (!grid) return;
  const card = grid.querySelector('.td-card');
  let step;
  if (card) {
    const cs = getComputedStyle(card);
    const marginLeft = parseFloat(cs.marginLeft) || 0;
    const marginRight = parseFloat(cs.marginRight) || 0;
    const gap = parseFloat(getComputedStyle(grid).columnGap || getComputedStyle(grid).gap || '0') || 0;
    step = card.getBoundingClientRect().width + marginLeft + marginRight + gap;
  } else {
    step = grid.clientWidth * 0.85;
  }
  grid.scrollBy({ left: dir * step, behavior: 'smooth' });
}
window.scrollTripDarshan = scrollTripDarshan;

function initTripDarshanNav() {
  const grid = document.getElementById('tripDarshanGrid');
  const wrap = document.getElementById('tripDarshanSliderWrap');
  if (!grid || !wrap || grid.dataset.navBound) return;
  grid.dataset.navBound = '1';
  const prevBtn = wrap.querySelector('.rt-nav-prev');
  const nextBtn = wrap.querySelector('.rt-nav-next');
  const updateNav = () => {
    const max = grid.scrollWidth - grid.clientWidth - 2;
    if (prevBtn) prevBtn.disabled = grid.scrollLeft <= 2;
    if (nextBtn) nextBtn.disabled = grid.scrollLeft >= max;
  };
  grid.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);
  updateNav();
}

// ── TRIP DARSHAN AUTO SLIDE ─────────────────────────
let tdAutoSlideTimer = null;
let tdAutoSlidePaused = false;
let tdAutoSlideResumeTimeout = null;

function tdAdvanceSlide() {
  if (tdAutoSlidePaused) return;
  const grid = document.getElementById('tripDarshanGrid');
  if (!grid) return;
  const max = grid.scrollWidth - grid.clientWidth - 2;
  if (max <= 0) return; // nothing to slide
  if (grid.scrollLeft >= max) {
    grid.scrollTo({ left: 0, behavior: 'smooth' }); // loop back to start
  } else {
    scrollTripDarshan(1);
  }
}

function tdPauseAutoSlide() {
  tdAutoSlidePaused = true;
  clearTimeout(tdAutoSlideResumeTimeout);
}

function tdResumeAutoSlideSoon() {
  clearTimeout(tdAutoSlideResumeTimeout);
  tdAutoSlideResumeTimeout = setTimeout(() => { tdAutoSlidePaused = false; }, 4000);
}

function initTripDarshanAutoSlide() {
  const wrap = document.getElementById('tripDarshanSliderWrap');
  const grid = document.getElementById('tripDarshanGrid');
  if (!wrap || !grid || wrap.dataset.autoBound) return;
  wrap.dataset.autoBound = '1';

  wrap.addEventListener('mouseenter', tdPauseAutoSlide);
  wrap.addEventListener('mouseleave', () => { tdAutoSlidePaused = false; });
  wrap.addEventListener('touchstart', tdPauseAutoSlide, { passive: true });
  wrap.addEventListener('touchend', tdResumeAutoSlideSoon, { passive: true });
  wrap.querySelectorAll('.rt-nav').forEach(btn => {
    btn.addEventListener('click', () => { tdPauseAutoSlide(); tdResumeAutoSlideSoon(); });
  });

  if (!tdAutoSlideTimer) tdAutoSlideTimer = setInterval(tdAdvanceSlide, 2500);
}

window.saveBookingToFirebase = saveDocument;

fetchCollection('routes', 'order', 'asc').then(routes => {
  if (window.renderRoutesGrid) window.renderRoutesGrid(routes);
});

fetchCollection('roundTripRates', 'order', 'asc').then(rates => {
  if (window.renderRoundTripGrid) window.renderRoundTripGrid(rates);
});

fetchCollection('tripDarshan', 'order', 'asc').then(list => {
  if (window.renderTripDarshanGrid) window.renderTripDarshanGrid(list);
});

document.addEventListener('DOMContentLoaded', function () {
  try { if (typeof initRoundTripCountUp === 'function') initRoundTripCountUp(); } catch (e) {}
  try { if (typeof initRoundTripNav === 'function') initRoundTripNav(); } catch (e) {}
  try { if (typeof initRoundTripAutoSlide === 'function') initRoundTripAutoSlide(); } catch (e) {}
  try { if (typeof initTripDarshanNav === 'function') initTripDarshanNav(); } catch (e) {}
  try { if (typeof initTripDarshanAutoSlide === 'function') initTripDarshanAutoSlide(); } catch (e) {}
  // Enable slider mode for hardcoded cards if > 3
  var rtGrid = document.getElementById('roundtripGrid');
  var rtWrap = document.getElementById('roundtripSliderWrap');
  if (rtGrid && rtWrap && rtGrid.querySelectorAll('.rt-card').length > 3) {
    rtGrid.classList.add('rt-slider');
    rtWrap.classList.add('is-slider');
  }
  var tdGrid = document.getElementById('tripDarshanGrid');
  var tdWrap = document.getElementById('tripDarshanSliderWrap');
  if (tdGrid && tdWrap && tdGrid.querySelectorAll('.td-card').length > 3) {
    tdGrid.classList.add('td-slider');
    tdWrap.classList.add('is-slider');
  }
});

  // functions used by inline onclick="..." attributes must be global
  try { if (typeof bookRoundTrip === 'function' && !window.bookRoundTrip) window.bookRoundTrip = bookRoundTrip; } catch (e) {}
  try { if (typeof bookRoute === 'function' && !window.bookRoute) window.bookRoute = bookRoute; } catch (e) {}
  try { if (typeof closeReviewModal === 'function' && !window.closeReviewModal) window.closeReviewModal = closeReviewModal; } catch (e) {}
  try { if (typeof closeRtModal === 'function' && !window.closeRtModal) window.closeRtModal = closeRtModal; } catch (e) {}
  try { if (typeof copyReview === 'function' && !window.copyReview) window.copyReview = copyReview; } catch (e) {}
  try { if (typeof openReviewModal === 'function' && !window.openReviewModal) window.openReviewModal = openReviewModal; } catch (e) {}
  try { if (typeof scrollRoundTrip === 'function' && !window.scrollRoundTrip) window.scrollRoundTrip = scrollRoundTrip; } catch (e) {}
  try { if (typeof scrollTripDarshan === 'function' && !window.scrollTripDarshan) window.scrollTripDarshan = scrollTripDarshan; } catch (e) {}
  try { if (typeof submitRtWA === 'function' && !window.submitRtWA) window.submitRtWA = submitRtWA; } catch (e) {}
  try { if (typeof toggleFaq === 'function' && !window.toggleFaq) window.toggleFaq = toggleFaq; } catch (e) {}
  try { if (typeof toggleMenu === 'function' && !window.toggleMenu) window.toggleMenu = toggleMenu; } catch (e) {}
}


// ---- start ---------------------------------------------------------------
if (isPage('route')) { initCommon(); initRouteSearch(); initBlogPager(); if (document.body.dataset.drop) initRoutePage(); }
else if (isPage('cancel')) initCommon();
else if (isPage('about')) initAbout();
else if (isPage('trip')) initTrip();
else if (isPage('reviews')) initReviews();
else if (isPage('index')) initIndex();

})();
