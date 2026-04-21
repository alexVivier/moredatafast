import { Compare } from "./compare";
import { Faq } from "./faq";
import { FinalCta } from "./final-cta";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { Nav } from "./nav";
import { Pricing } from "./pricing";
import { ValueProps } from "./value-props";
import { WidgetShowcase } from "./widget-showcase";

export function Landing() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ValueProps />
        <WidgetShowcase />
        <Compare />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
