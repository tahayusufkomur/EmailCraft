import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ShowcaseSection } from '../components/landing/ShowcaseSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { StatsBar } from '../components/landing/StatsBar';
import { CtaSection } from '../components/landing/CtaSection';

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <StatsBar />
      <CtaSection />
    </div>
  );
}
