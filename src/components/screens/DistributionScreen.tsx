import { useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { getRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { motion, AnimatePresence } from "framer-motion";
import { Check, Moon, ArrowRight, X, AlertTriangle } from "lucide-react";

type ModalState =
  | { type: "none" }
  | { type: "name"; slot: number }
  | { type: "reveal"; playerId: string };

export function DistributionScreen() {
  const { state, claimSlot, startPlaying, resetGame } = useGameStore();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const slots = Array.from({ length: state.playerCount }, (_, i) => i);
  const claimedSet = new Set(state.players.map((p) => p.slotIndex));
  const allClaimed = state.players.length === state.playerCount;

  const openSlot = (slot: number) => {
    if (claimedSet.has(slot)) return;
    setName("");
    setNameError("");
    setModal({ type: "name", slot });
  };

  const confirmName = () => {
    if (modal.type !== "name" || !name.trim()) return;
    const trimmed = name.trim();
    const taken = state.players.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (taken) {
      setNameError("Nama sudah dipakai pemain lain");
      return;
    }
    const player = claimSlot(modal.slot, trimmed);
    if (player) setModal({ type: "reveal", playerId: player.id });
    else setModal({ type: "none" });
  };

  const revealPlayer =
    modal.type === "reveal" ? state.players.find((p) => p.id === modal.playerId) : null;
  const revealRole = revealPlayer ? getRole(revealPlayer.roleId) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-4 text-center border-b border-border/40 backdrop-blur-xl bg-background/60 sticky top-0 z-10">
        <h2 className="font-bold text-lg">Pilih Kartumu</h2>
        <p className="text-xs text-muted-foreground">
          {state.players.length} / {state.playerCount} pemain · oper device ke pemain berikutnya
        </p>
      </header>

      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {slots.map((slot) => {
            const claimed = claimedSet.has(slot);
            const player = state.players.find((p) => p.slotIndex === slot);
            return (
              <motion.button
                key={slot}
                initial={{ opacity: 0, y: 14, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: slot * 0.03, type: "spring", stiffness: 180, damping: 18 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => openSlot(slot)}
                disabled={claimed}
                className={`aspect-[3/4] rounded-2xl relative overflow-hidden border-2 transition-all ${
                  claimed
                    ? "border-primary/40 bg-card/30"
                    : "border-border/60 bg-gradient-to-br from-card via-secondary/40 to-background hover:border-primary/60 active:border-primary"
                }`}
              >
                {claimed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <Check className="w-7 h-7 text-primary mb-1" />
                    <span className="text-xs font-semibold truncate w-full">{player?.name}</span>
                    <span className="text-[10px] text-muted-foreground">sudah</span>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.4_0.15_25/0.4),transparent_60%)]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Moon className="w-8 h-8 text-primary/80 mb-1" />
                      <span className="text-2xl font-black text-foreground/80">{slot + 1}</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 text-[10px] text-center py-1 bg-background/40 backdrop-blur uppercase tracking-widest text-muted-foreground">
                      Tap
                    </div>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </main>

      <div className="sticky bottom-0 p-4 backdrop-blur-xl bg-background/80 border-t border-border/40">
        <div className="max-w-xl mx-auto flex items-stretch gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setConfirmCancel(true)}
            className="h-14 w-14 rounded-2xl shrink-0 border-border/60"
            aria-label="Batal"
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            disabled={!allClaimed}
            onClick={startPlaying}
            className="flex-1 h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-primary to-accent disabled:opacity-40"
          >
            {allClaimed ? "Berikan ke Moderator" : `Sisa ${state.playerCount - state.players.length} pemain`}
            {allClaimed && <ArrowRight className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Name modal */}
      <Dialog open={modal.type === "name"} onOpenChange={(o) => !o && setModal({ type: "none" })}>
        <DialogContent className="glass-strong rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Tulis Nama</DialogTitle>
            <DialogDescription>Tulis namamu sebelum melihat role rahasia.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(""); }}
            onKeyDown={(e) => e.key === "Enter" && confirmName()}
            placeholder="Nama pemain"
            className="h-12 text-base rounded-xl"
          />
          {nameError && (
            <p className="text-xs text-destructive -mt-2">{nameError}</p>
          )}
          <Button
            onClick={confirmName}
            disabled={!name.trim()}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent"
          >
            Lihat Role
          </Button>
        </DialogContent>
      </Dialog>

      {/* Reveal modal */}
      <Dialog
        open={modal.type === "reveal"}
        onOpenChange={(o) => !o && setModal({ type: "none" })}
      >
        <DialogContent className="glass-strong rounded-3xl max-w-sm border-primary/30">
          <AnimatePresence>
            {revealRole && revealPlayer && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="text-center"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Role kamu adalah</p>
                <div className="relative mx-auto w-40 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl shadow-primary/30 mb-3">
                  <img
                    src={revealRole.image}
                    alt={revealRole.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 ring-2 rounded-2xl ${
                      revealRole.team === "werewolf" ? "ring-destructive/70" : "ring-primary/70"
                    }`}
                  />
                </div>
                <h2 className="text-3xl font-black text-glow">{revealRole.name}</h2>
                <span
                  className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                    revealRole.team === "werewolf"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  Tim {revealRole.team}
                </span>
                <p className="text-sm text-muted-foreground mt-3 mb-4 px-2">
                  {revealRole.description}
                </p>
                <Button
                  onClick={() => setModal({ type: "none" })}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent"
                >
                  Saya Mengerti
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="glass-strong rounded-3xl max-w-sm border-destructive/30">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mb-2">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Batalkan permainan?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Semua kartu yang sudah dibagikan akan hilang dan kamu akan kembali ke menu utama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl mt-0">
              Lanjutkan Bermain
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetGame()}
              className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
