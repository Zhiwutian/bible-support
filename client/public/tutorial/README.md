# Tutorial images

Add screenshots here for the in-app tutorial (`client/src/content/tutorial/sections/`).

## Recommended assets

| File                  | Used in                  | Notes                                                                                   |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `reader-options.webp` | `01-getting-started.mdx` | Reader **Options** modal (theme, font, layout). If missing, a placeholder SVG is shown. |

Prefer **WebP** for size; PNG is fine. Keep width reasonable (e.g. 1200–1600px).

## Accessibility

Every `<TutorialFigure>` must have accurate **alt** text. Do not embed secrets or PII in screenshots.

## Export workflow

1. Run the app locally, open Reader → **Options**.
2. Capture the panel (browser or OS screenshot tool).
3. Convert/crop to WebP, save as `reader-options.webp` in this folder.
4. Rebuild the client; the tutorial will load the image automatically (no MDX change needed if you keep the default filename).
