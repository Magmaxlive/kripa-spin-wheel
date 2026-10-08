import CTASection from "@/components/CTASection";
import SpinnerSection from "@/components/SpinnerSection";
import StepSection from "@/components/StepSection";
import TermsSection from "@/components/TermsSection";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <SpinnerSection/>
      <StepSection/>
      <TermsSection/>
      <CTASection/>
    </>
  );
}
