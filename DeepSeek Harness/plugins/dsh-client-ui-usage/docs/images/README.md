[中文](./README.zh-CN.md)

# Screenshots (images)

This directory holds UI screenshots for the `dsh-client-ui-usage` plugin,
referenced by the [main README](../README.md) and docs. Follow the conventions
below to keep the images maintainable over time.

## Layout

```
docs/images/
├── README.md          # these conventions (English)
├── README.zh-CN.md    # these conventions (Chinese)
├── common/            # universal screenshots (referenced by both EN & ZH)
│   └── brief_view.png
├── en/                # English-only screenshots
│   └── details_en.png
└── zh/                # Chinese-only screenshots
    └── details_zh.png
```

- `common/`: **universal screenshots** (e.g. the compact `brief_view`) whose
  content does not depend on the language — both docs may reference them.
- `en/`: **English-only** screenshots, referenced only by the English docs.
- `zh/`: **Chinese-only** screenshots, referenced only by the Chinese docs.

## Naming

- Lowercase, ASCII only, words separated by underscores, e.g. `brief_view.png`,
  `details_en.png`.
- Pattern: `{view}[_{locale}].png`.
  - Universal views **omit the locale suffix** and go in `common/`, e.g.
    `brief_view.png`.
  - Language-specific views carry a `_en` / `_zh` suffix and go in the matching
    language folder, e.g. `details_en.png`, `details_zh.png`.

## Image spec

- Format: PNG (lossless).
- Prefer 2x (DPR) captures, width ≤ 1280px, for clarity and reasonable size.
- **Redact sensitive information**: conversation content, keys, account
  identifiers, internal addresses, etc.
- When a view changes, **overwrite the same filename** so references stay
  valid; add a new file only for a new view.

## Workflow

1. Capture at a fixed window width, at 2x.
2. Decide whether the shot depends on language:
   - universal → place it in `common/`;
   - language-specific → place it in `en/` or `zh/` with a `_en` / `_zh` suffix.
3. Reference it with an **absolute URL** (GitHub raw) — npm does not resolve
   relative paths, and an absolute URL renders on both GitHub and npm, e.g.
   - universal: `![Usage pill](https://raw.githubusercontent.com/greluoqixi/Skills/main/DeepSeek%20Harness/plugins/dsh-client-ui-usage/docs/images/common/brief_view.png)`
   - English detail: `![Detail panel](https://raw.githubusercontent.com/greluoqixi/Skills/main/DeepSeek%20Harness/plugins/dsh-client-ui-usage/docs/images/en/details_en.png)`
4. Overwrite in place on UI changes; if a filename must change, update every
   reference as well.
