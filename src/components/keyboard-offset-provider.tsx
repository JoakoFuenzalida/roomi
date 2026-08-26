"use client";
import { useEffect } from "react";

export function KeyboardOffsetProvider() {
  useEffect(() => {
    if (!window.visualViewport) return;
    
    const updateOffset = () => {
      // Calculate how much the visual viewport has shrunk from the window inner height
      // This is exactly the keyboard height on mobile browsers.
      const offset = window.innerHeight - window.visualViewport!.height;
      const topOffset = window.visualViewport!.offsetTop;
      document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, offset - topOffset)}px`);
    };
    
    window.visualViewport.addEventListener('resize', updateOffset);
    window.visualViewport.addEventListener('scroll', updateOffset);
    updateOffset();
    
    return () => {
      window.visualViewport?.removeEventListener('resize', updateOffset);
      window.visualViewport?.removeEventListener('scroll', updateOffset);
    };
  }, []);
  
  return null;
}
