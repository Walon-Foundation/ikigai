// Injected as a blocking script in <head> so the correct theme applies before
// first paint — avoids a flash of the wrong theme. Mirrors the logic in
// theme-toggle.tsx but runs synchronously, not after hydration.
export function ThemeInit() {
  const script = `(function(){try{var s=localStorage.getItem("theme");var m=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var t=s||m;if(t==="dark"){document.documentElement.classList.add("dark")}document.documentElement.style.colorScheme=t;}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
