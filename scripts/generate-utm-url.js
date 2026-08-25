#!/usr/bin/env node

const args = process.argv.slice(2);

function getArgValue(name, defaultValue) {
  const index = args.findIndex(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (index === -1) return defaultValue;
  const arg = args[index];
  if (arg.includes("=")) {
    return arg.split("=")[1];
  }
  return args[index + 1] || defaultValue;
}

const baseUrl = getArgValue("url", "https://seusite.com").replace(/\/$/, "");
const path = getArgValue("path", "/");
const offKey = getArgValue("off", "a7f9c2e1");
const source = getArgValue("source", "FB");
const medium = getArgValue("medium", "{{adset.name}}|{{adset.id}}");
const campaign = getArgValue("campaign", "{{campaign.name}}|{{campaign.id}}");
const content = getArgValue("content", "{{ad.name}}|{{ad.id}}");
const term = getArgValue("term", "{{placement}}");
const campaignId = getArgValue("id", "{{campaign.id}}");

const queryParameters = [
  `off=${offKey}`,
  `utm_source=${source}`,
  `utm_medium=${medium}`,
  `utm_campaign=${campaign}`,
  `utm_content=${content}`,
  `utm_term=${term}`,
  `utm_id=${campaignId}`
];

const rawQueryString = queryParameters.join("&");
const fullDestinationUrl = `${baseUrl}${path.startsWith("/") ? path : "/" + path}?${rawQueryString}`;

console.log("\n=======================================================");
console.log(" 🚀 GERADOR DE URL DE ANÚNCIOS (CLOAKER + UTMs)");
console.log("=======================================================\n");

console.log("🔑 CHAVE DE SEGURANÇA / CLOAKER ATIVA:");
console.log(` \x1b[33m?off=${offKey}\x1b[0m (Hash MD5/SHA1 de 8 caracteres)\n`);

console.log("📌 1. URL COMPLETA DE DESTINO (Para testar no navegador do celular):");
console.log(`\x1b[32m${fullDestinationUrl}\x1b[0m\n`);

console.log("📌 2. CAMPO 'PARÂMETROS DE URL' (Facebook Ads Manager):");
console.log("Copie e cole este texto no campo 'Parâmetros de URL' dentro do anúncio no Facebook Ads:");
console.log(`\x1b[36m${rawQueryString}\x1b[0m\n`);

console.log("📌 3. EXPLICAÇÃO DOS PARÂMETROS:");
console.log(` • off=${offKey}                  -> Chave de segurança que valida o acesso no mobile`);
console.log(" • utm_source=FB                -> Origem: Facebook Ads");
console.log(" • utm_medium={{adset.name}}|{{adset.id}}   -> Nome e ID do Conjunto de Anúncios");
console.log(" • utm_campaign={{campaign.name}}|{{campaign.id}} -> Nome e ID da Campanha");
console.log(" • utm_content={{ad.name}}|{{ad.id}}        -> Nome e ID do Criativo/Anúncio");
console.log(" • utm_term={{placement}}       -> Posicionamento (Instagram Feed, Stories, Reels, etc)");
console.log(" • utm_id={{campaign.id}}         -> ID único da Campanha\n");

console.log("📌 4. EXEMPLOS DE COMANDOS CUSTOMIZADOS:");
console.log(" • Usar outra chave hexadecimal personalizada:");
console.log("   node scripts/generate-utm-url.js --url https://instaspy.com --off 8f92a4e1");
console.log(" • Gerar para rota de cadastro direto:");
console.log("   node scripts/generate-utm-url.js --url https://instaspy.com --path /register\n");
console.log("=======================================================\n");
