import { useEffect } from "react";

/** Seta --app-vh com base em visualViewport/innerHeight. */
export function useMobileVh(varName: string = "--app-vh") {
  useEffect(() => {
    const set = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      const vh = h * 0.01;
      document.documentElement.style.setProperty(varName, `${vh}px`);
    };
    set();
    window.visualViewport?.addEventListener("resize", set);
    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    return () => {
      window.visualViewport?.removeEventListener("resize", set as any);
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, [varName]);
}
