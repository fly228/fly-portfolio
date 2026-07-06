import { HeatHero } from "./components/HeatHero";
import { SelectedWork } from "./components/SelectedWork";
import { About } from "./components/About";
import { Experience } from "./components/Experience";
import { Contact } from "./components/Contact";

export default function App() {
  return (
    <main>
      <HeatHero />
      <SelectedWork />
      <About />
      <Experience />
      <Contact />
    </main>
  );
}
