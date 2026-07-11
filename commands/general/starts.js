import { formatRuntime } from '../../lib/utils.js';
import os from 'os';
import loader from '../../src/core/loader.js';

export default {
  name: 'stats',
  alias: ['status', 'system'],
  category: 'general',
  desc: 'Menampilkan statistik spesifikasi lengkap bot dan server.',
  async execute(m, { sock }) {
    await m.react('📊');

    const runtime = formatRuntime(process.uptime());
    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
    
    let txt = `*📊 STATISTIK SERVER SKYLIGHT 📊*\n\n`;
    txt += `• *Runtime:* ${runtime}\n`;
    txt += `• *RAM Usage:* ${ram} MB\n`;
    txt += `• *Server Memory:* ${freeMem} GB / ${totalMem} GB (Free/Total)\n`;
    txt += `• *Platform OS:* ${os.platform()} (${os.arch()})\n`;
    txt += `• *CPU Model:* ${os.cpus()[0]?.model || 'Tidak Diketahui'}\n`;
    txt += `• *Node.js Version:* ${process.version}\n`;
    txt += `• *Total Registered Commands:* ${loader.commands.size}\n`;
    txt += `• *Total Registered Plugins:* ${loader.plugins.size}\n`;
    txt += `• *Total Registered Events:* ${loader.events.size}\n`;
    
    await m.reply(txt);
    await m.react('✅');
  }
};
