"use client";

import { usePathname } from "next/navigation";
import { type PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

/** Re-animates main content on route change. Keep /messages mounted so channel switches stay instant. */
export function PageTransition({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const transitionKey = pathname.startsWith("/messages") ? "/messages" : pathname;
  return (
    <div key={transitionKey} className="animate-page-enter">
      {children}
    </div>
  );
}

export function StaggerChildren({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("stagger-children", className)}>{children}</div>;
}

export function StaggerRows({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("stagger-rows", className)}>{children}</div>;
}

export function AnimateIn({
  children,
  className,
  variant = "fade-up",
  delay,
}: PropsWithChildren<{
  className?: string;
  variant?: "fade-up" | "fade-in" | "scale-in";
  delay?: number;
}>) {
  const variantClass = {
    "fade-up": "animate-in-fade-up",
    "fade-in": "animate-in-fade-in",
    "scale-in": "animate-in-scale-in",
  }[variant];

  return (
    <div
      className={cn(variantClass, className)}
      style={delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
