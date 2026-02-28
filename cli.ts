#!/usr/bin/env node
/**
 * CLI for adding new blog posts from templates.
 * Usage: npx tsx cli.ts add --template <type> --title "Post title"
 */

import { Command } from 'commander';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import Mustache from 'mustache';

// Don't escape HTML; we're rendering markdown, not HTML.
Mustache.escape = (text: string) => text;

const TEMPLATE_TYPES = ['essay', 'concept', 'story', 'short'] as const;
type TemplateType = (typeof TEMPLATE_TYPES)[number];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface GeneratedPost {
  title: string;
  slug: string;
  dateIso: string;
  dateBadge: string;
  dateDisplay: string;
  readTime: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getExistingSlugs(root: string): Set<string> {
  const slugs = new Set<string>();
  if (!existsSync(root)) return slugs;
  for (const name of readdirSync(root, { withFileTypes: true })) {
    if (name.isDirectory() && !name.name.startsWith('.')) {
      slugs.add(name.name);
    }
  }
  const postsPath = join(root, 'POSTS.md');
  if (existsSync(postsPath)) {
    const content = readFileSync(postsPath, 'utf-8');
    const idMatches = content.matchAll(/^- id: (.+)$/gm);
    for (const m of idMatches) slugs.add(m[1].trim());
  }
  return slugs;
}

function ensureUniqueSlug(baseSlug: string, root: string): string {
  const existing = getExistingSlugs(root);
  let slug = baseSlug;
  let n = 1;
  while (existing.has(slug)) {
    slug = `${baseSlug}-${n}`;
    n++;
  }
  return slug;
}

function formatDateBadge(d: Date): string {
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day},%20${year}`;
}

function formatDateDisplay(d: Date): string {
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

function generatePostData(root: string, title: string): GeneratedPost {
  const baseSlug = slugify(title) || `post-${Date.now()}`;
  const slug = ensureUniqueSlug(baseSlug, root);
  const d = new Date();
  const dateIso = d.toISOString().slice(0, 10);
  return {
    title: title.trim(),
    slug,
    dateIso,
    dateBadge: formatDateBadge(d),
    dateDisplay: formatDateDisplay(d),
    readTime: randomInt(3, 8),
  };
}

function toMustacheView(data: GeneratedPost): Record<string, string | number> {
  return {
    TITLE: data.title,
    SLUG: data.slug,
    DATE_ISO: data.dateIso,
    DATE_BADGE: data.dateBadge,
    DATE_DISPLAY: data.dateDisplay,
    READ_TIME: data.readTime,
    READ_TIME_BADGE: data.readTime,
  };
}

function renderTemplate(template: string, data: GeneratedPost): string {
  return Mustache.render(template, toMustacheView(data));
}

function dummyImage(width: number, height: number, text: string): string {
  const encoded = encodeURIComponent(text);
  return `https://dummyimage.com/${width}x${height}/ddd/999&text=${encoded}`;
}

function replacePlaceholderImages(content: string): string {
  let out = content;
  for (let n = 1; n <= 4; n++) {
    out = out.replace(
      new RegExp(`\\./static/article-0${n}\\.png`, 'g'),
      dummyImage(800, 400, String(n))
    );
  }
  out = out.replace(/\.\/static\/thumbnail\.png/g, dummyImage(400, 400, '+'));
  return out;
}

function createPost(root: string, templateType: TemplateType, data: GeneratedPost): void {
  const templatesDir = join(root, 'templates');
  const templatePath = join(templatesDir, `${templateType}.md`);
  const template = readFileSync(templatePath, 'utf-8');
  let content = renderTemplate(template, data);
  content = replacePlaceholderImages(content);

  const postDir = join(root, data.slug);
  const staticDir = join(postDir, 'static');
  mkdirSync(staticDir, { recursive: true });
  writeFileSync(join(postDir, 'README.md'), content, 'utf-8');
  writeFileSync(
    join(staticDir, 'README.md'),
    'Add thumbnail.png here (and optionally article-01.png, article-02.png, etc.).\n',
    'utf-8'
  );
}

function prependPostBlock(root: string, data: GeneratedPost): void {
  const postsPath = join(root, 'POSTS.md');
  let content = readFileSync(postsPath, 'utf-8');
  const titleForList = data.title;
  const block = `
## ${titleForList}

- id: ${data.slug}
- date: ${data.dateIso}
- link: /posts/${data.slug}
- readTime: ${data.readTime}
`;
  const afterHeader = content.indexOf('\n\n');
  const insertAt = afterHeader >= 0 ? afterHeader + 2 : content.length;
  content = content.slice(0, insertAt) + block.trimStart() + '\n\n' + content.slice(insertAt);
  writeFileSync(postsPath, content, 'utf-8');
}

function buildNewPostCells(data: GeneratedPost, repoName: string): { th: string; td: string } {
  const badgeUrl =
    'https://badgen.net/badge/' + data.readTime + '/min%20read/darkgray?scale=1&labelColor=darkgray&color=darkgray&cache=360000';
  const baseUrl = 'https://github.com/' + repoName + '/blob/main';
  const thumbnailSrc = dummyImage(400, 400, '+');
  const linkHref = baseUrl + '/' + data.slug + '/README.md';
  const th =
    '<th width="33%">\n      <a href="' +
    linkHref +
    '">\n        <img alt="" src="' +
    thumbnailSrc +
    '"></img>\n      </a>\n    </th>';
  const td =
    '<td width="33%">\n      <a href="' +
    linkHref +
    '">\n        <br/>\n        <img alt="" src="' +
    badgeUrl +
    '" />\n        <br/>\n        ' +
    data.title +
    '\n      </a>\n      <br/>\n      <p>' +
    data.dateDisplay +
    '</p>\n    </td>';
  return { th, td };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function insertReadmeTable(root: string, data: GeneratedPost, repoName: string): void {
  const readmePath = join(root, 'README.md');
  let content = readFileSync(readmePath, 'utf-8');

  const tableStart = content.indexOf('<table>');
  const tableEnd = content.lastIndexOf('</table>');
  if (tableStart === -1 || tableEnd === -1 || tableEnd < tableStart) {
    const { th, td } = buildNewPostCells(data, repoName);
    content = content.trimEnd() + '\n\n<table>\n  <tr>\n    ' + th + '\n  </tr>\n  <tr>\n    ' + td + '\n  </tr>\n</table>\n';
    writeFileSync(readmePath, content, 'utf-8');
    return;
  }

  const tableSection = content.slice(tableStart, tableEnd + '</table>'.length);
  const thRegex = /<th width="33%">[\s\S]*?<\/th>/g;
  const tdRegex = /<td width="33%">[\s\S]*?<\/td>/g;
  const existingTh = tableSection.match(thRegex) ?? [];
  const existingTd = tableSection.match(tdRegex) ?? [];

  const { th: newTh, td: newTd } = buildNewPostCells(data, repoName);
  const allTh = [newTh, ...existingTh];
  const allTd = [newTd, ...existingTd];

  const thRows = chunk(allTh, 3);
  const tdRows = chunk(allTd, 3);
  const rowCount = Math.max(thRows.length, tdRows.length);
  const newTableParts: string[] = ['<table>'];
  for (let i = 0; i < rowCount; i++) {
    const thCells = thRows[i] ?? [];
    const tdCells = tdRows[i] ?? [];
    if (thCells.length > 0) {
      newTableParts.push('  <tr>\n    ' + thCells.join('\n    ') + '\n  </tr>');
    }
    if (tdCells.length > 0) {
      newTableParts.push('  <tr>\n    ' + tdCells.join('\n    ') + '\n  </tr>');
    }
  }
  newTableParts.push('</table>');
  const newTableSection = newTableParts.join('\n\n');

  content = content.slice(0, tableStart) + newTableSection + content.slice(tableEnd + '</table>'.length);
  writeFileSync(readmePath, content, 'utf-8');
}


function runAdd(templateType: TemplateType, title: string): void {
  const root = process.cwd();
  const data = generatePostData(root, title);
  createPost(root, templateType, data);
  prependPostBlock(root, data);
  insertReadmeTable(root, data, 'alan-oliv/unstable-thought-diffusion');
  console.log(`Created post: ${data.slug}`);
  console.log(`  Title: ${data.title}`);
  console.log(`  Date: ${data.dateDisplay}`);
  console.log(`  Read time: ${data.readTime} min`);
  console.log(`  Add thumbnail.png (and optional article-0N.png) to ${data.slug}/static/`);
}

const program = new Command();

program
  .name('cli')
  .description('CLI for adding new blog posts from templates')
  .version('1.0.0');

program
  .command('add')
  .description('Create a new post from a template')
  .requiredOption(
    '-t, --template <type>',
    'Template type: essay | concept | story | short',
    (value: string) => {
      if (TEMPLATE_TYPES.includes(value as TemplateType)) return value as TemplateType;
      throw new Error(`Template must be one of: ${TEMPLATE_TYPES.join(', ')}`);
    }
  )
  .requiredOption('-n, --title <title>', 'Post title (slug is derived from it)')
  .action((options: { template: TemplateType; title: string }) => {
    runAdd(options.template, options.title);
  });

program.parse();
