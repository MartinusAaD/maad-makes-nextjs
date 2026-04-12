import Link from "next/link";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExternalLinkAlt,
  faEnvelope,
  faBell,
  faInfoCircle,
  faArrowRight,
  faPrint,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

export default function CharacterDesignsPage() {
  return (
    <div className="w-full min-h-screen bg-bg-light">
      {/* Hero */}
      <div className="bg-linear-to-br from-primary-darker via-primary to-primary-lighter relative overflow-hidden -mt-20 pt-20">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <ResponsiveWidthWrapper>
          <div className="py-16 md:py-20 relative z-10">
            <span className="inline-block bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
              N3D Melbourne
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              100+ Character Ball Designs
            </h1>
            <p className="text-lg text-white/75 max-w-xl">
              Can&apos;t find your favourite character in our store? Browse the
              full catalog or join the waitlist — we&apos;ll print it for you.
            </p>
          </div>
        </ResponsiveWidthWrapper>
      </div>

      <ResponsiveWidthWrapper>
        <div className="max-w-4xl mx-auto py-12 flex flex-col gap-8">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-4 relative">
              <div className="hidden md:block absolute top-8 left-[calc(16.66%+8px)] right-[calc(16.66%+8px)] h-px bg-primary/20" />
              {[
                {
                  icon: faSearch,
                  step: "1",
                  title: "Browse the Catalog",
                  desc: "Explore 100+ unique character ball designs on the N3D Melbourne website",
                },
                {
                  icon: faEnvelope,
                  step: "2",
                  title: "Request or Join Waitlist",
                  desc: "Found your character? Request a print. Don't see it? Join the waitlist",
                },
                {
                  icon: faPrint,
                  step: "3",
                  title: "Get Your Ball",
                  desc: "We will contact you when the design is available!",
                },
              ].map(({ icon, step, title, desc }) => (
                <div
                  key={step}
                  className="relative bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-md relative z-10">
                    <FontAwesomeIcon
                      icon={icon}
                      className="text-white text-xl"
                    />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green text-white text-xs font-bold flex items-center justify-center leading-none">
                      {step}
                    </span>
                  </div>
                  <h3 className="font-bold text-dark text-base">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
            <div className="bg-linear-to-r from-primary to-primary-lighter px-8 py-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                  className="text-white text-xl"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Browse 100+ Character Designs
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  Explore the full N3D Melbourne catalog
                </p>
              </div>
            </div>
            <div className="bg-white p-8 flex flex-col gap-5">
              <p className="text-gray-700 leading-relaxed">
                All character ball designs in our store are created by{" "}
                <strong className="text-primary">N3D Melbourne</strong> — a
                talented designer with over{" "}
                <strong>100+ unique character ball designs</strong>. What we
                have listed are only the ones we&apos;ve personally printed and
                photographed, but you can request <em>any</em> design from their
                catalog.
              </p>
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="text-blue-500 mt-0.5 shrink-0"
                />
                <p className="text-sm text-gray-700">
                  <strong>Heads up:</strong> Viewing the N3D Melbourne catalog
                  requires creating a free account on their website.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="https://www.n3dmelbourne.com/dashboard/designs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold rounded-xl px-6 py-3 hover:bg-primary-lighter transition-colors"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  View N3D Melbourne Catalog
                </a>
                <Link
                  href="/contact"
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold rounded-xl px-6 py-3 hover:bg-primary hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                  Request a Custom Print
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
            <div className="bg-linear-to-r from-green-darker to-green px-8 py-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faBell} className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Join the Waitlist
                </h2>
                <p className="text-white/70 text-sm mt-0.5">
                  Get notified when your favourite character is available
                </p>
              </div>
            </div>
            <div className="bg-white p-8 flex flex-col gap-5">
              <p className="text-gray-700 leading-relaxed">
                Can&apos;t find your favourite character&apos;s design anywhere?
                No problem — you can request to be added to our personal
                waitlist.
              </p>
              <div className="flex items-start gap-3 bg-green-50 border border-green/30 rounded-xl p-4">
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="text-green-darker mt-0.5 shrink-0"
                />
                <p className="text-sm text-gray-700">
                  <strong>Please note:</strong> There are no guarantees if or
                  when specific character designs will be created.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 bg-green text-white font-bold rounded-xl px-6 py-3 hover:bg-green-lighter transition-colors"
                >
                  <FontAwesomeIcon icon={faBell} />
                  Join Waitlist
                </Link>
                <p className="text-xs text-gray-400 text-center">
                  Use the &quot;Waitlist&quot; subject when contacting us
                </p>
              </div>
            </div>
          </section>

          <div className="text-center pt-2">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
            >
              <FontAwesomeIcon icon={faArrowRight} className="rotate-180" />
              Back to Store
            </Link>
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}
