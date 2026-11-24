#!/usr/bin/env node
// Concept artwork only; these files never replace installed or in-app assets.
import fs from 'node:fs/promises';
import {loadSharp} from './paths.mjs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets/icon-options-color');
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

const originalColors = ['#0098FF', '#FF8800', '#43E700', '#FFFFFF'];
const options = [
  {
    id: 'A', name: '原彩白底', caption: '保留原标三色，品牌最直接',
    palette: ['#FFFFFF', '#0098FF', '#FF8800', '#43E700'],
    body: tile('#FFFFFF', '#E8E8E8') + place(symbol(originalColors)),
  },
  {
    id: 'B', name: '腾讯蓝白', caption: '大面积品牌蓝，简洁醒目',
    palette: ['#0052D9', '#FFFFFF', '#B5C7FF', '#618DFF'],
    body: tile('#0052D9') + place(symbol(['#FFFFFF', '#618DFF', '#B5C7FF', '#0052D9'])),
  },
  {
    id: 'C', name: '彩色叠帧', caption: '素材画面叠放，更像生产工具',
    palette: ['#F2F3FF', '#0052D9', '#FF8800', '#43E700'],
    body: tile('#F2F3FF', '#D9E1FF') +
      `<rect x="218" y="229" width="588" height="478" rx="92" fill="#B5C7FF"/>` +
      `<rect x="185" y="280" width="654" height="499" rx="94" fill="#FFFFFF"/>` +
      place(symbol(['#0052D9', '#FF8800', '#43E700', '#FFFFFF']), 259, 321, 15.5),
  },
  {
    id: 'D', name: '青绿取景', caption: '蓝绿搭配，强调视频理解',
    palette: ['#E3F9E9', '#0052D9', '#2BA471', '#92DAB2'],
    body: tile('#E3F9E9', '#C6F3D7') +
      `<path d="M295 374v-64q0-25 25-25h64M640 285h64q25 0 25 25v64M729 650v64q0 25-25 25h-64M384 739h-64q-25 0-25-25v-64" fill="none" stroke="#008858" stroke-width="21" stroke-linecap="round"/>` +
      place(symbol(['#0052D9', '#92DAB2', '#2BA471', '#FFFFFF']), 281, 275, 14.2),
  },
  {
    id: 'E', name: '深蓝剪辑', caption: '深蓝底配原彩，突出剪辑感',
    palette: ['#001A57', '#0098FF', '#FF8800', '#43E700'],
    body: tile('#001A57') +
      `<defs><mask id="cuts"><rect width="1024" height="1024" fill="white"/><path d="M614 225L584 377M460 655L427 816" stroke="black" stroke-width="18"/></mask></defs>` +
      `<g mask="url(#cuts)">${place(symbol(originalColors))}</g>`,
  },
  {
    id: 'F', name: '彩色纯标', caption: '不加底板，原标轮廓更自由',
    palette: ['#0098FF', '#FF8800', '#43E700', '#FFFFFF'],
    body: `<g transform="translate(83 78) scale(26)">${p(0, 'none', 'stroke="#FFFFFF" stroke-width=".45"')}${p(1, 'none', 'stroke="#FFFFFF" stroke-width=".45"')}${symbol(originalColors)}</g>`,
  },
];
await fs.mkdir(output, {recursive: true});
for (const option of options) {
  const source = svg(option.body);
  await fs.writeFile(path.join(output, `${option.id}.svg`), source);
  await sharp(Buffer.from(source)).png().toFile(path.join(output, `${option.id}.png`));
}

// Large icons and actual-size samples share one board for an honest comparison.
let board = `<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="1190" viewBox="0 0 1680 1190"><rect width="1680" height="1190" fill="#EEEEEE"/><text x="80" y="72" font-family="PingFang SC, sans-serif" font-size="30" font-weight="600" fill="#222222">姚同学  /  彩色 App 图标</text><text x="80" y="108" font-family="PingFang SC, sans-serif" font-size="17" fill="#777777">腾讯视频原标三色与 TDesign 色板　图标内不放文字</text>`;
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
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({scope:'Color concepts for macOS launch icon only; installed artwork unchanged', references:[{name:"TDesign official light palette",url:"https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_light.less"},{name:"Tencent Video original logo",url:"https://vfiles.gtimg.cn/tvideo2/channel-vue/assets/logo-Ckf4UreJ.svg",source:"Existing project vector, originally extracted from the official SVG"}], options:options.map(({id,name,caption,palette})=>({id,name,caption,palette}))}, null, 2)+'\n');
console.log('Created six independent color icon concepts and a comparison board. No installed icons changed.');
