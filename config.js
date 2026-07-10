export default {
  botName: 'SkyLight',
  version: '1.0.0',
  owner: ['628xxx'], // Ganti dengan nomor WhatsApp owner Anda (tanpa @s.whatsapp.net)
  prefix: '.',
  pairing: {
    enabled: true, // Ubah ke false jika ingin menggunakan QR Code login
    phoneNumber: '628xxx' // Nomor WhatsApp yang akan dipasangkan jika pairing.enabled = true
  },
  timezone: 'Asia/Jakarta',
  theme: {
    primary: 'cyan',
    success: 'green',
    warning: 'yellow',
    danger: 'red',
    info: 'blue'
  }
};
