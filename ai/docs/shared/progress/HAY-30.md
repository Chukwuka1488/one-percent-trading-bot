# HAY-30: Layout Templates

**Status:** Active
**Worktree:** WORKTREE-1
**Branch:** `feature/hay-30-layout-templates`
**Started:** 2026-01-24

---

## Objective

Complete the layout templates for the dashboard following atomic design principles.

---

## Completed

- [x] `DashboardLayout` - Main dashboard layout with sidebar and header

---

## In Progress

- [ ] `AuthLayout` - Authentication pages layout (login, register, etc.)

---

## Next

1. Create `AuthLayout.tsx` component
2. Export from `templates/index.ts`
3. Run linting and type checks
4. Write tests if applicable

---

## Files Being Modified

| File                                                | Action   |
| --------------------------------------------------- | -------- |
| `dashboard/src/components/templates/AuthLayout.tsx` | Creating |
| `dashboard/src/components/templates/index.ts`       | Updating |

---

## Notes

- Following atomic design: templates are page-level layout components
- DashboardLayout already exists with Sidebar + Header integration
- AuthLayout should provide a centered, minimal layout for auth flows
