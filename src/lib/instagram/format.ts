import type { InstagramProfileData } from "./types";

export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#064;/g, "@")
    .replace(/&#x40;/g, "@")
    .replace(/&#x2022;/g, "•")
    .replace(/&#x2014;/g, "—")
    .replace(/&#xed;/g, "í")
    .replace(/&#xe9;/g, "é")
    .replace(/&#xe3;/g, "ã")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function formatNameFromUsername(username: string): string {
  const parts = username.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return username;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
}

export function formatInstagramNumber(
  val: string | number | undefined | null,
  fallback: string = "0",
): string {
  if (val === undefined || val === null || val === "" || val === "0" || val === 0) {
    return fallback;
  }
  let str = String(val).trim();
  str = str.replace(/^[,.\s]+|[,.\s]+$/g, "");

  if (
    !str ||
    str === "NaN" ||
    str === "undefined" ||
    str === "null" ||
    str === "0" ||
    !/\d/.test(str)
  ) {
    return fallback;
  }

  if (/[kmKM]/.test(str)) {
    return str.toUpperCase();
  }

  if (/^\d{1,3}([.,]\d{3})+$/.test(str)) {
    return str.replace(/,/g, ".");
  }

  if (/^\d+$/.test(str)) {
    return Number(str).toLocaleString("pt-BR");
  }

  if (typeof val === "number" && !isNaN(val)) {
    return val.toLocaleString("pt-BR");
  }

  return str;
}

export function parseCompactNumber(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.trunc(raw) : 0;
  if (!raw) return 0;

  const str = String(raw).trim().toLowerCase().replace(/\s+/g, "");
  const match = str.match(/^([\d.,]+)(k|m|b|mil|mi|bi)?$/);
  if (!match) return 0;

  let numeric = match[1] ?? "";
  const suffix = match[2];


  if (/^\d{1,3}([.,]\d{3})+$/.test(numeric)) {
    numeric = numeric.replace(/[.,]/g, "");
  } else {
    numeric = numeric.replace(",", ".");
  }

  const value = Number(numeric);
  if (!Number.isFinite(value)) return 0;

  const multiplier =
    suffix === "k" || suffix === "mil"
      ? 1_000
      : suffix === "m" || suffix === "mi"
        ? 1_000_000
        : suffix === "b" || suffix === "bi"
          ? 1_000_000_000
          : 1;

  return Math.round(value * multiplier);
}

const CURATED_POST_IMAGES = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
];

export function generateRealisticProfileFallback(username: string): InstagramProfileData {
  const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
  const seed = stringToHash(cleanUser);

  const postsCount = 45 + (seed % 340);
  const followersCount = 2800 + (seed % 94500);
  const followingCount = 180 + (seed % 920);

  const shuffledImages: string[] = [];
  for (let i = 0; i < 12; i++) {
    const imgIndex = (seed + i * 3) % CURATED_POST_IMAGES.length;
    const picked: string = CURATED_POST_IMAGES[imgIndex] || CURATED_POST_IMAGES[0] || "";
    shuffledImages.push(picked);
  }
  const bios = [
    "✨ Vivendo cada momento intensamente\n📍 São Paulo / Brasil\n📩 Parcerias e contato via Direct",
    "☕ Criador de conteúdo & lifestyle\n🌍 Explorando novos lugares\n🚀 Acompanhe os stories diariamente!",
    "🍕 Apaixonado por gastronomia, viagens e momentos únicos\n🎯 Vivendo a minha melhor versão",
    "📸 Fotografia | Lifestyle | Moda\n🌴 Compartilhando meu dia a dia com vocês\n⚡ Sejam todos bem-vindos!",
    "🏋️ Saúde, treinos e rotina diária\n💡 Evoluindo 1% a cada dia\n💬 Fale comigo no direct",
  ];
  const selectedBio = bios[seed % bios.length] || "✨ Criador de conteúdo & lifestyle\n📍 Brasil";

  return {
    status: "success",
    username: cleanUser,
    fullName: formatNameFromUsername(cleanUser),
    profilePicUrl: `https://i.pravatar.cc/300?u=${cleanUser}`,
    profilePicUrlOriginal: `https://i.pravatar.cc/300?u=${cleanUser}`,
    biography: selectedBio,
    followerCount: followersCount.toLocaleString("pt-BR"),
    followingCount: followingCount.toLocaleString("pt-BR"),
    mediaCount: postsCount.toLocaleString("pt-BR"),
    isPrivate: false,
    isVerified: seed % 7 === 0,
    mediaThumbnails: shuffledImages,
  };
}
