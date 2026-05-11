import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { getRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Skull,
  Heart,
  StickyNote,
  RotateCcw,
  NotebookPen,
  Users,
  Timer as TimerIcon,
  Play,
  Pause,
  Minus,
  Plus,
  Menu,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PlayingScreen() {
  const { state, updatePlayer, setGlobalNotes, resetGame } = useGameStore();
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Timer state
  const [timerOpen, setTimerOpen] = useState(false);
  const [duration, setDuration] = useState(180); // seconds, default 3min
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const endRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (endRef.current == null) return;
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.2;
          o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 600);
        } catch {}
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const startTimer = () => {
    if (duration <= 0) return;
    endRef.current = Date.now() + duration * 1000;
    setRemaining(duration);
    setRunning(true);
    setTimerOpen(false);
  };
  const pauseTimer = () => {
    setRunning(false);
    endRef.current = null;
  };
  const resumeTimer = () => {
    if (remaining <= 0) return;
    endRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  };
  const resetTimer = () => {
    setRunning(false);
    setRemaining(0);
    endRef.current = null;
  };

  const setTotalSeconds = (s: number) =>
    setDuration(Math.max(0, Math.min(10 * 60 + 59, Math.round(s))));
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const setMinutesPart = (m: number) =>
    setTotalSeconds(Math.max(0, Math.min(10, m)) * 60 + seconds);
  const setSecondsPart = (s: number) => {
    const clamped = ((s % 60) + 60) % 60;
    setTotalSeconds(minutes * 60 + clamped);
  };

  const aliveWerewolves = state.players.filter(
    (p) => p.alive && getRole(p.roleId)?.team === "werewolf",
  ).length;
  const aliveVillagers = state.players.filter(
    (p) => p.alive && getRole(p.roleId)?.team === "village",
  ).length;

  const noteTarget = state.players.find((p) => p.id === noteOpenId) ?? null;
  const timerActive = running || remaining > 0;

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold leading-tight">Moderator Mode</h2>
            <p className="text-[11px] text-muted-foreground">Permainan berlangsung</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive font-semibold">
              <Skull className="w-3.5 h-3.5" /> {aliveWerewolves}
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary font-semibold">
              <Users className="w-3.5 h-3.5" /> {aliveVillagers}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Timer bar — fixed at bottom while active */}
      <AnimatePresence>
        {timerActive && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed bottom-0 inset-x-0 z-20 backdrop-blur-xl bg-background/85 border-t border-border/40"
          >
            <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3">
              <TimerIcon className={`w-4 h-4 shrink-0 ${remaining <= 10 && running ? "text-destructive animate-pulse" : "text-accent"}`} />
              <div className={`font-mono text-2xl font-black tabular-nums ${remaining <= 10 && running ? "text-destructive" : "text-foreground"}`}>
                {fmt(remaining)}
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${duration ? (remaining / duration) * 100 : 0}%` }}
                />
              </div>
              {running ? (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={pauseTimer}>
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={resumeTimer}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={resetTimer}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {state.players.map((p, i) => {
            const role = getRole(p.roleId);
            if (!role) return null;
            const isWolf = role.team === "werewolf";
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 140, damping: 18 }}
                className="flex flex-col"
              >
                {/* Card */}
                <div
                  className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${
                    isWolf
                      ? "border-destructive/60 shadow-lg shadow-destructive/20"
                      : "border-primary/50 shadow-lg shadow-primary/10"
                  } ${!p.alive ? "grayscale" : ""}`}
                >
                  <img
                    src={role.image}
                    alt={role.name}
                    className={`w-full h-full object-cover transition-transform ${
                      p.alive ? "" : "opacity-40"
                    }`}
                  />
                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                  {/* team badge */}
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
                  {/* dead overlay */}
                  {!p.alive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                      <div className="rotate-[-12deg] border-4 border-destructive/80 px-3 py-1 rounded-lg">
                        <span className="font-black text-destructive text-lg tracking-widest">MATI</span>
                      </div>
                    </div>
                  )}
                  {/* name + role at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-2 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {role.name}
                    </div>
                    <div className="font-black text-sm truncate text-glow">{p.name}</div>
                  </div>
                  {p.note && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent shadow shadow-accent/60" />
                  )}
                </div>

                {/* Action row below card */}
                <div className="mt-2 flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updatePlayer(p.id, { alive: !p.alive })}
                    className={`flex-1 h-9 rounded-xl text-[11px] font-bold border ${
                      p.alive
                        ? "bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30"
                        : "bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                    }`}
                  >
                    {p.alive ? (
                      <><Skull className="w-3.5 h-3.5" /> Eleminasi</>
                    ) : (
                      <><Heart className="w-3.5 h-3.5" /> Revive</>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setNoteOpenId(p.id)}
                    className={`h-9 w-9 rounded-xl border ${
                      p.note
                        ? "bg-accent/15 text-accent border-accent/40"
                        : "bg-secondary/40 text-muted-foreground border-border/50"
                    }`}
                  >
                    <StickyNote className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Mobile hamburger menu (top-left) */}
      <div className="md:hidden fixed top-20 left-3 z-30">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="h-11 w-11 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-xl flex items-center justify-center"
          aria-label="Menu moderator"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={menuOpen ? "x" : "m"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="mt-2 flex flex-col gap-2 origin-top-left"
            >
              <button
                onClick={() => { setTimerOpen(true); setMenuOpen(false); }}
                className="h-11 px-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-xl flex items-center gap-2 text-sm font-semibold"
              >
                <TimerIcon className="w-4 h-4 text-accent" />
                Timer
                {timerActive && (
                  <span className="font-mono text-[11px] text-accent tabular-nums">{fmt(remaining)}</span>
                )}
              </button>
              <button
                onClick={() => { setGlobalOpen(true); setMenuOpen(false); }}
                className="h-11 px-4 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/40 flex items-center gap-2 text-sm font-semibold"
              >
                <NotebookPen className="w-4 h-4" />
                Catatan
                {state.globalNotes && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop floating actions */}
      <div className="hidden md:flex fixed bottom-6 right-4 z-30 flex-col gap-3 items-end">
        <button
          onClick={() => setTimerOpen(true)}
          className="h-14 px-5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-xl flex items-center gap-2 font-semibold hover:border-accent/60 transition-colors"
        >
          <TimerIcon className="w-5 h-5 text-accent" />
          Timer
          {timerActive && (
            <span className="font-mono text-xs text-accent tabular-nums">{fmt(remaining)}</span>
          )}
        </button>
        <button
          onClick={() => setGlobalOpen(true)}
          className="h-14 px-5 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/40 flex items-center gap-2 font-semibold"
        >
          <NotebookPen className="w-5 h-5" />
          Catatan
          {state.globalNotes && <span className="w-2 h-2 rounded-full bg-white" />}
        </button>
      </div>

      {/* Timer setup dialog */}
      <Dialog open={timerOpen} onOpenChange={setTimerOpen}>
        <DialogContent className="glass-strong rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TimerIcon className="w-5 h-5 text-accent" /> Atur Timer
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-3 py-4">
            {/* Minutes */}
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full bg-primary/20 text-primary"
                onClick={() => setMinutesPart(minutes + 1)}
                disabled={minutes >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <div className="font-mono text-5xl font-black tabular-nums text-glow w-[72px] text-center">
                {minutes.toString().padStart(2, "0")}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full bg-secondary/60"
                onClick={() => setMinutesPart(minutes - 1)}
                disabled={minutes <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                menit
              </div>
            </div>

            <div className="font-mono text-5xl font-black text-muted-foreground pb-6">:</div>

            {/* Seconds */}
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full bg-primary/20 text-primary"
                onClick={() => setSecondsPart(seconds + 5)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <div className="font-mono text-5xl font-black tabular-nums text-glow w-[72px] text-center">
                {seconds.toString().padStart(2, "0")}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full bg-secondary/60"
                onClick={() => setSecondsPart(seconds - 5)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                detik
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>Menit</span>
              <span className="font-mono">{minutes}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={minutes}
              onChange={(e) => setMinutesPart(Number(e.target.value))}
              className="w-full accent-primary h-2"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>Detik</span>
              <span className="font-mono">{seconds}</span>
            </div>
            <input
              type="range"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSecondsPart(Number(e.target.value))}
              className="w-full accent-accent h-2"
            />
          </div>
          <Button
            onClick={startTimer}
            disabled={duration <= 0}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent disabled:opacity-40 mt-2"
          >
            <Play className="w-4 h-4" /> Mulai Timer
          </Button>
        </DialogContent>
      </Dialog>

      {/* Per-player note */}
      <Dialog open={!!noteTarget} onOpenChange={(o) => !o && setNoteOpenId(null)}>
        <DialogContent className="glass-strong rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Catatan untuk {noteTarget?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            autoFocus
            value={noteTarget?.note ?? ""}
            onChange={(e) => noteTarget && updatePlayer(noteTarget.id, { note: e.target.value })}
            placeholder="Dugaan, hasil investigasi, perilaku mencurigakan..."
            rows={5}
            className="resize-none rounded-xl bg-background/40"
          />
          <Button onClick={() => setNoteOpenId(null)} className="w-full h-11 rounded-xl">
            Selesai
          </Button>
        </DialogContent>
      </Dialog>

      {/* Global notes */}
      <Dialog open={globalOpen} onOpenChange={setGlobalOpen}>
        <DialogContent className="glass-strong rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Catatan Moderator</DialogTitle>
          </DialogHeader>
          <Textarea
            autoFocus
            value={state.globalNotes}
            onChange={(e) => setGlobalNotes(e.target.value)}
            placeholder="Kejadian penting di setiap malam, hasil voting, suara investigasi..."
            rows={8}
            className="resize-none rounded-xl bg-background/40"
          />
          <Button onClick={() => setGlobalOpen(false)} className="w-full h-11 rounded-xl">
            Tutup
          </Button>
        </DialogContent>
      </Dialog>

      {/* Reset confirmation */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="glass-strong rounded-3xl max-w-sm border-destructive/30">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mb-2">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Akhiri permainan?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Semua pemain, role, dan catatan moderator akan dihapus dan kamu kembali ke menu utama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl mt-0">
              Lanjut Bermain
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetGame()}
              className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Ya, Akhiri
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
