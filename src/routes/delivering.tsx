import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { fetchInstagramProfile, type InstagramProfileData } from "@/lib/instagram";
import { isAuthenticated } from "@/lib/auth";
import { trackViewContent } from "@/lib/tracking";

export const Route = createFileRoute("/delivering")({
  validateSearch: z.object({
    username: z.string().optional(),
    gender: z.string().optional(),
  }),
  component: DeliveringPage,
  head: () => ({
    title: "Gerando Relatório Completo - InstaSpy",
    meta: [
      {
        name: "description",
        content: "Seu relatório analítico do InstaSpy está sendo descriptografado e montado.",
      },
    ],
  }),
});

const VerifiedBadge = ({ size = 29 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: "translateY(3px)" }}>
    <path
      d="M12 2L13.73 3.52L15.99 3.27L17.15 5.23L17.15 5.23L19.38 5.61L19.86 7.84L21.78 9.17L21.46 11.44L22.6 13.5L21.46 15.56L21.78 17.83L19.86 19.16L19.38 21.39L17.15 21.77L15.99 23.73L13.73 23.48L12 25L10.27 23.48L8.01 23.73L6.85 21.77L4.62 21.39L4.14 19.16L2.22 17.83L2.54 15.56L1.4 13.5L2.54 11.44L2.22 9.17L4.14 7.84L4.62 5.61L6.85 5.23L8.01 3.27L10.27 3.52L12 2Z"
      fill="#0095F6"
    />
    <path d="M15.5 11.5L11 15.5L8.5 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PROGRESS_STEPS = [
  { limit: 20, text: "Compilando dados de stalkers..." },
  { limit: 45, text: "Reunindo capturas de tela e directs..." },
  { limit: 70, text: "Gerando chaves de acesso anônimo..." },
  { limit: 95, text: "Finalizando liberação do relatório..." },
  { limit: 100, text: "Relatório gerado com sucesso!" },
];

function DeliveringPage() {
  const { username: rawUsername = "", gender } = Route.useSearch();
  const cleanUsername = rawUsername.trim().replace(/^@/, "").toLowerCase();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Conectando ao banco de dados...");
  const [profileData, setProfileData] = useState<InstagramProfileData | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

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
    if (!cleanUsername) return;
    trackViewContent("Delivering Dossier - @" + cleanUsername);

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
        if (data?.status === "success") {
          setProfileData(data);
          try {
            localStorage.setItem("instaspy_profile_data_" + cleanUsername, JSON.stringify(data));
          } catch { }
        }
      })
      .catch((err: any) => {
        console.warn("Could not fetch profile in delivering:", err);
      });
  }, [cleanUsername]);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      const inc = Math.floor(Math.random() * 4) + 2;
      current += inc;

      if (current > 100) current = 100;
      setProgress(current);

      for (const step of PROGRESS_STEPS) {
        if (current <= step.limit) {
          setStatusText(step.text);
          break;
        }
      }

      if (current >= 100) {
        clearInterval(interval);
        setStatusText("Relatório PRONTO! Descriptografando...");
        setIsFadingOut(true);
        setTimeout(() => {
          navigate({
            to: "/resultado",
            search: { username: cleanUsername, gender },
          });
        }, 700);
      }
    }, 240);

    return () => clearInterval(interval);
  }, [cleanUsername, gender, navigate]);

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fdf2f8_0%,#f0f4ff_50%,#faf5ff_100%)] px-5 py-10 font-sans transition-opacity duration-700 ease-in-out ${isFadingOut ? "opacity-0" : "opacity-100"
        }`}
    >
      <div className="w-full max-w-[440px] text-center">
        { }
        <h1 className="mb-8 inline-flex items-center justify-center gap-2 text-[2.2rem] font-extrabold instagram-text">
          <span>InstaSpy</span> <VerifiedBadge />
        </h1>

        { }
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-[40px_30px] shadow-[0_25px_60px_rgba(0,0,0,0.08),0_10px_20px_rgba(0,0,0,0.04)] backdrop-blur-[20px] text-center">
          { }
          <div className="relative mx-auto mb-6 flex h-[120px] w-[120px] items-center justify-center">
            { }
            <div className="absolute -inset-2.5 rounded-full border-[3.5px] border-transparent border-t-[#0095f6] border-r-[#cc2366] animate-spin" />
            { }
            <div className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(0,149,246,0.2)_0%,rgba(204,35,102,0.15)_50%,transparent_70%)] animate-pulse" />

            { }
            {(!profileData?.profilePicUrl || !isImageLoaded) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full border-4 border-white bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse shadow-[0_8px_25px_rgba(0,0,0,0.12)]">
                <svg className="h-10 w-10 text-gray-400/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}

            {profileData?.profilePicUrl && (
              <img
                src={profileData.profilePicUrl}
                alt="Pfp"
                referrerPolicy="no-referrer"
                onLoad={() => setIsImageLoaded(true)}
                className={`relative z-10 h-full w-full rounded-full border-4 border-white object-cover shadow-[0_8px_25px_rgba(0,0,0,0.12)] bg-[#eee] transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${cleanUsername}`;
                  setIsImageLoaded(true);
                }}
              />
            )}
          </div>

          { }
          <div className="mb-3 min-h-[26px] text-[0.98rem] font-bold text-[#1f2937] transition-all">
            {statusText}
          </div>

          { }
          <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-[#e5e7eb] p-0.5 shadow-inner">
            <div
              className="h-full rounded-full instagram-bg transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          { }
          <div className="mb-5 text-[1.2rem] font-black text-[#0095f6]">
            {progress}%
          </div>

          { }
          {profileData?.fullName ? (
            <div className="text-[1.1rem] font-extrabold text-[#111827] mb-0.5 animate-fade-in-up">
              {profileData.fullName}
            </div>
          ) : (
            <div className="mx-auto mb-1 h-5 w-40 rounded-md bg-gray-200/80 animate-pulse" />
          )}

          <div className="text-[0.88rem] font-semibold text-[#6b7280]">
            @{cleanUsername || "usuario"}
          </div>

          { }
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[0.78rem] text-[#10b981] font-bold">
            <span className="inline-block h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
            Pagamento Confirmado • Desbloqueando Arquivos
          </div>
        </div>
      </div>
    </div>
  );
}
