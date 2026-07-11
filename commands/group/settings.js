import database from '../../lib/database.js';

const groupPlugins = [
  { name: "anti-link", label: "Anti Link" },
  { name: "anti-spam", label: "Anti Spam" },
  { name: "anti-tagall", label: "Anti Tag All" },
  { name: "anti-tagsw", label: "Anti Tag SW" },
  { name: "welcome", label: "Welcome" },
  { name: "goodbye", label: "Goodbye" },
  { name: "anti-delete", label: "Anti Delete" },
  { name: "anti-toxic", label: "Anti Toxic" }
];

export default {
  name: "settings",
  alias: ["set", "setplugin"],
  category: "group",
  desc: "Mengelola pengaturan fitur moderasi grup.",
  groupOnly: true,
  adminOnly: true,
  async execute(m, { sock, args }) {
    const subCommand = args[0]?.toLowerCase();

    // 1. Logika Mengubah Status Fitur (.setplugin on/off <plugin-name>)
    if (subCommand === 'on' || subCommand === 'off') {
      const targetPl = args[1]?.toLowerCase();
      const plExists = groupPlugins.find(p => p.name === targetPl);
      if (!plExists) return m.reply(`Plugin "${targetPl}" tidak ditemukan.`);

      const status = subCommand === 'on';
      database.setGroupPlugin(m.from, targetPl, status);
      await m.react(status ? '🟢' : '🔴');
      return m.reply(`Berhasil mengubah status *${plExists.label}* menjadi *${status ? '🟢 ON' : '🔴 OFF'}* untuk grup ini.`);
    }

    // 2. Logika Pemrosesan Baris yang dipilih (.setplugin select <plugin-name>)
    if (subCommand === 'select') {
      const targetPl = args[1]?.toLowerCase();
      const plExists = groupPlugins.find(p => p.name === targetPl);
      if (!plExists) return m.reply(`Plugin "${targetPl}" tidak ditemukan.`);

      const isEnabled = database.isPluginEnabled(m.from, targetPl);
      const currentStatusText = isEnabled ? "🟢 ON (Aktif)" : "🔴 OFF (Nonaktif)";

      // Kirim Reply Buttons menggunakan m.menu Smart Fallback
      return await m.menu({
        title: `⚙️ PENGATURAN ${plExists.label.toUpperCase()}`,
        body: `Atur status untuk fitur *${plExists.label}* di grup ini.\n\n*Status saat ini:* ${currentStatusText}`,
        footer: "SkyLight Settings System",
        buttons: [
          { display_text: "🟢 ON", id: `.setplugin on ${targetPl}` },
          { display_text: "🔴 OFF", id: `.setplugin off ${targetPl}` }
        ]
      });
    }

    // 3. Menampilkan Menu Utama Pengaturan (List Message)
    const rows = groupPlugins.map(pl => {
      const isEnabled = database.isPluginEnabled(m.from, pl.name);
      const statusEmoji = isEnabled ? "🟢" : "🔴";
      return {
        title: `${statusEmoji} ${pl.label}`,
        id: `.setplugin select ${pl.name}`,
        description: `Ubah konfigurasi status fitur ${pl.label}`
      };
    });

    return await m.menu({
      title: "🛡️ PENGATURAN MODERASI GRUP",
      body: "Pilih salah satu fitur di bawah ini untuk mengaktifkan atau menonaktifkannya di grup ini:",
      footer: "SkyLight Moderation Tools",
      sections: [
        {
          title: "FITUR MODERASI",
          rows: rows
        }
      ]
    });
  }
};
