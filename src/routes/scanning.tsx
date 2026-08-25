import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { fetchInstagramProfile, type InstagramProfileData } from "@/lib/instagram";
import { isAuthenticated } from "@/lib/auth";
import { trackStartScanning, trackViewContent, trackLead } from "@/lib/tracking";

export const Route = createFileRoute("/scanning")({
  validateSearch: z.object({
    username: z.string().optional(),
    gender: z.string().optional(),
  }),
  component: ScanningPage,
  head: () => ({
    title: "Analisando Perfil - InstaSpy",
    meta: [
      { name: "description", content: "Análise profunda de perfil em andamento no InstaSpy." },
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
  { limit: 20, text: "Conectando ao banco de dados do Instagram..." },
  { limit: 45, text: "Buscando histórico de interações..." },
  { limit: 70, text: "Decodificando mensagens e prints..." },
  { limit: 95, text: "Analisando stalkers agora..." },
  { limit: 100, text: "Acesso liberado!" },
];

function ScanningPage() {
  const { username: rawUsername = "", gender } = Route.useSearch();
  const cleanUsername = rawUsername.trim().replace(/^@/, "").toLowerCase();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Conectando ao banco de dados...");
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

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      navigate({
        to: "/register",
        search: { redirect: window.location.pathname + window.location.search },
      });
    }
  }, [navigate]);

  useEffect(() => {
    if (!cleanUsername) return;
    trackStartScanning(cleanUsername);
    trackViewContent("Scanning - @" + cleanUsername);
    fetchInstagramProfile(cleanUsername)
      .then((data: InstagramProfileData) => {
        if (data?.status === "success") setProfileData(data);
      })
      .catch((err: any) => {
        console.warn("Could not fetch profile in scanning:", err);
      });
  }, [cleanUsername]);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 4) + 2;
      if (current > 100) current = 100;

      setProgress(current);

      for (const step of PROGRESS_STEPS) {
        if (current <= step.limit) {
          setStatusText(step.text);
          break;
        }
      }

      if (current === 100) {
        clearInterval(interval);
        trackLead("Profile Scan Complete - @" + cleanUsername);
        setTimeout(() => {
          navigate({
            to: "/dashboard",
            search: { username: cleanUsername, gender },
          });
        }, 500);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [cleanUsername, gender, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fdf2f8_0%,#f0f4ff_50%,#faf5ff_100%)] px-5 py-10 font-sans">
      { }
      <div className="w-full max-w-[440px] text-center">
        <h1 className="mb-8 inline-flex items-center gap-2 text-[2.2rem] font-extrabold instagram-text">
          <span>InstaSpy</span> <VerifiedBadge />
        </h1>

        <div className="rounded-[28px] border border-white/60 bg-white/80 p-[40px_30px] shadow-[0_25px_60px_rgba(0,0,0,0.08),0_10px_20px_rgba(0,0,0,0.04)] backdrop-blur-[20px] text-center">
          { }
          <div className="relative mx-auto mb-6 flex h-[120px] w-[120px] items-center justify-center">
            { }
            <div className="absolute -inset-2 rounded-full border-[3.5px] border-transparent border-t-[#cc2366] border-r-[#f09433] animate-spin" />
            { }
            <div className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(204,35,102,0.25)_0%,rgba(240,148,51,0)_70%)] animate-pulse" />

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

          <div className="mb-3 min-h-[24px] text-[0.95rem] font-bold text-[#262626]">
            {statusText}
          </div>

          { }
          <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-[#eef0f3]">
            <div
              className="h-full rounded-full instagram-bg transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mb-5 text-[1.15rem] font-extrabold text-[#cc2366]">
            {progress}%
          </div>

          {profileData?.fullName ? (
            <div className="text-[1.05rem] font-extrabold text-[#1a1a1a] mb-0.5 animate-fade-in-up">
              {profileData.fullName}
            </div>
          ) : (
            <div className="mx-auto mb-1 h-5 w-36 rounded-md bg-gray-200/80 animate-pulse" />
          )}

          <div className="text-[0.85rem] font-semibold text-[#8e8e8e]">
            @{cleanUsername || "perfil"}
          </div>
        </div>
      </div>
    </div>
  );
}
