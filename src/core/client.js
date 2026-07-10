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
import loader from './loader.js'; // Import loader utama SkyLight

class SkyLightClient {
  constructor() {
    this.sock = null;
    this.sessionPath = path.resolve('./session');
    this.pairingCodeRequested = false;
  }

  async start() {
    try {
      // 1. Memuat state sesi login (Stage 9: Session Manager)
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // 2. Memuat semua command ke dalam sistem sebelum memulai socket (Stage 12: Command Loader)
      await loader.loadCommands();

      // 3. Mengambil versi WhatsApp Web terbaru secara dinamis untuk menghindari Error 405 (Stage 8)
      let version = [2, 3000, 1035194821]; // Fallback aman jika gagal fetch
      try {
        const latestVersion = await fetchLatestBaileysVersion();
        if (latestVersion && latestVersion.version) {
          version = latestVersion.version;
          logger.info(`Menggunakan versi WhatsApp Protocol: ${version.join('.')}`);
        }
      } catch (err) {
        logger.warn('Gagal mengambil versi Baileys terbaru secara dinamis, menggunakan fallback.');
      }

      // 4. Inisialisasi socket Baileys dengan konfigurasi bypass 405 (Stage 8: Integrasi Baileys)
      this.sock = makeWASocket({
        auth: state,
        version: version, 
        logger: pino({ level: 'silent' }), 
        printQRInTerminal: !config.pairing.enabled, 
        // Menggunakan fingerprint macOS Desktop untuk menghindari filter blokir 405 WhatsApp
        browser: Browsers.macOS('Desktop'), 
        markOnlineOnConnect: true
      });

      // 5. Mendaftarkan seluruh event dinamis dari folder events/ (Stage 11: Event Loader)
      await loader.loadEvents(this.sock);

      // 6. Menyimpan kredensial sesi setiap kali diperbarui
      this.sock.ev.on('creds.update', saveCreds);

      // 7. Memantau status koneksi dan penanganan login (Stage 9: Pairing & Reconnect)
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
          // Penundaan sejenak untuk memastikan socket siap sebelum mengirim permintaan kode
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
