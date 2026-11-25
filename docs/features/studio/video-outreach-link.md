---
name: Video Outreach link
area: studio
status: live
added: 2026-11-25
pr: deangilmoreremix/OpenHiggsBolt
route: Studio tab bar > Video Outreach
code:
  - components/StandaloneShell.js
---

## What it does
The studio tab bar has a "Video Outreach" link. It opens Video Outreach in the main SmartVideo app (smartvid.app) in a new browser tab, where you send personalized video campaigns. Video Outreach is not built into this app; the link takes you to it.

## Where in the app
Studio tab bar, after "SmartVideo GO AI Apps" and before "Academy". It has a small open-in-new-tab icon.

## Depends on
smartvid.app (`https://smartvid.app/#/outreach`), the main SmartVideo app. Its own sign-in applies there.

## How to test
Open any studio, scroll the tab bar to the end, click Video Outreach: smartvid.app's Video Outreach opens in a new tab and this app stays open.
