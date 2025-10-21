# Daily Game (Mining) UI Update

This change refreshes the Mining page UI to match the requested layout while preserving all existing game logic (claim, streaks, rewards, Firestore updates, wallet operations).

## Highlights
- New top stats header with:
  - Next claim countdown (24h window from `users/{uid}.lastClaimAt`).
  - Total DLX earned (from `users/{uid}.wallet.miningBalance`).
  - Total referrals (from `useReferral().activeReferrals`).
  - Total earned $ from swaps (sum of `amount` for `type==='swap'` in `wallets/{uid}/transactions`, excluding `failed`).
- Removed old tiles: `Daily Game play`, `Daily reward`, `Daily Combo`, `Daily Secret Code`.
- Removed right-side actions: `Boost`, `Energy`, `Invite`, `Gifts`.
- Responsive, mobile-friendly layout with accessible focus states and large tap targets.

## Files Changed
- `src/pages/Dashboard/Mining2.tsx` (UI only).

## Verify Locally
1. `npm run dev` and open `http://localhost:5173/mining`.
2. Log in as a user and ensure Firestore streams update:
   - Countdown shows `Ready` or `HH:MM:SS` accurately.
   - DLX total reflects `wallet.miningBalance`.
   - Referrals show the active count.
   - Earned $ updates when performing a DLX→USDT swap.
3. Check mobile: open DevTools → Toggle device toolbar → iPhone 12 → reload.

## Screenshot Guide
- Desktop: capture the full Mining page showing the stats header and the central claim button.
- Mobile: use the device toolbar to capture the same view; ensure claim button is touch-friendly and readable.

## Notes
- Claim button shows a single countdown to avoid redundant timers; the extra bottom countdown is removed.
- All claim, reward, streak, and wallet logic remains unchanged.
- Background image has a graceful fallback to a gradient if the remote asset fails.