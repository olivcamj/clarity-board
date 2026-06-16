import { Button } from "../ui/Button";
import { SectionHero } from "../components/SectionHero";

// TODO : user context signin or not determines what is displayed
export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <p>A board that thinks <span>before you do</span></p>
        <p>ClarityBoard is a task tracker with a quiet AI co-pilot. It breaks work down, suggests what&apos;s next, and never writes without asking.</p>
        <div className="flex gap-4 justify-between m-auto">
        <Button variant="outline">Try free for 7 days</Button>
        <Button variant="outline">Watch the 2 min tour</Button>
        </div>
        {/* <img /> */}
        </main>
      <section className="m-[50px] px-[24px]">
        <SectionHero
          eyebrow="The Three Rules of Clarity"
          subtitle={null}
        >
          AI in your tracker should feel like{' '}
          <em className="text-ash">a thoughtful colleague,</em>{' '}
          not autopilot.
        </SectionHero>
        <ol className="grid grid-cols-3 list-none p-4 m-4 mt-[30px] font-mono text-sm sm:text-left sm:grid-cols-1 gap-6">
          <li className="tracking-[-.01em]">
            <span className="block text-[13px] text-[#c04414] leading-[18px]">01</span>
            <div className="text-[26px] text-ink font-medium">It suggests, you decide.</div>
            <p className="text-ash">
              Clarity proposes a breakdown, an owner, or a follow-up. Nothing happens without you.
            </p>
          </li>
          <li className="tracking-[-.01em]">
            <span className="block text-[#c04414] leading-[18px]">02</span>
            <div className="text-[26px] text-ink font-medium">It writes in the margins.</div>
            <p className="text-ash">AI lives in a sidebar of the page, not the page itself. Your work stays your voice.</p>
          </li>
          <li className="tracking-[-.01em]">
            <span className="block text-[#c04414] leading-[18px]">03</span>
            <div className="text-[26px] text-ink font-medium">It learns the team.</div>
            <p className="text-ash">After a sprint, Clarity knows who picks what up, what gets out of scope, and what tends to slip.</p>
          </li>
        </ol>
      </section>
    </div>
  );
}
