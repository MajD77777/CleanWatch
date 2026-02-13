
// admin-guard.js
(function () {
  // Mets TON mot de passe ici (attention: maj/min et caractères)
  const PASSWORD = "Majd2026!";

  // Si déjà ok dans cet onglet
  if (sessionStorage.getItem("cwAdminOK") === "1") return;

  const input = prompt("Admin access (password):");

  // si Cancel
  if (input === null) {
    alert("Access denied.");
    window.location.href = "index.html";
    return;
  }

  // IMPORTANT: trim() enlève espaces avant/après
  if (input.trim() === PASSWORD) {
    sessionStorage.setItem("cwAdminOK", "1");
    return;
  }

  alert("Access denied.");
  window.location.href = "index.html";
})();
