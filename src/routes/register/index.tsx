import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { registerUser, loginUser, isAuthenticated } from "@/lib/auth";
import { trackCompleteRegistration } from "@/lib/tracking";

export const Route = createFileRoute("/register/")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: Register,
  head: () => ({
    title: "Entrar - InstaSpy",
    meta: [
      { name: "description", content: "Crie sua conta ou entre no InstaSpy e descubra quem está falando de você." },
      { property: "og:title", content: "Entrar - InstaSpy" },
      { property: "og:description", content: "Crie sua conta ou entre no InstaSpy e descubra quem está falando de você." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const VerifiedBadge = () => (
  <svg width="29" height="29" viewBox="0 0 24 24" fill="none" style={{ transform: "translateY(3px)" }}>
    <path
      d="M12 2L13.73 3.52L15.99 3.27L17.15 5.23L17.15 5.23L19.38 5.61L19.86 7.84L21.78 9.17L21.46 11.44L22.6 13.5L21.46 15.56L21.78 17.83L19.86 19.16L19.38 21.39L17.15 21.77L15.99 23.73L13.73 23.48L12 25L10.27 23.48L8.01 23.73L6.85 21.77L4.62 21.39L4.14 19.16L2.22 17.83L2.54 15.56L1.4 13.5L2.54 11.44L2.22 9.17L4.14 7.84L4.62 5.61L6.85 5.23L8.01 3.27L10.27 3.52L12 2Z"
      fill="#0095F6"
    />
    <path d="M15.5 11.5L11 15.5L8.5 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-muted/40 px-4 py-3 text-base md:text-[0.95rem] text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-[#cc2366] focus:bg-white focus:ring-[3px] focus:ring-[#cc2366]/10";
const labelClass = "mb-[7px] block text-[0.82rem] font-semibold text-muted-foreground";

function maskWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "").substring(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
}

function Register() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      if (redirect && redirect.startsWith("/")) {
        window.location.href = redirect;
      } else {
        window.location.href = "/search";
      }
    }
  }, [redirect]);

  const [tab, setTab] = useState<"login" | "register">("register");

  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const whatsappInvalid = whatsappDigits.length > 0 && whatsappDigits.length < 10;

  const handleRedirectAfterAuth = () => {
    if (redirect && redirect.startsWith("/")) {
      window.location.href = redirect;
    } else {
      window.location.href = "/search";
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!username.trim()) {
      setErrorMessage("Por favor, digite seu @ do Instagram.");
      return;
    }
    if (!password) {
      setErrorMessage("Por favor, digite sua senha.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(username, password);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage("Login efetuado com sucesso! Redirecionando...");
        setTimeout(() => {
          handleRedirectAfterAuth();
        }, 600);
      } else {
        setErrorMessage(res.message || "Erro ao efetuar login. Verifique suas credenciais.");
      }
    }, 500);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!username.trim()) {
      setErrorMessage("Por favor, digite seu @ do Instagram.");
      return;
    }
    if (!whatsappDigits || whatsappDigits.length < 10) {
      setErrorMessage("Por favor, digite um número de WhatsApp válido.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage("A senha deve ter no mínimo 4 caracteres.");
      return;
    }
    if (!acceptTerms) {
      setErrorMessage("Você precisa aceitar os termos de uso para continuar.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = registerUser(username, whatsapp, password);
      setIsLoading(false);

      if (res.success) {
        trackCompleteRegistration();
        setSuccessMessage("Conta criada e sessão ativada com sucesso! Redirecionando...");
        setTimeout(() => {
          handleRedirectAfterAuth();
        }, 600);
      } else {
        setErrorMessage(res.message || "Erro ao cadastrar conta.");
      }
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(135deg,#fdf2f8_0%,#f0f4ff_50%,#faf5ff_100%)] p-5">
      <div className="w-full max-w-[420px] animate-fade-in-up">
        { }
        <div className="mb-[30px] text-center">
          <h1 className="m-0 inline-flex items-center gap-2 text-[2.2rem] font-extrabold instagram-text">
            InstaSpy
            <VerifiedBadge />
          </h1>
          <p className="mt-2 text-[0.9rem] text-muted-foreground">Descubra quem está falando de você!</p>
        </div>

        { }
        <div className="rounded-[20px] border border-white/60 bg-white/85 p-[35px_30px] shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_15px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          { }
          <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 rounded-[10px] px-4 py-3 text-[0.9rem] font-semibold transition-all cursor-pointer ${tab === t
                    ? "bg-white text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                    : "text-muted-foreground hover:text-foreground/70"
                  }`}
              >
                {t === "login" ? "Entrar" : "Criar Conta"}
              </button>
            ))}
          </div>

          { }
          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-[0.82rem] font-bold text-red-600 animate-shake">
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-3 text-[0.82rem] font-bold text-green-700 animate-pulse">
              ✓ {successMessage}
            </div>
          )}

          { }
          {tab === "login" && (
            <form onSubmit={handleLogin}>
              <div className="mb-[18px]">
                <label className={labelClass} htmlFor="login-username">
                  Seu @ do Instagram
                </label>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  placeholder="@seuperfil"
                  maxLength={30}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="mb-[18px]">
                <label className={labelClass} htmlFor="login-password">
                  Senha
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="Sua senha"
                  maxLength={50}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="mb-5 -mt-3 text-right">
                <a
                  href="https://t.me/registrodeadminbot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.75rem] font-medium text-muted-foreground transition-colors hover:text-[#cc2366]"
                >
                  Esqueceu sua senha? Recupere via Telegram
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-xl py-3.5 text-base font-bold text-white instagram-bg shadow-[0_4px_15px_rgba(220,39,67,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(220,39,67,0.4)] cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </form>
          )}

          { }
          {tab === "register" && (
            <form onSubmit={handleRegister}>
              <div className="mb-[18px]">
                <label className={labelClass} htmlFor="reg-username">
                  Seu @ do Instagram
                </label>
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="@seuperfil"
                  maxLength={30}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="mb-[18px]">
                <label className={labelClass} htmlFor="reg-whatsapp">
                  Seu WhatsApp
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-[1.1rem] font-medium text-muted-foreground">
                    🇧🇷 <span className="text-[0.85rem]">+55</span>
                  </div>
                  <input
                    id="reg-whatsapp"
                    name="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(00) 00000-0000"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                    className={`${inputClass} pl-20 tracking-[0.5px]`}
                  />
                </div>
                {whatsappInvalid && (
                  <div className="mt-[5px] text-[0.75rem] text-[#dc2743]">Digite um número de WhatsApp válido</div>
                )}
              </div>

              <div className="mb-[18px]">
                <label className={labelClass} htmlFor="reg-password">
                  Crie uma Senha <span className="font-normal text-muted-foreground/70">(diferente da sua senha do Instagram)</span>
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Crie uma senha única para o InstaSpy"
                  minLength={4}
                  maxLength={50}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="mb-6 mt-5">
                <label className="flex cursor-pointer items-start gap-2.5 text-[0.8rem] font-medium leading-[1.4] text-muted-foreground">
                  <input
                    type="checkbox"
                    name="accept_terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    className="m-0 h-[18px] w-[18px] flex-shrink-0 cursor-pointer accent-[#dc2743]"
                  />
                  <span>
                    Declaro que li e aceito os{" "}
                    <a href="/termos" target="_blank" className="font-semibold text-[#cc2366] underline">
                      termos de uso e politicas de privacidade
                    </a>{" "}
                    da plataforma InstaSpy.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-xl py-3.5 text-base font-bold text-white instagram-bg shadow-[0_4px_15px_rgba(220,39,67,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(220,39,67,0.4)] cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Criando conta e ativando sessão...</span>
                  </>
                ) : (
                  <span>Criar conta</span>
                )}
              </button>
            </form>
          )}

          { }
          <div className="mt-4 flex flex-col items-center gap-1 rounded-xl border border-border bg-white px-4 py-3 text-center animate-security-pulse">
            <span className="text-[0.78rem] font-bold text-foreground">🔒 Sua segurança é prioridade</span>
            <span className="text-[0.72rem] leading-[1.4] text-muted-foreground">
              Nós <strong className="text-[#dc2743]">NUNCA</strong> pedimos sua senha do Instagram. A senha que você cria aqui é
              exclusiva para o InstaSpy e deve ser diferente das suas outras senhas.
            </span>
          </div>
        </div>

        { }
        <div className="mt-[18px] text-center text-[0.78rem] leading-[1.5] text-muted-foreground">
          Ao continuar, você concorda com nossos
          <br />
          <a href="/termos" target="_blank" className="font-medium text-[#cc2366] no-underline">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="/termos" target="_blank" className="font-medium text-[#cc2366] no-underline">
            Política de Privacidade
          </a>
          .
        </div>

        <div className="mt-6 text-center text-[0.75rem] text-muted-foreground/60">
          © 2026 InstaSpy. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
