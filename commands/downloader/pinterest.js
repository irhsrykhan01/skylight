import { downloaderService, handleDownloaderError } from '../../lib/downloader.js';

export default {
  name: 'pinterest',
  alias: ['pin', 'pindl'],
  category: 'downloader',
  desc: 'Mengunduh media dari Pinterest.',
  cooldown: 5,
  async execute(m, { sock, args }) {
    const url = args[0];
    if (!url) return m.reply('Ketik tautan Pinterest yang ingin diunduh setelah perintah. Contoh: .pinterest https://pinterest.com/pin/...');

    await m.react('⏳');
    
    try {
      // Memanggil fungsi download universal
      const result = await downloaderService.download(url, 'pinterest');
      
      let caption = `🎬 *Downloader*\n`;
      caption += `━━━━━━━━━━━━━━\n`;
      caption += `• *Platform :* Pinterest\n`;
      caption += `• *Status   :* Success\n`;
      caption += `• *Quality  :* ${result.quality || 'Default'}\n`;
      caption += `• *Size     :* ${result.size || 'Unknown'}\n`;
      caption += `━━━━━━━━━━━━━━`;

      if (result.type === 'video') {
        await sock.sendMessage(m.from, {
          video: { url: result.url },
          caption: caption
        }, { quoted: m.raw });
      } else {
        await sock.sendMessage(m.from, {
          image: { url: result.url },
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
