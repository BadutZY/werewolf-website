import { useGameStore, totalRoles } from "@/lib/game-store";
import { ROLES } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, Users, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SetupScreen() {
  const { state, setPhase, setPlayerCount, setRoleCount, startDistribution } = useGameStore();
  const total = totalRoles(state.roleCounts);
  const diff = total - state.playerCount;
  const canStart = diff === 0 && state.roleCounts.werewolf > 0;

  return (
    <div className="min-h-screen pb-44">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setPhase("menu")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg leading-tight">Setup Permainan</h2>
            <p className="text-xs text-muted-foreground">Atur pemain & role</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          className="glass rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Jumlah Pemain</h3>
            </div>
            <div className="text-3xl font-black text-glow">{state.playerCount}</div>
          </div>
          <input
            type="range"
            min={5}
            max={20}
            value={state.playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            className="w-full accent-primary h-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
            <span>5</span>
            <span>20</span>
          </div>
        </motion.section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-semibold">Komposisi Role</h3>
            </div>
            <motion.div
              key={`${total}/${state.playerCount}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className={`text-xs font-mono px-2.5 py-1 rounded-full ${
                diff === 0
                  ? "bg-primary/20 text-primary"
                  : "bg-destructive/20 text-destructive"
              }`}
            >
              {total} / {state.playerCount}
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
            }}
          >
            {ROLES.map((role) => {
              const count = state.roleCounts[role.id] ?? 0;
              const active = count > 0;
              const isWolf = role.team === "werewolf";
              return (
                <motion.div
                  key={role.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.94 },
                    show: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ type: "spring", stiffness: 160, damping: 20 }}
                  whileHover={{ y: -3 }}
                  className="flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => setRoleCount(role.id, count + 1)}
                    className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 text-left transition-all duration-300 ${
                      active
                        ? isWolf
                          ? "border-destructive/70 shadow-lg shadow-destructive/30"
                          : "border-primary/60 shadow-lg shadow-primary/20"
                        : "border-border/40 grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
                    }`}
                  >
                    <img
                      src={role.image}
                      alt={role.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold backdrop-blur-md ${
                          isWolf
                            ? "bg-destructive/30 text-destructive-foreground"
                            : "bg-primary/30 text-primary-foreground"
                        }`}
                      >
                        {role.team}
                      </span>
                    </div>
                    <AnimatePresence>
                      {active && (
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 380, damping: 18 }}
                          className="absolute top-2 right-2 min-w-7 h-7 px-1.5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-black text-sm shadow-lg shadow-primary/40"
                        >
                          ×{count}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-x-0 bottom-0 p-2 text-center">
                      <div className="font-black text-sm truncate text-glow">{role.name}</div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                        {role.description}
                      </p>
                    </div>
                  </button>

                  <div className="mt-2 flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl bg-secondary/40 border border-border/50"
                      onClick={() => setRoleCount(role.id, count - 1)}
                      disabled={count === 0}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex-1 h-9 rounded-xl bg-card/40 border border-border/50 flex items-center justify-center font-black tabular-nums">
                      <motion.span
                        key={count}
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        {count}
                      </motion.span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl bg-primary/15 text-primary border border-primary/30"
                      onClick={() => setRoleCount(role.id, count + 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      </main>

      <div className="fixed bottom-0 inset-x-0 p-4 backdrop-blur-xl bg-background/80 border-t border-border/40">
        <div className="max-w-3xl mx-auto space-y-2">
          {!canStart && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-destructive"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {diff !== 0
                ? `Total role harus sama dengan ${state.playerCount} (${diff > 0 ? "kurangi" : "tambahkan"} ${Math.abs(diff)})`
                : "Minimal 1 werewolf"}
            </motion.div>
          )}
          <Button
            disabled={!canStart}
            onClick={startDistribution}
            className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 disabled:opacity-40"
          >
            Mulai Bagikan Kartu
          </Button>
        </div>
      </div>
    </div>
  );
}
