import { useCallback, useState } from "react";
import Preloader from "./preloader/Preloader";
import SiteHeader from "./components/SiteHeader";
import InvitationSection from "./components/InvitationSection";

// Review-only control (REMOVE BEFORE LAUNCH):
//   ?pp=0..1 freezes the preloader at that progress (e.g. ?pp=0.5) and
//   suppresses completion, for checking hand positions + sparkles.
export default function App() {
  const [done, setDone] = useState(false);
  const handleComplete = useCallback(() => setDone(true), []);

  if (!done) {
    return <Preloader onComplete={handleComplete} />;
  }

  return (
    <>
      <SiteHeader />
      <main id="site-root">
        <InvitationSection />
      </main>
    </>
  );
}
