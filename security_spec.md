# Security Spec: Dompt Financial App

## 1. Data Invariants
- A user can only access their own user document, wallets, transactions, goals, and budget configs.
- Identity Integrity: The path variable `{userId}` must match `request.auth.uid`.
- Timestamps and IDs must be validated and bounded.
- Sub-collections belong strictly to the authenticated user. No cross-user access, reading, or writing is allowed.

## 2. Hardened Rules Pillars
- Default deny catch-all `match /{document=**} { allow read, write: if false; }`.
- User verification: Check `request.auth != null`.
- Path check: `request.auth.uid == userId`.
- Attribute validation: `isValidId(id)` and explicit entity schemas with size and type checks.
