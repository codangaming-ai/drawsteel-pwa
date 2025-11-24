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
    victories: 0,

    // Attributes
    attributes: {
      might: 0,
      agility: 0,
      reason: 0,
      intuition: 0,
      presence: 0
    },

    // Potencies are derived; we also store them for display
    potencies: {
      weak: 0,
      average: 0,
      strong: 0
    },

    // Derived stats
    size: 0,
    speed: 0,
    disengage: 0,
    stability: 0,

    // Stamina
    staminaCurrent: 0,
    staminaTemp: 0,
    staminaMax: 0,
    winded: 0,
    dyingRange: "0–0",
    recoveries: 0,
    staminaPerRecovery: 0,
    recoveriesMax: 0,

    // Heroic Resource
    heroicName: "",
    heroicTokens: 0,

    // Surges
    surges: 0,

    // Modifiers
    modifiers: {
      augmentation: false,
      enchantment: false,
      kit: false,
      prayer: false,
      ward: false,
      name: "",
      weaponImplement: "",
      rangedDmgMod: 0,
      meleeDmgMod: 0,
      speedMod: 0,
      disengageMod: 0,
      stabilityMod: 0,
      staminaMod: 0,
      armor: ""
    },

    // Conditions
    conditions: {
      Bleeding: false,
      Dazed: false,
      Frightened: false,
      Grabbed: false,
      Restrained: false,
      Slowed: false,
      Taunted: false,
      Weakened: false,
      Prone: false
    },

    // Background / story
    careerDetail: {
      name: "",
      benefit: "",
      incitingIncident: ""
    },
    complication: {
      name: "",
      benefit: "",
      drawback: ""
    },
    cultureNotes: "",

    // Perks / titles / notes
    perks: "",
    titles: "",
    ancestryTraits: "",
    classFeatures: "",

    // Skills: store only known skills with category + notes
    skills: [], // { name, category, note }

    // Projects
    projects: [], // { name, assignedTo, rollCharacteristic, goalCurrent, goalTarget }

    // Inventory
    inventory: ""
  };
}

// ===============================
// Abilities Model
// ===============================
// Minimal ability schema for now
// { id, name, type, classTag, actionType, costHeroic, costSurges, staminaDelta, notes, conditionsAdd[], conditionsRemove[] }

function makeAbilityId() {
  return "ab_" + Math.random().toString(36).slice(2);
}

// ===============================
// Persistence
// ===============================
function loadCharacter() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      character = parsed;
      computePotencies();
      return;
    }
  } catch (e) {
    console.error("Failed to load character:", e);
  }
  character = makeDefaultCharacter();
  computePotencies();
}

function saveCharacter() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  } catch (e) {
    console.error("Failed to save character:", e);
  }
}

function loadAbilities() {
  try {
    const raw = localStorage.getItem(ABILITIES_KEY);
    if (raw) {
      abilities = JSON.parse(raw);
      return;
    }
  } catch (e) {
    console.error("Failed to load abilities:", e);
  }
  abilities = [];
}

function saveAbilities() {
  try {
    localStorage.setItem(ABILITIES_KEY, JSON.stringify(abilities));
  } catch (e) {
    console.error("Failed to save abilities:", e);
  }
}

// ===============================
// Derived Stats: Potencies
// ===============================
function computePotencies() {
  const attrs = character.attributes;
  const values = [
    attrs.might,
    attrs.agility,
    attrs.reason,
    attrs.intuition,
    attrs.presence
  ];
  const highest = Math.max(...values);
  character.potencies.weak = highest;
  character.potencies.average = highest + 1;
  character.potencies.strong = highest + 2;
}

// ===============================
// Class Filtering Logic
// ===============================
function applyClassChange(newClass) {
  character.class = newClass;

  // Strict filtering: remove abilities that don't match this classTag (and are not "Any")
  abilities = abilities.filter(
    (ab) => !ab.classTag || ab.classTag === newClass || ab.classTag === "Any"
  );
  saveAbilities();
}

// ===============================
// UI Helpers
// ===============================
function qs(sel) {
  return document.querySelector(sel);
}

function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// ===============================
// TAB SWITCHING
// ===============================
function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.getAttribute("data-screen");
      document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
      });
      qs("#" + target).classList.add("active");
    });
  });
}

// ===============================
// SHEET SCREEN RENDERING
// ===============================
function renderSheetScreen() {
  const container = qs("#sheet-container");
  const c = character;
  computePotencies();
  saveCharacter();

  container.innerHTML = "";

  // === CORE IDENTITY ===
  const panel = makeElement("div", "panel");
  panel.innerHTML = `
    <h2>Core Identity</h2>
    <div class="sheet-core">
      <div class="sheet-core-row sheet-core-name">
        <label>Character Name
          <input type="text" id="char-name" value="${c.name}">
        </label>
        <div class="sheet-core-level">
          <label>Level
            <input type="number" id="char-level" value="${c.level}">
          </label>
        </div>
      </div>

      <div class="sheet-core-row">
        <label>Ancestry
          <input type="text" id="char-ancestry" value="${c.ancestry}">
        </label>
        <label>Career
          <input type="text" id="char-career" value="${c.career}">
        </label>
      </div>

      <div class="sheet-core-row">
        <label>Class
          <input type="text" id="char-class" value="${c.class}">
        </label>
        <label>Subclass
          <input type="text" id="char-subclass" value="${c.subclass}">
        </label>
      </div>

      <div class="sheet-core-row">
        <label>Wealth
          <input type="number" id="char-wealth" value="${c.wealth}">
        </label>
        <label>Renown
          <input type="number" id="char-renown" value="${c.renown}">
        </label>
        <label>XP
          <input type="number" id="char-xp" value="${c.xp}">
        </label>
      </div>

      <div class="sheet-core-row">
        <div>
          <span class="victory-label">Victories</span>
          <div class="victory-row">
            <span id="victories-value" class="victory-value">${c.victories}</span>
            <button type="button" id="victories-plus" class="btn-secondary btn-small">+1</button>
            <button type="button" id="victories-reset" class="btn-secondary btn-small">Reset</button>
          </div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(panel);

  // === ATTRIBUTES & POTENCIES ===
    const attrsPanel = makeElement("div", "panel");
  attrsPanel.innerHTML = `
    <h2>Attributes & Potencies</h2>

    <label>Might
      <div class="attr-control">
        <button type="button" class="btn-secondary btn-small" data-attr="might" data-delta="-1">-</button>
        <input type="number" id="attr-might" value="${c.attributes.might}">
        <button type="button" class="btn-secondary btn-small" data-attr="might" data-delta="1">+</button>
      </div>
    </label>

    <label>Agility
      <div class="attr-control">
        <button type="button" class="btn-secondary btn-small" data-attr="agility" data-delta="-1">-</button>
        <input type="number" id="attr-agility" value="${c.attributes.agility}">
        <button type="button" class="btn-secondary btn-small" data-attr="agility" data-delta="1">+</button>
      </div>
    </label>

    <label>Reason
      <div class="attr-control">
        <button type="button" class="btn-secondary btn-small" data-attr="reason" data-delta="-1">-</button>
        <input type="number" id="attr-reason" value="${c.attributes.reason}">
        <button type="button" class="btn-secondary btn-small" data-attr="reason" data-delta="1">+</button>
      </div>
    </label>

    <label>Intuition
      <div class="attr-control">
        <button type="button" class="btn-secondary btn-small" data-attr="intuition" data-delta="-1">-</button>
        <input type="number" id="attr-intuition" value="${c.attributes.intuition}">
        <button type="button" class="btn-secondary btn-small" data-attr="intuition" data-delta="1">+</button>
      </div>
    </label>

    <label>Presence
      <div class="attr-control">
        <button type="button" class="btn-secondary btn-small" data-attr="presence" data-delta="-1">-</button>
        <input type="number" id="attr-presence" value="${c.attributes.presence}">
        <button type="button" class="btn-secondary btn-small" data-attr="presence" data-delta="1">+</button>
      </div>
    </label>

    <p>Potencies (auto-calculated from highest attribute):</p>
    <p>Weak: ${c.potencies.weak} | Average: ${c.potencies.average} | Strong: ${c.potencies.strong}</p>
  `;
  container.appendChild(attrsPanel);

  // === STAMINA & RESOURCES ===
  const staminaPanel = makeElement("div", "panel");
  staminaPanel.innerHTML = `
    <h2>Stamina & Resources</h2>
    <label>Stamina Current / Temp / Max
      <input type="number" id="stamina-current" value="${c.staminaCurrent}">
      <input type="number" id="stamina-temp" value="${c.staminaTemp}">
      <input type="number" id="stamina-max" value="${c.staminaMax}">
    </label>
    <label>Winded
      <input type="number" id="stamina-winded" value="${c.winded}">
    </label>
    <label>Dying Range
      <input type="text" id="stamina-dying" value="${c.dyingRange}">
    </label>
    <label>Recoveries / per / max
      <input type="number" id="recoveries" value="${c.recoveries}">
      <input type="number" id="recoveries-per" value="${c.staminaPerRecovery}">
      <input type="number" id="recoveries-max" value="${c.recoveriesMax}">
    </label>
    <label>Heroic Resource Name
      <input type="text" id="heroic-name" value="${c.heroicName}">
    </label>
    <label>Heroic Tokens
      <input type="number" id="heroic-tokens" value="${c.heroicTokens}">
    </label>
    <label>Surges
      <input type="number" id="surges" value="${c.surges}">
    </label>
  `;
  container.appendChild(staminaPanel);

  // === CONDITIONS ===
  const condPanel = makeElement("div", "panel");
  condPanel.innerHTML = `
    <h2>Conditions</h2>
    <div class="conditions-grid" id="conditions-grid"></div>
  `;
  container.appendChild(condPanel);

  const condGrid = qs("#conditions-grid");
  Object.keys(c.conditions).forEach((cond) => {
    const id = "cond-" + cond;
    const row = document.createElement("label");
    row.innerHTML = `
      <input type="checkbox" id="${id}" ${c.conditions[cond] ? "checked" : ""}>
      ${cond}
    `;
    condGrid.appendChild(row);
  });

  // === INVENTORY / FEATURES / TRAITS ===
  const invPanel = makeElement("div", "panel");
  invPanel.innerHTML = `
    <h2>Inventory / Features / Traits</h2>
    <label>Inventory
      <textarea id="inv-text">${c.inventory || ""}</textarea>
    </label>
    <label>Class Features
      <textarea id="features-text">${c.classFeatures || ""}</textarea>
    </label>
    <label>Ancestry Traits
      <textarea id="traits-text">${c.ancestryTraits || ""}</textarea>
    </label>
  `;
  container.appendChild(invPanel);

  // ==== ATTACH HANDLERS ====
  qs("#char-name").addEventListener("input", (e) => { character.name = e.target.value; saveCharacter(); });
  qs("#char-ancestry").addEventListener("input", (e) => { character.ancestry = e.target.value; saveCharacter(); });
  qs("#char-career").addEventListener("input", (e) => { character.career = e.target.value; saveCharacter(); });
  qs("#char-class").addEventListener("input", (e) => {
    applyClassChange(e.target.value);
    saveCharacter();
    renderAbilitiesScreen();
  });
  qs("#char-subclass").addEventListener("input", (e) => { character.subclass = e.target.value; saveCharacter(); });
  qs("#char-level").addEventListener("input", (e) => { character.level = parseInt(e.target.value || "1", 10); saveCharacter(); });

  qs("#char-wealth").addEventListener("input", (e) => { character.wealth = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#char-renown").addEventListener("input", (e) => { character.renown = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#char-xp").addEventListener("input", (e) => { character.xp = parseInt(e.target.value || "0", 10); saveCharacter(); });

  // Victories buttons (uses the UI you wired up earlier)
  const victoriesValueEl = qs("#victories-value");
  const victoriesPlusBtn = qs("#victories-plus");
  const victoriesResetBtn = qs("#victories-reset");

  victoriesPlusBtn.addEventListener("click", () => {
    character.victories = (character.victories || 0) + 1;
    saveCharacter();
    victoriesValueEl.textContent = character.victories;
  });

  victoriesResetBtn.addEventListener("click", () => {
    character.victories = 0;
    saveCharacter();
    victoriesValueEl.textContent = character.victories;
  });

  ["might","agility","reason","intuition","presence"].forEach((attr) => {
    const id = "attr-" + attr;
    qs("#" + id).addEventListener("input", (e) => {
      character.attributes[attr] = parseInt(e.target.value || "0", 10);
      computePotencies();
      saveCharacter();
      renderSheetScreen(); // re-render to update potency display
    });
  });

  // Plus / minus buttons for attributes
  document.querySelectorAll("button[data-attr]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const attr = btn.getAttribute("data-attr");
      const delta = parseInt(btn.getAttribute("data-delta"), 10) || 0;
      const current = character.attributes[attr] || 0;
      character.attributes[attr] = current + delta;
      computePotencies();
      saveCharacter();
      renderSheetScreen();
    });
  });

  qs("#stamina-current").addEventListener("input", (e) => { character.staminaCurrent = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#stamina-temp").addEventListener("input", (e) => { character.staminaTemp = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#stamina-max").addEventListener("input", (e) => { character.staminaMax = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#stamina-winded").addEventListener("input", (e) => { character.winded = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#stamina-dying").addEventListener("input", (e) => { character.dyingRange = e.target.value; saveCharacter(); });
  qs("#recoveries").addEventListener("input", (e) => { character.recoveries = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#recoveries-per").addEventListener("input", (e) => { character.staminaPerRecovery = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#recoveries-max").addEventListener("input", (e) => { character.recoveriesMax = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#heroic-name").addEventListener("input", (e) => { character.heroicName = e.target.value; saveCharacter(); });
  qs("#heroic-tokens").addEventListener("input", (e) => { character.heroicTokens = parseInt(e.target.value || "0", 10); saveCharacter(); });
  qs("#surges").addEventListener("input", (e) => { character.surges = parseInt(e.target.value || "0", 10); saveCharacter(); });

  Object.keys(c.conditions).forEach((cond) => {
    const id = "cond-" + cond;
    qs("#" + id).addEventListener("change", (e) => {
      character.conditions[cond] = e.target.checked;
      saveCharacter();
    });
  });

  qs("#inv-text").addEventListener("input", (e) => { character.inventory = e.target.value; saveCharacter(); });
  qs("#features-text").addEventListener("input", (e) => { character.classFeatures = e.target.value; saveCharacter(); });
  qs("#traits-text").addEventListener("input", (e) => { character.ancestryTraits = e.target.value; saveCharacter(); });
}

// ===============================
// BACKGROUND / SKILLS SCREEN
// ===============================
const ALL_SKILLS = [
  // category, name
  ["Crafting", "Alchemy"],
  ["Crafting", "Architecture"],
  ["Crafting", "Blacksmithing"],
  ["Crafting", "Carpentry"],
  ["Crafting", "Cooking"],
  ["Crafting", "Fletching"],
  ["Crafting", "Forgery"],
  ["Crafting", "Jewelry"],
  ["Crafting", "Mechanics"],
  ["Crafting", "Tailoring"],

  ["Exploration", "Climb"],
  ["Exploration", "Drive"],
  ["Exploration", "Endurance"],
  ["Exploration", "Gymnastics"],
  ["Exploration", "Heal"],
  ["Exploration", "Jump"],
  ["Exploration", "Lift"],
  ["Exploration", "Navigate"],
  ["Exploration", "Ride"],
  ["Exploration", "Swim"],

  ["Interpersonal", "Bargain"],
  ["Interpersonal", "Empathize"],
  ["Interpersonal", "Flirt"],
  ["Interpersonal", "Gamble"],
  ["Interpersonal", "Handle Animals"],
  ["Interpersonal", "Interrogate"],
  ["Interpersonal", "Intimidate"],
  ["Interpersonal", "Lead"],
  ["Interpersonal", "Lie"],
  ["Interpersonal", "Music / Performance"],
  ["Interpersonal", "Persuade"],
  ["Interpersonal", "Read Person"],

  ["Intrigue", "Alertness"],
  ["Intrigue", "Conceal Object"],
  ["Intrigue", "Disguise"],
  ["Intrigue", "Eavesdrop"],
  ["Intrigue", "Escape Artist"],
  ["Intrigue", "Hide"],
  ["Intrigue", "Pick Lock"],
  ["Intrigue", "Pick Pocket"],
  ["Intrigue", "Sabotage"],
  ["Intrigue", "Search"],
  ["Intrigue", "Sneak"],
  ["Intrigue", "Track"],

  ["Lore", "Culture"],
  ["Lore", "Criminal Underworld"],
  ["Lore", "History"],
  ["Lore", "Magic"],
  ["Lore", "Monsters"],
  ["Lore", "Nature"],
  ["Lore", "Psionics"],
  ["Lore", "Religion"],
  ["Lore", "Rumors"],
  ["Lore", "Society"],
  ["Lore", "Strategy"],
  ["Lore", "Timescape"]
];

function renderBackgroundScreen() {
  const container = qs("#background-container");
  const c = character;
  saveCharacter();

  container.innerHTML = "";

  // Career
  const careerPanel = makeElement("div", "panel");
  careerPanel.innerHTML = `
    <div class="collapse-header" data-collapse="career-body">
      <span>Career</span><span>▾</span>
    </div>
    <div id="career-body" class="collapse-body open">
      <label>Career Name
        <input type="text" id="career-name" value="${c.careerDetail.name}">
      </label>
      <label>Benefit
        <textarea id="career-benefit">${c.careerDetail.benefit}</textarea>
      </label>
      <label>Inciting Incident
        <textarea id="career-incident">${c.careerDetail.incitingIncident}</textarea>
      </label>
    </div>
  `;
  container.appendChild(careerPanel);

  // Complication
  const compPanel = makeElement("div", "panel");
  compPanel.innerHTML = `
    <div class="collapse-header" data-collapse="comp-body">
      <span>Complication</span><span>▾</span>
    </div>
    <div id="comp-body" class="collapse-body open">
      <label>Complication Name
        <input type="text" id="comp-name" value="${c.complication.name}">
      </label>
      <label>Benefit
        <textarea id="comp-benefit">${c.complication.benefit}</textarea>
      </label>
      <label>Drawback
        <textarea id="comp-drawback">${c.complication.drawback}</textarea>
      </label>
    </div>
  `;
  container.appendChild(compPanel);

  // Culture
  const cultPanel = makeElement("div", "panel");
  cultPanel.innerHTML = `
    <div class="collapse-header" data-collapse="culture-body">
      <span>Culture</span><span>▾</span>
    </div>
    <div id="culture-body" class="collapse-body open">
      <label>Environment
        <input type="text" id="culture-env" value="${c.culture.environment}">
      </label>
      <label>Organization
        <input type="text" id="culture-org" value="${c.culture.organization}">
      </label>
      <label>Upbringing
        <input type="text" id="culture-upb" value="${c.culture.upbringing}">
      </label>
      <label>Languages
        <textarea id="culture-lang">${c.culture.languages}</textarea>
      </label>
    </div>
  `;
  container.appendChild(cultPanel);

  // Perks
  const perksPanel = makeElement("div", "panel");
  perksPanel.innerHTML = `
    <div class="collapse-header" data-collapse="perks-body">
      <span>Perks</span><span>▾</span>
    </div>
    <div id="perks-body" class="collapse-body open">
      <textarea id="perks">${c.perks}</textarea>
    </div>
  `;
  container.appendChild(perksPanel);

  // Skills
  const skillsPanel = makeElement("div", "panel");
  skillsPanel.innerHTML = `
    <div class="collapse-header" data-collapse="skills-body">
      <span>Skills (${c.skills.length} known)</span><span>▾</span>
    </div>
    <div id="skills-body" class="collapse-body open">
      <div id="skills-known"></div>
      <button class="btn-primary" id="btn-add-skill">+ Acquire New Skill</button>
    </div>
  `;
  container.appendChild(skillsPanel);

  // Titles
  const titlesPanel = makeElement("div", "panel");
  titlesPanel.innerHTML = `
    <div class="collapse-header" data-collapse="titles-body">
      <span>Titles</span><span>▾</span>
    </div>
    <div id="titles-body" class="collapse-body open">
      <textarea id="titles">${c.titles}</textarea>
    </div>
  `;
  container.appendChild(titlesPanel);

  // Projects
  const projPanel = makeElement("div", "panel");
  projPanel.innerHTML = `
    <div class="collapse-header" data-collapse="projects-body">
      <span>Projects (${c.projects.length} active)</span><span>▾</span>
    </div>
    <div id="projects-body" class="collapse-body open">
      <div id="projects-table"></div>
      <button class="btn-primary" id="btn-add-project">+ Add Project</button>
    </div>
  `;
  container.appendChild(projPanel);

  // Collapse handlers
  container.querySelectorAll(".collapse-header").forEach((hdr) => {
    hdr.addEventListener("click", () => {
      const id = hdr.getAttribute("data-collapse");
      const body = qs("#" + id);
      body.classList.toggle("open");
    });
  });

  // Career handlers
  qs("#career-name").addEventListener("input", (e) => { c.careerDetail.name = e.target.value; saveCharacter(); });
  qs("#career-benefit").addEventListener("input", (e) => { c.careerDetail.benefit = e.target.value; saveCharacter(); });
  qs("#career-incident").addEventListener("input", (e) => { c.careerDetail.incitingIncident = e.target.value; saveCharacter(); });

  qs("#comp-name").addEventListener("input", (e) => { c.complication.name = e.target.value; saveCharacter(); });
  qs("#comp-benefit").addEventListener("input", (e) => { c.complication.benefit = e.target.value; saveCharacter(); });
  qs("#comp-drawback").addEventListener("input", (e) => { c.complication.drawback = e.target.value; saveCharacter(); });

  qs("#culture-env").addEventListener("input", (e) => { c.culture.environment = e.target.value; saveCharacter(); });
  qs("#culture-org").addEventListener("input", (e) => { c.culture.organization = e.target.value; saveCharacter(); });
  qs("#culture-upb").addEventListener("input", (e) => { c.culture.upbringing = e.target.value; saveCharacter(); });
  qs("#culture-lang").addEventListener("input", (e) => { c.culture.languages = e.target.value; saveCharacter(); });

  qs("#perks").addEventListener("input", (e) => { c.perks = e.target.value; saveCharacter(); });
  qs("#titles").addEventListener("input", (e) => { c.titles = e.target.value; saveCharacter(); });

  // Skills known
  renderKnownSkills();

  qs("#btn-add-skill").addEventListener("click", () => {
    showSkillAcquireModal();
  });

  // Projects
  renderProjectsTable();
  qs("#btn-add-project").addEventListener("click", () => {
    c.projects.push({ name: "", assignedTo: "", rollCharacteristic: "", goalCurrent: 0, goalTarget: 0 });
    saveCharacter();
    renderBackgroundScreen();
  });
}

function renderKnownSkills() {
  const container = qs("#skills-known");
  container.innerHTML = "";

  if (character.skills.length === 0) {
    container.textContent = "No skills known yet.";
    return;
  }

  character.skills.forEach((sk, index) => {
    const row = makeElement("div");
    const tag = makeElement("span", "skill-tag", `${sk.name} (${sk.category})`);
    const remove = makeElement("span", "remove-btn", "x");
    remove.addEventListener("click", () => {
      character.skills.splice(index, 1);
      saveCharacter();
      renderBackgroundScreen();
    });
    row.appendChild(tag);

    // Notes toggle
    const noteLabel = makeElement("div");
    noteLabel.innerHTML = `
      <label>Notes for ${sk.name}
        <textarea data-skill-note="${index}">${sk.note || ""}</textarea>
      </label>
    `;
    row.appendChild(remove);
    row.appendChild(noteLabel);
    container.appendChild(row);
  });

  container.querySelectorAll("textarea[data-skill-note]").forEach((ta) => {
    ta.addEventListener("input", (e) => {
      const idx = parseInt(e.target.getAttribute("data-skill-note"), 10);
      character.skills[idx].note = e.target.value;
      saveCharacter();
    });
  });
}

function showSkillAcquireModal() {
  const modal = qs("#confirm-modal");
  const title = qs("#confirm-title");
  const text = qs("#confirm-text");
  const optionsBox = qs("#confirm-options");
  const btnCancel = qs("#confirm-cancel");
  const btnApply = qs("#confirm-apply");

  title.textContent = "Acquire New Skill";
  text.textContent = "Search or pick a skill to add.";

  optionsBox.innerHTML = `
    <input type="text" id="skill-search" placeholder="Type to search skills...">
    <div id="skill-results"></div>
  `;

  const knownNames = new Set(character.skills.map((s) => s.name));

  const resultsBox = optionsBox.querySelector("#skill-results");
  function renderResults(filterText) {
    resultsBox.innerHTML = "";
    const f = (filterText || "").toLowerCase();
    ALL_SKILLS.forEach(([cat, name]) => {
      if (knownNames.has(name)) return;
      if (f && !name.toLowerCase().includes(f) && !cat.toLowerCase().includes(f)) return;
      const btn = makeElement("button", "btn-secondary", `${name} (${cat})`);
      btn.style.display = "block";
      btn.style.marginTop = "4px";
      btn.addEventListener("click", () => {
        character.skills.push({ name, category: cat, note: "" });
        saveCharacter();
        hideConfirmModal();
        renderBackgroundScreen();
      });
      resultsBox.appendChild(btn);
    });
    if (!resultsBox.innerHTML) {
      resultsBox.textContent = "No skills match.";
    }
  }

  renderResults("");

  optionsBox.querySelector("#skill-search").addEventListener("input", (e) => {
    renderResults(e.target.value);
  });

  btnCancel.onclick = () => {
    hideConfirmModal();
  };
  btnApply.onclick = () => {
    // No bulk apply, user picks one by clicking
    hideConfirmModal();
  };

  showConfirmModal();
}

function renderProjectsTable() {
  const container = qs("#projects-table");
  container.innerHTML = "";

  const c = character;

  if (c.projects.length === 0) {
    container.textContent = "No active projects.";
    return;
  }

  c.projects.forEach((p, idx) => {
    const block = makeElement("div");
    block.innerHTML = `
      <label>Project Name
        <input type="text" data-proj="name" data-index="${idx}" value="${p.name}">
      </label>
      <label>Assigned Hero/Follower
        <input type="text" data-proj="assignedTo" data-index="${idx}" value="${p.assignedTo}">
      </label>
      <label>Roll Characteristic
        <input type="text" data-proj="rollCharacteristic" data-index="${idx}" value="${p.rollCharacteristic}">
      </label>
      <label>Goal Points
        <input type="number" data-proj="goalCurrent" data-index="${idx}" value="${p.goalCurrent}">
        <input type="number" data-proj="goalTarget" data-index="${idx}" value="${p.goalTarget}">
      </label>
      <button class="btn-secondary" data-proj-remove="${idx}">Remove Project</button>
      <hr>
    `;
    container.appendChild(block);
  });

  container.querySelectorAll("input[data-proj]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"), 10);
      const field = e.target.getAttribute("data-proj");
      if (field === "goalCurrent" || field === "goalTarget") {
        character.projects[idx][field] = parseInt(e.target.value || "0", 10);
      } else {
        character.projects[idx][field] = e.target.value;
      }
      saveCharacter();
    });
  });

  container.querySelectorAll("button[data-proj-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-proj-remove"), 10);
      character.projects.splice(idx, 1);
      saveCharacter();
      renderBackgroundScreen();
    });
  });
}

// ===============================
// ABILITIES SCREEN
// ===============================
function renderAbilitiesScreen() {
  const container = qs("#abilities-container");
  container.innerHTML = "";

  // Ability creation form
  const addPanel = makeElement("div", "panel");
  addPanel.innerHTML = `
    <h2>Add Ability</h2>
    <label>Name
      <input type="text" id="new-ability-name">
    </label>
    <label>Type (e.g., Born, Signature, Heroic)
      <input type="text" id="new-ability-type">
    </label>
    <label>Action Type (e.g., Main Action, Free Strike)
      <input type="text" id="new-ability-action">
    </label>
    <label>Class Tag (leave blank for Any)
      <input type="text" id="new-ability-classTag">
    </label>
    <label>Cost Heroic Tokens
      <input type="number" id="new-ability-heroic" value="0">
    </label>
    <label>Cost Surges
      <input type="number" id="new-ability-surges" value="0">
    </label>
    <label>Stamina Delta (negative = take damage, positive = heal)
      <input type="number" id="new-ability-stamina" value="0">
    </label>
    <label>Conditions Added (comma-separated)
      <input type="text" id="new-ability-condAdd">
    </label>
    <label>Conditions Removed (comma-separated)
      <input type="text" id="new-ability-condRemove">
    </label>
    <label>Notes / Effect Text
      <textarea id="new-ability-notes"></textarea>
    </label>
    <button class="btn-primary" id="btn-add-ability">Add Ability</button>
  `;
  container.appendChild(addPanel);

  qs("#btn-add-ability").addEventListener("click", () => {
    const name = qs("#new-ability-name").value.trim();
    if (!name) return;
    const ab = {
      id: makeAbilityId(),
      name,
      type: qs("#new-ability-type").value.trim(),
      actionType: qs("#new-ability-action").value.trim(),
      classTag: qs("#new-ability-classTag").value.trim() || "Any",
      costHeroic: parseInt(qs("#new-ability-heroic").value || "0", 10),
      costSurges: parseInt(qs("#new-ability-surges").value || "0", 10),
      staminaDelta: parseInt(qs("#new-ability-stamina").value || "0", 10),
      conditionsAdd: splitCsv(qs("#new-ability-condAdd").value),
      conditionsRemove: splitCsv(qs("#new-ability-condRemove").value),
      notes: qs("#new-ability-notes").value
    };
    abilities.push(ab);
    saveAbilities();
    renderAbilitiesScreen();
  });

  // Ability list
  const listPanel = makeElement("div", "panel");
  listPanel.innerHTML = `<h2>Abilities</h2>`;
  container.appendChild(listPanel);

  if (abilities.length === 0) {
    const p = makeElement("p", null, "No abilities added yet. Use the form above to add your class abilities.");
    listPanel.appendChild(p);
  } else {
    abilities.forEach((ab) => {
      const card = makeElement("div", "ability-card");
      const header = makeElement("div", "ability-header");
      header.textContent = `${ab.name} ${ab.type ? "(" + ab.type + ")" : ""}`;
      const body = makeElement("div", "ability-body");
      body.innerHTML = `
        <p><strong>Action:</strong> ${ab.actionType || "—"}</p>
        <p><strong>Class Tag:</strong> ${ab.classTag}</p>
        <p><strong>Cost:</strong> ${ab.costHeroic} ${character.heroicName || "Heroic"} / ${ab.costSurges} Surges</p>
        <p><strong>Stamina Delta:</strong> ${ab.staminaDelta}</p>
        <p><strong>Conditions Add:</strong> ${(ab.conditionsAdd || []).join(", ") || "—"}</p>
        <p><strong>Conditions Remove:</strong> ${(ab.conditionsRemove || []).join(", ") || "—"}</p>
        <p><strong>Notes:</strong><br>${(ab.notes || "").replace(/\n/g, "<br>")}</p>
      `;
      const footer = makeElement("div", "ability-footer");
      const btnUse = makeElement("button", "btn-primary", "USE");
      btnUse.addEventListener("click", () => {
        showAbilityConfirm(ab);
      });
      const btnRemove = makeElement("button", "btn-secondary", "Remove");
      btnRemove.style.marginLeft = "8px";
      btnRemove.addEventListener("click", () => {
        abilities = abilities.filter((x) => x.id !== ab.id);
        saveAbilities();
        renderAbilitiesScreen();
      });
      footer.appendChild(btnUse);
      footer.appendChild(btnRemove);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      listPanel.appendChild(card);
    });
  }
}

function splitCsv(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ===============================
// Ability Confirmation Dialog
// ===============================
function showAbilityConfirm(ab) {
  const modal = qs("#confirm-modal");
  const title = qs("#confirm-title");
  const text = qs("#confirm-text");
  const optionsBox = qs("#confirm-options");
  const btnCancel = qs("#confirm-cancel");
  const btnApply = qs("#confirm-apply");

  title.textContent = `Use "${ab.name}"?`;
  text.textContent = "Select which effects to apply.";

  let html = "";

  if (ab.costHeroic) {
    html += `
      <label>
        <input type="checkbox" data-eff="heroic" checked>
        Spend ${ab.costHeroic} ${character.heroicName || "Heroic Tokens"}
      </label><br>
    `;
  }
  if (ab.costSurges) {
    html += `
      <label>
        <input type="checkbox" data-eff="surges" checked>
        Spend ${ab.costSurges} Surges
      </label><br>
    `;
  }
  if (ab.staminaDelta) {
    const signText = ab.staminaDelta > 0 ? "Gain" : "Lose";
    html += `
      <label>
        <input type="checkbox" data-eff="stamina" checked>
        ${signText} ${Math.abs(ab.staminaDelta)} Stamina
      </label><br>
    `;
  }
  (ab.conditionsAdd || []).forEach((cond) => {
    html += `
      <label>
        <input type="checkbox" data-eff="condAdd" data-cond="${cond}" checked>
        Apply condition: ${cond}
      </label><br>
    `;
  });
  (ab.conditionsRemove || []).forEach((cond) => {
    html += `
      <label>
        <input type="checkbox" data-eff="condRemove" data-cond="${cond}" checked>
        Remove condition: ${cond}
      </label><br>
    `;
  });

  if (!html) {
    html = "<p>No mechanical effects defined. This ability is reference-only.</p>";
  }

  optionsBox.innerHTML = html;

  btnCancel.onclick = () => {
    hideConfirmModal();
  };

  btnApply.onclick = () => {
    // Apply checked effects
    const checks = optionsBox.querySelectorAll("input[type='checkbox']");
    checks.forEach((cb) => {
      if (!cb.checked) return;
      const eff = cb.getAttribute("data-eff");
      if (eff === "heroic") {
        character.heroicTokens = Math.max(character.heroicTokens - ab.costHeroic, 0);
      } else if (eff === "surges") {
        character.surges = Math.max(character.surges - ab.costSurges, 0);
      } else if (eff === "stamina") {
        character.staminaCurrent += ab.staminaDelta;
        if (character.staminaCurrent < 0) character.staminaCurrent = 0;
        if (character.staminaMax && character.staminaCurrent > character.staminaMax) {
          character.staminaCurrent = character.staminaMax;
        }
      } else if (eff === "condAdd") {
        const cond = cb.getAttribute("data-cond");
        if (character.conditions[cond] !== undefined) {
          character.conditions[cond] = true;
        }
      } else if (eff === "condRemove") {
        const cond = cb.getAttribute("data-cond");
        if (character.conditions[cond] !== undefined) {
          character.conditions[cond] = false;
        }
      }
    });

    saveCharacter();
    hideConfirmModal();
    renderSheetScreen();
  };

  showConfirmModal();
}

function showConfirmModal() {
  qs("#confirm-modal").classList.remove("hidden");
}

function hideConfirmModal() {
  qs("#confirm-modal").classList.add("hidden");
}

// ===============================
// CHARACTER BUILDER WIZARD
// ===============================
function renderBuilderScreen() {
  const container = qs("#builder-container");
  container.innerHTML = "";

  const stepPanel = makeElement("div", "builder-step");
  let contentHtml = "";

  if (currentBuilderStep === 0) {
    contentHtml = `
      <h2>Step 1: Core Identity</h2>
      <label>Character Name
        <input type="text" id="builder-name" value="${character.name}">
      </label>
      <label>Ancestry
        <input type="text" id="builder-ancestry" value="${character.ancestry}">
      </label>
    `;
  } else if (currentBuilderStep === 1) {
    contentHtml = `
      <h2>Step 2: Career & Complication</h2>
      <label>Career Name
        <input type="text" id="builder-career-name" value="${character.careerDetail.name}">
      </label>
      <label>Complication Name
        <input type="text" id="builder-comp-name" value="${character.complication.name}">
      </label>
    `;
  } else if (currentBuilderStep === 2) {
    contentHtml = `
      <h2>Step 3: Class & Subclass</h2>
      <label>Class
        <input type="text" id="builder-class" value="${character.class}">
      </label>
      <label>Subclass
        <input type="text" id="builder-subclass" value="${character.subclass}">
      </label>
    `;
  } else if (currentBuilderStep === 3) {
    contentHtml = `
      <h2>Step 4: Attributes</h2>
      <label>Might
        <input type="number" id="builder-might" value="${character.attributes.might}">
      </label>
      <label>Agility
        <input type="number" id="builder-agility" value="${character.attributes.agility}">
      </label>
      <label>Reason
        <input type="number" id="builder-reason" value="${character.attributes.reason}">
      </label>
      <label>Intuition
        <input type="number" id="builder-intuition" value="${character.attributes.intuition}">
      </label>
      <label>Presence
        <input type="number" id="builder-presence" value="${character.attributes.presence}">
      </label>
    `;
  } else if (currentBuilderStep === 4) {
    contentHtml = `
      <h2>Step 5: Starting Skills</h2>
      <p>You can add starting skills later on the Background tab. For now, just confirm you'd like to finish.</p>
    `;
  } else if (currentBuilderStep === 5) {
    computePotencies();
    contentHtml = `
      <h2>Step 6: Confirm Character</h2>
      <p><strong>Name:</strong> ${character.name}</p>
      <p><strong>Ancestry:</strong> ${character.ancestry}</p>
      <p><strong>Career:</strong> ${character.careerDetail.name}</p>
      <p><strong>Complication:</strong> ${character.complication.name}</p>
      <p><strong>Class/Subclass:</strong> ${character.class} / ${character.subclass}</p>
      <p><strong>Attributes:</strong>
        M ${character.attributes.might}, 
        A ${character.attributes.agility}, 
        R ${character.attributes.reason}, 
        I ${character.attributes.intuition}, 
        P ${character.attributes.presence}
      </p>
      <p><strong>Potencies:</strong> Weak ${character.potencies.weak}, Average ${character.potencies.average}, Strong ${character.potencies.strong}</p>
      <p>When you are satisfied, you can switch to the Sheet tab and start playing.</p>
    `;
  }

  stepPanel.innerHTML = contentHtml;
  container.appendChild(stepPanel);

  // Progress dots
  const dots = makeElement("div", "progress-dots");
  const totalSteps = 6;
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement("span");
    if (i === currentBuilderStep) dot.classList.add("active");
    dots.appendChild(dot);
  }
  container.appendChild(dots);

  // Navigation buttons
  const nav = makeElement("div", "builder-nav");
  const btnBack = makeElement("button", "btn-secondary", "Back");
  const btnNext = makeElement("button", "btn-primary", currentBuilderStep === totalSteps - 1 ? "Finish" : "Next");

  btnBack.disabled = currentBuilderStep === 0;

  btnBack.addEventListener("click", () => {
    saveBuilderStepInputs();
    if (currentBuilderStep > 0) currentBuilderStep--;
    renderBuilderScreen();
  });

  btnNext.addEventListener("click", () => {
    saveBuilderStepInputs();
    if (currentBuilderStep < totalSteps - 1) {
      currentBuilderStep++;
      if (currentBuilderStep === 2) {
        // Applying class change when entering class step confirm
        applyClassChange(character.class);
        saveCharacter();
      }
      renderBuilderScreen();
    } else {
      // Finished
      saveCharacter();
      // Switch to Sheet tab
      document.querySelector('.tab-btn[data-screen="sheet-screen"]').click();
      renderSheetScreen();
    }
  });

  nav.appendChild(btnBack);
  nav.appendChild(btnNext);
  container.appendChild(nav);
}

function saveBuilderStepInputs() {
  if (currentBuilderStep === 0) {
    character.name = qs("#builder-name").value;
    character.ancestry = qs("#builder-ancestry").value;
  } else if (currentBuilderStep === 1) {
    character.careerDetail.name = qs("#builder-career-name").value;
    character.complication.name = qs("#builder-comp-name").value;
  } else if (currentBuilderStep === 2) {
    applyClassChange(qs("#builder-class").value);
    character.subclass = qs("#builder-subclass").value;
  } else if (currentBuilderStep === 3) {
    character.attributes.might = parseInt(qs("#builder-might").value || "0", 10);
    character.attributes.agility = parseInt(qs("#builder-agility").value || "0", 10);
    character.attributes.reason = parseInt(qs("#builder-reason").value || "0", 10);
    character.attributes.intuition = parseInt(qs("#builder-intuition").value || "0", 10);
    character.attributes.presence = parseInt(qs("#builder-presence").value || "0", 10);
    computePotencies();
  }
  saveCharacter();
}

// ===============================
// INIT
// ===============================
function init() {
  loadCharacter();
  loadAbilities();
  setupTabs();
  renderSheetScreen();
  renderBackgroundScreen();
  renderAbilitiesScreen();
  renderBuilderScreen();
}

document.addEventListener("DOMContentLoaded", init);