import fs from 'fs';
import path from 'path';

class Database {
  constructor() {
    this.filepath = path.resolve('./database.json');
    this.data = { groups: {}, users: {} };
    this.load();
  }

  // Membaca database dari disk
  load() {
    try {
      if (fs.existsSync(this.filepath)) {
        this.data = JSON.parse(fs.readFileSync(this.filepath, 'utf8'));
      } else {
        this.save();
      }
    } catch (err) {
      this.data = { groups: {}, users: {} };
    }
  }

  // Menyimpan database ke disk
  save() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Gagal menyimpan database lokal:', err);
    }
  }

  // Mengambil data grup
  getGroup(jid) {
    if (!this.data.groups[jid]) {
      this.data.groups[jid] = { plugins: {} };
      this.save();
    }
    return this.data.groups[jid];
  }

  // Menyimpan konfigurasi aktif/nonaktif plugin per grup
  setGroupPlugin(jid, pluginName, status) {
    const group = this.getGroup(jid);
    group.plugins[pluginName] = status;
    this.save();
  }

  // Mengecek apakah plugin aktif di grup bersangkutan
  isPluginEnabled(jid, pluginName) {
    const group = this.getGroup(jid);
    return !!group.plugins[pluginName];
  }
}

export default new Database();
