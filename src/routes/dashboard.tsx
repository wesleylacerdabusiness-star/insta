import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { z } from "zod";
import vslVideoSrc from "@/assets/video/vsl_dashboard_1.mp4";
import pitchGifSrc from "@/assets/animacao_pitch_dashboardv2.gif";
import { SkeletonImage } from "@/components/SkeletonImage";
import {
  fetchInstagramProfile,
  formatInstagramNumber,
  generateRealisticProfileFallback,
  type InstagramProfileData,
} from "@/lib/instagram";
import { PRICING_CONFIG, formatCurrency } from "@/config/pricing";
import { isAuthenticated } from "@/lib/auth";
import {
  createPixChargeServer,
  checkPixChargeStatusServer,
  simulatePixPaymentServer,
  type PixChargeData,
} from "@/lib/payment";
import {
  trackInitiateCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackOpenPaymentModal,
  trackViewContent,
  getStoredUtmParams,
  trackCopyPixCode,
} from "@/lib/tracking";

export const Route = createFileRoute("/dashboard")({
  validateSearch: z.object({
    username: z.string().optional(),
    gender: z.string().optional(),
  }),
  component: DashboardPage,
  head: () => ({
    title: "Relatório Completo - InstaSpy",
    meta: [
      { name: "description", content: "Relatório completo de stalkers e atividades anônimas no InstaSpy." },
    ],
  }),
});

const VerifiedBadge = ({ size = 18 }: { size?: number }) => (
  <svg
    aria-label="Verificado"
    fill="#0095f6"
    height={size}
    width={size}
    viewBox="0 0 40 40"
    className="inline-block flex-shrink-0"
    style={{ transform: "translateY(-1px)" }}
  >
    <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.235L0 14.357l3.093 5.641L0 25.639l5.432 2.972v6.234h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.155h6.235v-6.234L40 25.639l-3.094-5.641L40 14.357l-5.435-2.972V5.15h-6.234L25.358 0l-5.36 3.094Z" />
    <path d="m14.72 18.75 4.334 4.333 7.357-7.358 2.356 2.357-9.713 9.713-6.688-6.688 2.354-2.357Z" fill="white" />
  </svg>
);

const StoryVerifiedBadge = () => (
  <svg className="h-[14px] w-[14px] flex-shrink-0 inline-block" viewBox="0 0 40 40" fill="#0095f6">
    <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.235L0 14.357l3.093 5.641L0 25.639l5.432 2.972v6.234h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.155h6.235v-6.234L40 25.639l-3.094-5.641L40 14.357l-5.435-2.972V5.15h-6.234L25.358 0l-5.36 3.094Z" />
    <path d="m14.72 18.75 4.334 4.333 7.357-7.358 2.356 2.357-9.713 9.713-6.688-6.688 2.354-2.357Z" fill="white" />
  </svg>
);

const stalkerData = [
  { id: 1, user: "garagem_gafanhoto", rank: "🥇", views: "48", likes: "14", mentions: "5", pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
  { id: 2, user: "rafaelly_olinda", rank: "🥈", views: "42", likes: "11", mentions: "4", pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { id: 3, user: "luxodoareal", rank: "🥉", views: "38", likes: "9", mentions: "3", pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
  { id: 4, user: "paulorochaaju", rank: "4", views: "31", likes: "7", mentions: "2", pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { id: 5, user: "andreamarianascimento", rank: "5", views: "29", likes: "6", mentions: "2", pic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80" },
  { id: 6, user: "zunterlucas", rank: "6", views: "24", likes: "5", mentions: "1", pic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
  { id: 7, user: "jemmyssonsantos", rank: "7", views: "21", likes: "4", mentions: "1", pic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
  { id: 8, user: "barroscristina201", rank: "8", views: "19", likes: "3", mentions: "1", pic: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
  { id: 9, user: "jeffecage", rank: "9", views: "16", likes: "2", mentions: "1", pic: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" },
  { id: 10, user: "fabyanase1960", rank: "10", views: "14", likes: "2", mentions: "0", pic: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" },
  { id: 11, user: "thiagosilva_aju", rank: "11", views: "13", likes: "3", mentions: "1", pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { id: 12, user: "camila_rocha88", rank: "12", views: "12", likes: "4", mentions: "2", pic: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
  { id: 13, user: "lucasfelipemendes", rank: "13", views: "11", likes: "2", mentions: "0", pic: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80" },
  { id: 14, user: "mari_santana_sp", rank: "14", views: "10", likes: "2", mentions: "1", pic: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
  { id: 15, user: "rodrigo_alves_ba", rank: "15", views: "9", likes: "1", mentions: "0", pic: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80" },
];

function buildRandomFeedActivities(userTarget: string) {
  const target = userTarget || "usuario";
  return [
    { user: "marcones_pimentell", text: `Mencionou você em uma conversa com @fn...`, pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { user: "nat23rs", text: `Mencionou @${target} em um grupo privado`, pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { user: "netobarbozabarboza", text: "Tirou print do seu perfil há 12h", pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { user: "fntsotavio", text: `Comentou em um post com foto: "Olha isso aqui mano..."`, pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", postIndex: 0 },
    { user: "nat23rs", text: "Tirou print da sua publicação recente há 2h", pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", postIndex: 1 },
    { user: "elizangelacosta875", text: `Visitou o perfil de @${target} 8x nas últimas 24h`, pic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80" },
    { user: "barroscristina201", text: "Tirou print dos seus stories há 3h", pic: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { user: "chiquinho_alvaia", text: `Olhou todas as fotos de @${target} há 2h`, pic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
    { user: "fabyanase1960", text: "Visitou seu perfil 3x nos últimos 40 minutos", pic: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" },
    { user: "zunterlucas", text: `Mencionou @${target} em um Direct privado com @ch...`, pic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { user: "antoniorodriguesdos705", text: "Compartilhou sua publicação no direct há 12h", pic: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", postIndex: 2 },
    { user: "marciossilveira", text: `Comentou: "Você viu o que @${target} postou?..."`, pic: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80", postIndex: 3 },
    { user: "taise_cardoso94", text: "Enviou seu Story para @fab... há 3 dias", pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { user: "marcilioze", text: `Comentou na foto: "Caramba, mudou muito..."`, pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", postIndex: 4 },
    { user: "luxodoareal", text: "Tirou print da sua publicação há 6h", pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", postIndex: 5 },
    { user: "andreamarianascimento", text: `Apagou uma mensagem que mencionava @${target} há 2 dias`, pic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80" },
    { user: "thiagosilva_aju", text: "Visualizou seus stories anonimamente há 1h", pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { user: "camila_rocha88", text: "Encaminhou um print seu para 3 pessoas no WhatsApp", pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { user: "lucasfelipemendes", text: "Pesquisou seu nome na aba de busca 3x hoje", pic: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80" },
    { user: "mari_santana_sp", text: "Deu zoom na sua última foto 2x", pic: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { user: "rodrigo_alves_ba", text: "Salvou seu Reel na coleção secreta há 5h", pic: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80" },
    { user: "debora_siqueira_ba", text: "Gravou a tela enquanto assistia aos seus stories", pic: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
  ];
}

function buildRandomDMs(userTarget: string) {
  const target = userTarget || "usuario";
  return [
    {
      id: 0,
      user: "garagem_gafanhoto",
      time: "56min atrás",
      pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      lastMsg: `Falaram que @${target} comprou seguidor porque do nada subiu o número lá de forma estranha`,
      messages: [
        { side: "left", text: `Mano, tu reparou que o perfil de @${target} subiu mto de número essa semana?` },
        { side: "right", text: "Reparei sim pai, na segunda tava com pouco, hoje acordou com muito mais seguidor." },
        { side: "left", text: "Mto estranho mano, o engajamento é mto vazio pra viralizar desse jeito do nada." },
        { side: "right", text: "Os caras do grupo já foram checar as contas que tão seguindo no aplicativo." },
        { side: "left", text: "E aí, descobriram que é tudo conta fake com nome estranho e sem foto?" },
        { side: "right", text: "Acertou parceiro, puro desespero pra comprar status e tentar fechar publi." },
        { side: "left", text: "Que patético alguém gastar dinheiro pra inflar número falso na internet, mico." },
        { side: "right", text: "O engajamento nas fotos continua baixo, poucas curtidas e comentários vazios kkk." },
        { side: "left", text: "Uma comédia pura a falta de semancol pra tentar parecer famoso por aqui." },
        { side: "right", text: `Falaram que @${target} comprou seguidor porque do nada subiu o número lá de forma estranha` },
      ],
    },
    {
      id: 1,
      user: "paulorochaaju",
      time: "29min atrás",
      pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      lastMsg: "Os caras tavam vendo os destaques e rindo daquelas fotos antigas, que mancada",
      messages: [
        { side: "left", text: `velho, tu viu as fotos antigas que @${target} deixou salvas nos destaques do Insta?` },
        { side: "right", text: "Vi sim pai kkkk o visual de anos atrás tava mto bizarro e mto diferente." },
        { side: "left", text: "Os manos da firma tavam olhando aquilo na hora do almoço e rindo no grupo." },
        { side: "right", text: "Kkkk usava umas roupas estranhas e um corte de cabelo mto sem nexo msm." },
        { side: "left", text: "Hoje paga de influencer moderno e minimalista no feed, mto forçado." },
        { side: "right", text: "O passado condena mto parceiro, a evolução estética foi mto na marra kkk." },
        { side: "left", text: "Sacanagem msm irem lá no fundo do perfil só pra achar motivo de deboche." },
        { side: "right", text: "Mas o mico é inevitável velho, devia ter apagado aquilo pra não passar vergonha." },
        { side: "left", text: "Vou printar as fotos antigas pra mandar na nossa resenha agora msm." },
        { side: "right", text: "Os caras tavam vendo os destaques e rindo daquelas fotos antigas, que mancada" },
      ],
    },
    {
      id: 2,
      user: "zunterlucas",
      time: "4min atrás",
      pic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      lastMsg: `Tão comentando que @${target} só anda junto com o pessoal por puro interesse`,
      messages: [
        { side: "left", text: `Mano, tu sabe se @${target} tá colando de verdade com a rapaziada nos rolês?` },
        { side: "right", text: "Tá indo toda semana pai, mas os caras já sacaram qual é a intenção." },
        { side: "left", text: "Ih mano, solta o verbo, tá forçando amizade pra ganhar status por lá?" },
        { side: "right", text: "Exatamente, só anda com a galera pra tirar foto pro feed e marcar locais caros." },
        { side: "left", text: "Pura fachada msm, interesseiro demais, usa as pessoas pra subir engajamento." },
        { side: "right", text: "Sim, na hora de ajudar na conta ou dividir as coisas finge demência e some." },
        { side: "left", text: "Mto folgado msm, os caras já tão perdendo a paciência com essa marra." },
        { side: "right", text: "Na próxima resenha simplesmente vai ficar de fora da lista, ranço total." },
        { side: "left", text: "Fez mto bem pai, gente aproveitadora não tem espaço na nossa roda msm." },
        { side: "right", text: `Tão comentando que @${target} só anda junto com o pessoal por puro interesse` },
      ],
    },
    {
      id: 3,
      user: "barroscristina201",
      time: "32min atrás",
      pic: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      lastMsg: "Aquele cara que fechava junto tá falando pra Deus e o mundo o tamanho do vacilo",
      messages: [
        { side: "left", text: `velho, tu viu que o ex-amigo de @${target} soltou uma indireta pesada ontem?` },
        { side: "right", text: "Vi sim pai, achei mto pesada a sequência de postagens detonando nas redes." },
        { side: "left", text: "Eles eram mto grudados antes, pareciam inseparáveis no feed, né." },
        { side: "right", text: "Tudo falsidade irmão, por trás das câmeras sugava mto a energia e os contatos." },
        { side: "left", text: "Caralho mano, mto feio ver uma amizade acabar em exposed público assim." },
        { side: "right", text: "O maluco tá falando pra Deus e o mundo o tamanho do vacilo que rolou." },
        { side: "left", text: "A reputação na cidade foi pro espaço depois dessa treta exposta msm." },
        { side: "right", text: "Eu msm já me afastei de qualquer projeto com essa pessoa, quero distância." },
        { side: "left", text: "Certinho pai, foca nas tuas coisas que tu ganha mto mais paz." },
        { side: "right", text: "Aquele cara que fechava junto tá falando pra Deus e o mundo o tamanho do vacilo" },
      ],
    },
    {
      id: 4,
      user: "jeffecage",
      time: "18min atrás",
      pic: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      lastMsg: `Disseram que os stories de @${target} são super forçados, povo não perdoa`,
      messages: [
        { side: "left", text: `Mano, tu conseguiu assistir aos stories que @${target} postou ontem?` },
        { side: "right", text: "Tentei assistir pai, mas o jeito forçado de falar na câmera me dá vergonha alheia." },
        { side: "left", text: "Pqp msm, faz aqueles trejeitos de influencer gringo que ficam super cafonas." },
        { side: "right", text: "Falta de autenticidade total, o povo nos grupos tá só debochando." },
        { side: "left", text: "E jura que tá arrasando com aquele conteúdo vazio, coitado." },
        { side: "right", text: "Não tem um amigo de verdade pra avisar que tá passando vergonha pública." },
        { side: "left", text: "Eu silenciei a conta faz tempo pra não poluir meu feed com isso." },
        { side: "right", text: "Dou mta risada com os surtos de ego que arruma pra tentar aparecer." },
        { side: "left", text: "Vamos focar no nosso corre que a gente ganha mto mais pai." },
        { side: "right", text: `Disseram que os stories de @${target} são super forçados, povo não perdoa` },
      ],
    },
    {
      id: 5,
      user: "jemmyssonsantos",
      time: "40min atrás",
      pic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      lastMsg: "O grupo tá comentando até agora sobre a confusão que rolou no final de semana",
      messages: [
        { side: "left", text: `velho, tu viu a fofoca sobre @${target} no evento de sábado?` },
        { side: "right", text: "Não vi não pai, meu WhatsApp tá apitando sem parar com print hoje." },
        { side: "left", text: "Arrumou uma confusão com a galera do camarote e tentou dar carteirada kkk." },
        { side: "right", text: "Mentira irmão? Que cara de pau, o nível de sem noção passou dos limites." },
        { side: "left", text: "Sim, filmaram tudo e jogaram no chat dos organizadores, maior mico." },
        { side: "right", text: "No Insta paga de pessoa zen, de bem com a vida e cheia de princípios kkk." },
        { side: "left", text: "Puro personagem de internet chefe, na vida real é pura pose e arrogância." },
        { side: "right", text: "O pessoal já tá cortando de todos os eventos VIPs da cidade." },
        { side: "left", text: "Eu fico só assistindo de camarote e rindo da falsidade." },
        { side: "right", text: "O grupo tá comentando até agora sobre a confusão que rolou no final de semana" },
      ],
    },
    {
      id: 6,
      user: "luxodoareal",
      time: "12min atrás",
      pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      lastMsg: `Tão dizendo que @${target} finge uma vida perfeita, mas na real tá cheio de dívidas`,
      messages: [
        { side: "left", text: `Mano, tu viu o post ostentação que @${target} fez mostrando coisas caras?` },
        { side: "right", text: "Vi sim pai, mas o pessoal próximo me contou o segredo real dessa pose toda." },
        { side: "left", text: "Ih mano, solta o verbo logo, não é dono de nada daquilo né?" },
        { side: "right", text: "É tudo alugado ou emprestado só pra tirar foto pro feed e parecer rico." },
        { side: "left", text: "Caralho mano kkk o desespero pra inventar vida perfeita na internet é bizarro." },
        { side: "right", text: "Vive de criar cenário de riqueza falsa pra tentar atrair seguidor ingênuo." },
        { side: "left", text: "E o pior é ver o pessoal nos comentários acreditando na ilusão." },
        { side: "right", text: "A falta de vergonha na cara me assusta de verdade nos bastidores." },
        { side: "left", text: "O tombo quando a verdade vier à tona vai ser histórico na internet." },
        { side: "right", text: `Tão dizendo que @${target} finge uma vida perfeita, mas na real tá cheio de dívidas` },
      ],
    },
    {
      id: 7,
      user: "camila_rocha88",
      time: "5min atrás",
      pic: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
      lastMsg: `Viram que @${target} apagou os comentários da foto antiga para esconder a treta`,
      messages: [
        { side: "left", text: `Amiga, tu viu que @${target} limpou a aba de comentários da foto antiga?` },
        { side: "right", text: "Vi sim! Apagou tudo que a ex-amiga tinha comentado na semana passada." },
        { side: "left", text: "Tentou fingir que nada aconteceu pra ninguém desconfiar no perfil." },
        { side: "right", text: "Mas os prints já circulam em mais de 3 grupos de fofoca aqui da cidade kkk." },
        { side: "left", text: "Tarde demais pra tentar apagar o rastro né amiga!" },
        { side: "right", text: `Viram que @${target} apagou os comentários da foto antiga para esconder a treta` },
      ],
    },
  ];
}

function DashboardPage() {
  const { username: rawUsername = "", gender } = Route.useSearch();
  const cleanUsername = rawUsername.trim().replace(/^@/, "").toLowerCase();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<InstagramProfileData | null>(() => {
    if (typeof window === "undefined" || !cleanUsername) return null;
    try {
      const saved = localStorage.getItem("instaspy_profile_data_" + cleanUsername);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showPixModal, setShowPixModal] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [countdown, setCountdown] = useState(899);
  const [notifVisible, setNotifVisible] = useState(false);
  const [openChatId, setOpenChatId] = useState<number | null>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      navigate({
        to: "/register",
        search: { redirect: window.location.pathname + window.location.search },
      });
    }
  }, [navigate]);

  useEffect(() => {
    trackViewContent("Dashboard - @" + cleanUsername);
  }, []);

  const [currentCharge, setCurrentCharge] = useState<PixChargeData | null>(null);
  const [isCreatingCharge, setIsCreatingCharge] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const feedActivities = useMemo(() => buildRandomFeedActivities(cleanUsername), [cleanUsername]);
  const interceptedDMs = useMemo(() => buildRandomDMs(cleanUsername), [cleanUsername]);

  const [currentNotif, setCurrentNotif] = useState(feedActivities[0]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const storiesSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPixModal && !currentCharge && !isCreatingCharge) {
      setIsCreatingCharge(true);
      trackInitiateCheckout(PRICING_CONFIG.dashboardModal.promotionalPrice);
      trackOpenPaymentModal("dashboard", PRICING_CONFIG.dashboardModal.promotionalPrice);
      createPixChargeServer({
        data: {
          amount: PRICING_CONFIG.dashboardModal.promotionalPrice,
          description: `${PRICING_CONFIG.dashboardModal.pixDescription} - @${cleanUsername || "usuario"}`,
          customer: { name: cleanUsername || "Cliente InstaSpy" },
          tracking: getStoredUtmParams(),
        },
      })
        .then((charge) => {
          setCurrentCharge(charge);
          setCountdown(charge.pix.expiresInSeconds || 899);
          trackAddPaymentInfo(charge.amount);
        })
        .catch((err) => {
          console.error("Erro ao gerar cobrança PIX:", err);
        })
        .finally(() => {
          setIsCreatingCharge(false);
        });
    }
  }, [showPixModal, currentCharge, isCreatingCharge, cleanUsername]);

  useEffect(() => {
    if (!showPixModal || !currentCharge?.id || paymentConfirmed) return;

    const pollInterval = setInterval(() => {
      checkPixChargeStatusServer({
        data: {
          chargeId: currentCharge.id,
          amount: currentCharge.amount,
          contentName: PRICING_CONFIG.dashboardModal.pixDescription,
          externalId: cleanUsername,
          tracking: getStoredUtmParams(),
        },
      })
        .then((res) => {
          if (res.status === "paid") {
            setPaymentConfirmed(true);
            clearInterval(pollInterval);
            trackPurchase(
              currentCharge.amount,
              "BRL",
              PRICING_CONFIG.dashboardModal.pixDescription,
              currentCharge.id
            );
          }
        })
        .catch((err) => console.warn("Polling payment status:", err));
    }, PRICING_CONFIG.pixPollingIntervalMs || 7000);

    return () => clearInterval(pollInterval);
  }, [showPixModal, currentCharge?.id, paymentConfirmed]);

  useEffect(() => {
    if (!cleanUsername) return;
    fetchInstagramProfile(cleanUsername)
      .then((data: InstagramProfileData) => {
        if (data?.status === "success") setProfileData(data);
      })
      .catch((err: any) => {
        console.warn("Dashboard profile fetch fallback:", err);
      });
  }, [cleanUsername]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(percent);
    }
  };

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => { });
      setIsMuted(false);
    }
  };

  const closeOnboarding = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowOnboarding(false);
  };

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % feedActivities.length;
      setCurrentNotif(feedActivities[index]);
      setNotifVisible(true);

      setTimeout(() => {
        setNotifVisible(false);
      }, 4000);
    }, 9000);

    const initialTimer = setTimeout(() => {
      setNotifVisible(true);
      setTimeout(() => setNotifVisible(false), 4000);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [feedActivities]);

  useEffect(() => {
    const slider = storiesSliderRef.current;
    if (!slider) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let autoScrollEnabled = true;
    let animationId: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      autoScrollEnabled = false;
      slider.style.cursor = "grabbing";
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      autoScrollEnabled = true;
      slider.style.cursor = "grab";
    };

    const onMouseUp = () => {
      isDown = false;
      autoScrollEnabled = true;
      slider.style.cursor = "grab";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener("mousedown", onMouseDown);
    slider.addEventListener("mouseleave", onMouseLeave);
    slider.addEventListener("mouseup", onMouseUp);
    slider.addEventListener("mousemove", onMouseMove);

    let currentScroll = slider.scrollLeft;

    const autoScroll = () => {
      if (autoScrollEnabled && !isDown && slider) {
        currentScroll += 0.85;
        slider.scrollLeft = currentScroll;
        const maxScroll = slider.scrollWidth / 2;
        if (currentScroll >= maxScroll) {
          currentScroll -= maxScroll;
          slider.scrollLeft = currentScroll;
        }
      } else if (slider) {
        currentScroll = slider.scrollLeft;
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);

    return () => {
      cancelAnimationFrame(animationId);
      slider.removeEventListener("mousedown", onMouseDown);
      slider.removeEventListener("mouseleave", onMouseLeave);
      slider.removeEventListener("mouseup", onMouseUp);
      slider.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyPix = () => {
    const pixKey =
      currentCharge?.pix.copyPasteKey ||
      "00020126580014br.gov.bcb.pix0136e088d451-instaspy-acesso-vip520400005303986540527.905802BR5925INSTASPY TECNOLOGIA LTDA6009SAO PAULO62070503***6304E8A2";
    navigator.clipboard
      .writeText(pixKey)
      .then(() => {
        setCopiedPix(true);
        trackCopyPixCode("dashboard", PRICING_CONFIG.dashboardModal.promotionalPrice);
        setTimeout(() => setCopiedPix(false), 3000);
      })
      .catch(() => { });
  };

  const handleSimulatePayment = () => {
    if (currentCharge?.id) {
      simulatePixPaymentServer({ data: currentCharge.id }).then(() => {
        setPaymentConfirmed(true);
      });
    } else {
      setPaymentConfirmed(true);
    }
  };

  const goToCheckout = () => {
    navigate({
      to: "/checkout",
      search: {
        username: cleanUsername,
        gender,
      },
    });
  };

  const defaultGridThumbnails = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  ];

  const fallbackProfile = useMemo(
    () => generateRealisticProfileFallback(cleanUsername || "usuario"),
    [cleanUsername]
  );

  const displayName =
    profileData?.fullName && profileData.fullName !== cleanUsername
      ? profileData.fullName
      : fallbackProfile.fullName;
  const displayBio = profileData?.biography || fallbackProfile.biography;
  const displayPosts = formatInstagramNumber(
    profileData?.mediaCount,
    fallbackProfile.mediaCount.toString()
  );
  const displayFollowers = formatInstagramNumber(
    profileData?.followerCount,
    fallbackProfile.followerCount.toString()
  );
  const displayFollowing = formatInstagramNumber(
    profileData?.followingCount,
    fallbackProfile.followingCount.toString()
  );

  return (
    <div className="w-full min-h-screen bg-[#f4f7f6] text-[#1a1a1a] font-sans pb-28 antialiased selection:bg-[#cc2366] selection:text-white overflow-x-hidden">
      { }
      {currentNotif && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-[92%] max-w-[380px] rounded-2xl bg-white/95 backdrop-blur-[15px] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-black/10 flex items-center gap-3 transition-all duration-500 ease-out ${notifVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
            }`}
        >
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-sm border border-black/5">
            <img
              src={currentNotif.pic}
              alt=""
              className="h-full w-full object-cover blur-[5px] scale-110"
            />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[0.85rem] font-bold text-[#262626] mb-0.5 inline-block blur-[4px] bg-[#eee] px-1 rounded">
              {currentNotif.user}
            </div>
            <div className="text-[0.78rem] text-[#444] leading-tight line-clamp-2">
              {currentNotif.text}
            </div>
          </div>
        </div>
      )}

      { }
      <div className="w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 animate-fade-in-up">
        { }
        <header className="text-center mb-8 pt-2">
          <h1 className="text-[2.2rem] sm:text-[2.5rem] font-extrabold tracking-tight instagram-text mb-1 flex items-center justify-center gap-2">
            <span>InstaSpy</span> <VerifiedBadge size={22} />
          </h1>
          <p className="text-[1rem] text-[#666] font-medium">Descubra quem está falando de você!</p>
        </header>

        { }
        <div className="rounded-[20px] bg-white border border-[#efefef] shadow-[0_20px_60px_rgba(0,0,0,0.08)] mb-6 overflow-hidden transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between p-4 border-b border-[#eee]">
            <div className="font-bold text-[1.1rem] flex items-center gap-2">
              <span
                onClick={() => navigate({ to: "/search" as any })}
                className="text-[#666] cursor-pointer text-lg font-normal hover:text-black"
              >
                &lt;
              </span>
              <span>{cleanUsername || "aledococo"}</span>
              {profileData?.isVerified && <VerifiedBadge size={16} />}
            </div>
            <div className="font-bold tracking-widest text-[#666] cursor-pointer">...</div>
          </div>

          <div className="flex items-center p-5 gap-5">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-full instagram-bg p-[3px]">
              {(!profileData?.profilePicUrl || !isImageLoaded) && (
                <div className="absolute inset-[3px] z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse border-2 border-white">
                  <svg className="h-8 w-8 text-gray-400/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
              {profileData?.profilePicUrl && (
                <img
                  src={profileData.profilePicUrl}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  onLoad={() => setIsImageLoaded(true)}
                  className={`h-full w-full rounded-full border-2 border-white object-cover transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${cleanUsername}`;
                    setIsImageLoaded(true);
                  }}
                />
              )}
            </div>
            <div className="flex-1 flex justify-around text-center">
              <div className="flex flex-col">
                <span className="font-bold text-[1.1rem] sm:text-[1.2rem]">{displayPosts}</span>
                <span className="text-[0.8rem] text-[#666]">posts</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[1.1rem] sm:text-[1.2rem]">{displayFollowers}</span>
                <span className="text-[0.8rem] text-[#666]">seguidores</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[1.1rem] sm:text-[1.2rem]">{displayFollowing}</span>
                <span className="text-[0.8rem] text-[#666]">seguindo</span>
              </div>
            </div>
          </div>

          <div className="px-5 pb-4 text-[0.92rem] leading-relaxed text-[#1a1a1a] whitespace-pre-line text-left">
            <div className="font-bold mb-0.5">{displayName}</div>
            {displayBio}
          </div>

          <div className="flex gap-2.5 px-5 pb-5">
            <button
              onClick={goToCheckout}
              className="flex-1 bg-[#efefef] text-[#000] font-semibold text-[0.88rem] py-2.5 rounded-lg cursor-pointer hover:bg-[#e4e4e4] transition-colors"
            >
              Editar perfil
            </button>
            <button
              onClick={goToCheckout}
              className="flex-1 bg-[#efefef] text-[#000] font-semibold text-[0.88rem] py-2.5 rounded-lg cursor-pointer hover:bg-[#e4e4e4] transition-colors"
            >
              Compartilhar perfil
            </button>
            <button
              onClick={goToCheckout}
              className="w-10 bg-[#efefef] text-[#000] font-semibold text-[1rem] flex items-center justify-center rounded-lg cursor-pointer hover:bg-[#e4e4e4] transition-colors"
            >
              👤+
            </button>
          </div>
        </div>

        { }
        <div className="my-6">
          <div className="rounded-[20px] overflow-hidden animate-pitch-glow shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-black/5">
            <img
              src={pitchGifSrc}
              alt="InstaSpy Dashboard"
              className="w-full block rounded-[20px]"
              loading="eager"
            />
          </div>
        </div>

        { }
        <div className="rounded-[24px] bg-white border border-[#efefef] shadow-[0_20px_60px_rgba(0,0,0,0.08)] mb-8 overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-[#fafafa] text-left">
            <div className="h-12 w-12 rounded-full overflow-hidden border border-[#efefef] bg-gray-100 flex-shrink-0">
              <SkeletonImage src={profileData?.profilePicUrl} alt="" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[1rem] flex items-center gap-1">
                {cleanUsername || "aledococo"} {profileData?.isVerified && <VerifiedBadge size={14} />}
              </div>
              <div className="text-[0.85rem] text-[#737373]">{displayName} 📈</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[2px] bg-[#fafafa] p-[2px]">
            {(profileData?.mediaThumbnails && profileData.mediaThumbnails.length > 0
              ? profileData.mediaThumbnails.slice(0, 9)
              : Array(6).fill(null)
            ).map((thumb, idx) => (
              <div key={idx} className="aspect-square w-full bg-gray-100 overflow-hidden">
                <SkeletonImage src={thumb} alt="" className="cursor-pointer hover:opacity-85" />
              </div>
            ))}
          </div>

          <div className="flex justify-around p-4 bg-white border-t border-[#efefef]">
            <div className="text-center">
              <span className="font-bold text-[1rem] block text-black">{displayPosts}</span>
              <span className="text-[0.78rem] text-[#737373]">posts</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-[1rem] block text-black">{displayFollowers}</span>
              <span className="text-[0.78rem] text-[#737373]">seguidores</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-[1rem] block text-black">{displayFollowing}</span>
              <span className="text-[0.78rem] text-[#737373]">seguindo</span>
            </div>
          </div>
        </div>

        { }
        <div className="mb-10 text-center">
          <div className="mb-4">
            <h2 className="text-[1.2rem] sm:text-[1.3rem] font-black bg-gradient-to-r from-[#ff416c] via-[#833ab4] to-[#f09433] bg-clip-text text-transparent inline-block leading-tight">
              Pessoas que estão stalkeando seu perfil nos últimos 3 dias
            </h2>
          </div>

          <div className="relative rounded-[22px] bg-white p-[22px_0_52px_0] border border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.06)] animate-stalker-glow">
            { }
            <div
              ref={storiesSliderRef}
              className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none cursor-grab select-none"
              style={{ scrollbarWidth: "none" }}
            >
              {stalkerData.concat(stalkerData).concat(stalkerData).map((st, i) => (
                <div
                  key={`${st.id}-${i}`}
                  onClick={goToCheckout}
                  className="flex flex-col items-center flex-shrink-0 w-[92px] cursor-pointer"
                >
                  <div className="relative h-[84px] w-[84px] rounded-full instagram-bg p-[3px] mb-2">
                    <img
                      src={st.pic}
                      alt={st.user}
                      className="h-full w-full rounded-full border-2 border-white object-cover blur-[10px] scale-110 brightness-110"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[0.75rem] font-black shadow-sm ${st.rank === "🥇"
                          ? "bg-gradient-to-br from-[#f6d365] to-[#fda085] text-white"
                          : st.rank === "🥈"
                            ? "bg-gradient-to-br from-[#b0b0b0] to-[#d0d0d0] text-white"
                            : st.rank === "🥉"
                              ? "bg-gradient-to-br from-[#cd7f32] to-[#e8a87c] text-white"
                              : "bg-[#f0f0f0] text-[#666]"
                        }`}
                    >
                      {st.rank}
                    </span>
                  </div>
                  <div className="text-[0.75rem] font-semibold text-[#262626] truncate max-w-[85px] blur-[4px] bg-[#eee] px-1 rounded">
                    {st.user}
                  </div>
                  <div className="mt-1 flex gap-1.5 text-[0.65rem] font-bold text-[#666]">
                    <span>👁️ {st.views}</span>
                    <span className="text-[#ff3040]">❤️ {st.likes}</span>
                  </div>
                </div>
              ))}
            </div>

            { }
            <div className="absolute -bottom-5 left-0 right-0 flex justify-center px-4 z-20">
              <button
                onClick={goToCheckout}
                className="w-full max-w-[420px] rounded-2xl instagram-bg py-4 px-6 text-white font-extrabold text-[0.98rem] shadow-[0_10px_30px_rgba(220,39,67,0.35)] cursor-pointer flex items-center justify-center gap-2 animate-pulse-cta hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>Descubra quem está falando de você!</span>
              </button>
            </div>
          </div>
        </div>

        { }
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 mt-6">
          <div className="rounded-2xl border border-[#e0e0e0] bg-white p-4 text-left shadow-sm">
            <div className="text-2xl mb-1">👁️</div>
            <div className="text-2xl font-extrabold text-[#ff416c]">147</div>
            <div className="text-[0.75rem] font-bold text-[#666] uppercase">Visitas no perfil</div>
          </div>
          <div className="rounded-2xl border border-[#e0e0e0] bg-white p-4 text-left shadow-sm">
            <div className="text-2xl mb-1">📸</div>
            <div className="text-2xl font-extrabold text-[#f39c12]">38</div>
            <div className="text-[0.75rem] font-bold text-[#666] uppercase">Prints tirados</div>
          </div>
          <div className="rounded-2xl border border-[#e0e0e0] bg-white p-4 text-left shadow-sm">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-2xl font-extrabold text-[#ff416c]">24</div>
            <div className="text-[0.75rem] font-bold text-[#666] uppercase">Menções em chats</div>
          </div>
          <div className="rounded-2xl border border-[#e0e0e0] bg-white p-4 text-left shadow-sm">
            <div className="text-2xl mb-1">🕵️</div>
            <div className="text-2xl font-extrabold text-[#f39c12]">89</div>
            <div className="text-[0.75rem] font-bold text-[#666] uppercase">Vistas anônimas</div>
          </div>
        </div>

        { }
        <div className="mb-8">
          <div className="text-center font-extrabold text-[0.85rem] text-[#262626] uppercase tracking-wider border-b-2 border-[#efefef] pb-2 mb-4">
            ATIVIDADE EM TEMPO REAL
          </div>

          <div className="rounded-[20px] bg-white border border-[#efefef] shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto divide-y divide-[#f5f5f5]">
              {feedActivities.map((act, idx) => (
                <div
                  key={idx}
                  onClick={goToCheckout}
                  className="flex items-center gap-3.5 p-4 hover:bg-[#fafafa] cursor-pointer transition-colors text-left"
                >
                  <img
                    src={act.pic}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-full border border-[#efefef] object-cover blur-[6px]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.92rem] font-bold text-[#262626] blur-[4px] bg-[#eee] inline-block px-1 rounded mb-0.5">
                      {act.user}
                    </div>
                    <div className="text-[0.84rem] text-[#444] leading-tight">
                      {act.text}
                    </div>
                  </div>
                  {typeof act.postIndex === "number" && (
                    <div className="h-12 w-12 flex-shrink-0 rounded-md border border-[#e0e0e0] overflow-hidden bg-gray-100">
                      <SkeletonImage
                        src={
                          profileData?.mediaThumbnails?.length
                            ? profileData.mediaThumbnails[
                            act.postIndex % profileData.mediaThumbnails.length
                            ]
                            : undefined
                        }
                        alt="post"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        { }
        <div className="mb-10 text-left">
          <div className="text-center font-extrabold text-[0.85rem] text-[#262626] uppercase tracking-wider border-b-2 border-[#efefef] pb-2 mb-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff416c] animate-ping" />
            <span>7 MENÇÕES EM DMs INTERCEPTADAS</span>
          </div>

          <div className="rounded-[22px] bg-white border border-[#efefef] shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[#f1f1f1]">
            {interceptedDMs.map((dm) => {
              const isOpen = openChatId === dm.id;
              return (
                <div key={dm.id} className="transition-colors">
                  { }
                  <div
                    onClick={() => setOpenChatId(isOpen ? null : dm.id)}
                    className="flex items-center gap-3.5 p-4 hover:bg-[#fafafa] cursor-pointer transition-colors"
                  >
                    <div className="h-12 w-12 flex-shrink-0 rounded-full instagram-bg p-[2px]">
                      <img
                        src={dm.pic}
                        alt=""
                        className="h-full w-full rounded-full border-2 border-white object-cover blur-[5px]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[0.92rem] font-bold text-[#262626] blur-[4px] bg-[#eee] px-1 rounded">
                          {dm.user}
                        </span>
                        <span className="text-[0.75rem] text-[#888] font-medium">• {dm.time}</span>
                      </div>
                      <div className="text-[0.82rem] text-[#555] truncate leading-tight">
                        {dm.lastMsg}
                      </div>
                    </div>
                    <div className="text-[#0095f6] text-[1.4rem] font-black px-1">•</div>
                  </div>

                  { }
                  {isOpen && (
                    <div className="bg-[#f8f9fa] border-t border-[#f0f0f0] p-4 flex flex-col gap-3 animate-fade-in-up">
                      <div className="text-[0.7rem] font-bold text-[#888] text-center uppercase tracking-wider mb-1">
                        🔒 Criptografia de ponta a ponta
                      </div>

                      {dm.messages.map((msg, mIdx) => (
                        <div
                          key={mIdx}
                          className={`max-w-[82%] rounded-[20px] p-3 text-[0.88rem] leading-snug select-none pointer-events-none ${msg.side === "right"
                              ? "self-end bg-[#0095f6] text-white rounded-br-sm"
                              : "self-start bg-[#efefef] text-[#1a1a1a] rounded-bl-sm"
                            }`}
                          style={{ filter: "blur(4px)" }}
                        >
                          {msg.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={goToCheckout}
              className="w-full rounded-2xl instagram-bg py-4 px-6 text-white font-extrabold text-[0.98rem] shadow-[0_10px_25px_rgba(220,39,67,0.3)] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
            >
              <span>🔓 Desbloquear Todas as 7 Conversas e Prints</span>
            </button>
          </div>
        </div>

        { }
        <footer className="pt-8 pb-12 text-center border-t border-[#dbdbdb] mt-10">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 text-[0.75rem] text-[#737373]">
            <a href="#" className="hover:underline">Meta</a>
            <a href="#" className="hover:underline">Sobre</a>
            <a href="#" className="hover:underline">Blog</a>
            <a href="#" className="hover:underline">Ajuda</a>
            <a href="#" className="hover:underline">API</a>
            <a href="#" className="hover:underline">Privacidade</a>
            <a href="#" className="hover:underline">Termos</a>
            <a href="#" className="hover:underline">Localizações</a>
            <a href="#" className="hover:underline">Instagram Lite</a>
          </div>
          <div className="text-[0.75rem] text-[#737373]">
            © 2026 InstaSpy from Meta • Todos os direitos reservados.
          </div>
        </footer>
      </div>

      { }
      {showOnboarding && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[12px] animate-fade-in-up">
          <div className="relative flex w-full max-w-[380px] flex-col items-center">
            { }
            <div className="relative w-full aspect-[9/16] max-h-[75vh] overflow-hidden rounded-[20px] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10">
              <video
                ref={videoRef}
                src={vslVideoSrc}
                playsInline
                autoPlay
                muted={isMuted}
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                className="h-full w-full object-cover rounded-[20px]"
              />

              { }
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-12 bg-gradient-to-b from-black/70 to-transparent p-[10px_10px_30px_10px]">
                { }
                <div className="mb-2 h-[3px] w-full overflow-hidden rounded-full bg-white/35">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-100 linear"
                    style={{ width: `${videoProgress || 10}%` }}
                  />
                </div>

                { }
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full border border-white bg-white overflow-hidden flex items-center justify-center">
                      <div className="h-full w-full instagram-bg flex items-center justify-center text-white text-[9px] font-black">
                        IS
                      </div>
                    </div>
                    <span className="text-[0.85rem] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      instaspy
                    </span>
                    <StoryVerifiedBadge />
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center gap-1 rounded-full bg-[#00e676] px-2 py-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                      <svg className="h-2.5 w-2.5 fill-white" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <svg className="h-2.5 w-2.5 fill-white" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              { }
              {isMuted && (
                <div
                  onClick={handleUnmute}
                  className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
                >
                  <div className="flex items-center gap-2 rounded-full bg-[#dc2743]/90 px-5 py-2.5 text-[0.8rem] font-extrabold text-white shadow-[0_4px_15px_rgba(220,39,67,0.3)] animate-pulse">
                    <span>🔊 CLIQUE PARA ATIVAR O SOM</span>
                  </div>
                </div>
              )}
            </div>

            { }
            <button
              onClick={closeOnboarding}
              className="w-full mt-4 rounded-2xl instagram-bg py-4 px-6 text-white font-black text-[1rem] uppercase tracking-wide shadow-[0_8px_20px_rgba(220,39,67,0.4)] cursor-pointer animate-pulse hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Quero descobrir tudo!
            </button>
          </div>
        </div>
      )}

      { }
      {showPixModal && (
        <div className="fixed inset-0 z-[9999999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-[8px] p-0 sm:p-4 animate-fade-in-up">
          <div className="w-full max-w-[480px] rounded-t-[36px] sm:rounded-[36px] bg-white p-6 text-center shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up max-h-[90vh] overflow-y-auto">
            {paymentConfirmed ? (
              <div className="py-6 flex flex-col items-center text-center animate-fade-in-up">
                <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-4xl mb-4 shadow-inner animate-bounce">
                  ✓
                </div>
                <div className="text-[0.8rem] font-extrabold uppercase tracking-wider text-green-600 mb-1">
                  PAGAMENTO CONFIRMADO COM SUCESSO!
                </div>
                <h3 className="text-[1.6rem] font-black text-[#1a1a1a] leading-tight mb-2">
                  Acesso Total Liberado
                </h3>
                <p className="text-[0.9rem] text-[#666] mb-6 max-w-[320px]">
                  Todos os dados, fotos originais e mensagens interceptadas de @{cleanUsername || "usuario"} foram desbloqueados.
                </p>

                <button
                  onClick={() => setShowPixModal(false)}
                  className="w-full rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold py-4 text-[1.05rem] shadow-lg shadow-green-500/30 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Visualizar Relatório Sem Censura 🔓
                </button>
              </div>
            ) : isCreatingCharge ? (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full border-4 border-[#ff416c] border-t-transparent animate-spin mb-4" />
                <div className="text-[1.1rem] font-bold text-[#1a1a1a] mb-1">
                  Gerando Chave PIX Segura...
                </div>
                <div className="text-[0.82rem] text-[#888]">
                  Conectando com o gateway de pagamento bancário
                </div>
              </div>
            ) : (
              <>
                { }
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 font-black text-[1.1rem] text-[#ff416c]">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff416c] animate-ping" />
                    <span>InstaSpy VIP</span>
                  </div>
                  <button
                    onClick={() => setShowPixModal(false)}
                    className="h-9 w-9 rounded-full bg-[#f0f0f0] text-lg font-bold text-[#666] flex items-center justify-center cursor-pointer hover:bg-[#e0e0e0]"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="text-[1.5rem] font-extrabold text-[#1a1a1a] leading-tight text-left mb-1.5">
                  Desbloqueie o Relatório Completo
                </h3>
                <p className="text-[0.88rem] text-[#666] text-left mb-5 leading-relaxed">
                  Descubra sem censura as fotos, nomes de usuários e conversas de quem está espionando @{cleanUsername || "seu perfil"}.
                </p>

                { }
                <div className="relative rounded-2xl bg-[#fff5f7] border-[1.5px] border-[#ffe8ed] p-4 text-center mb-5">
                  <div className="text-[0.85rem] font-bold text-[#666]">Valor Promocional Exclusivo:</div>
                  <div className="text-[2.2rem] font-black text-[#1a1a1a] my-0.5">
                    {formatCurrency(currentCharge?.amount ?? PRICING_CONFIG.dashboardModal.promotionalPrice)}
                  </div>
                  <span className="absolute top-3 right-4 text-[0.85rem] text-[#999] line-through font-semibold">
                    {formatCurrency(PRICING_CONFIG.dashboardModal.regularPrice)}
                  </span>
                  <div className="text-[0.75rem] font-bold text-[#888]">
                    Acesso Vitalício + Atualizações Diárias
                  </div>
                </div>

                { }
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="rounded-xl bg-[#f8f9fa] p-2.5 text-center">
                    <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffeef2] text-[0.75rem] font-extrabold text-[#ff416c]">
                      1
                    </div>
                    <div className="text-[0.68rem] font-bold text-[#444]">Copie o PIX</div>
                  </div>
                  <div className="rounded-xl bg-[#f8f9fa] p-2.5 text-center">
                    <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffeef2] text-[0.75rem] font-extrabold text-[#ff416c]">
                      2
                    </div>
                    <div className="text-[0.68rem] font-bold text-[#444]">Pague no Banco</div>
                  </div>
                  <div className="rounded-xl bg-[#f8f9fa] p-2.5 text-center">
                    <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffeef2] text-[0.75rem] font-extrabold text-[#ff416c]">
                      3
                    </div>
                    <div className="text-[0.68rem] font-bold text-[#444]">Acesso Imediato</div>
                  </div>
                </div>

                { }
                <div className="mx-auto mb-4 h-48 w-48 rounded-2xl border border-[#eee] bg-white p-2.5 shadow-sm flex items-center justify-center">
                  <img
                    src={
                      currentCharge?.pix.qrCodeUrl ||
                      "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020126580014br.gov.bcb.pix0136e088d451-instaspy-acesso-vip"
                    }
                    alt="QR Code PIX"
                    className="h-full w-full object-contain"
                  />
                </div>

                { }
                <div className="text-left text-[0.72rem] font-extrabold uppercase text-[#999] mb-1.5">
                  CÓDIGO PIX COPIA E COLA:
                </div>
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#f4f4f4] p-3 text-left">
                  <span className="flex-1 truncate text-[0.75rem] font-mono text-[#555]">
                    {currentCharge?.pix.copyPasteKey || "00020126580014br.gov.bcb.pix..."}
                  </span>
                  <button
                    onClick={handleCopyPix}
                    className="rounded-lg instagram-bg px-3 py-1.5 text-[0.75rem] font-bold text-white shadow-sm cursor-pointer hover:opacity-95"
                  >
                    {copiedPix ? "✓ Copiado!" : "Copiar"}
                  </button>
                </div>

                { }
                <button
                  onClick={handleCopyPix}
                  className="w-full rounded-2xl instagram-bg py-4 text-[1.05rem] font-black text-white shadow-[0_10px_25px_rgba(220,39,67,0.35)] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform mb-3"
                >
                  {copiedPix ? "✓ CÓDIGO PIX COPIADO!" : "COPIAR CHAVE PIX"}
                </button>

                <div className="flex items-center justify-center gap-2 text-[0.82rem] font-bold text-[#ff416c] mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#ff416c] animate-ping" />
                  <span>Aguardando pagamento...</span>
                </div>
                <div className="text-[0.82rem] font-extrabold text-[#1a1a1a] mb-4">
                  Expira em: <span className="text-[#ff416c]">{formatTimer(countdown)}</span>
                </div>

                { }
                <div className="flex justify-center gap-4 text-[0.72rem] font-bold text-[#8a8d91] mb-4">
                  <span className="flex items-center gap-1">🔒 100% Seguro</span>
                  <span className="flex items-center gap-1">⚡ Liberação Imediata</span>
                  <span className="flex items-center gap-1">🛡️ Garantia 7 Dias</span>
                </div>

                { }
                {import.meta.env.DEV && (
                  <div className="pt-3 border-t border-[#f0f0f0]">
                    <button
                      onClick={handleSimulatePayment}
                      className="text-[0.7rem] text-[#999] hover:text-[#ff416c] underline cursor-pointer transition-colors"
                    >
                      ⚡ Testar Aprovação Instantânea (Simular Pagamento)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
