import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";

export const SplashScreen: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      role="status"
      aria-label="Inicializando"
    >
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="text-center"
      >
        {/* Badge minimal com a cor do site */}
        <motion.div
          initial={reduceMotion ? false : { scale: 0.96 }}
          animate={reduceMotion ? {} : { scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl border border-primary/25 bg-primary/7 text-primary"
          // bg-primary/7 funciona bem como tinte suave; se preferir ainda mais leve, troque por /5
        >
          <Zap className="h-5 w-5" />
        </motion.div>

        {/* Wordmark + accent line sutil */}
        <div className="mx-auto w-max">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              FaeterjConnect
            </span>
          </h1>
          <motion.span
            className="mt-2 block h-[2px] w-16 sm:w-20 rounded-full bg-primary/35 mx-auto"
            style={{ transformOrigin: "50% 50%" }}
            initial={
              reduceMotion ? { opacity: 1 } : { opacity: 0.6, scaleX: 0 }
            }
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            aria-hidden="true"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
