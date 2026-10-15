import { useCallback, useState } from "react";
import Preloader from "./preloader/Preloader";

// Review-only controls (REMOVE BEFORE LAUNCH):
//   - "Replay preloader" button below remounts the preloader for review.
//   - ?pp=0..1 freezes the preloader at that progress (e.g. ?pp=0.5) and
//     suppresses completion, for checking hand positions + sparkles.
export default function App() {
  const [done, setDone] = useState(false);
  const handleComplete = useCallback(() => setDone(true), []);
  const handleReplay = useCallback(() => setDone(false), []);

  if (!done) {
    return <Preloader onComplete={handleComplete} />;
  }

  return (
    <main id="site-root" className="site-placeholder">
      <p>Preloader complete. The website is built in the next step.</p>
      {/* TEMPORARY review control to be removed before launch. */}
      <button type="button" className="site-placeholder-replay" onClick={handleReplay}>
        Replay preloader
      </button>
    </main>
  );
}
