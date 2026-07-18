import Link from "next/link";
import { PRIVACY_CONFIG, PRIVACY_DETAILS_READY } from "@/config/privacy";
import { PRIVACY_EMAIL, createPageMetadata } from "@/lib/site";

const description = "How AAA Artists handles personal information submitted through booking enquiries and this website.";

export const metadata = createPageMetadata({
  title: "Privacy Notice",
  description,
  path: "/privacy",
  socialTitle: "Privacy Notice — AAA Artists",
  // Keep an incomplete legal notice out of search results while it remains
  // directly available from the form and footer.
  robots: PRIVACY_DETAILS_READY
    ? { index: true, follow: true }
    : { index: false, follow: true },
});

const sectionHeading = "mb-3 text-xl font-semibold";
const list = "mt-3 list-disc space-y-2 pl-5";

function Pending({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold" style={{ color: "var(--text)" }}>
      {children}
    </span>
  );
}

export default function PrivacyPage() {
  const { controller, retention } = PRIVACY_CONFIG;

  return (
    <div className="min-h-screen px-6 py-20" style={{ backgroundColor: "var(--bg)" }}>
      <article className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
          AAA Artists
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: "var(--text)" }}>
          Privacy notice
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-40)" }}>
          Last updated {new Date(`${PRIVACY_CONFIG.lastUpdated}T00:00:00Z`).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </p>

        {!PRIVACY_DETAILS_READY && (
          <aside
            className="mb-10 border px-5 py-4 text-sm leading-relaxed"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-60)" }}
          >
            <p className="font-semibold" style={{ color: "var(--text)" }}>Controller details are being confirmed</p>
            <p className="mt-2">
              The controller&apos;s legal identity, registered address, registration details, and retention periods are now confirmed. Its
              preferred privacy email, complete operational data flow, marketing use, and
              EU/EEA scope still require confirmation. Privacy requests can already be sent to the contact below.
            </p>
          </aside>
        )}

        <div className="space-y-10 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>Who is responsible for your information</h2>
            <p>
              The controller is {controller.legalName ?? <Pending>awaiting confirmation</Pending>}, trading as{" "}
              {controller.tradingName}. Its country of establishment is{" "}
              {controller.establishmentCountry ?? <Pending>awaiting confirmation</Pending>}. The official postal
              address{controller.postalAddress ? ` is ${controller.postalAddress}` : <> is <Pending>awaiting confirmation</Pending></>}.
            </p>
            {(controller.companyNumber || controller.icoRegistrationNumber) && (
              <ul className={list}>
                {controller.companyNumber && (
                  <li>
                    Companies House number:{" "}
                    <a
                      className="underline underline-offset-4"
                      href={`https://find-and-update.company-information.service.gov.uk/company/${controller.companyNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {controller.companyNumber}
                    </a>
                  </li>
                )}
                {controller.icoRegistrationNumber && (
                  <li>
                    Information Commissioner&apos;s Office registration:{" "}
                    <a
                      className="underline underline-offset-4"
                      href={`https://ico.org.uk/ESDWebPages/RegistrationCertificate/${controller.icoRegistrationNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {controller.icoRegistrationNumber}
                    </a>
                  </li>
                )}
                {controller.icoRegistrationExpires && (
                  <li>
                    ICO registration renewal due: {new Date(`${controller.icoRegistrationExpires}T00:00:00Z`).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </li>
                )}
              </ul>
            )}
            <p className="mt-3">
              For privacy questions or requests, email{" "}
              <a className="underline underline-offset-4" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>Information we collect</h2>
            <p>When you send a booking enquiry, we collect the information you choose to provide, which may include:</p>
            <ul className={list}>
              <li>your name, organisation, email address, telephone number, and WhatsApp contact;</li>
              <li>the requested artists, event date, location, schedule, audience, budget, and lineup;</li>
              <li>your message and subsequent booking correspondence; and</li>
              <li>limited technical and security information such as IP-derived request data, submission timing, and bot-check results.</li>
            </ul>
            <p className="mt-3">
              The required fields are identified on the form. Other information is optional. Please do not submit
              passwords, authentication codes, payment-card details, health information, or other sensitive information.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>Why we use it and our lawful bases</h2>
            <ul className={list}>
              <li>
                To assess your enquiry, contact you, prepare a quote, and take steps towards a booking contract. We
                rely on steps requested before entering a contract and, for business contacts who are not themselves
                the contracting party, our legitimate interest in responding to booking enquiries.
              </li>
              <li>
                To administer a confirmed booking, maintain business records, resolve disputes, and meet accounting
                or other legal duties. We rely on contract, legitimate interests, and legal obligations as applicable.
              </li>
              <li>
                To protect the form and website from spam, abuse, and security threats. We rely on our legitimate
                interest in operating a secure and reliable service.
              </li>
            </ul>
            <p className="mt-3">
              The form does not contain a marketing opt-in. Whether enquiry information is used for later marketing is{" "}
              {PRIVACY_CONFIG.decisions.marketingUse === null
                ? <Pending>awaiting controller confirmation</Pending>
                : PRIVACY_CONFIG.decisions.marketingUse
                  ? "described in the controller-approved marketing section of this notice"
                  : "not part of the current purpose"}.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>Who receives the information</h2>
            <p>Access is limited to people and providers who need it to handle the enquiry or protect the service:</p>
            <ul className={list}>
              <li>
                <a className="underline underline-offset-4" href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare</a>{" "}
                provides website delivery, security, rate limiting, and Turnstile bot protection;
              </li>
              <li>
                <a className="underline underline-offset-4" href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noopener noreferrer">Brevo</a>,
                an EU-based email provider, delivers the booking acknowledgement to you and a private copy to the booking mailbox;
              </li>
              <li>the relevant email provider stores and delivers booking correspondence; and</li>
              <li>relevant artists, authorised representatives, and professional advisers may receive the information when necessary to assess or administer a booking.</li>
            </ul>
            <p className="mt-3">
              Cloudflare and Brevo act as our processors: they handle booking-enquiry information only on our
              instructions and under their data-processing terms, and their own privacy policies cover the services
              they provide directly. We do not sell booking-enquiry information.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>International processing</h2>
            <p>
              Brevo processes booking emails within the EU. Cloudflare, other email providers, artists, or their
              representatives may process information outside
              the UK or EEA. Where data-protection law requires it, transfers must use a recognised adequacy decision,
              contractual safeguards, or another lawful transfer mechanism. Final recipient countries will be recorded
              after the controller confirms the complete operational data flow.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>How long we keep it</h2>
            <p>
              Unsuccessful enquiries are retained for{" "}
              {retention.unsuccessfulEnquiries ?? <Pending>a period awaiting confirmation</Pending>}. Records relating
              to successful bookings are retained for{" "}
              {retention.successfulBookings ?? <Pending>a period awaiting confirmation</Pending>} to administer the
              booking, handle disputes, and satisfy legal or accounting requirements. Security logs may be kept for a
              shorter period appropriate to investigating abuse.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>Cookies, local storage, and embedded media</h2>
            <p>
              The site stores your light or dark theme preference in your browser. Cloudflare Turnstile is loaded on the
              booking form as a security service.{" "}
              <a className="underline underline-offset-4" href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">Spotify</a>,{" "}
              <a className="underline underline-offset-4" href="https://soundcloud.com/pages/privacy" target="_blank" rel="noopener noreferrer">SoundCloud</a>, and{" "}
              <a className="underline underline-offset-4" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">YouTube</a>{" "}
              players are not loaded until you
              choose to load them; doing so connects your browser to that provider, which may process your IP address
              and use cookies under its own terms.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>Your rights</h2>
            <p>
              You can submit a data subject access request to obtain a copy of your personal information. Depending
              on the circumstances, you may also ask for correction,
              deletion, restriction, portability, or object to processing based on legitimate interests. You may also
              withdraw consent where consent is the basis used. These rights can have legal exceptions.
            </p>
            <p className="mt-3">
              Send a request to{" "}
              <a className="underline underline-offset-4" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>How to make a data-protection complaint</h2>
            <p>
              Email <a className="underline underline-offset-4" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>{" "}
              with the subject “Data protection complaint” and explain what happened and the outcome you are seeking.
              We will acknowledge your complaint within {PRIVACY_CONFIG.complaints.acknowledgementDays} days,
              investigate it without undue delay, and tell you the outcome and any action taken.
            </p>
            <p className="mt-3">
              You may also complain to the{" "}
              <a className="underline underline-offset-4" href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">
                UK Information Commissioner&apos;s Office
              </a>. If EU GDPR applies to your enquiry, you may complain to the supervisory authority where you live,
              work, or believe an infringement occurred.
            </p>
          </section>

          <section>
            <h2 className={sectionHeading} style={{ color: "var(--text)" }}>Automated decisions</h2>
            <p>We do not use booking-enquiry information to make solely automated decisions with legal or similarly significant effects.</p>
          </section>
        </div>

        <Link href="/contact" className="btn-outline mt-10 inline-flex px-6 py-3 text-sm font-semibold uppercase tracking-widest">
          Back to booking
        </Link>
      </article>
    </div>
  );
}
