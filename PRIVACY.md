# Privacy Policy — Theme Tab Filter for Jev

_Last updated: 2026-09-26_

Theme Tab Filter is an open-source Chrome extension. It has no server, no account, no analytics, and no tracking.

## What data the extension handles

| Data | Where it goes | Why |
|---|---|---|
| Titles and URLs of your open tabs | Sent to the TypeSafe Jev API (`api.typesafe.ai`) only when you click Preview or an action | Jev scores how related each tab is to the theme you typed |
| The theme you type | Sent to the TypeSafe Jev API with the same request; your last 8 themes are saved locally | Scoring, and the "recent themes" shortcuts |
| Your Jev API key | Saved in `chrome.storage.local` on your device; sent only to `api.typesafe.ai` as the request's authorization header | Authenticating with Jev |
| Relevance scores | Cached in `chrome.storage.session` on your device; cleared when Chrome closes | Avoids asking Jev twice for the same tab |

Nothing is sent anywhere else. The extension's author never receives any of your data.

## Third party

Requests go straight from your browser to TypeSafe using **your own** API key. TypeSafe's handling of that data is governed by TypeSafe's own terms and privacy policy. This extension is not affiliated with or endorsed by TypeSafe.

## Your control

- Nothing is sent until you click Preview or an action button.
- Remove your key in Settings, or clear everything by removing the extension.
- "Clear score cache" in Settings deletes cached scores immediately.

## Contact

Open an issue at <https://github.com/mpeddicord/jev-tab-filter/issues>.
