# Development & Documentation Rules

This document establishes the mandatory rules and development standards for the **ML Heroes 2D MOBA** project.

---

## 1. Context Documentation Rule

Whenever any feature is added, bug is fixed, or architecture is updated, a dedicated context markdown file **MUST** be created inside the [`docs/context/`](file:///data/data/com.termux/files/home/projects/codev/fafa/ml/docs/context) directory.

### 1.1 Naming Convention

All context files must strictly follow this naming pattern:

```
MM-DD-YY-<feature-or-fix-name>.md
```

* **`MM`**: 2-digit month (e.g., `11` for November)
* **`DD`**: 2-digit day (e.g., `05` for the 5th)
* **`YY`**: 2-digit year (e.g., `26` for 2026)
* **`<feature-or-fix-name>`**: Kebab-case descriptive slug (e.g., `phase-2-minion-waves`, `fix-canvas-click-scaling`)

**Examples:**
* `11-05-26-phase-1-syntax-and-input-fixes.md`
* `11-05-26-phase-2-minion-waves-and-turret-combat.md`
* `11-06-26-phase-3-hero-skills.md`

### 1.2 Context Document Template

Each context file in `docs/context/` must follow this structure:

```markdown
# [Title: Feature / Fix Name]

**Date:** MM-DD-YYYY  
**Type:** Feature | Bug Fix | Refactor | Architecture  
**Status:** Complete  

---

## 1. Summary & Motivation
Brief explanation of what was built or fixed and why.

## 2. Files Modified / Created
* `path/to/file.js` — description of changes
* `path/to/another.html` — description of changes

## 3. Technical Implementation Details
Key logic, math, algorithms, formulas, or architecture introduced.

## 4. Verification & Testing
How this change was tested and verified (automated tests, manual steps).

## 5. Next Steps / Dependencies
What follows or depends on this change.
```

---

## 2. Mandatory Git Commit Rule

Every feature, bug fix, refactor, or documentation update **MUST** be committed to Git. Never leave finished changes uncommitted.

### 2.1 Commit Policy
1. Make the code changes and test them.
2. Create/update the corresponding `docs/context/MM-DD-YY-<name>.md` file.
3. Stage all modified and new files (`git add .`).
4. Commit with a clear, conventional commit message:
   * `feat: ...` for new features (e.g., `feat: implement phase 2 minion waves and turret combat`)
   * `fix: ...` for bug fixes (e.g., `fix: remove export statements and scale canvas input coordinates`)
   * `docs: ...` for documentation changes (e.g., `docs: add rules and context documentation`)
   * `refactor: ...` for refactoring without feature changes

---

## 3. Quality & Verification Rules

1. **Syntax Check:** Every JavaScript file must pass `node --check js/<file>.js` before committing.
2. **Vanilla JS Compatibility:** Do not introduce bundler-specific or unsupported `export`/`import` statements in classic `<script>` tags.
3. **No Breaking Regressions:** Ensure the game loop, canvas renderer, and hero movement continue to run smoothly at 60 FPS without console errors.
