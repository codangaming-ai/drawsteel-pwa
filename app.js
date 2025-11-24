// ===============================
// Draw Steel Character Sheet App
// ===============================

// ----- Storage keys -----
const STORAGE_KEY = "drawsteelCharacterV1";
const ABILITIES_KEY = "drawsteelAbilitiesV1";

// ----- Global app state -----
let character = null;
let abilities = [];
let currentBuilderStep = 0;

// ===============================
// Character Model
// ===============================
function makeDefaultCharacter() {
  return {
    name: "",
    ancestry: "",
    career: "",
    class: "",
    subclass: "",
    culture: {
      environment: "",
      organization: "",
      upbringing: "",
      languages: ""
    },
    level: 1,
    wealth: 0,
    renown: 0,
    xp: 0,
    victories: 0
  };
}

// ===============================
// Storage
// ===============================
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  localStorage.setItem(ABILITIES_KEY, JSON.stringify(abilities));
}

function loadState() {
  const c = localStorage.getItem(STORAGE_KEY);
  const a = localStorage.getItem(ABILITIES_KEY);

  character = c ? JSON.parse(c) : makeDefaultCharacter();
  abilities = a ? JSON.parse(a) : [];

  renderCharacter();
}

// ===============================
// Modal System
// ===============================
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

function openModal(title, html) {
  modalTitle.textContent = title;
  modalContent.innerHTML = html;
  document.body.classList.add("no-scroll");
  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  document.body.classList.remove("no-scroll");
  modalOverlay.classList.add("hidden");
}

modalClose.addEventListener("click", closeModal);

// ===============================
// Victories & XP Conversion
// ===============================
function addVictory() {
  character.victories++;
  saveState();
  renderCharacter();
}

function restAndConvertVictories() {
  const gained = character.victories;

  character.xp += gained;
  character.victories = 0;

  saveState();
  renderCharacter();

  openModal(
    "Rest Complete",
    `<p>You rested and converted <b>${gained}</b> victories into XP.</p>`
  );
}

// ===============================
// Abilities
// ===============================
function showAddAbility() {
  const html = `
    <label>Ability Name:</label><br>
    <input id="newAbilityName" type="text" /><br><br>
    <label>Description:</label><br>
    <textarea id="newAbilityDesc" rows="4"></textarea><br><br>

    <button onclick="addAbility()">Add Ability</button>
  `;

  openModal("Add Ability", html);
}

function addAbility() {
  const name = document.getElementById("newAbilityName").value.trim();
  const desc = document.getElementById("newAbilityDesc").value.trim();

  if (!name) return;

  abilities.push({ name, desc });

  saveState();
  closeModal();
  renderCharacter();
}

// ===============================
// Rendering
// ===============================
function renderCharacter() {
  document.getElementById("charName").textContent = character.name || "Unnamed";
  document.getElementById("charXP").textContent = character.xp;
  document.getElementById("charVictories").textContent = character.victories;

  // Render abilities
  const list = document.getElementById("abilitiesList");
  list.innerHTML = "";

  abilities.forEach((ab, i) => {
    const el = document.createElement("div");
    el.className = "abilityItem";
    el.innerHTML = `<b>${ab.name}</b><br><span>${ab.desc}</span>`;
    list.appendChild(el);
  });
}

// ===============================
// Startup
// ===============================
window.onload = loadState;
