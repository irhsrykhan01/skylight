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
      
      // Abaikan Story / Status WhatsApp agar bot hemat resource
      if (rawMsg.key && rawMsg.key.remoteJid === 'status@broadcast') return; 

      // Serialisasi objek pesan agar bersih dan mudah digunakan
      const m = await serialize(sock, rawMsg);
      if (!m || !m.body) return;

      const prefix = config.prefix;
      const isCmd = m.body.startsWith(prefix);
      if (!isCmd) return; // Hiraukan jika pesan biasa (bukan command)

      // Memecah argumen dan nama command
      const args = m.body.slice(prefix.length).trim().split(/ +/);
      const cmdName = args.shift().toLowerCase();
      
      // Cari command berdasarkan nama utama atau aliasnya
      const command = loader.commands.get(cmdName) || loader.commands.get(loader.aliases.get(cmdName));
      
      if (!command) return;

      // Jalankan command
      logger.info(`Menjalankan perintah: ${prefix}${cmdName} dari ${m.pushName}`);
      await command.execute(m, { sock, args, prefix, command: cmdName });

    } catch (err) {
      logger.error('Error saat memproses messages.upsert:', err);
    }
  }
};
