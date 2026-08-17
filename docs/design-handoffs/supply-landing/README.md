# Supply landing handoff (reference)

Original design brief: see `HANDOFF.md`. Prototype HTML: `Gigtorget Join (Supply).dc.html`.

**Source of truth for layout / type / color on `/for-talanger`:** the HTML prototype + `tokens/*.css` (Gigtorget). The HANDOFF brand note saying “don’t port Gigtorget” was overridden — this marketing page uses Gigtorget visuals scoped under `.supply-landing`.

## Implemented as

- Page: `/for-talanger` → `app/for-talanger/page.tsx`
- UI: `components/marketing/supply/` (tokens in `supply-landing.css`)
- Hero images: `public/images/supply/`
- Rules: `CLAUDE.md` (Brand + Supply landing sections)

Raw upload dump may still exist under repo-root `design system/`.
