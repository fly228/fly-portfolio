import { HeatHero } from "../components/HeatHero";
import { SelectedWork } from "../components/SelectedWork";
import { Philosophy } from "../components/Philosophy";
import { About } from "../components/About";
import { Experience } from "../components/Experience";
import { Contact } from "../components/Contact";

export function Home() {
  return (
    <>
      <HeatHero />
      <SelectedWork />
      <Philosophy />
      <About />
      <Experience />
      <Contact />
    </>
  );
}
