// 1) Fallback (si data.json ne charge pas)
const fallbackData = [
  {
    title: "Breaking Bad",
    type: "series",
    image: "breakingbad.jpg",
    seasons: [
      {
        season: 1,
        episodes: [
          {
            episode: 1,
            timestamps: [{ start: "00:12:32", end: "00:13:18", type: "nudity" }]
          }
        ]
      }
    ]
  },
  {
    title: "Game of Thrones",
    type: "series",
    image: "gameofthrones.jpg",
    seasons: [
      {
        season: 1,
        episodes: [
          {
            episode: 1,
            timestamps: [{ start: "00:12:00", end: "00:13:00", type: "nudity" }]
          }
        ]
      }
    ]
  }
];

// 2) defaultData = données officielles (chargées depuis data.json)
let defaultData = fallbackData;

async function loadDefaultData() {
  try {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data.json not found");
    const json = await res.json();

    // sécurité: on veut un tableau
    if (Array.isArray(json)) defaultData = json;
    else console.warn("data.json n'est pas un tableau. On garde fallbackData.");
  } catch (e) {
    console.warn("Impossible de charger data.json, utilisation fallbackData.", e);
  }
}


function loadCleanWatchData() {
  const saved = localStorage.getItem("cleanwatchData");
  if (saved) return JSON.parse(saved);
  return defaultData;
}

let data = loadCleanWatchData();
let currentCategory = "all";

/* ===== Helpers ===== */
function matchesCategory(item) {
  return currentCategory === "all" || item.type === currentCategory;
}

/* ===== Category buttons ===== */
function setCategory(cat) {
  currentCategory = cat;

  // Active state only for the 3 category buttons
  document.querySelectorAll(".nav .navbtn").forEach(b => b.classList.remove("active"));
  const navButtons = document.querySelectorAll(".nav .navbtn");
  const map = { all: 0, series: 1, movie: 2 };
  if (navButtons[map[cat]]) navButtons[map[cat]].classList.add("active");

  // If user is typing -> filter results, otherwise update home sections
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

  // reload data (admin updates)
  data = loadCleanWatchData();

  // If empty query and not forced -> show home
  if (query === "" && !forceShowAll) {
    showHomeSections();
    return;
  }

  // Hide home when searching or view all
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

  // Title not found (only when typing)
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
    localStorage.setItem("selectedMovie", JSON.stringify(item));
    window.location.href = "details.html";
  };

  container.appendChild(card);
}

function showHomeSections() {
  const home = document.getElementById("homeSections");
  const recentGrid = document.getElementById("recentGrid");
  const popularGrid = document.getElementById("popularGrid");
  const results = document.getElementById("results");

  // show home + clear results
  if (home) home.style.display = "block";
  if (results) results.innerHTML = "";

  // reload data
  data = loadCleanWatchData();

  // RECENTLY ADDED (from localStorage)
  if (recentGrid) {
    recentGrid.innerHTML = "";

    const saved = localStorage.getItem("cleanwatchData");
    let recent = [];
    if (saved) {
      const arr = JSON.parse(saved);
      recent = arr.slice(-6).reverse();
    }

    // ✅ Apply category filter here too
    recent = recent.filter(matchesCategory);

    if (recent.length === 0) {
      const label = currentCategory === "movie" ? "movies" : (currentCategory === "series" ? "series" : "titles");
      recentGrid.innerHTML = `<div class="row">No recent ${label} yet. Add some in Admin.</div>`;
    } else {
      recent.forEach(item => renderCardInto(recentGrid, item));
    }
  }

  // POPULAR EXAMPLES (from defaultData)
  if (popularGrid) {
    popularGrid.innerHTML = "";

    let examples = (defaultData || []).slice(0, 6);

    // ✅ Apply category filter here too
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
  // set category to all + active button
  currentCategory = "all";
  document.querySelectorAll(".nav .navbtn").forEach(b => b.classList.remove("active"));
  const navButtons = document.querySelectorAll(".nav .navbtn");
  if (navButtons[0]) navButtons[0].classList.add("active");

  document.getElementById("searchInput").value = "";

  // show all in results (hide home)
  search(true);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadDefaultData();     // charge data.json d'abord
  data = loadCleanWatchData(); // puis recharge data (localStorage ou defaultData)
  showHomeSections();          // puis affiche
});

