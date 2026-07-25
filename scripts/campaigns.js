// =====================================================================
// campaigns.js
// Contient : la gestion de l'image de campagne, l'affichage (render),
// la création de campagne, le flux de don, la simulation de paiement
// YengaPay, le reversement (payout), le détail d'une campagne,
// ainsi que l'initialisation de l'application.
// Dépend de core.js (doit être chargé avant ce fichier).
// =====================================================================

// galerie d'image
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) { clearImage(); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    pendingImageData = e.target.result;
    const img = document.getElementById('c-image-preview');
    img.src = pendingImageData;
    img.style.display = 'block';
    document.getElementById('c-image-remove').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  pendingImageData = null;
  const preview = document.getElementById('c-image-preview');
  preview.style.display = 'none';
  preview.src = '';
  document.getElementById('c-image-remove').style.display = 'none';
  const fileInput = document.getElementById('c-image-file');
  if (fileInput) fileInput.value = '';
}

function resetCreateForm() {
  clearImage();
  document.getElementById('create-form').reset();
  document.querySelectorAll('.money-input').forEach(inp => {
    inp.value = '';
    inp.setAttribute('data-raw', '');
  });
  clearFieldError('c-goal');
  clearFieldError('c-phone');
}

// afficher
function renderCampaigns() {
  const container = document.getElementById('campaigns-list');
  const empty = document.getElementById('no-campaigns');
  if (campaigns.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  container.innerHTML = campaigns.map(c => {
    const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
    const recent = c.donations.slice(-3).reverse();
    const canPayout = c.raised >= 100 && isOwner(c);
    const ownerLabel = isOwner(c) ? '<span style="background:#e8f5e9; color:#238636; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; margin-left:6px;">VOTRE CAMPAGNE</span>' : '';
    return `
      <div class="campaign-card">
        <div class="campaign-image-wrap">
          <img src="${c.image || DEFAULT_IMAGE}" class="campaign-image" onerror="this.src='${DEFAULT_IMAGE}'">
          <div class="campaign-badge">${c.donations.length} don${c.donations.length > 1 ? 's' : ''}</div>
          ${canPayout ? `<button class="campaign-payout-btn" onclick="event.stopPropagation(); openPayout(${c.id})">💸 Payout</button>` : ''}
        </div>
        <div class="campaign-body">
          <div class="campaign-title-row">
            <h3 class="campaign-title">${c.title}${ownerLabel}</h3>
            <span class="campaign-date">${timeAgo(c.createdAt)}</span>
          </div>
          <p class="campaign-desc">${c.desc}</p>

          <div class="progress-bar-wrap">
            <div class="progress-bar-top">
              <span class="progress-bar-raised">${formatMoney(c.raised)}</span>
              <span class="progress-bar-goal">sur ${formatMoney(c.goal)}</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="progress-bar-pct">${pct}% atteint</div>
          </div>

          <div class="donation-tags">
            ${recent.map(d => `
              <span class="donation-tag">${d.anonymous ? '🎭 Anonyme' : '👤 ' + d.name.split(' ')[0]} · ${formatMoney(d.amount)} · ${d.operator}</span>
            `).join('')}
            ${c.donations.length > 3 ? `<span class="donation-tag" style="color:#888;">+${c.donations.length - 3} autres</span>` : ''}
          </div>

          <div class="campaign-actions">
            <button onclick="openDonate(${c.id})" class="btn btn-purple">❤️ Faire un don</button>
            <button onclick="showDetail(${c.id})" class="btn btn-outline">📄 Détails</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// creer une campagne (réservé aux utilisateurs connectés) 
function createCampaign(e) {
  e.preventDefault();
  if (!currentUser) {
    showToast('⛔ Veuillez vous connecter pour créer une campagne');
    openAuthModal('create');
    return;
  }
  clearFieldError('c-goal');
  clearFieldError('c-phone');

  const phone = document.getElementById('c-phone').value.trim();
  const goal = getMoneyValue('c-goal');
  let hasError = false;

  if (!goal || goal < 100) {
    showFieldError('c-goal', "L'objectif minimum est de 100 XOF");
    hasError = true;
  }
  if (!phone || phone.length < 8) {
    showFieldError('c-phone', 'Veuillez entrer un numéro valide');
    hasError = true;
  }
  if (hasError) return;

  campaigns.unshift({
    id: nextId++,
    title: document.getElementById('c-title').value.trim(),
    desc: document.getElementById('c-desc').value.trim(),
    goal: goal,
    raised: 0,
    author: document.getElementById('c-author').value.trim(),
    authorPhone: phone,
    authorOperator: document.getElementById('c-operator').value,
    image: pendingImageData || DEFAULT_IMAGE,
    createdAt: Date.now(),
    donations: []
  });
  save();
  resetCreateForm();
  showToast('🎉 Campagne créée avec succès !');
  showTab('campaigns');
}

// faire un don  (libre, sans connexion) 
function openDonate(id) {
  const c = campaigns.find(x => x.id === id);
  if (!c) return;
  simState = { campaignId: id };
  document.getElementById('donate-campaign-name').textContent = 'Campagne : ' + c.title;

  document.getElementById('don-step-1').style.display = 'block';
  document.getElementById('don-step-2').style.display = 'none';
  document.getElementById('don-step-3').style.display = 'none';
  document.getElementById('sim-otp-section').style.display = 'none';
  document.getElementById('sim-onestep-section').style.display = 'none';
  document.getElementById('donate-modal').classList.add('active');

  document.getElementById('d-amount').value = '';
  document.getElementById('d-amount').setAttribute('data-raw', '');
  document.getElementById('d-phone').value = '';
  document.getElementById('d-name').value = '';
  document.getElementById('d-anonymous').checked = false;
  clearFieldError('d-amount');
  clearFieldError('d-phone');
  selectOp(document.querySelector('[data-op="ORANGE"]'), 'ORANGE');
}

function closeDonate() {
  document.getElementById('donate-modal').classList.remove('active');
  simState = {};
}

function selectOp(el, op) {
  document.querySelectorAll('.op-card').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('d-operator').value = op;
}

// simulation de paiement
async function startPaymentSimulation() {
  clearFieldError('d-amount');
  clearFieldError('d-phone');

  const amount = getMoneyValue('d-amount');
  const phone = document.getElementById('d-phone').value.trim();
  const operator = document.getElementById('d-operator').value;
  const name = document.getElementById('d-name').value.trim();
  const anonymous = document.getElementById('d-anonymous').checked;
  let hasError = false;

  if (!amount || amount < 100) {
    showFieldError('d-amount', 'Le montant minimum est 100 XOF');
    hasError = true;
  }
  if (!phone || phone.length < 8) {
    showFieldError('d-phone', 'Veuillez entrer un numéro valide');
    hasError = true;
  }
  if (hasError) return;

  simState = { ...simState, amount, phone, operator, name, anonymous };

  document.getElementById('don-step-1').style.display = 'none';
  document.getElementById('don-step-2').style.display = 'block';

  const anim = document.getElementById('sim-animation');
  const text = document.getElementById('sim-text');
  const sub = document.getElementById('sim-sub');

  const steps = [
    { icon: '🔗', text: 'Connexion à YengaPay...', sub: 'api.yengapay.com', delay: 800 },
    { icon: '🔐', text: 'Authentification...', sub: 'x-api-key: ****', delay: 600 },
    { icon: '💳', text: 'Initiation du paiement...', sub: formatMoney(amount) + ' · ' + operator + ' · BF', delay: 1000 },
  ];

  for (const step of steps) {
    anim.innerHTML = '<div class="sim-icon anim-pulse">' + step.icon + '</div>';
    text.textContent = step.text;
    sub.textContent = step.sub;
    await new Promise(r => setTimeout(r, step.delay));
  }

  const twoStepOps = ['MOOV', 'SANKM', 'CORISM'];

  if (twoStepOps.includes(operator)) {
    anim.innerHTML = '<div class="sim-icon">📩</div>';
    text.textContent = 'Code OTP envoyé !';
    sub.textContent = 'Vérifiez vos SMS sur le ' + phone;
    document.getElementById('sim-phone-display').textContent = phone;
    document.getElementById('sim-otp-section').style.display = 'block';
  } else {
    anim.innerHTML = '<div class="sim-icon">📱</div>';
    text.textContent = 'Validation ONE_STEP';
    sub.textContent = 'Validez sur votre téléphone';
    document.getElementById('sim-phone-display-2').textContent = phone;
    document.getElementById('sim-amount-ussd').textContent = amount;
    document.getElementById('sim-onestep-section').style.display = 'block';
  }
}

async function confirmOTP() {
  const otp = document.getElementById('sim-otp-input').value.trim();
  if (!otp || otp.length < 4) { showToast('Veuillez saisir le code OTP'); return; }

  const anim = document.getElementById('sim-animation');
  const text = document.getElementById('sim-text');
  const sub = document.getElementById('sim-sub');

  document.getElementById('sim-otp-section').style.display = 'none';
  anim.innerHTML = '<div class="sim-icon anim-spin">⏳</div>';
  text.textContent = 'Validation du paiement...';
  sub.textContent = 'POST /direct-payment/pay · OTP: ' + otp;

  await new Promise(r => setTimeout(r, 1200));
  finishPayment();
}

async function confirmOneStep() {
  const anim = document.getElementById('sim-animation');
  const text = document.getElementById('sim-text');
  const sub = document.getElementById('sim-sub');

  document.getElementById('sim-onestep-section').style.display = 'none';
  anim.innerHTML = '<div class="sim-icon anim-spin">⏳</div>';
  text.textContent = 'Traitement ONE_STEP...';
  sub.textContent = 'Validation côté opérateur en cours';

  await new Promise(r => setTimeout(r, 1200));
  finishPayment();
}

function finishPayment() {
  const { amount, phone, operator, name, anonymous, campaignId } = simState;
  const fees = Math.round(amount * 0.025);
  const txId = 'YP' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.' + String(Math.floor(Math.random()*1000)).padStart(3,'0') + '.' + String(Math.floor(Math.random()*100000000)).padStart(8,'0');

  const c = campaigns.find(x => x.id === campaignId);
  if (c) {
    c.donations.push({
      name: anonymous ? '' : (name || 'Donateur'),
      amount, anonymous, date: Date.now(), operator, txId
    });
    c.raised += amount;
    save();
  }

  document.getElementById('don-step-2').style.display = 'none';
  document.getElementById('don-step-3').style.display = 'block';
  document.getElementById('success-tx-id').textContent = txId;
  document.getElementById('success-amount').textContent = formatMoney(amount);
  document.getElementById('success-fees').textContent = formatMoney(fees);

  renderCampaigns();
}

// retrait
function openPayout(id) {
  const c = campaigns.find(x => x.id === id);
  if (!c || c.raised < 100) return;
  if (!isOwner(c)) {
    showToast('⛔ Seul le créateur de la campagne peut demander un reversement');
    return;
  }
  simState = { ...simState, payoutCampaignId: id };

  const commission = Math.round(c.raised * 0.05);
  const afterCommission = c.raised - commission;
  const fees = Math.round(afterCommission * 0.015);
  const net = afterCommission - fees;

  document.getElementById('payout-campaign-name').textContent = c.title;
  document.getElementById('p-raised').textContent = formatMoney(c.raised);
  document.getElementById('p-commission').textContent = formatMoney(commission);
  document.getElementById('p-fees').textContent = formatMoney(fees);
  document.getElementById('p-net').textContent = formatMoney(net);
  document.getElementById('p-dest-name').textContent = c.author;
  document.getElementById('p-dest-phone').textContent = '+' + c.authorPhone;
  document.getElementById('p-dest-op').textContent = c.authorOperator.replace('_', ' ');

  document.getElementById('payout-modal').classList.add('active');
}

function closePayout() {
  document.getElementById('payout-modal').classList.remove('active');
}

async function executePayoutSimulation() {
  const c = campaigns.find(x => x.id === simState.payoutCampaignId);
  if (!c) return;
  if (!isOwner(c)) {
    showToast('⛔ Seul le créateur de la campagne peut demander un reversement');
    closePayout();
    return;
  }

  closePayout();
  showToast('⏳ Traitement du reversement...');
  await new Promise(r => setTimeout(r, 1500));

  const payoutId = 'YPPO' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.' + String(Math.floor(Math.random()*1000)).padStart(3,'0') + '.' + String(Math.floor(Math.random()*10000)).padStart(4,'0') + '.' + String(Math.floor(Math.random()*10000)).padStart(4,'0');

  document.getElementById('payout-success-id').textContent = payoutId;
  document.getElementById('payout-success-modal').classList.add('active');

  c.raised = 0;
  save();
  renderCampaigns();
}

//  afficher les details d'une campagne
function showDetail(id) {
  const c = campaigns.find(x => x.id === id);
  if (!c) return;
  const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
  const allDonations = [...c.donations].sort((a, b) => b.date - a.date);
  const ownerBadge = isOwner(c) ? '<span style="background:#e8f5e9; color:#238636; padding:3px 10px; border-radius:10px; font-size:11px; font-weight:700; margin-left:8px;">VOTRE CAMPAGNE</span>' : '';

  document.getElementById('detail-content').innerHTML = `
    <img src="${c.image || DEFAULT_IMAGE}" class="detail-image" onerror="this.src='${DEFAULT_IMAGE}'">
    <div class="detail-body">
      <h2 class="detail-title">${c.title}${ownerBadge}</h2>
      <p class="detail-meta">Par <strong>${c.author}</strong> · 📱 +${c.authorPhone} · ${c.authorOperator.replace('_', ' ')}</p>
      <p class="detail-desc">${c.desc}</p>

      <div class="detail-progress">
        <div class="detail-progress-top">
          <div>
            <div class="detail-progress-amount">${formatMoney(c.raised)}</div>
            <div class="detail-progress-amount-label">collectés sur ${formatMoney(c.goal)}</div>
          </div>
          <div class="detail-progress-pct">
            <div class="detail-progress-pct-value">${pct}%</div>
            <div class="detail-progress-pct-label">de l'objectif</div>
          </div>
        </div>
        <div class="detail-progress-track">
          <div class="detail-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <h3 class="detail-donations-title">📜 Historique des dons (${c.donations.length})</h3>
      <div class="detail-donation-list">
        ${allDonations.length === 0 ? '<p style="color:#888; font-size:13px; text-align:center; padding:20px;">Aucun don pour le moment. Soyez le premier !</p>' : ''}
        ${allDonations.map(d => `
          <div class="detail-donation-item ${d.anonymous ? 'anon' : ''}">
            <div class="detail-donation-left">
              <div class="detail-donation-avatar ${d.anonymous ? 'anon' : ''}">${d.anonymous ? '🎭' : d.name.charAt(0).toUpperCase()}</div>
              <div>
                <div class="detail-donation-name">${d.anonymous ? 'Anonyme' : d.name}</div>
                <div class="detail-donation-meta">${timeAgo(d.date)} · ${d.operator} · ${d.txId ? d.txId.slice(0,20)+'...' : ''}</div>
              </div>
            </div>
            <div class="detail-donation-amount">${formatMoney(d.amount)}</div>
          </div>
        `).join('')}
      </div>

      <button onclick="closeDetail(); openDonate(${c.id});" class="btn btn-purple" style="width:100%; margin-top:20px; padding:14px; font-size:15px;">❤️ Faire un don à cette campagne</button>
    </div>
  `;
  document.getElementById('detail-modal').classList.add('active');
}

function closeDetail() {
  document.getElementById('detail-modal').classList.remove('active');
}

renderAuthBar();
renderCampaigns();
setupMoneyInputs();

document.getElementById('donate-modal').addEventListener('click', function(e) { if (e.target === this) closeDonate(); });
document.getElementById('detail-modal').addEventListener('click', function(e) { if (e.target === this) closeDetail(); });
document.getElementById('payout-modal').addEventListener('click', function(e) { if (e.target === this) closePayout(); });
document.getElementById('payout-success-modal').addEventListener('click', function(e) { if (e.target === this) document.getElementById('payout-success-modal').classList.remove('active'); });
document.getElementById('auth-modal').addEventListener('click', function(e) { if (e.target === this) closeAuthModal(); });
