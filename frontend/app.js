const API = '/api';
let token = sessionStorage.getItem('lifelink_token') || '';
let currentUser = null;
const $ = (selector) => document.querySelector(selector);
const escapeText = (value) => String(value ?? '');
function showToast(message, isError = false) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.toggle('error', isError); toast.classList.add('show');
  window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3500);
}
async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
  let response;
  try { response = await fetch(`${API}${path}`, { ...options, headers }); }
  catch { throw new Error('Cannot reach the server. Make sure the backend is running.'); }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed. Please try again.');
  return payload;
}
function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
function setLoggedIn(user) {
  currentUser = user;
  $('#auth-panel').classList.add('hidden'); $('#workspace').classList.remove('hidden'); $('#logout-button').classList.remove('hidden');
  $('#welcome-name').textContent = user.full_name.split(' ')[0];
  refreshAll();
}
function setLoggedOut() {
  token = ''; currentUser = null; sessionStorage.removeItem('lifelink_token');
  $('#auth-panel').classList.remove('hidden'); $('#workspace').classList.add('hidden'); $('#logout-button').classList.add('hidden');
  $('#donor-count').textContent = 'Log in to search'; $('#donor-results').replaceChildren(empty('Log in to browse donor profiles.'));
  $('#request-results').replaceChildren(empty('Log in to view community requests.'));
}
function empty(message) { const div = document.createElement('div'); div.className = 'empty-state'; div.textContent = message; return div; }
function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
function appendText(parent, tag, className, text) { const el = node(tag, className, text); parent.append(el); return el; }
function selectAuthTab(tabName) {
  document.querySelectorAll('[data-auth-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.authTab === tabName));
  $('#login-form').classList.toggle('hidden', tabName !== 'login'); $('#register-form').classList.toggle('hidden', tabName !== 'register');
}
document.querySelectorAll('[data-auth-tab]').forEach(btn => btn.addEventListener('click', () => selectAuthTab(btn.dataset.authTab)));
$('#register-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const data = formObject(event.currentTarget);
  try { const result = await api('/auth/register', { method: 'POST', body: JSON.stringify(data) }); token = result.token; sessionStorage.setItem('lifelink_token', token); setLoggedIn(result.user); showToast('Account created. Welcome to LifeLink!'); }
  catch (err) { showToast(err.message, true); }
});
$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { const result = await api('/auth/login', { method: 'POST', body: JSON.stringify(formObject(event.currentTarget)) }); token = result.token; sessionStorage.setItem('lifelink_token', token); setLoggedIn(result.user); showToast('You are now logged in.'); }
  catch (err) { showToast(err.message, true); }
});
$('#logout-button').addEventListener('click', () => { setLoggedOut(); showToast('You have logged out.'); });
$('#donor-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = event.currentTarget; const data = formObject(form); data.available = form.elements.available.checked;
  try { await api('/donors/me', { method: 'PUT', body: JSON.stringify(data) }); showToast('Donor profile saved.'); loadDonors(); }
  catch (err) { showToast(err.message, true); }
});
$('#request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await api('/requests', { method: 'POST', body: JSON.stringify(formObject(event.currentTarget)) }); event.currentTarget.reset(); showToast('Emergency request published.'); loadRequests(); }
  catch (err) { showToast(err.message, true); }
});
$('#donor-search').addEventListener('submit', (event) => { event.preventDefault(); loadDonors(); });
$('#request-status').addEventListener('change', loadRequests);
async function loadMyDonor() {
  try {
    const { donor } = await api('/donors/me'); const form = $('#donor-form');
    if (!donor) { form.reset(); form.elements.available.checked = true; form.elements.phone.value = currentUser.phone || ''; return; }
    for (const key of ['blood_group', 'city', 'phone', 'last_donation_date']) form.elements[key].value = donor[key] || '';
    form.elements.available.checked = donor.available;
  } catch (err) { showToast(err.message, true); }
}
async function loadDonors() {
  if (!token) return;
  const form = formObject($('#donor-search')); const params = new URLSearchParams();
  if (form.blood_group) params.set('blood_group', form.blood_group); if (form.city) params.set('city', form.city);
  const results = $('#donor-results'); results.replaceChildren(empty('Loading donor profiles…'));
  try {
    const { donors } = await api(`/donors?${params.toString()}`); results.replaceChildren(); $('#donor-count').textContent = `${donors.length} donor${donors.length === 1 ? '' : 's'} found`;
    if (!donors.length) { results.append(empty('No available donors match those filters. Try another blood group or city.')); return; }
    donors.forEach(donor => {
      const card = node('article', 'donor-card'); const head = node('div', 'donor-card-head');
      appendText(head, 'div', 'avatar', donor.full_name.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase());
      const identity = node('div'); appendText(identity, 'h3', '', donor.full_name); appendText(identity, 'div', 'subtext', donor.city); head.append(identity); appendText(head, 'span', 'blood-badge', donor.blood_group); card.append(head);
      appendText(card, 'div', 'availability', 'Available to donate');
      if (donor.last_donation_date) appendText(card, 'p', 'subtext', `Last donation: ${donor.last_donation_date}`);
      appendText(card, 'p', 'subtext', 'Contact the person through the community or hospital to confirm availability.'); results.append(card);
    });
  } catch (err) { results.replaceChildren(empty(err.message)); $('#donor-count').textContent = 'Could not load'; }
}
async function loadRequests() {
  if (!token) return;
  const status = $('#request-status').value; const results = $('#request-results'); results.replaceChildren(empty('Loading emergency requests…'));
  try {
    const params = new URLSearchParams(); if (status) params.set('status', status);
    const { requests } = await api(`/requests?${params.toString()}`); results.replaceChildren();
    if (!requests.length) { results.append(empty('There are no requests in this category right now.')); return; }
    requests.forEach(request => {
      const card = node('article', 'request-card'); const main = node('div');
      appendText(main, 'h3', '', `${request.blood_group} blood needed · ${request.patient_name}`);
      const meta = node('div', 'request-meta');
      [['Hospital', request.hospital], ['City', request.city], ['Units', request.units_needed], ['Needed by', new Date(request.needed_by).toLocaleString()], ['Posted by', request.requester_name], ['Contact', request.contact_phone]].forEach(([label, value]) => { const span = node('span'); const strong = node('strong', '', `${label}: `); span.append(strong, document.createTextNode(escapeText(value))); meta.append(span); });
      main.append(meta); if (request.notes) appendText(main, 'p', 'request-notes', request.notes); card.append(main);
      const side = node('div', 'request-side'); appendText(side, 'span', `status-badge ${request.status}`, request.status);
      if (request.requester_id === currentUser.id && request.status === 'open') {
        const actions = node('div', 'request-actions');
        [['fulfilled', 'Mark fulfilled'], ['cancelled', 'Cancel']].forEach(([statusValue, label]) => { const btn = node('button', 'small-button', label); btn.type = 'button'; btn.addEventListener('click', async () => { if (!window.confirm(`Are you sure you want to mark this request ${statusValue}?`)) return; try { await api(`/requests/${request.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: statusValue }) }); showToast('Request updated.'); loadRequests(); } catch (err) { showToast(err.message, true); } }); actions.append(btn); }); side.append(actions);
      }
      card.append(side); results.append(card);
    });
  } catch (err) { results.replaceChildren(empty(err.message)); }
}
async function refreshAll() { await Promise.all([loadMyDonor(), loadDonors(), loadRequests()]); }
async function restoreSession() {
  if (!token) { setLoggedOut(); return; }
  try {
    // A protected endpoint validates the saved token. Donor profile can be empty for a new user.
    await api('/donors/me');
    const parts = token.split('.'); const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    setLoggedIn({ id: payload.id, full_name: payload.name, email: payload.email });
  } catch { setLoggedOut(); }
}
restoreSession();
