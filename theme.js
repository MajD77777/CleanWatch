const SUN_ICON = `
<svg class="themeIcon" viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="5" fill="currentColor"/>
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="12" y1="2" x2="12" y2="5"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="5" y2="12"/>
    <line x1="19" y1="12" x2="22" y2="12"/>
    <line x1="4.9" y1="4.9" x2="6.9" y2="6.9"/>
    <line x1="17.1" y1="17.1" x2="19.1" y2="19.1"/>
    <line x1="4.9" y1="19.1" x2="6.9" y2="17.1"/>
    <line x1="17.1" y1="6.9" x2="19.1" y2="4.9"/>
  </g>
</svg>
`;

const MOON_ICON = `
<svg class="themeIcon" viewBox="0 0 24 24" aria-hidden="true">
  <defs>
    <mask id="moon-mask">
      <rect width="24" height="24" fill="white"/>
      <circle cx="15" cy="9" r="7" fill="black"/>
    </mask>
  </defs>
  <circle cx="12" cy="12" r="7" fill="currentColor" mask="url(#moon-mask)"/>
</svg>
`;

function setThemeButtonUI(savedTheme) {
  const btn = document.getElementById("themeBtn");
  if (!btn) return;

  // accessibilité + look
  btn.classList.add("iconBtn");

  if (savedTheme === "light") {
    // en light → clic passe en dark → icône lune
    btn.innerHTML = MOON_ICON;
    btn.setAttribute("aria-label", "Switch to dark mode");
    btn.setAttribute("title", "Dark mode");
  } else {
    // en dark → clic passe en light → icône soleil
    btn.innerHTML = SUN_ICON;
    btn.setAttribute("aria-label", "Switch to light mode");
    btn.setAttribute("title", "Light mode");
  }
}

function applyTheme() {
  const saved = localStorage.getItem("cwTheme") || "dark";
  document.body.classList.toggle("light", saved === "light");
  setThemeButtonUI(saved);
}

function toggleTheme() {
  const current = localStorage.getItem("cwTheme") || "dark";
  const next = (current === "dark") ? "light" : "dark";
  localStorage.setItem("cwTheme", next);
  applyTheme();
}

document.addEventListener("DOMContentLoaded", function(){
  applyTheme();
});

