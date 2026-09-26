const API = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-1.13.0';
const CHUNK = 100; // ponytail: max questions per request is undocumented; lower this if the API rejects big batches
const HIDE_PREFIX = 'Hidden · ';
const COLORS = ['blue', 'green', 'purple', 'cyan', 'orange', 'pink', 'yellow', 'red'];

const $ = (id) => document.getElementById(id);
const ids = (tabs) => tabs.map((t) => t.id);
const S = { tabs: [], scores: {}, override: {}, scanned: '', armed: false, busy: false };
const cfg = await chrome.storage.local.get({ key: '', topic: '', scope: 'window', threshold: 0.5, recent: [], undo: [] });
const save = (patch) => { Object.assign(cfg, patch); chrome.storage.local.set(patch); };
const closeBtn = document.querySelector('[data-action=close]');
const closeHtml = closeBtn.innerHTML;

$('key').value = cfg.key;
$('topic').value = cfg.topic;
$('threshold').value = cfg.threshold;
$('undo').hidden = !cfg.undo.length;
if (!cfg.key) $('settings').open = true;
renderScope(); renderRecent(); renderThreshold(); renderList();
$('topic').focus();

// ---------- events ----------

$('key').addEventListener('change', () => save({ key: $('key').value.trim() }));
$('topic').addEventListener('input', () => { disarm(); save({ topic: $('topic').value }); });
$('topic').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guard(scan); }
});
$('threshold').addEventListener('input', () => {
  save({ threshold: +$('threshold').value }); disarm(); renderThreshold(); renderList();
});
$('scope').addEventListener('click', (e) => {
  const scope = e.target.closest('button')?.dataset.scope;
  if (!scope) return;
  save({ scope }); disarm(); renderScope();
  if (S.scanned) guard(scan);
});
document.querySelectorAll('[data-action]').forEach((b) =>
  b.addEventListener('click', () => guard(ACTIONS[b.dataset.action])));
$('preview').addEventListener('click', () => guard(scan));
$('restore').addEventListener('click', () => guard(async () => {
  const n = await restoreHidden();
  status(n ? `Showing ${n} hidden tabs again.` : 'No hidden tabs.');
  if (S.scanned) await scan();
}));
$('undo').addEventListener('click', () => guard(undoClose));
$('clearCache').addEventListener('click', async () => {
  await chrome.storage.session.clear();
  S.scanned = ''; S.override = {}; renderList();
  status('Score cache cleared.');
});

async function guard(fn) {
  if (S.busy) return;
  S.busy = true; document.body.classList.add('busy');
  try { await fn(); } catch (e) { status(e.message, 'error'); }
  finally { S.busy = false; document.body.classList.remove('busy'); }
}

// ---------- scoring ----------

async function scan() {
  const topic = $('topic').value.trim();
  if (!cfg.key) { $('settings').open = true; $('key').focus(); throw new Error('Add your Jev API key first.'); }
  if (!topic) { $('topic').focus(); throw new Error('Type a theme first.'); }

  const query = { windowType: 'normal', ...(cfg.scope === 'window' && { currentWindow: true }) };
  S.tabs = (await chrome.tabs.query(query)).filter((t) => !t.pinned);

  const ck = 'scores:' + topic.toLowerCase();
  const cache = (await chrome.storage.session.get(ck))[ck] || {};
  const missing = S.tabs.filter((t) => !(t.url in cache));
  if (missing.length) {
    status(`Asking Jev about ${missing.length} tab${missing.length === 1 ? '' : 's'}…`);
    const scores = await askJev(topic, missing);
    missing.forEach((t, i) => (cache[t.url] = scores[i]));
    await chrome.storage.session.set({ [ck]: cache });
    status('');
  }

  if (S.scanned !== topic) S.override = {};
  S.scanned = topic;
  S.scores = Object.fromEntries(S.tabs.map((t) => [t.id, cache[t.url]]));
  save({ recent: [topic, ...cfg.recent.filter((r) => r !== topic)].slice(0, 8) });
  renderRecent(); renderList();
}

async function askJev(topic, tabs) {
  const chunks = [];
  for (let i = 0; i < tabs.length; i += CHUNK) chunks.push(tabs.slice(i, i + CHUNK));
  const results = await Promise.all(chunks.map(async (batch) => {
    const questions = Object.fromEntries(batch.map((t, j) => ['t' + j, {
      type: 'noul',
      instructions: `Is this browser tab related to the user's theme?\nTitle: ${t.title}\nURL: ${t.url}`,
      criteria: { true: 'The tab is useful for or about the theme', false: 'The tab is unrelated to the theme' },
    }]));
    const res = await fetch(API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, state: `User's theme: ${topic}`, questions }),
    });
    if (!res.ok) throw new Error(apiError(res.status, await res.text()));
    const { answers } = await res.json();
    return batch.map((_, j) => answers['t' + j]?.noul ?? 1); // missing answer = treat as matching, never act on it
  }));
  return results.flat();
}

function apiError(code, body) {
  return {
    401: 'Jev rejected the API key (401). Check Settings.',
    429: 'Jev rate limit hit (429). Try again in a moment.',
    529: 'Jev is overloaded (529). Try again shortly.',
  }[code] || `Jev API error ${code}: ${body.slice(0, 160)}`;
}

const matches = (t) => S.override[t.id] ?? S.scores[t.id] >= cfg.threshold;

function split() {
  const on = S.tabs.filter(matches);
  const off = S.tabs.filter((t) => !matches(t));
  return { on, off, rest: off.filter((t) => !t.active) }; // hide/close never touch the tab you're looking at
}

// ---------- actions ----------

const ACTIONS = {
  async group() {
    await scan();
    const { on } = split();
    if (!on.length) return status('No tabs match.');
    const win = await chrome.windows.getCurrent();
    const groupId = await chrome.tabs.group({ tabIds: ids(on), createProperties: { windowId: win.id } });
    await chrome.tabGroups.update(groupId, { title: S.scanned.slice(0, 40), color: colorFor(S.scanned), collapsed: false });
    status(`Grouped ${on.length} matching tabs.`);
    await scan();
  },

  async window() {
    await scan();
    const { on } = split();
    if (!on.length) return status('No tabs match.');
    const w = await chrome.windows.create({ tabId: on[0].id, focused: false });
    if (on.length > 1) await chrome.tabs.move(ids(on.slice(1)), { windowId: w.id, index: -1 });
    await chrome.windows.update(w.id, { focused: true });
  },

  async hide() {
    await restoreHidden();
    await scan();
    const { rest } = split();
    if (!rest.length) return status('Nothing to hide. Every tab matches.');
    for (const [windowId, tabs] of Map.groupBy(rest, (t) => t.windowId)) {
      const groupId = await chrome.tabs.group({ tabIds: ids(tabs), createProperties: { windowId } });
      await chrome.tabGroups.update(groupId, { title: HIDE_PREFIX + S.scanned.slice(0, 30), color: 'grey', collapsed: true });
    }
    status(`Hid ${rest.length} tabs. "Show hidden tabs" brings them back.`);
  },

  async close() {
    await scan();
    const { rest } = split();
    if (!rest.length) { disarm(); return status('Nothing to close. Every tab matches.'); }
    const armKey = ids(rest).join();
    if (S.armed !== armKey) { // re-confirm if the set of tabs changed since the first click
      S.armed = armKey;
      closeBtn.classList.add('armed');
      closeBtn.innerHTML = `<b>Confirm</b><small>close ${rest.length}</small>`;
      return status(`Check "Other tabs" below, then click Confirm to close ${rest.length} tabs.`, 'warn');
    }
    disarm();
    await chrome.tabs.remove(ids(rest));
    const recent = await chrome.sessions.getRecentlyClosed({ maxResults: chrome.sessions.MAX_SESSION_RESULTS });
    save({ undo: recent.filter((s) => s.tab).slice(0, rest.length).map((s) => s.tab.sessionId) });
    $('undo').hidden = false;
    const cap = rest.length > cfg.undo.length ? ` Undo can reopen the last ${cfg.undo.length}.` : '';
    status(`Closed ${rest.length} tabs.${cap}`);
    await scan();
  },
};

function disarm() {
  if (!S.armed) return;
  S.armed = false;
  closeBtn.classList.remove('armed');
  closeBtn.innerHTML = closeHtml;
}

async function restoreHidden() {
  const where = cfg.scope === 'window' ? { windowId: chrome.windows.WINDOW_ID_CURRENT } : {};
  const groups = (await chrome.tabGroups.query(where)).filter((g) => g.title?.startsWith(HIDE_PREFIX));
  let n = 0;
  for (const g of groups) {
    const tabs = await chrome.tabs.query({ groupId: g.id });
    n += tabs.length;
    await chrome.tabs.ungroup(ids(tabs));
  }
  return n;
}

async function undoClose() {
  for (const id of cfg.undo) await chrome.sessions.restore(id).catch(() => {});
  status(`Reopened ${cfg.undo.length} tabs.`);
  save({ undo: [] });
  $('undo').hidden = true;
  if (S.scanned) await scan();
}

const colorFor = (s) => COLORS[[...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % COLORS.length];

// ---------- rendering ----------

function status(msg, kind = '') {
  $('status').textContent = msg;
  $('status').className = kind;
}

function renderScope() {
  $('scope').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.scope === cfg.scope));
}

function renderThreshold() {
  $('thresholdOut').textContent = Math.round(cfg.threshold * 100) + '%';
}

function renderRecent() {
  $('recent').replaceChildren(...cfg.recent.map((topic) => {
    const b = document.createElement('button');
    b.textContent = b.title = topic;
    b.onclick = () => { $('topic').value = topic; save({ topic }); disarm(); guard(scan); };
    return b;
  }));
}

function renderList() {
  if (!S.scanned) {
    $('list').innerHTML = '<p class="empty">Type a theme, then click an action.<br>Press Enter to preview matches first.</p>';
    return;
  }
  const { on, off } = split();
  const byScore = (a, b) => S.scores[b.id] - S.scores[a.id];
  $('list').replaceChildren(
    ...section(`Matches “${S.scanned}”`, on.sort(byScore)),
    ...section('Other tabs', off.sort(byScore)),
  );
}

function section(title, tabs) {
  const h = document.createElement('h2');
  h.textContent = `${title} · ${tabs.length}`;
  return [h, ...tabs.map(row)];
}

function row(t) {
  const el = document.createElement('div');
  el.className = 'tab';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = matches(t);
  cb.setAttribute('aria-label', `Counts as matching: ${t.title}`);
  cb.onchange = () => { S.override[t.id] = cb.checked; disarm(); renderList(); };

  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(t.url)}&size=32`);
  icon.alt = '';

  const title = document.createElement('button');
  title.className = 'title';
  title.textContent = t.title || t.url;
  title.title = t.url;
  title.onclick = () => { chrome.tabs.update(t.id, { active: true }); chrome.windows.update(t.windowId, { focused: true }); };

  const score = document.createElement('span');
  score.className = 'score';
  score.style.setProperty('--p', S.scores[t.id]);
  score.textContent = Math.round(S.scores[t.id] * 100) + '%';

  el.append(cb, icon, title);
  if (t.active) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'open';
    badge.title = 'Hide and Close never touch the tab you are viewing';
    el.append(badge);
  }
  el.append(score);
  return el;
}
