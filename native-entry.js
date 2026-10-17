import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

if (Capacitor.isNativePlatform()) {
  window.runlooNative = {
    async get(key) { return (await Preferences.get({ key })).value; },
    async set(key, value) { await Preferences.set({ key, value }); },
    async exportBackup(text, filename) {
      const file = await Filesystem.writeFile({
        path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8,
      });
      // OSが読む時間を確保するため、一時ファイルはCacheに保持する。
      await Share.share({ title: '皇居RUNLOOのバックアップ', files: [file.uri] });
    },
  };
}
await import('./app.js');
