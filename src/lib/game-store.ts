import { useEffect, useState, useCallback } from "react";
import { ROLES } from "./roles";

export type Phase = "menu" | "setup" | "distribution" | "playing";

export interface Player {
  id: string;
  slotIndex: number;
  name: string;
  roleId: string;
  alive: boolean;
  note: string;
}

export type RoleCounts = Record<string, number>;

export interface GameState {
  phase: Phase;
  playerCount: number;
  roleCounts: RoleCounts;
  deck: string[];
  players: Player[];
  revealedToModerator: boolean;
  globalNotes: string;
}

const STORAGE_KEY = "werewolf-game";

function defaultRoleCounts(count: number): RoleCounts {
  const rc: RoleCounts = {};
  ROLES.forEach((r) => (rc[r.id] = 0));
  // sensible default for 6 players
  rc.werewolf = Math.max(1, Math.floor(count / 4));
  rc.seer = 1;
  rc.bodyguard = count >= 6 ? 1 : 0;
  const used = rc.werewolf + rc.seer + rc.bodyguard;
  rc.villager = Math.max(0, count - used);
  return rc;
}

const initialState: GameState = {
  phase: "menu",
  playerCount: 6,
  roleCounts: defaultRoleCounts(6),
  deck: [],
  players: [],
  revealedToModerator: false,
  globalNotes: "",
};

function load(): GameState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

const listeners = new Set<() => void>();
let state: GameState = initialState;
let hydrated = false;

function setState(updater: (s: GameState) => GameState) {
  state = updater(state);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function totalRoles(rc: RoleCounts): number {
  return Object.values(rc).reduce((a, b) => a + b, 0);
}

export function useGameStore() {
  const [, force] = useState(0);

  useEffect(() => {
    if (!hydrated) {
      state = load();
      hydrated = true;
    }
    const l = () => force((n) => n + 1);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);

  const setPhase = useCallback((phase: Phase) => setState((s) => ({ ...s, phase })), []);

  const goToSetup = useCallback(() =>
    setState((s) => ({
      ...initialState,
      phase: "setup",
      playerCount: s.playerCount || 6,
      roleCounts: defaultRoleCounts(s.playerCount || 6),
    })), []);

  const setPlayerCount = useCallback((n: number) =>
    setState((s) => ({ ...s, playerCount: n, roleCounts: defaultRoleCounts(n) })), []);

  const setRoleCount = useCallback((roleId: string, count: number) =>
    setState((s) => ({
      ...s,
      roleCounts: { ...s.roleCounts, [roleId]: Math.max(0, count) },
    })), []);

  const startDistribution = useCallback(() =>
    setState((s) => {
      const deck: string[] = [];
      Object.entries(s.roleCounts).forEach(([rid, c]) => {
        for (let i = 0; i < c; i++) deck.push(rid);
      });
      return {
        ...s,
        phase: "distribution",
        deck: shuffle(deck),
        players: [],
        revealedToModerator: false,
        globalNotes: "",
      };
    }), []);

  const claimSlot = useCallback((slotIndex: number, name: string): Player | null => {
    let claimed: Player | null = null;
    setState((s) => {
      if (s.players.find((p) => p.slotIndex === slotIndex)) return s;
      const roleId = s.deck[s.players.length];
      const player: Player = {
        id: crypto.randomUUID(),
        slotIndex,
        name,
        roleId,
        alive: true,
        note: "",
      };
      claimed = player;
      return { ...s, players: [...s.players, player] };
    });
    return claimed;
  }, []);

  const startPlaying = useCallback(() =>
    setState((s) => ({ ...s, phase: "playing", revealedToModerator: true })), []);

  const updatePlayer = useCallback((id: string, patch: Partial<Player>) =>
    setState((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })), []);

  const setGlobalNotes = useCallback((notes: string) =>
    setState((s) => ({ ...s, globalNotes: notes })), []);

  const resetGame = useCallback(() => setState(() => ({ ...initialState })), []);

  return {
    state,
    setPhase,
    goToSetup,
    setPlayerCount,
    setRoleCount,
    startDistribution,
    claimSlot,
    startPlaying,
    updatePlayer,
    setGlobalNotes,
    resetGame,
  };
}
