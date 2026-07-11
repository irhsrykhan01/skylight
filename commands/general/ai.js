export default {
  name: 'ai',
  alias: ['gpt', 'skybot'],
  category: 'general',
  desc: 'Bertanya sesuatu kepada asisten pintar SkyLight AI.',
  async execute(m, { args }) {
    const query = args.join(' ');
    if (!query) return m.reply('Ketik pertanyaan Anda setelah perintah. Contoh: .ai apa itu SkyLight?');

    await m.react('🧠');

    // Jeda sejenak untuk simulasi berpikir
    await new Promise(resolve => setTimeout(resolve, 800));

    const responses = [
      "Pertanyaan yang bagus! SkyLight dibangun sebagai pondasi kokoh untuk SkyVerse menggunakan Node.js ES Module.",
      "Tentu! Anda bisa menambahkan perintah, event, atau plugin baru secara instan tanpa mengganggu core framework saya.",
      "Sebagai asisten pintar, saya diprogram untuk menjadi ringan, cepat, dan mudah dipahami oleh pengembang.",
      "Ada yang bisa saya bantu lagi mengenai framework SkyLight ini?"
    ];

    let replyText = `*🤖 [SKYLIGHT AI] 🤖*\n\n`;
    
    // Logika kata kunci pintar sederhana
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('skylight') || lowerQuery.includes('bot')) {
      replyText += `SkyLight adalah sebuah framework bot WhatsApp modern berbasis Baileys yang ringan dan mengusung filosofi "Extend, Don't Modify".`;
    } else if (lowerQuery.includes('siapa') || lowerQuery.includes('kamu')) {
      replyText += `Saya adalah SkyLight AI, model kecerdasan buatan asisten Anda yang ditanamkan langsung pada bot ini.`;
    } else {
      // Pilih jawaban acak yang relevan
      replyText += responses[Math.floor(Math.random() * responses.length)] + `\n\n_(Pertanyaan Anda: "${query}")_`;
    }

    await m.reply(replyText);
    await m.react('💡');
  }
};
