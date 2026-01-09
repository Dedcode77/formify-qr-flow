import { Header } from '@/components/layout/Header';
import { 
  Hero, 
  Features, 
  HowItWorks, 
  UseCases, 
  Pricing, 
  CTA, 
  Footer 
} from '@/components/landing/LandingSections';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
