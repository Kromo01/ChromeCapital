import React from "react";
import {
  Home as HomeIcon,
  PiggyBank,
  FileCheck2,
  Clock,
  ArrowRight,
  GraduationCap,
  Lock,
  ShieldCheck,
  Users,
  MapPin,
  Building2,
  Receipt,
  BookOpen,
} from "lucide-react";
import PageLayout from "../components/PageLayout.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import NewsletterSignup from "../components/NewsletterSignup.jsx";
import ScrollReveal, { StaggerGroup, StaggerItem } from "../components/ScrollReveal.jsx";
import BorrowingPowerCalculator from "../calculators/BorrowingPowerCalculator.jsx";

const OTHER_SCHEMES = [
  {
    icon: ShieldCheck,
    title: "First Home Guarantee",
    copy: "Buy with as little as a 5% deposit with no Lenders Mortgage Insurance, backed by the government. Places are limited and allocated each financial year.",
  },
  {
    icon: Users,
    title: "Family Home Guarantee",
    copy: "Aimed at eligible single parents and legal guardians — allows a purchase with as little as a 2% deposit, without LMI.",
  },
  {
    icon: MapPin,
    title: "Regional First Home Buyer Guarantee",
    copy: "A version of the guarantee scheme specifically for eligible first home buyers purchasing in regional areas.",
  },
  {
    icon: Building2,
    title: "First Home Owner Grant",
    copy: "A one-off grant for eligible buyers building or purchasing a new home — the amount and rules are set by your state or territory, not the federal government.",
  },
];

const BUYING_TIMELINE = [
  {
    title: "Get your finances in order",
    copy: "Build your deposit, tidy up spending, and understand your credit position before you start looking.",
  },
  {
    title: "Get pre-approval",
    copy: "A lender assesses what you could borrow, giving you a realistic price range to search within.",
  },
  {
    title: "House hunting",
    copy: "Research suburbs, attend inspections, and compare properties against your budget and must-haves.",
  },
  {
    title: "Make an offer or bid",
    copy: "Buy via private sale (offer and negotiation) or auction (unconditional bidding) — the process differs between the two.",
  },
  {
    title: "Due diligence & conveyancing",
    copy: "Contract review, building and pest inspections, and the cooling-off period (where one applies) happen here.",
  },
  {
    title: "Settlement",
    copy: "Final checks are completed, funds are transferred, and you get the keys.",
  },
];

const HIDDEN_COSTS = [
  { icon: Receipt, title: "Lenders Mortgage Insurance", copy: "Generally applies if you're borrowing more than 80% of the property's value." },
  { icon: FileCheck2, title: "Conveyancing & legal fees", copy: "Covers the legal work of transferring ownership into your name." },
  { icon: HomeIcon, title: "Building & pest inspection", copy: "A pre-purchase check for structural issues or pest damage." },
  { icon: Building2, title: "Stamp duty", copy: "Varies by state — first home buyers often qualify for a concession or exemption." },
  { icon: PiggyBank, title: "Moving costs", copy: "Removalists, connections, and the small setup costs of a new place." },
  { icon: Clock, title: "Rate adjustments at settlement", copy: "Council and water rates are typically adjusted between buyer and seller at settlement." },
];

const GLOSSARY = [
  { term: "LVR (Loan-to-Value Ratio)", def: "The size of your loan as a percentage of the property's value — a lower LVR generally means a smaller deposit hurdle and fewer extra costs." },
  { term: "LMI (Lenders Mortgage Insurance)", def: "Insurance that protects the lender (not you) when your deposit is below a certain threshold, usually 20%." },
  { term: "Cooling-off period", def: "A short window after signing a private-sale contract where a buyer can withdraw, subject to state rules and conditions." },
  { term: "Conditional vs unconditional approval", def: "Conditional approval is an early, indicative estimate; unconditional approval means the lender has fully verified your position and formally approved the loan." },
  { term: "Conveyancing", def: "The legal process of transferring property ownership from seller to buyer." },
];

const FHSSS_STEPS = [
  {
    icon: PiggyBank,
    title: "Save inside super",
    copy: "Make voluntary concessional (salary sacrifice) or non-concessional contributions into your super fund — up to $15,000 per financial year, and $50,000 in total, count toward the scheme.",
  },
  {
    icon: Clock,
    title: "Let it sit and grow",
    copy: "Eligible contributions and their associated earnings are taxed concessionally inside super, generally more favourably than at your marginal income tax rate.",
  },
  {
    icon: FileCheck2,
    title: "Request a release",
    copy: "Apply to the ATO to release your FHSS contributions and earnings before signing a contract to buy or build your first home.",
  },
  {
    icon: HomeIcon,
    title: "Put it toward your deposit",
    copy: "Once released, use the funds toward your deposit. You generally need to sign a purchase contract within 12 months of the release (extensions may be available).",
  },
];

function FHSSSection() {
  return (
    <section className="max-w-8xl mx-auto px-5 md:px-8 py-20 md:py-24">
      <SectionHeading
        eyebrow="Educational guide"
        title="The First Home Super Saver Scheme, explained."
        subtitle="A government scheme that lets eligible first home buyers save part of their deposit inside superannuation, where it can benefit from super's lower tax treatment. Here's the general shape of how it works."
      />

      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {FHSSS_STEPS.map((s, i) => (
          <StaggerItem key={s.title}>
            <div className="h-full rounded-2xl p-6 flex gap-4" style={{ background: "#111720", border: "1px solid #232C38" }}>
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                style={{ background: "rgba(212,169,79,0.12)", border: "1px solid #8A6C2E" }}
              >
                <s.icon size={16} style={{ color: "#D4A94F" }} />
              </div>
              <div>
                <div className="text-xs font-mono-fin mb-1" style={{ color: "#576174" }}>
                  Step {i + 1}
                </div>
                <h3 className="font-display text-lg text-ink mb-1.5">{s.title}</h3>
                <p className="text-sm text-inkMuted leading-relaxed">{s.copy}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <ScrollReveal>
        <div className="rounded-2xl p-6" style={{ background: "#0E141C", border: "1px solid #1B222C" }}>
          <h3 className="font-display text-lg text-ink mb-3">Who's generally eligible</h3>
          <ul className="text-sm text-inkMuted leading-relaxed space-y-2 list-disc pl-5">
            <li>You've never owned property in Australia before (some hardship exceptions apply).</li>
            <li>You're 18 or older at the time you request a release (some exceptions for younger applicants).</li>
            <li>You intend to live in the property you buy, for at least six months within the first year of ownership.</li>
            <li>Couples can each use the scheme individually — potentially combining two sets of contributions toward one deposit.</li>
          </ul>
          <p className="text-xs mt-5" style={{ color: "#576174" }}>
            This is general information only, current as a broad guide to how the scheme works — contribution
            caps, thresholds and rules are set by the ATO and can change. Confirm current figures on the ATO
            website and consider your own circumstances (or speak with a licensed professional) before making
            contributions.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}

function OtherSchemesSection() {
  return (
    <section className="max-w-8xl mx-auto px-5 md:px-8 pb-20 md:pb-24">
      <SectionHeading
        eyebrow="Beyond the FHSSS"
        title="It's not the only scheme on offer."
        subtitle="A handful of other government programs can stack with — or replace — the FHSSS depending on your situation. Here's what exists, in brief."
      />
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {OTHER_SCHEMES.map((s) => (
          <StaggerItem key={s.title}>
            <div className="h-full rounded-2xl p-6 flex gap-4" style={{ background: "#111720", border: "1px solid #232C38" }}>
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                style={{ background: "rgba(212,169,79,0.12)", border: "1px solid #8A6C2E" }}
              >
                <s.icon size={16} style={{ color: "#D4A94F" }} />
              </div>
              <div>
                <h3 className="font-display text-lg text-ink mb-1.5">{s.title}</h3>
                <p className="text-sm text-inkMuted leading-relaxed">{s.copy}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
      <p className="text-xs mt-6" style={{ color: "#576174" }}>
        Places, caps and eligibility rules are limited and change over time — this is general information
        only, not an indication you'll qualify for any particular scheme.
      </p>
    </section>
  );
}

function BuyingTimelineSection() {
  return (
    <section style={{ background: "#0E141C", borderTop: "1px solid #1B222C", borderBottom: "1px solid #1B222C" }}>
      <div className="max-w-8xl mx-auto px-5 md:px-8 py-20 md:py-24">
        <SectionHeading
          eyebrow="The general shape"
          title="The path from renter to homeowner."
          subtitle="The exact order can shift depending on whether you buy via private sale or auction, but this is the general flow."
        />
        <StaggerGroup className="flex flex-col gap-4 max-w-3xl">
          {BUYING_TIMELINE.map((step, i) => (
            <StaggerItem key={step.title}>
              <div className="flex gap-4 items-start">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-mono-fin text-xs"
                  style={{ background: "rgba(212,169,79,0.12)", border: "1px solid #8A6C2E", color: "#D4A94F" }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-display text-base text-ink mb-1">{step.title}</h3>
                  <p className="text-sm text-inkMuted leading-relaxed">{step.copy}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function HiddenCostsSection() {
  return (
    <section className="max-w-8xl mx-auto px-5 md:px-8 py-20 md:py-24">
      <SectionHeading
        eyebrow="Budget for the whole picture"
        title="Costs beyond your deposit."
        subtitle="Your deposit is rarely the only cost — a realistic budget accounts for these too."
      />
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {HIDDEN_COSTS.map((c) => (
          <StaggerItem key={c.title}>
            <div className="h-full rounded-2xl p-5 flex gap-3" style={{ background: "#111720", border: "1px solid #232C38" }}>
              <c.icon size={16} style={{ color: "#D4A94F" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-ink mb-1">{c.title}</h3>
                <p className="text-xs text-inkMuted leading-relaxed">{c.copy}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function GlossarySection() {
  return (
    <section className="max-w-8xl mx-auto px-5 md:px-8 pb-20 md:pb-24">
      <SectionHeading eyebrow="Quick reference" title="Terms you'll hear a lot." subtitle="No jargon left unexplained." />
      <ScrollReveal>
        <div className="rounded-2xl p-6 md:p-8" style={{ background: "#111720", border: "1px solid #232C38" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="flex gap-3">
                <BookOpen size={15} style={{ color: "#D4A94F" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-ink mb-1">{g.term}</div>
                  <p className="text-xs text-inkMuted leading-relaxed">{g.def}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function CoursesTeaser() {
  return (
    <section className="max-w-8xl mx-auto px-5 md:px-8 pb-6">
      <div
        className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between"
        style={{ background: "#111720", border: "1px dashed #232C38" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{ background: "rgba(212,169,79,0.12)", border: "1px solid #8A6C2E" }}
          >
            <GraduationCap size={20} style={{ color: "#D4A94F" }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-display text-xl text-ink">Courses & paid content</h3>
              <span
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-medium rounded-full px-2 py-0.5"
                style={{ background: "rgba(212,169,79,0.14)", color: "#D4A94F" }}
              >
                <Lock size={10} /> Coming soon
              </span>
            </div>
            <p className="text-sm text-inkMuted max-w-lg leading-relaxed">
              The full first-home-buyer course covers the part this page can't: a scheme-by-scheme decision
              guide for exactly which of these applies to you, step-by-step application walkthroughs, real
              cost estimates, and a working deposit-saving template. Subscribers get early access and founder
              pricing.
            </p>
          </div>
        </div>
        <a
          href="#newsletter"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium flex-shrink-0 transition-transform hover:scale-[1.03]"
          style={{ border: "1px solid #D4A94F", color: "#D4A94F" }}
        >
          Get early access <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}

export default function FirstHomeBuyers() {
  return (
    <PageLayout>
      <section className="max-w-8xl mx-auto px-5 md:px-8 pt-16 pb-10 md:pt-20">
        <ScrollReveal>
          <div className="flex items-center gap-2 mb-4">
            <HomeIcon size={14} style={{ color: "#D4A94F" }} />
            <span className="text-xs uppercase tracking-[0.25em] font-medium text-inkFaint">First Home Buyers</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.1] text-ink max-w-2xl">
            From renter to homeowner, without the guesswork.
          </h1>
          <p className="text-base md:text-lg text-inkMuted mt-5 max-w-xl leading-relaxed">
            Understand the First Home Super Saver Scheme, get a real estimate of what you can borrow, and
            know exactly where you stand before you talk to a bank.
          </p>
        </ScrollReveal>
      </section>

      <FHSSSection />
      <OtherSchemesSection />
      <BuyingTimelineSection />
      <HiddenCostsSection />
      <GlossarySection />

      <section className="max-w-8xl mx-auto px-5 md:px-8 pb-20 md:pb-24">
        <SectionHeading
          eyebrow="Interactive tool"
          title="What could you borrow?"
          subtitle="Plug in your numbers for a general estimate of your borrowing power and an indicative purchase price."
        />
        <BorrowingPowerCalculator />
      </section>

      <div className="max-w-8xl mx-auto px-5 md:px-8">
        <CoursesTeaser />
      </div>

      <div className="max-w-8xl mx-auto px-5 md:px-8 py-20 md:py-24">
        <NewsletterSignup
          eyebrow="Stay in the loop"
          title="First-home-buyer tips, before you need them."
          subtitle="Get practical, Australia-specific guidance on deposits, the FHSSS, and buying your first place — straight to your inbox."
        />
      </div>
    </PageLayout>
  );
}
