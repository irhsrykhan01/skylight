import { showBanner } from './src/core/banner.js';
import { logger } from './src/core/logger.js';

async function bootstrap() {
  try {
    // Menampilkan Banner UI SkyLight ke terminal
    showBanner();
    
    logger.info('Memulai inisialisasi framework SkyLight...');
    
    // Simulasi pemuatan modul-modul dasar (akan diganti sistem aslinya nanti)
    await new Promise(resolve => setTimeout(resolve, 500));
    logger.success('Konfigurasi berhasil dimuat.');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    logger.success('SkyLight core telah siap.');
    logger.info('Menunggu tahap integrasi WhatsApp (Baileys)...');
    
  } catch (error) {
    logger.error('Gagal menjalankan bootstrap aplikasi:', error);
    process.exit(1);
  }
}

bootstrap();
