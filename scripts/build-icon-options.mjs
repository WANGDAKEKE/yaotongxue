#!/usr/bin/env node
// Concept artwork only; these files never replace installed or in-app assets.
import fs from 'node:fs/promises';
import {loadSharp} from './paths.mjs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets/icon-options');
const require = createRequire(import.meta.url);
const sharp = loadSharp();
const mark = await fs.readFile(path.join(root, 'assets/yingqing-mark.svg'), 'utf8');
const paths = [...mark.matchAll(/<path\s+d="([^"]+)"\s+fill="([^"]+)"\s*\/>/g)].map(m => m[1]);
if (paths.length !== 4) throw Error('Expected original Tencent Video four-path geometry');
const p = (i, fill, attrs = '') => `<path d="${paths[i]}" fill="${fill}" ${attrs}/>`;
const symbol = (fills, attrs = '') => paths.map((_, i) => p(i, fills[i], attrs)).join('');
const tile = (fill, stroke = fill) => `<rect x="80" y="80" width="864" height="864" rx="196" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const place = (content, x = 194, y = 187, scale = 19.5) => `<g transform="translate(${x} ${y}) scale(${scale})">${content}</g>`;
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;

const options = [
  {
    id: 'A', name: '墨白', caption: '深色底，清楚利落',
    body: tile('#232323') + place(symbol(['#F0F0F0', '#686868', '#B9B9B9', '#232323'])),
  },
  {
    id: 'B', name: '线构', caption: '细线轮廓，更轻更克制',
    body: tile('#F8F8F8', '#DEDEDE') + place(
      p(0, 'none', 'stroke="#333333" stroke-width="1.04" stroke-linejoin="round"') +
      p(1, 'none', 'stroke="#A1A1A1" stroke-width=".62"') +
      p(2, 'none', 'stroke="#A1A1A1" stroke-width=".62"') +
      p(3, '#333333'), 194, 187, 19.5),
  },
  {
    id: 'C', name: '叠帧', caption: '两层画面，突出素材生产',
    body: tile('#E6E6E6', '#D3D3D3') +
      `<rect x="218" y="229" width="588" height="478" rx="92" fill="#A5A5A5"/>` +
      `<rect x="185" y="280" width="654" height="499" rx="94" fill="#FFFFFF"/>` +
      place(symbol(['#343434', '#CACACA', '#909090', '#FFFFFF']), 259, 321, 15.5),
  },
  {
    id: 'D', name: '取景', caption: '取景框，强调视频理解',
    body: tile('#F1F1F1', '#DADADA') +
      `<path d="M295 374v-64q0-25 25-25h64M640 285h64q25 0 25 25v64M729 650v64q0 25-25 25h-64M384 739h-64q-25 0-25-25v-64" fill="none" stroke="#343434" stroke-width="21" stroke-linecap="round"/>` +
      place(symbol(['#444444', '#BCBCBC', '#858585', '#FFFFFF']), 281, 275, 14.2),
  },
  {
    id: 'E', name: '切片', caption: '沿标志切分，带一点剪辑感',
    body: tile('#292929') +
      `<defs><mask id="cuts"><rect width="1024" height="1024" fill="white"/><path d="M614 225L584 377M460 655L427 816" stroke="black" stroke-width="18"/></mask></defs>` +
      `<g mask="url(#cuts)">${place(symbol(['#EAEAEA', '#707070', '#B1B1B1', '#292929']))}</g>`,
  },
  {
    id: 'F', name: '纯标', caption: '去掉底板，保留品牌轮廓',
    body: `<g transform="translate(83 78) scale(26)">${p(0, 'none', 'stroke="#F4F4F4" stroke-width=".7"')}${p(1, 'none', 'stroke="#F4F4F4" stroke-width=".7"')}${symbol(['#454545', '#A5A5A5', '#D0D0D0', '#FFFFFF'])}</g>`,
  },
];
await fs.mkdir(output, {recursive: true});
for (const option of options) {
  const source = svg(option.body);
  await fs.writeFile(path.join(output, `${option.id}.svg`), source);
  await sharp(Buffer.from(source)).png().toFile(path.join(output, `${option.id}.png`));
}

// Large icons and actual-size samples share one board for an honest comparison.
let board = `<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="1190" viewBox="0 0 1680 1190"><rect width="1680" height="1190" fill="#EEEEEE"/><text x="80" y="72" font-family="PingFang SC, sans-serif" font-size="30" font-weight="600" fill="#222222">姚同学  /  App 图标方向</text><text x="80" y="108" font-family="PingFang SC, sans-serif" font-size="17" fill="#777777">腾讯视频标志衍生　灰白配色　图标内不放文字</text>`;
for (let i = 0; i < options.length; i++) {
  const option = options[i];
  const x = 80 + (i % 3) * 540;
  const y = 148 + Math.floor(i / 3) * 510;
  const uri = `data:image/svg+xml;base64,${Buffer.from(svg(option.body)).toString('base64')}`;
  board += `<g transform="translate(${x} ${y})"><rect width="500" height="470" rx="24" fill="#F9F9F9"/><image href="${uri}" x="110" y="17" width="280" height="280"/><text x="34" y="332" font-family="PingFang SC, sans-serif" font-size="25" font-weight="600" fill="#222222">${option.id}  ${option.name}</text><text x="34" y="365" font-family="PingFang SC, sans-serif" font-size="18" fill="#777777">${option.caption}</text><image href="${uri}" x="34" y="398" width="48" height="48"/><image href="${uri}" x="96" y="406" width="32" height="32"/><rect x="162" y="391" width="304" height="62" rx="13" fill="#353535"/><image href="${uri}" x="174" y="398" width="48" height="48"/><image href="${uri}" x="236" y="406" width="32" height="32"/></g>`;
}
board += '</svg>';
await fs.writeFile(path.join(output, 'comparison.svg'), board);
await sharp(Buffer.from(board)).png().toFile(path.join(output, 'comparison.png'));
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({scope:'Concepts for macOS launch icon only; installed artwork unchanged', options:options.map(({id,name,caption})=>({id,name,caption}))}, null, 2)+'\n');
console.log('Created six independent icon concepts and a comparison board. No installed icons changed.');
