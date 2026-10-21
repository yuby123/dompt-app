# Security Spec: Dompt Financial App

## 1. Data Invariants
- A user can only access their own user document, wallets, transactions, goals, debts, subscriptions, and budget configs.
- Identity Integrity: The path variable `{userId}` must match `request.auth.uid` (for Firebase Auth users) or a valid deterministic email account ID (`^acct_[a-zA-Z0-9_\-]+$`), and any `userId` or `uid` field in the document data must match `{userId}`.
- Strict Schema & Size Limits: Every collection (`users`, `wallets`, `transactions`, `goals`, `budgetConfig`, `debts`, `subscriptions`) enforces strict key allowlists (`hasOnly`), required keys (`hasAll`), type checks, and string length boundaries (`<= 128`, `<= 500`, `<= 10000`, `<= 20000`).
- Immortality: `uid` and `userId` fields cannot be mutated on `update`.

## 2. The "Dirty Dozen" Payloads (All Rejected with PERMISSION_DENIED)
1. Unauthenticated read/write to any non-account path.
2. Authenticated user reading another user's `/users/{otherUid}` document.
3. Creating a wallet where `incoming().userId != userId`.
4. Updating a wallet's `userId` to another user (`incoming().userId != existing().userId`).
5. Injecting a shadow field (`isAdmin: true`) into `/users/{userId}`.
6. Injecting a shadow field (`hacked: "yes"`) into `/users/{userId}/transactions/{txId}`.
7. Creating a transaction with invalid `type` (`"steal"` instead of `'income' | 'expense' | 'transfer'`).
8. Creating a transaction with a 1MB `note` string (`note.size() > 500`).
9. Creating a document with an invalid path ID (>128 chars or special characters).
10. Creating a subscription with invalid `frequency` (`"hourly"` instead of `'monthly' | 'yearly' | 'weekly'`).
11. Creating a debt with invalid `type` (`"loan"` instead of `'payable' | 'receivable'`).
12. Writing to an unknown collection `/system/config` (blocked by default-deny catch-all).
