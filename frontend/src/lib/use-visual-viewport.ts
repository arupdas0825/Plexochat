"use client";

import { useState, useEffect } from "react";

export interface VisualViewportState {
  height: number;
  width: number;
  offsetTop: number;
  offsetLeft: number;
}

export function useVisualViewport(): VisualViewportState | null {
  const [viewport, setViewport] = useState<VisualViewportState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const update = () => {
      if (!window.visualViewport) return;
      setViewport({
        height: window.visualViewport.height,
        width: window.visualViewport.width,
        offsetTop: window.visualViewport.offsetTop || 0,
        offsetLeft: window.visualViewport.offsetLeft || 0,
      });
    };

    update();
    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  return viewport;
}
