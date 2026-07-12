import { downloaderService, handleDownloaderError } from '../../lib/downloader.js';

export default {
  name: 'youtube',
  alias: ['yt', 'ytdl', 'ytmp4'],
  category: 'downloader',
  desc: 'Mengunduh video dari YouTube.',
  cooldown: 5,
  async execute(m, { sock, args }) {
    const url = args[0];
    if (!url) return m.reply('Ketik tautan YouTube yang ingin diunduh setelah perintah. Contoh: .youtube https://youtu.be/...');

    await m.react('⏳');
    
    try {
      // Memanggil fungsi download universal
      const result = await downloaderService.download(url, 'youtube');
      
      let caption = `🎬 *Downloader*\n`;
      caption += `━━━━━━━━━━━━━━\n`;
      caption += `• *Platform :* YouTube\n`;
      caption += `• *Status   :* Success\n`;
      caption += `• *Quality  :* ${result.quality || 'Default'}\n`;
      caption += `• *Size     :* ${result.size || 'Unknown'}\n`;
      if (result.title) caption += `• *Title    :* _${result.title}_\n`;
      caption += `━━━━━━━━━━━━━━`;

      await sock.sendMessage(m.from, {
        video: { url: result.url },
        caption: caption
      }, { quoted: m.raw });
      
      await m.react('✅');
    } catch (err) {
      await m.react('❌');
      await handleDownloaderError(m, err);
    }
  }
};
