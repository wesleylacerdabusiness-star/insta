import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { trackViewContent } from "@/lib/tracking";

import img1 from "@/assets/reels/1.webp";
import img2 from "@/assets/reels/2.webp";
import img3 from "@/assets/reels/3.webp";
import img4 from "@/assets/reels/4.webp";
import img5 from "@/assets/reels/5.webp";
import img6 from "@/assets/reels/6.webp";
import img7 from "@/assets/reels/7.webp";
import img8 from "@/assets/reels/8.webp";
import img9 from "@/assets/reels/9.webp";
import img10 from "@/assets/reels/10.webp";
import img11 from "@/assets/reels/11.webp";
import img12 from "@/assets/reels/12.webp";
import img13 from "@/assets/reels/13.webp";
import img14 from "@/assets/reels/14.webp";
import img15 from "@/assets/reels/15.webp";

import { z } from "zod";
import { validateTrafficAccess, executeSecurityRedirect } from "@/lib/security";

export const Route = createFileRoute("/")({
  validateSearch: z
    .object({
      off: z.string().optional(),
    })
    .catchall(z.any()),
  component: Index,
  head: () => ({
    title: "InstaSpy - Descubra quem está falando de você!",
    meta: [
      { name: "description", content: "Centenas de pessoas falam sobre o InstaSpy todos os dias. Descubra quem está te observando." },
      { property: "og:title", content: "InstaSpy - Descubra quem está falando de você!" },
      { property: "og:description", content: "Centenas de pessoas falam sobre o InstaSpy todos os dias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const search = Route.useSearch();
  const offKey = search.off;
  const [isAccessAllowed, setIsAccessAllowed] = useState(false);

  const [typedText, setTypedText] = useState("@");
  const [showCTA, setShowCTA] = useState(true);
  const typingFinished = useRef(false);

  useEffect(() => {
    (async () => {
      const result = await validateTrafficAccess(offKey);
      if (!result.allowed) {
        executeSecurityRedirect();
      } else {
        setIsAccessAllowed(true);
        trackViewContent("Landing Page - Início");
      }
    })();
  }, [offKey]);

  useEffect(() => {
    if (typingFinished.current) return;

    const names = [
      "m****_f*****",
      "l****_s****",
      "j****_o****",
      "a****_m****",
      "r****_p****",
      "g****_s****",
      "k****_l****",
      "p****_v****"
    ];

    let currentNameIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 150;

    const type = () => {
      const currentName = names[currentNameIndex] || "";

      if (isDeleting) {
        setTypedText("@" + currentName.substring(0, charIndex));
        charIndex--;
        typingSpeed = 50;
      } else {
        setTypedText("@" + currentName.substring(0, charIndex + 1));
        charIndex++;
        typingSpeed = 150;
      }

      if (!isDeleting && charIndex === currentName.length) {
        isDeleting = true;
        typingSpeed = 1000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        currentNameIndex = (currentNameIndex + 1) % names.length;
        typingSpeed = 500;

        if (currentNameIndex === 0 && !showCTA) {
          setShowCTA(true);
        }
      }

      setTimeout(type, typingSpeed);
    };

    setTimeout(type, typingSpeed);
    typingFinished.current = true;
  }, [showCTA]);

  const track1 = [img1, img2, img3, img4, img5];
  const track2 = [img6, img7, img8, img9, img10];
  const track3 = [img11, img12, img13, img14, img15];

  const [spyCount, setSpyCount] = useState(() => 1294 + Math.floor(Math.random() * 506));

  useEffect(() => {
    const interval = setInterval(() => {
      setSpyCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const avatars = [
    "https://i.pravatar.cc/150?u=1",
    "https://i.pravatar.cc/150?u=2",
    "https://i.pravatar.cc/150?u=3",
    "https://i.pravatar.cc/150?u=4",
    "https://i.pravatar.cc/150?u=5",
    "https://i.pravatar.cc/150?u=6",
    "https://i.pravatar.cc/150?u=7",
  ];

  if (!isAccessAllowed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-transparent border-t-[#ff416c] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      { }
      <nav className="flex justify-between items-center py-5 px-[5%]">
        <div className="text-2xl font-extrabold instagram-text flex items-center gap-2">
          InstaSpy
          <span className="flex items-center justify-center translate-y-[3px]">
            <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.73 3.52L15.99 3.27L17.15 5.23L17.15 5.23L19.38 5.61L19.86 7.84L21.78 9.17L21.46 11.44L22.6 13.5L21.46 15.56L21.78 17.83L19.86 19.16L19.38 21.39L17.15 21.77L15.99 23.73L13.73 23.48L12 25L10.27 23.48L8.01 23.73L6.85 21.77L4.62 21.39L4.14 19.16L2.22 17.83L2.54 15.56L1.4 13.5L2.54 11.44L2.22 9.17L4.14 7.84L4.62 5.61L6.85 5.23L8.01 3.27L10.27 3.52L12 2Z" fill="#0095F6"></path>
              <path d="M15.5 11.5L11 15.5L8.5 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </span>
        </div>
      </nav>

      { }
      <main className="flex flex-col items-center text-center pt-10 pb-8 px-5">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold instagram-text leading-tight mb-6 max-w-[600px] w-[95%]">
          Você está sendo observado, veja por quem...
        </h1>

        <div className="relative w-full max-w-[330px] mx-auto">
          <div className="relative z-10 bg-white/90 backdrop-blur-md shadow-sm border border-border rounded-xl p-3.5 flex items-center gap-2.5 mb-5">
            <span className="text-lg">🔍</span>
            <span className="text-base text-foreground font-medium">{typedText}</span>
            <span className="animate-blink font-bold text-muted-foreground">|</span>
          </div>

          <div className={`transition-all duration-500 relative z-10 ${showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <Button asChild className="w-full rounded-xl font-bold text-[1.05rem] instagram-bg hover:opacity-90 shadow-lg shadow-primary/40 h-12">
              <Link to={"/register" as any}>Começar Agora</Link>
            </Button>
          </div>
        </div>
      </main>

      { }
      <section className="pt-10 text-center relative overflow-hidden">
        <div className="text-[0.8rem] font-extrabold tracking-[2px] uppercase text-[#e6683c] mb-2">— EM ALTA —</div>
        <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2 px-4 leading-tight">Viral em todas as redes sociais</h2>
        <p className="text-muted-foreground text-[0.95rem] max-w-[380px] mx-auto mb-8 px-4 leading-normal">Centenas de pessoas falam sobre o InstaSpy todos os dias.</p>

        <div className="flex flex-col gap-4 pb-5 relative">
          { }
          <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          { }
          <div className="flex w-max animate-scroll-l2r gap-4">
            {[...track1, ...track1].map((url, i) => (
              <div key={`t1-${i}`} className="w-[170px] h-[300px] rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-md">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>

          { }
          <div className="flex w-max animate-scroll-r2l gap-4">
            {[...track2, ...track2].map((url, i) => (
              <div key={`t2-${i}`} className="w-[170px] h-[300px] rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-md">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>

          { }
          <div className="flex w-max animate-scroll-l2r gap-4">
            {[...track3, ...track3].map((url, i) => (
              <div key={`t3-${i}`} className="w-[170px] h-[300px] rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-md">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      { }
      <footer className="pt-8 pb-12 text-center text-sm text-muted-foreground">
        { }
        <div className="relative my-8 flex justify-center px-4">
          <div className="relative">
            { }
            <div className="absolute -top-5 -right-5 z-10 h-[60px] w-[60px] overflow-hidden rounded-full border-[3px] border-white shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
              <img
                src="https://i.pravatar.cc/100?u=14"
                alt=""
                className="h-full w-full object-cover blur-[4px]"
              />
            </div>
            <div className="absolute -bottom-2.5 -left-7 z-10 h-[50px] w-[50px] overflow-hidden rounded-full border-2 border-white shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
              <img
                src="https://i.pravatar.cc/100?u=15"
                alt=""
                className="h-full w-full object-cover blur-[4px]"
              />
            </div>

            { }
            <div className="w-[330px] rounded-[20px] border border-border/40 bg-white/85 p-[10px_15px_0px] text-left shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#25D366] animate-pulse-green shadow-[0_0_0_0_rgba(37,211,102,0.7)]" />
                <span className="text-[0.85rem] font-bold text-[#333]">
                  Sistema Ativo em Tempo Real
                </span>
              </div>

              { }
              <div className="relative h-[75px] w-full overflow-hidden bg-white">
                { }
                <div className="pointer-events-none absolute top-0 -left-3 z-10 h-full w-[90px] bg-gradient-to-r from-white from-35% to-transparent" />
                <div className="pointer-events-none absolute top-0 -right-3 z-10 h-full w-[90px] bg-gradient-to-l from-white from-35% to-transparent" />

                { }
                <div className="flex h-full w-max items-center gap-2.5 animate-scroll-avatars">
                  {[...avatars, ...avatars].map((avatar, index) => (
                    <div
                      key={`avatar-${index}`}
                      className="h-[62px] w-[62px] flex-shrink-0 rounded-full border-[2.5px] border-[#e1306c] p-[2px]"
                    >
                      <img
                        src={avatar}
                        alt=""
                        className="h-full w-full rounded-full object-cover blur-[3px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              { }
              <p className="m-0 border-t border-[#f0f0f0] py-2.5 text-center text-[0.8rem] font-semibold text-[#444] leading-none">
                Mais de{" "}
                <span className="text-[0.95rem] font-bold text-[#e1306c]">
                  {spyCount.toLocaleString("pt-BR")}
                </span>{" "}
                usuários espionando agora!
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          © 2026 InstaSpy. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
