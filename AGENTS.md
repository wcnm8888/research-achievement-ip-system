# Project Agent Rules

This repository follows the workspace safety rules plus the project rules below.

## Testing Entry Point

- Before choosing test, browser acceptance, or local production-like acceptance commands, read `docs/testing/testing-strategy.md` first.
- Use `corepack pnpm` for repeatable project gates, prefer `playwright-cli` for real browser acceptance, and reserve Docker production-like for local integration acceptance only.

## Account Password Safety

- Do not modify any account password unless the user explicitly authorizes the exact account and scope in the current task.
- Do not rotate local test account passwords as a convenience for obtaining sessions.
- Do not store or print passwords, password hashes, cookies, session tokens, reset tokens, or invite tokens in docs, logs, test output, commits, or chat.
- If a login is needed for local acceptance, prefer a user-provided credential or user-provided active browser session.
- If a password repair is explicitly authorized, record only non-sensitive evidence such as account email, account status, credential status, role summary, and boolean verification results.
