import Link from "next/link";
import { Button } from "../ui/Button";
import { SectionHero } from "../components/SectionHero";

// TODO : user context signin or not determines what is displayed
export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      <main className="page-section flex flex-col gap-8 items-center sm:items-start">
        <p className="font-display font-normal text-[clamp(36px,_19px_+_5.5vw,_84px)] text-center sm:text-left leading-[1.10] tracking-[-0.025em]">A board that <span className="squiggle">thinks</span><span className="block text-ash">before you do</span></p>
        <p className="text-center sm:text-left text-base leading-relaxed text-ash max-w-xl">ClarityBoard is a task tracker with a quiet AI co-pilot. It breaks work down, suggests what&apos;s next, and never writes without asking.</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/demo/dashboard"><Button variant="outline">Try the demo</Button></Link>
          <Button variant="outline">Watch the 2 min tour</Button>
        </div>
      </main>

      <section className="page-section">
        <SectionHero
          eyebrow="The Three Rules of Clarity"
          subtitle={null}
        >
          AI in your tracker should feel like{' '}
          <em className="text-ash">a thoughtful colleague,</em>{' '}
          not autopilot.
        </SectionHero>
        <ol className="grid grid-cols-1 md:grid-cols-3 list-none mt-12 font-mono text-sm text-left gap-8">
          <li className="tracking-[-.01em]">
            <span className="block text-[13px] text-[#c04414] leading-[18px]">01</span>
            <div className="text-[20px] sm:text-[26px] text-ink font-medium">It suggests, you decide.</div>
            <p className="text-ash">Clarity proposes a breakdown, an owner, or a follow-up. Nothing happens without you.</p>
          </li>
          <li className="tracking-[-.01em]">
            <span className="block text-[#c04414] leading-[18px]">02</span>
            <div className="text-[20px] sm:text-[26px] text-ink font-medium">It writes in the margins.</div>
            <p className="text-ash">AI lives in a sidebar of the page, not the page itself. Your work stays your voice.</p>
          </li>
          <li className="tracking-[-.01em]">
            <span className="block text-[#c04414] leading-[18px]">03</span>
            <div className="text-[20px] sm:text-[26px] text-ink font-medium">It learns the team.</div>
            <p className="text-ash">After a sprint, Clarity knows who picks what up, what gets out of scope, and what tends to slip.</p>
          </li>
        </ol>
      </section>

      <section className="page-section flex flex-col items-center text-center">
        <p className="font-display font-normal text-[clamp(36px,_19px_+_5.5vw,_84px)] leading-[1.10] tracking-[-0.025em]">Try it on your backlog</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link href="/demo/dashboard"><Button variant="solid" className="text-chalk">View demo</Button></Link>
          <Button>Talk to us</Button>
        </div>
      </section>
    </div>
  );
}
