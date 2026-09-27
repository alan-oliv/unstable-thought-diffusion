// Regenerates everything derived from POSTS.md: the README table, each post's
// header badges and, when a path is given, the profile README's "Latest thoughts".
// Usage: node build.mjs [path/to/profile/README.md]
import { readFileSync, writeFileSync } from 'node:fs';

const REPO = 'alan-oliv/unstable-thought-diffusion';
const BLOB = `https://github.com/${REPO}/blob/main`;
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WORDS_PER_MINUTE = 200;
const PROFILE_POST_COUNT = 6;
const START = '<!-- posts:start -->';
const END = '<!-- posts:end -->';

const badge = (path, scale) =>
  `https://badgen.net/badge/${path}/darkgray?scale=${scale}&labelColor=darkgray&color=darkgray&cache=360000`;

function parsePosts(md) {
  return md
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const title = block.split('\n')[0].trim();
      const id = block.match(/^- id: (.+)$/m)?.[1].trim();
      const date = block.match(/^- date: (\d{4}-\d{2}-\d{2})$/m)?.[1];
      if (!id || !date) throw new Error(`POSTS.md: "${title}" needs "- id:" and "- date: YYYY-MM-DD"`);
      const [y, m, d] = date.split('-').map(Number);
      return { title, id, date, month: MONTHS[m - 1], day: d, year: y };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function readTime(markdown) {
  const text = markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ');
  const words = text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function replaceBetweenMarkers(content, inner, file) {
  const start = content.indexOf(START);
  const end = content.indexOf(END);
  if (start === -1 || end < start) throw new Error(`${file}: missing ${START} / ${END}`);
  return content.slice(0, start + START.length) + '\n' + inner + '\n' + content.slice(end);
}

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

const postHeader = (p) => `<p>
  <img alt="" src="${badge(`${p.month}/${p.day},%20${p.year}`, 1.1)}"  />
  <img alt="" src="${badge(`${p.readTime}/min%20read`, 1.1)}" />
</p>`;

const blogThumb = (p) => `    <th width="33%">
      <a href="${BLOB}/${p.id}/README.md">
        <img alt="" src="./${p.id}/static/thumbnail.png"></img>
      </a>
    </th>`;

const blogCaption = (p) => `    <td width="33%">
      <a href="${BLOB}/${p.id}/README.md">
        <br/>
        <img alt="" src="${badge(`${p.readTime}/min%20read`, 1)}" />
        <br/>
        ${p.title}
      </a>
      <br/>
      <p>${p.month} ${p.day}, ${p.year}</p>
    </td>`;

const blogTable = (posts) =>
  '<table>\n' +
  chunk(posts, 3)
    .map((row) => `  <tr>\n${row.map(blogThumb).join('\n')}\n  </tr>\n  <tr>\n${row.map(blogCaption).join('\n')}\n  </tr>`)
    .join('\n\n') +
  '\n</table>';

const profileCells = (p) => `    <td width="27%">
      <a href="${BLOB}/${p.id}/README.md">
        <img alt="" src="${RAW}/${p.id}/static/hor-thumbnail.png" width="100%" />
      </a>
    </td>
    <td width="23%">
      <img alt="" src="${badge(`${p.readTime}/min%20read`, 1)}" width="66px" /><br/>
      <a href="${BLOB}/${p.id}/README.md">
        ${p.title}
      </a>
      <br/>
      <em>${p.month} ${p.day}, ${p.year}</em>
    </td>`;

const profileTable = (posts) =>
  '<table>\n' +
  chunk(posts, 2)
    .map((row) => `  <tr>\n${row.map(profileCells).join('\n')}\n  </tr>`)
    .join('\n') +
  '\n</table>';

const posts = parsePosts(readFileSync('POSTS.md', 'utf-8'));

for (const post of posts) {
  const file = `${post.id}/README.md`;
  const content = readFileSync(file, 'utf-8');
  post.readTime = readTime(content);
  if (!/^<p>[\s\S]*?<\/p>/.test(content)) throw new Error(`${file}: must start with the <p> badge header`);
  writeFileSync(file, content.replace(/^<p>[\s\S]*?<\/p>/, postHeader(post)));
}

// The blog site reads link and readTime straight from POSTS.md.
const postsMd = readFileSync('POSTS.md', 'utf-8');
const postEntry = (p) =>
  `## ${p.title}\n\n- id: ${p.id}\n- date: ${p.date}\n- link: /posts/${p.id}\n- readTime: ${p.readTime}\n`;
writeFileSync('POSTS.md', postsMd.slice(0, postsMd.search(/^## /m)) + posts.map(postEntry).join('\n'));

writeFileSync('README.md', replaceBetweenMarkers(readFileSync('README.md', 'utf-8'), blogTable(posts), 'README.md'));

const profilePath = process.argv[2];
if (profilePath) {
  const content = readFileSync(profilePath, 'utf-8');
  writeFileSync(profilePath, replaceBetweenMarkers(content, profileTable(posts.slice(0, PROFILE_POST_COUNT)), profilePath));
}

console.log(posts.map((p) => `${p.date}  ${p.readTime} min  ${p.title}`).join('\n'));
