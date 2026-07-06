import { HeatHero } from "./components/HeatHero";
import { SelectedWork } from "./components/SelectedWork";
import { Philosophy } from "./components/Philosophy";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Contact } from "./components/Contact";
import { CustomCursor } from "./components/CustomCursor";

export default function App() {
  return (
    <main>
      <CustomCursor />
      <HeatHero />
      <SelectedWork />
      <Philosophy />
      <About />
      <Experience />
      <Contact />
    </main>
  );
}
