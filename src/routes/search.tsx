import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { z } from "zod";
import {
  fetchInstagramProfile,
  formatInstagramNumber,
  generateRealisticProfileFallback,
  type InstagramProfileData,
} from "@/lib/instagram";
import { isAuthenticated } from "@/lib/auth";
import { trackSearch, trackLead } from "@/lib/tracking";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({
    username: z.string().optional(),
  }),
  component: Search,
  head: () => ({
    title: "Buscar Perfil - InstaSpy",
    meta: [
      { name: "description", content: "Descubra quem está falando de você! Busque um perfil no Instagram." },
      { property: "og:title", content: "Buscar Perfil - InstaSpy" },
      { property: "og:description", content: "Descubra quem está falando de você! Busque um perfil no Instagram." },
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

interface SearchItem {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isTarget: boolean;
}

function generateSimilar(base: string): string[] {
  const clean = base.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
  const parts = clean.match(/.{1,4}/g) || [clean];
  const pre = ["insta", "real", "ofc", "the", "iam", "stalk", "spy_"];
  const mid = ["_", ".", ""];
  const post = ["silva", "santos", "oliveira", "br", "official", "pro", "123", "2026", "original", "vip"];
  const results: string[] = [];
  for (let i = 0; i < 20; i++) {
    const type = Math.floor(Math.random() * 4);
    let name = "";
    const p0 = parts[0] ?? clean;
    const preChoice = pre[Math.floor(Math.random() * pre.length)] ?? "insta";
    const midChoice = mid[Math.floor(Math.random() * mid.length)] ?? "_";
    const postChoice = post[Math.floor(Math.random() * post.length)] ?? "ofc";

    if (type === 0) {
      name = preChoice + midChoice + p0;
    } else if (type === 1) {
      name = p0 + midChoice + postChoice;
    } else if (type === 2) {
      const p = parts.length > 1 ? (parts[1] ?? p0) : p0;
      name = p + postChoice + Math.floor(Math.random() * 99);
    } else {
      name = clean.substring(0, Math.max(1, Math.floor(clean.length / 2))) + "_" + postChoice;
    }
    if (!results.includes(name)) results.push(name);
  }
  return results;
}

const TARGET_INDEX = 10;
const TOTAL_ITEMS = 16;
const grayPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23dbdbdb'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

function Search() {
  const { username: initialUsername } = Route.useSearch();
  const [username, setUsername] = useState(initialUsername || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [targetFound, setTargetFound] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [profileData, setProfileData] = useState<InstagramProfileData | null>(null);
  const [step, setStep] = useState<"search" | "profile" | "confirm" | "gender">("search");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveDataRef = useRef<InstagramProfileData | null>(null);
  const fetchDoneRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      navigate({
        to: "/register",
        search: { redirect: "/search" },
      });
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().replace(/^@/, "").toLowerCase();
    if (!cleanUser) return;

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    setIsSearching(true);
    setIsLoadingList(true);
    setTargetFound(false);
    setNotFound(false);
    setFocusedIndex(-1);
    trackSearch(cleanUser);

    setProfileData(null);
    liveDataRef.current = null;
    fetchDoneRef.current = false;

    fetchInstagramProfile(cleanUser)
      .then((data: InstagramProfileData) => {
        fetchDoneRef.current = true;
        if (data) {
          setProfileData(data);
          liveDataRef.current = data;
        }
      })
      .catch((err: any) => {
        fetchDoneRef.current = true;
        console.warn("Instagram profile live fetch fallback:", err);
      });

    const similars = generateSimilar(cleanUser);
    const items: SearchItem[] = [];

    for (let i = 0; i < TOTAL_ITEMS; i++) {
      if (i === TARGET_INDEX) {
        items.push({
          id: `target-${i}`,
          username: cleanUser,
          name: "Verificando conta...",
          avatar: grayPlaceholder,
          isTarget: true,
        });
      } else {
        const mockUser = similars[i > TARGET_INDEX ? i - 1 : i] || `user_${i}`;
        const mockPic = `https://i.pravatar.cc/150?u=${mockUser}${i}`;
        items.push({
          id: `mock-${i}`,
          username: mockUser,
          name: "Instagram User",
          avatar: mockPic,
          isTarget: false,
        });
      }
    }

    initialTimerRef.current = setTimeout(() => {
      setIsLoadingList(false);
      setSearchResults(items);

      let current = 0;

      const scrollToIdx = (idx: number, smooth = true) => {
        const container = dropdownRef.current;
        if (container) {
          const scrollTarget = idx * 65 - container.clientHeight / 2 + 32.5;
          container.scrollTo({
            top: Math.max(0, scrollTarget),
            behavior: smooth ? "smooth" : "auto",
          });
        }
      };

      setTimeout(() => {
        setFocusedIndex(0);
        scrollToIdx(0, false);

        scanIntervalRef.current = setInterval(() => {
          current++;
          setFocusedIndex(current);
          scrollToIdx(current, true);

          if (current >= TARGET_INDEX) {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

            const waitForFetch = () => {
              const liveData = liveDataRef.current;
              const done = fetchDoneRef.current;

              if (!done) {
                transitionTimerRef.current = setTimeout(waitForFetch, 300);
                return;
              }

              if (!liveData || liveData.status !== "success") {
                setNotFound(true);
                setIsSearching(false);
                setTargetFound(false);
                return;
              }

              setSearchResults((prev) =>
                prev.map((item, i) =>
                  i === TARGET_INDEX
                    ? {
                      ...item,
                      name: liveData.fullName || "Encontrado no Instagram",
                      avatar: liveData.profilePicUrl || `https://i.pravatar.cc/300?u=${cleanUser}`,
                    }
                    : item
                )
              );

              setFocusedIndex(TARGET_INDEX);
              setTargetFound(true);
              scrollToIdx(TARGET_INDEX, true);

              transitionTimerRef.current = setTimeout(() => {
                setStep("profile");
              }, 2200);
            };

            transitionTimerRef.current = setTimeout(waitForFetch, 400);
          }
        }, 500);
      }, 100);
    }, 600);
  };

  const startFinalScan = (gender: string) => {
    const clean = username.replace(/^@/, "").toLowerCase();
    trackLead("Search Target Confirmed - @" + clean);
    document.body.style.transition = "opacity 0.4s ease-in-out";
    document.body.style.opacity = "0";
    setTimeout(() => {
      document.body.style.opacity = "1";
      navigate({
        to: "/scanning",
        search: { username: clean, gender },
      });
    }, 400);
  };

  const cleanDisplayUser = username.trim().replace(/^@/, "").toLowerCase();
  const fallbackProfile = useMemo(
    () => generateRealisticProfileFallback(cleanDisplayUser || "usuario"),
    [cleanDisplayUser]
  );

  const displayPic = profileData?.profilePicUrl || fallbackProfile.profilePicUrl;
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
  const displayName =
    profileData?.fullName && profileData.fullName !== cleanDisplayUser
      ? profileData.fullName
      : fallbackProfile.fullName;
  const displayBio = profileData?.biography || fallbackProfile.biography;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fdf2f8_0%,#f0f4ff_50%,#faf5ff_100%)] px-5 py-10">
      <div className="w-full max-w-[440px] text-center">
        <h1 className="mb-1 inline-flex items-center gap-2 text-[2.2rem] font-extrabold instagram-text">
          <span>InstaSpy</span> <VerifiedBadge />
        </h1>
        <p className="mb-10 text-[0.95rem] text-muted-foreground">Descubra quem está falando de você!</p>

        {step === "search" && (
          <>
            <div className="rounded-[20px] border border-white/50 bg-white/70 p-[30px] text-left shadow-[0_15px_35px_rgba(0,0,0,0.05),0_5px_15px_rgba(0,0,0,0.03)] backdrop-blur-[20px]">
              <form onSubmit={handleSearch}>
                <label className="mb-3 block text-[0.75rem] font-bold tracking-[1px] text-muted-foreground uppercase">
                  PERFIL ALVO NO INSTAGRAM
                </label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="@seuperfil"
                    className="min-w-0 flex-1 rounded-[14px] border-[1.5px] border-[#e0e0e0] bg-white/90 px-4 py-3.5 text-base md:text-[0.95rem] font-medium text-[#262626] outline-none transition-all focus:border-[#cc2366] focus:bg-white focus:ring-[4px] focus:ring-[#cc2366]/10"
                    autoComplete="off"
                    disabled={isSearching}
                  />
                  <button
                    type="submit"
                    disabled={!username || isSearching}
                    className="instagram-bg flex-shrink-0 rounded-[14px] px-5 py-3.5 text-[0.95rem] font-bold text-white shadow-[0_4px_15px_rgba(220,39,67,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(220,39,67,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {isSearching ? "Buscando..." : "Buscar"}
                  </button>
                </div>
              </form>
            </div>

            { }
            {isSearching && (
              <div
                ref={dropdownRef}
                className="mt-4 max-h-[360px] overflow-y-auto rounded-[20px] border border-black/5 bg-white p-2 shadow-[0_15px_35px_rgba(0,0,0,0.1)] animate-slide-down"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {isLoadingList ? (
                  <div className="py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#cc2366] border-t-transparent mb-3" />
                    <div className="text-[0.85rem] font-semibold text-[#666]">
                      Buscando no banco de dados do Instagram...
                    </div>
                  </div>
                ) : (
                  searchResults.map((item, index) => {
                    const isFocused = focusedIndex === index;
                    const isTarget = item.isTarget;
                    const isFound = targetFound && isTarget;

                    return (
                      <div
                        key={item.id}
                        ref={(el) => {
                          itemRefs.current[index] = el;
                        }}
                        className={`flex h-[65px] min-h-[65px] items-center gap-3 rounded-xl px-3.5 transition-colors duration-200 ${isFound
                            ? "bg-emerald-50 ring-2 ring-emerald-400"
                            : isFocused
                              ? "bg-[#f0f0f0]"
                              : "bg-transparent"
                          }`}
                      >
                        <div className="h-[45px] w-[45px] flex-shrink-0 overflow-hidden rounded-full bg-[#eee] border border-black/5">
                          <img
                            src={item.avatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = grayPlaceholder;
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-[0.95rem] font-bold text-[#262626] flex items-center gap-1.5">
                            @{item.username}
                            {isFound && (
                              <span className="text-xs font-bold text-[#0095F6]">✓</span>
                            )}
                          </div>
                          <div
                            className={`text-[0.8rem] ${isFound
                                ? "font-semibold text-emerald-600"
                                : "text-[#8e8e8e]"
                              }`}
                          >
                            {item.name}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {!isSearching && !notFound && (
              <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-[#dc2743]/40 bg-white/75 p-[12px_14px] text-left text-[0.8rem] shadow-[0_4px_12px_rgba(220,39,67,0.1)] backdrop-blur-[15px] animate-warning-glow">
                <div className="text-[1.4rem] animate-warning-pulse">⚠️</div>
                <div className="text-[#333] leading-relaxed">
                  <span className="font-extrabold text-[#dc2743]">Atenção:</span> O perfil precisa ser público.
                  <br />
                  Perfis privados não podem ser localizados.
                </div>
              </div>
            )}

            {notFound && (
              <div className="mt-4 rounded-[20px] border border-black/5 bg-[#fafafa] p-[30px] text-center shadow-[0_15px_35px_rgba(0,0,0,0.05)] animate-slide-down">
                <div className="text-[3rem] mb-4">🔍</div>
                <div className="text-[1.1rem] font-bold text-[#262626] mb-2">Usuário não encontrado</div>
                <div className="text-[0.9rem] text-[#666] mb-6">Verifique se o @ está correto e tente novamente.</div>
                <button
                  onClick={() => {
                    setNotFound(false);
                    setIsSearching(false);
                    setTargetFound(false);
                    setSearchResults([]);
                    setFocusedIndex(-1);
                    setUsername("");
                  }}
                  className="instagram-bg cursor-pointer rounded-[10px] border-none px-6 py-3 text-[0.95rem] font-semibold text-white shadow-[0_4px_15px_rgba(220,39,67,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(220,39,67,0.3)]"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </>
        )}

        {step === "profile" && (
          <div className="rounded-[28px] border border-black/5 bg-white p-[40px_25px] shadow-[0_25px_60px_rgba(0,0,0,0.1)] animate-card-glow text-center">
            <h2 className="mb-6 bg-gradient-to-r from-[#f09433] to-[#dc2743] bg-clip-text text-[1.8rem] font-extrabold text-transparent animate-pop-in">
              Confirme o Instagram
            </h2>

            <div className="mb-6 flex items-center gap-5 text-left animate-fade-in-up">
              <div className="h-[105px] w-[105px] flex-shrink-0 rounded-full p-1 instagram-bg">
                <img
                  src={displayPic}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-full border-4 border-white object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${cleanDisplayUser}`;
                  }}
                />
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-center">
                <div className="min-w-0">
                  <div className="text-[0.82rem] min-[420px]:text-[1rem] font-extrabold text-[#1a1a1a] whitespace-nowrap">
                    {displayPosts}
                  </div>
                  <div className="text-[0.62rem] min-[420px]:text-[0.7rem] font-semibold text-[#666] whitespace-nowrap">
                    posts
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[0.82rem] min-[420px]:text-[1rem] font-extrabold text-[#1a1a1a] whitespace-nowrap">
                    {displayFollowers}
                  </div>
                  <div className="text-[0.62rem] min-[420px]:text-[0.7rem] font-semibold text-[#666] whitespace-nowrap">
                    seguidores
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[0.82rem] min-[420px]:text-[1rem] font-extrabold text-[#1a1a1a] whitespace-nowrap">
                    {displayFollowing}
                  </div>
                  <div className="text-[0.62rem] min-[420px]:text-[0.7rem] font-semibold text-[#666] whitespace-nowrap">
                    seguindo
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 text-left">
              <div className="mb-1 text-[0.95rem] font-bold text-[#1a1a1a] flex items-center gap-1.5">
                {displayName}
                {profileData?.isVerified && (
                  <span className="text-sm font-bold text-[#0095F6]">✓</span>
                )}
              </div>
              <div className="max-h-[85px] overflow-y-auto text-[0.82rem] text-[#444] leading-relaxed whitespace-pre-line">
                {displayBio}
              </div>
            </div>

            <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-[#dc2743]/30 bg-[#dc2743]/10 p-2 text-center">
              <span className="text-xs">⚠️</span>
              <div className="text-[0.65rem] font-bold text-[#dc2743] leading-tight">
                Limite de apenas 1 pesquisa por dispositivo,
                <br />
                certifique-se que digitou o usuário corretamente.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsSearching(false);
                  setTargetFound(false);
                  setStep("search");
                }}
                className="flex-1 cursor-pointer rounded-xl bg-black/5 py-3.5 text-[0.9rem] font-bold text-[#555] transition-all hover:bg-black/10"
              >
                Corrigir @
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="instagram-bg flex-[1.3] cursor-pointer rounded-xl py-3.5 text-[0.95rem] font-bold text-white shadow-[0_8px_20px_rgba(220,39,67,0.2)] transition-all hover:opacity-95 flex items-center justify-center gap-2"
              >
                <span>Confirmar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="rounded-[28px] border border-black/5 bg-white p-[40px_25px] shadow-[0_25px_60px_rgba(0,0,0,0.1)] animate-card-glow text-center">
            <h2 className="mb-6 bg-gradient-to-r from-[#f09433] to-[#dc2743] bg-clip-text text-[1.6rem] font-extrabold text-transparent animate-pop-in">
              O usuário pesquisado é maior de 18 anos?
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsSearching(false);
                  setTargetFound(false);
                  setStep("search");
                }}
                className="flex-1 cursor-pointer rounded-xl bg-black/5 py-4 text-[1rem] font-bold text-[#555] transition-all hover:bg-black/10"
              >
                Não.
              </button>
              <button
                onClick={() => setStep("gender")}
                className="instagram-bg flex-1 cursor-pointer rounded-xl py-4 text-[1rem] font-bold text-white shadow-[0_8px_20px_rgba(220,39,67,0.2)] transition-all hover:shadow-[0_8px_25px_rgba(220,39,67,0.3)]"
              >
                Sim!
              </button>
            </div>
          </div>
        )}

        {step === "gender" && (
          <div className="rounded-[28px] border border-black/5 bg-white p-[40px_25px] shadow-[0_25px_60px_rgba(0,0,0,0.1)] animate-card-glow text-center">
            <h2 className="mb-6 bg-gradient-to-r from-[#f09433] to-[#dc2743] bg-clip-text text-[1.6rem] font-extrabold text-transparent animate-pop-in">
              O perfil pesquisado é masculino ou feminino?
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => startFinalScan("masculino")}
                className="flex-1 cursor-pointer rounded-xl bg-[#0078d7] py-4 text-[1rem] font-bold text-white shadow-[0_8px_20px_rgba(0,120,215,0.2)] transition-all hover:opacity-90"
              >
                Masculino
              </button>
              <button
                onClick={() => startFinalScan("feminino")}
                className="flex-1 cursor-pointer rounded-xl bg-[#e0245e] py-4 text-[1rem] font-bold text-white shadow-[0_8px_20px_rgba(224,36,94,0.2)] transition-all hover:opacity-90"
              >
                Feminino
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
