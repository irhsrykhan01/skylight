import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion, // Digunakan untuk bypass error 405
  Browsers 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode-terminal';
import pc from 'picocolors';
import config from '../../config.js';
import { logger } from './logger.js';

class SkyLightClient {
  constructor() {
    this.sock = null;
    this.sessionPath = path.resolve('./session');
    this.pairingCodeRequested = false;
  }

  async start() {
    try {
      // 1. Memuat state sesi login (Stage 9)
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // 2. Mengambil versi WhatsApp Web terbaru secara dinamis untuk menghindari Error 405 (Stage 8)
      let version = [2, 3000, 1035194821]; // Fallback aman jika koneksi offline/gagal fetch
      try {
        const latestVersion = await fetchLatestBaileysVersion();
        if (latestVersion && latestVersion.version) {
          version = latestVersion.version;
          logger.info(`Menggunakan versi WhatsApp Protocol: ${version.join('.')}`);
        }
      } catch (err) {
        logger.warn('Gagal mengambil versi Baileys terbaru secara dinamis, menggunakan fallback.');
      }

      // 3. Inisialisasi socket Baileys dengan konfigurasi bypass 405
      this.sock = makeWASocket({
        auth: state,
        version: version, // Menyetel versi dinamis yang baru saja di-fetch
        logger: pino({ level: 'silent' }), 
        printQRInTerminal: !config.pairing.enabled, 
        // Mengubah platform ke macOS Desktop guna menghindari pemblokiran handshake 405 oleh WhatsApp
        browser: Browsers.macOS('Desktop'), 
        markOnlineOnConnect: true
      });

      // 4. Menyimpan kredensial sesi setiap kali diperbarui
      this.sock.ev.on('creds.update', saveCreds);

      // 5. Memantau status koneksi dan penanganan login (Stage 9)
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Penanganan QR Code di terminal (jika pairing code dinonaktifkan)
        if (qr && !config.pairing.enabled) {
          logger.info('QR Code dideteksi. Silakan pindai menggunakan aplikasi WhatsApp Anda:');
          qrcode.generate(qr, { small: true });
        }

        // Penanganan Pairing Code di terminal (jika pairing code diaktifkan)
        if (qr && config.pairing.enabled && !this.pairingCodeRequested) {
          this.pairingCodeRequested = true;
          // Penundaan sejenak untuk menjamin handshake websocket telah stabil sebelum meminta kode
          setTimeout(async () => {
            try {
              const phoneNumber = config.pairing.phoneNumber.replace(/[^0-9]/g, '');
              if (!phoneNumber) {
                logger.error('Nomor telepon kosong atau tidak valid pada file config.js!');
                this.pairingCodeRequested = false;
                return;
              }
              logger.info(`Meminta Pairing Code untuk nomor: ${phoneNumber}...`);
              const code = await this.sock.requestPairingCode(phoneNumber);
              const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
              
              console.log(pc.gray('─'.repeat(55)));
              logger.success(`Pairing Code Anda: ${pc.bold(pc.yellow(formattedCode))}`);
              logger.info(`Silakan buka WhatsApp > Perangkat Tertaut > Tautkan Perangkat > Tautkan dengan nomor telepon saja.`);
              console.log(pc.gray('─'.repeat(55)));
            } catch (err) {
              logger.error('Gagal meminta Pairing Code dari server WhatsApp:', err);
              this.pairingCodeRequested = false;
            }
          }, 3000); 
        }

        // Penanganan status koneksi
        if (connection === 'connecting') {
          logger.info('Mencoba menyambungkan ke server WhatsApp...');
        } else if (connection === 'open') {
          logger.success('SkyLight telah berhasil terhubung ke WhatsApp!');
          logger.info(`Akun terhubung: ${this.sock.user.name || 'Bot'} (${this.sock.user.id.split(':')[0]})`);
          this.pairingCodeRequested = false; // Reset state pairing setelah sukses masuk
        } else if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.code;
          const reason = lastDisconnect?.error?.message || 'Tidak diketahui';
          
          logger.warn(`Koneksi terputus. Status Code: ${statusCode} | Alasan: ${reason}`);

          if (statusCode === DisconnectReason.loggedOut) {
            logger.error('Sesi telah dinonaktifkan (Logged Out). Menghapus folder sesi...');
            fs.rmSync(this.sessionPath, { recursive: true, force: true });
            logger.info('Folder sesi berhasil dibersihkan. Silakan jalankan ulang bot untuk masuk kembali.');
            process.exit(0);
          } else {
            // Reconnect otomatis untuk alasan pemutusan koneksi lainnya
            logger.info('Mencoba menyambungkan kembali dalam 5 detik...');
            setTimeout(() => this.start(), 5000);
          }
        }
      });

    } catch (error) {
      logger.error('Terjadi kegagalan saat inisialisasi client:', error);
      this.handleCrash();
    }
  }

  handleCrash() {
    logger.warn('Mencoba melakukan recovery client dalam 5 detik...');
    setTimeout(() => this.start(), 5000);
  }
}

export default new SkyLightClient();
