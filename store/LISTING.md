# Chrome Web Store listing

Copy-paste source for the developer dashboard.

## Store listing

**Name** (from manifest): Theme Tab Filter for Jev

**Summary** (from manifest description, max 132 chars):
Type a theme. Group, hide, or close your tabs by what they're about, judged by the TypeSafe Jev model.

**Category:** Productivity → Tools (or "Workflow & Planning")

**Language:** English

**Description:**

```
Too many tabs? Type what you're working on, in plain words, and let Theme Tab Filter sort them for you.

Example: type "Building a new home server" and every tab about motherboards, RAID, and Proxmox is found in one click, while your inbox, recipes, and YouTube are set aside.

FOUR ONE-CLICK ACTIONS
• Group – pull every matching tab into one named tab group
• Window – move every matching tab into its own new window
• Hide – fold everything else into a collapsed grey group (Show hidden tabs brings it back)
• Close – close everything else, only after you confirm, with Undo

YOU STAY IN CONTROL
• Preview which tabs match before anything changes
• Tick or untick any tab to override the model
• Slide Match strictness to widen or narrow the theme instantly
• The tab you're on and your pinned tabs are never hidden or closed
• Work on this window or all windows
• Recent themes are one click away
• Keyboard shortcut: Alt+Shift+F

HOW IT WORKS
Theme Tab Filter asks TypeSafe's Jev model one yes/no question per tab ("is this tab about the theme?") in a single fast request, using only each tab's title and URL. Scores are cached so re-running a theme is instant and free.

REQUIREMENTS
You need your own TypeSafe Jev API key (paste it in Settings). Jev costs a fraction of a cent per filter.

PRIVACY
No account, no analytics, no server of ours. Tab titles and URLs go only to api.typesafe.ai, with your key, when you click an action.

Free and open source (MIT): https://github.com/mpeddicord/jev-tab-filter

Not affiliated with or endorsed by TypeSafe.
```

**Graphics**
- Store icon: `icons/icon128.png`
- Screenshots (1280×800): `store/screenshot-1-preview.png`, `store/screenshot-2-group.png`, `store/screenshot-3-close.png`
- Small promo tile (440×280): `store/promo-small-440x280.png`

**Official URL:** none · **Homepage URL:** https://github.com/mpeddicord/jev-tab-filter · **Support URL:** https://github.com/mpeddicord/jev-tab-filter/issues

## Privacy practices

**Single purpose:**
Filter the user's open tabs by a theme they type: group, move, hide, or close tabs based on how related each tab is to that theme.

**Permission justifications:**
- `tabs` – Read open tabs' titles and URLs to score them against the theme, and move/close them when the user clicks an action.
- `tabGroups` – Create the theme group (Group), the collapsed "Hidden" group (Hide), and ungroup it again (Show hidden tabs).
- `storage` – Save the user's API key, settings, and recent themes locally; cache relevance scores for the session.
- `sessions` – Reopen tabs the extension just closed when the user clicks Undo close.
- `favicon` – Show each tab's site icon in the preview list.
- Host permission `https://api.typesafe.ai/*` – Send the theme and tab titles/URLs to the TypeSafe Jev API that scores relevance. No other host is contacted.

**Remote code:** No, I am not using remote code.

**Data usage – collected:** Web history (tab URLs and titles), Website content (tab titles). Authentication information (the user's own API key, stored locally).

**Certifications (all true):**
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://github.com/mpeddicord/jev-tab-filter/blob/main/PRIVACY.md

## Distribution

Free · Public · All regions
