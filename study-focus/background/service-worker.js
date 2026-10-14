importScripts('../shared/core.js');

let q = Promise.resolve();
const run = fn => { const p = q.then(fn); q = p.catch(() => {}); return p; };
const save = o => chrome.storage.local.set(o);

async function _addDay(delta) {
  const S = await SF.get(), k = SF.dayKey(), d = S.stats.days[k] || { ms: 0, poms: 0, attempts: 0 };
  for (const x in delta) d[x] = (d[x] || 0) + delta[x];
  S.stats.days[k] = d; await save({ stats: S.stats });
}
async function bank(t) {
  if (t.phase === 'study' && t.running) {
    const n = Math.min(Date.now(), t.endsAt);
    if (n > t.lastTick) await _addDay({ ms: n - t.lastTick });
    t.lastTick = n;
  }
}
async function setTimer(t) {
  await save({ timer: t });
  chrome.alarms.clear('comeback');
  if (t.running) chrome.alarms.create('end', { when: t.endsAt }); else chrome.alarms.clear('end');
  chrome.action.setBadgeBackgroundColor({ color: '#8c2347' });
  chrome.action.setBadgeText({ text: SF.focusActive(t) ? 'ON' : '' });
}
async function notify(titleKey, msgKey, kind) {
  const S = await SF.get(); SF.setLang(S.settings.lang);
  if (!S.settings.notif[kind]) return;
  chrome.notifications.create({ type: 'basic', iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'), title: SF.tr(titleKey), message: SF.tr(msgKey) });
}
async function start(o) {
  const S = await SF.get();
  if (SF.locked(S)) return { error: 'strict' };
  await bank(S.timer);
  const now = Date.now(), ms = Math.round(o.study * 60000), focus = o.focus === undefined ? S.settings.autoBlock : !!o.focus;
  await setTimer({ ...SF.DEF.timer, phase: 'study', running: true, totalMs: ms, remainingMs: ms, endsAt: now + ms, lastTick: now,
    focus, strict: focus && S.settings.strict, brkMin: o.brk || 0, taskId: S.currentTaskId });
  return { ok: true };
}
async function pause() {
  const S = await SF.get(), t = S.timer;
  if (SF.locked(S)) return { error: 'strict' };
  if (!t.running) return {};
  await bank(t); t.remainingMs = Math.max(0, t.endsAt - Date.now()); t.running = false;
  await setTimer(t);
  if (t.phase === 'study' && S.settings.notif.comeback) chrome.alarms.create('comeback', { delayInMinutes: 10 });
  return { ok: true };
}
async function resume() {
  const t = (await SF.get()).timer;
  if (t.running || t.phase === 'idle') return {};
  const now = Date.now(); t.running = true; t.endsAt = now + t.remainingMs; t.lastTick = now;
  await setTimer(t); return { ok: true };
}
async function reset() {
  const S = await SF.get();
  if (SF.locked(S)) return { error: 'strict' };
  await bank(S.timer); await setTimer({ ...SF.DEF.timer }); return { ok: true };
}
async function settle() {
  const S = await SF.get(), t = S.timer;
  if (!t.running || Date.now() < t.endsAt) return;
  const now = Date.now();
  if (t.phase === 'study') {
    await bank(t); await _addDay({ poms: 1 });
    if (t.taskId) { const tk = S.tasks.find(x => x.id === t.taskId); if (tk) { tk.pomodoros = (tk.pomodoros || 0) + 1; await save({ tasks: S.tasks }); } }
    notify('Great job! You completed a study session.', 'Break time starts now.', 'end');
    if (t.brkMin > 0) { const b = t.brkMin * 60000;
      await setTimer({ ...SF.DEF.timer, phase: 'break', running: true, totalMs: b, remainingMs: b, endsAt: now + b, lastTick: now });
    } else await setTimer({ ...SF.DEF.timer });
  } else {
    notify('Break is over', 'Time to get back to studying.', 'breakEnd');
    await setTimer({ ...SF.DEF.timer });
  }
}
async function syncAlarms() {
  const S = await SF.get();
  if (S.settings.notif.reminder) chrome.alarms.create('reminder', { periodInMinutes: 60 }); else chrome.alarms.clear('reminder');
  chrome.action.setBadgeText({ text: SF.focusActive(S.timer) ? 'ON' : '' });
}

chrome.runtime.onMessage.addListener((m, sender, send) => {
  run(async () => {
    switch (m.type) {
      case 'start': return start(m);
      case 'pause': return pause();
      case 'resume': return resume();
      case 'reset': return reset();
      case 'settle': return settle();
      case 'attempt': return _addDay({ attempts: 1 });
      case 'back': if (sender.tab) chrome.tabs.update(sender.tab.id, { url: chrome.runtime.getURL('dashboard/dashboard.html') }); return {};
    }
  }).then(r => send(r || {}), () => send({}));
  return true;
});
chrome.alarms.onAlarm.addListener(a => run(async () => {
  if (a.name === 'end') return settle();
  const t = (await SF.get()).timer;
  if (a.name === 'comeback' && !t.running && t.phase === 'study') return notify('Come back', 'Your session is paused. Ready to continue?', 'comeback');
  if (a.name === 'reminder' && !t.running) return notify('Time to study', 'Ready for a focus session?', 'reminder');
}));
chrome.storage.onChanged.addListener(c => { if (c.settings) run(syncAlarms); });
chrome.runtime.onInstalled.addListener(() => run(async () => { await syncAlarms(); await settle(); }));
chrome.runtime.onStartup.addListener(() => run(async () => { await syncAlarms(); await settle(); }));

// Website Blocker: only while a Focus Mode session is running.
chrome.webNavigation.onBeforeNavigate.addListener(d => run(async () => {
  if (d.frameId !== 0) return;
  let u; try { u = new URL(d.url); } catch { return; }
  if (!/^https?:$/.test(u.protocol)) return;
  const S = await SF.get();
  if (!SF.focusActive(S.timer)) return;
  const host = u.hostname.replace(/^www\./, '');
  const dom = SF.hostMatch(host, S.settings.blockedSites);
  if (!dom || SF.hostMatch(host, S.settings.excludedSites)) return;
  if ((S.bypass['site:' + dom] || 0) > Date.now()) return;
  await _addDay({ attempts: 1 });
  chrome.tabs.update(d.tabId, { url: chrome.runtime.getURL('blocked/blocked.html') + '?u=' + encodeURIComponent(d.url) });
}), { url: [{ schemes: ['http', 'https'] }] });
