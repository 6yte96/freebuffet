import { Hero } from "@/components/Hero";
import { Playground } from "@/components/Playground";
import { FeatureBento } from "@/components/FeatureBento";
import { Benchmarks } from "@/components/Benchmarks";
import { Architecture } from "@/components/Architecture";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      {/* The pitch: what it is, run it in one command */}
      <Hero />

      {/* The proof: a real session and the real files it writes */}
      <Playground />

      {/* The capabilities, searchable like the CLI itself */}
      <FeatureBento />

      {/* The hook for this audience: free tiers, no credit cards */}
      <Benchmarks />

      {/* The trust: where the code lives and how to improve it */}
      <Architecture />
    </>
  );
}
