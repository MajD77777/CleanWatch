// CleanWatch - script.js (stable)

// 1) Fallback si data.json ne charge pas
const fallbackData = [
  {
    title: "Breaking Bad",
    type: "series",
    image: "breakingbad.jpg",
    seasons: [{ season: 1, episodes: [{ episode: 1, timestamps: [{ start: "00:12:32", end: "00:13:18", type: "nudity" }] }] }]
  },
  {
    title: "Game of Thrones",
    type: "series",
    image: "gameofthrones.jpg",
    seasons: [{ season: 1, episodes: [{ episode: 1, timestamps: [{ start: "00:12:00", end: "00:13:00", type: "nudity" }] }] }]
  }
];

let defaultData = [];     // chargé depuis data.json
let data = [];            // affiché (localStorage ou defaultData)
let currentCategory = "all";

// 2) Charge data.json -> remplit defaultData
async function initDefaultData() {
  try {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data.json not found");
    defaultData = await res.json();

    // Si data.json n'est pas un tableau, on force fallback
    if (!Array.isArray(defaultData)) defaultData = fallbackData;
  } catch (e) {
    console.warn("Impossible de charger data.json, fallback utilisé.", e);
    defaultData = fallbackData;
  }

  // 3) Après defaultData, on charge ce qu'on affiche
  data = loadCleanWatchData();
  showHomeSections();
}

// ✅ 4) Cette fonction manquait chez toi -> elle est OBLIGATOIRE
function loadCleanWatchData() {
  const saved = localStorage.getItem("cleanwatchData");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return defaultData; // sinon on affiche data.json
}

/* ===== Helpers ===== */
function matchesCategory(item) {
  return currentCategory === "all" || item.type === currentCategory;
}

/* ===== Category buttons ===== */
function setCategory(cat) {
  currentCategory = cat;

  document.querySelectorAll(".nav .navbtn").forEach(b => b.classList.remove("active"));
  const navButtons = document.querySelectorAll(".nav .navbtn");
  const map = { all: 0, series: 1, movie: 2 };
  if (navButtons[map[cat]]) navButtons[map[cat]].classList.add("active");

  const query = document.getElementById("searchInput").value.trim();
  if (query === "") showHomeSections();
  else search();
}

/* ===== Search ===== */
function search(forceShowAll = false) {
  const input = document.getElementById("searchInput");
  const query = input.value.trim().toLowerCase();

  const results = document.getElementById("results");
  results.innerHTML = "";

  data = loadCleanWatchData();

  if (query === "" && !forceShowAll) {
    showHomeSections();
    return;
  }

  const home = document.getElementById("homeSections");
  if (home) home.style.display = "none";

  let found = 0;

  data.forEach(item => {
    const titleMatch = forceShowAll || item.title.toLowerCase().includes(query);
    if (!titleMatch) return;
    if (!matchesCategory(item)) return;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="posterWrap">
        <img src="${item.image}">
        <span class="typeBadge ${item.type}">${item.type.toUpperCase()}</span>
      </div>
      <h3>${item.title}</h3>
    `;

    card.onclick = () => {
      localStorage.setItem("selectedMovie", JSON.stringify(item));
      window.location.href = "details.html";
    };

    results.appendChild(card);
    found++;
  });

  if (!forceShowAll && query !== "" && found === 0) {
    results.innerHTML = `<div class="notFound">Title not found</div>`;
  }
}

function searchLive() {
  const query = document.getElementById("searchInput").value.trim();
  if (query === "") {
    showHomeSections();
    return;
  }
  search();
}

function handleEnter(event) {
  if (event.key === "Enter") search();
}

/* ===== Home sections ===== */
function renderCardInto(container, item) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="posterWrap">
      <img src="${item.image}">
      <span class="typeBadge ${item.type}">${item.type.toUpperCase()}</span>
    </div>
    <h3>${item.title}</h3>
  `;

 card.onclick = () => {
  document.getElementById("loaderOverlay").classList.add("active");

  localStorage.setItem("selectedMovie", JSON.stringify(item));

  setTimeout(() => {
    window.location.href = "details.html";
  }, 300);
};


  container.appendChild(card);
}

function showHomeSections() {
  const home = document.getElementById("homeSections");
  const recentGrid = document.getElementById("recentGrid");
  const popularGrid = document.getElementById("popularGrid");
  const results = document.getElementById("results");

  if (home) home.style.display = "block";
  if (results) results.innerHTML = "";

  data = loadCleanWatchData();

  // Recently Added (localStorage)
  if (recentGrid) {
    recentGrid.innerHTML = "";

    const saved = localStorage.getItem("cleanwatchData");
    let recent = [];
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) recent = arr.slice(-6).reverse();
      } catch {}
    }

    recent = recent.filter(matchesCategory);

    if (recent.length === 0) {
      const label = currentCategory === "movie" ? "movies" : (currentCategory === "series" ? "series" : "titles");
      recentGrid.innerHTML = `<div class="row">No recent ${label} yet. Add some in Admin.</div>`;
    } else {
      recent.forEach(item => renderCardInto(recentGrid, item));
    }
  }

  // Popular Examples (data.json)
  if (popularGrid) {
    popularGrid.innerHTML = "";

    let examples = (defaultData || []).slice(0, 6);
    examples = examples.filter(matchesCategory);

    if (examples.length === 0) {
      const label = currentCategory === "movie" ? "movies" : (currentCategory === "series" ? "series" : "titles");
      popularGrid.innerHTML = `<div class="row">No popular ${label} to show.</div>`;
    } else {
      examples.forEach(item => renderCardInto(popularGrid, item));
    }
  }
}

/* ===== View all ===== */
function viewAllTitles() {
  currentCategory = "all";
  document.querySelectorAll(".nav .navbtn").forEach(b => b.classList.remove("active"));
  const navButtons = document.querySelectorAll(".nav .navbtn");
  if (navButtons[0]) navButtons[0].classList.add("active");

  document.getElementById("searchInput").value = "";
  search(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  initDefaultData();
});
