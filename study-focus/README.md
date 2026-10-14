# Study Focus

Chrome/Chromium extension (Manifest V3): Pomodoro, Focus Mode, Shorts/Reels blocking, website blocker, tasks, notes and statistics.
No backend. All data stays local (`chrome.storage.local`).

## Run
1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `study-focus` folder.

## Architecture
- `background/service-worker.js`: single source of truth for the timer (alarms), statistics, notifications and the website blocker.
- `content/*.js`: per-platform rules (`common.js` holds the shared logic: CSS hiding, focus screen, SPA URL check).
- `shared/core.js`: defaults, storage helpers, i18n (AR/EN), formatting. `shared/ui.css`: theme tokens.
- `popup/`, `dashboard/`, `settings/`, `blocked/`: UI pages.

## Font
The Arabic UI uses "Thmanyah Sans" if it is installed on the system, then falls back to IBM Plex Sans Arabic / Segoe UI / Tahoma.

## Notes
- Platforms change their markup often; the hiding selectors are in `content/<platform>.js` and are easy to update.
- Privacy: no personal data is collected or sent anywhere.
