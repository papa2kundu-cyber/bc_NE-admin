"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionHeadingProps {
  subtitle?: string;
  title: string | ReactNode;
  description?: string;
  center?: boolean;
  classNameT?: string;
  classNameDe?: string;
  classNameSu?: string;
}

const SectionHeading = ({
  classNameSu,
  classNameT,
  classNameDe,
  subtitle,
  title,
  description,
  center = true,
}: SectionHeadingProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`mb-4 ${center ? "text-center" : ""} group`}
    >
      {subtitle && (
        <span
          className={`text-primary font-medium text-sm uppercase tracking-widest mb-2 block ${classNameSu}`}
        >
          {subtitle}
        </span>
      )}
      <h2
        className={`font-heading text-4xl hover:text-[40px] duration-300 font-bold text-foreground hover:text-shadow-lg/30 ${classNameT}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed ${classNameDe}`}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
};

export default SectionHeading;
