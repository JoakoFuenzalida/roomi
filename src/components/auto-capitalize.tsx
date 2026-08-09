"use client";

import { useEffect } from "react";

export function AutoCapitalize() {
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        const type = target.getAttribute("type");
        if (
          type === "email" ||
          type === "password" ||
          type === "url" ||
          type === "number" ||
          type === "hidden"
        ) {
          return;
        }

        const val = target.value;
        if (val.length > 0) {
          const firstChar = val.charAt(0);
          const upper = firstChar.toUpperCase();
          
          if (firstChar !== upper) {
            const start = target.selectionStart;
            const end = target.selectionEnd;

            const proto = target.tagName === "INPUT" 
              ? window.HTMLInputElement.prototype 
              : window.HTMLTextAreaElement.prototype;
              
            const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
            
            if (setter) {
              setter.call(target, upper + val.slice(1));
              target.dispatchEvent(new Event("input", { bubbles: true }));
              
              if (start !== null && end !== null) {
                try {
                  target.setSelectionRange(start, end);
                } catch(e) {}
              }
            }
          }
        }
      }
    };

    document.addEventListener("input", handleInput, true);
    return () => document.removeEventListener("input", handleInput, true);
  }, []);

  return null;
}
