import { useEffect, type RefObject } from "react";

/** Closes an open dropdown/menu when a click lands outside its container ref. */
export function useClickOutside(ref: RefObject<HTMLElement | null>, setOpen: (open: boolean) => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, setOpen]);
}
