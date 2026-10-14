/* Shared content-script logic. Each platform file calls StudyFocus({key, css, isShort}). */
(() => {
  const TX = {
    ar: { title: 'هذا وقت التركيز.', session: '🎯 لديك جلسة دراسة نشطة.', on: '🎯 حجب الفيديوهات القصيرة مفعّل.', guard: 'هل تحتاج فعلًا إلى هذا الآن؟',
      strict: 'هذا المحتوى محجوب أثناء جلسة التركيز.', back: 'العودة للدراسة', anyway: 'فتح الفيديو على أي حال', openFor: m => `فتح لمدة ${m} دقيقة` },
    en: { title: "It's focus time.", session: '🎯 You have an active study session.', on: '🎯 Short-video blocking is on.', guard: 'Do you really need this right now?',
      strict: 'This content is blocked during your focus session.', back: 'Back to study', anyway: 'Open anyway', openFor: m => `Open for ${m} min` }
  };
  const CSS = `:host{all:initial}.o{position:fixed;inset:0;z-index:2147483647;background:#14110f;color:#f4ece1;display:flex;align-items:center;justify-content:center;font-family:"Thmanyah Sans","Segoe UI",Tahoma,system-ui,sans-serif;text-align:center}
.w{max-width:440px;padding:24px}h1{font-size:34px;margin:0 0 12px}p{margin:8px 0;color:#c9bdb0;font-size:17px}.q{color:#f4ece1;font-weight:700}
.b{display:flex;gap:10px;justify-content:center;margin-top:24px;flex-wrap:wrap}button{font:inherit;font-size:15px;padding:10px 20px;border-radius:10px;border:1px solid #8c2347;background:#8c2347;color:#fff;cursor:pointer}
button.g{background:transparent;color:#c9bdb0;border-color:#4a3f38}`;

  window.StudyFocus = cfg => {
    let S, styleEl, ov, timer, state = { on: false, fa: false }, counted = '', lastHref = '';
    const load = async () => { S = await SF.get(); apply(); };
    function setCSS(on) {
      if (on && !styleEl) { styleEl = document.createElement('style'); styleEl.textContent = cfg.css; (document.head || document.documentElement).appendChild(styleEl); }
      else if (!on && styleEl) { styleEl.remove(); styleEl = null; }
    }
    function apply() {
      clearTimeout(timer);
      const s = S.settings, n = Date.now(), fa = SF.focusActive(S.timer, n), by = S.bypass[cfg.key] || 0;
      state = { fa, on: !!s.blocking[cfg.key] && (fa || s.blockAlways) && by <= n };
      setCSS(state.on);
      const next = [by, fa ? S.timer.endsAt : 0].filter(x => x > n);
      if (next.length) timer = setTimeout(load, Math.min(...next) - n + 50);
      check();
    }
    const check = () => { if (state.on && cfg.isShort(location)) show(); else hide(); };
    const pauseMedia = () => document.querySelectorAll('video,audio').forEach(v => { try { v.pause(); } catch (e) {} });
    function hide() { if (ov) { ov.remove(); ov = null; } }
    function show() {
      const L = TX[S.settings.lang] || TX.en, lock = state.fa && S.timer.strict, mins = state.fa ? S.settings.bypassMinutes : Math.max(S.settings.bypassMinutes, 10);
      if (!ov) { ov = document.createElement('div'); ov.attachShadow({ mode: 'open' }); document.documentElement.appendChild(ov); }
      ov.shadowRoot.innerHTML = `<style>${CSS}</style><div class="o" dir="${S.settings.lang === 'ar' ? 'rtl' : 'ltr'}"><div class="w"><h1>${L.title}</h1>
        <p>${state.fa ? L.session : L.on}</p>${state.fa ? `<p class="q">${lock ? L.strict : L.guard}</p>` : ''}
        <div class="b"><button id="back">${L.back}</button>${!lock && S.settings.allowOverride ? `<button class="g" id="go">${state.fa ? L.openFor(mins) : L.anyway}</button>` : ''}</div></div></div>`;
      ov.shadowRoot.getElementById('back').onclick = () => chrome.runtime.sendMessage({ type: 'back' });
      const go = ov.shadowRoot.getElementById('go');
      if (go) go.onclick = async () => {
        const b = (await chrome.storage.local.get('bypass')).bypass || {};
        b[cfg.key] = Date.now() + mins * 60000; await chrome.storage.local.set({ bypass: b });
      };
      if (state.fa && counted !== location.href) { counted = location.href; chrome.runtime.sendMessage({ type: 'attempt' }); }
      pauseMedia();
    }
    chrome.storage.onChanged.addListener(c => { if (c.settings || c.timer || c.bypass) load(); });
    // SPA navigation: a very light href check (no DOM scanning).
    setInterval(() => { if (!S) return; if (location.href !== lastHref) { lastHref = location.href; check(); } else if (ov) pauseMedia(); }, 600);
    load();
  };
})();
