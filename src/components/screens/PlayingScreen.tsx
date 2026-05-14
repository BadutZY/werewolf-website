import { useEffect, useRef, useState, useCallback } from "react";
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
  EyeOff,
  Eye,
  Filter,
  Check,
  Vote,
  ChevronRight,
  Trophy,
  X,
  Flame,
  Crown,
  History,
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

// ── LocalStorage Keys ──────────────────────────────────────────────────────
const LS_FILTER_KEY = "werewolf-filter-roles";
const LS_HIDDEN_KEY = "werewolf-hidden-players";
const LS_HIDE_MODE_KEY = "werewolf-hide-mode";
const LS_VOTE_KEY = "werewolf-vote-session";
const LS_VOTE_HISTORY_KEY = "werewolf-vote-history";

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Scroll Lock Hook ───────────────────────────────────────────────────────
// Counter global agar beberapa modal tidak saling override satu sama lain.
let _scrollLockCount = 0;
let _scrollLockSavedY = 0;

function _applyScrollLock() {
  _scrollLockSavedY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${_scrollLockSavedY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.overflow = "hidden";
}

function _releaseScrollLock() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.overflow = "";
  window.scrollTo(0, _scrollLockSavedY);
}

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    _scrollLockCount += 1;
    if (_scrollLockCount === 1) _applyScrollLock();
    return () => {
      _scrollLockCount = Math.max(0, _scrollLockCount - 1);
      if (_scrollLockCount === 0) _releaseScrollLock();
    };
  }, [active]);
}

// ── Confetti ───────────────────────────────────────────────────────────────
function ConfettiParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.2 + Math.random() * 1.2,
    color: ["#f97316", "#ef4444", "#eab308", "#a855f7", "#06b6d4"][i % 5],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{ left: `${p.x}%`, width: p.size, height: p.size * 0.5, backgroundColor: p.color, rotate: p.rotate }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "120vh", opacity: [1, 1, 0], rotate: [p.rotate, p.rotate + 360 * (Math.random() > 0.5 ? 1 : -1)] }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// ── Death Overlay ──────────────────────────────────────────────────────────
function DeathOverlay({ name, onDone }: { name: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute top-0 rounded-full bg-red-600/80" style={{ left: `${8 + i * 7.5}%`, width: `${4 + (i % 3) * 3}px`, height: `${20 + (i % 4) * 15}px` }} initial={{ y: -40, opacity: 0, scaleY: 0 }} animate={{ y: 0, opacity: [0, 1, 1, 0.4], scaleY: 1 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: "easeIn" }} />
      ))}
      <div className="relative flex flex-col items-center gap-4">
        <motion.div initial={{ scale: 0, rotate: -30, opacity: 0 }} animate={{ scale: [0, 1.4, 1], rotate: [-30, 10, 0], opacity: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: "backOut" }} className="text-red-500 drop-shadow-[0_0_24px_rgba(239,68,68,0.9)]">
          <Skull className="w-20 h-20" />
        </motion.div>
        <motion.div initial={{ scale: 3, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: -4 }} transition={{ delay: 0.5, duration: 0.45, ease: "backOut" }}>
          <span className="text-6xl font-black tracking-[0.25em] text-red-500 select-none" style={{ textShadow: "0 0 40px rgba(239,68,68,0.8), 4px 4px 0 rgba(0,0,0,0.8)", WebkitTextStroke: "2px rgba(180,20,20,0.9)" }}>MATI</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.4 }} className="text-center">
          <div className="text-xs uppercase tracking-widest text-red-400/80 mb-1">Pemain dieliminasi</div>
          <div className="text-2xl font-bold text-white">{name}</div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Filter Panel ───────────────────────────────────────────────────────────
interface FilterPanelProps {
  open: boolean; onClose: () => void; activeRoleIds: string[];
  selectedRoles: Set<string>; onToggleRole: (id: string) => void;
  onSelectAll: () => void; onClearAll: () => void;
  roleLabelMap: Record<string, { name: string; count: number; team: string }>;
}
function FilterPanel({ open, onClose, activeRoleIds, selectedRoles, onToggleRole, onSelectAll, onClearAll, roleLabelMap }: FilterPanelProps) {
  useScrollLock(open);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl bg-card border-t border-border/50 shadow-2xl" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }}>
            <div className="max-w-lg mx-auto px-5 pt-4 pb-10">
              <div className="w-10 h-1 rounded-full bg-border/60 mx-auto mb-5" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2"><Filter className="w-4 h-4 text-accent" /> Filter Role</h3>
                <div className="flex gap-2">
                  <button onClick={onSelectAll} className="text-[11px] px-3 py-1.5 rounded-lg bg-primary/15 text-primary font-semibold">Semua</button>
                  <button onClick={onClearAll} className="text-[11px] px-3 py-1.5 rounded-lg bg-secondary/60 text-muted-foreground font-semibold">Kosong</button>
                  <button onClick={onClose} className="text-[11px] px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive font-semibold">Tutup</button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">Tampilkan hanya role yang dipilih dari papan pemain.</p>
              <div className="flex flex-col gap-2">
                {activeRoleIds.map((roleId) => {
                  const info = roleLabelMap[roleId];
                  if (!info) return null;
                  const isSel = selectedRoles.has(roleId);
                  const isWolf = info.team === "werewolf";
                  return (
                    <motion.button key={roleId} onClick={() => onToggleRole(roleId)} whileTap={{ scale: 0.97 }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${isSel ? isWolf ? "bg-destructive/15 border-destructive/50 text-destructive" : "bg-primary/15 border-primary/50 text-primary" : "bg-secondary/30 border-transparent text-muted-foreground"}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSel ? isWolf ? "bg-destructive border-destructive" : "bg-primary border-primary" : "border-border/60"}`}>{isSel && <Check className="w-3 h-3 text-white" />}</div>
                      <span className="font-semibold text-sm flex-1">{info.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isWolf ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>{info.team}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{info.count}×</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Vote Types ─────────────────────────────────────────────────────────────
interface VoteEntry { voterId: string; voterName: string; targetId: string | null; }
interface VoteSession { active: boolean; currentVoterIndex: number; votes: VoteEntry[]; finished: boolean; }
type VotePhase = "transition" | "result";

interface VoteHistoryRecord {
  id: string;
  timestamp: number;
  votes: VoteEntry[];
  players: Array<{ id: string; name: string }>;
}

// ── Vote History Panel ─────────────────────────────────────────────────────
interface VoteHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  history: VoteHistoryRecord | null;
}
function VoteHistoryPanel({ open, onClose, history }: VoteHistoryPanelProps) {
  useScrollLock(open);

  const voteCounts: Record<string, number> = {};
  history?.votes.forEach((v) => { if (v.targetId) voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1; });
  const maxVotes = Math.max(0, ...Object.values(voteCounts));
  const sortedResults = (history?.players ?? [])
    .map((p) => ({ player: p, count: voteCounts[p.id] || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl bg-card border-t border-border/50 shadow-2xl"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
          >
            <div className="max-w-lg mx-auto px-5 pt-4 pb-10">
              <div className="w-10 h-1 rounded-full bg-border/60 mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-accent" />
                  Riwayat Vote
                  {history && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {formatTime(history.timestamp)}
                    </span>
                  )}
                </h3>
                <button onClick={onClose} className="text-[11px] px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive font-semibold">
                  Tutup
                </button>
              </div>

              {!history ? (
                <div className="py-10 text-center">
                  <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada riwayat vote.</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">Riwayat akan muncul setelah vote selesai.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Ringkasan perolehan suara */}
                  {sortedResults.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Perolehan Suara</p>
                      <div className="space-y-2">
                        {sortedResults.map(({ player, count }, idx) => {
                          const isTop = count === maxVotes;
                          const pct = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
                          return (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.06 }}
                              className={`relative rounded-xl overflow-hidden border-2 ${isTop ? "border-accent/60" : "border-border/30"}`}
                            >
                              <motion.div
                                className={`absolute inset-y-0 left-0 ${isTop ? "bg-gradient-to-r from-accent/35 to-primary/20" : "bg-secondary/20"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: idx * 0.06 + 0.15, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                              />
                              <div className="relative flex items-center gap-3 px-4 py-2.5">
                                <span className={`text-xs font-black w-5 shrink-0 ${isTop ? "text-accent" : "text-muted-foreground"}`}>#{idx + 1}</span>
                                <span className={`font-bold text-sm flex-1 ${isTop ? "text-foreground" : "text-muted-foreground"}`}>{player.name}</span>
                                {isTop && <Crown className="w-3.5 h-3.5 text-accent shrink-0" />}
                                <span className={`font-black text-sm tabular-nums ${isTop ? "text-accent" : "text-muted-foreground"}`}>
                                  {count}<span className="text-[10px] font-normal ml-0.5">vote</span>
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detail per voter */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Detail per Pemain</p>
                    <div className="space-y-1.5">
                      {history.votes.map((v, i) => {
                        const targetName = v.targetId
                          ? (history.players.find((p) => p.id === v.targetId)?.name ?? "?")
                          : "—";
                        const voted = !!v.targetId;
                        return (
                          <motion.div
                            key={v.voterId}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-secondary/20 border border-border/30"
                          >
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs bg-primary/20 text-primary shrink-0">
                              {v.voterName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-sm flex-1 truncate">{v.voterName}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className={`text-sm font-bold shrink-0 ${voted ? "text-accent" : "text-muted-foreground"}`}>
                              {targetName}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-center text-[10px] text-muted-foreground/50">
                    {history.votes.filter((v) => v.targetId).length} dari {history.votes.length} pemain memberikan suara
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


// ── Voter Transition Screen ────────────────────────────────────────────────
function VoterTransition({ voterName, voterIndex, total, onReady }: { voterName: string; voterIndex: number; total: number; onReady: () => void }) {
  useScrollLock(true);
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, oklch(0.22 0.05 25 / 0.6) 0%, oklch(0.12 0.03 280) 70%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated rings */}
      <div className="relative flex items-center justify-center mb-10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-accent/30"
            style={{ width: 90 + i * 40, height: 90 + i * 40 }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.7, 1.2, 0.9 + i * 0.05], opacity: [0, 0.5, 0] }}
            transition={{ delay: i * 0.35, duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        {/* Center avatar */}
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center font-black text-4xl relative z-10 shadow-2xl"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))", boxShadow: "0 0 40px oklch(0.55 0.18 30 / 0.5)" }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        >
          {voterName.charAt(0).toUpperCase()}
        </motion.div>
      </div>

      {/* Step indicator */}
      <motion.div className="flex items-center gap-1.5 mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i < voterIndex ? "bg-accent/60 w-4" : i === voterIndex ? "bg-accent w-6" : "bg-border/50 w-1.5"}`} />
        ))}
      </motion.div>

      <motion.p className="text-muted-foreground text-xs uppercase tracking-[0.35em] mb-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        Giliran vote {voterIndex + 1} / {total}
      </motion.p>

      <motion.h2
        className="text-5xl font-black text-center px-8 mb-2"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 180, damping: 16 }}
        style={{ textShadow: "0 0 50px oklch(0.55 0.18 30 / 0.8)" }}
      >
        {voterName}
      </motion.h2>

      <motion.p className="text-muted-foreground text-sm mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        siap memberikan suaramu?
      </motion.p>

      <motion.button
        onClick={onReady}
        className="relative px-10 py-4 rounded-2xl font-bold text-sm text-white overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))", boxShadow: "0 8px 32px oklch(0.55 0.18 30 / 0.45)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ delay: 0.8, duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        />
        <span className="relative flex items-center gap-2">
          <Check className="w-4 h-4" />
          Mulai vote!
        </span>
      </motion.button>
    </motion.div>
  );
}

// ── Vote Result Bar ────────────────────────────────────────────────────────
function VoteResultBar({ name, count, maxCount, rank, isTop, delay }: { name: string; count: number; maxCount: number; rank: number; isTop: boolean; delay: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 160, damping: 20 }}
      className={`relative rounded-2xl overflow-hidden border-2 ${isTop ? "border-accent/70" : "border-border/30"}`}
    >
      {/* BG fill */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${isTop ? "bg-gradient-to-r from-accent/40 to-primary/25" : "bg-secondary/25"}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay: delay + 0.2, duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
      />
      <div className="relative flex items-center gap-3 px-4 py-3.5">
        <span className={`text-xs font-black w-5 shrink-0 ${isTop ? "text-accent" : "text-muted-foreground"}`}>#{rank}</span>
        <span className={`font-bold text-sm flex-1 ${isTop ? "text-foreground" : "text-muted-foreground"}`}>{name}</span>
        {isTop && (
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: delay + 0.55, type: "spring", stiffness: 300 }}>
            <Crown className="w-4 h-4 text-accent drop-shadow-[0_0_8px_oklch(0.55_0.18_30)]" />
          </motion.div>
        )}
        <motion.span className={`font-black text-base tabular-nums ${isTop ? "text-accent" : "text-muted-foreground"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }}>
          {count}<span className="text-[10px] font-normal ml-0.5">vote</span>
        </motion.span>
      </div>
    </motion.div>
  );
}

// ── Vote Confirm Dialog ────────────────────────────────────────────────────
interface VoteConfirmProps {
  targetName: string | null; // null = skip
  onConfirm: () => void;
  onCancel: () => void;
}
function VoteConfirmDialog({ targetName, onConfirm, onCancel }: VoteConfirmProps) {
  useScrollLock(true);
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />
      <motion.div
        className="relative w-full max-w-sm glass-strong rounded-3xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="px-6 pt-7 pb-3 text-center">
          <motion.div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))", boxShadow: "0 0 28px oklch(0.55 0.18 30 / 0.5)" }}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.1 }}
          >
            <Vote className="w-7 h-7 text-white" />
          </motion.div>
          <h3 className="text-xl font-black mb-1">
            {targetName ? "Yakin vote?" : "Yakin lewati?"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {targetName
              ? <>Kamu akan vote <span className="font-bold text-foreground">{targetName}</span> untuk dikeluarkan.</>
              : "Kamu memilih untuk tidak memberikan suara."}
          </p>
        </div>
        <div className="flex gap-2.5 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-2xl border-2 border-border/50 bg-secondary/30 text-sm font-bold hover:bg-secondary/60 transition-colors active:scale-95"
          >
            Vote ulang
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-2xl text-white text-sm font-bold active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))", boxShadow: "0 4px 20px oklch(0.55 0.18 30 / 0.35)" }}
          >
            Lanjutkan
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Vote Modal (orchestrates phases) ──────────────────────────────────────
interface VoteModalProps {
  open: boolean; onClose: () => void; session: VoteSession;
  alivePlayers: Array<{ id: string; name: string; roleId: string }>;
  onCastVote: (targetId: string | null) => void; onResetVote: () => void;
}

function VoteModal({ open, onClose, session, alivePlayers, onCastVote, onResetVote }: VoteModalProps) {
  useScrollLock(open);
  // "transition" = show turn announcement overlay
  // "result" = show result screen
  // When neither, modal is closed (voting happens inline on cards)
  const [phase, setPhase] = useState<"transition" | "result">(session.finished ? "result" : "transition");

  useEffect(() => {
    if (!open) return;
    if (session.finished) setPhase("result");
    else setPhase("transition");
  }, [open, session.finished, session.currentVoterIndex]);

  // Results
  const voteCounts: Record<string, number> = {};
  session.votes.forEach((v) => { if (v.targetId) voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1; });
  const maxVotes = Math.max(0, ...Object.values(voteCounts));
  const sortedResults = alivePlayers.map((p) => ({ player: p, count: voteCounts[p.id] || 0 })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count);

  const currentVoter = alivePlayers[session.currentVoterIndex] ?? null;

  if (!open) return null;

  return (
    <AnimatePresence mode="wait">
      {/* ── Phase: Turn Announcement ── */}
      {phase === "transition" && currentVoter && (
        <VoterTransition
          key={`t-${session.currentVoterIndex}`}
          voterName={currentVoter.name}
          voterIndex={session.currentVoterIndex}
          total={alivePlayers.length}
          onReady={onClose}
        />
      )}

      {/* ── Phase: Result ── */}
      {phase === "result" && (
        <motion.div
          key="result"
          className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ConfettiParticles />

          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

          <motion.div
            className="relative w-full sm:max-w-md glass-strong sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
            initial={{ y: 80, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}
          >
            {/* Result header with glow */}
            <div className="relative px-6 pt-8 pb-6 text-center border-b border-border/30 overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-transparent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
              <motion.div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, oklch(0.55 0.18 30 / 0.25), transparent 65%)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
              <motion.div className="relative" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.3 }}>
                <Trophy className="w-14 h-14 text-accent mx-auto mb-3" style={{ filter: "drop-shadow(0 0 20px oklch(0.55 0.18 30 / 0.8))" }} />
              </motion.div>
              <motion.h2 className="relative text-2xl font-black mb-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>Hasil Vote</motion.h2>
              <motion.p className="relative text-xs text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
                {session.votes.filter((v) => v.targetId).length} dari {session.votes.length} pemain memberikan suara
              </motion.p>
            </div>

            {/* Bars */}
            <div className="px-5 py-4 space-y-2.5 max-h-[35vh] overflow-y-auto">
              {sortedResults.length > 0 ? (
                sortedResults.map(({ player, count }, idx) => (
                  <VoteResultBar key={player.id} name={player.name} count={count} maxCount={maxVotes} rank={idx + 1} isTop={count === maxVotes} delay={idx * 0.1 + 0.2} />
                ))
              ) : (
                <motion.p className="text-center text-sm text-muted-foreground py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Tidak ada yang divote</motion.p>
              )}
            </div>

            {/* Rekap per voter - collapsible */}
            {session.votes.length > 0 && (
              <div className="px-5 pb-3">
                <details className="group">
                  <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors select-none flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 transition-transform duration-200 group-open:rotate-90" />
                    Rekap per pemain
                  </summary>
                  <motion.div className="mt-2 space-y-1 pl-4">
                    {session.votes.map((v) => {
                      const targetName = v.targetId ? alivePlayers.find((p) => p.id === v.targetId)?.name ?? "?" : "—";
                      return (
                        <div key={v.voterId} className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-foreground flex-1">{v.voterName}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className={v.targetId ? "text-accent font-semibold" : "text-muted-foreground"}>{targetName}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                </details>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 px-5 pb-7">
              <button onClick={onResetVote} className="flex-1 h-12 rounded-2xl border-2 border-border/50 bg-secondary/30 text-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary/60 transition-colors active:scale-95">
                <RotateCcw className="w-4 h-4" /> Ulang
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))", boxShadow: "0 4px 20px oklch(0.55 0.18 30 / 0.35)" }}
              >
                <Check className="w-4 h-4" /> Selesai
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Player Card ────────────────────────────────────────────────────────────
interface PlayerCardProps {
  p: { id: string; name: string; roleId: string; alive: boolean; note?: string };
  index: number; hideMode: boolean; isHidden: boolean;
  onToggleHide: () => void; onEliminate: () => void; onNote: () => void;
  // Vote props
  voteActive?: boolean;
  isCurrentVoter?: boolean;
  hasVoted?: boolean;
  isVoterSelf?: boolean;
  onVoteThis?: () => void;
}
function PlayerCard({ p, index, hideMode, isHidden, onToggleHide, onEliminate, onNote, voteActive, isCurrentVoter, hasVoted, isVoterSelf, onVoteThis }: PlayerCardProps) {
  const role = getRole(p.roleId);
  if (!role) return null;
  const isWolf = role.team === "werewolf";
  const initial = p.name.charAt(0).toUpperCase();

  // Highlight this card when it's the voter's turn
  const voterHighlight = voteActive && isCurrentVoter;
  // Dim non-voters during active vote (but don't hide them)
  const dimmed = voteActive && !isCurrentVoter && !isVoterSelf && !hasVoted;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ delay: index * 0.04, type: "spring", stiffness: 140, damping: 18 }} className="flex flex-col">
      <div
        onClick={() => hideMode && onToggleHide()}
        className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all
          ${voterHighlight ? "border-accent shadow-lg shadow-accent/40 ring-2 ring-accent/50" : isWolf ? "border-destructive/60 shadow-lg shadow-destructive/20" : "border-primary/50 shadow-lg shadow-primary/10"}
          ${!p.alive ? "grayscale" : ""}
          ${dimmed ? "opacity-40" : ""}
          ${hideMode ? "cursor-pointer active:scale-[0.98]" : ""}`}
        style={{ aspectRatio: "3/4" }}
      >
        <AnimatePresence mode="wait">
          {isHidden ? (
            <motion.div key="hidden" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.22 }} className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary/80 to-background/95">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${isWolf ? "border-destructive/50 bg-destructive/10" : "border-primary/50 bg-primary/10"}`}><span className={`text-3xl font-black ${isWolf ? "text-destructive" : "text-primary"}`}>{initial}</span></div>
              <div className="mt-2.5 font-black text-sm truncate px-2 max-w-full text-center">{p.name}</div>
              <div className="mt-1 flex items-center gap-1"><EyeOff className="w-3 h-3 text-muted-foreground" /><span className="text-[9px] text-muted-foreground uppercase tracking-wider">tersembunyi</span></div>
            </motion.div>
          ) : (
            <motion.div key="visible" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0">
              <img src={role.image} alt={role.name} className={`w-full h-full object-cover ${!p.alive ? "opacity-40" : ""}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
              <div className="absolute top-0 right-0 bottom-0 w-5 flex items-center justify-center"><span className={`text-[8px] font-black uppercase tracking-[0.2em] select-none ${isWolf ? "text-destructive/70" : "text-primary/70"}`} style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}>{role.name}</span></div>
              <div className="absolute top-2 left-2"><span className={`text-[8px] px-1.5 py-0.5 rounded-md uppercase font-bold backdrop-blur-md ${isWolf ? "bg-destructive/30 text-destructive-foreground" : "bg-primary/30 text-primary-foreground"}`}>{role.team}</span></div>
              {p.note && <div className="absolute top-2 right-6 w-2 h-2 rounded-full bg-accent shadow shadow-accent/60" />}
              {/* Voter badge */}
              {voteActive && isCurrentVoter && (
                <motion.div
                  className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-white"
                  style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))" }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Flame className="w-2.5 h-2.5 inline mr-0.5" />giliran
                </motion.div>
              )}
              {/* Already voted badge */}
              {voteActive && hasVoted && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-green-500/30 text-green-400 border border-green-500/30 whitespace-nowrap">
                  <Check className="w-2.5 h-2.5 inline mr-0.5" />sudah vote
                </div>
              )}
              <AnimatePresence>
                {!p.alive && (
                  <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: -12 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                    <div className="border-4 border-destructive/80 px-3 py-1 rounded-lg shadow-lg shadow-destructive/30"><span className="font-black text-destructive text-lg tracking-widest">MATI</span></div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 px-2 pb-2 text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground leading-none mb-0.5">{role.name}</div>
                <div className="font-black text-sm truncate leading-tight">{p.name}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {hideMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute top-2 right-6 w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-md ${isHidden ? "bg-accent/30 text-accent" : "bg-background/50 text-muted-foreground"}`}>
            {isHidden ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
          </motion.div>
        )}
      </div>

      {/* Bottom action row */}
      <div className="mt-2 flex flex-col gap-1.5">
        {/* VOTE button — shown for all alive players except the current voter themselves */}
        {voteActive && p.alive && !isCurrentVoter && onVoteThis && (
          <motion.button
            onClick={onVoteThis}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-9 rounded-xl text-[11px] font-black text-white flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))", boxShadow: "0 4px 14px oklch(0.55 0.18 30 / 0.4)" }}
          >
            <Vote className="w-3.5 h-3.5 shrink-0" />
            VOTE
          </motion.button>
        )}
        {/* Skip — shown on current voter's own card */}
        {voteActive && p.alive && isCurrentVoter && onVoteThis && (
          <motion.button
            onClick={onVoteThis}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-9 rounded-xl text-[11px] font-bold border-2 border-dashed border-border/60 text-muted-foreground flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
            Lewati
          </motion.button>
        )}
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={onEliminate} className={`flex-1 h-9 rounded-xl text-[11px] font-bold border gap-1 ${p.alive ? "bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30" : "bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"}`}>
            {p.alive ? (<><Skull className="w-3.5 h-3.5 shrink-0" /><span>Eleminasi</span></>) : (<><Heart className="w-3.5 h-3.5 shrink-0" /><span>Revive</span></>)}
          </Button>
          <Button size="icon" variant="ghost" onClick={onNote} className={`h-9 w-9 rounded-xl border shrink-0 ${p.note ? "bg-accent/15 text-accent border-accent/40" : "bg-secondary/40 text-muted-foreground border-border/50"}`}><StickyNote className="w-4 h-4" /></Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main PlayingScreen ─────────────────────────────────────────────────────
export function PlayingScreen() {
  const { state, updatePlayer, setGlobalNotes, resetGame } = useGameStore();
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [deathAnimation, setDeathAnimation] = useState<{ name: string; id: string } | null>(null);

  // ── Persistent: Hidden players ──
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem(LS_HIDDEN_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); }
  });
  const [hideMode, setHideMode] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_HIDE_MODE_KEY) === "true"; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem(LS_HIDDEN_KEY, JSON.stringify(Array.from(hiddenPlayers))); } catch {} }, [hiddenPlayers]);
  useEffect(() => { try { localStorage.setItem(LS_HIDE_MODE_KEY, String(hideMode)); } catch {} }, [hideMode]);

  // ── Persistent: Filter ──
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem(LS_FILTER_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); }
  });
  useEffect(() => { try { localStorage.setItem(LS_FILTER_KEY, JSON.stringify(Array.from(selectedRoleFilter))); } catch {} }, [selectedRoleFilter]);

  // ── Persistent: Vote ──
  const [voteOpen, setVoteOpen] = useState(false);
  const [voteSession, setVoteSession] = useState<VoteSession>(() => {
    try { const r = localStorage.getItem(LS_VOTE_KEY); return r ? JSON.parse(r) : { active: false, currentVoterIndex: 0, votes: [], finished: false }; } catch { return { active: false, currentVoterIndex: 0, votes: [], finished: false }; }
  });
  useEffect(() => { try { localStorage.setItem(LS_VOTE_KEY, JSON.stringify(voteSession)); } catch {} }, [voteSession]);

  // Confirm dialog: { targetId: string | null, targetName: string | null }
  const [voteConfirmPending, setVoteConfirmPending] = useState<{ targetId: string | null; targetName: string | null } | null>(null);

  // ── Vote History ──
  const [voteHistory, setVoteHistory] = useState<VoteHistoryRecord | null>(() => {
    try { const r = localStorage.getItem(LS_VOTE_HISTORY_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  useEffect(() => { try { if (voteHistory) localStorage.setItem(LS_VOTE_HISTORY_KEY, JSON.stringify(voteHistory)); else localStorage.removeItem(LS_VOTE_HISTORY_KEY); } catch {} }, [voteHistory]);

  // ── Timer ──
  const [timerOpen, setTimerOpen] = useState(false);
  const [duration, setDuration] = useState(180);
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
        try { const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 600); } catch {}
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const startTimer = () => { if (duration <= 0) return; endRef.current = Date.now() + duration * 1000; setRemaining(duration); setRunning(true); setTimerOpen(false); };
  const pauseTimer = () => { setRunning(false); endRef.current = null; };
  const resumeTimer = () => { if (remaining <= 0) return; endRef.current = Date.now() + remaining * 1000; setRunning(true); };
  const resetTimer = () => { setRunning(false); setRemaining(0); endRef.current = null; };
  const setTotalSeconds = (s: number) => setDuration(Math.max(0, Math.min(10 * 60 + 59, Math.round(s))));
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const setMinutesPart = (m: number) => setTotalSeconds(Math.max(0, Math.min(10, m)) * 60 + seconds);
  const setSecondsPart = (s: number) => { const c = ((s % 60) + 60) % 60; setTotalSeconds(minutes * 60 + c); };

  const aliveWerewolves = state.players.filter((p) => p.alive && getRole(p.roleId)?.team === "werewolf").length;
  const aliveVillagers = state.players.filter((p) => p.alive && getRole(p.roleId)?.team === "village").length;
  const totalAlive = state.players.filter((p) => p.alive).length;
  const noteTarget = state.players.find((p) => p.id === noteOpenId) ?? null;
  const timerActive = running || remaining > 0;

  const toggleHidePlayer = (id: string) => setHiddenPlayers((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allHidden = state.players.length > 0 && state.players.every((p) => hiddenPlayers.has(p.id));

  const activeRoleIds = Array.from(new Set(state.players.map((p) => p.roleId)));
  const roleLabelMap: Record<string, { name: string; count: number; team: string }> = {};
  activeRoleIds.forEach((rid) => { const role = getRole(rid); if (!role) return; roleLabelMap[rid] = { name: role.name, count: state.players.filter((p) => p.roleId === rid).length, team: role.team }; });

  useEffect(() => {
    if (activeRoleIds.length > 0 && selectedRoleFilter.size === 0) {
      const saved = localStorage.getItem(LS_FILTER_KEY);
      if (!saved) setSelectedRoleFilter(new Set(activeRoleIds));
    }
  }, [activeRoleIds.length]);

  const toggleRoleFilter = (roleId: string) => setSelectedRoleFilter((prev) => { const n = new Set(prev); if (n.has(roleId)) n.delete(roleId); else n.add(roleId); return n; });
  const filterSelectAll = () => setSelectedRoleFilter(new Set(activeRoleIds));
  const filterClearAll = () => setSelectedRoleFilter(new Set());
  const filterActive = selectedRoleFilter.size > 0 && selectedRoleFilter.size < activeRoleIds.length;
  const visiblePlayers = state.players.filter((p) => selectedRoleFilter.size === 0 ? true : selectedRoleFilter.has(p.roleId));

  const handleEliminate = (p: (typeof state.players)[0]) => {
    if (p.alive) { setDeathAnimation({ name: p.name, id: p.id }); setTimeout(() => updatePlayer(p.id, { alive: false }), 400); }
    else updatePlayer(p.id, { alive: true });
  };

  // ── Vote handlers ──
  const alivePlayers = state.players.filter((p) => p.alive);
  const voteInProgress = voteSession.active && !voteSession.finished;
  const voteFinished = voteSession.active && voteSession.finished;

  const currentVoter = voteInProgress ? alivePlayers[voteSession.currentVoterIndex] ?? null : null;
  const voterIdsWhoVoted = new Set(voteSession.votes.map((v) => v.voterId));

  const startVote = useCallback(() => {
    setVoteSession({ active: true, currentVoterIndex: 0, votes: [], finished: false });
    // Show turn announcement overlay
    setVoteOpen(true);
  }, []);

  // Called when a player presses VOTE on another player card (or Lewati on own card)
  const requestVote = useCallback((targetId: string | null, targetName: string | null) => {
    setVoteConfirmPending({ targetId, targetName });
  }, []);

  const castVote = useCallback((targetId: string | null) => {
    setVoteConfirmPending(null);
    setVoteSession((prev) => {
      const voter = alivePlayers[prev.currentVoterIndex];
      if (!voter) return prev;
      const newVotes: VoteEntry[] = [...prev.votes, { voterId: voter.id, voterName: voter.name, targetId }];
      const nextIndex = prev.currentVoterIndex + 1;
      const finished = nextIndex >= alivePlayers.length;
      const updated = { ...prev, votes: newVotes, currentVoterIndex: nextIndex, finished };
      if (!finished) {
        // Show next voter's turn announcement
        setTimeout(() => setVoteOpen(true), 100);
      } else {
        // Show results
        setTimeout(() => setVoteOpen(true), 100);
      }
      return updated;
    });
  }, [alivePlayers]);

  const resetVote = useCallback(() => {
    setVoteSession({ active: true, currentVoterIndex: 0, votes: [], finished: false });
    setTimeout(() => setVoteOpen(true), 50);
  }, []);

  const closeVote = useCallback(() => {
    setVoteOpen(false);
    // Simpan ke riwayat sebelum reset (hanya kalau sudah selesai)
    setVoteSession((prev) => {
      if (prev.finished && prev.votes.length > 0) {
        const record: VoteHistoryRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          votes: prev.votes,
          players: alivePlayers.map((p) => ({ id: p.id, name: p.name })),
        };
        setVoteHistory(record);
      }
      return { active: false, currentVoterIndex: 0, votes: [], finished: false };
    });
    try { localStorage.removeItem(LS_VOTE_KEY); } catch {}
  }, [alivePlayers]);

  // When turn announcement is dismissed, close modal (voting happens inline)
  const handleTurnAnnouncementReady = useCallback(() => {
    setVoteOpen(false);
  }, []);

  return (
    <div className="min-h-screen pb-28">
      {/* Death overlay */}
      <AnimatePresence>
        {deathAnimation && <DeathOverlay key={deathAnimation.id} name={deathAnimation.name} onDone={() => setDeathAnimation(null)} />}
      </AnimatePresence>

      {/* Vote confirm dialog */}
      <AnimatePresence>
        {voteConfirmPending && (
          <VoteConfirmDialog
            targetName={voteConfirmPending.targetName}
            onConfirm={() => castVote(voteConfirmPending.targetId)}
            onCancel={() => setVoteConfirmPending(null)}
          />
        )}
      </AnimatePresence>

      {/* Vote system: turn announcement + result */}
      <AnimatePresence>
        {voteOpen && (
          <VoteModal
            open={voteOpen}
            onClose={voteFinished ? closeVote : handleTurnAnnouncementReady}
            session={voteSession}
            alivePlayers={alivePlayers}
            onCastVote={castVote}
            onResetVote={resetVote}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/85 border-b border-border/40">
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-base leading-tight">Moderator Mode</h2>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Permainan berlangsung</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-destructive/15 text-destructive font-bold text-xs"><Skull className="w-3.5 h-3.5" /><span>{aliveWerewolves}</span></div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/15 text-primary font-bold text-xs"><Users className="w-3.5 h-3.5" /><span>{aliveVillagers}</span></div>
          </div>
        </div>

        <div className="px-4 pb-2.5 flex items-center gap-2">
          {/* Timer */}
          <button onClick={() => setTimerOpen(true)} className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border font-semibold text-xs transition-colors ${timerActive ? "bg-accent/20 text-accent border-accent/40" : "bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground"}`}>
            <TimerIcon className="w-3.5 h-3.5 shrink-0" />
            {timerActive ? <span className="font-mono font-black tabular-nums">{fmt(remaining)}</span> : <span>Timer</span>}
          </button>

          {/* Filter */}
          <button onClick={() => setFilterOpen(true)} className={`relative h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${filterActive ? "bg-accent/20 text-accent border-accent/40" : "bg-secondary/40 text-muted-foreground border-border/40"}`}>
            <Filter className="w-4 h-4" />
            {filterActive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />}
          </button>

          {/* Hide */}
          <button onClick={() => setHideMode((v) => !v)} className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors ${hideMode ? "bg-accent/20 text-accent border-accent/40" : "bg-secondary/40 text-muted-foreground border-border/40"}`}>
            {hideMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Notes */}
          <button onClick={() => setGlobalOpen(true)} className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors relative ${state.globalNotes ? "bg-primary/15 text-primary border-primary/40" : "bg-secondary/40 text-muted-foreground border-border/40"}`}>
            <NotebookPen className="w-4 h-4" />
            {state.globalNotes && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />}
          </button>

          {/* Vote History */}
          <button onClick={() => setHistoryOpen(true)} className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors relative ${voteHistory ? "bg-accent/20 text-accent border-accent/40" : "bg-secondary/40 text-muted-foreground border-border/40"}`}>
            <History className="w-4 h-4" />
            {voteHistory && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />}
          </button>

          {/* Reset */}
          <button onClick={() => setConfirmReset(true)} className="h-9 w-9 rounded-xl border bg-secondary/40 text-muted-foreground border-border/40 flex items-center justify-center hover:text-destructive transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Hide sub-bar */}
        <AnimatePresence>
          {hideMode && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-t border-border/30">
              <div className="px-4 py-2 flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-[11px] text-muted-foreground flex-1">Tekan kartu untuk sembunyikan/tampilkan role</span>
                <button onClick={() => allHidden ? setHiddenPlayers(new Set()) : setHiddenPlayers(new Set(state.players.map((p) => p.id)))} className="text-[11px] px-3 py-1 rounded-lg bg-accent/15 text-accent font-semibold shrink-0">
                  {allHidden ? "Tampil Semua" : "Sembunyi Semua"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Timer floating bar */}
      <AnimatePresence>
        {timerActive && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="fixed bottom-[72px] inset-x-0 z-20 backdrop-blur-xl bg-background/90 border-t border-border/40">
            <div className="px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
              <TimerIcon className={`w-4 h-4 shrink-0 ${remaining <= 10 && running ? "text-destructive animate-pulse" : "text-accent"}`} />
              <div className={`font-mono text-2xl font-black tabular-nums min-w-[72px] ${remaining <= 10 && running ? "text-destructive" : "text-foreground"}`}>{fmt(remaining)}</div>
              <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${duration ? (remaining / duration) * 100 : 0}%` }} /></div>
              <div className="flex gap-1.5">
                {running ? <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={pauseTimer}><Pause className="w-4 h-4" /></Button> : <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-primary" onClick={resumeTimer}><Play className="w-4 h-4" /></Button>}
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground" onClick={resetTimer}><RotateCcw className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main grid ── */}
      <main className="px-3 py-4 mx-auto max-w-lg md:max-w-5xl">
        <AnimatePresence>
          {filterActive && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mb-3 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-muted-foreground">Filter:</span>
              {Array.from(selectedRoleFilter).map((rid) => { const info = roleLabelMap[rid]; if (!info) return null; return <span key={rid} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${info.team === "werewolf" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>{info.name}</span>; })}
              <button onClick={filterSelectAll} className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2">Reset</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">{visiblePlayers.length} pemain ditampilkan</span>
          <span className="text-[11px] text-muted-foreground">{totalAlive} masih hidup</span>
        </div>

        {/* 2 kolom mobile, 4 kolom desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {visiblePlayers.map((p, i) => {
              const isCurrentVoter = voteInProgress && currentVoter?.id === p.id;
              const hasVoted = voteInProgress && voterIdsWhoVoted.has(p.id);
              return (
                <PlayerCard
                  key={p.id}
                  p={p}
                  index={i}
                  hideMode={hideMode}
                  isHidden={hiddenPlayers.has(p.id)}
                  onToggleHide={() => toggleHidePlayer(p.id)}
                  onEliminate={() => handleEliminate(p)}
                  onNote={() => setNoteOpenId(p.id)}
                  voteActive={voteInProgress}
                  isCurrentVoter={isCurrentVoter}
                  hasVoted={hasVoted}
                  onVoteThis={
                    voteInProgress && currentVoter && p.alive
                      ? isCurrentVoter
                        // current voter taps own card = skip/lewati
                        ? () => requestVote(null, null)
                        // others = vote this player
                        : () => requestVote(p.id, p.name)
                      : undefined
                  }
                />
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Floating Vote Button (Bottom) ── */}
      <div className="fixed bottom-0 inset-x-0 z-10 px-4 pb-5 pt-3 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <motion.button
            onClick={voteFinished ? () => setVoteOpen(true) : voteInProgress ? undefined : startVote}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="relative w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-base text-white overflow-hidden shadow-2xl"
            style={{
              background: voteInProgress
                ? "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))"
                : voteFinished
                ? "linear-gradient(135deg, oklch(0.45 0.15 270), oklch(0.52 0.18 260))"
                : "linear-gradient(135deg, oklch(0.55 0.18 30), oklch(0.62 0.22 22))",
              boxShadow: voteInProgress
                ? "0 8px 32px oklch(0.55 0.18 30 / 0.5)"
                : voteFinished
                ? "0 8px 32px oklch(0.45 0.15 270 / 0.5)"
                : "0 8px 32px oklch(0.55 0.18 30 / 0.35)",
            }}
          >
            {/* Shine sweep effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
            />
            <Vote className="w-5 h-5 relative z-10 shrink-0" />
            <span className="relative z-10">
              {voteInProgress
                ? currentVoter
                  ? `Giliran ${currentVoter.name} (${voteSession.currentVoterIndex + 1}/${alivePlayers.length})`
                  : `Vote — ${voteSession.currentVoterIndex + 1} / ${alivePlayers.length}`
                : voteFinished
                ? "Lihat Hasil Vote"
                : "Mulai Vote"}
            </span>
            {(voteInProgress || voteFinished) && (
              <motion.span
                className="relative z-10 w-2.5 h-2.5 rounded-full bg-white/80"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} activeRoleIds={activeRoleIds} selectedRoles={selectedRoleFilter} onToggleRole={toggleRoleFilter} onSelectAll={filterSelectAll} onClearAll={filterClearAll} roleLabelMap={roleLabelMap} />

      {/* Vote History Panel */}
      <VoteHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} history={voteHistory} />

      {/* Timer Dialog */}
      <Dialog open={timerOpen} onOpenChange={setTimerOpen}>
        <DialogContent className="glass-strong rounded-3xl w-[calc(100%-2rem)] max-w-sm mx-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TimerIcon className="w-5 h-5 text-accent" /> Atur Timer</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-primary/20 text-primary" onClick={() => setMinutesPart(minutes + 1)} disabled={minutes >= 10}><Plus className="w-4 h-4" /></Button>
              <div className="font-mono text-5xl font-black tabular-nums w-[72px] text-center text-glow">{minutes.toString().padStart(2, "0")}</div>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-secondary/60" onClick={() => setMinutesPart(minutes - 1)} disabled={minutes <= 0}><Minus className="w-4 h-4" /></Button>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">menit</div>
            </div>
            <div className="font-mono text-5xl font-black text-muted-foreground pb-8">:</div>
            <div className="flex flex-col items-center gap-2">
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-primary/20 text-primary" onClick={() => setSecondsPart(seconds + 5)}><Plus className="w-4 h-4" /></Button>
              <div className="font-mono text-5xl font-black tabular-nums w-[72px] text-center text-glow">{seconds.toString().padStart(2, "0")}</div>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-secondary/60" onClick={() => setSecondsPart(seconds - 5)}><Minus className="w-4 h-4" /></Button>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">detik</div>
            </div>
          </div>
          <div className="space-y-3 px-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>Menit</span><span className="font-mono">{minutes}</span></div>
              <input type="range" min={0} max={10} value={minutes} onChange={(e) => setMinutesPart(Number(e.target.value))} className="w-full accent-primary h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>Detik</span><span className="font-mono">{seconds}</span></div>
              <input type="range" min={0} max={59} value={seconds} onChange={(e) => setSecondsPart(Number(e.target.value))} className="w-full accent-accent h-2" />
            </div>
          </div>
          <Button onClick={startTimer} disabled={duration <= 0} className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent disabled:opacity-40 mt-1"><Play className="w-4 h-4 mr-1" /> Mulai Timer</Button>
        </DialogContent>
      </Dialog>

      {/* Per-player note */}
      <Dialog open={!!noteTarget} onOpenChange={(o) => !o && setNoteOpenId(null)}>
        <DialogContent className="glass-strong rounded-3xl w-[calc(100%-2rem)] max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Catatan untuk {noteTarget?.name}</DialogTitle></DialogHeader>
          <Textarea autoFocus value={noteTarget?.note ?? ""} onChange={(e) => noteTarget && updatePlayer(noteTarget.id, { note: e.target.value })} placeholder="Dugaan, hasil investigasi, perilaku mencurigakan..." rows={5} className="resize-none rounded-xl bg-background/40" />
          <Button onClick={() => setNoteOpenId(null)} className="w-full h-11 rounded-2xl">Selesai</Button>
        </DialogContent>
      </Dialog>

      {/* Global notes */}
      <Dialog open={globalOpen} onOpenChange={setGlobalOpen}>
        <DialogContent className="glass-strong rounded-3xl w-[calc(100%-2rem)] max-w-sm mx-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><NotebookPen className="w-5 h-5 text-primary" /> Catatan Moderator</DialogTitle></DialogHeader>
          <Textarea autoFocus value={state.globalNotes} onChange={(e) => setGlobalNotes(e.target.value)} placeholder="Kejadian penting tiap malam, hasil voting, investigasi..." rows={8} className="resize-none rounded-xl bg-background/40" />
          <Button onClick={() => setGlobalOpen(false)} className="w-full h-11 rounded-2xl">Tutup</Button>
        </DialogContent>
      </Dialog>

      {/* Reset confirm */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="glass-strong rounded-3xl w-[calc(100%-2rem)] max-w-sm mx-auto border-destructive/30">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mb-2"><AlertTriangle className="w-7 h-7 text-destructive" /></div>
            <AlertDialogTitle className="text-center">Mengulang Permaianan?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">Permainan akan di reset jika keluar dari halaman ini</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl mt-0">Lanjut Bermain</AlertDialogCancel>
            <AlertDialogAction onClick={() => { try { localStorage.removeItem(LS_FILTER_KEY); localStorage.removeItem(LS_HIDDEN_KEY); localStorage.removeItem(LS_HIDE_MODE_KEY); localStorage.removeItem(LS_VOTE_KEY); localStorage.removeItem(LS_VOTE_HISTORY_KEY); } catch {} setVoteHistory(null); resetGame(); }} className="flex-1 h-12 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">Ulang Permaianan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}