import fs from 'node:fs/promises';
import {loadSharp} from './paths.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import crypto from 'node:crypto';

// All artwork is fetched from public, official Tencent / WeTV product pages.
// Keep source information alongside the optimized local files for review.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets/home-posters');
const cache = path.join(root, 'build/home-poster-downloads');
const require = createRequire(import.meta.url);
const sharp = loadSharp();
const run = promisify(execFile);
const selected = [
  {id: 'three-body', title: '三体', category: '剧集', cid: 'h31rop8wfso9jnh'},
  {id: 'the-untamed', title: '陈情令', category: '剧集', cid: 'gnwjazjgmg997xg'},
  {id: 'joy-of-life', title: '庆余年', category: '剧集', cid: 'e1028wfqyv7e32s'},
  {id: 'dream-of-splendor', title: '梦华录', category: '剧集', cid: 'o5fcepqss9muv1v'},
  {id: 'the-long-season', title: '漫长的季节', category: '剧集', cid: 'srw3kfh68aa9y3b'},
  {id: 'soul-land', title: '斗罗大陆', category: '动漫', cid: 'wzx7pbebgpxlqqr'},
  {id: 'roast', title: '吐槽大会 第1季', category: '综艺', cid: 'k85ho8zywwoi2tq'},
  {id: 'grandmaster', title: '魔道祖师', category: '动漫', cid: 'r8t02fkxr9jyvvn'},
  {id: 'lost-you-forever', title: '长相思 第一季', category: '剧集', cid: 'yk9j5qmbfiqfnyn'},
  {id: 'the-coming-one-girls', title: '明日之子 水晶时代', category: '综艺', cid: 'p984w2pq56ttxfk'},
];
await fs.mkdir(output, {recursive:true});
await fs.mkdir(cache, {recursive:true});
const download = async (url, dest) => run('/usr/bin/curl', ['--silent', '--show-error', '--location', '--fail', '--retry', '2', '--max-time', '45', url, '-o', dest]);
const entries = [];
const unavailable = [];
for (let start = 0; start < selected.length; start += 4) {
  const batch = await Promise.allSettled(selected.slice(start, start + 4).map(async item => {
    const officialPage = `https://v.wetv.vip/zh-cn/play/${item.cid}`;
    const pageFile = path.join(cache, item.id + '.html');
    await download(officialPage, pageFile);
    const html = await fs.readFile(pageFile, 'utf8');
    const pageTitle = html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
    const decoded = html.replaceAll('\\u0026','&').replaceAll('\\/','/');
    const imageUrl = decoded.match(new RegExp(`https://vcover-vt-pic\\.wetvinfo\\.com/vcover_vt_pic/0/${item.cid}[^\\s<>"\\\\]+`))?.[0];
    if (!imageUrl) throw new Error('No official vertical poster found: ' + item.title + ' / ' + pageTitle);
    const rawFile = path.join(cache, item.id + '.original');
    await download(imageUrl, rawFile);
    const original = await sharp(rawFile).metadata();
    if (!original.width || !original.height || original.width < 200 || original.height < 300) throw new Error('Poster too small: ' + item.title);
    const name = item.id + '.jpg';
    const bytes = await sharp(rawFile).rotate().resize({width: 640, withoutEnlargement:true}).jpeg({quality:85, mozjpeg:true}).toBuffer();
    const metadata = await sharp(bytes).metadata();
    await fs.writeFile(path.join(output,name), bytes);
    return {...item, officialPage, pageTitle, imageUrl, localFile:name, width:metadata.width, height:metadata.height, bytes:bytes.length, sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  }));
  for (let i=0;i<batch.length;i++) {
    if (batch[i].status === 'fulfilled') entries.push(batch[i].value);
    else unavailable.push({title:selected[start+i].title, reason:String(batch[i].reason)});
  }
  process.stdout.write(`Prepared ${entries.length}/${selected.length} official posters\n`);
}
const manifest = {downloadedAt:new Date().toISOString(), purpose:'姚同学首页腾讯视频代表作品海报背景', selectionNote:'代表作品精选，不表示播放量、热度或历史排名；来自腾讯官方 WeTV 中文页面的国际发行竖版海报，部分片名为英文。', entries, unavailable};
await fs.writeFile(path.join(output,'manifest.json'), JSON.stringify(manifest,null,2) + '\n');
process.stdout.write(`Saved ${entries.length} posters / ${entries.reduce((n,x)=>n+x.bytes,0)} bytes\n`);
if (entries.length < 8) process.exitCode = 1;
