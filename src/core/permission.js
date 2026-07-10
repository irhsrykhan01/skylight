import config from '../../config.js';
import { getGroupAdmins } from '../../lib/utils.js';

/**
 * Memeriksa hak akses pengguna terhadap komando yang dipanggil
 * @param {Object} m - Objek pesan ter-serialisasi
 * @param {Object} opt - Parameter tambahan ({ sock, commandObj })
 * @returns {Boolean} - true jika diizinkan, false jika ditolak
 */
export async function checkPermissions(m, { sock, commandObj }) {
  if (!commandObj) return true;

  // 1. Owner Only
  if (commandObj.ownerOnly) {
    const ownerNumbers = config.owner.map(num => num.replace(/[^0-9]/g, ''));
    const senderNumber = m.sender.split('@')[0];
    if (!ownerNumbers.includes(senderNumber)) {
      await m.reply('*⚠️ [AKSES DITOLAK] ⚠️*\nPerintah ini hanya dapat dijalankan oleh Owner Bot.');
      return false;
    }
  }

  // 2. Group Only
  if (commandObj.groupOnly && !m.isGroup) {
    await m.reply('*⚠️ [AKSES DITOLAK] ⚠️*\nPerintah ini hanya dapat digunakan di dalam grup.');
    return false;
  }

  // 3. Private Only
  if (commandObj.privateOnly && m.isGroup) {
    await m.reply('*⚠️ [AKSES DITOLAK] ⚠️*\nPerintah ini hanya dapat digunakan melalui Chat Pribadi (PC).');
    return false;
  }

  // 4. Admin Only (Group Admin)
  if (commandObj.adminOnly && m.isGroup) {
    const admins = await getGroupAdmins(sock, m.from);
    const isOwner = config.owner.includes(m.sender.split('@')[0]);
    const isAdmin = admins.includes(m.sender);
    if (!isAdmin && !isOwner) {
      await m.reply('*⚠️ [AKSES DITOLAK] ⚠️*\nPerintah ini hanya dapat digunakan oleh Admin Grup.');
      return false;
    }
  }

  return true;
}
