---
name: new-post
description: Use when the user wants to write, draft, start, or add a new post to the unstable-thought-diffusion blog.
---

# New post

`POSTS.md` is the only source of post metadata. `build.mjs` generates the README table,
the post badges and the profile's "Latest thoughts"; CI runs it on push to `main`.

1. Pick a template from `templates/` (`essay`, `concept`, `story`, `short`) and create
   `<slug>/README.md` from it. Read one or two existing posts to match the author's voice.
2. Add `## <Title>`, `- id: <slug>` and `- date: <YYYY-MM-DD>` at the top of `POSTS.md`.
3. Run `node build.mjs`.
4. Tell the author which images are missing in `<slug>/static/`: `thumbnail.png` (square),
   `hor-thumbnail.png` (wide, profile) and any `article-0N.png` the post references.
