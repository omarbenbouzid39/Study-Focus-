StudyFocus({
  key: 'instagram',
  isShort: l => /\/reels?(\/|$)/.test(l.pathname),
  css: `a[href^="/reels"],article:has(a[href*="/reel/"]),div:has(> a[href^="/reels"]):not(:has(a[href="/"])){display:none!important}`
});
