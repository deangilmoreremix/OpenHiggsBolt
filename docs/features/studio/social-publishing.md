---
name: Social Publishing
area: studio
status: live
added: TBD   # confirm from git log
pr: TBD
route: Studio result > Publish
code:
  - components/SocialPublishModal.tsx
  - components/SocialPublishProvider.tsx
  - components/social-publishing/SocialPublishStepper.tsx
---

## What it does
Step-by-step flow to connect accounts, write copy, pick a thumbnail, review and publish a generated video to social platforms.

## Where in the app
Opened from generated results through the shared publish modal.

## Depends on
Social account connections and copy/thumbnail step components under `components/social-publishing/`.

## How to test
Generate a result, click Publish, and walk the stepper to the review step.
