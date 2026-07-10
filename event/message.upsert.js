import { serialize } from '../lib/serialize.js';
import loader from '../src/core/loader.js';
import config from '../config.js';
import { logger } from '../src/core/logger.js';

export default {
  name: 'messages.upsert',
  async execute(sock, chatUpdate) {
    try {
      if (chatUpdate.type !== 'notify') return;
      const rawMsg = chatUpdate.messages[0];
      if (!rawMsg) return;
      
      // Abaikan update status/story WhatsApp
      if (rawMsg.key && rawMsg.key.remoteJid === 'status@broadcast') return; 

      // Parsing pesan masuk
      const m = await serialize(sock, rawMsg);
      if (!m) return;

      // CETAK LOG: Memudahkan pemantauan apakah WhatsApp mengirim data ke bot
      logger.info(`Pesan Masuk: [${m.pushName}] -> ${m.body || `[Tipe: ${m.type}]`}`);

      const prefix = config.prefix;
      const isCmd = m.body.startsWith(prefix);
      if (!isCmd) return; // Hiraukan jika bukan command

      // Memecah argumen dan nama command
      const args = m.body.slice(prefix.length).trim().split(/ +/);
      const cmdName = args.shift().toLowerCase();
      
      // Cari command berdasarkan nama utama atau aliasnya
      const command = loader.commands.get(cmdName) || loader.commands.get(loader.aliases.get(cmdName));
      if (!command) return;

      // Filter anti-looping diri sendiri: 
      // Hanya izinkan pesan dari diri sendiri jika pengirimnya terdaftar sebagai owner di config.js
      if (rawMsg.key.fromMe) {
        const ownerNumbers = config.owner.map(num => num.replace(/[^0-9]/g, ''));
        const senderNumber = m.sender.split('@')[0];
        if (!ownerNumbers.includes(senderNumber)) {
          return;
        }
      }

      logger.info(`Menjalankan perintah: ${prefix}${cmdName} dari ${m.pushName}`);
      await command.execute(m, { sock, args, prefix, command: cmdName });

    } catch (err) {
      logger.error('Error saat memproses messages.upsert:', err);
    }
  }
};
