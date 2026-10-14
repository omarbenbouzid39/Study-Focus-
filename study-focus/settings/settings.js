(async () => {
  let S = await SF.get(); SF.applyPrefs(S.settings); await SF.bind(document);
  const sync = async () => {
    const old = S.settings; S = await SF.get();
    if (old.lang !== S.settings.lang || old.theme !== S.settings.theme) SF.applyPrefs(S.settings);
    SF.fill(document, S); document.getElementById('lock').hidden = !SF.locked(S); document.getElementById('wipe').disabled = SF.locked(S);
  };
  chrome.storage.onChanged.addListener(sync); sync();
  document.getElementById('wipe').onclick = async () => {
    if (!confirm(SF.tr('Delete statistics, tasks and notes?'))) return;
    await chrome.storage.local.set({ stats: { days: {} }, tasks: [], notes: '', currentTaskId: null });
  };
})();
