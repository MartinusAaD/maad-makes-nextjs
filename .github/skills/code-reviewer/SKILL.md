---
name: code-reviewer
description: Run a structured quality review pass over any code written or modified. Use this skill when code has just been generated or changed — catches logic issues, abstraction problems, naming inconsistencies, performance inefficiencies, dead code, and single-responsibility violations before presenting output to the user. Fixes what it finds rather than just flagging it.
---

This skill performs a structured, fix-first code review pass over any code the agent writes or modifies. The review happens **before** presenting the final output to the user. Do not just flag issues — fix them.

## When This Skill Applies

Load and apply this skill whenever you:

- Write a new component, hook, utility, or context
- Modify existing code in any meaningful way
- Refactor or restructure logic
- Add a new feature or fix a bug

## Review Checklist

Work through each category systematically. If you find a violation, fix it immediately, then continue.

### 1. Single Responsibility

- Each function or component should do **one thing**
- If a function handles fetching, transforming, and rendering — split it
- Components mixing business logic with presentation should extract the logic into a hook
- Event handlers should be thin: delegate to utilities or hooks, not inline imperative logic

### 2. Reuse & Abstraction

- Is this logic duplicated elsewhere in the codebase? Check `hooks/`, `utils/`, `components/`, and `context/`
- If a utility already exists (e.g. `productHelpers.js`, `analytics.js`, `rateLimiting.js`), use it — don't reimplement
- Only extract into a shared utility if the logic is used (or clearly will be used) in more than one place
- Do not over-abstract for one-off operations

### 3. Naming & Intent

- Variable and function names should explain **what** they are, not **how** they work
- Booleans: `isLoading`, `hasError`, `canSubmit` — not `loading`, `error`, `submit`
- Event handlers: `handleSubmit`, `handleFilterChange` — not `doThing`, `onClick`
- Follow codebase conventions: PascalCase components, camelCase hooks/utils, `use` prefix for hooks, `*Context.jsx` for contexts
- Avoid vague names: `data`, `info`, `temp`, `stuff`, `item` (unless genuinely generic)

### 4. This Codebase's Patterns

Apply these project-specific rules:

- **CSS**: Use Tailwind v4 utility classes. Custom design tokens are `primary`, `primary-lighter`, `primary-darker`, `light`, `dark`, `bg-light`. Do not add inline styles unless Tailwind cannot express it
- **Imports**: Use `@/` path aliases (e.g. `@/components/Button/Button`, `@/context/AuthContext`)
- **Client components**: Add `"use client"` only when needed (event handlers, hooks, browser APIs). Prefer server components for static/data-read pages
- **SSR guards**: Any `localStorage` or `window` access must be guarded: `if (typeof window === "undefined") return`
- **Context hooks**: Use the project's custom hooks (`useCart()`, `useAuth()`, etc.) — never consume context directly with `useContext`
- **Default exports**: Components use default exports. Utilities and hooks use named exports
- **Props**: Destructure props inline. Provide sensible defaults for optional props

### 5. Performance

- React: avoid creating objects/arrays/functions as props inline inside JSX (they recreate on every render)
- Memoize expensive derived values with `useMemo` when the computation is genuinely costly
- Debounce search inputs with `useDebounce` (already in `hooks/useDebounce.js`) — don't reinvent it
- Avoid `useEffect` for logic that can live in event handlers
- Do not fetch inside render; push side effects into hooks
- Watch for N+1 patterns: loops that trigger individual Firestore calls should be batched

### 6. Dead Code & Unused Imports

- Remove all unused imports
- Remove commented-out code blocks
- Remove `console.log` statements left from debugging
- Remove variables that are declared but never read

### 7. Edge Cases & Boundaries

- Handle loading and error states wherever async data is involved
- Guard against null/undefined before accessing nested properties
- For forms: validate at submission AND show inline errors (see `useFormValidation` in `hooks/useFormValidation.js`)
- Empty states: if a list renders nothing, show a meaningful empty state rather than silence

### 8. Readability

- Functions longer than ~40 lines are a signal to consider extraction
- Deeply nested conditionals (3+ levels) should be flattened with early returns or extracted logic
- Complex boolean expressions should be named: `const isEligibleForDiscount = ...`

## Review Output Format

After completing all fixes, briefly note what was changed and why — one line per fix. If nothing needed changing, say so. Example:

```
Review complete:
- Extracted duplicate price-formatting logic into productHelpers.js
- Renamed `data` → `products` for clarity
- Added SSR guard around localStorage read
- Removed unused `useState` import
- Split `handleFormSubmit` (was handling validation + submission + redirect) into three focused functions
```

## What NOT to Do

- Do not add comments or docstrings to code you didn't change
- Do not refactor code outside the scope of the current task
- Do not add error handling for scenarios that genuinely cannot occur
- Do not introduce new abstractions unless the duplication clearly warrants it
- Do not change working patterns just because a different pattern exists elsewhere
