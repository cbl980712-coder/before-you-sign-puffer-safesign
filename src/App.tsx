import Navbar from '@/sections/Navbar';
import HeroSection from '@/sections/HeroSection';
import PhoneDemoSection from '@/sections/PhoneDemoSection';
import ReceiptSection from '@/sections/ReceiptSection';
import TokenCoreSection from '@/sections/TokenCoreSection';
import BroadcastGateSection from '@/sections/BroadcastGateSection';
import EvidenceSection from '@/sections/EvidenceSection';
import FooterSection from '@/sections/FooterSection';

export default function App() {
  return (
    <div className="min-h-screen bg-it-bg text-it-text">
      <Navbar />
      <main>
        <HeroSection />
        <PhoneDemoSection />
        <ReceiptSection />
        <TokenCoreSection />
        <BroadcastGateSection />
        <EvidenceSection />
      </main>
      <FooterSection />
    </div>
  );
}
