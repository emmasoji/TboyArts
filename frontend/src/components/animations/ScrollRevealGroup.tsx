import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type ScrollRevealGroupProps = {
  children: ReactNode;
  className?: string;
  amount?: number;
  delay?: number;
} & Omit<HTMLMotionProps<"div">, "children">;

export default function ScrollRevealGroup({
  children,
  className,
  amount = 0.12,
  delay = 0,
  ...props
}: ScrollRevealGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount,
        margin: "0px 0px -30px 0px",
      }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: 0.08,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
