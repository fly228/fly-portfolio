import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { WorkDetail } from "./pages/WorkDetail";
import { CustomCursor } from "./components/CustomCursor";

/**
 * Minimal hash router: "#/" is home, "#/work/<slug>" is a case page.
 * Hash routing keeps the site deployable anywhere (GitHub Pages, Vercel,
 * plain file server) without rewrite rules.
 */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const workMatch = hash.match(/^#\/work\/([\w-]+)/);

  return (
    <main>
      <CustomCursor />
      {workMatch ? <WorkDetail slug={workMatch[1]} /> : <Home />}
    </main>
  );
}
