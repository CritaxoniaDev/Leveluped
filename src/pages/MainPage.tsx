import HeroSection from "@/components/hero-section"
import ProblemStatement from "@/components/problem-statement"
import KeyFeatures from "@/components/key-features"
import HowItWorks from "@/components/how-it-works"
import Benefits from "@/components/benefits"
import Testimonials from "@/components/testimonials"
import Footer from "@/components/footer"

interface MainPageProps {
  onSignIn: () => void
}

export default function MainPage({ onSignIn }: MainPageProps) {

  return (
    <div className="min-h-screen">
      <HeroSection onSignIn={onSignIn} />
      <ProblemStatement />
      <KeyFeatures />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Footer />
    </div>
  )
}