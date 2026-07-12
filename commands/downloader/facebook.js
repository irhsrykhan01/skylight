import { downloaderService, handleDownloaderError } from '../../services/downloader.js';

export default {
  name: 'facebook',
  alias: ['fb', 'fbdl'],
  category: 'downloader',
  desc: 'Mengunduh video dari Facebook.',
  cooldown: 5,
  async execute(m, { sock, args }) {
    const url = args[0];
    if (!url) return m.reply('Ketik tautan Facebook yang ingin diunduh setelah perintah. Contoh: .facebook https://www.facebook.com/...');

    await m.react('⏳');
    
    try {
      const result = await downloaderService.downloadFacebook(url);
      
      let caption = `🎬 *Downloader*\n`;
      caption += `━━━━━━━━━━━━━━\n`;
      caption += `• *Platform :* Facebook\n`;
      caption += `• *Status   :* Success\n`;
      caption += `• *Quality  :* ${result.quality || 'Default'}\n`;
      caption += `• *Size     :* ${result.size || 'Unknown'}\n`;
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
