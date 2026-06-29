import { SignUp } from '@clerk/nextjs';
import { AuthLayout } from '../../_components/AuthLayout';
import { clerkAppearance } from '../../_clerk-appearance';

const FEATURES = [
  "AI breaks down tasks so you don't have to",
  'Real-time collaboration, no page refreshes',
  'Approvals and handoffs built into the flow',
];

function SignUpCard() {
  return (
    <section
      className="mt-2 rounded-lg border border-chalk shadow-md shadow-chalk/50 p-5 bg-paper flex flex-col gap-4"
      aria-labelledby="features-heading"
    >
      <h3
        id="features-heading"
        className="text-[10px] tracking-[0.12em] uppercase font-mono flex items-center gap-1.5 text-ember"
      >
        <span aria-hidden="true">✳</span> What you get
      </h3>
      <ul className="flex flex-col gap-3">
        {FEATURES.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-soot">
            <span
              aria-hidden="true"
              className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-slate text-white text-[10px] flex items-center justify-center"
            >
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SignUpPage() {
  return (
    <AuthLayout
      eyebrow="Get started"
      heading={
        <>
          A board that <span className="squiggle">thinks</span>{' '}
          <span className="italic text-ash">before you do</span>.
        </>
      }
      description={
        <>
          Join teams who use ClarityBoard to stay focused,<br />
          ship faster, and never lose track of what matters.
        </>
      }
      card={<SignUpCard />}
      activeTab="sign-up"
      formHeading="Get started."
      formSubtitle="Free for 7 days. No card required."
    >
      <SignUp routing="path" path="/sign-up" appearance={clerkAppearance} />
    </AuthLayout>
  );
}
