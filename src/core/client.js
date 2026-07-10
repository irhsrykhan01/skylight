// ... Di dalam inisialisasi makeWASocket ...
      this.sock = makeWASocket({
        auth: state,
        version: version, 
        logger: pino({ level: 'silent' }), 
        printQRInTerminal: false, // Diubah menjadi false untuk menghilangkan warning
        browser: Browsers.macOS('Desktop'), 
        markOnlineOnConnect: true
      });
