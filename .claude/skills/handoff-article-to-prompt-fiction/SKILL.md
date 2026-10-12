---
name: handoff-article-to-prompt-fiction
description: Use when a post in this repo still has no images and Alan wants a handoff, brief or prompt file for prompt-fiction (`/prompt-fiction:generate-image`), or asks which images are missing and what size each one is.
---

# Handoff article to prompt-fiction

One file, `~/code/prompt-fiction/prompts/unstable-thought-diffusion/<slug>/brief.md`, that the generate-image skill takes on its Prompt tab. Every fenced block in it is one selectable prompt; everything else is context. A file with no fenced block is read as one giant prompt, so the blocks are the point.

## The brief, in order

1. `# <Title>, image brief`, then these two lines:
   ``Post: `~/code/unstable-thought-diffusion/<slug>/README.md`, branch `<branch>`.``
   ``Trigger: `alan-oliv`. One fenced block per image below; the thumbnails are crops of article-01.``
2. `## Missing images`: table `| File | Size | Aspect to generate | Where it goes |`, one row per `article-0N.png` the post references, then these two rows verbatim:
   ``| `thumbnail.png` | 250×200 | crop of article-01 (5:4) | Blog README grid |``
   ``| `hor-thumbnail.png` | 235×80 | crop of article-01 (3:1) | Profile README "Latest thoughts" |``
   Size and aspect come from the post's template: the file in `templates/` whose `<img>` slots the post's tags match (same count, banner in the same place). A post whose tags drifted from its template gets the template's slots, and the tags get fixed.

   | Template | Slot | Size | Aspect |
   |---|---|---|---|
   | essay | 01 banner | 1012×200 | 21:9 |
   | essay | 02 left 39% | 1024×1024 | 1:1 |
   | essay | 03 right 37% | 525×1024 | 9:16 |
   | story | 01 right 30% | 1000×854 | 5:4 |
   | story | 02 banner | 1012×200 | 21:9 |
   | story | 03 right 43%, 04 left 35% | 768×768 | 1:1 |
   | concept | 01 right 45% | 1141×1136 | 1:1 |
   | concept | 02 banner | 1012×200 | 21:9 |
   | short | 01 left 35% | 800×814 | 1:1 |

   "Where it goes": the section heading the `<img>` sits under, with its `align` and `width`; for the banner, `Under the title`. Under the table, one line: `Generate at the aspect, crop to the size afterwards.`
3. One section per article image: `## article-0N.png, <aspect>`, a line `Category: <one of the six in prompt-fiction's generate-image SKILL.md, step 1, picked by its "What defines it" column for what the scene shows>. <what the post says at that spot, one sentence>`, then a fenced block with the prompt. Depict the section's motif, the thing its heading names, not the first paragraph under it. `alan-oliv` first, then scene, palette and medium, in the shape of the blocks in any `prompt_alan-oliv-flux-v2.md` under `~/code/prompt-fiction/prompts/unstable-thought-diffusion/`. No model name; generate-image rewrites the block per model later. No block for the thumbnails.
4. `## The post, for context`, then the post's README with the leading `<p>…</p>` badge block removed.

Write sections 1 to 3 to a head file in the scratchpad, then `bash .claude/skills/handoff-article-to-prompt-fiction/build-brief.sh <slug> <head.md>`: it appends the post with the badge block stripped, writes the brief, and prints its path, the fence count (two per article image) and the badge lines left (expect 0).

## Quick reference

| Item | Value |
|---|---|
| Name | `brief.md`. Never `prompt_<model>.md`: that name makes the skill treat the folder as a picked model |
| Sizes, aspect | the template table above, by the post's template |
| Subject | `alan-oliv`; the skill swaps it per model |
| Commit | nothing, in either repo |

## Common mistakes

- Leaving the prompts "for later". Without fenced blocks the file is unusable on the Prompt tab.
- Sizing from the newest or most common post. The template decides.
- Keeping the badge `<p>` header. It is build output, not the post.
- Listing the thumbnails as images to generate. They are crops of article-01.
