import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type ScrollRevealItemProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
} & Omit<HTMLMotionProps<"div">, "children">;

export default function ScrollRevealItem({
  children,
  className,
  y = 24,
  duration = 0.65,
  ...props
}: ScrollRevealItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          y,
          scale: 0.98,
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
