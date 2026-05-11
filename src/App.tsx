import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game-store";
import { MenuScreen } from "@/components/screens/MenuScreen";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { DistributionScreen } from "@/components/screens/DistributionScreen";
import { PlayingScreen } from "@/components/screens/PlayingScreen";

export default function App() {
  const { state, goToSetup } = useGameStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {state.phase === "menu" && <MenuScreen onStart={goToSetup} />}
        {state.phase === "setup" && <SetupScreen />}
        {state.phase === "distribution" && <DistributionScreen />}
        {state.phase === "playing" && <PlayingScreen />}
      </motion.div>
    </AnimatePresence>
  );
}
