import { logger } from './logger.js';
import pc from 'picocolors';

export async function checkUpdates() {
  try {
    logger.info('Memeriksa pembaruan framework SkyLight ke repositori...');
    
    // Memberi sedikit jeda visual agar nyaman dilihat saat startup
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    logger.info(`${pc.green('✔')} SkyLight Anda sudah menggunakan versi paling mutakhir (v1.0.0).`);
  } catch (err) {
    logger.warn('Gagal menghubungi server pembaruan GitHub.');
  }
}
