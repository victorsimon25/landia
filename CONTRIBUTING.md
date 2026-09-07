# Contributing to LANDIA
Git Workflow Guide for ByteXSquad — Managed by @victorsimon25

This guide covers everything needed to collaborate on this repository, from first-time setup to pull requests, conflict resolution, and release tagging. Read it once before you start — it will save everyone time.

---

## Table of Contents

1. [First-Time Setup (Owner)](#1-first-time-setup-owner)
2. [Branch Strategy](#2-branch-strategy)
3. [Cloning the Repository (Teammates)](#3-cloning-the-repository-teammates)
4. [Daily Workflow Commands](#4-daily-workflow-commands)
5. [Pull Request Workflow](#5-pull-request-workflow)
6. [Keeping Your Branch in Sync](#6-keeping-your-branch-in-sync)
7. [Resolving Merge Conflicts](#7-resolving-merge-conflicts)
8. [Tagging Releases](#8-tagging-releases)
9. [Useful Git Aliases](#9-useful-git-aliases)
10. [Owner Tips](#10-owner-tips-victorsimon25)
11. [Quick Reference](#11-quick-reference)

---

## 1. First-Time Setup (Owner)

Run these commands once to connect the local repo to GitHub and establish the branch structure.

```bash
# Rename the default branch from master to main
git branch -m master main

# Connect to GitHub
git remote add origin https://github.com/victorsimon25/landia.git

# Verify the remote is set correctly
git remote -v
# Expected output:
# origin  https://github.com/victorsimon25/landia.git (fetch)
# origin  https://github.com/victorsimon25/landia.git (push)

# Push main and set it as the tracked upstream branch
git push -u origin main

# Create and push the develop integration branch
git checkout -b develop
git push -u origin develop
```

**After pushing, configure branch protection on GitHub:**

Go to **Settings > Branches > Add branch protection rule** for `main`:
- Require a pull request before merging (minimum 1 approval)
- Do not allow force pushes
- Do not allow deletions
- (Optional) Require branches to be up to date before merging

Set `develop` as the default target branch for new pull requests:
**Settings > General > Default branch** — change to `develop`.

---

## 2. Branch Strategy

| Branch | Purpose | Who can push directly? |
|--------|---------|------------------------|
| `main` | Production-stable. Tagged releases only. | Owner only (via PR from develop) |
| `develop` | Integration branch. All feature work merges here first. | Owner (after reviewing PRs) |
| `feature/xxx` | New feature work. One branch per feature/module. | Any contributor |
| `fix/xxx` | Bug fixes. | Any contributor |

**Naming conventions:**

```
feature/gis-parcel-identification
feature/lanzer-ai-nlp-engine
feature/digital-twin-simulation
feature/gams-phase-5-acquisition
fix/auth-token-expiry
fix/postgis-boundary-query
```

Keep branch names lowercase, hyphen-separated, and descriptive enough to understand without opening the code.

---

## 3. Cloning the Repository (Teammates)

```bash
# Clone the repository
git clone https://github.com/victorsimon25/landia.git
cd landia

# Configure your identity (do this once globally)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Verify you can see the remote branches
git branch -a
```

You should see `remotes/origin/main` and `remotes/origin/develop` listed.

---

## 4. Daily Workflow Commands

### Fetching and Pulling

```bash
# Fetch: download remote changes WITHOUT merging anything locally
# Safe to run any time — it only updates your knowledge of remote state
git fetch origin

# View what changed on develop before merging
git log origin/develop --oneline --not HEAD

# Pull develop into your current branch using rebase (preferred)
# --rebase replays your local commits on top of the updated remote
git pull --rebase origin develop

# Pull with merge instead (use only when directly on develop)
git pull origin develop
```

**Fetch vs Pull:** `git fetch` is always safe — it only downloads. `git pull` downloads AND merges or rebases. Use `--rebase` on feature branches to avoid cluttering history with unnecessary merge commits.

### Creating a Feature Branch

Always branch off `develop`, never off `main`:

```bash
git checkout develop
git pull --rebase origin develop          # make sure develop is up to date first
git checkout -b feature/your-feature-name

# Example
git checkout -b feature/gis-parcel-identification
```

### Staging and Committing

```bash
# Stage specific files (preferred over git add .)
git add src/components/MapView.jsx
git add backend/src/main/java/com/landia/GISService.java

# Check what is staged before committing
git status

# Commit with a descriptive message
git commit -m "feat: add PostGIS parcel boundary query in GISService"
```

**Commit message conventions:**

| Prefix | When to use |
|--------|------------|
| `feat:` | New feature or module |
| `fix:` | Bug fix |
| `docs:` | Documentation changes only |
| `refactor:` | Code restructure with no behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Build tooling, dependency updates, config changes |

Examples:
```
feat: implement corridor digital twin simulation API
fix: correct PostGIS SRID mismatch in parcel query
docs: update GAMS phase 5 acquisition flow in README
refactor: extract compensation calculator into separate service
chore: add .gitignore rules for Python venv
```

### Pushing a Branch

```bash
# First push — set upstream tracking so future pushes are just `git push`
git push --set-upstream origin feature/gis-parcel-identification

# Every push after that on the same branch
git push
```

---

## 5. Pull Request Workflow

### For Contributors (submitting a PR)

1. Make sure your branch is up to date with `develop`:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. Push your branch:
   ```bash
   git push
   # If you just rebased, you may need:
   git push --force-with-lease
   ```

3. Go to `https://github.com/victorsimon25/landia` — GitHub will show a banner "Compare & pull request" for recently pushed branches.

4. Set:
   - **Base:** `develop`
   - **Compare:** `feature/your-feature-name`

5. PR title should follow the same commit convention: `feat: implement GIS parcel identification module`

6. In the PR description include:
   - What changed and why
   - How to test it (what to run, what to look for)
   - Screenshots or GIF for UI changes
   - Related issue number if applicable: `Closes #12`

7. Request review from `@victorsimon25`.

### For Owner (reviewing and merging a PR)

```bash
# Pull down a contributor's branch locally to test
git fetch origin
git checkout feature/gis-parcel-identification

# Run and test the code, then go back to develop
git checkout develop

# Option A: Merge via GitHub UI (recommended)
# Use "Squash and Merge" for clean history on feature branches
# Use "Merge commit" only for large multi-commit features where history matters

# Option B: Merge locally
git merge --no-ff feature/gis-parcel-identification -m "Merge feature/gis-parcel-identification into develop"
git push origin develop

# Delete the merged branch (locally and on remote)
git branch -d feature/gis-parcel-identification
git push origin --delete feature/gis-parcel-identification
```

**Fetch any PR by number (without the contributor needing to add you as collaborator first):**

```bash
git fetch origin pull/5/head:pr-5
git checkout pr-5
```

---

## 6. Keeping Your Branch in Sync

When `develop` moves ahead while you are working on a feature branch, rebase your work on top of it:

```bash
git checkout feature/lanzer-ai-nlp-engine
git fetch origin

# Replay your commits on top of the latest develop
git rebase origin/develop
```

If the rebase is clean (no conflicts), push with `--force-with-lease`:

```bash
git push --force-with-lease origin feature/lanzer-ai-nlp-engine
```

**Why `--force-with-lease` and not `--force`?**

A plain `--force` overwrites the remote branch unconditionally. `--force-with-lease` will abort the push if someone else pushed to the same branch while you were rebasing — protecting against accidentally overwriting their work. Always prefer `--force-with-lease` when you must force-push.

---

## 7. Resolving Merge Conflicts

Conflicts appear when two branches edited the same lines of the same file.

**Step-by-step resolution during a rebase:**

1. `git rebase origin/develop` reports a conflict:
   ```
   CONFLICT (content): Merge conflict in src/services/AcquisitionService.java
   ```

2. Open the file. Conflict markers look like this:
   ```
   <<<<<<< HEAD (your changes)
   public void processParcel(String parcelId) {
   =======
   public void processParcel(String parcelId, String projectId) {
   >>>>>>> origin/develop (incoming changes)
   ```

3. Edit the file to the correct version (keep one, keep the other, or combine):
   ```java
   public void processParcel(String parcelId, String projectId) {
   ```

4. Remove all conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), then stage and continue:
   ```bash
   git add src/services/AcquisitionService.java
   git rebase --continue
   ```

5. Repeat for each conflicted file until the rebase completes.

6. To abort the entire rebase and return to your original state:
   ```bash
   git rebase --abort
   ```

**During a `git merge` (not a rebase):**

Same conflict-resolution process, but after staging resolved files, commit with:
```bash
git commit   # no -m needed; git opens an editor with the auto-generated merge message
```

**Tips:**
- Sync with `develop` frequently (daily if possible) to minimize conflict size.
- Communicate with teammates when you are working in the same files.
- Use `git log --merge` to see which commits introduced the conflicting changes.

---

## 8. Tagging Releases

Tags mark specific commits as official releases on the `main` branch.

```bash
# Switch to main and merge develop into it for the release
git checkout main
git merge --no-ff develop -m "Release v1.0.0 — SIH Demo Build"

# Create an annotated tag
git tag -a v1.0.0 -m "v1.0.0: Initial demo release for SIH 2026"

# Push the commit and the tag
git push origin main
git push origin v1.0.0

# List all tags
git tag -l

# Delete a tag made in error (local then remote)
git tag -d v1.0.0-bad
git push origin --delete v1.0.0-bad
```

**Versioning convention:**

| Tag | Stage |
|-----|-------|
| `v0.1.0` | Internal alpha / first working prototype |
| `v0.2.0`, `v0.3.0` | Incremental pre-release builds |
| `v1.0.0` | SIH Demo submission build |
| `v1.1.0` | Post-demo patch / improvement |

---

## 9. Useful Git Aliases

Add these to `~/.gitconfig` to speed up your daily workflow:

```bash
git config --global alias.st "status -sb"
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.co "checkout"
git config --global alias.br "branch -vv"
git config --global alias.undo "reset HEAD~1 --mixed"
git config --global alias.pushup "push --set-upstream origin HEAD"
```

| Alias | What it does |
|-------|-------------|
| `git st` | Short, clean status output |
| `git lg` | Visual branch graph — see how all branches relate at a glance |
| `git co develop` | Shorthand for `git checkout develop` |
| `git br` | List branches with their tracking remote and last commit |
| `git undo` | Undo the last commit but keep your file changes (safe to re-edit and re-commit) |
| `git pushup` | Push and set upstream in one command, regardless of branch name |

---

## 10. Owner Tips (@victorsimon25)

### Protecting Branches on GitHub

Go to **Settings > Branches > Add branch protection rule:**

For `main`:
- Require pull requests (1 approval minimum)
- Require status checks to pass (add CI checks here when configured)
- Do not allow force pushes
- Do not allow deletions

For `develop`:
- Do not allow force pushes
- Do not allow deletions
- (PRs optional for small repos, but good practice)

### Recovering Lost Commits

If a teammate accidentally force-pushed `develop` and overwrote commits, find the lost commit using `reflog` on their local machine:

```bash
# On the teammate's machine
git reflog
# Lists every recent HEAD position — find the commit hash from before the bad push

# Create a recovery branch from the lost commit
git checkout -b rescue/lost-work <lost-commit-hash>
```

Then cherry-pick the recovered commit back into `develop`:

```bash
git checkout develop
git cherry-pick <lost-commit-hash>
git push origin develop
```

Protect `develop` from force pushes (see above) to prevent this from happening.

### Reviewing PRs Efficiently

```bash
# Pull down any PR by number without manually checking out
git fetch origin pull/<PR-NUMBER>/head:pr-<PR-NUMBER>
git checkout pr-<PR-NUMBER>

# Example for PR #7
git fetch origin pull/7/head:pr-7
git checkout pr-7
```

After reviewing, delete the local PR branch:
```bash
git checkout develop
git branch -D pr-7
```

### Handling a Broken develop Branch

If a bad merge breaks `develop`:

```bash
# Find the last good commit
git log --oneline develop

# Reset develop to that commit (local only first)
git checkout develop
git reset --hard <last-good-commit-hash>

# Force-push to recover (only do this if you are sure — notify teammates first)
git push --force-with-lease origin develop
```

Always communicate with the team before resetting a shared branch.

### Onboarding a New Teammate

- [ ] Add them as a Collaborator: **Settings > Collaborators > Add people**
- [ ] Share this `CONTRIBUTING.md`
- [ ] Have them clone, configure `user.name` and `user.email`, and confirm `git branch -a` shows remote branches
- [ ] Ask them to create a test branch (`feature/onboarding-theirname`) and submit a trivial PR to verify their access and workflow
- [ ] Never give teammates direct push access to `main`
- [ ] Brief them on the commit message convention (`feat:`, `fix:`, etc.) before they commit anything

---

## 11. Quick Reference

| Task | Command |
|------|---------|
| Rename master to main | `git branch -m master main` |
| Set remote origin | `git remote add origin <url>` |
| Push and set upstream | `git push -u origin main` |
| See remote branches | `git branch -a` |
| Create feature branch from develop | `git checkout develop && git checkout -b feature/xxx` |
| Push new branch (first time) | `git push --set-upstream origin feature/xxx` |
| Sync feature branch with develop | `git fetch origin && git rebase origin/develop` |
| Push after a rebase | `git push --force-with-lease` |
| Undo last commit (keep changes) | `git reset HEAD~1 --mixed` |
| View visual branch graph | `git log --oneline --graph --decorate --all` |
| Check tracked remotes | `git branch -vv` |
| Fetch a PR by number | `git fetch origin pull/<N>/head:pr-<N>` |
| Tag a release | `git tag -a v1.0.0 -m "message" && git push origin v1.0.0` |
| Delete remote branch | `git push origin --delete feature/xxx` |
| List all tags | `git tag -l` |
| Find lost commits | `git reflog` |
