export default function PrivacyPage() {
  const sections = [
    ['What we store', 'Account basics (name, email, profile photo from Google), your sanctuary content (mood pulses, journal entries, Wall of Hope reasons), health information you choose to save (health card, medical vault, emergency card), safety content (evidence vault, safety plan, rebuilding plan), Déjà content (dreams, moments), and operational records (sessions, subscriptions, trusted contacts, guardians).'],
    ['Why', 'Only to provide the features you use: keeping your sanctuary, matching dreams in Déjà, translating messages, emailing guardians you invite, and processing your subscription.'],
    ['Who can access it', 'You. Supporters see only what you share through your Anchor Link. Guardians see only mood "weather" — never words. Our team does not read user content as a matter of policy and design.'],
    ['What is optional', 'Everything beyond your account email. Every field in the Health Card, Emergency Card, Safety Plan, Trip Pack, and Déjà is optional.'],
    ['What you control', 'Delete individual items (journal entries, dreams, evidence, vault items, contacts) at any time. Export your Déjà data as JSON. Delete all Déjà data in one step.'],
    ['Third-party services', 'Stripe processes payments (we never see card numbers). Anthropic (Claude) processes AI requests — comfort chat, navigator, translation, and Déjà extraction; those requests include only the text you submit. OpenAI Whisper transcribes voice notes you record. Google verifies sign-in. Resend delivers guardian and contact emails. Google Analytics counts page visits (no health content).'],
    ['Deletion', 'Deleting an item removes it from the active database immediately. Delete-all for Déjà wipes dreams and moments together. To delete your whole account, contact us and we remove everything.'],
    ['What we do NOT claim', 'We do not claim zero-knowledge, end-to-end encryption, or HIPAA compliance today. Data is encrypted in transit (HTTPS) and at rest by our infrastructure. Client-side encryption — where not even we could read your records — is on our near-term roadmap, and this page will say so the day it ships.'],
  ];
  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-10 py-16" data-testid="privacy-page">
      <p className="text-xs uppercase tracking-[0.3em] text-willow-light">Privacy Center</p>
      <h1 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Plain words about your data.</h1>
      <p className="mt-4 text-[#535E56] leading-relaxed">
        Pocket Anchor is a privacy-first platform. Here is exactly what that means today — no legal fog, no overclaiming.
      </p>
      <div className="mt-10 space-y-6">
        {sections.map(([t, body]) => (
          <section key={t} className="card-organic p-6" data-testid={`privacy-${t.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
            <h2 className="font-serif text-2xl text-willow-dark">{t}</h2>
            <p className="mt-2 text-sm text-[#535E56] leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-xs text-willow-light text-center">
        Questions about your data? Email the team from the account address you signed up with.
      </p>
    </div>
  );
}
