import { downloaderService, handleDownloaderError } from '../../services/downloader.js';

export default {
  name: 'instagram',
  alias: ['ig', 'igdl', 'instagramdl'],
  category: 'downloader',
  desc: 'Mengunduh foto atau video dari Instagram.',
  cooldown: 5,
  async execute(m, { sock, args }) {
    const url = args[0];
    if (!url) return m.reply('Ketik tautan Instagram yang ingin diunduh setelah perintah. Contoh: .instagram https://www.instagram.com/p/...');

    await m.react('⏳');
    
    try {
      const result = await downloaderService.downloadInstagram(url);
      
      let caption = `🎬 *Downloader*\n`;
      caption += `━━━━━━━━━━━━━━\n`;
      caption += `• *Platform :* Instagram\n`;
      caption += `• *Status   :* Success\n`;
      caption += `• *Quality  :* ${result.quality || 'Default'}\n`;
      caption += `• *Size     :* ${result.size || 'Unknown'}\n`;
      caption += `━━━━━━━━━━━━━━`;

      // Kirim Gambar atau Video secara dinamis tergantung tipe media
      if (result.type === 'image') {
        await sock.sendMessage(m.from, {
          image: { url: result.url },
          caption: caption
        }, { quoted: m.raw });
      } else {
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
