const $ = id => document.getElementById(id), tr = SF.tr;
let S;
const send = async m => { const r = await chrome.runtime.sendMessage(m); if (r && r.error) alert(tr('Strict Mode is on: this session cannot be stopped.')); };
async function load() { S = await SF.get(); SF.applyPrefs(S.settings); render(); }
let settling = 0;
function render() {
  if (!S) return;
  const t = S.timer, n = Date.now();
  if (t.running && n >= t.endsAt && n - settling > 3000) { settling = n; chrome.runtime.sendMessage({ type: 'settle' }); }
  $('time').textContent = SF.fmt(t.phase === 'idle' ? S.settings.study * 60000 : SF.remaining(t, n), true);
  $('phase').textContent = t.phase === 'idle' ? tr('Ready') : tr(t.phase === 'study' ? 'Study' : 'Break');
  $('main').textContent = t.running ? '⏸ ' + tr('Pause') : t.phase !== 'idle' ? '▶ ' + tr('Resume') : '▶ ' + tr('Start Focus');
  $('main').disabled = SF.locked(S);
  $('today').textContent = SF.dur(SF.dayMs(S, SF.dayKey()));
  $('poms').textContent = (S.stats.days[SF.dayKey()] || {}).poms || 0;
  const active = SF.focusActive(t, n) || (S.settings.blockAlways && Object.values(S.settings.blocking).some(Boolean));
  $('blk').textContent = (active ? '● ' + tr('Active') : '○ ' + tr('Off')); $('blk').className = active ? 'on' : 'off';
}
$('main').onclick = () => { const t = S.timer;
  send(t.running ? { type: 'pause' } : t.phase !== 'idle' ? { type: 'resume' } : { type: 'start', study: S.settings.study, brk: S.settings.brk, focus: true }); };
$('dash').onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
$('set').onclick = () => chrome.runtime.openOptionsPage();
chrome.storage.onChanged.addListener(load);
setInterval(render, 500); load();
