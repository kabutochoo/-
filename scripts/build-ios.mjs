import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { build } from 'esbuild';
const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'style.css', 'privacy.html', 'support.html']) {
  await copyFile(new URL(file, root), new URL(file, out));
}
await build({
  absWorkingDir: root.pathname,
  entryPoints: ['native-entry.js'], bundle: true, outfile: new URL('app.js', out).pathname,
  format: 'esm', target: 'safari16', minify: true,
});
// オフラインで全機能とポリシーページを利用する。外部サイトの読み込みは行わない。
const html = await readFile(new URL('index.html', out), 'utf8');
await writeFile(new URL('index.html', out), html.replace('このブラウザ内', 'この端末内').replace('ブラウザのデータを消すと', 'アプリを削除すると'));
console.log('iOS用のオフラインWebアセットを dist/ に生成しました。');
