export default {
  name: 'hidetag',
  alias: ['ht'],
  desc: 'Melakukan tag ke seluruh anggota grup secara tersembunyi.',
  category: 'group',
  groupOnly: true,
  adminOnly: true,
  cooldown: 5,
  async execute(m, { sock, args }) {
    const text = args.join(' ') || 'Pengumuman Penting!';
    const metadata = await sock.groupMetadata(m.from);
    const participants = metadata.participants.map(p => p.id);

    await sock.sendMessage(m.from, {
      text,
      mentions: participants
    });
  }
};
