import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import pitch1 from "@/assets/img/pitch_dashboard_1.webp";
import pitch2 from "@/assets/img/pitch_dashboard_2.webp";
import pitch3 from "@/assets/img/pitch_dashboard_3.webp";
import pitch4 from "@/assets/img/pitch_dashboard_4.webp";
import pitch5 from "@/assets/img/pitch_dashboard_5.webp";
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
  trackCopyPixCode,
  trackViewContent,
  trackLead,
  getStoredUtmParams,
} from "@/lib/tracking";

export const Route = createFileRoute("/checkout")({
  validateSearch: z.object({
    username: z.string().optional(),
    gender: z.string().optional(),
  }),
  component: CheckoutPitchPage,
  head: () => ({
    title: "Acesso Completo - InstaSpy",
    meta: [
      {
        name: "description",
        content: "Desbloqueie o acesso completo ao InstaSpy com total anonimato e dados oficiais.",
      },
    ],
  }),
});

const pushNotifications = [
  { name: "Jenni Oliveira", msg: "O mais foda disso é saber que a própria família fala da gente 🤡" },
  { name: "Felipe Marques", msg: "comprei e descobri coisas que nem acreditava que era possivel 😱🕵️‍♂️" },
  { name: "Juliana Costa", msg: "Meu DEUS!! eu ainda chamava aquela vagabunda de amiga!!!! 😡" },
  { name: "Marcos Santos", msg: "eu sabia que o ricardo era um fdp so nao sabia o quanto.. 😤" },
  { name: "Ana Beatriz", msg: "Gente, a minha vizinha é uma fofoqueira de marca maior! Chocada!" },
  { name: "Thiago Souza", msg: "Descobri o que meus 'parceiros' de negócios falavam de mim pelas costas. Valeu cada centavo." },
  { name: "Larissa Silva", msg: "Impressionante como as pessoas são falsas. Fui ver o painel e quase caí para trás." },
  { name: "Rafaela Mendes", msg: "Melhor investimento do ano, tirei a prova real que precisava." },
  { name: "Lucas Almeida", msg: "cara, o que foi aquilo? Peguei o grupo inteiro me queimando no direct 🤬" },
  { name: "Beatriz Nogueira", msg: "A verdade sempre aparece né, ainda bem que comprei o acesso!" },
  { name: "Bruno Rezende", msg: "Minha namorada jurando que não falava com o ex... O relatório não mente! 🤦‍♂️" },
  { name: "Camila Pires", msg: "Chocada com o nível de falsidade do meu círculo de amizades." },
  { name: "Diego Ramos", msg: "Eu desconfiava, mas ver os prints e as menções na tela é outra coisa." },
  { name: "Evelyn Santos", msg: "Nossa, aquela fofoca que rodou no trabalho começou justamente por quem eu mais ajudava." },
  { name: "Fernando Cruz", msg: "Finalmente abri meus olhos. A melhor ferramenta de todas, sem dúvidas." },
  { name: "Gabriela Rocha", msg: "A cara de sonsa da pessoa fingindo que não sabia de nada..." },
  { name: "Gustavo Lima", msg: "Descobri que o meu sócio estava fechando contratos por fora!" },
  { name: "Helena Carvalho", msg: "Ainda bem que confiei na minha intuição. O resultado foi assustador." },
  { name: "Igor Martins", msg: "Para quem duvida, funciona mesmo. Peguei tudo em menos de 5 minutos." },
  { name: "Jéssica Fernandes", msg: "Estou rindo de nervoso com a falsidade da minha prima no direct." },
  { name: "Leonardo Silva", msg: "Aquela história do áudio excluído fazia todo sentido agora. Descobri tudo." },
  { name: "Mariana Costa", msg: "Perdi uma 'amiga' mas ganhei a minha paz de espírito de volta." },
  { name: "Mateus Ribeiro", msg: "Vale cada centavo, a quantidade de stalkers que peguei foi absurda." },
  { name: "Natália Vieira", msg: "A máscara caiu tão rápido que nem deu tempo de inventarem desculpa." },
  { name: "Otávio Fonseca", msg: "Fiquei de queixo caído com as conversas ocultas. Indico para todo mundo." },
  { name: "Patrícia Gomes", msg: "Quem não deve não teme, mas nesse caso todo mundo devia alguma coisa kkk" },
  { name: "Rodrigo Melo", msg: "Foi a confirmação que eu precisava. Podem comprar sem medo." },
  { name: "Sabrina Dias", msg: "Mentira tem perna curta mesmo. O sistema entregou tudo de bandeja." },
  { name: "Tiago Cardoso", msg: "Minha intuição masculina nunca falha. Relação blindada agora kkk" },
  { name: "Vanessa Lins", msg: "Fui inocente por muito tempo. Agora ninguém mais me faz de boba." },
  { name: "William Neves", msg: "O suporte liberou meu acesso rápido e já matei a charada." },
  { name: "Yasmin Andrade", msg: "Dá um frio na barriga ver o painel carregando, mas vale a pena saber a verdade." },
];

function CheckoutPitchPage() {
  const { username: rawUsername = "", gender } = Route.useSearch();
  const cleanUsername = rawUsername.trim().replace(/^@/, "").toLowerCase() || "aledococo";
  const navigate = useNavigate();

  const [showValModal, setShowValModal] = useState(false);
  const [valStep, setValStep] = useState<"form" | "loading" | "success">("form");
  const [valLoadingText, setValLoadingText] = useState("Verificando dados...");

  const REQUIRE_FORM_VALIDATION = false;

  const [valEmail, setValEmail] = useState("");
  const [valEmailConf, setValEmailConf] = useState("");
  const [valPhone, setValPhone] = useState("");

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showDownsellModal, setShowDownsellModal] = useState(false);
  const [priceType, setPriceType] = useState<"basic" | "downsell">("basic");
  const currentPrice =
    priceType === "basic"
      ? PRICING_CONFIG.checkout.promotionalPrice
      : PRICING_CONFIG.checkout.downsellPrice;
  const oldPrice =
    priceType === "basic"
      ? formatCurrency(PRICING_CONFIG.checkout.regularPrice)
      : formatCurrency(PRICING_CONFIG.checkout.promotionalPrice);

  const [currentCharge, setCurrentCharge] = useState<PixChargeData | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(180);
  const [isPaymentApproved, setIsPaymentApproved] = useState(false);

  const [offerCountdown, setOfferCountdown] = useState(899);

  useEffect(() => {
    const timer = setInterval(() => {
      setOfferCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      navigate({
        to: "/register",
        search: { redirect: window.location.pathname + window.location.search },
      });
    }
  }, [navigate]);

  useEffect(() => {
    trackViewContent("Checkout - @" + cleanUsername, PRICING_CONFIG.checkout.promotionalPrice);
  }, []);

  const [currentPush, setCurrentPush] = useState(pushNotifications[0]);
  const [pushVisible, setPushVisible] = useState(false);

  const isFemale =
    gender === "female" ||
    cleanUsername.endsWith("a") ||
    cleanUsername.endsWith("y") ||
    cleanUsername.endsWith("elly") ||
    cleanUsername.endsWith("elle");
  const dsWord = isFemale ? "DESCOBERTA" : "DESCOBERTO";
  const dsAnon = isFemale ? "ANÔNIMA" : "ANÔNIMO";

  const generatePix = (type: "basic" | "downsell" = "basic") => {
    setIsGeneratingPix(true);
    setPriceType(type);
    const pixAmount = type === "basic" ? PRICING_CONFIG.checkout.promotionalPrice : PRICING_CONFIG.checkout.downsellPrice;
    trackInitiateCheckout(pixAmount);
    trackOpenPaymentModal("checkout", pixAmount);
    const amount =
      type === "basic"
        ? PRICING_CONFIG.checkout.promotionalPrice
        : PRICING_CONFIG.checkout.downsellPrice;
    const customerObj: { name?: string; email?: string; phone?: string } = {
      name: cleanUsername,
    };
    if (valEmail) customerObj.email = valEmail;
    if (valPhone) customerObj.phone = valPhone;

    createPixChargeServer({
      data: {
        amount,
        description: PRICING_CONFIG.checkout.pixDescription,
        customer: customerObj,
        metadata: { ptype: type },
        tracking: getStoredUtmParams(),
      },
    })
      .then((charge) => {
        setCurrentCharge(charge);
        setPixTimeLeft(180);
        trackAddPaymentInfo(charge.amount);
      })
      .catch((err) => {
        console.error("Erro ao gerar PIX:", err);
      })
      .finally(() => {
        setIsGeneratingPix(false);
      });
  };

  useEffect(() => {
    if (!showCheckoutModal || !currentCharge?.id || isPaymentApproved) return;

    const interval = setInterval(() => {
      checkPixChargeStatusServer({
        data: {
          chargeId: currentCharge.id,
          amount: currentCharge.amount,
          contentName: PRICING_CONFIG.checkout.pixDescription,
          externalId: cleanUsername,
          tracking: getStoredUtmParams(),
        },
      })
        .then((res) => {
          if (res.status === "paid") {
            setIsPaymentApproved(true);
            try {
              localStorage.setItem(`instaspy_paid_${cleanUsername}`, "true");
              localStorage.setItem(`instaspy_charge_${cleanUsername}`, currentCharge.id);
            } catch { }
            clearInterval(interval);
            trackPurchase(
              currentCharge.amount,
              "BRL",
              PRICING_CONFIG.checkout.pixDescription,
              currentCharge.id
            );
          }
        })
        .catch(() => { });
    }, PRICING_CONFIG.pixPollingIntervalMs || 7000);

    return () => clearInterval(interval);
  }, [showCheckoutModal, currentCharge?.id, isPaymentApproved, cleanUsername, currentCharge?.amount]);

  useEffect(() => {
    if (!showCheckoutModal || isPaymentApproved) return;

    const timer = setInterval(() => {
      setPixTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCheckoutModal, isPaymentApproved]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % pushNotifications.length;
      setCurrentPush(pushNotifications[index]);
      setPushVisible(true);

      setTimeout(() => {
        setPushVisible(false);
      }, 7000);
    }, 9000);

    const initial = setTimeout(() => {
      setPushVisible(true);
      setTimeout(() => setPushVisible(false), 7000);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const formatPixTimer = formatTimer;

  const handleCopyPix = () => {
    const code = currentCharge?.pix.copyPasteKey || "";
    if (!code) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 3000);
        trackCopyPixCode("checkout", currentCharge?.amount || 0);
      })
      .catch(() => { });
  };

  const handleSimulatePayment = () => {
    if (currentCharge?.id) {
      simulatePixPaymentServer({ data: currentCharge.id }).then(() => {
        setIsPaymentApproved(true);
        try {
          localStorage.setItem(`instaspy_paid_${cleanUsername}`, "true");
        } catch { }
      });
    } else {
      setIsPaymentApproved(true);
      try {
        localStorage.setItem(`instaspy_paid_${cleanUsername}`, "true");
      } catch { }
    }
  };

  const runVerificationSequence = () => {
    setValStep("loading");
    setValLoadingText("Verificando dados do perfil...");
    trackLead("Checkout Verification - @" + cleanUsername, currentPrice);

    const steps = [
      { time: 1800, text: `Buscando histórico de @${cleanUsername}...` },
      { time: 2200, text: "Aguardando resposta dos servidores..." },
      { time: 2400, text: "Cruzando menções e registros de DMs..." },
      { time: 1800, text: "Dados verificados com sucesso!" },
      { time: 1500, text: "Acesso autorizado pelo sistema!" },
    ];

    let acc = 1500;
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setValLoadingText(step.text);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setValStep("success");
          }, 900);
        }
      }, acc);
      acc += step.time;
    });
  };

  const openValidationModal = () => {
    setShowValModal(true);
    if (!REQUIRE_FORM_VALIDATION) {
      runVerificationSequence();
    } else {
      setValStep("form");
    }
  };

  const startValidationProcess = () => {
    if (REQUIRE_FORM_VALIDATION) {
      if (!valEmail || !valEmailConf || !valPhone) {
        alert("Por favor, preencha todos os campos.");
        return;
      }
      if (valEmail.trim().toLowerCase() !== valEmailConf.trim().toLowerCase()) {
        alert("Os e-mails não conferem. Verifique e tente novamente.");
        return;
      }
    }

    runVerificationSequence();
  };

  const proceedToPayment = () => {
    setShowValModal(false);
    setShowCheckoutModal(true);
    generatePix("basic");
  };

  const openDownsellModal = () => {
    setShowCheckoutModal(false);
    setShowDownsellModal(true);
  };

  const acceptDownsell = () => {
    setShowDownsellModal(false);
    setShowCheckoutModal(true);
    generatePix("downsell");
  };

  const formatPhone = (v: string) => {
    return v
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-[#1a1a1a] font-sans antialiased pb-20 overflow-x-hidden selection:bg-[#cc2366] selection:text-white">
      { }
      {currentPush && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-[12000] w-[92%] max-w-[410px] bg-white/95 backdrop-blur-[15px] border border-[#e6e6e6] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-3.5 flex items-center gap-3 transition-all duration-500 ease-out ${pushVisible ? "top-5 opacity-100" : "-top-32 opacity-0 pointer-events-none"
            }`}
        >
          <div className="h-10 w-10 flex-shrink-0 rounded-[9px] instagram-bg flex items-center justify-center p-[2px] shadow-sm">
            <div className="h-full w-full bg-white rounded-[7px] flex items-center justify-center">
              <svg className="h-6 w-6 text-[#dc2743]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-[0.82rem] font-black text-[#1a1a1a]">Notificação online</span>
              <span className="text-[0.7rem] font-medium text-[#8e8e93]">Agora</span>
            </div>
            <div className="text-[0.82rem] text-[#3a3a3c] leading-snug">
              <strong className="font-bold text-[#1a1a1a]">{currentPush.name}</strong> : {currentPush.msg}
            </div>
          </div>
        </div>
      )}

      { }
      <div className="mx-auto max-w-[620px] px-4 pt-8 text-center">
        { }
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <span className="text-[2rem] font-black tracking-tight instagram-text-gradient font-serif italic">
            InstaSpy
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="translate-y-[2px]">
            <path
              d="M12 2L13.73 3.52L15.99 3.27L17.15 5.23L17.15 5.23L19.38 5.61L19.86 7.84L21.78 9.17L21.46 11.44L22.6 13.5L21.46 15.56L21.78 17.83L19.86 19.16L19.38 21.39L17.15 21.77L15.99 23.73L13.73 23.48L12 25L10.27 23.48L8.01 23.73L6.85 21.77L4.62 21.39L4.14 19.16L2.22 17.83L2.54 15.56L1.4 13.5L2.54 11.44L2.22 9.17L4.14 7.84L4.62 5.61L6.85 5.23L8.01 3.27L10.27 3.52L12 2Z"
              fill="#0095F6"
            />
            <path
              d="M15.5 11.5L11 15.5L8.5 13"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        { }
        <h1 className="text-[1.45rem] sm:text-[1.75rem] font-black leading-tight mb-4 text-[#1a1a1a]">
          Com o InstaSpy, você garante acesso completo ao que andam falando sobre você, direto dos dados oficiais do Instagram e com total anonimato.
        </h1>
        <p className="text-[1rem] font-bold text-[#666] mb-8">
          Você poderá desbloquear tudo isso com apenas um clique:
        </p>

        { }
        <div className="mb-8 rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden transition-transform hover:scale-[1.01]">
          <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
            <img src={pitch1} alt="Visualização 1" className="w-full h-auto object-cover block" />
          </div>
          <div className="p-5 text-[1rem] font-bold text-[#262626] leading-snug text-left">
            Todas as pessoas que estão stalkeando seu perfil nos últimos 3 dias sem desfoque!
          </div>
        </div>

        { }
        <div className="mb-8 rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden transition-transform hover:scale-[1.01]">
          <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
            <img src={pitch2} alt="Visualização 2" className="w-full h-auto object-cover block" />
          </div>
          <div className="p-5 text-[1rem] font-bold text-[#262626] leading-snug text-left">
            Todos os usuários que te mencionaram, tiraram print do seu perfil, compartilham seus storys e mencionaram você em DM's privadas sem desfoque!
          </div>
        </div>

        { }
        <div className="mb-8 rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden transition-transform hover:scale-[1.01]">
          <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
            <img src={pitch3} alt="Visualização 3" className="w-full h-auto object-cover block" />
          </div>
          <div className="p-5 text-[1rem] font-bold text-[#262626] leading-snug text-left">
            Intercepte directs, fotos e conversas sem censura! Descubra tudo o que falam usando seu nome ou seu @ no Instagram.
          </div>
        </div>

        { }
        <div className="mb-8 rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden transition-transform hover:scale-[1.01]">
          <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
            <img src={pitch4} alt="Visualização 4" className="w-full h-auto object-cover block" />
          </div>
          <div className="p-5 text-[1rem] font-bold text-[#262626] leading-snug text-left">
            Você poderá selecionar até 5 perfis de stalkers para monitorar áudios e transcrições que mencionem a palavra-chave que você configurou!
          </div>
        </div>

        { }
        <div className="mb-8 rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden transition-transform hover:scale-[1.01]">
          <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
            <img src={pitch5} alt="Visualização 5" className="w-full h-auto object-cover block" />
          </div>
          <div className="p-5 text-[1rem] font-bold text-[#262626] leading-snug text-left">
            Você vai desbloquear a função de pesquisar stories anonimamente de qualquer pessoa que postou nas últimas 24h no Instagram, sem aparecer e sem ninguém saber!
          </div>
        </div>

        { }
        <div className="mb-10 rounded-[26px] bg-white border-2 border-[#ff416c]/30 shadow-[0_15px_40px_rgba(255,65,108,0.12)] p-6 text-left relative overflow-hidden">
          <div className="inline-block rounded-full instagram-bg px-4 py-1 text-[0.75rem] font-extrabold uppercase tracking-wider text-white mb-3 shadow-sm">
            Bônus Exclusivo
          </div>
          <h3 className="text-[1.3rem] font-black text-[#1a1a1a] mb-2 leading-tight">
            Fique sempre um passo à frente dos outros!
          </h3>
          <p className="text-[0.92rem] text-[#555] mb-5 leading-relaxed">
            Você terá acesso exclusivo à nova Função de Localização. Descubra por onde andam os perfis que você pesquisa de forma 100% invisível.
          </p>

          <div className="rounded-2xl bg-[#f8f9fa] p-4 mb-4 border border-[#eef0f2]">
            <div className="text-[0.85rem] font-black text-[#333] mb-2.5">Como funciona?</div>
            <div className="flex flex-col gap-2 text-[0.88rem] font-semibold text-[#444]">
              <div className="flex items-center gap-2">
                <span>📌</span> Endereço exato
              </div>
              <div className="flex items-center gap-2">
                <span>📅</span> Data e hora
              </div>
              <div className="flex items-center gap-2">
                <span>🚀</span> Alerta em tempo real
              </div>
            </div>
          </div>

          <div className="text-[0.95rem] font-bold text-[#1a1a1a] text-center">
            Stalkeie qualquer perfil com total segurança e sem ninguém saber!
          </div>
        </div>

        { }
        <div className="mb-6 rounded-[28px] bg-white border border-[#eef0f2] shadow-[0_15px_45px_rgba(0,0,0,0.07)] p-6 text-center">
          <div className="text-[0.9rem] font-bold text-[#666] mb-1">
            Você vai ter acesso a tudo isso e muito mais por apenas:
          </div>
          <div className="text-[0.95rem] font-semibold text-[#999] line-through mb-1">
            De {formatCurrency(PRICING_CONFIG.checkout.regularPrice)} por apenas
          </div>
          <div className="text-[3.2rem] font-black text-[#1a1a1a] leading-none mb-3">
            {formatCurrency(PRICING_CONFIG.checkout.promotionalPrice)}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ffeef2] px-4 py-1.5 text-[0.82rem] font-extrabold text-[#ff416c]">
            ⏱ Oferta expira em <span className="tabular-nums font-black">{formatTimer(offerCountdown)}</span>!
          </div>
        </div>

        { }
        <button
          onClick={openValidationModal}
          className="w-full rounded-2xl instagram-bg py-5 px-6 text-white font-black text-[1.15rem] shadow-[0_12px_30px_rgba(220,39,67,0.4)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          Quero Desbloquear Meu Acesso Agora!
        </button>
      </div>

      { }
      {showValModal && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/75 backdrop-blur-[8px] p-4 animate-fade-in-up">
          <div className="w-full max-w-[460px] rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowValModal(false)}
              className="absolute top-5 right-5 text-2xl font-bold text-[#aaa] hover:text-[#666] cursor-pointer"
            >
              ×
            </button>

            {valStep === "form" && (
              <div className="text-left">
                <h2 className="text-[1.2rem] font-black text-[#1a1a1a] mb-2 leading-snug">
                  Preencha o formulário abaixo para validação imediata do seu perfil.
                </h2>
                <p className="text-[0.88rem] text-[#666] mb-5 leading-relaxed">
                  Descubra se você está elegível para liberar o acesso completo à plataforma, tudo isso em menos de 60 segundos!
                </p>

                <div className="mb-3">
                  <label className="block text-[0.8rem] font-bold text-[#444] mb-1">E-mail</label>
                  <input
                    type="email"
                    value={valEmail}
                    onChange={(e) => setValEmail(e.target.value)}
                    placeholder="Seu melhor e-mail"
                    className="w-full rounded-xl border border-[#ddd] p-3.5 text-base md:text-[0.95rem] outline-none focus:border-[#ff416c] transition-colors"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-[0.8rem] font-bold text-[#444] mb-1">Confirmação de e-mail</label>
                  <input
                    type="email"
                    value={valEmailConf}
                    onChange={(e) => setValEmailConf(e.target.value)}
                    placeholder="Confirme seu e-mail"
                    className="w-full rounded-xl border border-[#ddd] p-3.5 text-base md:text-[0.95rem] outline-none focus:border-[#ff416c] transition-colors"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-[0.8rem] font-bold text-[#444] mb-1">@ do usuário pesquisado</label>
                  <input
                    type="text"
                    value={cleanUsername}
                    readOnly
                    className="w-full rounded-xl border border-[#ddd] bg-[#f9f9f9] p-3.5 text-base md:text-[0.95rem] text-[#666] outline-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-[0.8rem] font-bold text-[#444] mb-1">Número de WhatsApp</label>
                  <input
                    type="tel"
                    value={valPhone}
                    onChange={(e) => setValPhone(formatPhone(e.target.value))}
                    placeholder="(XX) XXXXX-XXXX"
                    maxLength={15}
                    className="w-full rounded-xl border border-[#ddd] p-3.5 text-base md:text-[0.95rem] outline-none focus:border-[#ff416c] transition-colors"
                  />
                </div>

                <button
                  onClick={startValidationProcess}
                  className="w-full rounded-xl instagram-bg py-4 text-white font-extrabold text-[1rem] shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                >
                  Verificar dados!
                </button>
              </div>
            )}

            {valStep === "loading" && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full border-4 border-[#f3f3f3] border-t-[#dc2743] animate-spin mb-6" />
                <h3 className="text-[1.2rem] font-black text-[#1a1a1a] transition-all duration-300">
                  {valLoadingText}
                </h3>
              </div>
            )}

            {valStep === "success" && (
              <div className="py-6 flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-[#2ecc71] flex items-center justify-center text-white text-3xl font-black mb-4 shadow-[0_10px_25px_rgba(46,204,113,0.4)] animate-bounce">
                  ✓
                </div>
                <h2 className="text-[1.8rem] font-black text-[#1a1a1a] mb-2">Parabéns!</h2>
                <p className="text-[1.05rem] font-bold text-[#444] leading-snug mb-3 max-w-[340px]">
                  O usuário <strong className="text-[#dc2743]">@{cleanUsername}</strong> foi autorizado a ter acesso ao sistema da InstaSpy!
                </p>
                <p className="text-[0.88rem] text-[#666] mb-6">
                  Clique no botão abaixo para efetuar o pagamento e liberar o sistema!
                </p>
                <button
                  onClick={proceedToPayment}
                  className="w-full rounded-2xl bg-[#2ecc71] py-4 text-white font-black text-[1.1rem] shadow-[0_8px_20px_rgba(46,204,113,0.3)] hover:bg-[#27ae60] cursor-pointer transition-colors"
                >
                  Efetuar pagamento!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      { }
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[9999999] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-[8px] p-0 sm:p-4 animate-fade-in-up">
          <div className="w-full max-w-[480px] rounded-t-[36px] sm:rounded-[36px] bg-white p-6 sm:p-7 text-center shadow-2xl relative max-h-[92vh] overflow-y-auto">
            { }
            <button
              onClick={openDownsellModal}
              className="absolute top-4 right-4 rounded-lg bg-gradient-to-r from-[#f09433] to-[#dc2743] text-white px-2.5 py-1 text-[0.62rem] font-black shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              Sair e apagar pesquisa
            </button>

            <div className="inline-block rounded-full instagram-bg px-3 py-0.5 text-[0.72rem] font-extrabold uppercase text-white mt-3 mb-2 shadow-sm">
              InstaSpy
            </div>

            <h3 className="text-[1.4rem] font-black text-[#1a1a1a] leading-tight mb-1">
              Acesso Premium Imediato
            </h3>
            <p className="text-[0.82rem] text-[#666] mb-4 leading-relaxed">
              Você terá o poder de saber tudo, a todo momento, na palma da sua mão!
            </p>

            {isPaymentApproved ? (
              <div className="py-6 text-center animate-fade-in-up">
                <div className="h-16 w-16 rounded-full bg-[#2ecc71] flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg animate-bounce">
                  ✓
                </div>
                <h4 className="text-[1.4rem] font-black text-[#1a1a1a] mb-1">Pagamento Aprovado!</h4>
                <p className="text-[0.88rem] text-[#666] mb-6">
                  Seu acesso para @{cleanUsername} foi confirmado com sucesso! Você foi selecionado para uma oferta especial.
                </p>
                <button
                  onClick={() => navigate({ to: "/upsell", search: { username: cleanUsername, gender } })}
                  className="w-full rounded-2xl bg-[#2ecc71] hover:bg-[#27ae60] py-4 text-white font-extrabold text-[1.05rem] shadow-lg shadow-green-500/30 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] animate-pulse"
                >
                  Continuar para o Upgrade VIP 🚀
                </button>
              </div>
            ) : (
              <>
                { }
                <div className="rounded-2xl bg-[#fff5f7] border-[1.5px] border-[#ffe8ed] p-3.5 mb-4 text-center">
                  <span className="text-[0.8rem] text-[#999] line-through block font-semibold">{oldPrice}</span>
                  <span className="text-[0.8rem] font-bold text-[#666]">Valor Promocional</span>
                  <div className="text-[2.2rem] font-black text-[#1a1a1a] leading-none my-1">
                    R$ {currentPrice.toFixed(2).replace(".", ",")}
                    <span className="text-[0.85rem] font-medium text-[#777] ml-1">/ acesso</span>
                  </div>
                </div>

                { }
                <div className="mx-auto mb-4 h-44 w-44 rounded-2xl border border-[#eee] bg-white p-2 shadow-sm flex items-center justify-center">
                  {isGeneratingPix ? (
                    <div className="text-[0.85rem] text-[#888] font-bold animate-pulse">Gerando PIX...</div>
                  ) : currentCharge?.pix.qrCodeUrl ? (
                    <img
                      src={currentCharge.pix.qrCodeUrl}
                      alt="QR Code PIX"
                      className="h-full w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-[0.85rem] text-[#888]">Carregando QR Code...</div>
                  )}
                </div>

                { }
                <div className="text-left text-[0.72rem] font-extrabold uppercase text-[#999] mb-1">
                  PIX COPIA E COLA
                </div>
                <div
                  onClick={handleCopyPix}
                  className="mb-4 flex items-center gap-2 rounded-xl bg-[#f4f4f4] p-3 text-left cursor-pointer hover:bg-[#ececec] transition-colors"
                >
                  <span className="flex-1 truncate text-[0.75rem] font-mono text-[#555]">
                    {currentCharge?.pix.copyPasteKey || "Gerando código de pagamento..."}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPix();
                    }}
                    className="rounded-lg instagram-bg px-3 py-1.5 text-[0.75rem] font-bold text-white shadow-sm cursor-pointer hover:opacity-95"
                  >
                    {pixCopied ? "✓ Copiado!" : "Copiar"}
                  </button>
                </div>

                <button
                  onClick={handleCopyPix}
                  className={`w-full rounded-2xl py-4 text-[1rem] font-black text-white shadow-lg cursor-pointer transition-all mb-3 ${pixCopied ? "bg-[#2ecc71]" : "instagram-bg"
                    }`}
                >
                  {pixCopied ? "✅ CÓDIGO PIX COPIADO!" : "COPIAR CÓDIGO PIX"}
                </button>

                <div className="text-[0.75rem] text-[#777] mb-3 leading-tight">
                  Se você já pagou antes, é só aguardar que o sistema libera automaticamente.
                </div>

                { }
                <div className="text-[0.82rem] font-bold text-[#ff416c] mb-4">
                  Pix expira em <span>{formatPixTimer(pixTimeLeft)}</span>
                </div>

                { }
                <div className="flex justify-center gap-4 text-[0.72rem] font-bold text-[#8a8d91] mb-3">
                  <span>🛡 Seguro</span>
                  <span>⚡ Instantâneo</span>
                  <span>✔️ Oficial</span>
                </div>

                { }
                {import.meta.env.DEV && (
                  <div className="pt-2 border-t border-[#f0f0f0]">
                    <button
                      onClick={handleSimulatePayment}
                      className="text-[0.68rem] text-[#999] hover:text-[#ff416c] underline cursor-pointer"
                    >
                      ⚡ Testar Aprovação Instantânea (Bypass Admin)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      { }
      {showDownsellModal && (
        <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4 animate-fade-in-up">
          <div className="w-full max-w-[440px] rounded-[32px] bg-white p-7 text-center shadow-2xl relative animate-scale-in">
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2743"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-3 animate-pulse"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>

            <h2 className="text-[1.3rem] font-black instagram-text-gradient mb-2 leading-tight uppercase">
              ESPERE! VOCÊ PODERÁ SER {dsWord}!
            </h2>

            <p className="text-[0.78rem] text-[#444] mb-5 leading-relaxed text-left">
              Se você sair agora, sua conta continuará na <b>versão gratuita</b>. Isso significa que os usuários borrados na sua consulta poderão receber uma notificação do Instagram avisando que você tentou monitorá-los!
            </p>

            <div className="rounded-[20px] bg-[#1a1a1a] p-4 mb-5 border border-[#333] text-center">
              <div className="text-[0.72rem] font-black text-white uppercase tracking-wider mb-2">
                ÚLTIMA CHANCE: Desconto especial somente nos próximos 3 minutos!
              </div>
              <div className="text-[0.88rem] text-[#888] line-through mb-0.5">
                De {formatCurrency(PRICING_CONFIG.checkout.promotionalPrice)}
              </div>
              <div className="text-[2.8rem] font-black text-white leading-none my-1 animate-pulse">
                {formatCurrency(PRICING_CONFIG.checkout.downsellPrice)}
              </div>
              <div className="text-[0.8rem] font-bold text-[#2ecc71] mt-1">Oferta por tempo limitado!</div>
            </div>

            <button
              onClick={acceptDownsell}
              className="w-full rounded-2xl instagram-bg py-4 text-white font-black text-[0.92rem] shadow-[0_10px_25px_rgba(220,39,67,0.35)] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform mb-3 uppercase"
            >
              SIM, EU QUERO ME MANTER {dsAnon}!
            </button>

            <div
              onClick={() => setShowDownsellModal(false)}
              className="text-[0.8rem] text-[#999] cursor-pointer font-semibold underline hover:text-[#666]"
            >
              Não, vou arriscar ser {dsWord.toLowerCase()}..
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
