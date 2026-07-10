import { showBanner } from './src/core/banner.js';
import { logger } from './src/core/logger.js';
import client from './src/core/client.js';

async function bootstrap() {
  try {
    // 1. Tampilkan Banner UI
    showBanner();
    
    logger.info('Menginisialisasi framework SkyLight...');

    // 2. Crash Handler Global agar proses tidak mati mendadak saat runtime error (Stage 9: Crash Handler)
    process.on('uncaughtException', (err) => {
      logger.error('Terdeteksi Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Terdeteksi Unhandled Rejection pada Promise:', promise);
      console.error(reason);
    });
    
    // 3. Mulai jalankan client Baileys
    await client.start();
    
  } catch (error) {
    logger.error('Gagal menjalankan bootstrap aplikasi:', error);
    process.exit(1);
  }
}

bootstrap();
