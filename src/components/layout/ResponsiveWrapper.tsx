"use client";

import { motion } from "framer-motion";
import { useResponsive } from "@/hooks/use-responsive";

interface ResponsiveWrapperProps {
  children: React.ReactNode;
}

export function ResponsiveWrapper({ children }: ResponsiveWrapperProps) {
  const { maxContentWidth } = useResponsive();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full min-h-screen flex flex-col"
      style={{ maxWidth: Math.min(maxContentWidth, 1920) }}
    >
      {children}
    </motion.div>
  );
}
