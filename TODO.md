# TODO - Fix Medecin Dashboard

## Plan Summary

Fix the medecin (doctor) role pages to work properly with correct routing protection, layout, navigation, and UI consistency.

## Issues Found

1. **Missing PrivateRoute wrappers** on ALL medecin sub-pages — anyone could access them directly
2. **medecin/patients/page.tsx** — broken layout (no flex container, no marginLeft), no PrivateRoute, no Sidebar integration
3. **medecin/notifications/page.tsx** — uses patient color scheme (#A861D8 purple, #FAF7FF bg) instead of medecin theme (#44B6B2 teal, #F0FAFA bg). Component named `PatientNotifications`
4. **Sidebar.tsx** — missing "Patients" navigation item for medecin role
5. **medecin/page.tsx** — "Mes patients" card links to `/dashboard/medecin/rendezvous` instead of `/dashboard/medecin/patients`
6. **Inconsistent marginLeft** — rendezvous uses 260 instead of 240 like other medecin pages
7. **lib/api.ts** — creates its own axios instance instead of re-exporting from lib/axios.ts (redundant, inconsistent with completed TODO)

## Steps

- [ ] Step 1: Add PrivateRoute wrapper + fix layout in medecin/patients/page.tsx
- [ ] Step 2: Add PrivateRoute wrapper in medecin/rendezvous/page.tsx + fix marginLeft 260→240
- [ ] Step 3: Add PrivateRoute wrapper in medecin/consultations/page.tsx
- [ ] Step 4: Add PrivateRoute wrapper in medecin/ordonnances/page.tsx
- [ ] Step 5: Add PrivateRoute wrapper in medecin/profil/page.tsx
- [ ] Step 6: Fix medecin/notifications/page.tsx colors, rename component, add PrivateRoute
- [ ] Step 7: Add "Patients" nav item to medecin sidebar in components/Sidebar.tsx
- [ ] Step 8: Fix "Mes patients" card link in medecin/page.tsx
- [ ] Step 9: Fix lib/api.ts to re-export from lib/axios.ts
- [ ] Step 10: Build/test to verify no errors
