# Remove AI image captions

## Changes
- Remove automatic AI alt-text generation after event photo uploads.
- Remove the AI regenerate control and alt-text editor from event photo cards.
- Keep captions, photo ordering, duplicate checks, and the 4–10 photo limit unchanged.
- Keep a simple event-title fallback on public images so image markup remains valid.
- Remove the unused photo-alt function from the project and deployed backend.

## Verification
- Confirm event photos upload without any AI caption request or notification.
- Confirm existing event galleries still display normally.
