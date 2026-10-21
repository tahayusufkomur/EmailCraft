import { CtaSection } from '../components/landing/CtaSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ShowcaseSection } from '../components/landing/ShowcaseSection';
import { StatsBar } from '../components/landing/StatsBar';

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <CtaSection />
    </div>
  );
}
