class MessageStore {
  constructor() {
    this.messages = new Map();
  }

  // Menyimpan pesan masuk
  save(m) {
    if (!m || !m.id || !m.body) return;
    this.messages.set(m.id, {
      id: m.id,
      body: m.body,
      sender: m.sender,
      pushName: m.pushName
    });

    // Otomatis hapus pesan dari memori setelah 1 jam agar hemat RAM
    setTimeout(() => {
      this.messages.delete(m.id);
    }, 3600 * 1000);
  }

  // Mengambil data pesan berdasarkan ID
  get(id) {
    return this.messages.get(id);
  }
}

export default new MessageStore();
