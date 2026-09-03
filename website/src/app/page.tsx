import { Hero } from "@/components/Hero";
import { FeatureBento } from "@/components/FeatureBento";
import { Playground } from "@/components/Playground";
import { Benchmarks } from "@/components/Benchmarks";
import { Architecture } from "@/components/Architecture";
import { Changelog } from "@/components/Changelog";
import { Community } from "@/components/Community";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeatureBento />
      <Playground />
      <Benchmarks />
      <Architecture />
      <Changelog />
      <Community />
    </>
  );
}
