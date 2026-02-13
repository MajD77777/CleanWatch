const movie = JSON.parse(localStorage.getItem("selectedMovie"));
const details = document.getElementById("details");

let selectedSeason = null;
let selectedEpisode = null;
let activeFilter = "all";

if (!movie) {
  details.innerHTML = `<div class="row">No title selected. Go back to Home.</div>`;
} else {
  render();
}

function render() {
  details.innerHTML = `
    <div class="details-hero">
      <div class="details-poster">
        <img src="${movie.image}" alt="${movie.title}">
      </div>

      <div class="details-info">
        <div class="titleHeader">
  <h1>${movie.title}</h1>
  ${movie.year ? `<span class="yearTag">${movie.year}</span>` : ``}
</div>

<div class="titleMeta">
  ${(movie.genres || []).map(g => `<span class="metaChip">${g}</span>`).join("")}
</div>



<div class="breadcrumb" id="crumbs"></div>

        <div class="redNote">
          <b>NOTE:</b> Timestamps may vary between different versions (especially movies).
        </div>

        <div class="pills" id="seasonPills"></div>
        <div class="pills" id="episodePills"></div>
        <div class="pills" id="filterPills"></div>

        <div class="list" id="timestampList"></div>
      </div>
    </div>
  `;

  if (movie.type === "movie") {
    hideSeasonsEpisodes();
    renderFilters();
    renderTimestamps();
    return;
  }

  // ✅ Auto-select first season & episode (évite page "vide")
  const seasons = movie.seasons || [];
  if (seasons.length > 0) {
    if (selectedSeason === null) selectedSeason = seasons[0].season;

    const seasonObj = seasons.find(s => s.season === selectedSeason) || seasons[0];
    const episodes = seasonObj.episodes || [];
    if (episodes.length > 0 && selectedEpisode === null) {
      selectedEpisode = episodes[0].episode;
    }
  }

  renderSeasons();
  renderEpisodes();
  renderFilters();
  renderTimestamps();
}

function hideSeasonsEpisodes() {
  document.getElementById("seasonPills").innerHTML = "";
  document.getElementById("episodePills").innerHTML = "";
}

function renderSeasons() {
  const seasonPills = document.getElementById("seasonPills");
  seasonPills.innerHTML = "";

  (movie.seasons || []).forEach((s) => {
    const btn = document.createElement("div");
    btn.className = "pill" + (selectedSeason === s.season ? " active" : "");
    btn.textContent = `Season ${s.season}`;

    btn.onclick = () => {
      selectedSeason = s.season;
      selectedEpisode = null;
      activeFilter = "all";
      render();
    };

    seasonPills.appendChild(btn);
  });
}

function renderEpisodes() {
  const episodePills = document.getElementById("episodePills");
  episodePills.innerHTML = "";

  if (selectedSeason === null) return;

  const season = (movie.seasons || []).find((x) => x.season === selectedSeason);
  if (!season) return;

  (season.episodes || []).forEach((e) => {
    const btn = document.createElement("div");
    btn.className = "pill" + (selectedEpisode === e.episode ? " active" : "");
    btn.textContent = `Episode ${e.episode}`;

    btn.onclick = () => {
      selectedEpisode = e.episode;
      activeFilter = "all";
      render();
    };

    episodePills.appendChild(btn);
  });
}

function renderFilters() {
  const filters = document.getElementById("filterPills");
  filters.innerHTML = "";

  // séries: filtres visibles seulement après choix season+episode
  if (movie.type !== "movie" && (selectedSeason === null || selectedEpisode === null)) return;

  const types = ["all", "nudity", "kiss", "other"];

  types.forEach((type) => {
    const btn = document.createElement("div");
    btn.className = "pill" + (activeFilter === type ? " active" : "");
    btn.textContent = type.toUpperCase();

    btn.onclick = () => {
      activeFilter = type;
      renderTimestamps();
      renderFilters();
    };

    filters.appendChild(btn);
  });
}

function renderTimestamps() {
  const timestampList = document.getElementById("timestampList");
  timestampList.innerHTML = "";

  // séries: rien tant qu’on n’a pas choisi season+episode
  if (movie.type !== "movie" && (selectedSeason === null || selectedEpisode === null)) return;

  let timestampsArr = [];

  if (movie.type === "movie") {
    timestampsArr = movie.timestamps || [];
  } else {
    const season = (movie.seasons || []).find((x) => x.season === selectedSeason);
    if (!season) return;

    const episode = (season.episodes || []).find((x) => x.episode === selectedEpisode);
    if (!episode) return;

    timestampsArr = episode.timestamps || [];
  }

  if (timestampsArr.length === 0) {
  const msg = (movie.type === "movie")
    ? "No sensitive scenes reported for this movie."
    : "No sensitive scenes reported for this episode.";
  timestampList.innerHTML = `<div class="row emptyMsg">${msg}</div>`;
  return;
}


  let shown = 0;

  timestampsArr.forEach((t) => {
    // cas texte "00:10:00 - 00:11:00 Nudity"
    if (typeof t === "string") {
      const lower = t.toLowerCase();

      let type = "other";
      if (lower.includes("nudity")) type = "nudity";
      else if (lower.includes("kiss")) type = "kiss";

      if (activeFilter !== "all" && type !== activeFilter) return;

      const range = parseRangeFromText(t);
      let displayTime = t.replace(/nudity/ig, "").replace(/kiss/ig, "").trim();

      if (range) {
        displayTime = `${formatTime(range.start)} → ${formatTime(range.end)}`;
      }

      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <span class="badge ${type}">${type.toUpperCase()}</span>
        <span class="timeRange">${displayTime}</span>
      `;

      timestampList.appendChild(row);
      shown++;
      return;
    }

    // cas objet {start,end,type}
    if (typeof t === "object" && t !== null) {
      const type = (t.type || "other").toLowerCase();
      const start = t.start || "";
      const end = t.end || "";

      if (activeFilter !== "all" && type !== activeFilter) return;

      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <span class="badge ${type}">${type.toUpperCase()}</span>
        <span class="timeRange">${formatTime(start)} → ${formatTime(end)}</span>
      `;

      timestampList.appendChild(row);
      shown++;
    }
  });

  if (shown === 0) {
    timestampList.innerHTML = `<div class="row">No timestamps for this filter.</div>`;
  }
}

function formatTime(t) {
  const parts = (t || "").split(":").map(p => p.trim());

  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    if (hh === "00") return `${mm}:${ss}`;
    return `${hh}:${mm}:${ss}`;
  }

  if (parts.length === 2) {
    const [mm, ss] = parts;
    return `${mm}:${ss}`;
  }

  return t || "";
}

function parseRangeFromText(text) {
  const match = (text || "").match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function pageBack(e) {
  e.preventDefault();
  document.body.classList.add("pageExit");
  setTimeout(() => { window.location.href = "index.html"; }, 220);
}
function renderBreadcrumb(){
  const el = document.getElementById("crumbs");
  if(!el) return;

  // Movie breadcrumb
  if(movie.type === "movie"){
    el.innerHTML = `
      <a href="index.html" class="crumbLink">Home</a>
      <span class="sep">›</span>
      <span class="crumbCurrent">${movie.title}</span>
    `;
    return;
  }

  // Series breadcrumb
  const s = selectedSeason ? `Season ${selectedSeason}` : "Season";
  const e = selectedEpisode ? `Episode ${selectedEpisode}` : "Episode";

  el.innerHTML = `
    <a href="index.html" class="crumbLink">Home</a>
    <span class="sep">›</span>
    <span>${movie.title}</span>
    <span class="sep">›</span>
    <span>${s}</span>
    <span class="sep">›</span>
    <span class="crumbCurrent">${e}</span>
renderBreadcrumb();
  `;
}
