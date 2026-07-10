import { getGroupAdmins } from '../../lib/utils.js';

export default {
  name: 'kick',
  desc: 'Mengeluarkan anggota dari grup.',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5, // Batas jeda penggunaan 5 detik
  async execute(m, { sock, args }) {
    // Ambil target dari tag, reply, atau teks manual nomor telepon
    const target = m.raw.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.raw.message?.extendedTextMessage?.contextInfo?.participant || 
                   (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

    if (!target) return m.reply('Harap tag, balas pesannya, atau ketik nomor anggota yang ingin dikeluarkan.');

    const admins = await getGroupAdmins(sock, m.from);
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    
    if (!admins.includes(botId)) {
      return m.reply('Gagal mengeksekusi: Bot harus menjadi Admin grup terlebih dahulu.');
    }

    if (admins.includes(target)) {
      return m.reply('Gagal mengeksekusi: Anggota tersebut berstatus sebagai Admin grup.');
    }

    await sock.groupParticipantsUpdate(m.from, [target], 'remove');
    await m.reply('Anggota tersebut telah berhasil dikeluarkan dari grup.');
  }
};
