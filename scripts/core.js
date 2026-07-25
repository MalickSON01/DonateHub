// =====================================================================
// core.js
// Contient : les données de l'application, les fonctions utilitaires,
// la validation de formulaire, le formatage des montants,
// la gestion des utilisateurs et l'authentification, ainsi que les onglets.
// =====================================================================

let campaigns = JSON.parse(localStorage.getItem('donatehub_campaigns')) || [
  {
    id: 1,
    title: "Aide reconstruction école primaire",
    desc: "Notre école a été endommagée par les inondations. Nous avons besoin de fonds pour réparer les salles de classe et racheter du matériel scolaire pour les 120 enfants du village.",
    goal: 150000,
    raised: 87500,
    author: "Association Les Petits Cœurs",
    authorPhone: "22670123456",
    authorOperator: "ORANGE_MONEY",
    image: "",
    createdAt: Date.now() - 86400000 * 5,
    donations: [
      { name: "Sophie L.", amount: 5000, anonymous: false, date: Date.now() - 86400000 * 2, operator: "ORANGE", txId: "YP2026035.852.96420861" },
      { name: "", amount: 15000, anonymous: true, date: Date.now() - 86400000 * 3, operator: "MOOV", txId: "YP2026035.853.11223344" },
      { name: "Pierre D.", amount: 2500, anonymous: false, date: Date.now() - 86400000 * 4, operator: "SANKM", txId: "YP2026035.854.55667788" },
    ]
  },
  {
    id: 2,
    title: "Soutien aux sans-abri en hiver",
    desc: "Collecte de fonds pour acheter des sacs de couchage, des vêtements chauds et distribuer des repas chauds aux personnes sans domicile fixe pendant l'hiver.",
    goal: 80000,
    raised: 32000,
    author: "Solidarité Rue",
    authorPhone: "22670707700",
    authorOperator: "MOOV_MONEY",
    image: "",
    createdAt: Date.now() - 86400000 * 10,
    donations: [
      { name: "Lucas B.", amount: 5000, anonymous: false, date: Date.now() - 86400000 * 6, operator: "TELECEL", txId: "YP2026035.855.99887766" },
      { name: "", amount: 10000, anonymous: true, date: Date.now() - 86400000 * 7, operator: "CORISM", txId: "YP2026035.856.44332211" },
    ]
  },
  {
    id: 3,
    title: "Opération vaccin chiens errants",
    desc: "Nous voulons vacciner et stériliser 50 chiens errants de notre commune. Chaque intervention coûte 80€. Merci pour votre générosité !",
    goal: 40000,
    raised: 21000,
    author: "Pattes Sans Toit",
    authorPhone: "22674121212",
    authorOperator: "SANK_MONEY",
    image: "",
    createdAt: Date.now() - 86400000 * 3,
    donations: [
      { name: "", amount: 5000, anonymous: true, date: Date.now() - 86400000 * 1, operator: "ORANGE", txId: "YP2026035.857.77665544" },
      { name: "Julie M.", amount: 3000, anonymous: false, date: Date.now() - 86400000 * 2, operator: "TELECEL", txId: "YP2026035.858.33445566" },
    ]
  }
];

let nextId = campaigns.length > 0 ? Math.max(...campaigns.map(c => c.id)) + 1 : 1;
let simState = {};
let currentUser = JSON.parse(localStorage.getItem('donatehub_user')) || null;
let pendingAction = null;
let pendingImageData = null;
const DEFAULT_IMAGE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="260"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f3460"/><stop offset="100%" stop-color="#7b1fa2"/></linearGradient></defs><rect width="1000" height="260" fill="url(#g)"/><text x="50%" y="42%" font-size="52" text-anchor="middle" dominant-baseline="middle">\u2764\ufe0f</text><text x="50%" y="63%" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" opacity="0.95">DonateHub</text></svg>';
const DEFAULT_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(DEFAULT_IMAGE_SVG);

function save() { localStorage.setItem('donatehub_campaigns', JSON.stringify(campaigns)); }
function saveUser() { localStorage.setItem('donatehub_user', JSON.stringify(currentUser)); }
function formatMoney(n) { return n.toLocaleString('fr-FR') + ' XOF'; }
function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "hier";
  return `il y a ${d} jours`;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById('err-' + inputId);
  if (input) input.classList.add('input-error');
  if (errEl) { errEl.textContent = message; errEl.classList.add('visible'); }
}
function clearFieldError(inputId) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById('err-' + inputId);
  if (input) input.classList.remove('input-error');
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
}
function clearAllErrors(prefix) {
  document.querySelectorAll('[id^="err-' + prefix + '"]').forEach(el => {
    el.textContent = ''; el.classList.remove('visible');
  });
  document.querySelectorAll('#' + prefix + ' .input-error, #' + prefix + '-form .input-error, [id^="' + prefix + '"].input-error').forEach(el => {
    el.classList.remove('input-error');
  });
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.setAttribute('aria-label', 'Masquer le mot de passe');
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.setAttribute('aria-label', 'Afficher le mot de passe');
  }
}

function formatMoneyInput(value) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return { raw: '', formatted: '' };
  const num = parseInt(digits, 10);
  if (isNaN(num)) return { raw: '', formatted: '' };
  return { raw: String(num), formatted: num.toLocaleString('fr-FR') };
}
function setupMoneyInputs() {
  document.querySelectorAll('.money-input').forEach(input => {
    input.addEventListener('input', function(e) {
      const selStart = this.selectionStart;
      const oldLen = this.value.length;
      const result = formatMoneyInput(this.value);
      this.value = result.formatted;
      this.setAttribute('data-raw', result.raw);
      const newLen = this.value.length;
      const cursorOffset = newLen - oldLen;
      this.setSelectionRange(selStart + cursorOffset, selStart + cursorOffset);
      const errId = 'err-' + this.id;
      const errEl = document.getElementById(errId);
      if (errEl && errEl.classList.contains('visible')) {
        clearFieldError(this.id);
      }
    });
    input.addEventListener('blur', function() {
      const result = formatMoneyInput(this.value);
      this.value = result.formatted;
      this.setAttribute('data-raw', result.raw);
    });
  });
}
function getMoneyValue(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return 0;
  const raw = input.getAttribute('data-raw') || input.value.replace(/\D/g, '');
  return parseInt(raw, 10) || 0;
}

// ===== "BASE DE DONNÉES" JSON DES UTILISATEURS (localStorage) =====
function loadUsers() {
  return JSON.parse(localStorage.getItem('donatehub_users')) || [];
}
function saveUsers(users) {
  localStorage.setItem('donatehub_users', JSON.stringify(users));
}

function renderAuthBar() {
  const bar = document.getElementById('auth-bar');
  if (currentUser) {
    bar.innerHTML = `
      <div class="auth-bar-left">
        <span class="auth-bar-text">👤 Connecté en tant que <strong>+${currentUser.phone}</strong></span>
      </div>
      <button onclick="logout()" class="btn btn-red" style="padding:8px 16px; font-size:13px;">Déconnexion</button>
    `;
  } else {
    bar.innerHTML = `
      <div class="auth-bar-left">
        <span class="auth-bar-text">🔒 La consultation des campagnes et les dons sont libres. Une connexion est requise pour créer une campagne.</span>
      </div>
      <button onclick="openAuthModal(null)" class="btn btn-primary" style="padding:8px 16px; font-size:13px;">Connexion / Inscription</button>
    `;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('donatehub_user');
  renderAuthBar();
  renderCampaigns();
  showToast('🔒 Déconnecté');
}

function isOwner(campaign) {
  if (!currentUser) return false;
  return currentUser.phone === campaign.authorPhone;
}

function openAuthModal(action) {
  pendingAction = action || null;
  switchAuthMode('login');
  document.getElementById('login-phone').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('register-phone').value = '';
  document.getElementById('register-password').value = '';
  document.getElementById('register-password-confirm').value = '';
  clearFieldError('login-phone');
  clearFieldError('login-password');
  clearFieldError('register-phone');
  clearFieldError('register-password');
  clearFieldError('register-password-confirm');
  document.getElementById('auth-modal').classList.add('active');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('active');
  pendingAction = null;
}

function switchAuthMode(mode) {
  document.getElementById('auth-tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('auth-tab-register').classList.toggle('active', mode === 'register');
  document.getElementById('auth-form-login').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('auth-form-register').style.display = mode === 'register' ? 'block' : 'none';
}

function registerUser(e) {
  e.preventDefault();
  clearFieldError('register-phone');
  clearFieldError('register-password');
  clearFieldError('register-password-confirm');

  const phone = document.getElementById('register-phone').value.trim();
  const pw = document.getElementById('register-password').value;
  const pwConfirm = document.getElementById('register-password-confirm').value;
  let hasError = false;

  if (!phone || phone.length < 8) {
    showFieldError('register-phone', 'Veuillez entrer un numéro valide (min. 8 chiffres)');
    hasError = true;
  }
  if (!pw || pw.length < 4) {
    showFieldError('register-password', 'Mot de passe trop court (min. 4 caractères)');
    hasError = true;
  }
  if (pw !== pwConfirm) {
    showFieldError('register-password-confirm', 'Les mots de passe ne correspondent pas');
    hasError = true;
  }
  if (hasError) return;

  const users = loadUsers();
  if (users.find(u => u.phone === phone)) {
    showFieldError('register-phone', 'Ce numéro est déjà inscrit — connectez-vous');
    switchAuthMode('login');
    return;
  }

  users.push({ phone, password: pw });
  saveUsers(users);

  currentUser = { phone };
  saveUser();
  renderAuthBar();
  closeAuthModal();
  showToast('🎉 Inscription réussie !');
  afterAuthSuccess();
}

function loginUserSubmit(e) {
  e.preventDefault();
  clearFieldError('login-phone');
  clearFieldError('login-password');

  const phone = document.getElementById('login-phone').value.trim();
  const pw = document.getElementById('login-password').value;
  let hasError = false;

  if (!phone || phone.length < 8) {
    showFieldError('login-phone', 'Veuillez entrer un numéro valide');
    hasError = true;
  }
  if (!pw) {
    showFieldError('login-password', 'Veuillez entrer votre mot de passe');
    hasError = true;
  }
  if (hasError) return;

  const users = loadUsers();
  const user = users.find(u => u.phone === phone && u.password === pw);
  if (!user) {
    showFieldError('login-password', 'Numéro ou mot de passe incorrect');
    document.getElementById('login-password').value = '';
    return;
  }

  currentUser = { phone };
  saveUser();
  renderAuthBar();
  closeAuthModal();
  showToast('🔓 Connecté avec succès');
  afterAuthSuccess();
}

function afterAuthSuccess() {
  if (pendingAction === 'create') {
    resetCreateForm();
    showTab('create');
    const phoneField = document.getElementById('c-phone');
    if (phoneField) phoneField.value = currentUser.phone;
  }
  pendingAction = null;
}

function showTab(tab) {
  document.getElementById('tab-campaigns').style.display = tab === 'campaigns' ? 'block' : 'none';
  document.getElementById('tab-create').style.display = tab === 'create' ? 'block' : 'none';
  const bc = document.getElementById('btn-campaigns');
  const bcr = document.getElementById('btn-create');
  if (bc) {
    bc.className = tab === 'campaigns' ? 'btn btn-primary' : 'btn btn-outline';
  }
  if (bcr) {
    bcr.className = tab === 'create' ? 'btn btn-primary' : 'btn btn-outline';
  }
  if (tab === 'campaigns') renderCampaigns();
}

function handleCreateClick() {
  if (currentUser) {
    resetCreateForm();
    showTab('create');
    const phoneField = document.getElementById('c-phone');
    if (phoneField && !phoneField.value) phoneField.value = currentUser.phone;
  } else {
    openAuthModal('create');
  }
}
