"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Native scroll container (drop-in replacement for the Radix ScrollArea).
 *
 * Why native instead of Radix?
 * -----------------------------
 * The Radix `ScrollArea` component renders a custom scrollbar and uses
 * `touch-none` on the scrollbar track plus several internal wrappers. On
 * touch devices — and especially when the page is rendered inside an
 * embedded iframe (e.g. the chat preview panel) — Radix's viewport can
 * swallow wheel/touch events and the user is unable to scroll the
 * content. See: https://github.com/radix-ui/primitives/issues/924
 *
 * This implementation keeps the exact same public API (`<ScrollArea
 * className="max-h-[500px]">` + `<ScrollBar />`) but renders a plain
 * `<div>` with `overflow-y: auto`, which works reliably on iOS Safari,
 * Android Chrome, and inside iframes. Touch events are never
 * intercepted.
 */
function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="scroll-area"
      className={cn(
        "relative overflow-y-auto custom-scrollbar",
        // Smooth momentum scrolling on iOS
        "[-webkit-overflow-scrolling:touch]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Visual-only scrollbar customization hook.
 * Kept for backwards compatibility — consumers can still render
 * `<ScrollBar />` but it renders nothing because the native scrollbar
 * is already styled via the `.custom-scrollbar` class in globals.css.
 */
function ScrollBar(
  _props: React.ComponentProps<"div"> & {
    orientation?: "vertical" | "horizontal"
  }
) {
  return null
}

export { ScrollArea, ScrollBar }
