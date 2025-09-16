import { Variants } from "motion/react";
export const orderVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9,
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const,
    },
  },
};
