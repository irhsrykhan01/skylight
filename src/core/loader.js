// ... Di dalam constructor() Loader ...
    this.hooks = {
      beforeMessage: [],
      afterMessage: [],
      beforeCommand: [],
      afterCommand: [],
      // --- PENDAFTARAN HOOK DOWNLOADER BARU ---
      beforeDownload: [],
      afterDownload: [],
      onDownloadError: []
    };
