import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Home as HomeIcon,
  Receipt,
  Landmark,
  ArrowRight,
  Quote,
  Compass,
  Target,
  Sparkles,
} from "lucide-react";
import PageLayout from "../components/PageLayout.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import NewsletterSignup from "../components/NewsletterSignup.jsx";
import ScrollReveal, { StaggerGroup, StaggerItem } from "../components/ScrollReveal.jsx";

const SERVICES = [
  {
    icon: TrendingUp,
    title: "Investing",
    copy: "Invest for the long term and harness the power of discipline and compound growth to build real wealth.",
  },
  {
    icon: HomeIcon,
    title: "First home buying",
    copy: "Simplify home buying with actionable strategies to navigate deposits, borrowing power, and achieve homeownership.",
  },
  {
    icon: Receipt,
    title: "Tax minimisation",
    copy: "Strategic tax planning to help you keep more of what you earn and accelerate your wealth building.",
  },
  {
    icon: Landmark,
    title: "Inheritance planning",
    copy: "How intergenerational wealth actually transfers in Australia, and how to plan for it on either side of the ledger.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I finished uni with zero idea how super worked. Six months of Chrome Capital later, I've actually started investing — and I understand why.",
    name: "Maddie T.",
    role: "Graduate Nurse, 24",
  },
  {
    quote:
      "The borrowing power calculator alone saved us months of guessing. We knew what we could actually afford before we spoke to a broker.",
    name: "Josh & Priya",
    role: "First Home Buyers, Brisbane",
  },
  {
    quote:
      "Nobody in my family talked about money growing up. This is the first place that explained inheritance planning without making me feel behind.",
    name: "Callum R.",
    role: "27, Software Engineer",
  },
];

function AscendingLineArt() {
  return (
    <svg
      viewBox="0 0 800 400"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroLine" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A94F" stopOpacity="0" />
          <stop offset="45%" stopColor="#D4A94F" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F0C868" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d="M0,340 C120,320 180,260 260,250 C340,240 360,180 440,160 C520,140 540,90 620,70 C680,55 720,40 800,10"
        fill="none"
        stroke="url(#heroLine)"
        strokeWidth="2"
      />
      <circle cx="800" cy="10" r="4" fill="#F0C868" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute -top-40 right-[-10%] w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,169,79,0.16) 0%, transparent 70%)" }}
      />
      <AscendingLineArt />
      <div className="relative max-w-8xl mx-auto px-5 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-2xl">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={14} style={{ color: "#D4A94F" }} />
              <span className="text-xs uppercase tracking-[0.25em] font-medium text-inkFaint">
                Financial Education for Young Australians
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.08] text-ink">
              Build wealth to enjoy
              <br />
              today and plan for tomorrow.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.16}>
            <p className="text-base md:text-lg text-inkMuted mt-6 max-w-xl leading-relaxed">
              Learn real strategies to invest with confidence, buy your first home, keep more of what you earn, and build a future on your own terms.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.24}>
            <div className="flex flex-wrap items-center gap-4 mt-9">
              <Link
                to="/invest"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
                style={{ background: "#D4A94F", color: "#161006" }}
              >
                Learn to invest <ArrowRight size={16} />
              </Link>
              <a
                href="#newsletter"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-colors"
                style={{ border: "1px solid #232C38", color: "#E9EDF2" }}
              >
                Subscribe for free
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
      <div className="hairline-gold" />
    </section>
  );
}

function Services() {
  return (
    <section className="max-w-8xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <SectionHeading
        eyebrow="What we teach"
        title="Master the money moves that actually matter."
        subtitle="We break down the strategies that build real wealth — no fluff, no gatekeeping, no complicated jargon. Just clear lessons you can use today."
      />
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SERVICES.map((s) => (
          <StaggerItem key={s.title}>
            <div
              className="h-full rounded-2xl p-6 transition-colors"
              style={{ background: "#111720", border: "1px solid #232C38" }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-5"
                style={{ background: "rgba(212,169,79,0.12)", border: "1px solid #8A6C2E" }}
              >
                <s.icon size={18} style={{ color: "#D4A94F" }} />
              </div>
              <h3 className="font-display text-lg text-ink mb-2">{s.title}</h3>
              <p className="text-sm text-inkMuted leading-relaxed">{s.copy}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function VisionMission() {
  return (
    <section style={{ background: "#0E141C", borderTop: "1px solid #1B222C", borderBottom: "1px solid #1B222C" }}>
      <div className="max-w-8xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-4">
              <Compass size={15} style={{ color: "#D4A94F" }} />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-inkFaint">Vision</span>
            </div>
            <p className="font-display text-2xl md:text-[1.75rem] leading-snug text-ink">
              Young Australians who take control of their money and build the life they actually want.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="flex items-center gap-2 mb-4">
              <Target size={15} style={{ color: "#D4A94F" }} />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-inkFaint">Mission</span>
            </div>
            <p className="text-base md:text-lg leading-relaxed text-inkMuted">
              To teach young Australians financial strategies they can actually use — today and for the next 50 years. We make investing, property, tax and wealth-building simple, actionable, and real.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="max-w-8xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <SectionHeading eyebrow="Real results" title="How Chrome Capital changed their money story." align="center" />
      <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t) => (
          <StaggerItem key={t.name}>
            <div
              className="h-full rounded-2xl p-6 flex flex-col"
              style={{ background: "#111720", border: "1px solid #232C38" }}
            >
              <Quote size={20} style={{ color: "#8A6C2E" }} className="mb-4" />
              <p className="text-sm text-ink leading-relaxed flex-1">"{t.quote}"</p>
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid #1B222C" }}>
                <div className="text-sm font-medium text-ink">{t.name}</div>
                <div className="text-xs text-inkFaint mt-0.5">{t.role}</div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <Services />
      <VisionMission />
      <Testimonials />
      <div className="max-w-8xl mx-auto px-5 md:px-8 pb-24">
        <NewsletterSignup />
      </div>
    </PageLayout>
  );
}
