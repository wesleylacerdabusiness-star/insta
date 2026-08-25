import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import {
  fetchInstagramProfile,
  formatInstagramNumber,
  generateRealisticProfileFallback,
  type InstagramProfileData,
} from "@/lib/instagram";
import { isAuthenticated } from "@/lib/auth";
import { trackViewContent, trackPurchase, trackInitiateCheckout, trackAddPaymentInfo, trackCopyPixCode, trackOpenPaymentModal, getStoredUtmParams } from "@/lib/tracking";
import { PRICING_CONFIG } from "@/config/pricing";
import {
  createPixChargeServer,
  checkPixChargeStatusServer,
  simulatePixPaymentServer,
  type PixChargeData,
} from "@/lib/payment";

export const Route = createFileRoute("/resultado")({
  validateSearch: z.object({
    username: z.string().optional(),
    gender: z.string().optional(),
  }),
  component: ResultadoPage,
  head: () => ({
    title: "Relatório Completo - InstaSpy",
    meta: [
      {
        name: "description",
        content: "Relatório analítico completo com acesso liberado pelo InstaSpy.",
      },
      {
        name: "referrer",
        content: "no-referrer",
      },
    ],
  }),
});

interface StalkerItem {
  id: string;
  username: string;
  avatar: string;
  rank: number;
  badge: string;
  rankClass: string;
  views: number;
  likes: number;
  comments: number;
  prints: number;
  dms: number;
}

const RAW_STALKERS: StalkerItem[] = [
  {
    id: "1",
    username: "garagem_gafanhoto",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rank: 1,
    badge: "🥇",
    rankClass: "rank-1",
    views: 48,
    likes: 19,
    comments: 4,
    prints: 18,
    dms: 7,
  },
  {
    id: "2",
    username: "rafaelly_olinda",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    rank: 2,
    badge: "🥈",
    rankClass: "rank-2",
    views: 42,
    likes: 15,
    comments: 6,
    prints: 14,
    dms: 5,
  },
  {
    id: "3",
    username: "luxodoareal",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rank: 3,
    badge: "🥉",
    rankClass: "rank-3",
    views: 38,
    likes: 12,
    comments: 3,
    prints: 11,
    dms: 4,
  },
  {
    id: "4",
    username: "paulorochaaju",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rank: 4,
    badge: "4",
    rankClass: "",
    views: 33,
    likes: 9,
    comments: 3,
    prints: 9,
    dms: 3,
  },
  {
    id: "5",
    username: "andreamarianascimento",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rank: 5,
    badge: "5",
    rankClass: "",
    views: 29,
    likes: 8,
    comments: 5,
    prints: 8,
    dms: 4,
  },
  {
    id: "6",
    username: "zunterlucas",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    rank: 6,
    badge: "6",
    rankClass: "",
    views: 26,
    likes: 7,
    comments: 2,
    prints: 7,
    dms: 3,
  },
  {
    id: "7",
    username: "jemmyssonsantos",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    rank: 7,
    badge: "7",
    rankClass: "",
    views: 23,
    likes: 5,
    comments: 2,
    prints: 6,
    dms: 2,
  },
  {
    id: "8",
    username: "barroscristina201",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    rank: 8,
    badge: "8",
    rankClass: "",
    views: 21,
    likes: 6,
    comments: 1,
    prints: 5,
    dms: 3,
  },
  {
    id: "9",
    username: "jeffecage",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    rank: 9,
    badge: "9",
    rankClass: "",
    views: 19,
    likes: 4,
    comments: 2,
    prints: 4,
    dms: 2,
  },
  {
    id: "10",
    username: "fabyanase1960",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    rank: 10,
    badge: "10",
    rankClass: "",
    views: 17,
    likes: 3,
    comments: 1,
    prints: 3,
    dms: 1,
  },
  {
    id: "11",
    username: "thiagosilva_aju",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    rank: 11,
    badge: "11",
    rankClass: "",
    views: 15,
    likes: 3,
    comments: 1,
    prints: 4,
    dms: 2,
  },
  {
    id: "12",
    username: "camila_rocha88",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    rank: 12,
    badge: "12",
    rankClass: "",
    views: 14,
    likes: 4,
    comments: 2,
    prints: 3,
    dms: 1,
  },
  {
    id: "13",
    username: "lucasfelipemendes",
    avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
    rank: 13,
    badge: "13",
    rankClass: "",
    views: 13,
    likes: 2,
    comments: 0,
    prints: 3,
    dms: 1,
  },
  {
    id: "14",
    username: "mari_santana_sp",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    rank: 14,
    badge: "14",
    rankClass: "",
    views: 11,
    likes: 2,
    comments: 1,
    prints: 2,
    dms: 1,
  },
  {
    id: "15",
    username: "rodrigo_alves_ba",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    rank: 15,
    badge: "15",
    rankClass: "",
    views: 10,
    likes: 1,
    comments: 0,
    prints: 2,
    dms: 1,
  },
];

interface FeedItem {
  id: number;
  avatar: string;
  username: string;
  text: string;
  hasPost?: boolean;
  postImg?: string;
  borderPink?: boolean;
}

const INITIAL_FEED_ITEMS: FeedItem[] = [
  {
    id: 99,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    username: "netobarbozabarboza",
    text: 'Comentou: "Bom dia preciso falar com você no privado"',
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    borderPink: true,
  },
  {
    id: 98,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    username: "antoniorodriguesdos705",
    text: 'Comentou: "Nossa deu até água na boca essa foto velho"',
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    borderPink: true,
  },
  {
    id: 97,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    username: "igniz1994",
    text: 'Comentou: "😍😍😍😍😍😍😍"',
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 96,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    username: "elizangelacosta875",
    text: 'Comentou: "Maravilhosa demais 👏"',
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 95,
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    username: "ailton_junior_81",
    text: 'Comentou: "Sensacional esse conteúdo!"',
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 94,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    username: "taise_cardoso94",
    text: 'Comentou: "Com certeza, concordo plenamente com o que falou."',
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 93,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    username: "chiquinho_alvaia",
    text: "Compartilhou sua publicação no direct há 12h",
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 92,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    username: "j.vitorpr",
    text: "Tirou print do seu perfil há 3h",
  },
  {
    id: 91,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    username: "nat23rs",
    text: "Mencionou você em uma conversa com @gar...",
  },
  {
    id: 90,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    username: "netobarbozabarboza",
    text: "Tirou print do seu perfil e enviou para @th... há 4 dias",
  },
  {
    id: 89,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    username: "fabyanase1960",
    text: "Compartilhou sua publicação no direct há 3h",
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 88,
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    username: "zunterlucas",
    text: "Visitou seu perfil 7x na última 1h",
  },
  {
    id: 87,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    username: "marciossilveira",
    text: "Mencionou você em um Direct privado com @lux...",
  },
  {
    id: 86,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    username: "fntsotavio",
    text: 'Comentou: "Muito top esse post!"',
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 85,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    username: "chiquinho_alvaia",
    text: "Tirou print da sua publicação há 12h",
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 84,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    username: "j.vitorpr",
    text: "Enviou seu Story para @gr... há 3 dias",
  },
  {
    id: 83,
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    username: "thiagosilva_aju",
    text: "Visualizou seu Story em aba anônima há 45 min",
  },
  {
    id: 82,
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    username: "camila_rocha88",
    text: "Salvou sua foto recente na galeria privada",
    hasPost: true,
    postImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 81,
    avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
    username: "lucasfelipemendes",
    text: "Pesquisou seu nome na barra de busca 3x hoje",
  },
  {
    id: 80,
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    username: "rodrigo_alves_ba",
    text: "Enviou print de uma conversa sua para um grupo privado",
  },
];

const NEW_ACTIVITY_POOL = [
  { username: "lucas_silva_99", text: "Tirou print do seu Story agora", type: "print" },
  { username: "mari_oliveira_sp", text: "Visitou seu perfil 2x nos últimos 4 min", type: "visit" },
  { username: "gabriel_costa_rj", text: "Compartilhou sua publicação no Direct", type: "share" },
  { username: "carol_mendes_01", text: 'Comentou: "Gente olhem isso aqui 😱😱"', type: "comment" },
  { username: "rodrigo_alves_ba", text: "Mencionou você em conversa privada", type: "dm" },
  { username: "juliana_souza_mg", text: "Tirou print da sua foto de perfil", type: "print" },
  { username: "pedro_santos_pr", text: "Salvou seu Reel na coleção privada", type: "share" },
  { username: "amanda_lima_df", text: 'Comentou: "Passada com esse babado!!"', type: "comment" },
  { username: "felipe_rocha_ce", text: "Apagou uma mensagem que te mencionava", type: "dm" },
  { username: "beatriz_lima_pe", text: "Visitou seu perfil 4x nos últimos 15 min", type: "visit" },
  { username: "thiago_ferreira_sc", text: "Encaminhou seu perfil para 2 amigos", type: "share" },
  { username: "larissa_machado_rs", text: "Tirou print dos seus Stories salvos", type: "print" },
  { username: "renato_gomes_go", text: "Reagiu com 🔥 a uma mensagem privada", type: "dm" },
  { username: "mateus_castro_es", text: "Deu zoom em uma foto sua 3x", type: "visit" },
  { username: "debora_siqueira_ba", text: "Gravou a tela enquanto assistia seu Story", type: "print" },
  { username: "andre_martins_am", text: "Procurou suas fotos antigas de 2 anos atrás", type: "visit" },
  { username: "vanessa_freitas_pa", text: 'Comentou: "Nem acredito nisso kkkk"', type: "comment" },
  { username: "bruno_novaes_rn", text: "Mencionou seu @ em grupo de amigos", type: "dm" },
  { username: "patricia_leite_ma", text: "Tirou print dos seus destaques salvos", type: "print" },
  { username: "vinicius_duarte_ms", text: "Abriu seu perfil direto pela busca", type: "visit" },
];

interface DmConversation {
  id: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  messages: { text: string; isLeft: boolean }[];
}

const INITIAL_DM_CONVERSATIONS: DmConversation[] = [
  {
    id: "dm1",
    username: "garagem_gafanhoto",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Você viu o story que postaram agora? 😱",
    time: "agora",
    messages: [
      { text: "Você viu o story que postaram agora? 😱", isLeft: true },
      { text: "Sim!! Manda o print que você tirou", isLeft: false },
      { text: "Acabei de salvar aqui, vou te mandar no sigilo...", isLeft: true },
      { text: "Manda logo antes que apaguem kkk", isLeft: false },
    ],
  },
  {
    id: "dm2",
    username: "rafaelly_olinda",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Olha quem tava online na madrugada...",
    time: "há 2 min",
    messages: [
      { text: "Olha quem tava online na madrugada...", isLeft: true },
      { text: "Nem acredito kkkk sério?", isLeft: false },
      { text: "Sim, tava curtindo foto antiga até 3h da manhã", isLeft: true },
    ],
  },
  {
    id: "dm3",
    username: "luxodoareal",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Manda o link do perfil de novo",
    time: "há 6 min",
    messages: [
      { text: "Manda o link do perfil de novo", isLeft: true },
      { text: "Já te mandei lá no outro grupo", isLeft: false },
      { text: "Valeu, vou salvar aqui pra não perder", isLeft: true },
    ],
  },
  {
    id: "dm4",
    username: "paulorochaaju",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Tirei print daquela foto antes de arquivarem",
    time: "há 14 min",
    messages: [
      { text: "Tirei print daquela foto antes de arquivarem", isLeft: true },
      { text: "Mandou muito bem! Me passa aqui", isLeft: false },
      { text: "Vou jogar no drive pra gente ter salvo", isLeft: true },
    ],
  },
  {
    id: "dm5",
    username: "andreamarianascimento",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Falando nisso, você reparou no detalhe do story?",
    time: "há 25 min",
    messages: [
      { text: "Falando nisso, você reparou no detalhe do story?", isLeft: true },
      { text: "Qual detalhe? Não vi direito", isLeft: false },
      { text: "No fundo da foto dava pra ver quem tava junto...", isLeft: true },
      { text: "Chocada!! Vou dar replay agora!", isLeft: false },
    ],
  },
  {
    id: "dm6",
    username: "zunterlucas",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Eles nem imaginam que a gente já sabe de tudo",
    time: "há 42 min",
    messages: [
      { text: "Eles nem imaginam que a gente já sabe de tudo", isLeft: true },
      { text: "Melhor deixar em off por enquanto", isLeft: false },
      { text: "Com certeza, sigilo total por aqui", isLeft: true },
    ],
  },
  {
    id: "dm7",
    username: "jemmyssonsantos",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Me manda aquele print de novo, apaguei sem querer",
    time: "há 1h",
    messages: [
      { text: "Me manda aquele print de novo, apaguei sem querer", isLeft: true },
      { text: "Enviando de novo no PV...", isLeft: false },
      { text: "Perfeito, já guardei na pasta segura!", isLeft: true },
    ],
  },
  {
    id: "dm8",
    username: "camila_rocha88",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Viu que a pessoa viu seu perfil hoje cedo?",
    time: "há 2h",
    messages: [
      { text: "Viu que a pessoa viu seu perfil hoje cedo?", isLeft: true },
      { text: "Vi sim, olhou 3x seguidas", isLeft: false },
      { text: "Stalker nato, não aguenta a curiosidade kkk", isLeft: true },
    ],
  },
];

interface PushNotif {
  avatar: string;
  name: string;
  msg: string;
  tag: string;
  time: string;
}

const PUSH_NOTIFICATIONS: PushNotif[] = [
  {
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    name: "@garagem_ga***",
    msg: "tirou print do seu story de 24h",
    tag: "Novo Print",
    time: "Agora",
  },
  {
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    name: "@rafaelly_o***",
    msg: "abriu seu perfil pela 5ª vez hoje",
    tag: "Stalker Ativo",
    time: "Há 1 min",
  },
  {
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    name: "@luxodoar***",
    msg: "mencionou você em mensagem privada no direct",
    tag: "DM Interceptada",
    time: "Há 2 min",
  },
  {
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    name: "@pauloroc***",
    msg: "salvou sua foto na galeria do celular",
    tag: "Print Salvo",
    time: "Agora",
  },
  {
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    name: "@andreamar***",
    msg: "reencaminhou seu story para um grupo privado",
    tag: "Compartilhamento",
    time: "Há 3 min",
  },
  {
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    name: "@zunterlu***",
    msg: "pesquisou seu nome na barra de busca",
    tag: "Busca Oculta",
    time: "Agora",
  },
  {
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    name: "@jemmysson***",
    msg: "deu zoom na sua foto recente",
    tag: "Zoom Detectado",
    time: "Há 4 min",
  },
  {
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    name: "@barroscris***",
    msg: "reagiu com emoji no direct sobre você",
    tag: "Reação Oculta",
    time: "Há 5 min",
  },
  {
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    name: "@thiagosil***",
    msg: "abriu seus destaques antigos de 2024",
    tag: "Varredura Feed",
    time: "Agora",
  },
  {
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    name: "@camila_ro***",
    msg: "gravou a tela enquanto via seu story",
    tag: "Gravação de Tela",
    time: "Há 1 min",
  },
];

function ResultadoPage() {
  const { username: rawUsername = "", gender } = Route.useSearch();
  const cleanUsername = rawUsername.trim().replace(/^@/, "").toLowerCase() || "aledococo";
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<InstagramProfileData | null>(null);
  const [selectedStalker, setSelectedStalker] = useState<StalkerItem | null>(null);
  const [openDmId, setOpenDmId] = useState<string | null>(null);

  const [currentPush, setCurrentPush] = useState<PushNotif>(PUSH_NOTIFICATIONS[0]!);
  const [pushVisible, setPushVisible] = useState(false);

  const [isSafetyAlertOpen, setIsSafetyAlertOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [pixCharge, setPixCharge] = useState<PixChargeData | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [checkCooldownSecs, setCheckCooldownSecs] = useState(0);
  const [isDossierUnlocked, setIsDossierUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(`instaspy_dossier_unlocked_${cleanUsername}`) === "true";
    } catch {
      return false;
    }
  });

  const [metrics, setMetrics] = useState({
    visitantes: 392,
    semSaber: 151,
    prints: 223,
    dms: 7,
  });

  const [stalkers, setStalkers] = useState<StalkerItem[]>(() => {
    const arr = [...RAW_STALKERS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      const target = arr[j];
      if (temp && target) {
        arr[i] = target;
        arr[j] = temp;
      }
    }
    return arr.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      badge: idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`,
      rankClass: idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "",
    }));
  });

  const [feedList, setFeedList] = useState<FeedItem[]>(INITIAL_FEED_ITEMS);

  const [dmList, setDmList] = useState<DmConversation[]>(INITIAL_DM_CONVERSATIONS);

  const marqueeStalkers = useMemo(() => {
    return [...stalkers, ...stalkers, ...stalkers];
  }, [stalkers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isAuthenticated()) {
        navigate({
          to: "/register",
          search: { redirect: window.location.pathname + window.location.search },
        });
        return;
      }
      const hasPaid = localStorage.getItem(`instaspy_paid_${cleanUsername}`) === "true";
      if (!hasPaid) {
        navigate({
          to: "/checkout",
          search: { username: cleanUsername, gender },
        });
      }
    }
  }, [navigate, cleanUsername, gender]);

  useEffect(() => {
    trackViewContent("Resultado Completo - @" + cleanUsername);

    try {
      const paidChargeId = localStorage.getItem(`instaspy_charge_${cleanUsername}`);
      if (paidChargeId) {
        trackPurchase(
          PRICING_CONFIG.checkout.promotionalPrice,
          "BRL",
          "InstaSpy Liberado",
          paidChargeId,
        );
      }
    } catch {
    }

    try {
      const cached =
        localStorage.getItem(`instaspy_profile_data_${cleanUsername}`) ||
        localStorage.getItem(`instaspy_target_${cleanUsername}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setProfileData({
          status: "success",
          username: cleanUsername,
          fullName: parsed.fullName || parsed.full_name || cleanUsername,
          profilePicUrl:
            parsed.profilePicUrl ||
            parsed.profile_pic ||
            `https://i.pravatar.cc/300?u=${cleanUsername}`,
          mediaCount: parsed.mediaCount || parsed.posts || "128",
          followerCount: parsed.followerCount || parsed.followers || "14.2K",
          followingCount: parsed.followingCount || parsed.following || "680",
          isPrivate: false,
          isVerified: parsed.isVerified || false,
          biography: parsed.biography || "",
          mediaThumbnails: parsed.mediaThumbnails || [],
        });
      }
    } catch {
    }

    fetchInstagramProfile(cleanUsername)
      .then((data: InstagramProfileData) => {
        if (data?.status === "success") setProfileData(data);
      })
      .catch((err: any) => {
        console.warn("Could not fetch profile in resultado:", err);
      });
  }, [cleanUsername]);

  useEffect(() => {
    const metricsInterval = setInterval(() => {
      setMetrics((prev) => {
        const rand = Math.random();
        if (rand < 0.45) {
          return { ...prev, visitantes: prev.visitantes + Math.floor(Math.random() * 2) + 1 };
        } else if (rand < 0.7) {
          return { ...prev, prints: prev.prints + 1 };
        } else if (rand < 0.88) {
          return { ...prev, semSaber: prev.semSaber + 1 };
        } else {
          return { ...prev, dms: prev.dms + 1 };
        }
      });
    }, 3800);

    return () => clearInterval(metricsInterval);
  }, []);

  useEffect(() => {
    const stalkerInterval = setInterval(() => {
      setStalkers((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const item = prev[idx];
        if (!item) return prev;

        const updated = [...prev];
        const statChoice = Math.random();
        if (statChoice < 0.6) {
          updated[idx] = { ...item, views: item.views + 1 };
        } else if (statChoice < 0.85) {
          updated[idx] = { ...item, likes: item.likes + 1 };
        } else {
          updated[idx] = { ...item, prints: item.prints + 1 };
        }
        return updated;
      });
    }, 6500);

    return () => clearInterval(stalkerInterval);
  }, []);

  useEffect(() => {
    const feedInterval = setInterval(() => {
      const template = NEW_ACTIVITY_POOL[Math.floor(Math.random() * NEW_ACTIVITY_POOL.length)];
      if (!template) return;

      const randomAvatar = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 50000000)}?w=150&auto=format&fit=crop&q=80`;

      const newItem: FeedItem = {
        id: Date.now(),
        username: template.username,
        avatar: randomAvatar,
        text: template.text,
        borderPink: template.type === "print" || template.type === "comment",
        hasPost: template.type === "share" || template.type === "comment",
        postImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      };

      setFeedList((prev) => [newItem, ...prev.slice(0, 25)]);
    }, 5000);

    return () => clearInterval(feedInterval);
  }, []);

  useEffect(() => {
    const dmInterval = setInterval(() => {
      setDmList((prev) => {
        if (!prev.length) return prev;
        const targetIdx = Math.floor(Math.random() * prev.length);
        const item = prev[targetIdx];
        if (!item) return prev;

        const updated = [...prev];
        updated[targetIdx] = {
          ...item,
          time: "agora mesmo",
        };
        return updated;
      });
    }, 9000);

    return () => clearInterval(dmInterval);
  }, []);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setPushVisible(false);
      setTimeout(() => {
        index = (index + 1) % PUSH_NOTIFICATIONS.length;
        const next = PUSH_NOTIFICATIONS[index];
        if (next) setCurrentPush(next);
        setPushVisible(true);
      }, 600);
    }, 6000);

    const initialTimeout = setTimeout(() => {
      setPushVisible(true);
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isPixModalOpen || !pixCharge?.id || isDossierUnlocked) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkPixChargeStatusServer({
          data: {
            chargeId: pixCharge.id,
            amount: pixCharge.amount,
            contentName: "Desbloqueio Dossiê Premium",
            externalId: cleanUsername,
            tracking: getStoredUtmParams(),
          },
        });
        if (result.status === "paid") {
          setIsDossierUnlocked(true);
          try {
            localStorage.setItem(`instaspy_dossier_unlocked_${cleanUsername}`, "true");
          } catch { }
          setIsPixModalOpen(false);
          trackPurchase(
            PRICING_CONFIG.resultado.promotionalPrice,
            "BRL",
            "Desbloqueio Dossiê Premium",
            pixCharge.id
          );
        }
      } catch (err) {
        console.warn("Erro no polling do PIX Dossiê:", err);
      }
    }, PRICING_CONFIG.pixPollingIntervalMs);

    return () => clearInterval(interval);
  }, [isPixModalOpen, pixCharge?.id, isDossierUnlocked, cleanUsername]);

  useEffect(() => {
    if (checkCooldownSecs <= 0) return;
    const timer = setInterval(() => {
      setCheckCooldownSecs((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [checkCooldownSecs]);

  const openStalkerModal = (username: string) => {
    const found = stalkers.find((s) => s.username === username) || stalkers[0];
    if (found) {
      setSelectedStalker(found);
    }
  };

  const toggleDmDrawer = (id: string) => {
    setOpenDmId((prev) => (prev === id ? null : id));
  };

  const handleOpenDossierSafetyAlert = () => {
    setIsSafetyAlertOpen(true);
  };

  const confirmSafetyUnlock = async () => {
    setIsSafetyAlertOpen(false);
    setIsPixModalOpen(true);
    setIsCreatingPix(true);
    setPaymentNotice(null);
    setCheckCooldownSecs(0);

    trackInitiateCheckout(PRICING_CONFIG.resultado.promotionalPrice);
    trackOpenPaymentModal("resultado_dossier", PRICING_CONFIG.resultado.promotionalPrice);

    try {
      const charge = await createPixChargeServer({
        data: {
          amount: PRICING_CONFIG.resultado.promotionalPrice,
          description: `${PRICING_CONFIG.resultado.pixDescription} - @${cleanUsername}`,
          customer: { name: cleanUsername },
          tracking: getStoredUtmParams(),
        },
      });
      setPixCharge(charge);
      trackAddPaymentInfo(charge.amount);
    } catch (err) {
      console.warn("Erro ao gerar cobrança PIX:", err);
    } finally {
      setIsCreatingPix(false);
    }
  };

  const copyUpsellPix = () => {
    if (!pixCharge?.pix.copyPasteKey) return;
    navigator.clipboard
      .writeText(pixCharge.pix.copyPasteKey)
      .then(() => {
        setCopiedPix(true);
        trackCopyPixCode("resultado_dossier", PRICING_CONFIG.resultado.promotionalPrice);
        setTimeout(() => setCopiedPix(false), 3000);
      })
      .catch(() => { });
  };

  const checkUpsellPayment = async () => {
    if (!pixCharge?.id || isCheckingPayment || checkCooldownSecs > 0) return;
    setIsCheckingPayment(true);
    setPaymentNotice(null);

    try {
      const res = await checkPixChargeStatusServer({
        data: {
          chargeId: pixCharge.id,
          amount: pixCharge.amount,
          contentName: "Desbloqueio Dossiê Premium",
          externalId: cleanUsername,
          tracking: getStoredUtmParams(),
        },
      });

      if (res.status === "paid") {
        setIsDossierUnlocked(true);
        try {
          localStorage.setItem(`instaspy_dossier_unlocked_${cleanUsername}`, "true");
        } catch { }
        setIsPixModalOpen(false);
        trackPurchase(
          pixCharge.amount,
          "BRL",
          "Desbloqueio Dossiê Premium",
          pixCharge.id
        );
      } else {
        setPaymentNotice("Aguardando confirmação do banco... Se você já fez o PIX, a liberação ocorre em poucos segundos.");
        setCheckCooldownSecs(10);
      }
    } catch (err) {
      console.warn("Erro ao verificar pagamento:", err);
      setPaymentNotice("Instabilidade temporária ao consultar o banco. Tente novamente em instantes.");
      setCheckCooldownSecs(10);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleSimulateDevPayment = async () => {
    if (!pixCharge?.id) return;
    setIsCheckingPayment(true);
    try {
      await simulatePixPaymentServer({ data: pixCharge.id });
      const res = await checkPixChargeStatusServer({
        data: {
          chargeId: pixCharge.id,
          amount: pixCharge.amount,
          contentName: "Desbloqueio Dossiê Premium",
          externalId: cleanUsername,
          tracking: getStoredUtmParams(),
        },
      });
      if (res.status === "paid") {
        setIsDossierUnlocked(true);
        try {
          localStorage.setItem(`instaspy_dossier_unlocked_${cleanUsername}`, "true");
        } catch { }
        setIsPixModalOpen(false);
        trackPurchase(
          pixCharge.amount,
          "BRL",
          "Desbloqueio Dossiê Premium",
          pixCharge.id
        );
      }
    } catch (err) {
      console.warn("Erro ao simular:", err);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --ig-gradient: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          --premium-shadow: 0 20px 60px rgba(0,0,0,0.12);
          --glass-bg: rgba(255, 255, 255, 0.85);
          --glass-border: rgba(255, 255, 255, 0.5);
          --accent-color: #ff416c;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        @keyframes dashFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes gradient-glow { to { background-position: 200%; } }
        @keyframes pulseCTA { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes metaPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes blinkGreen { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        
        /* INFINITE MARQUEE SLIDER */
        @keyframes stalkerMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }

        body { background: #f4f7f6; color: #1a1a1a; font-family: 'Inter', sans-serif; padding-bottom: 120px; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        /* WIDER DESKTOP CONTAINER */
        .container-res { max-width: 680px; width: 100%; margin: 0 auto; padding: 25px 20px; animation: dashFadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        
        /* HEADER */
        .site-header-res { text-align: center; margin-bottom: 25px; padding-top: 15px; }
        .site-title-res { font-size: 1.5rem; font-weight: 800; margin: 0; letter-spacing: -0.5px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .site-title-res span { background: var(--ig-gradient); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .site-subtitle-res { color: #666; font-size: 1rem; font-weight: 500; }

        /* PROFILE CARD */
        .card-bg-res { background: #ffffff; border: 1px solid #efefef; border-radius: 24px; margin-bottom: 25px; overflow: hidden; box-shadow: var(--premium-shadow); }
        .ig-profile-stats-res { display: flex; align-items: center; padding: 18px 24px; gap: 35px; background: #fff; }
        .ig-pfp-ring-res { width: 90px; height: 90px; border-radius: 50%; background: var(--ig-gradient); padding: 3px; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .ig-pfp-ring-res img { width: 100%; height: 100%; border-radius: 50%; border: 3px solid white; object-fit: cover; }

        .ig-stats-flex-res { flex: 1; display: flex; justify-content: space-around; text-align: center; padding-right: 10px; }
        .ig-stat-num-res { font-weight: 800; font-size: 1.15rem; display: block; color: #000; margin-bottom: 2px; }
        .ig-stat-label-res { font-size: 0.85rem; color: #737373; font-weight: 500; }

        /* METRICS GRID */
        .metrics-grid-res { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
        .metric-card-res { background: #ffffff; border: 1px solid #efefef; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); position: relative; overflow: hidden; }
        .metric-card-res::after { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--accent-color); opacity: 0.8; }
        .metric-card-res:nth-child(2)::after, .metric-card-res:nth-child(4)::after { background: #f39c12; }
        .metric-val-res { font-size: 2rem; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; transition: transform 0.2s ease; }
        .metric-label-res { font-size: 0.78rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

        /* INFINITE PASSING STORIES MARQUEE */
        .stalker-marquee-wrapper { position: relative; width: 100%; overflow: hidden; padding: 10px 0 25px; margin-bottom: 10px; mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); }
        .stalker-marquee-track { display: flex; width: max-content; gap: 18px; animation: stalkerMarquee 38s linear infinite; }
        .stalker-marquee-track:hover { animation-play-state: paused; }

        .story-item-res { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; width: 95px; text-align: center; cursor: pointer; transition: transform 0.2s; }
        .story-item-res:active { transform: scale(0.92); }
        .story-ring-res { width: 88px; height: 88px; padding: 3px; background: var(--ig-gradient); border-radius: 50%; position: relative; margin-bottom: 8px; box-shadow: 0 6px 15px rgba(0,0,0,0.1); }
        .story-ring-res img { width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; object-fit: cover; }
        .story-username-res { font-size: 0.75rem; font-weight: 600; color: #262626; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 88px; }
        
        .rank-badge-res { position: absolute; bottom: 0; right: 0; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 5; }
        .rank-1 { background: linear-gradient(135deg, #ffd700, #ff8c00); color: white; }
        .rank-2 { background: linear-gradient(135deg, #c0c0c0, #708090); color: white; }
        .rank-3 { background: linear-gradient(135deg, #cd7f32, #8b4513); color: white; }

        .stalker-stats-res { position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); display: flex; gap: 3px; justify-content: center; width: 140%; z-index: 10; }
        .stat-bubble-res { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(5px); padding: 2px 6px; border-radius: 50px; font-size: 0.58rem; font-weight: 800; color: #666; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 10px rgba(0,0,0,0.1); white-space: nowrap; display: flex; align-items: center; gap: 2px; }

        /* BLURS E BLOQUEIO DE SELECAO */
        .blur-name { filter: blur(5.5px); opacity: 0.85; user-select: none; -webkit-user-select: none; -moz-user-select: none; pointer-events: none; }
        .blur-img { filter: blur(8px); opacity: 0.9; transform: scale(1.06); pointer-events: none; }
        .blur-target { filter: blur(5px); pointer-events: none; user-select: none; -webkit-user-select: none; -moz-user-select: none; }

        /* ACTIVITY FEED (BORRADO) */
        .activity-feed-wrapper-res { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: var(--premium-shadow); border: 1px solid #efefef; margin-bottom: 35px; }
        .activity-feed-container-res { max-height: 520px; overflow-y: auto; padding: 5px 0; scrollbar-width: none; }
        .notif-row-res { display: flex; align-items: center; padding: 16px 20px; gap: 15px; border-bottom: 1px solid #f9f9f9; transition: background 0.2s; animation: slideInRight 0.5s ease forwards; cursor: pointer; }
        .notif-row-res:hover { background: #fafafa; }
        .notif-row-res:active { background: #f0f0f0; }
        .notif-avatar-res { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 1px solid #efefef; flex-shrink: 0; }
        .notif-content-res { flex: 1; font-size: 0.88rem; line-height: 1.4; color: #262626; }
        .notif-username-res { font-weight: 700; margin-right: 6px; }
        .notif-media-preview-res { width: 46px; height: 46px; min-width: 46px; border-radius: 8px; object-fit: cover; flex-shrink: 0; border: 1px solid #e0e0e0; background: #f0f0f0; display: block; }

        /* DM LIST & CHAT DRAWER */
        .dm-list-container-res { background: #fff; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 65, 108, 0.2); box-shadow: 0 15px 45px rgba(255, 65, 108, 0.08); margin-bottom: 35px; }
        .dm-item-res { padding: 18px 22px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #f9f9f9; cursor: pointer; transition: background 0.2s; }
        .dm-item-res:hover { background: #fdf8f9; }
        .dm-avatar-res { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 1.5px solid #efefef; flex-shrink: 0; }
        .dm-info-res { flex: 1; }
        .dm-user-res { font-weight: 700; font-size: 1rem; color: #1a1a1a; margin-bottom: 3px; display: flex; align-items: center; gap: 8px; }
        .dm-last-msg-res { font-size: 0.88rem; color: #666; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
        .chat-drawer-res { display: none; padding: 20px; background: #fafafa; border-top: 1px solid #efefef; flex-direction: column; gap: 12px; max-height: 350px; overflow-y: auto; }
        .chat-drawer-res.active { display: flex; }
        .dm-bubble-res { max-width: 85%; padding: 12px 18px; border-radius: 20px; font-size: 0.92rem; line-height: 1.4; position: relative; }
        .dm-bubble-res.left { background: #efefef; align-self: flex-start; border-bottom-left-radius: 4px; color: #000; }
        .dm-bubble-res.right { background: #0095f6; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }

        /* FLOATING CTA */
        .floating-cta-container-res { padding: 0; margin-bottom: 35px; }
        .floating-cta-res { 
            display: flex; align-items: center; justify-content: center; width: 100%; 
            background: var(--ig-gradient); color: #fff; padding: 18px; border-radius: 18px; 
            text-align: center; font-weight: 800; text-decoration: none; box-shadow: 0 12px 35px rgba(220, 39, 67, 0.4); 
            border: none; cursor: pointer; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            animation: pulseCTA 2.5s infinite; font-size: 1.05rem;
        }
        .floating-cta-res:active { transform: scale(0.96); box-shadow: 0 5px 15px rgba(220, 39, 67, 0.3); }

        .glow-text-animated-res { background: linear-gradient(90deg, #ff416c, #833ab4, #ff416c); background-size: 200%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: gradient-glow 3s linear infinite; }

        /* SAFETY & UPSELL MODALS */
        .upsell-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: dashFadeIn 0.3s ease forwards;
        }
        .upsell-modal {
          background: white; width: 100%;
          transform: translateY(0);
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          animation: dashFadeIn 0.35s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .upsell-icon { font-size: 3.5rem; margin-bottom: 10px; display: block; text-align: center; }
        .upsell-title { font-size: 1.6rem; font-weight: 850; color: #1a1a1a; margin-bottom: 5px; text-transform: uppercase; letter-spacing: -0.5px; text-align: center; }
        .blink-green { color: #16a34a; font-weight: 800; font-size: 0.88rem; margin-bottom: 15px; animation: blinkGreen 1.5s infinite; text-align: center; }
        .upsell-text { font-size: 0.92rem; color: #444; line-height: 1.6; margin-bottom: 25px; text-align: left; font-weight: 500; }
        .upsell-btn {
          width: 100%; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
          color: white; border: none; padding: 18px; border-radius: 16px;
          font-weight: 800; font-size: 1.05rem; cursor: pointer;
          box-shadow: 0 10px 25px rgba(220, 39, 67, 0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .upsell-btn:active { transform: scale(0.97); }

        .pix-price-upsell {
          background: #f0fdf4; color: #16a34a; font-size: 2.2rem; font-weight: 900;
          padding: 15px 30px; border-radius: 20px; border: 2px solid #bbf7d0;
          display: inline-block; margin-bottom: 25px; animation: metaPulse 2s infinite; text-align: center;
        }

        /* STALKER MODAL */
        .stalker-modal-overlay-res { 
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 99999; 
            display: flex; align-items: center; justify-content: center; padding: 20px;
            animation: dashFadeIn 0.3s ease forwards;
        }
        .stalker-modal-res { 
            background: #fff; width: 100%; max-width: 400px; border-radius: 28px; 
            padding: 32px 26px; text-align: center; position: relative;
            box-shadow: 0 30px 70px rgba(0,0,0,0.3);
            animation: dashFadeIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .sm-avatar-res { width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--accent-color); padding: 4px; margin: 0 auto 20px; box-shadow: 0 10px 25px rgba(255, 65, 108, 0.2); }
        .sm-avatar-res img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .sm-username-res { font-size: 1.35rem; font-weight: 800; color: #1a1a1a; margin-bottom: 25px; }
        .sm-stats-res { display: flex; flex-direction: column; gap: 14px; margin-bottom: 30px; }
        .sm-stat-item-res { background: #f8f9fa; padding: 14px 18px; border-radius: 16px; display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 0.95rem; border: 1px solid #eee; text-align: left; }
        .sm-btn-res { background: var(--ig-gradient); color: #fff; width: 100%; padding: 16px; border-radius: 16px; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 8px 20px rgba(220, 39, 67, 0.25); }

        /* FOOTER */
        .ig-footer-res { padding: 50px 20px 80px; text-align: center; border-top: 1px solid #efefef; margin-top: 50px; }
        .footer-links-res { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px 20px; margin-bottom: 25px; }
        .footer-links-res a { color: #8e8e8e; font-size: 0.82rem; text-decoration: none; font-weight: 600; }
        .footer-copyright-res { font-size: 0.82rem; color: #8e8e8e; font-weight: 500; }
      `}</style>

      { }
      {currentPush && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-[12000] w-[92%] max-w-[420px] transition-all duration-500 ${pushVisible ? "top-4 opacity-100 translate-y-0" : "-top-32 opacity-0 -translate-y-4 pointer-events-none"
            }`}
          style={{
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            borderRadius: "20px",
            padding: "12px 16px",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            { }
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(220, 39, 67, 0.2)",
                }}
              >
                <img
                  src={currentPush.avatar}
                  alt="Stalker"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "12px",
                    objectFit: "cover",
                    filter: "blur(4.5px)",
                    transform: "scale(1.06)",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${currentPush.name}`;
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #f09433, #dc2743)",
                  border: "2px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
            </div>

            { }
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#dc2743", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {currentPush.tag}
                  </span>
                  <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#ccc" }} />
                  <span style={{ fontSize: "0.72rem", color: "#666", fontWeight: 600 }}>Instagram</span>
                </div>
                <span style={{ fontSize: "0.7rem", color: "#8e8e93", fontWeight: 600 }}>{currentPush.time}</span>
              </div>
              <div style={{ fontSize: "0.84rem", color: "#262626", lineHeight: 1.35 }}>
                <span style={{ fontWeight: 800, color: "#111", marginRight: "4px" }} className="blur-name">
                  {currentPush.name}
                </span>
                <span>{currentPush.msg}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-res">
        { }
        <div
          className="site-header-res"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "15px",
            marginBottom: "25px",
            flexWrap: "wrap",
          }}
        >
          <h1
            className="site-title-res"
            style={{
              fontSize: "1.45rem",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>InstaSpy</span>
            <svg
              aria-label="Verificado"
              style={{ marginBottom: "-2px" }}
              fill="#0095f6"
              height="20"
              role="img"
              viewBox="0 0 40 40"
              width="20"
            >
              <title>Verificado</title>
              <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.235L0 14.357l3.093 5.641L0 25.639l5.432 2.972v6.234h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.155h6.235v-6.234L40 25.639l-3.094-5.641L40 14.357l-5.435-2.972V5.15h-6.234L25.358 0l-5.36 3.094Z" />
              <path
                d="m14.72 18.75 4.334 4.333 7.357-7.358 2.356 2.357-9.713 9.713-6.688-6.688 2.354-2.357Z"
                fill="white"
              />
            </svg>
          </h1>
          <div
            style={{
              background: "rgba(46, 125, 50, 0.08)",
              color: "#2e7d32",
              padding: "8px 20px",
              borderRadius: "50px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 800,
              fontSize: "0.85rem",
              border: "1.5px solid rgba(46, 125, 50, 0.2)",
            }}
          >
            <span style={{ fontSize: "1.05rem" }}>✅</span> ACESSO LIBERADO!
          </div>
        </div>
        <p
          className="site-subtitle-res"
          style={{ marginTop: "-15px", marginBottom: "25px", textAlign: "center" }}
        >
          Relatório Analítico pelo <b>Sistema</b> 🔍
        </p>

        { }
        <div className="card-bg-res" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 24px",
              borderBottom: "1px solid #efefef",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "30px",
              }}
            >
              <span
                style={{ fontSize: "1.3rem", cursor: "pointer" }}
                onClick={() => navigate({ to: "/search" })}
              >
                ‹
              </span>
              <span>{cleanUsername}</span>
            </div>
            <div style={{ fontWeight: 900, letterSpacing: "1px", cursor: "pointer" }}>•••</div>
          </div>

          <div
            className="ig-profile-stats-res"
            style={{
              padding: "18px 24px",
              borderBottom: "none",
              display: "flex",
              alignItems: "center",
              gap: "35px",
            }}
          >
            <div
              className="ig-pfp-ring-res"
              style={{ width: "90px", height: "90px", border: "2px solid #efefef", padding: "3px" }}
            >
              <img
                src={profileData?.profilePicUrl || `https://i.pravatar.cc/150?u=${cleanUsername}`}
                alt="Profile"
                referrerPolicy="no-referrer"
                style={{ border: "1px solid #dbdbdb" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${cleanUsername}`;
                }}
              />
              { }
              <div
                style={{
                  position: "absolute",
                  bottom: "2px",
                  right: "2px",
                  background: "#0095f6",
                  color: "white",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2.5px solid white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  zIndex: 10,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
            </div>

            <div
              className="ig-stats-flex-res"
              style={{ flex: 1, display: "flex", justifyContent: "space-between", gap: 0, paddingRight: "10px" }}
            >
              <div style={{ textAlign: "center" }}>
                <span className="ig-stat-num-res" style={{ fontSize: "1.15rem", marginBottom: 0 }}>
                  {profileData?.mediaCount || 849}
                </span>
                <span className="ig-stat-label-res" style={{ fontSize: "0.85rem" }}>
                  posts
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span className="ig-stat-num-res" style={{ fontSize: "1.15rem", marginBottom: 0 }}>
                  {profileData?.followerCount
                    ? Number(profileData.followerCount).toLocaleString("pt-BR")
                    : "287.296"}
                </span>
                <span className="ig-stat-label-res" style={{ fontSize: "0.85rem" }}>
                  seguidores
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span className="ig-stat-num-res" style={{ fontSize: "1.15rem", marginBottom: 0 }}>
                  {profileData?.followingCount
                    ? Number(profileData.followingCount).toLocaleString("pt-BR")
                    : "12.960"}
                </span>
                <span className="ig-stat-label-res" style={{ fontSize: "0.85rem" }}>
                  seguindo
                </span>
              </div>
            </div>
          </div>
        </div>

        { }
        <div
          className="media-section-title"
          style={{
            marginTop: "25px",
            borderBottom: "1px solid #efefef",
            padding: "0 15px 15px 15px",
            marginBottom: "15px",
            textAlign: "center",
            textTransform: "none",
            fontSize: "1.1rem",
            lineHeight: 1.4,
          }}
        >
          <b className="glow-text-animated-res">Abaixo está os top 10 usuários que interagiram no seu perfil</b>
          <div className="glow-text-animated-res" style={{ fontSize: "0.88rem", fontWeight: 600, marginTop: "4px" }}>
            Clique no usuário para abrir a janela de interação
          </div>
        </div>

        { }
        <div className="stalker-marquee-wrapper">
          <div className="stalker-marquee-track">
            {marqueeStalkers.map((stalker, idx) => (
              <div
                key={`${stalker.id}-${idx}`}
                className="story-item-res"
                onClick={() => openStalkerModal(stalker.username)}
              >
                <div className="story-ring-res">
                  <img
                    src={stalker.avatar}
                    alt={stalker.username}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${stalker.username}`;
                    }}
                  />
                  <span
                    className={`rank-badge-res ${stalker.rankClass}`}
                    style={stalker.rank > 3 ? { background: "#fff", color: "#666" } : undefined}
                  >
                    {stalker.badge}
                  </span>

                  { }
                  <div className="stalker-stats-res">
                    <div className="stat-bubble-res">👁️ {stalker.views}</div>
                    <div className="stat-bubble-res" style={{ color: "#ff3040" }}>
                      ❤️ {stalker.likes}
                    </div>
                    <div className="stat-bubble-res" style={{ color: "#0095f6" }}>
                      💬 {stalker.comments}
                    </div>
                  </div>
                </div>
                <div className="story-username-res">{stalker.username}</div>
              </div>
            ))}
          </div>
        </div>

        { }
        <div className="metrics-grid-res">
          <div className="metric-card-res">
            <div className="metric-val-res" id="metric-visitantes">
              {metrics.visitantes}
            </div>
            <div className="metric-label-res">Visitantes Totais</div>
          </div>
          <div className="metric-card-res">
            <div className="metric-val-res" id="metric-sem-saber">
              {metrics.semSaber}
            </div>
            <div className="metric-label-res">Perfis que te visitam sem você saber</div>
          </div>
          <div className="metric-card-res">
            <div className="metric-val-res" id="metric-prints">
              {metrics.prints}
            </div>
            <div className="metric-label-res">Prints Tirados</div>
          </div>
          <div className="metric-card-res">
            <div className="metric-val-res" id="metric-dms">
              {metrics.dms}
            </div>
            <div className="metric-label-res">DMs Mencionadas</div>
          </div>
        </div>

        { }
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="metric-label-res" style={{ margin: 0, fontSize: "0.85rem" }}>
            ⚡ Atividade Extraída em Tempo Real
          </h2>
          <div className="flex items-center gap-1.5 text-[0.75rem] font-bold text-[#10b981]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
            Ao Vivo
          </div>
        </div>

        <div className="activity-feed-wrapper-res">
          <div className="activity-feed-container-res" id="feedContainer">
            {feedList.map((item) => (
              <div
                key={item.id}
                className="notif-row-res"
                onClick={() => openStalkerModal(item.username)}
                style={{
                  display: "flex",
                  opacity: 1,
                  borderLeft: item.borderPink ? "4px solid rgb(255, 65, 108)" : undefined,
                }}
              >
                <img
                  src={item.avatar}
                  className={`notif-avatar-res ${isDossierUnlocked ? "" : "blur-img"}`}
                  alt={item.username}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${item.username}`;
                  }}
                />
                <div className="notif-content-res">
                  <span className={`notif-username-res ${isDossierUnlocked ? "" : "blur-name"}`}>{item.username}</span>
                  <span className="notif-text">{item.text}</span>
                </div>

                {item.hasPost && item.postImg && (
                  <img
                    src={item.postImg}
                    className={`notif-media-preview-res ${isDossierUnlocked ? "" : "blur-img"}`}
                    alt="post"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        { }
        <h2 className="metric-label-res" style={{ marginBottom: "15px", marginLeft: "5px", textAlign: "center" }}>
          <span className="glow-text-animated-res" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
            💬 MENÇÕES EM CHATS PRIVADOS
          </span>
        </h2>

        <div className="dm-list-container-res">
          {dmList.map((dm) => (
            <div key={dm.id}>
              <div className="dm-item-res" onClick={() => toggleDmDrawer(dm.id)}>
                <img
                  src={dm.avatar}
                  alt={dm.username}
                  className={`dm-avatar-res ${isDossierUnlocked ? "" : "blur-img"}`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${dm.username}`;
                  }}
                />
                <div className="dm-info-res">
                  <div className="dm-user-res">
                    <span className={isDossierUnlocked ? "" : "blur-name"}>@{dm.username}</span>
                    <span className="text-[0.72rem] text-[#0095f6] font-extrabold bg-[#f0f4ff] px-2 py-0.5 rounded-full">
                      ● DM Gravada
                    </span>
                  </div>
                  <div className={`dm-last-msg-res ${isDossierUnlocked ? "" : "blur-target"}`}>{dm.lastMessage}</div>
                </div>
                <div className="text-[0.82rem] font-bold text-[#888]">{dm.time}</div>
              </div>

              { }
              <div className={`chat-drawer-res ${openDmId === dm.id ? "active" : ""}`}>
                {dm.messages.map((m, i) => (
                  <div key={i} className={`dm-bubble-res ${m.isLeft ? "left" : "right"}`}>
                    <span className={isDossierUnlocked ? "" : "blur-target"}>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        { }
        {!isDossierUnlocked ? (
          <div className="floating-cta-container-res">
            <button className="floating-cta-res" onClick={handleOpenDossierSafetyAlert}>
              🔓 Visualizar Dossiê Completo de Conversas
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "20px",
              padding: "16px 20px",
              textAlign: "center",
              marginBottom: "35px",
              boxShadow: "0 10px 25px rgba(34, 197, 94, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "#16a34a",
                fontWeight: 900,
                fontSize: "0.95rem",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              <span>✅</span> DOSSIÊ COMPLETO LIBERADO COM SUCESSO!
            </div>
            <div style={{ color: "#15803d", fontSize: "0.82rem", fontWeight: 500 }}>
              Todas as conversas, mensagens no direct e capturas de tela estão 100% visíveis e desbloqueadas.
            </div>
          </div>
        )}

        { }
        <div className="ig-footer-res">
          <div className="footer-links-res">
            <a href="#">Sobre</a>
            <a href="#">Ajuda</a>
            <a href="#">Imprensa</a>
            <a href="#">API</a>
            <a href="#">Carreiras</a>
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
            <a href="#">Localizações</a>
            <a href="#">Idioma</a>
          </div>
          <div className="footer-copyright-res">© 2026 INSTASPY FROM META SYSTEM</div>
        </div>
      </div>

      { }
      {isSafetyAlertOpen && (
        <div
          className="upsell-modal-overlay"
          id="safetyAlertOverlay"
          style={{ zIndex: 20000005 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSafetyAlertOpen(false);
          }}
        >
          <div className="upsell-modal" style={{ maxWidth: "400px", padding: "40px 25px 35px", borderRadius: "30px", position: "relative" }}>
            <button
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f5f5f5",
                border: "none",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: 800,
                color: "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setIsSafetyAlertOpen(false)}
              id="6fdbfaa3-0a99-f5c3-fc7e-e6f699910b59"
            >
              ✕
            </button>

            <span className="upsell-icon" style={{ fontSize: "3.5rem", marginBottom: "10px", display: "block" }}>
              🛡️
            </span>
            <div
              className="upsell-title"
              style={{
                fontSize: "1.6rem",
                fontWeight: 850,
                color: "#1a1a1a",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "-0.5px",
              }}
            >
              COMPRA 100% SEGURA!
            </div>

            <div className="blink-green">● VALOR REEMBOLSÁVEL!</div>

            <div
              className="upsell-text"
              style={{
                fontSize: "0.92rem",
                color: "#444",
                lineHeight: 1.6,
                marginBottom: "25px",
                textAlign: "left",
                fontWeight: 500,
              }}
            >
              <p style={{ marginBottom: "12px" }}>
                Na próxima etapa, você terá a oportunidade de acessar recursos exclusivos com informações e atividades em tempo real, incluindo registros, capturas de tela, envio de mensagens diretas (DMs) e outras funcionalidades de monitoramento.
              </p>
              <p style={{ marginBottom: "12px" }}>
                Para a liberação imediata de todos esses recursos, é necessária uma taxa única de ativação no valor de <b>{PRICING_CONFIG.resultado.formatted.promotional}</b>.
              </p>
              <div
                style={{
                  background: "rgba(46, 125, 50, 0.05)",
                  borderLeft: "4px solid #2ecc71",
                  padding: "12px",
                  borderRadius: "10px",
                  color: "#15803d",
                  fontWeight: 600,
                  lineHeight: 1.5,
                  marginTop: "15px",
                }}
              >
                ⚠️ caso o conteúdo disponibilizado não atenda às suas expectativas, você poderá solicitar a análise de reembolso, conforme os critérios estabelecidos pela plataforma.
              </div>
            </div>

            <button
              className="upsell-btn"
              onClick={confirmSafetyUnlock}
              style={{
                background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                color: "white",
                padding: "18px",
                borderRadius: "16px",
                fontWeight: 800,
                fontSize: "1.1rem",
                cursor: "pointer",
                border: "none",
                boxShadow: "0 10px 25px rgba(220, 39, 67, 0.35)",
                width: "100%",
              }}
              id="3091e7f6-bed4-b965-05cb-024c8f260412"
            >
              PROSSEGUIR PARA O PAGAMENTO
            </button>
          </div>
        </div>
      )}

      { }
      {isPixModalOpen && (
        <div
          className="upsell-modal-overlay"
          style={{ zIndex: 20000010 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPixModalOpen(false);
          }}
        >
          <div
            className="upsell-modal"
            style={{
              maxWidth: "420px",
              padding: "35px 25px",
              borderRadius: "30px",
              position: "relative",
              textAlign: "center",
            }}
          >
            <button
              className="close-btn"
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f5f5f5",
                border: "none",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: 800,
                color: "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setIsPixModalOpen(false)}
              id="42163b4f-49a1-f31d-c6ae-736e292c857e"
            >
              ✕
            </button>

            <div className="upsell-title" style={{ fontSize: "1.5rem", marginBottom: "5px" }}>
              Liberação Premium
            </div>
            <div style={{ fontSize: "0.9rem", color: "#888", marginBottom: "25px" }}>
              Desbloqueie agora a identidade de quem te vigia
            </div>

            <div
              className="pix-price-upsell"
              style={{
                background: "#f0fdf4",
                color: "#16a34a",
                fontSize: "2.2rem",
                fontWeight: 900,
                padding: "15px 30px",
                borderRadius: "20px",
                border: "2px solid #bbf7d0",
                display: "inline-block",
                marginBottom: "25px",
                animation: "metaPulse 2s infinite",
              }}
            >
              {PRICING_CONFIG.resultado.formatted.promotional}
            </div>

            <div
              id="upsellPixQr"
              style={{
                marginBottom: "25px",
                display: "flex",
                justifyContent: "center",
                background: "white",
                padding: "15px",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                minHeight: "200px",
                alignItems: "center",
              }}
            >
              {isCreatingPix ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-3 border-[#dc2743] border-t-transparent animate-spin" />
                  <span className="text-xs text-gray-500 font-bold">Gerando PIX Oficial TichuPay...</span>
                </div>
              ) : pixCharge?.pix.qrCodeUrl ? (
                <img
                  src={pixCharge.pix.qrCodeUrl}
                  alt="QR Code PIX"
                  className="h-44 w-44 rounded-xl border border-gray-100 shadow-sm"
                />
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#ef4444", fontWeight: "bold" }}>
                  ⚠️ Instabilidade temporária no banco.
                  <br />
                  <button
                    onClick={confirmSafetyUnlock}
                    style={{
                      marginTop: "15px",
                      padding: "10px 20px",
                      background: "#dc2743",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 4px 10px rgba(220, 39, 67, 0.25)",
                    }}
                    id="900c025d-a5fc-ca67-7b02-bf9b5d8439b1"
                  >
                    Gerar Novamente
                  </button>
                </div>
              )}
            </div>

            <div
              className="pix-copy-label"
              style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              PIX COPIA E COLA
            </div>

            <div
              style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "15px",
                fontSize: "0.75rem",
                color: "#444",
                wordBreak: "break-all",
                marginBottom: "20px",
                border: "1px solid #eee",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
              id="upsellPixCode"
              onClick={copyUpsellPix}
            >
              {pixCharge?.pix.copyPasteKey || "Erro ao gerar código Pix. Clique em Gerar Novamente."}
            </div>

            <button
              className="upsell-btn"
              onClick={copyUpsellPix}
              style={{
                marginBottom: "12px",
                background: "#1a1a1a",
                boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
              }}
              id="77f590fa-82dd-2c9e-6c91-97a2f6114bbc"
            >
              {copiedPix ? "✅ Código Pix Copiado!" : "Copiar Código Pix"}
            </button>

            {paymentNotice && (
              <div
                style={{
                  background: "#fff3cd",
                  color: "#856404",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "12px",
                  border: "1px solid #ffeeba",
                  lineHeight: 1.4,
                }}
              >
                ⏳ {paymentNotice}
              </div>
            )}

            <button
              className="upsell-btn"
              onClick={checkUpsellPayment}
              disabled={isCheckingPayment || checkCooldownSecs > 0}
              style={{
                background: isCheckingPayment || checkCooldownSecs > 0 ? "#94a3b8" : "#22c55e",
                boxShadow: isCheckingPayment || checkCooldownSecs > 0 ? "none" : "0 10px 20px rgba(34, 197, 94, 0.25)",
                cursor: isCheckingPayment || checkCooldownSecs > 0 ? "not-allowed" : "pointer",
                opacity: isCheckingPayment || checkCooldownSecs > 0 ? 0.85 : 1,
                transition: "all 0.3s ease",
              }}
              id="upsellConfirmBtn"
            >
              {isCheckingPayment
                ? "⏳ Consultando Gateway..."
                : checkCooldownSecs > 0
                  ? `⏳ Aguarde ${checkCooldownSecs}s para consultar novamente`
                  : "✅ Já Paguei — Liberar Agora"}
            </button>

            <div
              style={{
                fontSize: "0.75rem",
                color: "#888",
                marginTop: "16px",
                marginBottom: "10px",
                fontWeight: 500,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              O sistema identifica seu pagamento em <b>menos de 10 segundos</b> e libera o relatório automaticamente.
            </div>

            { }
            {import.meta.env.DEV && (
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
                <button
                  onClick={handleSimulateDevPayment}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#999",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  ⚡ Testar Aprovação Instantânea (Dev / Teste)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      { }
      {selectedStalker && (
        <div
          className="stalker-modal-overlay-res"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStalker(null);
          }}
        >
          <div className="stalker-modal-res">
            <div className="sm-avatar-res">
              <img
                src={selectedStalker.avatar}
                alt={selectedStalker.username}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${selectedStalker.username}`;
                }}
              />
            </div>
            <div className="sm-username-res">@{selectedStalker.username}</div>

            <div className="sm-stats-res">
              <div className="sm-stat-item-res">
                <span>👁️</span> Visitas no seu perfil: <b>{selectedStalker.views} vezes</b>
              </div>
              <div className="sm-stat-item-res">
                <span>📸</span> Prints registrados: <b>{selectedStalker.prints} capturas</b>
              </div>
              <div className="sm-stat-item-res">
                <span>💬</span> Mensagens diretas: <b>{selectedStalker.dms} conversas</b>
              </div>
              <div className="sm-stat-item-res">
                <span>🔥</span> Interações nos Stories: <b>{selectedStalker.likes} curtidas</b>
              </div>
            </div>

            <button className="sm-btn-res" onClick={() => setSelectedStalker(null)}>
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}
    </>
  );
}
