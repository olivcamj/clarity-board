import { SignIn } from '@clerk/nextjs';
import { Icon } from '../../../ui/Icon';
import { Avatar } from '../../../ui/Avatar';
import { AuthLayout } from '../../_components/AuthLayout';
import { clerkAppearance } from '../../_clerk-appearance';

function SignInCard() {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <article className="rounded-lg border border-chalk shadow-md shadow-chalk/50 p-5 bg-paper">
          <p className="text-[10px] tracking-[0.12em] uppercase font-mono mb-3 flex items-center gap-1.5 text-ember">
            <span aria-hidden="true">✳</span> From the changelog
          </p>
          <p className="font-display text-base italic leading-relaxed text-soot mb-4">
            &ldquo;v2.4· The roadmap got a redesign. It’s far easier now to see what’s on track, what’s running late, and what’s due this week all at a glance.&rdquo;
          </p>
          <footer className="flex items-center gap-2.5">
            <Avatar name="Jin Soo" size={28} />
            <span className="text-xs text-smoke">Jin Soo · Shipped May 14</span>
          </footer>
        </article>
        <svg
          className="text-chalk absolute -top-6 right-[50px] pointer-events-none"
          width="80" height="48" viewBox="0 0 100 60"
          fill="none" aria-hidden="true"
        >
          <path d="M6 48 C 30 30, 50 20, 86 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M86 14 L 74 10 M86 14 L 80 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <ul className="flex items-center gap-4 text-[11px] text-smoke list-none m-0 p-0">
        <li className="flex items-center gap-1.5">
          <Icon name="shield" size={11} />
          SOC2 Type II
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full inline-block bg-sage" />
          All systems normal
        </li>
        <li>v2.4.1</li>
      </ul>
    </div>
  );
}

export default function SignInPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      heading={<>Pick up<span className="italic text-ash"> right where you </span>left it.</>}
      description={<>Your team made 23 moves while you were away.<br />Three are flagged for your attention.</>}
      card={<SignInCard />}
      activeTab="sign-in"
      formHeading="Sign in."
      formSubtitle="Welcome back. Take it slow."
    >
      <SignIn routing="path" path="/sign-in" appearance={clerkAppearance} />
    </AuthLayout>
  );
}
