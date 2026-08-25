export const PRICING_CONFIG = {
  checkout: {
    regularPrice: 379.99,
    promotionalPrice: 23.97,
    downsellPrice: 17.97,
    pixDescription: "Acesso Completo",
    currency: "BRL",
    formatted: {
      regular: "R$ 379,99",
      promotional: "R$ 23,96",
      downsell: "R$ 17,97",
    },
  },


  upsell: {
    productAcquiredName: "Acesso InstaSpy 3 Dias",
    upgradeProductName: "InstaSpy Vitalício VIP + Monitoramento 24h",
    regularPrice: 197.00,
    promotionalPrice: 19.90,
    downsellPrice: 14.90,
    pixDescription: "Upgrade Vitalicio VIP",
    currency: "BRL",
    formatted: {
      regular: "R$ 197,00",
      promotional: "R$ 19,90",
      downsell: "R$ 14,90",
    },
  },


  resultado: {
    regularPrice: 197.00,
    promotionalPrice: 67.94,
    pixDescription: "Desbloqueio Dossie Premium",
    currency: "BRL",
    formatted: {
      regular: "R$ 197,00",
      promotional: "R$ 67,94",
    },
  },


  dashboardModal: {
    regularPrice: 97.00,
    promotionalPrice: 27.90,
    pixDescription: "Desbloqueio Relatorio VIP",
    formatted: {
      regular: "R$ 97,00",
      promotional: "R$ 27,90",
    },
  },


  pixPollingIntervalMs: 7000,
};

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
