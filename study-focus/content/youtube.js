StudyFocus({
  key: 'youtube',
  isShort: l => l.pathname.startsWith('/shorts'),
  css: `ytd-reel-shelf-renderer,ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),ytd-rich-section-renderer:has(ytm-shorts-lockup-view-model),
ytm-shorts-lockup-view-model,ytm-shorts-lockup-view-model-v2,ytd-video-renderer:has(a[href^="/shorts/"]),ytd-grid-video-renderer:has(a[href^="/shorts/"]),
ytd-rich-item-renderer:has(a[href^="/shorts/"]),ytd-compact-video-renderer:has(a[href^="/shorts/"]),yt-lockup-view-model:has(a[href^="/shorts/"]),
ytd-guide-entry-renderer:has(a[title="Shorts"]),ytd-mini-guide-entry-renderer[aria-label="Shorts"],ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
yt-tab-shape[tab-title="Shorts"],ytm-pivot-bar-item-renderer:has(.pivot-shorts){display:none!important}`
});
