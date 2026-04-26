import { Navbar } from "../components/public/Navbar";
import { HeroSection } from "../components/public/HeroSection";
import { StepsSection } from "../components/public/StepsSection";
import { FeaturesSection } from "../components/public/FeaturesSection";
import { StatsSection } from "../components/public/StatsSection";
import { StatusGuideSection, FaqSection } from "../components/public/InfoSections";
import { FooterSection } from "../components/public/FooterSection";

export function HomePage() {
  return (
    <div className="bg-white min-h-screen public-modern">
      <Navbar />
      <HeroSection />
      <StepsSection />
      <FeaturesSection />
      <StatsSection />
      <StatusGuideSection />
      <FaqSection />
      <FooterSection />
    </div>
  );
}
