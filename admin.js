function loadData(){
  const saved = localStorage.getItem("cleanwatchData");
  return saved ? JSON.parse(saved) : [];
}

function saveData(data){
  localStorage.setItem("cleanwatchData", JSON.stringify(data));
}

function showList(){
  const list = document.getElementById("list");
  const data = loadData();

  if(data.length === 0){
    list.innerHTML = "<p>No titles saved yet.</p>";
    return;
  }

  list.innerHTML = data.map((d, i) => `
    <div style="margin:12px 0;opacity:.95;padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:12px;">
      <b>${d.title}</b> (${d.type}) <br>
      <small>${d.image}</small><br>
<small>${d.genre ? d.genre : ""}${d.year ? " • " + d.year : ""}</small>

      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        <button onclick="loadTitle(${i})" style="background:#2563eb;">Edit</button>
        <button onclick="deleteTitle(${i})" style="background:#dc2626;">Delete</button>
      </div>
    </div>
  `).join("");
}


function saveTitle(){
  const title = document.getElementById("titleInput").value.trim();
  const type = document.getElementById("typeInput").value;
  const image = document.getElementById("imageInput").value.trim();
const genreSelect = document.getElementById("genreInput");
const genres = Array.from(genreSelect.selectedOptions).map(o => o.value);

const yearRaw = document.getElementById("yearInput").value.trim();
const year = yearRaw ? Number(yearRaw) : "";


  const seasonNum = Number(document.getElementById("seasonInput").value);
  const episodeNum = Number(document.getElementById("episodeInput").value);

  const raw = document.getElementById("timestampsInput").value;
  const timestamps = raw
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  const msg = document.getElementById("msg");

  if(!title || !image){
    msg.textContent = "Please fill Title and Image path.";
    return;
  }

  const data = loadData();

  // find or create item
  let item = data.find(x => x.title.toLowerCase() === title.toLowerCase());
  if(!item){
  if(!item){
  item = { title, type, image, genres: genres || [], year: year || "", seasons: [] };
  data.push(item);
}else{
  item.type = type;
  item.image = image;
  item.genres = genres || [];
  item.year = year || "";
}

  item.year = year || "";
}


  if(type === "series"){
    if(!seasonNum || !episodeNum){
      msg.textContent = "For a series, please add Season and Episode numbers.";
      saveData(data);
      showList();
      return;
    }

    let season = item.seasons.find(s => s.season === seasonNum);
    if(!season){
      season = { season: seasonNum, episodes: [] };
      item.seasons.push(season);
      item.seasons.sort((a,b)=>a.season-b.season);
    }

    let episode = season.episodes.find(e => e.episode === episodeNum);
    if(!episode){
      episode = { episode: episodeNum, timestamps: [] };
      season.episodes.push(episode);
      season.episodes.sort((a,b)=>a.episode-b.episode);
    }

    episode.timestamps = timestamps;
  } else {
    // movie
    item.timestamps = timestamps;
  }

  saveData(data);
  msg.textContent = "Saved!";
  showList();
}

function resetAll(){
  localStorage.removeItem("cleanwatchData");
  document.getElementById("msg").textContent = "All data cleared.";
  showList();
}

showList();
function loadTitle(index){
  const data = loadData();
  const item = data[index];
  if(!item) return;

  document.getElementById("titleInput").value = item.title;
  document.getElementById("typeInput").value = item.type;
  document.getElementById("imageInput").value = item.image;

  if(item.type === "series" && item.seasons?.length){
    const s = item.seasons[0];
    const e = s.episodes?.[0];

    document.getElementById("seasonInput").value = s.season;
    document.getElementById("episodeInput").value = e?.episode || 1;

    const ts = (e?.timestamps || []).map(x => {
      if(typeof x === "string") return x;
      if(typeof x === "object" && x) return `${x.start} - ${x.end} ${x.type}`;
      return "";
    }).filter(Boolean);

    document.getElementById("timestampsInput").value = ts.join("\n");
  } else {
    document.getElementById("seasonInput").value = "";
    document.getElementById("episodeInput").value = "";
    document.getElementById("timestampsInput").value = (item.timestamps || []).join("\n");
  }

  document.getElementById("msg").textContent = "Loaded. Edit fields then click Save.";
}

function deleteTitle(index){
  const data = loadData();
  const item = data[index];
  if(!item) return;

  const ok = confirm(`Delete "${item.title}" completely?`);
  if(!ok) return;

  data.splice(index, 1);
  saveData(data);
  showList();
  document.getElementById("msg").textContent = "Deleted.";
}
function exportData(){
  const data = loadData(); // uniquement tes données (cleanwatchData)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cleanwatch-data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  document.getElementById("msg").textContent = "Exported: cleanwatch-data.json";
}

function importData(event){
  const file = event.target.files && event.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try{
      const imported = JSON.parse(reader.result);

      if(!Array.isArray(imported)){
        alert("Invalid file: expected an array of titles.");
        return;
      }

      // Replace simple: on remplace TOUTES les données
      saveData(imported);

      document.getElementById("msg").textContent = "Imported successfully!";
      showList();
    }catch(e){
      alert("Invalid JSON file.");
    }
  };

  reader.readAsText(file);

  // reset input file pour pouvoir re-import le même fichier
  event.target.value = "";
}
