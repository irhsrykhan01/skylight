import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { logger } from './logger.js';

class Loader {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.plugins = new Map(); // Untuk menyimpan instance plugin
    this.events = new Map();
    
    // Penampung daftaran Hook
    this.hooks = {
      beforeMessage: [],
      afterMessage: [],
      beforeCommand: [],
      afterCommand: []
    };
  }

  getFiles(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      return [];
    }
    
    const files = [];
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        if (item.isDirectory()) {
          scan(fullPath);
        } else if (item.isFile() && item.name.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    };
    
    scan(dir);
    return files;
  }

  async loadCommands() {
    this.commands.clear();
    this.aliases.clear();
    const files = this.getFiles('./commands');
    
    for (const file of files) {
      try {
        const fileUrl = pathToFileURL(file).href + `?v=${Date.now()}`;
        const module = await import(fileUrl);
        const cmd = module.default;
        
        if (!cmd || !cmd.name) {
          logger.warn(`File command ${file} tidak mengekspor struktur default yang valid.`);
          continue;
        }

        const cmdName = cmd.name.toLowerCase();
        this.commands.set(cmdName, cmd);
        
        if (cmd.alias && Array.isArray(cmd.alias)) {
          for (const alias of cmd.alias) {
            this.aliases.set(alias.toLowerCase(), cmdName);
          }
        }
      } catch (err) {
        logger.error(`Gagal memuat command ${file}:`, err);
      }
    }
    logger.success(`Berhasil memuat ${this.commands.size} command.`);
  }

  // Memuat semua Plugin & mendaftarkan Hook mereka secara dinamis
  async loadPlugins() {
    this.plugins.clear();
    this.hooks = {
      beforeMessage: [],
      afterMessage: [],
      beforeCommand: [],
      afterCommand: []
    };

    const files = this.getFiles('./plugins');
    
    for (const file of files) {
      try {
        const fileUrl = pathToFileURL(file).href + `?v=${Date.now()}`;
        const module = await import(fileUrl);
        const plugin = module.default;

        if (!plugin || !plugin.name) {
          logger.warn(`File plugin ${file} tidak valid.`);
          continue;
        }

        const pluginName = plugin.name.toLowerCase();
        this.plugins.set(pluginName, plugin);

        // Jika plugin mengekspor hooks, daftarkan ke pendengar siklus
        if (plugin.hooks) {
          for (const [hookName, fn] of Object.entries(plugin.hooks)) {
            if (this.hooks[hookName] && typeof fn === 'function') {
              this.hooks[hookName].push({
                pluginName: plugin.name,
                execute: fn
              });
            }
          }
        }
      } catch (err) {
        logger.error(`Gagal memuat plugin ${file}:`, err);
      }
    }
    logger.success(`Berhasil memuat ${this.plugins.size} plugin.`);
  }

  async loadEvents(sock) {
    this.events.clear();
    const files = this.getFiles('./events');

    for (const file of files) {
      try {
        const fileUrl = pathToFileURL(file).href + `?v=${Date.now()}`;
        const module = await import(fileUrl);
        const event = module.default;

        if (!event || !event.name || typeof event.execute !== 'function') {
          logger.warn(`File event ${file} tidak valid.`);
          continue;
        }

        this.events.set(event.name, event);
        logger.info(`Memuat event dinamis: [${event.name}] dari ${path.basename(file)}`);
        sock.ev.on(event.name, (...args) => event.execute(sock, ...args));
      } catch (err) {
        logger.error(`Gagal memuat event ${file}:`, err);
      }
    }
    logger.success(`Berhasil mendaftarkan ${this.events.size} event dinamis.`);
  }
}

export default new Loader();
