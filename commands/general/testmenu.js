export default {
  name: 'testmenu',
  alias: ['test', 'tm'],
  category: 'general',
  desc: 'Menguji fungsionalitas tombol interaktif dan list WhatsApp Business.',
  async execute(m, { args }) {
    const type = args[0]?.toLowerCase();

    // 1. PENGUJIAN TOMBOL (REPLY BUTTONS)
    if (type === 'buttons' || type === 'button' || type === '1') {
      return await m.menu({
        title: "🧪 PENGUJIAN REPLY BUTTONS",
        body: "Halo! Ini adalah demo pengiriman tombol interaktif.\nSilakan klik salah satu tombol di bawah untuk memicu respon bot secara otomatis.",
        footer: "SkyLight Interactive Tools",
        buttons: [
          { display_text: "⚡ Cek Ping Bot", id: ".ping" },
          { display_text: "📊 Statistik Server", id: ".stats" },
          { display_text: "🤖 Tanya AI", id: ".ai Siapa kamu?" }
        ]
      });
    }

    // 2. PENGUJIAN DAFTAR (LIST SELECT MESSAGE)
    if (type === 'list' || type === '2') {
      return await m.menu({
        title: "🧪 PENGUJIAN SELECT LIST",
        body: "Halo! Ini adalah demo daftar pilihan interaktif.\nSilakan klik tombol menu di bawah untuk membuka daftar aksi cepat.",
        footer: "SkyLight Interactive Tools",
        sections: [
          {
            title: "AKSI DIAGNOSTIK",
            rows: [
              { title: "Speed Latency", id: ".ping", description: "Menguji kecepatan respon bot" },
              { title: "System Stats", id: ".stats", description: "Melihat spesifikasi CPU & RAM" }
            ]
          },
          {
            title: "ASISTEN VIRTUAL",
            rows: [
              { title: "SkyLight AI Chat", id: ".ai Halo bot", description: "Mulai obrolan cerdas bersama AI" }
            ]
          }
        ]
      });
    }

    // 3. MENU UTAMA TEST (PILIHAN NAVIGASI)
    return await m.menu({
      title: "🧪 KONTROL PANEL PENGUJIAN",
      body: "Pilih salah satu mode pengujian di bawah ini:\n\n• *[1]* Uji Coba Tombol Fisik (Reply Buttons)\n• *[2]* Uji Coba Daftar Pilihan (Select List)",
      footer: "SkyLight Interactive Test Suite",
      sections: [
        {
          title: "PILIH MODE PREVIEW",
          rows: [
            { title: "1. Uji Reply Buttons", id: ".testmenu buttons", description: "Mengirimkan pesan dengan tombol klik" },
            { title: "2. Uji Select List", id: ".testmenu list", description: "Mengirimkan pesan dengan daftar pilihan" }
          ]
        }
      ]
    });
  }
};
