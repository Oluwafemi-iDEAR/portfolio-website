/* =====================================================================
   Showcase Dashboard
   Password-gated admin UI to choose which repos (public + private) appear
   in the project showcase carousel, and in what order. Talks to /api/admin.
   ===================================================================== */
(function initDashboard() {
  const SESSION_KEY = 'showcase-admin-secret';

  const gate = document.getElementById('gate');
  const gateForm = document.getElementById('gate-form');
  const gateError = document.getElementById('gate-error');
  const passwordInput = document.getElementById('password');

  const board = document.getElementById('board');
  const list = document.getElementById('repo-list');
  const saveBtn = document.getElementById('save-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const saveStatus = document.getElementById('save-status');
  const countEnabled = document.getElementById('count-enabled');
  const countTotal = document.getElementById('count-total');

  let secret = '';
  let items = []; // [{ name, isPrivate, homepage, description, language, enabled }]
  let overrides = {}; // passed through unchanged

  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  function authHeader() {
    return { Authorization: 'Bearer ' + secret };
  }

  // ---- Auth / load --------------------------------------------------
  async function loadRepos() {
    const res = await fetch('/api/admin', { headers: authHeader() });
    if (res.status === 401) {
      throw new Error('unauthorized');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Request failed (' + res.status + ')');
    }
    const data = await res.json();
    items = data.items || [];
    overrides = data.overrides || {};
  }

  function showGateError(msg) {
    gateError.textContent = msg;
    gateError.hidden = false;
  }

  async function unlock(candidate) {
    secret = candidate;
    try {
      await loadRepos();
      sessionStorage.setItem(SESSION_KEY, secret);
      gate.hidden = true;
      board.hidden = false;
      render();
    } catch (err) {
      secret = '';
      sessionStorage.removeItem(SESSION_KEY);
      if (err.message === 'unauthorized') {
        showGateError('Incorrect password.');
      } else {
        showGateError(err.message || 'Could not reach the server.');
      }
    }
  }

  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    gateError.hidden = true;
    const val = passwordInput.value.trim();
    if (val) unlock(val);
  });

  // ---- Rendering ----------------------------------------------------
  function render() {
    list.innerHTML = '';

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'repo-item' + (item.enabled ? ' is-enabled' : '');

      const hasLive = Boolean(item.homepage);
      const visibility = item.isPrivate ? 'Private' : 'Public';
      const linkNote = item.isPrivate
        ? hasLive
          ? 'Links to landing page'
          : 'Links to contact page'
        : hasLive
        ? 'Links to landing page'
        : 'Links to GitHub';

      li.innerHTML =
        '<div class="repo-order">' +
        '<button class="ord-btn" data-move="up" aria-label="Move up"' +
        (index === 0 ? ' disabled' : '') +
        '>&#9650;</button>' +
        '<button class="ord-btn" data-move="down" aria-label="Move down"' +
        (index === items.length - 1 ? ' disabled' : '') +
        '>&#9660;</button>' +
        '</div>' +
        '<div class="repo-main">' +
        '<div class="repo-title">' +
        '<strong>' +
        esc(item.name) +
        '</strong>' +
        '<span class="tag ' +
        (item.isPrivate ? 'tag-private' : 'tag-public') +
        '">' +
        visibility +
        '</span>' +
        (hasLive ? '<span class="tag tag-live">Has URL</span>' : '') +
        '</div>' +
        '<div class="repo-meta">' +
        esc(item.description || 'No description on GitHub') +
        '</div>' +
        '<div class="repo-note">' +
        esc(linkNote) +
        (hasLive ? ' · ' + esc(item.homepage) : '') +
        '</div>' +
        '</div>' +
        '<label class="switch" title="Show in carousel">' +
        '<input type="checkbox"' +
        (item.enabled ? ' checked' : '') +
        ' />' +
        '<span class="slider"></span>' +
        '</label>';

      // Toggle
      li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
        item.enabled = e.target.checked;
        li.classList.toggle('is-enabled', item.enabled);
        updateCounts();
        markDirty();
      });

      // Reorder
      li.querySelectorAll('.ord-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const dir = btn.dataset.move === 'up' ? -1 : 1;
          const target = index + dir;
          if (target < 0 || target >= items.length) return;
          const tmp = items[index];
          items[index] = items[target];
          items[target] = tmp;
          render();
          markDirty();
        });
      });

      list.appendChild(li);
    });

    updateCounts();
  }

  function updateCounts() {
    const enabled = items.filter((i) => i.enabled).length;
    countEnabled.textContent = enabled + (enabled === 1 ? ' shown' : ' shown');
    countTotal.textContent = items.length + ' repos';
  }

  let dirty = false;
  function markDirty() {
    dirty = true;
    saveStatus.textContent = 'Unsaved changes';
    saveStatus.className = 'save-status dirty';
  }

  // ---- Save ---------------------------------------------------------
  async function save() {
    const order = items.filter((i) => i.enabled).map((i) => i.name);
    saveBtn.disabled = true;
    saveStatus.textContent = 'Saving…';
    saveStatus.className = 'save-status';
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
        body: JSON.stringify({ order, overrides })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed (' + res.status + ')');
      }
      dirty = false;
      saveStatus.textContent = 'Saved · live in ~30s';
      saveStatus.className = 'save-status saved';
    } catch (err) {
      saveStatus.textContent = err.message || 'Save failed';
      saveStatus.className = 'save-status dirty';
    } finally {
      saveBtn.disabled = false;
    }
  }

  saveBtn.addEventListener('click', save);
  refreshBtn.addEventListener('click', async () => {
    saveStatus.textContent = 'Refreshing…';
    try {
      await loadRepos();
      render();
      saveStatus.textContent = '';
    } catch (err) {
      saveStatus.textContent = 'Refresh failed';
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ---- Boot ---------------------------------------------------------
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) {
    passwordInput.value = saved;
    unlock(saved);
  }
})();
