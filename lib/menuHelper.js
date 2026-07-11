// Urutan prioritas kategori pada framework
export const categoryOrder = [
  "general",
  "group",
  "admin tools",
  "ai",
  "downloader",
  "sticker",
  "tools",
  "fun",
  "owner",
  "info"
];

// Metadata dekorasi emoji dan deskripsi kategori
export const categoryMeta = {
  "general": { label: "General Menu", emoji: "✨", desc: "Perintah umum & bantuan" },
  "group": { label: "Group Menu", emoji: "👥", desc: "Perintah obrolan grup" },
  "admin tools": { label: "Admin Tools Menu", emoji: "🛡️", desc: "Alat moderasi admin" },
  "ai": { label: "AI Menu", emoji: "🤖", desc: "Perintah asisten pintar AI" },
  "downloader": { label: "Downloader Menu", emoji: "📥", desc: "Perintah pengunduh media" },
  "sticker": { label: "Sticker Menu", emoji: "🎨", desc: "Pembuatan & pengubah stiker" },
  "tools": { label: "Tools Menu", emoji: "🛠️", desc: "Peralatan utilitas praktis" },
  "fun": { label: "Fun Menu", emoji: "🎮", desc: "Fitur hiburan & game" },
  "owner": { label: "Owner Menu", emoji: "⚙️", desc: "Fitur kontrol penuh owner" },
  "info": { label: "Info Menu", emoji: "📊", desc: "Informasi statistik bot" }
};

// Fungsi pembangun template kotak list menu
export function renderCategoryMenu(prefix, categoryName, commandsList) {
  const meta = categoryMeta[categoryName] || { label: `${categoryName.toUpperCase()} Menu`, emoji: "▫️" };
  let block = `│ ${meta.emoji}┊ ${meta.label}\n`;
  block += `│╭──────────────────╯\n`;
  commandsList.forEach(cmd => {
    block += `││• ${cmd.name}\n`;
  });
  block += `│╰────────────────── ·  · ✦\n`;
  return block;
}
