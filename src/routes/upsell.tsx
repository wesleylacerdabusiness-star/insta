import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import pitch1 from "@/assets/img/pitch_dashboard_1.webp";
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
  trackViewContent,
  trackOpenPaymentModal,
  trackCopyPixCode,
  trackDeclineUpsell,
  getStoredUtmParams,
} from "@/lib/tracking";

export const Route = createFileRoute("/upsell")({
  validateSearch: z.object({
    username: z.string().optional(),
    gender: z.string().optional(),
  }),
  component: UpsellPage,
  head: () => ({
    title: "Oferta Exclusiva VIP - InstaSpy",
    meta: [
      {
        name: "description",
        content: "Parabéns pela sua compra! Aproveite esta oportunidade única para obter acesso vitalício ao InstaSpy.",
      },
    ],
  }),
});

function UpsellPage() {
  const { username: rawUsername = "", gender } = Route.useSearch();
  const cleanUsername = rawUsername.trim().replace(/^@/, "").toLowerCase() || "aledococo";
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isAuthenticated()) {
        navigate({
          to: "/register",
          search: { redirect: window.location.pathname + window.location.search },
        });
        return;
      }
      const isPaid = localStorage.getItem(`instaspy_paid_${cleanUsername}`) === "true";
      if (!isPaid) {
        navigate({
          to: "/checkout",
          search: { username: cleanUsername, gender },
        });
      }
    }
  }, [navigate, cleanUsername, gender]);

  useEffect(() => {
    trackViewContent("Upsell - Acesso Vitalício", upsellPrice);
  }, []);

  const upsellPrice = PRICING_CONFIG.upsell.promotionalPrice;
  const regularPrice = PRICING_CONFIG.upsell.regularPrice;

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [currentCharge, setCurrentCharge] = useState<PixChargeData | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(180);
  const [isPaymentApproved, setIsPaymentApproved] = useState(false);

  const [offerTimeLeft, setOfferTimeLeft] = useState(360);

  useEffect(() => {
    const timer = setInterval(() => {
      setOfferTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatOfferTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleOpenUpsellCheckout = () => {
    setShowCheckoutModal(true);
    setIsGeneratingPix(true);
    trackInitiateCheckout(upsellPrice);
    trackOpenPaymentModal("upsell", upsellPrice);

    createPixChargeServer({
      data: {
        amount: upsellPrice,
        description: `${PRICING_CONFIG.upsell.pixDescription} - @${cleanUsername || "usuario"}`,
        customer: {
          name: cleanUsername,
        },
        metadata: { ptype: "upsell_lifetime" },
        tracking: getStoredUtmParams(),
      },
    })
      .then((charge) => {
        setCurrentCharge(charge);
        setPixTimeLeft(180);
        trackAddPaymentInfo(charge.amount);
      })
      .catch((err) => {
        console.error("Erro ao gerar PIX do Upsell:", err);
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
          contentName: PRICING_CONFIG.upsell.pixDescription,
          externalId: cleanUsername,
          tracking: getStoredUtmParams(),
        },
      })
        .then((res) => {
          if (res.status === "paid") {
            setIsPaymentApproved(true);
            try {
              localStorage.setItem(`instaspy_upsell_paid_${cleanUsername}`, "true");
            } catch { }
            clearInterval(interval);
            trackPurchase(
              currentCharge.amount,
              "BRL",
              PRICING_CONFIG.upsell.pixDescription,
              currentCharge.id
            );
          }
        })
        .catch(() => { });
    }, PRICING_CONFIG.pixPollingIntervalMs || 7000);

    return () => clearInterval(interval);
  }, [showCheckoutModal, currentCharge?.id, isPaymentApproved]);

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

  const formatPixTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyPix = () => {
    const code = currentCharge?.pix.copyPasteKey || "";
    if (!code) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 3000);
        trackCopyPixCode("upsell", currentCharge?.amount || 0);
      })
      .catch(() => { });
  };

  const handleSimulatePayment = () => {
    if (currentCharge?.id) {
      simulatePixPaymentServer({ data: currentCharge.id }).then(() => {
        setIsPaymentApproved(true);
      });
    } else {
      setIsPaymentApproved(true);
    }
  };

  const handleDeclineUpsell = () => {
    trackDeclineUpsell();
    navigate({
      to: "/delivering",
      search: {
        username: cleanUsername,
        gender,
      },
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6] text-[#1a1a1a] font-sans antialiased pb-24 overflow-x-hidden selection:bg-[#cc2366] selection:text-white">
      { }
      <div className="w-full bg-[#2ecc71] text-white py-3.5 px-4 text-center shadow-sm">
        <div className="mx-auto max-w-[620px] flex items-center justify-center gap-2 text-[0.88rem] sm:text-[0.95rem] font-black uppercase tracking-wide">
          <span>🎉</span>
          <span>PAGAMENTO CONFIRMADO! SEU ACESSO BÁSICO FOI LIBERADO!</span>
        </div>
      </div>

      { }
      <div className="mx-auto max-w-[640px] px-4 pt-6 text-center">
        { }
        <div className="mb-6 rounded-2xl bg-[#fff3cd] border border-[#ffeeba] p-3.5 text-center shadow-sm">
          <div className="text-[0.82rem] font-extrabold text-[#856404] flex flex-wrap items-center justify-center gap-1.5 uppercase tracking-wide">
            <span>⚠️</span>
            <span>ATENÇÃO: NÃO FECHE ESTA PÁGINA! OPORTUNIDADE ÚNICA</span>
            <span className="inline-flex items-center rounded-md bg-[#ffe8a1] px-2 py-0.5 font-mono text-[0.85rem] font-black text-[#856404]">
              ⏱ {formatOfferTimer(offerTimeLeft)}
            </span>
          </div>
        </div>

        { }
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl sm:text-3xl font-extrabold instagram-text">
            InstaSpy
          </span>
          <span className="flex items-center justify-center translate-y-[3px]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
          </span>
        </div>

        { }
        <h1 className="text-[1.5rem] sm:text-[1.85rem] font-black leading-tight text-[#1a1a1a] mb-3">
          Parabéns! Você adquiriu o <span className="instagram-text-gradient">{PRICING_CONFIG.upsell.productAcquiredName}</span> e acaba de ganhar um super desconto para o <span className="text-[#0095f6]">Acesso Vitalício</span>!
        </h1>
        <p className="text-[0.95rem] text-[#555] font-medium mb-8 leading-relaxed">
          Seu plano atual expira em 3 dias. Aproveite esta oportunidade única para transformar sua conta em <strong>Acesso Vitalício Ilimitado</strong> por apenas <strong>{formatCurrency(upsellPrice)}</strong> (sem mensalidades nunca mais).
        </p>

        { }
        <div className="space-y-6 mb-6 text-left">
          { }
          <div className="rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
              <img src={pitch1} alt="Vitalício" className="w-full h-auto object-cover" />
            </div>
            <div className="p-5">
              <div className="inline-block rounded-full bg-[#e8f5e9] text-[#2e7d32] font-black text-[0.72rem] uppercase px-3 py-1 mb-2">
                🔒 Acesso Vitalício Ilimitado
              </div>
              <h3 className="text-[1.15rem] font-black text-[#1a1a1a] mb-1">
                Pesquise quantos perfis quiser, quando quiser
              </h3>
              <p className="text-[0.88rem] text-[#666] leading-relaxed">
                Nunca mais se preocupe com renovação ou perda de histórico. Seu acesso será permanente e vitalício.
              </p>
            </div>
          </div>
        </div>

        { }
        <div className="mb-6 rounded-[28px] bg-white border-2 border-[#ff416c]/40 shadow-[0_15px_45px_rgba(255,65,108,0.12)] p-6 text-center relative overflow-hidden">
          <div className="inline-block rounded-full instagram-bg px-4 py-1 text-[0.75rem] font-black uppercase text-white mb-2 shadow-sm">
            Oferta Única de Upgrade
          </div>
          <div className="text-[0.9rem] font-bold text-[#666] mb-1">
            Leve o Acesso Vitalício Completo por apenas:
          </div>
          <div className="text-[0.95rem] font-semibold text-[#999] line-through mb-1">
            De {formatCurrency(regularPrice)} por apenas
          </div>
          <div className="text-[3.2rem] font-black text-[#1a1a1a] leading-none mb-3">
            {formatCurrency(upsellPrice)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ffeef2] px-4 py-1.5 text-[0.85rem] font-extrabold text-[#ff416c] mb-4 border border-[#ff416c]/20 shadow-sm animate-pulse">
            <span>⏱</span>
            <span>Esta oportunidade expira em: <strong className="font-mono text-[0.95rem]">{formatOfferTimer(offerTimeLeft)}</strong></span>
          </div>

          { }
          <button
            onClick={handleOpenUpsellCheckout}
            className="w-full rounded-2xl instagram-bg py-5 px-6 text-white font-black text-[1.1rem] shadow-[0_12px_30px_rgba(220,39,67,0.4)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            SIM! QUERO ATIVAR MEU ACESSO VITALÍCIO!
          </button>
        </div>

        { }
        <div className="space-y-6 mb-8 text-left">
          { }
          <div className="rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
              <img src={pitch4} alt="Áudios" className="w-full h-auto object-cover" />
            </div>
            <div className="p-5">
              <div className="inline-block rounded-full bg-[#fff0f3] text-[#ff416c] font-black text-[0.72rem] uppercase px-3 py-1 mb-2">
                🎙️ Escuta e Transcrição de Áudios
              </div>
              <h3 className="text-[1.15rem] font-black text-[#1a1a1a] mb-1">
                Monitore conversas e áudios que citam você
              </h3>
              <p className="text-[0.88rem] text-[#666] leading-relaxed">
                Desbloqueie o módulo avançado de inteligência para escutar e ler transcrições de directs privadas.
              </p>
            </div>
          </div>

          { }
          <div className="rounded-[24px] bg-white border border-[#eef0f2] shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="w-full bg-[#fafafa] overflow-hidden border-b border-[#f0f0f0]">
              <img src={pitch5} alt="Stories" className="w-full h-auto object-cover" />
            </div>
            <div className="p-5">
              <div className="inline-block rounded-full bg-[#e3f2fd] text-[#1565c0] font-black text-[0.72rem] uppercase px-3 py-1 mb-2">
                ⚡ Espião de Stories 100% Invisível
              </div>
              <h3 className="text-[1.15rem] font-black text-[#1a1a1a] mb-1">
                Veja stories e posts sem deixar rastro nenhum
              </h3>
              <p className="text-[0.88rem] text-[#666] leading-relaxed">
                Navegue anonimamente pelas publicações e stories das últimas 24h sem aparecer na lista de visualizações.
              </p>
            </div>
          </div>
        </div>

        { }
        <button
          onClick={handleOpenUpsellCheckout}
          className="w-full rounded-2xl instagram-bg py-5 px-6 text-white font-black text-[1.1rem] shadow-[0_12px_30px_rgba(220,39,67,0.4)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 uppercase tracking-wide mb-4"
        >
          SIM! QUERO MEU ACESSO VITALÍCIO POR {formatCurrency(upsellPrice)}!
        </button>

        { }
        <button
          onClick={handleDeclineUpsell}
          className="text-[0.82rem] font-semibold text-[#888] hover:text-[#555] underline cursor-pointer transition-colors"
        >
          Não, prefiro manter meu acesso de apenas 3 dias e arriscar perder o histórico
        </button>
      </div>

      { }
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[9999999] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-[8px] p-0 sm:p-4 animate-fade-in-up">
          <div className="w-full max-w-[480px] rounded-t-[36px] sm:rounded-[36px] bg-white p-6 sm:p-7 text-center shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-5 right-5 text-2xl font-bold text-[#aaa] hover:text-[#666] cursor-pointer"
            >
              ×
            </button>

            <div className="inline-block rounded-full instagram-bg px-3 py-0.5 text-[0.72rem] font-extrabold uppercase text-white mt-1 mb-2 shadow-sm">
              Upgrade Vitalício VIP
            </div>

            <h3 className="text-[1.4rem] font-black text-[#1a1a1a] leading-tight mb-1">
              Acesso Vitalício InstaSpy
            </h3>
            <p className="text-[0.82rem] text-[#666] mb-4 leading-relaxed">
              Pagamento único para nunca mais pagar mensalidade!
            </p>

            {isPaymentApproved ? (
              <div className="py-6 text-center animate-fade-in-up">
                <div className="h-16 w-16 rounded-full bg-[#2ecc71] flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg animate-bounce">
                  ✓
                </div>
                <h4 className="text-[1.4rem] font-black text-[#1a1a1a] mb-1">Upgrade Vitalício Aprovado!</h4>
                <p className="text-[0.88rem] text-[#666] mb-6">
                  Sua conta foi atualizada para o Plano Vitalício VIP permanente.
                </p>
                <button
                  onClick={() => navigate({ to: "/delivering", search: { username: cleanUsername, gender } })}
                  className="w-full rounded-xl bg-[#2ecc71] py-4 text-white font-extrabold text-[1rem] shadow-md cursor-pointer transition-all hover:bg-[#27ae60]"
                >
                  Acessar Relatório Completo 🔓
                </button>
              </div>
            ) : (
              <>
                { }
                <div className="rounded-2xl bg-[#fff5f7] border-[1.5px] border-[#ffe8ed] p-3.5 mb-4 text-center">
                  <span className="text-[0.8rem] text-[#999] line-through block font-semibold">
                    {formatCurrency(regularPrice)}
                  </span>
                  <span className="text-[0.8rem] font-bold text-[#666]">Valor Promocional do Upgrade</span>
                  <div className="text-[2.2rem] font-black text-[#1a1a1a] leading-none my-1">
                    {formatCurrency(upsellPrice)}
                    <span className="text-[0.85rem] font-medium text-[#777] ml-1">/ pagamento único</span>
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

                <div className="text-[0.82rem] font-bold text-[#ff416c] mb-4">
                  Pix expira em <span>{formatPixTimer(pixTimeLeft)}</span>
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
    </div>
  );
}
