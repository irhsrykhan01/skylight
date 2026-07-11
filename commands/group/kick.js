import { getGroupAdmins, decodeJid } from '../../lib/utils.js';

export default {
  name: 'kick',
  desc: 'Mengeluarkan anggota dari grup.',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async execute(m, { sock, args }) {
    // Mengekstrak JID target secara aman
    const rawTarget = m.raw.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                      m.raw.message?.extendedTextMessage?.contextInfo?.participant || 
                      (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

    if (!rawTarget) return m.reply('Harap tag, balas pesannya, atau ketik nomor anggota yang ingin dikeluarkan.');

    const target = decodeJid(rawTarget); // Dekode target JID
    const botId = decodeJid(sock.user.id); // Dekode bot JID secara bersih (bebas bug @s.whatsapp.net ganda)
    
    const admins = await getGroupAdmins(sock, m.from);
    
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
