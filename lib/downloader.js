import config from '../config.js';
import loader from '../src/core/loader.js';
import { logger } from '../src/core/logger.js';

/**
 * Memicu jalannya hook dinamis
 */
async function dispatchHook(hookName, payload) {
  const hooks = loader.hooks[hookName] || [];
  for (const hook of hooks) {
    try {
      const result = await hook.execute(payload);
      if (result === false) return false;
    } catch (err) {
      logger.error(`Error pada Hook [${hookName}]:`, err);
    }
  }
  return true;
}

/**
 * Validasi keaslian tautan URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Penanganan error visual ramah pengguna
 */
export async function handleDownloaderError(m, err) {
  let msg = '❌ Terjadi kesalahan saat mengunduh media.';
  if (err.message === 'INVALID_URL') {
    msg = '⚠️ *Tautan Tidak Valid!* Mohon periksa kembali format tautan yang Anda masukkan.';
  } else if (err.message === 'TIMEOUT') {
    msg = '⚠️ *Timeout!* Server downloader terlalu lama merespon. Silakan coba sesaat lagi.';
  } else if (err.message === 'SERVER_ERROR' || err.message === 'TypeError') {
    msg = '🔌 *API Offline!* Server downloader eksternal sedang tidak dapat dijangkau.';
  } else if (err.message === 'INVALID_RESPONSE') {
    msg = '⚠️ *Tautan Tidak Didukung!* Konten tidak ditemukan atau bersifat privat.';
  } else if (err.message === 'CANCELLED_BY_HOOK') {
    msg = '🛡️ Proses pengunduhan dibatalkan oleh sistem keamanan bot.';
  }
  return m.reply(msg);
}

// Layanan Downloader Universal (SkyAPI)
export const downloaderService = {
  /**
   * Satu Fungsi untuk Semua Platform (Stage 17)
   * Hanya menghubungi satu endpoint API Vercel tunggal
   */
  async download(url, platform, retries = 2, timeoutMs = 20000) {
    const startTime = Date.now();
    
    if (!isValidUrl(url)) {
      throw new Error('INVALID_URL');
    }

    // Hook: beforeDownload
    const proceed = await dispatchHook('beforeDownload', { url, platform });
    if (!proceed) throw new Error('CANCELLED_BY_HOOK');

    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Memanggil satu endpoint universal Vercel SkyAPI
        const apiEndpoint = `${config.apiBaseUrl}/api/v1/download?url=${encodeURIComponent(url)}`;
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorDetail = await response.text().catch(() => 'Tidak ada detail pesan');
          logger.error(`[Downloader API Debug] Server merespons dengan Status: ${response.status} | Detail: ${errorDetail}`);
          if (response.status >= 500) {
            throw new Error('SERVER_ERROR');
          }
          throw new Error('API_ERROR');
        }

        const json = await response.json();
        
        if (!json || json.status === false || !json.result) {
          throw new Error('INVALID_RESPONSE');
        }

        const duration = Date.now() - startTime;
        
        // LOG FORMAT: [Downloader] [Platform] [URL] [Status] [Durasi]
        logger.info(`[Downloader] [${platform.toUpperCase()}] [${url}] [SUCCESS] [${duration}ms]`);

        // Hook: afterDownload
        await dispatchHook('afterDownload', { url, platform, result: json.result, duration });

        return json.result;

      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err.name === 'AbortError') {
          lastError = new Error('TIMEOUT');
        }
        logger.warn(`[Downloader] [${platform.toUpperCase()}] [Percobaan ${attempt}/${retries}] Gagal: ${lastError.message}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.error(`[Downloader] [${platform.toUpperCase()}] [${url}] [FAILED] [${duration}ms]`);
    await dispatchHook('onDownloadError', { url, platform, error: lastError });
    throw lastError;
  }
};
