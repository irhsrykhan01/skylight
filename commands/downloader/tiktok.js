import { downloaderService, handleDownloaderError } from '../../services/downloader.js';

export default {
  name: 'tiktok',
  alias: ['tt', 'ttdl'],
  category: 'downloader',
  desc: 'Mengunduh video atau slide foto dari TikTok.',
  cooldown: 5,
  async execute(m, { sock, args }) {
    const url = args[0];
    if (!url) return m.reply('Ketik tautan TikTok yang ingin diunduh setelah perintah. Contoh: .tiktok https://www.tiktok.com/...');

    await m.react('⏳');
    
    try {
      const result = await downloaderService.downloadTikTok(url);
      
      let caption = `🎬 *Downloader*\n`;
      caption += `━━━━━━━━━━━━━━\n`;
      caption += `• *Platform :* TikTok\n`;
      caption += `• *Status   :* Success\n`;
      caption += `• *Quality  :* ${result.quality || 'Default'}\n`;
      caption += `• *Size     :* ${result.size || 'Unknown'}\n`;
      if (result.title) caption += `• *Title    :* _${result.title}_\n`;
      caption += `━━━━━━━━━━━━━━`;

      // Jika TikTok berupa slide foto (TikTok Slide Show)
      if (result.images && Array.isArray(result.images)) {
        for (const imgUrl of result.images) {
          await sock.sendMessage(m.from, { image: { url: imgUrl } }, { quoted: m.raw });
        }
        await m.reply(caption);
      } else {
        // Kirim sebagai Video
        await sock.sendMessage(m.from, {
          video: { url: result.url },
          caption: caption
        }, { quoted: m.raw });
      }
      
      await m.react('✅');
    } catch (err) {
      await m.react('❌');
      await handleDownloaderError(m, err);
    }
  }
};
