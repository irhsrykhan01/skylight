import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  Browsers 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode-terminal';
import pc from 'picocolors';
import config from '../../config.js';
import { logger } from './logger.js';
import loader from './loader.js';
import { checkUpdates } from './updater.js'; // Import Update Checker

class SkyLightClient {
  constructor() {
    this.sock = null;
    this.sessionPath = path.resolve('./session');
    this.pairingCodeRequested = false;
  }

  async start() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // Memuat Command & Plugin dinamis sebelum memulai koneksi (Stage 12 & 13)
      await loader.loadCommands();
      await loader.loadPlugins();

      // --- MEMANGGIL AUTO UPDATE CHECKER ---
      await checkUpdates();

      let version = [2, 3000, 1035194821]; 
      try {
        const latestVersion = await fetchLatestBaileysVersion();
        if (latestVersion && latestVersion.version) {
          version = latestVersion.version;
          logger.info(`Menggunakan versi WhatsApp Protocol: ${version.join('.')}`);
        }
      } catch (err) {
        logger.warn('Gagal mengambil versi Baileys terbaru secara dinamis, menggunakan fallback.');
      }

      this.sock = makeWASocket({
        auth: state,
        version: version, 
        logger: pino({ level: 'silent' }), 
        printQRInTerminal: false, 
        browser: Browsers.macOS('Desktop'), 
        markOnlineOnConnect: true
      });

      // Mendaftarkan seluruh event dinamis dari folder events/ (Stage 11)
      await loader.loadEvents(this.sock);

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !config.pairing.enabled) {
          logger.info('QR Code dideteksi. Silakan pindai menggunakan aplikasi WhatsApp Anda:');
          qrcode.generate(qr, { small: true });
        }

        if (qr && config.pairing.enabled && !this.pairingCodeRequested) {
          this.pairingCodeRequested = true;
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

        if (connection === 'connecting') {
          logger.info('Mencoba menyambungkan ke server WhatsApp...');
        } else if (connection === 'open') {
          logger.success('SkyLight telah berhasil terhubung ke WhatsApp!');
          logger.info(`Akun terhubung: ${this.sock.user.name || 'Bot'} (${this.sock.user.id.split(':')[0]})`);
          this.pairingCodeRequested = false; 
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
