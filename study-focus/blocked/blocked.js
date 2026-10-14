(async () => {
  const $ = id => document.getElementById(id);
  let S = await SF.get(); SF.applyPrefs(S.settings);
  let u = null; try { u = new URL(new URLSearchParams(location.search).get('u')); if (!/^https?:$/.test(u.protocol)) u = null; } catch { u = null; }
  const host = u ? u.hostname.replace(/^www\./, '') : '', dom = u ? (SF.hostMatch(host, S.settings.blockedSites) || host) : '';
  $('host').textContent = host;
  $('back').onclick = () => { location.href = chrome.runtime.getURL('dashboard/dashboard.html'); };
  const lock = SF.locked(S);
  if (u && S.settings.allowOverride && !lock) {
    $('go').hidden = false; $('go').textContent = SF.tr('Open for {n} min', { n: S.settings.bypassMinutes });
    $('go').onclick = async () => {
      const b = (await chrome.storage.local.get('bypass')).bypass || {};
      b['site:' + dom] = Date.now() + S.settings.bypassMinutes * 60000;
      await chrome.storage.local.set({ bypass: b }); location.href = u.href;
    };
  }
  const tick = async () => { S = await SF.get(); $('left').textContent = SF.focusActive(S.timer) ? '⏱ ' + SF.fmt(SF.remaining(S.timer), true) : ''; };
  tick(); setInterval(tick, 1000);
})();
