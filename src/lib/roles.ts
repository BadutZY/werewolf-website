import seer from "@/assets/roles/seer.jpg";
import werewolf from "@/assets/roles/werewolf.png";
import villager from "@/assets/roles/villager.jpg";
import sorceress from "@/assets/roles/sorceress.jpg";
import loneWolf from "@/assets/roles/lone-wolf.jpg";
import spellcaster from "@/assets/roles/spellcaster.png";
import diseased from "@/assets/roles/diseased.png";
import prince from "@/assets/roles/prince.png";
import lycan from "@/assets/roles/lycan.png";
import bodyguard from "@/assets/roles/bodyguard.png";
import wolfCub from "@/assets/roles/wolf-cub.jpg";
import tanner from "@/assets/roles/tanner.jpg";

export type Team = "werewolf" | "village";

export interface Role {
  id: string;
  name: string;
  team: Team;
  description: string;
  image: string;
}

export const ROLES: Role[] = [
  // ── Main Role ─────────────────────────────────────────────
  {
    id: "werewolf",
    name: "Werewolf",
    team: "werewolf",
    image: werewolf,
    description:
      "Each night, wake with the other Werewolves and choose a player to eliminate.",
  },

  {
    id: "villager",
    name: "Villager",
    team: "village",
    image: villager,
    description:
      "You have no special ability. Find and eliminate the Werewolves.",
  },

  {
    id: "bodyguard",
    name: "Bodyguard",
    team: "village",
    image: bodyguard,
    description:
      "Each night, choose a player who cannot be eliminated that night.",
  },

  {
    id: "seer",
    name: "Seer",
    team: "village",
    image: seer,
    description:
      "Each night choose a player to learn if he is a Villager or a Werewolf.",
  },

  // ── Tambahan Role ─────────────────────────────────────────────

  {
    id: "lone-wolf",
    name: "Lone Wolf",
    team: "werewolf",
    image: loneWolf,
    description:
      "Each night, wake with the Werewolves. You only win if you are the last player in the game.",
  },

  {
    id: "wolf-cub",
    name: "Wolf Cub",
    team: "werewolf",
    image: wolfCub,
    description:
      "Each night, wake with the Werewolves. If you are eliminated, the Werewolves eliminate two players the following night.",
  },

  {
    id: "sorceress",
    name: "Sorceress",
    team: "werewolf",
    image: sorceress,
    description: "Each night, look for the Seer. You are on the werewolf team.",
  },

  {
    id: "spellcaster",
    name: "Spellcaster",
    team: "village",
    image: spellcaster,
    description:
      "Each night, choose a player who may not speak the following day.",
  },

  {
    id: "tanner",
    name: "Tanner",
    team: "village",
    image: tanner,
    description:
      "You hate your job and your life. You win if you are eliminated.",
  },

  {
    id: "prince",
    name: "Prince",
    team: "village",
    image: prince,
    description:
      "If you are voted to be eliminated, your role is revealed and you stay.",
  },

  {
    id: "diseased",
    name: "Diseased",
    team: "village",
    image: diseased,
    description:
      "If you are eliminated by Werewolves, they don't get to eliminate anyone the following night.",
  },

  {
    id: "lycan",
    name: "Lycan",
    team: "village",
    image: lycan,
    description: "You are a Villager, but appear to the Seer as a Werewolf.",
  },

];

export const getRole = (id: string): Role | undefined =>
  ROLES.find((r) => r.id === id);

export const getRolesByTeam = (team: Team): Role[] =>
  ROLES.filter((r) => r.team === team);
