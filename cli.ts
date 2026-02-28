#!/usr/bin/env node
/**
 * CLI for adding new blog posts from templates.
 * Usage: npx tsx cli.ts add --template <essay|concept|story|short>
 */

import { Command } from 'commander';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import Mustache from 'mustache';

// Don't escape HTML; we're rendering markdown, not HTML.
Mustache.escape = (text: string) => text;

const TEMPLATE_TYPES = ['essay', 'concept', 'story', 'short'] as const;
type TemplateType = (typeof TEMPLATE_TYPES)[number];

const LOREM_WORDS = [
  'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
];

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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomTitle(): string {
  const numWords = randomInt(2, 4);
  const words: string[] = [];
  for (let i = 0; i < numWords; i++) {
    words.push(pick(LOREM_WORDS));
  }
  return words.join(' ');
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

function generatePostData(root: string): GeneratedPost {
  const title = generateRandomTitle();
  const baseSlug = slugify(title) || `post-${Date.now()}`;
  const slug = ensureUniqueSlug(baseSlug, root);
  const d = new Date();
  const dateIso = d.toISOString().slice(0, 10);
  return {
    title,
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

function createPost(root: string, templateType: TemplateType, data: GeneratedPost): void {
  const templatesDir = join(root, 'templates');
  const templatePath = join(templatesDir, `${templateType}.md`);
  const template = readFileSync(templatePath, 'utf-8');
  const content = renderTemplate(template, data);

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

function buildNewTableHtml(data: GeneratedPost, repoName: string): string {
  const badgeUrl =
    'https://badgen.net/badge/' + data.readTime + '/min%20read/darkgray?scale=1&labelColor=darkgray&color=darkgray&cache=360000';
  const baseUrl = 'https://github.com/' + repoName + '/blob/main';
  const thumbnailSrc = './' + data.slug + '/static/thumbnail.png';
  const linkHref = baseUrl + '/' + data.slug + '/README.md';
  return (
    '\n<table>\n  <tr>\n    <th width="33%">\n      <a href="' +
    linkHref +
    '">\n        <img alt="" src="' +
    thumbnailSrc +
    '"></img>\n      </a>\n    </th>\n  </tr>\n  <tr>\n    <td width="33%">\n      <a href="' +
    linkHref +
    '">\n        <br/>\n        <img alt="" src="' +
    badgeUrl +
    '" />\n        <br/>\n        ' +
    data.title +
    '\n      </a>\n      <br/>\n      <p>' +
    data.dateDisplay +
    '</p>\n    </td>\n  </tr>\n</table>\n'
  );
}

function insertReadmeTable(root: string, data: GeneratedPost, repoName: string): void {
  const readmePath = join(root, 'README.md');
  let content = readFileSync(readmePath, 'utf-8');
  const newTable = buildNewTableHtml(data, repoName);
  content = content.trimEnd() + newTable;
  writeFileSync(readmePath, content, 'utf-8');
}


function runAdd(templateType: TemplateType): void {
  const root = process.cwd();
  const data = generatePostData(root);
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
  .description('Create a new post from a template with auto-generated placeholder data')
  .requiredOption(
    '-t, --template <type>',
    'Template type: essay | concept | story | short',
    (value: string) => {
      if (TEMPLATE_TYPES.includes(value as TemplateType)) return value as TemplateType;
      throw new Error(`Template must be one of: ${TEMPLATE_TYPES.join(', ')}`);
    }
  )
  .action((options: { template: TemplateType }) => {
    runAdd(options.template);
  });

program.parse();
