# Commit

Create a commit starting with a header that follows the Conventional Commits
spec, followed by details in the body with a summary of the changes. Try to keep
the entire commit header line - including Conventional Commits section - within
72 characters. Aim for keeping the header within 50 characters.

Before committing, check the current branch:

- If on main or devel, fail with an error message prompting the user to create a
  feature branch
- Feature branches should follow the pattern username/feature-name (e.g.,
  jacob/awesome-feature)
- If the current branch doesn't match this pattern, prompt the user to confirm
  or create a proper branch

## Usage Examples

```bash
# Default: prompts to stage unstaged files
/commit

# Commit only staged files (full form)
/commit staged-only

# Commit only staged files (short form)
/commit so
```

## Arguments

- `staged-only` or `so`: Only commit staged files without prompting to stage
  unstaged files
- No arguments: Default behavior (prompt to stage unstaged files if present)

## Rules

- Check for staged files before running `git add`
- If there are no unstaged files, skip `git add` and commit immediately
- If arguments include `staged-only` or `so`, skip the staging prompt and commit
  only staged files
- If there are any unstaged files and no skip argument, ask the user whether to
  stage them

## Commit Message Standards

All commits must follow conventional commit format:

- **Format:** `<type>(<scope>): <Summary in sentence case>`
- **Types:** build, chore, ci, config, docs, feat, fix, perf, refactor, style,
  test
- **Scopes:** api, auth, humor, infra, msgs, tools, web
- **Header max:** 72 chars (prefer 50)
- **Body wrap:** 72 chars

Consult `.commitlintrc.js` for up-to-date conventional commit rules.

**Examples:**

```
✅ feat(api): Add bridge activation (31 chars)
✅ fix(infra): Handle rate limiting in sync loop (47 chars)
✅ fix(api): Handle Firestore errors in credential cache fetch (59 chars)
❌ feat(api): Add comprehensive error handling for bridge activation failures (75 chars) - TOO LONG
❌ fix(api): Add proper error handling for Firestore credential fetch failures (77 chars) - TOO LONG
```

**Validation checklist before committing:**

- [ ] Header ≤ 72 chars (count before committing!)
- [ ] Header preferably ≤ 50 chars
- [ ] Body lines ≤ 72 chars
- [ ] Format: `<type>(<scope>): <Summary in sentence case>`

Commitlint runs automatically via Husky git hooks and GitHub Actions.
