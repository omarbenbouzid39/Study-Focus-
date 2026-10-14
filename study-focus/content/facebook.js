StudyFocus({
  key: 'facebook',
  isShort: l => /\/reels?(\/|$)/.test(l.pathname),
  css: `a[href*="/reel/"],a[href*="/reels/"],a[href$="/reels"],div[role="article"]:has(a[href*="/reel/"]),li:has(> a[href*="/reels"]),div[role="listitem"]:has(a[href*="/reels"]){display:none!important}`
});
