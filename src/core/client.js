import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
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
      // 1. Memuat state sesi login (Stage 9: Session Manager)
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // 2. Inisialisasi socket Baileys (Stage 8: Integrasi Baileys)
      this.sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Membisukan pino log agar terminal bersih
        printQRInTerminal: !config.pairing.enabled, // Tampilkan QR internal bawaan jika pairing dimatikan
        browser: ['SkyLight', 'Chrome', '1.0.0'], // Identitas browser
        markOnlineOnConnect: true
      });

      // 3. Menyimpan kredensial sesi setiap kali diperbarui
      this.sock.ev.on('creds.update', saveCreds);

      // 4. Memantau status koneksi dan penanganan login (Stage 9: Pairing & Reconnect)
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Penanganan QR Code di terminal (jika pairing code dinonaktifkan)
        if (qr && !config.pairing.enabled) {
          logger.info('QR Code terdeteksi. Silakan pindai menggunakan aplikasi WhatsApp Anda:');
          qrcode.generate(qr, { small: true });
        }

        // Penanganan Pairing Code di terminal (jika pairing code diaktifkan)
        if (qr && config.pairing.enabled && !this.pairingCodeRequested) {
          this.pairingCodeRequested = true;
          setTimeout(async () => {
            try {
              const phoneNumber = config.pairing.phoneNumber.replace(/[^0-9]/g, '');
              if (!phoneNumber) {
                logger.error('Nomor telepon kosong atau tidak valid pada file config.js!');
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
          }, 3000); // Penundaan sejenak untuk memastikan socket siap menerima request
        }

        // Penanganan status koneksi
        if (connection === 'connecting') {
          logger.info('Mencoba menyambungkan ke server WhatsApp...');
        } else if (connection === 'open') {
          logger.success('SkyLight telah berhasil terhubung ke WhatsApp!');
          logger.info(`Akun terhubung: ${this.sock.user.name || 'Bot'} (${this.sock.user.id.split(':')[0]})`);
          this.pairingCodeRequested = false; // Reset status pairing
        } else if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.code;
          const reason = lastDisconnect?.error?.message || 'Tidak diketahui';
          
          logger.warn(`Koneksi terputus. Status Code: ${statusCode} | Alasan: ${reason}`);

          // Jika user sengaja mengeluarkan bot lewat WhatsApp (Device Unlinked)
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

  // Crash recovery sederhana
  handleCrash() {
    logger.warn('Mencoba melakukan recovery client dalam 5 detik...');
    setTimeout(() => this.start(), 5000);
  }
}

export default new SkyLightClient();
