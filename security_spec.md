# Security Spec: Dompt Financial App

## 1. Data Invariants
- A user can only access their own user document, wallets, transactions, goals, debts, subscriptions, and budget configs.
- Identity Integrity: The path variable `{userId}` must match `request.auth.uid` or a valid deterministic account ID (`acct_...`).
- Timestamps and IDs must be validated and bounded (`isValidId` <= 128 chars, alphanumeric/underscore/hyphen).
- Sub-collections (`wallets`, `transactions`, `goals`, `budgetConfig`, `debts`, `subscriptions`) belong strictly to the owner `{userId}`. No cross-user access, reading, or writing is allowed.

## 2. Hardened Rules Pillars & Adversarial Payloads
- Default deny catch-all `match /{document=**} { allow read, write: if false; }`.
- Path variable hardening: `isValidId(id)` enforced on all single-document writes and reads.
- Strict schema blueprints (`isValidUserProfile`, `isValidWallet`, `isValidTransaction`, `isValidGoal`, `isValidDebt`, `isValidSubscription`, `isValidBudgetConfig`) with `hasAll` and `hasOnly` key checks and string size limits.
- Immutable ownership check on update: `incoming().userId == existing().userId`.
