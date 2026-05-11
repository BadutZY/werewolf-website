import { Button } from "@/components/ui/button";
import { Moon, Play, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function MenuScreen({ onStart }: { onStart: () => void }) {
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 blur-3xl bg-primary/40 rounded-full" />
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-accent to-destructive flex items-center justify-center shadow-2xl shadow-primary/40">
            <Moon className="w-14 h-14 text-primary-foreground" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-black tracking-tight text-glow"
        >
          WEREWOLF
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.3em]"
        >
          One Device · Party Edition
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={onStart}
          className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30"
        >
          <Play className="w-5 h-5" /> Mulai Permainan
        </Button>
        <Button
          variant="outline"
          onClick={() => setHowOpen(true)}
          className="w-full h-14 text-base rounded-2xl border-border/60 bg-card/40 backdrop-blur"
        >
          <Info className="w-5 h-5" /> Cara Bermain
        </Button>
      </motion.div>

      <Dialog open={howOpen} onOpenChange={setHowOpen}>
        <DialogContent className="glass-strong rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cara Bermain</DialogTitle>
            <DialogDescription>
              Satu device dipakai bergantian.
            </DialogDescription>
          </DialogHeader>
          <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
            <li>Pilih jumlah pemain dan komposisi role.</li>
            <li>Device dioper ke setiap pemain.</li>
            <li>Pemain memilih kartu, isi nama, dan melihat role secara rahasia.</li>
            <li>Setelah semua selesai, device kembali ke moderator.</li>
            <li>Moderator memimpin permainan: tandai eliminasi & catat info penting.</li>
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  );
}
