import { SECTIONS, WPP_FIELDS, WPP_CLOSER, RULES, LINTS } from "./fields.js";
import { VENDORS, parseReply, buildRequest } from "./ai.js";

const STORE = "skeletor-bot-builder-v1";
const KEYSTORE = "skeletor-bot-builder-key";

const state = load() || {
  characters: [blankCharacter()],
  sideChars: [],
  embeds: [],
  rules: { rule21: true, perspective: false, isolation: false, texting: false },
  ai: { on: false, vendor: "anthropic", model: "", remember: false, instruction: "",
        baseUrl: "http://localhost:11434/v1" },
};
// Older saves held one character at the top level. Fold it into the list.
if (!state.characters) {
  state.characters = [{ values: state.values || {}, enhanced: state.enhanced || {}, choice: state.choice || {} }];
  delete state.values; delete state.enhanced; delete state.choice;
}
state.characters.forEach((c) => { c.values ||= {}; c.enhanced ||= {}; c.choice ||= {}; });
let who = 0;                       // which character is on screen

function blankCharacter(name = "") {
  return { values: name ? { first_name: name } : {}, enhanced: {}, choice: {} };
}
function current() { return state.characters[who] || state.characters[0]; }
function charName(index) {
  const c = state.characters[index];
  return (c.choice?.first_name === "ai" ? c.enhanced.first_name : c.values.first_name) || `Character ${index + 1}`;
}

let activeSection = "ai";   // step 0 — it changes how everything else is used
let apiKey = sessionStorage.getItem(KEYSTORE) || localStorage.getItem(KEYSTORE) || "";
let reviewChangedOnly = false;

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

/* ---------------------------------------------------------------- tooltip */
// Every label gets one. Hover or focus; on a phone, tap.
function tip(text) {
  const mark = el("button", "qmark", "?");
  mark.type = "button";
  mark.setAttribute("aria-label", text);
  const show = () => {
    hideTips();
    const bubble = el("div", "tipbubble show", text);
    document.body.append(bubble);            // on the body, so nothing clips it
    const box = mark.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    bubble.style.width = width + "px";
    let left = box.left + box.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    bubble.style.left = left + "px";
    const below = box.bottom + 8;
    if (below + bubble.offsetHeight > window.innerHeight - 70) {
      bubble.style.top = Math.max(12, box.top - bubble.offsetHeight - 8) + "px";
    } else {
      bubble.style.top = below + "px";
    }
    mark.classList.add("open");
  };
  mark.onclick = (e) => { e.preventDefault(); e.stopPropagation(); show(); };   // hover may have opened it already
  mark.onmouseenter = show;
  mark.onmouseleave = () => setTimeout(() => { if (!mark.matches(":hover")) hideTips(); }, 120);
  mark.onfocus = show;
  mark.onblur = hideTips;
  return mark;
}
function hideTips() {
  document.querySelectorAll(".tipbubble").forEach((b) => b.remove());
  document.querySelectorAll(".qmark.open").forEach((m) => m.classList.remove("open"));
}

const TIPS = {
  bible: "Your character's lore. This section is only used if you are using AI Assist — none of it is exported.",
  profile: "The block the chat model reads first. Short, concrete, observable. This is what keeps a character behaving like themselves.",
  psych: "Written like a profiler's assessment. It explains the why underneath the behaviour, which keeps the model consistent when a scene gets complicated.",
  facts: "Small hard details that need no explaining. Cheap to include and they make a character feel lived in.",
  side: "W++ sheets for characters who need depth but not a full build — big enough to matter, small enough not to be the lead.",
  embeds: "One-liners for throwaway characters. Defining them stops the model inventing someone inconsistent, and it lets a lorebook hook onto the name.",
  rules: "Optional blocks you paste with the card. Tick only the ones a build actually needs.",
  ai: "Optional. Write your bot in plain english, describe what you want in each of the previous sections, then run Enhance the card at the end. The AI takes all of your fields, reads what you wrote, and expands it. You do not use what it gives you as is — it is your starting point.",
  scenario: "The story around the character — how it is run, the acts, the world, and the part the player has to earn instead of being told.",
  review: "Your version and the AI's version, side by side. Nothing is replaced — you pick which one exports, field by field.",
  export: "The finished card, assembled in the formats from the guide. Copy it, or save it to carry on later.",
  lintflag: "Step 0 runs while you type: no child ages, no pre-adult words, nothing minor-coded. It checks every field, including anything the AI wrote.",
};

/* --------------------------------------------------------------- storage */
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} }
function load() { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } }

/* ------------------------------------------------------------ step 0 lint */
function lintText(text) {
  if (!text) return [];
  const hits = [];
  for (const rule of LINTS) {
    rule.re.lastIndex = 0;
    const found = [...text.matchAll(rule.re)].map((m) => m[0]);
    if (found.length) hits.push({ ...rule, found: [...new Set(found)] });
  }
  return hits;
}
function allLintHits() {
  const out = [];
  const scan = (label, text) => lintText(text).forEach((h) => out.push({ where: label, ...h }));
  state.characters.forEach((c, i) => {
    const prefix = state.characters.length > 1 ? `${charName(i)} · ` : "";
    for (const section of SECTIONS)
      for (const [id, label] of section.fields) {
        scan(prefix + label, c.values[id]);
        if (c.enhanced[id]) scan(`${prefix}${label} (AI version)`, c.enhanced[id]);
      }
  });
  state.sideChars.forEach((c, i) =>
    Object.entries(c).forEach(([k, v]) => scan(`Side character ${i + 1} · ${k}`, v)));
  state.embeds.forEach((e, i) => scan(`Embed ${i + 1}`, e));
  return out;
}

/* ----------------------------------------------------------------- export */
function chosen(id, character = current()) {
  return character.choice[id] === "ai" && character.enhanced[id]
    ? character.enhanced[id] : character.values[id];
}
function fieldLine(spec, value) {
  const [, , , opts = {}] = spec;
  if (!value || !value.trim()) return null;
  if (opts.perLine) {
    return value.split("\n").filter((l) => l.trim()).map((l) => `${opts.perLine}${l.trim()}`).join("\n");
  }
  if (opts.block) return `${opts.line}:\n${value.trim()}`;
  return `${opts.line}: ${value.trim()}`;
}
// Takes whatever they wrote and lands it in the embed shape from the guide:
// [Name — age:XX;gender:X;appearance:tag,tag. Personality sentences.]
function formatEmbed(raw) {
  let text = raw.trim().replace(/^\[|\]$/g, "").trim();
  if (/—\s*age:/i.test(text)) return `[${text}]`;          // already in shape
  const parts = text.split(/,\s*/);
  const name = (parts.shift() || "Name").trim();
  const age = (parts.find((p) => /^\d{1,3}$/.test(p.trim())) || "").trim();
  const gender = (parts.find((p) => /^(male|female|man|woman|other|nb|non-?binary)$/i.test(p.trim())) || "").trim();
  const used = new Set([age, gender]);
  const rest = parts.filter((p) => !used.has(p.trim()));
  const sentenceAt = rest.findIndex((p) => /[.!?]/.test(p));
  const tags = (sentenceAt === -1 ? rest : rest.slice(0, sentenceAt)).map((s) => s.trim()).filter(Boolean);
  const prose = sentenceAt === -1 ? "" : rest.slice(sentenceAt).join(", ").trim();
  const head = [name, age && `age:${age}`, gender && `gender:${gender.toLowerCase()}`,
                tags.length && `appearance:${tags.join(",")}`].filter(Boolean);
  return `[${head[0]} — ${head.slice(1).join(";")}${prose ? ". " + prose : "."}]`;
}

function buildExport() {
  const blocks = [];
  state.characters.forEach((character, index) => {
    const name = chosen("first_name", character) || charName(index);
    for (const section of SECTIONS) {
      if (!section.exported || section.scenario) continue;
      const lines = section.fields.map((f) => fieldLine(f, chosen(f[0], character))).filter(Boolean);
      if (!lines.length) continue;
      const [open, close] = section.wrap(name);
      blocks.push([open, ...lines, close].join("\n"));
    }
  });
  for (const character of state.sideChars) {
    const written = WPP_FIELDS.filter(([key]) => (character[key] || "").trim());
    if (!written.length) continue;
    const sheetName = character.Name || "Name";
    blocks.push([
      `[SystemNote: Below is ${sheetName}'s character sheet. You will portray ${sheetName} according to the information provided and interact with {{user}}. You will roleplay as ${sheetName} and any other non-{{user}} characters. You will never assume, portray, or take over as {{user}}'s character. Only {{user}} will roleplay as {{user}}.]`,
      "",
      `[character("${sheetName}")`,
      ...written.map(([key]) => `${key}("${character[key].trim().replace(/"/g, "'")}"),`),
      character.closer ? character.closer.trim() + "]" : "]",
    ].join("\n"));
  }
  const sc = SECTIONS.find((s) => s.scenario);
  const first = state.characters[0];
  const scenarioBits = [];
  const grab = (id) => (chosen(id, first) || "").trim();
  if (grab("how_to_run")) scenarioBits.push(`[How to run this story:\n${grab("how_to_run")}]`);
  if (grab("acts")) scenarioBits.push(grab("acts").split(/\n{2,}|\n(?=Act )/i).map((a) => `#${a.trim()}`).join("\n\n"));
  const world = [grab("world_setting") && `## Setting\n${grab("world_setting")}`,
                 grab("problem") && `## The problem\n${grab("problem")}`,
                 grab("conflict") && `## Sources of conflict\n${grab("conflict")}`].filter(Boolean);
  if (world.length) scenarioBits.push(`# World Profile\n${world.join("\n\n")}`);
  if (grab("gated")) scenarioBits.push(`{ABSOLUTELY CRITICAL INFORMATION BELOW IS ONLY KNOWN BY the characters directly involved and no one else. It is never confessed. Anything the player learns must be earned slowly, through physical evidence, overheard moments, contradictions caught side by side, or somebody else talking:\n${grab("gated")}\n}`);
  if (scenarioBits.length) blocks.push(scenarioBits.join("\n\n"));

  const embeds = state.embeds.filter((e) => e && e.trim()).map(formatEmbed);
  if (embeds.length) blocks.push(embeds.join("\n"));
  const rules = RULES.filter((r) => state.rules[r.id]).map((r) => r.text);
  if (rules.length) blocks.push(rules.join("\n\n"));
  return blocks.join("\n\n");
}

/* ----------------------------------------------------------------- steps */
const STEPS = [
  { id: "ai",       label: "AI assist",   tip: () => TIPS.ai, first: true },
  { id: "bible",    label: "Lore",        tip: () => TIPS.bible },
  { id: "profile",  label: "Personality", tip: () => TIPS.profile },
  { id: "psych",    label: "Psychology",  tip: () => TIPS.psych },
  { id: "side",     label: "Side cast",   tip: () => TIPS.side },
  { id: "embeds",   label: "Embeds",      tip: () => TIPS.embeds },
  { id: "scenario", label: "Scenario",    tip: () => TIPS.scenario },
  { id: "rules",    label: "Rules",       tip: () => TIPS.rules },
  { id: "review",   label: "Review",      tip: () => TIPS.review },
  { id: "export",   label: "Export",      tip: () => TIPS.export },
];

function stepDone(id) {
  const section = SECTIONS.find((s) => s.id === id);
  if (section) return state.characters.some((c) => section.fields.some((f) => (c.values[f[0]] || "").trim()));
  if (id === "side") return state.sideChars.length > 0;
  if (id === "embeds") return state.embeds.filter(Boolean).length > 0;
  if (id === "rules") return Object.values(state.rules).some(Boolean);
  if (id === "ai") return aiCount() > 0;
  if (id === "review") return state.characters.some((c) => Object.values(c.choice).includes("ai"));
  return false;
}

function stepCount(id) {
  const section = SECTIONS.find((s) => s.id === id);
  if (section) {
    const done = state.characters.reduce(
      (n, c) => n + section.fields.filter((f) => (c.values[f[0]] || "").trim()).length, 0);
    return `${done}/${section.fields.length * state.characters.length}`;
  }
  if (id === "side") return String(state.sideChars.length);
  if (id === "embeds") return String(state.embeds.filter(Boolean).length);
  if (id === "rules") return String(Object.values(state.rules).filter(Boolean).length);
  if (id === "ai") return aiCount() ? String(aiCount()) : "";
  if (id === "review") return aiCount() ? String(aiCount()) : "";
  return "";
}

function renderRail() {
  const rail = $("#rail");
  rail.innerHTML = "";
  STEPS.forEach((step, index) => {
    const pill = el("div", "pill" + (activeSection === step.id ? " on" : "") + (stepDone(step.id) ? " done" : ""));
    const go = el("button", "pillbtn");
    go.append(el("span", "pillnum", String(index)));
    go.append(el("span", "pilllabel", step.label));
    const count = stepCount(step.id);
    if (count) go.append(el("span", "pillcount", count));
    go.onclick = () => {
      const problem = ageProblem();
      if (problem && activeSection === "profile" && step.id !== "profile") return status(problem, true);
      activeSection = step.id; render();
    };
    pill.append(go);
    if (step.first) {
      const sw = el("button", "switch" + (state.ai.on ? " on" : ""));
      sw.type = "button";
      sw.title = "Turn AI assist on or off";
      sw.append(el("span", "switchtrack"));
      sw.append(el("span", "switchword", state.ai.on ? "on" : "off"));
      sw.onclick = (e) => { e.stopPropagation(); state.ai.on = !state.ai.on; save(); render(); };
      pill.append(sw);
    }
    pill.append(tip(step.tip()));
    rail.append(pill);
  });

  const index = STEPS.findIndex((s) => s.id === activeSection);
  $("#progress").textContent = `Step ${index} of ${STEPS.length - 1} · ${STEPS[index].label}`;
  const back = $("#back"), next = $("#next");
  back.disabled = index === 0;
  next.disabled = index === STEPS.length - 1;
  const leaving = () => {
    const problem = ageProblem();
    if (problem && activeSection === "profile") { status(problem, true); return false; }
    return true;
  };
  back.onclick = () => { if (leaving()) { activeSection = STEPS[Math.max(0, index - 1)].id; render(); } };
  next.onclick = () => { if (leaving()) { activeSection = STEPS[Math.min(STEPS.length - 1, index + 1)].id; render(); } };

  const hits = allLintHits();
  const flag = $("#lintflag");
  if (!hits.length) { flag.hidden = true; return; }
  flag.hidden = false;
  flag.className = "lintflag bad";
  flag.textContent = `${hits.length} to fix`;
  flag.onclick = () => { activeSection = "review"; render(); };
  flag.append(tip(TIPS.lintflag));
}

/* --------------------------------------------------------------- old nav */
function countFilled(section) {
  const done = section.fields.filter((f) => (current().values[f[0]] || "").trim()).length;
  return `${done}/${section.fields.length}`;
}
function aiCount() {
  return state.characters.reduce((n, c) => n + Object.values(c.enhanced).filter(Boolean).length, 0);
}

/* ---------------------------------------------------------------- fields */
function fieldBox(id, label, help, value, onInput, opts = {}) {
  const wrap = el("div", "field");
  const head = el("div", "fieldhead");
  head.append(el("label", null, label));
  head.append(tip(opts.tip || help));
  wrap.append(head);
  wrap.append(el("p", "help", help));
  const input = el("textarea");
  if (opts.short) input.rows = 1;
  if (opts.placeholder) input.placeholder = opts.placeholder;   // clears the moment they type
  input.value = value || "";
  input.oninput = (e) => {
    onInput(e.target.value);
    save();
    showLint(wrap, e.target.value);
    renderRail();
    if (id === "first_name") refreshChips();   // rename the tab as you type
  };
  wrap.append(input);
  showLint(wrap, value);
  return wrap;
}
function showLint(wrap, value) {
  wrap.querySelectorAll(".lint").forEach((n) => n.remove());
  for (const hit of lintText(value)) {
    const warn = el("p", "lint");
    warn.append(el("strong", null, `Step 0 — ${hit.label}: `));
    warn.append(document.createTextNode(`“${hit.found.join("”, “")}”. ${hit.why}`));
    wrap.append(warn);
  }
}

// Nobody leaves a step with an under-18 age on it.
function ageProblem() {
  for (let i = 0; i < state.characters.length; i++) {
    const raw = (state.characters[i].values.age || "").trim();
    if (!raw) continue;
    const numbers = raw.match(/\d{1,3}/g);
    if (!numbers) continue;
    const lowest = Math.min(...numbers.map(Number));
    if (lowest < 18) return `${charName(i)} is written as ${lowest}. Everyone in a card must be 18 or older — fix the age before moving on.`;
  }
  return "";
}

function sectionHeading(main, title, blurb, tipText) {
  const head = el("div", "sectionhead");
  head.append(el("h2", null, title));
  head.append(tip(tipText));
  main.append(head);
  if (blurb) main.append(el("p", "blurb", blurb));
}

// Keep the character tabs in step with the name field without a full redraw,
// which would steal focus mid-word.
function refreshChips() {
  const chips = document.querySelectorAll(".chips .chip:not(.add)");
  chips.forEach((chip, index) => { chip.textContent = charName(index); });
}

function castBar(main) {
  const bar = el("div", "castbar");
  const label = el("div", "rowlabel");
  label.append(el("label", null, `Characters in this build: ${state.characters.length}`));
  label.append(tip("Step 2 repeats for every character you add here — each one gets its own profile, psychological profile and facts. Add as many as the story needs."));
  bar.append(label);

  const chips = el("div", "chips");
  state.characters.forEach((c, index) => {
    const chip = el("button", "chip" + (index === who ? " on" : ""), charName(index));
    chip.onclick = () => { who = index; render(); };
    chips.append(chip);
  });
  const add = el("button", "chip add", "+ Add character");
  add.onclick = () => { state.characters.push(blankCharacter()); who = state.characters.length - 1; save(); render(); };
  chips.append(add);
  bar.append(chips);

  if (state.characters.length > 1) {
    const del = el("button", "mini danger", `Remove ${charName(who)}`);
    del.onclick = () => {
      if (!confirm(`Remove ${charName(who)} and everything written for them?`)) return;
      state.characters.splice(who, 1);
      who = Math.max(0, who - 1);
      save(); render();
    };
    bar.append(del);
  }
  if (state.characters.length > 6) {
    bar.append(el("p", "note", "That is a lot of full builds. Past a handful, models start blurring characters together — consider W++ side characters for the smaller ones."));
  }
  main.append(bar);
}

function renderSection(section) {
  const main = $("#main");
  sectionHeading(main, `${section.step} · ${section.title}`, section.blurb, TIPS[section.id]);
  if (!section.scenario) castBar(main);

  if (section.id === "psych") {
    const auto = el("label", "toggle bigtoggle");
    const box = el("input");
    box.type = "checkbox";
    box.checked = !!current().psychAuto;
    box.onchange = () => { current().psychAuto = box.checked; save(); render(); };
    auto.append(box, el("span", null, "Let the AI do this one for me"));
    const wrap = el("div", "card");
    wrap.append(auto);
    const why = el("div", "fieldhead");
    why.append(el("p", "help", "This is the hardest section to write. Leave it to the AI and it fills the whole profile from your lore and the personality you already wrote — you still see it in Review before it counts."));
    why.append(tip("Needs AI assist switched on at step 0. The fields stay empty here and get written when you run Enhance the card."));
    wrap.append(why);
    main.append(wrap);
    if (current().psychAuto) {
      main.append(el("p", "note", state.ai.on
        ? "Handing this section to the AI. Run Enhance the card when the rest is written."
        : "AI assist is off — switch it on at step 0, or untick this and write the section yourself."));
      return;
    }
  }
  if (state.characters.length > 1)
    main.append(el("p", "note", `Writing ${charName(who)} — character ${who + 1} of ${state.characters.length}.`));
  if (!section.exported) main.append(el("p", "note", "Not exported. This is yours to think in."));
  for (const [id, label, help, opts = {}] of section.fields) {
    main.append(fieldBox(id, label, help, current().values[id],
      (v) => { current().values[id] = v; }, opts));
  }
}

function renderSideChars() {
  const main = $("#main");
  sectionHeading(main, "Side characters (W++)",
    "So this is what I do when a character needs some depth but it doesn't need to hold steady for a long period of time. A side character. Big enough to need some depth, small enough to not be a main character.",
    TIPS.side);
  state.sideChars.forEach((character, index) => {
    const card = el("div", "card");
    const head = el("div", "cardhead");
    head.append(el("h3", null, character.Name || `Side character ${index + 1}`));
    const del = el("button", "mini danger", "Remove");
    del.onclick = () => { state.sideChars.splice(index, 1); save(); render(); };
    head.append(del);
    card.append(head);
    for (const [key, help] of WPP_FIELDS)
      card.append(fieldBox(`sc${index}.${key}`, key, help, character[key],
        (v) => { character[key] = v; }, { short: key.length < 12 }));
    card.append(fieldBox(`sc${index}.closer`, "Closing paragraph", WPP_CLOSER, character.closer,
      (v) => { character.closer = v; }));
    main.append(card);
  });
  const add = el("button", "go", "Add a side character");
  add.onclick = () => { state.sideChars.push({}); save(); render(); };
  main.append(add);
}

function renderEmbeds() {
  const main = $("#main");
  sectionHeading(main, "Character Embeds",
    "Okay but what if this is a throw away character, I want it to appear maybe once so it really doesn't need very much attention at all? Simply fill this out to define your very minor npc.",
    TIPS.embeds);
  main.append(el("p", "note", "[Name — age:XX;gender:X;appearance:tag,tag,tag,tag,tag,tag. One or two personality sentences.]"));
  state.embeds.forEach((value, index) => {
    const box = fieldBox(`embed${index}`, `Embed ${index + 1}`,
      "One line. Name, age, gender, appearance tags, then a sentence or two. Write it however you like — it gets formatted for you on export.",
      value, (v) => { state.embeds[index] = v; },
      { placeholder: "Mark, 34, male, tall, grey at the temples, work boots, always early. Runs the garage on the corner and talks to everyone like they already agreed with him." });
    const del = el("button", "mini danger", "Remove");
    del.onclick = () => { state.embeds.splice(index, 1); save(); render(); };
    $(".fieldhead", box).append(del);
    main.append(box);
  });
  const add = el("button", "go", "Add an embed");
  add.onclick = () => { state.embeds.push(""); save(); render(); };
  main.append(add);
}

function renderRules() {
  const main = $("#main");
  sectionHeading(main, "Rules", "These are optional rules I use on an as needed basis.", TIPS.rules);
  for (const rule of RULES) {
    const card = el("div", "card");
    const head = el("label", "toggle");
    const box = el("input");
    box.type = "checkbox";
    const locked = rule.id === "rule21";
    if (locked) { state.rules.rule21 = true; box.disabled = true; }
    box.checked = locked ? true : !!state.rules[rule.id];
    box.onchange = () => { state.rules[rule.id] = box.checked; save(); renderRail(); };
    head.append(box, el("span", null, rule.name));
    if (locked) head.append(el("span", "badge", "always on"));
    card.append(head);
    const why = el("div", "fieldhead");
    why.append(el("p", "help", rule.why));
    why.append(tip(`Ticking this adds the block below to the end of your exported card, word for word.`));
    card.append(why);
    card.append(el("pre", null, rule.text));
    main.append(card);
  }
}

/* -------------------------------------------------------------- ai panel */
function renderAI() {
  const main = $("#main");
  sectionHeading(main, "AI assist", null, TIPS.ai);
  const pitch = el("div", "card");
  pitch.append(el("p", "blurb",
    "Optional. Write your bot in plain english describe what you want in each of the previous sections then run Enhance the card at the end. The ai will take all of your fields, read what you wrote and then expand it."));
  pitch.append(el("p", "warnline",
    "You do not use what the AI assist gives you as is. Instead use it as your starting point — edit, rewrite, expand. If you publish a bot created entirely by AI, people WILL notice, and they will NOT have a good time."));
  main.append(pitch);

  if (!state.ai.on) {
    const off = el("div", "card");
    off.append(el("p", null, "AI assist is off. Turn it on with the checkbox beside “AI assist” in the sidebar."));
    main.append(off);
    return;
  }

  const card = el("div", "card");
  const vendorRow = row("Vendor", "Who runs the model. Your key goes straight to them from your browser — this page has no server to send it to.");
  const select = el("select");
  for (const [id, vendor] of Object.entries(VENDORS)) {
    const option = el("option", null, vendor.label);
    option.value = id;
    if (state.ai.vendor === id) option.selected = true;
    select.append(option);
  }
  select.onchange = () => { state.ai.vendor = select.value; state.ai.model = ""; save(); render(); };
  vendorRow.append(select);
  card.append(vendorRow);

  const vendor = VENDORS[state.ai.vendor];

  if (vendor.needsBaseUrl) {
    const urlRow = row("Server address", "The address your own server listens on. Ollama's default is http://localhost:11434/v1.");
    const url = el("input");
    url.placeholder = vendor.baseUrlHint;
    url.value = state.ai.baseUrl || vendor.baseUrlHint;
    url.oninput = () => { state.ai.baseUrl = url.value.trim(); save(); };
    urlRow.append(url);
    card.append(urlRow);
    const notes = el("ul", "setup");
    for (const line of vendor.setup) notes.append(el("li", null, line));
    card.append(notes);
  }

  const keyRow = row(vendor.keyOptional ? "API key (optional)" : "API key",
    "Kept in this browser only. Without “remember”, it is forgotten when you close the tab.");
  const key = el("input");
  key.type = "password";
  key.placeholder = vendor.keyHint;
  key.value = apiKey;
  key.oninput = () => { apiKey = key.value.trim(); storeKey(); };
  keyRow.append(key);
  card.append(keyRow);

  const remember = el("label", "toggle small");
  const rbox = el("input");
  rbox.type = "checkbox";
  rbox.checked = state.ai.remember;
  rbox.onchange = () => { state.ai.remember = rbox.checked; save(); storeKey(); };
  remember.append(rbox, el("span", null, "Remember the key on this device"));
  card.append(remember);

  if (vendor.keyUrl) {
    const link = el("p", "help");
    link.append(document.createTextNode("Get a key: "));
    const a = el("a", null, vendor.keyUrl);
    a.href = vendor.keyUrl; a.target = "_blank"; a.rel = "noreferrer";
    link.append(a);
    card.append(link);
  }

  const modelRow = row("Model", "Load the list to see what your key can reach, or type an id yourself.");
  const model = el("input");
  model.placeholder = vendor.fallbackModels[0] || "load the list, or type a model id";
  model.value = state.ai.model || vendor.fallbackModels[0] || "";
  model.oninput = () => { state.ai.model = model.value.trim(); save(); };
  modelRow.append(model);
  const list = el("button", "mini", "Load models");
  list.onclick = async () => {
    list.disabled = true; list.textContent = "Loading…";
    try {
      const ids = await vendor.listModels(apiKey, { baseUrl: state.ai.baseUrl });
      const picker = el("select");
      for (const id of ids) {
        const option = el("option", null, id);
        option.value = id;
        if (id === state.ai.model) option.selected = true;
        picker.append(option);
      }
      picker.onchange = () => { state.ai.model = picker.value; save(); };
      modelRow.replaceChild(picker, model);
      state.ai.model = state.ai.model || ids[0];
      save();
    } catch (err) {
      status(`Could not list models — ${err.message}`, true);
    } finally {
      list.disabled = false; list.textContent = "Load models";
    }
  };
  modelRow.append(list);
  card.append(modelRow);
  main.append(card);

  main.append(fieldBox("ai_instruction", "Anything to tell the model?",
    "Optional. Plain English. \"Keep her colder than I wrote her.\" \"She should read as tired, not sad.\"",
    state.ai.instruction, (v) => { state.ai.instruction = v; },
    { tip: "This rides along with your notes and your written fields. Leave it empty and the model just works from what you wrote." }));

  const ids = SECTIONS.filter((s) => s.exported).flatMap((s) => s.fields.map((f) => f[0]));
  const written = state.characters.reduce(
    (n, c) => n + ids.filter((id) => (c.values[id] || "").trim()).length, 0);

  const go = el("button", "go", "Enhance the card");
  go.onclick = () => enhanceAll(go);
  if (state.characters.length > 1)
    main.append(el("p", "note", `This will run once per character — ${state.characters.length} requests, one after another.`));
  main.append(go);
  main.append(el("p", "note",
    `${written} field${written === 1 ? "" : "s"} written so far. Nothing you typed is overwritten — the AI version lands beside yours in Review, and you choose which one exports.`));
}

function row(label, tipText) {
  const wrap = el("div", "row");
  const labelWrap = el("div", "rowlabel");
  labelWrap.append(el("label", null, label));
  labelWrap.append(tip(tipText));
  wrap.append(labelWrap);
  return wrap;
}

/* --------------------------------------------------------------- review */
function renderReview() {
  const main = $("#main");
  sectionHeading(main, "Review", "Your words on the left, the AI's on the right. Pick one per field — the one you pick is the one that exports.", TIPS.review);

  const hits = allLintHits();
  const check = el("div", "card" + (hits.length ? " warn" : ""));
  const checkHead = el("div", "fieldhead");
  checkHead.append(el("h3", null, hits.length
    ? `${hits.length} thing${hits.length > 1 ? "s" : ""} to fix before this card is safe to publish`
    : "Safety check passed"));
  checkHead.append(tip(TIPS.lintflag));
  check.append(checkHead);
  if (hits.length) {
    for (const hit of hits) {
      const line = el("p", "help");
      line.append(el("strong", null, `${hit.where}: `));
      line.append(document.createTextNode(`“${hit.found.join("”, “")}” — ${hit.why}`));
      check.append(line);
    }
  } else {
    check.append(el("p", "help", "No child ages, no pre-adult words, nothing minor-coded — checked across every field, including anything the AI wrote."));
  }
  main.append(check);

  const pairs = [];
  state.characters.forEach((character, index) => {
    for (const section of SECTIONS) {
      if (!section.exported) continue;
      for (const [id, label] of section.fields) {
        const mine = character.values[id] || "";
        const ai = character.enhanced[id] || "";
        if (!mine && !ai) continue;
        pairs.push({ id, label, mine, ai, section: section.title, character, index });
      }
    }
  });

  if (!pairs.some((p) => p.ai)) {
    const none = el("div", "card");
    none.append(el("p", null, "Nothing to compare yet. Turn on AI assist, then run “Enhance the card” — both versions will appear here."));
    const jump = el("button", "go", "Go to AI assist");
    jump.onclick = () => { activeSection = "ai"; render(); };
    none.append(jump);
    main.append(none);
    return;
  }

  const bar = el("div", "row buttons");
  const takeAll = el("button", "go", "Use every AI version");
  takeAll.onclick = () => { pairs.forEach((p) => p.ai && (p.character.choice[p.id] = "ai")); save(); render(); };
  const keepAll = el("button", "ghost", "Keep all of mine");
  keepAll.onclick = () => { pairs.forEach((p) => (p.character.choice[p.id] = "mine")); save(); render(); };
  const only = el("label", "toggle small");
  const onlyBox = el("input");
  onlyBox.type = "checkbox";
  onlyBox.checked = reviewChangedOnly;
  onlyBox.onchange = () => { reviewChangedOnly = onlyBox.checked; render(); };
  only.append(onlyBox, el("span", null, "Only show fields the AI changed"));
  bar.append(takeAll, keepAll, only);
  main.append(bar);

  let lastCharacter = -1;
  for (const pair of pairs) {
    const changed = pair.ai && pair.ai.trim() !== pair.mine.trim();
    if (reviewChangedOnly && !changed) continue;
    if (state.characters.length > 1 && pair.index !== lastCharacter) {
      lastCharacter = pair.index;
      main.append(el("h3", "castheading", charName(pair.index)));
    }
    const card = el("div", "card compare");
    const head = el("div", "fieldhead");
    head.append(el("h3", null, pair.label));
    head.append(tip(`From ${pair.section}. The version you pick here is the one that goes into the exported card.`));
    if (!pair.ai) head.append(el("span", "badge", "no AI version"));
    else if (!changed) head.append(el("span", "badge", "unchanged"));
    card.append(head);

    const cols = el("div", "cols");
    cols.append(versionCol(pair, "mine", "Yours", pair.mine));
    cols.append(versionCol(pair, "ai", "AI version", pair.ai));
    card.append(cols);
    main.append(card);
  }
}

function versionCol(pair, which, title, text) {
  const chosenNow = (pair.character.choice[pair.id] || "mine") === which;
  const col = el("div", "col" + (chosenNow ? " picked" : ""));
  const head = el("div", "colhead");
  head.append(el("strong", null, title));
  if (text) {
    const pick = el("button", "mini" + (chosenNow ? " on" : ""), chosenNow ? "In use" : "Use this");
    pick.onclick = () => { pair.character.choice[pair.id] = which; save(); render(); };
    head.append(pick);
  }
  col.append(head);
  const body = el("p", "coltext", text || "—");
  col.append(body);
  for (const hit of lintText(text)) {
    const warn = el("p", "lint");
    warn.append(el("strong", null, `Step 0 — ${hit.label}: `));
    warn.append(document.createTextNode(`“${hit.found.join("”, “")}”`));
    col.append(warn);
  }
  return col;
}

/* --------------------------------------------------------------- export */
function renderExport() {
  const main = $("#main");
  sectionHeading(main, "Export card", null, TIPS.export);
  const hits = allLintHits();
  if (hits.length) {
    const warn = el("div", "card warn");
    warn.append(el("h3", null, `${hits.length} unresolved safety check${hits.length > 1 ? "s" : ""}`));
    warn.append(el("p", "help", "Open Review to see each one in place."));
    const jump = el("button", "go", "Go to Review");
    jump.onclick = () => { activeSection = "review"; render(); };
    warn.append(jump);
    main.append(warn);
  }

  const aiPicked = state.characters.reduce((n, c) => n + Object.values(c.choice).filter((v) => v === "ai").length, 0);
  if (aiCount()) main.append(el("p", "note", `${aiPicked} field${aiPicked === 1 ? "" : "s"} exporting the AI version. Change any of them in Review.`));

  const text = buildExport();
  main.append(el("pre", "output", text || "Nothing written yet."));

  const buttons = el("div", "row buttons");
  const copy = el("button", "go", "Copy");
  copy.onclick = async () => {
    await navigator.clipboard.writeText(text);
    copy.textContent = "Copied";
    setTimeout(() => (copy.textContent = "Copy"), 1500);
  };
  const txt = el("button", "ghost", "Download .txt");
  txt.onclick = () => download(`${chosen("first_name") || "character"}.txt`, text);
  const json = el("button", "ghost", "Download .json");
  json.onclick = () => download(`${chosen("first_name") || "character"}.json`, JSON.stringify(state, null, 2));
  const wipe = el("button", "ghost danger", "Start over");
  wipe.onclick = () => {
    if (!confirm("Erase everything in this builder and start a new character?")) return;
    localStorage.removeItem(STORE);
    location.reload();
  };
  buttons.append(copy, txt, json, wipe);
  main.append(buttons);
  const note = el("div", "fieldhead");
  note.append(el("p", "help", "Downloads save to your device. The .json reloads into this builder later."));
  note.append(tip("The .txt is the card itself, ready to paste into the platform. The .json is a save file — it holds both versions of every field."));
  main.append(note);
}

/* ------------------------------------------------------------------ main */
function render() {
  const main = $("#main");
  main.innerHTML = "";
  renderRail();
  const section = SECTIONS.find((s) => s.id === activeSection);
  if (section) renderSection(section);
  else if (activeSection === "side") renderSideChars();
  else if (activeSection === "embeds") renderEmbeds();
  else if (activeSection === "rules") renderRules();
  else if (activeSection === "ai") renderAI();
  else if (activeSection === "review") renderReview();
  else renderExport();
  window.scrollTo(0, 0);
}

/* -------------------------------------------------------------- ai bridge */
function storeKey() {
  sessionStorage.setItem(KEYSTORE, apiKey);
  if (state.ai.remember) localStorage.setItem(KEYSTORE, apiKey);
  else localStorage.removeItem(KEYSTORE);
}
function status(message, bad = false) {
  const bar = $("#status");
  bar.textContent = message;
  bar.className = "status" + (bad ? " bad" : "") + (message ? " show" : "");
  if (message && !bad) setTimeout(() => { bar.className = "status"; }, 4000);
}

async function enhanceAll(button) {
  const vendor = VENDORS[state.ai.vendor];
  if (!apiKey && !vendor.keyOptional) return status("Add your API key first.", true);
  const model = state.ai.model || vendor.fallbackModels[0];
  if (!model) return status("Pick a model first.", true);

  const fieldIds = SECTIONS.filter((s) => s.exported).flatMap((s) => s.fields.map((f) => f[0]));
  const specs = SECTIONS.flatMap((s) => s.fields.map(([id, label, help]) => ({ id, label, help })));

  const anything = state.characters.some((c) => Object.values(c.values).some((v) => (v || "").trim()));
  if (!anything) return status("Write something first — the model works from your notes and fields.", true);

  button.disabled = true;
  const label = button.textContent;
  let written = 0;

  try {
    for (let index = 0; index < state.characters.length; index++) {
      const character = state.characters[index];
      const bible = {};
      for (const [id, fieldLabel] of SECTIONS[0].fields)
        if (character.values[id]) bible[fieldLabel] = character.values[id];
      const filled = {};
      for (const id of fieldIds) if (character.values[id]) filled[id] = character.values[id];
      if (!Object.keys(bible).length && !Object.keys(filled).length) continue;

      // Everyone else in the build, so the model writes them as one cast.
      const castNote = state.characters.length > 1
        ? `This build has ${state.characters.length} characters: ${state.characters.map((c, i) => charName(i)).join(", ")}. You are writing ${charName(index)} only.`
        : "";

      button.textContent = state.characters.length > 1
        ? `Writing ${charName(index)} (${index + 1}/${state.characters.length})…` : "Writing…";
      status(`Asking ${vendor.label} (${model}) for ${charName(index)}…`);

      const { system, user } = buildRequest({
        askedFor: fieldIds, fieldSpecs: specs, bible, current: filled,
        instruction: [castNote, state.ai.instruction].filter(Boolean).join("\n\n"),
      });
      const reply = await vendor.complete(apiKey, model, system, user, { baseUrl: state.ai.baseUrl });
      const { fields } = parseReply(reply);
      for (const [id, value] of Object.entries(fields)) {
        if (!fieldIds.includes(id) || !value || !String(value).trim()) continue;
        character.enhanced[id] = String(value).trim();
        if (!character.choice[id]) character.choice[id] = "mine";
        written++;
      }
      save();
    }
    if (!written) throw new Error("The model returned nothing usable.");
    activeSection = "review";
    render();
    status(`${written} field${written === 1 ? "" : "s"} written across ${state.characters.length} character${state.characters.length === 1 ? "" : "s"}. Yours are untouched — compare and pick.`);
  } catch (err) {
    status(err.message, true);
    save();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = el("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("click", (e) => { if (!e.target.closest(".qmark")) hideTips(); });
window.addEventListener("scroll", hideTips, true);
render();
