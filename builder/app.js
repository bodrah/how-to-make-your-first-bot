import { SECTIONS, WPP_FIELDS, WPP_CLOSER, RULES, LINTS, HOW_TO_RUN , TRACKERS , MANDATORY_TRACKER , TAG_GROUPS , TAG_LIMIT } from "./fields.js?v=7ae476dc";
import { VENDORS, buildFileRequest } from "./ai.js?v=7ae476dc";
import { makeZip, textBytes } from "./zip.js?v=7ae476dc";
import { embedCard, toPngBytes } from "./png.js?v=7ae476dc";

const STORE = "skeletor-bot-builder-v1";
const KEYSTORE = "skeletor-bot-builder-key";

const state = load() || {
  characters: [blankCharacter()],
  sideChars: [],
  acts: [{ title: "", text: "" }, { title: "", text: "" }, { title: "", text: "" }, { title: "", text: "" }],
  embeds: [],
  rules: { rule21: true, perspective: false, isolation: false, texting: false },
  trackers: {},
  ai: { on: false, vendor: "anthropic", model: "", remember: false, instruction: "",
        baseUrl: "http://localhost:11434/v1" },
};
// Older saves held one character at the top level. Fold it into the list.
if (!state.characters) {
  state.characters = [{ values: state.values || {}, enhanced: state.enhanced || {}, choice: state.choice || {} }];
  delete state.values; delete state.enhanced; delete state.choice;
}
state.characters.forEach((c) => { c.values ||= {}; c.enhanced ||= {}; c.choice ||= {}; });
state.sideChars ||= [];
state.embeds ||= [];
state.acts ||= [];
state.rules ||= { rule21: true };
state.rules.rule21 = true;            // the always-21 rule cannot be turned off
state.trackers ||= {};
state.tags ||= {};
// Tags picked from an older list are not tags any more — drop them rather
// than quietly exporting a word the sites do not know.
{
  const known = new Set(TAG_GROUPS.flatMap((g) => g.tags));
  let dropped = false;
  for (const name of Object.keys(state.tags)) if (!known.has(name)) { delete state.tags[name]; dropped = true; }
  if (dropped) localStorage.setItem(STORE, JSON.stringify(state));
}
state.aiBlocks ||= {};
state.ai ||= { on: false, vendor: "anthropic", model: "", remember: false, instruction: "",
               baseUrl: "http://localhost:11434/v1" };
TRACKERS.filter((t) => t.mandatory).forEach((t) => { state.trackers[t.id] = true; });
// Four acts is the shape of the method; older saves get topped up to four.
while (state.acts.length < 4) state.acts.push({ title: "", text: "" });
let who = 0;                       // which character is on screen

function blankCharacter(name = "") {
  return { values: name ? { first_name: name } : {}, enhanced: {}, choice: {} };
}
function current() { return state.characters[who] || state.characters[0]; }
function charName(index) {
  const c = state.characters[index];
  return (c.choice?.first_name === "ai" ? c.enhanced.first_name : c.values.first_name) || `Character ${index + 1}`;
}

let activeSection = state.ai.on ? "ai" : "bible";
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
  greeting: "The opening message — what the player reads before they type anything. Your trackers get appended to the end of it on export.",
  trackers: "The little status lines the bot prints under every reply. Tick the ones this card should show the player.",
  systems: "A collection of rules and trackers that work together, for things like RPGs. Currently in development.",
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
function promoted() {
  return SECTIONS.flatMap((s) => s.fields).filter((f) => (f[3] || {}).always);
}

function fieldLine(spec, value) {
  const [, , , opts = {}] = spec;
  if (!value || !value.trim() || opts.cardOnly) return null;
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

// The greeting as it ships: their own opening, then the trackers they ticked,
// so the first message already shows the state the card keeps.
function aiBlock(rule) {
  const written = (state.aiBlocks || {})[rule.id];
  return state.ai.on && written ? written : rule.text;
}

// What each act is for, so a blank one comes back as its own beat rather than
// the whole story crammed into the first box.
const ACT_BEATS = [
  "how it starts and what pulls {{user}} in",
  "the first real escalation, where it stops being simple",
  "the point of no return, the thing that cannot be undone",
  "what it costs, and where the story is left standing",
];

function greetingOut(character) {
  const own = (chosen("greeting", character) || "").trim();
  if (!own) return "";
  const lines = TRACKERS.filter((t) => state.trackers[t.id] && t.greeting)
    .map((t) => `---\n\n${t.greeting}`);
  return lines.length ? `${own}\n\n${lines.join("\n\n")}` : own;
}

// AI-assist-only rules are not in the card at all unless assist is on, even if
// they were ticked earlier and switched off afterwards.
function liveRules() {
  return RULES.filter((r) => state.rules[r.id] && (!r.aiOnly || state.ai.on));
}

function buildExport() {
  const parts = buildParts();
  return [parts.description, parts.instructions].filter(Boolean).join("\n\n");
}

// Who the character is, and what the model is told to do. Two piles, kept
// apart, because the sites ask for them in two different boxes.
function buildParts() {
  const blocks = [];
  state.characters.forEach((character, index) => {
    const name = chosen("first_name", character) || charName(index);
    for (const section of SECTIONS) {
      if (!section.exported || section.scenario) continue;
      const own = section.fields.map((f) => fieldLine(f, chosen(f[0], character)));
      // Name, age and appearance are asked in step 1 but belong at the top of
      // the profile block, in the order the method lists them.
      const lines = (section.id === "profile" ? [...promoted().map((f) => fieldLine(f, chosen(f[0], character))), ...own] : own)
        .filter(Boolean);
      if (!lines.length) continue;
      const [open, close] = section.wrap(name);
      blocks.push([open, ...lines, close].join("\n"));
    }
  });
  // rules that belong with the character, not in the rules block
  for (const rule of liveRules().filter((r) => r.where === "personality"))
    blocks.push(aiBlock(rule));
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
  scenarioBits.push(HOW_TO_RUN);
  const engine = plotEngine(first, chosen("first_name", first) || charName(0));
  if (engine) scenarioBits.push(engine);
  const written = state.acts.filter((a) => (a.title || "").trim() || (a.text || "").trim());
  const acts = written.length || !state.ai.on ? written : state.acts;
  if (acts.length) scenarioBits.push(state.acts.map((act, i) => {
    const title = (act.title || "").trim();
    const body = (act.text || "").trim();
    if (!title && !body && !state.ai.on) return "";
    const beat = ACT_BEATS[i] || "what happens next";
    return `#Act ${i + 1}${title ? " – " + title : state.ai.on && !title ? ` – [name act ${i + 1}]` : ""}\n${body || (state.ai.on ? `[write act ${i + 1} only — ${beat}. One short paragraph. Do not write any later act here.]` : "")}`;
  }).filter(Boolean).join("\n\n"));
  const world = [grab("world_setting") && `## Setting\n${grab("world_setting")}`,
                 grab("problem") && `## The problem\n${grab("problem")}`,
                 grab("conflict") && `## Sources of conflict\n${grab("conflict")}`].filter(Boolean);
  if (world.length) scenarioBits.push(`# World Profile\n${world.join("\n\n")}`);
  if (grab("gated")) scenarioBits.push(`{ABSOLUTELY CRITICAL INFORMATION BELOW IS ONLY KNOWN BY the characters directly involved and no one else. It is never confessed. Anything the player learns must be earned slowly, through physical evidence, overheard moments, contradictions caught side by side, or somebody else talking:\n${grab("gated")}\n}`);
  for (const rule of liveRules().filter((r) => r.where === "scenario")) scenarioBits.push(aiBlock(rule));
  scenarioBits.push(MANDATORY_TRACKER);
  const instructions = [];
  if (scenarioBits.length) instructions.push(scenarioBits.join("\n\n"));

  const embeds = state.embeds.filter((e) => e && e.trim()).map(formatEmbed);
  if (embeds.length) blocks.push(embeds.join("\n"));
  const rules = liveRules().filter((r) => !r.where).map((r) => r.text);
  if (rules.length) instructions.push(rules.join("\n\n"));
  const trackers = TRACKERS.filter((tr) => state.trackers[tr.id] && tr.text).map((tr) => tr.text);
  if (trackers.length) instructions.push(trackers.join("\n"));

  return {
    description: blocks.filter(Boolean).join("\n\n"),
    instructions: instructions.filter(Boolean).join("\n\n"),
  };
}

/* ----------------------------------------------------------------- steps */
const STEPS = [
  { id: "bible",    label: "Lore",        tip: () => TIPS.bible },
  { id: "profile",  label: "Personality", tip: () => TIPS.profile },
  { id: "psych",    label: "Psychology",  tip: () => TIPS.psych },
  { id: "side",     label: "Side cast",   tip: () => TIPS.side },
  { id: "scenario", label: "Scenario",    tip: () => TIPS.scenario },
  { id: "greeting", label: "Greeting",    tip: () => TIPS.greeting },
  { id: "rules",    label: "Rules",       tip: () => TIPS.rules },
  { id: "trackers", label: "Trackers",    tip: () => TIPS.trackers },
  { id: "systems",  label: "Systems",     tip: () => TIPS.systems },
  { id: "tags",     label: "Tags" },
  { id: "ai",       label: "AI assist",   tip: () => TIPS.ai },
  { id: "review",   label: "Review",      tip: () => TIPS.review },
  { id: "export",   label: "Export",      tip: () => TIPS.export },
];

// Grey until touched, yellow while in progress, red when something on the step
// fails a Step 0 check, green when it is both complete and clean.
function stepState(id) {
  const section = SECTIONS.find((s) => s.id === id);

  if (section) {
    let filled = 0, total = 0, problem = false;
    for (const character of state.characters) {
      for (const field of section.fields) {
        // a section handed to the AI is not counted against the author
        if (section.id === "psych" && character.psychAuto) continue;
        if ((field[3] || {}).ownStep) continue;     // counted on its own step
        total++;
        const value = chosen(field[0], character) || "";
        if (value.trim()) filled++;
        if (lintText(value).length || lintText(character.enhanced[field[0]] || "").length) problem = true;
      }
    }
    if (section.id === "scenario") {
      const acts = state.acts.filter((a) => (a.text || "").trim() || (a.title || "").trim()).length;
      filled += acts; total += Math.max(acts, 1);
    }
    if (section.fields.some((f) => (f[3] || {}).minAge) && ageProblem()) problem = true;
    if (section.id === "psych" && state.characters.every((c) => c.psychAuto))
      return { state: state.ai.on ? "done" : "part", count: "AI" };
    if (problem) return { state: "problem", count: `${filled}/${total}` };
    if (!filled) return { state: "empty", count: `0/${total}` };
    return { state: filled >= total ? "done" : "part", count: `${filled}/${total}` };
  }

  if (id === "side") {
    const items = state.sideChars.length + state.embeds.filter(Boolean).length;
    const problem = [...state.sideChars, ...state.embeds].some((entry) =>
      Object.values(typeof entry === "string" ? { entry } : entry).some((v) => lintText(v || "").length));
    if (problem) return { state: "problem", count: String(items) };
    return { state: items ? "done" : "empty", count: String(items) };   // all of it is optional
  }
  if (id === "greeting") {
    const value = (chosen("greeting", state.characters[0]) || "").trim();
    if (lintText(value).length) return { state: "problem", count: "" };
    return { state: value ? "done" : "empty", count: "" };
  }
  if (id === "rules" || id === "trackers") {
    const on = id === "rules" ? Object.values(state.rules).filter(Boolean).length
                              : Object.values(state.trackers).filter(Boolean).length;
    return { state: "done", count: String(on) };     // both always carry a mandatory block
  }
  if (id === "systems") return { state: "done", count: "" };   // nothing in it yet
  if (id === "tags") {
    const on = Object.values(state.tags).filter(Boolean).length;
    return { state: on ? "done" : "empty", count: String(on) };
  }
  if (id === "ai") return { state: aiCount() ? "done" : "part", count: aiCount() ? String(aiCount()) : "" };
  if (id === "review") {
    if (allLintHits().length) return { state: "problem", count: String(allLintHits().length) };
    return { state: aiCount() ? "done" : "empty", count: aiCount() ? String(aiCount()) : "" };
  }
  if (id === "export") {
    return { state: allLintHits().length ? "problem" : "done", count: "" };
  }
  return { state: "empty", count: "" };
}

function activeSteps() {
  // With AI assist off there is nothing to configure and nothing to compare,
  // so neither step belongs in the run.
  return STEPS.filter((s) => (s.id === "ai" || s.id === "review") ? state.ai.on : true);
}

function renderRail() {
  const rail = $("#rail");
  rail.innerHTML = "";
  renderAiSwitch();
  const steps = activeSteps();
  steps.forEach((step, index) => {
    const status = stepState(step.id);
    const pill = el("div", `pill status-${status.state}` + (activeSection === step.id ? " on" : ""));
    const go = el("button", "pillbtn");
    const number = index + 1;
    go.append(el("span", "pillnum", String(number)));
    go.append(el("span", "pilllabel", step.label));
    if (status.count) go.append(el("span", "pillcount", status.count));
    go.onclick = () => {
      const problem = ageProblem();
      if (problem && activeSection === "bible" && step.id !== "bible") return status(problem, true);
      activeSection = step.id; render();
    };
    pill.append(go);
    if (step.tip) pill.append(tip(step.tip()));
    rail.append(pill);
  });

  const index = Math.max(0, steps.findIndex((s) => s.id === activeSection));
  const zeroBased = steps[0].id === "ai";
  $("#progress").textContent =
    `Step ${zeroBased ? index : index + 1} of ${zeroBased ? steps.length - 1 : steps.length} · ${steps[index].label}`;
  const back = $("#back"), next = $("#next");
  back.disabled = index === 0;
  next.disabled = index === STEPS.length - 1;
  const leaving = () => {
    const problem = ageProblem();
    if (problem && activeSection === "bible") { status(problem, true); return false; }
    return true;
  };
  back.onclick = () => { if (leaving()) { activeSection = steps[Math.max(0, index - 1)].id; render(); } };
  next.onclick = () => { if (leaving()) { activeSection = steps[Math.min(steps.length - 1, index + 1)].id; render(); } };

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
  if (opts.choices) {
    const picks = el("div", "choices");
    for (const choice of opts.choices) {
      const btn = el("button", "choice" + (value === choice ? " on" : ""), choice);
      btn.type = "button";
      btn.onclick = () => { onInput(choice); save(); render(); };
      picks.append(btn);
    }
    wrap.append(picks);
    return wrap;
  }
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

// Until a gender is picked, everything reads "them". Pick one and the wording
// follows it — verbs included, so "how do they carry" becomes "how does she carry".
const PRONOUNS = {
  male:   { they: "he",   them: "him",  their: "his",   theirs: "his",    themself: "himself",
            are: "is", were: "was", do: "does", s: "s", es: "es" },
  female: { they: "she",  them: "her",  their: "her",   theirs: "hers",   themself: "herself",
            are: "is", were: "was", do: "does", s: "s", es: "es" },
  other:  { they: "they", them: "them", their: "their", theirs: "theirs", themself: "themself",
            are: "are", were: "were", do: "do", s: "", es: "" },
};

function pronounsFor(character) {
  const pick = ((character && character.values.gender) || "").trim().toLowerCase();
  return PRONOUNS[pick] || PRONOUNS.other;
}

function swap(text, character) {
  const words = pronounsFor(character);
  return String(text).replace(/\{(they|them|their|theirs|themself|are|were|do|s|es)\}/g,
    (_, key) => words[key]);
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

// One picture per character: the AI can look at it, and it becomes the face of
// the SillyTavern card on export.
// One box per act, in order, however many the story needs.
function actsBox() {
  const wrap = el("div", "card");
  const head = el("div", "fieldhead");
  head.append(el("h3", null, "The acts"));
  head.append(tip("Where the story goes, in order. One box per act — name what changes, not every beat. Add as many as it takes."));
  wrap.append(head);
  wrap.append(el("p", "help", "Four to start, the same as the method. Add more if the story needs them, or leave one empty and it is left out."));

  state.acts.forEach((act, index) => {
    const row = el("div", "act");
    const rowhead = el("div", "fieldhead");
    rowhead.append(el("strong", null, `Act ${index + 1}`));
    const title = el("input", "acttitle");
    title.placeholder = ["The spare room", "Small cracks", "Underneath", "She does not change"][index] || "What this act is called";
    title.value = act.title || "";
    title.oninput = () => { act.title = title.value; save(); };
    rowhead.append(title);
    const del = el("button", "mini danger", "Remove");
    del.onclick = () => { state.acts.splice(index, 1); save(); render(); };
    rowhead.append(del);
    row.append(rowhead);
    const body = el("textarea");
    body.placeholder = [
      "She is warm from the first minute, generous with space and compliments, and the place feels shared inside a week.",
      "Mail keeps arriving under a name she does not use. Rent goes unpaid for weeks, then lands in cash all at once.",
      "What she actually does stays hidden unless the player digs for it. She never confesses.",
      "Kindness does not open her, and getting caught does not reform her. When somebody becomes a threat, she leaves.",
    ][index] || "What changes in this act.";
    body.value = act.text || "";
    body.oninput = () => { act.text = body.value; save(); renderRail(); };
    row.append(body);
    wrap.append(row);
  });

  const add = el("button", "ghost", "Add another act");
  add.onclick = () => { state.acts.push({ title: "", text: "" }); save(); render(); };
  wrap.append(add);
  return wrap;
}

function portraitBox() {
  const card = el("div", "card portrait");
  const head = el("div", "fieldhead");
  head.append(el("label", null, "Picture (optional)"));
  head.append(tip("Two uses. With AI assist on, the model looks at it while writing appearance. On export it becomes the SillyTavern card image, with the character data written inside the file."));
  card.append(head);
  card.append(el("p", "help", "A portrait of this character. Stays on your device — it is sent to the AI only when you run Enhance, and only to the vendor you picked. It also becomes the face of the card you export."));

  const row = el("div", "portraitrow");
  const preview = el("div", "shot");
  if (current().image) {
    const img = el("img");
    img.src = current().image;
    preview.append(img);
  } else {
    preview.append(el("span", "shotempty", "no picture"));
  }
  row.append(preview);

  const buttons = el("div", "portraitbuttons");
  const pick = el("button", "ghost", current().image ? "Replace picture" : "Add a picture");
  const file = el("input");
  file.type = "file";
  file.accept = "image/*";
  file.hidden = true;
  file.onchange = async () => {
    const chosenFile = file.files[0];
    if (!chosenFile) return;
    try {
      current().image = await shrink(chosenFile);
      save();
      render();
    } catch (err) { status(err.message, true); }
  };
  pick.onclick = () => file.click();
  buttons.append(pick, file);
  if (current().image) {
    const drop = el("button", "ghost danger", "Remove");
    drop.onclick = () => { delete current().image; save(); render(); };
    buttons.append(drop);
  }
  row.append(buttons);
  card.append(row);
  return card;
}

// Browsers keep about 5MB of storage per site, so the picture is scaled down
// before it is saved. Plenty for a portrait and for the model to read.
function shrink(file, maxSide = 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => reject(new Error("That file could not be read as an image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
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

  if (section.id === "bible") main.append(portraitBox());

  if (section.scenario) {
    const fixed = el("div", "card");
    const head = el("div", "fieldhead");
    head.append(el("h3", null, "How to run this story"));
    head.append(el("span", "badge", "always included"));
    head.append(tip("Fixed direction for the model, identical in every build. It tells the model to drive the story instead of waiting for the player, so there is nothing to decide here."));
    fixed.append(head);
    fixed.append(el("p", "help", "Goes into every card exactly as written."));
    fixed.append(el("pre", null, HOW_TO_RUN));
    main.append(fixed);

    main.append(actsBox());
  }

  if (section.id === "psych") {
    const wrap = el("div", "card");
    wrap.append(toggleSwitch("Let the AI do this one for me", !!current().psychAuto,
      (on) => { current().psychAuto = on; save(); render(); }));
    const why = el("div", "fieldhead");
    why.append(el("p", "help", "This is the hardest section to write. Leave it to the AI and it fills the whole profile from your lore and the personality you already wrote — you still see it in Review before you download it."));
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
  if (!section.exported) main.append(el("p", "note",
    "Not printed into the card as written. It is raw material — it goes into the prompt the AI is given when you run Enhance."));
  let engineOpen = false;
  for (const [id, label, help, opts = {}] of section.fields) {
    if (opts.ownStep) continue;
    if (opts.plotEngine && !engineOpen) {
      engineOpen = true;
      const head = el("div", "fieldhead enginehead");
      head.append(el("h3", null, "The plot engine"));
      head.append(tip("One block that keeps the story moving on its own: what lives in the place, what the character is after, what the player has to deal with, and what it costs them to sit still. Fill the parts and it assembles itself."));
      main.append(head);
      main.append(el("p", "help", "Short answers. They get written into a single block in the exact shape the method uses."));
    }
    if (!opts.plotEngine && engineOpen) {
      engineOpen = false;
      main.append(el("hr", "enginerule"));
    }
    main.append(fieldBox(id, swap(label.replace(/^Plot engine · /, ""), current()), swap(help, current()),
      chosen(id, current()),
      (v) => { current().values[id] = v; current().choice[id] = "mine"; }, opts));
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
      card.append(fieldBox(`sc${index}.${key}`, key, swap(help, null), character[key],
        (v) => { character[key] = v; }, { short: key.length < 12 }));
    card.append(fieldBox(`sc${index}.closer`, "Closing paragraph", swap(WPP_CLOSER, null), character.closer,
      (v) => { character.closer = v; }));
    main.append(card);
  });
  const add = el("button", "go", "Add a side character");
  add.onclick = () => { state.sideChars.push({}); save(); render(); };
  main.append(add);

  renderEmbeds(main);
}

function renderEmbeds(main) {
  main.append(el("hr", "enginerule"));
  sectionHeading(main, "Character embeds",
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

function renderGreeting() {
  const main = $("#main");
  sectionHeading(main, "The greeting",
    "The first thing a player reads. Set the scene, put the character in it, and stop somewhere they can answer.",
    TIPS.greeting);

  // One card, one greeting — it is not written per character.
  const card = state.characters[0];
  const spec = SECTIONS.flatMap((s) => s.fields).find((f) => f[0] === "greeting");
  const [, label, help, opts = {}] = spec;
  main.append(fieldBox("greeting", label, swap(help, card), chosen("greeting", card),
    (v) => { card.values.greeting = v; card.choice.greeting = "mine"; }, opts));

  const note = el("div", "card");
  note.append(el("h3", null, "Added to the end for you"));
  note.append(el("p", "help", "Write the opening however you like. On export, the trackers you ticked are appended underneath it, ready for you to fill in with the real values for this first scene."));
  const shown = TRACKERS.filter((t) => state.trackers[t.id] && t.greeting);
  if (shown.length) note.append(el("pre", null, shown.map((t) => `---\n\n${t.greeting}`).join("\n\n")));
  main.append(note);
}

function renderRules() {
  const main = $("#main");
  sectionHeading(main, "Rules", "These are optional rules I use on an as needed basis.", TIPS.rules);
  for (const rule of RULES) {
    if (rule.aiOnly && !state.ai.on) continue;     // needs AI assist to be worth anything
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
    card.append(el("pre", "rulebox", rule.text));
    main.append(card);
  }
  // They are reference, not reading. Every block gets the height of the
  // shortest one and scrolls inside that.
  requestAnimationFrame(() => {
    const boxes = [...main.querySelectorAll(".rulebox")];
    if (boxes.length < 2) return;
    const shortest = Math.min(...boxes.map((b) => b.scrollHeight));
    boxes.forEach((b) => { b.style.height = `${shortest}px`; });
  });
}

// The same switch as the AI step, for anywhere a real toggle belongs.
function toggleSwitch(label, checked, onChange) {
  const wrap = el("div", "switchrow");
  const sw = el("button", "switch" + (checked ? " on" : ""));
  sw.type = "button";
  sw.append(el("span", "switchtrack"));
  sw.append(el("span", "switchword", checked ? "on" : "off"));
  sw.onclick = () => onChange(!checked);
  wrap.append(sw);
  wrap.append(el("span", "switchlabel", label));
  return wrap;
}

function renderAiSwitch() {
  const slot = $("#aiswitch");
  slot.innerHTML = "";
  slot.append(toggleSwitch("AI assist", state.ai.on, (on) => {
    state.ai.on = on;
    if (on) activeSection = "ai";
    else if (activeSection === "ai" || activeSection === "review") activeSection = "bible";
    save();
    render();
  }));
  slot.append(tip(TIPS.ai));
}

function renderTrackers() {
  const main = $("#main");
  sectionHeading(main, "Trackers",
    "The status lines the bot keeps as it plays. Tick the ones this card should run.",
    TIPS.trackers);

  const list = el("div", "trackers");
  for (const tracker of TRACKERS) {
    const on = !!state.trackers[tracker.id];
    const row = el("label", "trackrow" + (on ? " on" : "") + (tracker.mandatory ? " locked" : ""));
    const box = el("input");
    box.type = "checkbox";
    box.checked = on;
    box.disabled = !!tracker.mandatory;
    box.onchange = () => {
      state.trackers[tracker.id] = box.checked;
      row.classList.toggle("on", box.checked);
      save(); renderRail();
    };
    row.append(box);
    const title = el("div", "tracktitle");
    title.append(el("span", "trackicon", tracker.icon));
    title.append(el("span", null, tracker.name));
    if (tracker.mandatory) title.append(el("span", "badge", "mandatory"));
    row.append(title);
    list.append(row);
  }
  main.append(list);
  main.append(el("p", "note", "The mandatory ones are built into every card and cannot be turned off. More trackers, and the hidden ones the bot keeps to itself, are coming later."));
}

function renderTags() {
  const main = $("#main");
  const head = el("div", "sectionhead");
  head.append(el("h2", null, "Tags"));
  main.append(head);
  const picked = Object.keys(state.tags).filter((t) => state.tags[t]);
  main.append(el("p", "blurb", `Tick what fits. These are the tags the sites know — ${TAG_LIMIT} at most on a card.`));
  const counter = el("p", "note", `${picked.length} of ${TAG_LIMIT} picked.`);
  const clear = el("button", "mini danger", "Clear all");
  clear.onclick = () => { state.tags = {}; save(); render(); };
  const countRow = el("div", "row buttons");
  countRow.append(counter, clear);
  main.append(countRow);

  for (const block of TAG_GROUPS) {
    main.append(el("h3", "castheading", block.group));
    const wrap = el("div", "tagwrap");
    for (const name of block.tags) {
      const on = !!state.tags[name];
      const row = el("label", "tagpick" + (on ? " on" : ""));
      const box = el("input");
      box.type = "checkbox";
      box.checked = on;
      box.onchange = () => {
        const on = Object.keys(state.tags).filter((t) => state.tags[t]).length;
        if (box.checked && on >= TAG_LIMIT) {
          box.checked = false;
          return status(`That is the limit — a card carries ${TAG_LIMIT} tags. Untick one first.`, true);
        }
        state.tags[name] = box.checked;
        row.classList.toggle("on", box.checked);
        const now = Object.keys(state.tags).filter((t) => state.tags[t]).length;
        counter.textContent = `${now} of ${TAG_LIMIT} picked.`;
        save(); renderRail();
      };
      row.append(box);
      row.append(el("span", null, name));
      wrap.append(row);
    }
    main.append(wrap);
  }
}

function renderSystems() {
  const main = $("#main");
  sectionHeading(main, "Systems", null, TIPS.systems);
  const card = el("div", "card soon");
  card.append(el("h3", null, "Currently in development"));
  card.append(el("p", "help", "Systems are a collection of rules and trackers for things like RPGs."));
  main.append(card);
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
  go.onclick = () => confirmThenEnhance(go, main);
  main.append(go);
  main.append(el("p", "note",
    `${written} field${written === 1 ? "" : "s"} written so far. Nothing you typed is overwritten: where you wrote something, the AI version lands beside yours in Review and you pick which one exports. What you left blank — empty acts, the plot engine, the Narrator — is written straight into the build, since there is nothing to compare it against. Run it again later and anything the AI has already written stays as it is.`));
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

  const anyAI = pairs.some((p) => p.ai);
  if (!anyAI) {
    const none = el("div", "card");
    none.append(el("p", "help", "No AI versions to compare — this is the card as you have written it."));
    main.append(none);
    filePreview(main);
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
    head.append(el("span", "badge", pair.section));
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
  filePreview(main);
}

// The file as it stands right now, with whatever is picked above.
function filePreview(main) {
  const card = el("div", "card");
  const head = el("div", "fieldhead");
  head.append(el("h3", null, "Your Character Card File"));
  head.append(tip("This is the txt file that will be downloaded on the Export tab."));
  card.append(head);
  card.append(el("p", "note", "Review the details below."));
  card.append(el("pre", "output", buildTxt()));
  const copy = el("button", "ghost", "Copy it");
  copy.onclick = async () => {
    await navigator.clipboard.writeText(buildTxt());
    copy.textContent = "Copied";
    setTimeout(() => (copy.textContent = "Copy it"), 1500);
  };
  card.append(copy);
  main.append(card);
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

  const who = state.characters[0];
  const name = chosen("first_name", who) || charName(0);

  const box = el("div", "card");
  const boxHead = el("div", "fieldhead");
  boxHead.append(el("h3", null, "Download"));
  boxHead.append(tip("The text file lays every field out in the order a platform asks for them. The json is for anything that imports cards. Add a picture on step 1 and you get a .png card as well."));
  box.append(boxHead);

  const what = who.image
    ? `One zip holding three files: ${name}.txt to paste from, ${name}.json for anything that imports cards, and ${name}.png — your picture with the card written inside it.`
    : `One zip holding ${name}.txt to paste from and ${name}.json for anything that imports cards. Add a picture on step 1 and the card comes as a .png too.`;
  box.append(el("p", "help", what));

  const grab = el("button", "go", "Download the card (.zip)");
  grab.onclick = async () => {
    grab.disabled = true;
    try {
      // Everything the card is, in one download — the text to paste from, the
      // json for importers, and the picture with the card written inside it.
      const files = [
        { name: `${name}.txt`, bytes: textBytes(buildTxt()) },
        { name: `${name}.json`, bytes: textBytes(JSON.stringify(buildCardJson(), null, 2)) },
      ];
      if (who.image) {
        const png = await toPngBytes(who.image);
        files.push({ name: `${name}.png`, bytes: embedCard(png, buildV3Card()) });
      }
      downloadBlob(`${name}.zip`, makeZip(files));
      status(`Saved ${name}.zip — ${files.map((f) => f.name).join(", ")} inside.`);
    } catch (err) { status(err.message, true); }
    finally { grab.disabled = false; }
  };
  box.append(grab);
  main.append(box);

  const text = buildExport();
  main.append(el("pre", "output", text || "Nothing written yet."));

  const buttons = el("div", "row buttons");
  const copy = el("button", "ghost", "Copy the card text");
  copy.onclick = async () => {
    await navigator.clipboard.writeText(text);
    copy.textContent = "Copied";
    setTimeout(() => (copy.textContent = "Copy the card text"), 1500);
  };
  const save = el("button", "ghost", "Save your work (.json)");
  save.onclick = () => download(`${name}-builder-save.json`, JSON.stringify(state, null, 2));
  const wipe = el("button", "ghost danger", "Start over");
  wipe.onclick = () => {
    if (!confirm("Erase everything in this builder and start a new character?")) return;
    localStorage.removeItem(STORE);
    location.reload();
  };
  buttons.append(copy, save, wipe);
  main.append(buttons);

  const note = el("div", "fieldhead");
  note.append(el("p", "help", "Everything saves to your device. Nothing is uploaded."));
  note.append(tip("Save your work keeps both versions of every field so you can carry on later; it is not the card itself."));
  main.append(note);
}

/* ------------------------------------------------------------------ main */
let lastRendered = null;

function render() {
  const main = $("#main");
  // Ticking a box redraws the step. Stay where they were reading — only a
  // change of step goes back to the top.
  const sameStep = lastRendered === activeSection;
  const scrollWas = window.scrollY;
  lastRendered = activeSection;
  main.innerHTML = "";
  renderRail();
  const section = SECTIONS.find((s) => s.id === activeSection);
  if (section) renderSection(section);
  else if (activeSection === "side") renderSideChars();
  else if (activeSection === "greeting") renderGreeting();
  else if (activeSection === "rules") renderRules();
  else if (activeSection === "trackers") renderTrackers();
  else if (activeSection === "tags") renderTags();
  else if (activeSection === "systems") renderSystems();
  else if (activeSection === "ai") renderAI();
  else if (activeSection === "review") renderReview();
  else renderExport();
  // after the step has laid out — rule boxes resize on the next frame
  if (sameStep) requestAnimationFrame(() => window.scrollTo(0, scrollWas));
  else window.scrollTo(0, 0);
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

// Everything the builder holds that is not this character's own fields.
// The model gets the lot, so what it writes fits the card it is going into.
function buildContext(index) {
  const out = [];
  const character = state.characters[index];

  if (state.characters.length > 1)
    out.push(`THE CAST: ${state.characters.map((c, i) => charName(i)).join(", ")}. You are writing ${charName(index)} only — the others are here so they line up.`);

  if (character.psychAuto)
    out.push("PSYCHOLOGY: the author handed this whole section to you. Write every psychology field from the lore above.");

  const sides = state.sideChars.map((sc) => {
    const lines = WPP_FIELDS.filter(([key]) => (sc[key] || "").trim()).map(([key]) => `  ${key}: ${sc[key].trim()}`);
    if (sc.closer && sc.closer.trim()) lines.push(`  Closing: ${sc.closer.trim()}`);
    return lines.length ? `${sc.Name || "Unnamed"}:\n${lines.join("\n")}` : "";
  }).filter(Boolean);
  if (sides.length) out.push(`SIDE CAST already written (context — do not rewrite them):\n${sides.join("\n")}`);

  const embeds = state.embeds.filter((e) => e && e.trim());
  if (embeds.length) out.push(`EMBEDS the card carries (messages, phones, letters):\n${embeds.join("\n")}`);

  const acts = state.acts.filter((act) => (act.title || "").trim() || (act.text || "").trim())
    .map((act, i) => `  Act ${i + 1}${act.title ? ` — ${act.title}` : ""}: ${act.text || ""}`.trim());
  if (acts.length) out.push(`THE ACTS the story runs through:\n${acts.join("\n")}`);

  const rules = RULES.filter((r) => state.rules[r.id]).map((r) => `  ${r.name}`);
  if (rules.length) out.push(`RULES switched on in this card — write nothing that fights them:\n${rules.join("\n")}`);

  const trackers = TRACKERS.filter((t) => state.trackers[t.id]).map((t) => `  ${t.name}`);
  if (trackers.length) out.push(`TRACKERS this card runs:\n${trackers.join("\n")}`);

  const tags = Object.keys(state.tags).filter((t) => state.tags[t]);
  if (tags.length) out.push(`TAGS the author picked — the card has to earn every one of them:\n  ${tags.join(", ")}`);

  const aiRules = liveRules().filter((r) => r.aiOnly);
  if (aiRules.length) out.push(`BLOCKS WITH BLANKS TO FILL — these are in the file with placeholders still in square brackets, like [PURPOSE] or [tone — e.g. ...]. Replace every one of them with something written for this build, keep the rest of the block exactly as it is, and keep the block where it sits:\n  ${aiRules.map((r) => r.name).join(", ")}`);

  out.push(`FIXED BLOCKS the tool adds after you: the always-21 rule, the how-to-run-this-story block, and the Scene Continuity Tracker. Do not write them, do not repeat them, do not contradict them.`);
  return out;
}

// Steps that are not finished, in the words of the rail.
function unfinishedSteps() {
  return activeSteps()
    .filter((step) => !["ai", "review", "export", "systems"].includes(step.id))
    .map((step) => ({ step, status: stepState(step.id) }))
    .filter(({ status }) => status.state !== "done");
}

function confirmThenEnhance(button, main) {
  main.querySelectorAll(".precheck").forEach((n) => n.remove());
  const loose = unfinishedSteps();
  if (!loose.length) return enhanceAll(button);

  const card = el("div", "card precheck warn");
  const problems = loose.filter((l) => l.status.state === "problem");
  card.append(el("h3", null, problems.length
    ? "Some steps have a problem, and some are unfinished"
    : "Some steps are not finished"));
  card.append(el("p", "help", "The AI works from what is there. Anything still empty is the AI's to invent, which is rarely what you want. Worth a look before you spend a request:"));
  const list = el("ul", "ridelist");
  for (const { step, status } of loose) {
    const what = status.state === "problem" ? "has a problem"
      : status.state === "empty" ? "nothing written"
      : `part written${status.count ? ` — ${status.count}` : ""}`;
    const item = el("li", null, "");
    const link = el("button", "linky", step.label);
    link.onclick = () => { activeSection = step.id; render(); };
    item.append(link, document.createTextNode(` — ${what}`));
    list.append(item);
  }
  card.append(list);

  const row = el("div", "row buttons");
  const goOn = el("button", "go", "Write it anyway");
  goOn.onclick = () => { card.remove(); enhanceAll(button); };
  const stop = el("button", "ghost", "Cancel");
  stop.onclick = () => card.remove();
  row.append(goOn, stop);
  card.append(row);
  main.append(card);
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function enhanceAll(button) {
  const vendor = VENDORS[state.ai.vendor];
  if (!apiKey && !vendor.keyOptional) return status("Add your API key first.", true);
  const model = state.ai.model || vendor.fallbackModels[0];
  if (!model) return status("Pick a model first.", true);

  const anything = state.characters.some((c) => Object.values(c.values).some((v) => (v || "").trim()));
  if (!anything) return status("Write something first — the model works from what you put in.", true);

  button.disabled = true;
  const label = button.textContent;
  button.textContent = "Writing…";

  try {
    status(`Sending the whole build to ${vendor.label} (${model})…`);
    const { system, user } = buildFileRequest({
      file: buildTxt(true),
      lore: loreNotes(),
      context: buildContext(0),
      instruction: state.ai.instruction,
    });
    const image = state.characters.find((c) => c.image);
    const reply = await vendor.complete(apiKey, model, system, user,
      { baseUrl: state.ai.baseUrl, image: image ? image.image : null });

    const written = readReturnedFile(reply);
    if (!written && !lastKept) throw new Error("The model sent back something this builder could not read. Try again, or try a stronger model.");
    save();
    activeSection = "review";
    render();
    status(written
      ? `${written} field${written === 1 ? "" : "s"} came back${lastKept ? `, and ${lastKept} the AI had already written were left alone` : ""}. Yours are untouched — compare them and pick.`
      : `Nothing new to write — the ${lastKept} field${lastKept === 1 ? "" : "s"} the AI had already written were left alone.`);
  } catch (err) {
    status(err.message, true);
    save();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

// The lore is the only thing not already in the file, so it rides along.
function loreNotes() {
  const bible = SECTIONS[0];
  return state.characters.map((character, index) => {
    const lines = bible.fields
      .filter(([id]) => (character.values[id] || "").trim())
      .map(([id, fieldLabel]) => `  ${swap(fieldLabel, character)}: ${character.values[id].trim()}`);
    return lines.length ? `${charName(index)}:\n${lines.join("\n")}` : "";
  }).filter(Boolean).join("\n\n");
}

// Label -> field id, per section. Two sections can use the same label — the
// profile has a Core Drive and the profiler has a Core drive — so the map has
// to know which block the line came out of.
function lineMap(sectionId) {
  const map = {};
  const take = (fields) => {
    for (const [id, , , opts = {}] of fields) if (opts.line) map[opts.line.toLowerCase()] = id;
  };
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (section) take(section.fields);
  if (sectionId === "profile") take(promoted());     // name, gender, age, appearance sit here
  return map;
}

// Read the file the model sent back. Same shape as the one it was given, so
// every "Label: value" line goes back to the field it came from.
let lastKept = 0;

function readReturnedFile(reply) {
  const text = String(reply || "").replace(/```[a-z]*\n?/gi, "");
  let map = lineMap("profile");
  let written = 0;

  const fieldBody = (n) => {
    const match = text.match(new RegExp(`FIELD ${n} — [A-Z]+[\\s\\S]*?\\n[━]+\\n([\\s\\S]*?)(?=\\n[━]+\\nFIELD |$)`));
    return match ? match[1].trim() : "";
  };

  let kept = 0;
  const set = (character, id, value) => {
    const clean = String(value || "").trim();
    if (!clean || !id) return;
    // A second run fills the gaps. Anything the AI already wrote stays put,
    // so going back for a section you forgot cannot wipe the rest.
    if ((character.enhanced[id] || "").trim()) { kept++; return; }
    const own = (character.values[id] || "").trim();
    if (clean === own) return;                       // unchanged, nothing to compare
    character.enhanced[id] = clean;
    if (!character.choice[id]) character.choice[id] = own ? "mine" : "ai";
    written++;
  };

  const opening = fieldBody(3);
  if (opening) set(state.characters[0], "greeting", opening);

  const body = fieldBody(4) || text;
  let character = state.characters[0];
  let inProfile = false;
  let currentId = null;
  let buffer = [];
  const flush = () => { if (currentId) set(character, currentId, buffer.join("\n")); currentId = null; buffer = []; };

  for (const raw of body.split("\n")) {
    const line = raw.replace(/\r$/, "");
    const header = line.match(/^\[(.+?)('s Character Profile| psychological profile):/);
    if (header) {
      map = lineMap(header[2].includes("psychological") ? "psych" : "profile");
      flush();
      const found = state.characters.findIndex((c, i) => charName(i).toLowerCase() === header[1].trim().toLowerCase());
      if (found >= 0) character = state.characters[found];
      inProfile = true;
      continue;
    }
    if (/^\[/.test(line.trim()) && !header) { flush(); inProfile = false; }   // some other block
    if (!inProfile) continue;
    const pair = line.match(/^([A-Za-z][A-Za-z '\/{}|-]{1,40}):\s*(.*)$/);
    if (pair && map[pair[1].trim().toLowerCase()]) {
      flush();
      currentId = map[pair[1].trim().toLowerCase()];
      buffer = pair[2] ? [pair[2]] : [];
      continue;
    }
    if (currentId) {
      if (/^[\]}]/.test(line.trim()) || /^\[/.test(line.trim())) { flush(); continue; }
      buffer.push(line);
    }
  }
  flush();

  lastKept = kept;

  // The blanks sheet comes back filled: one line per field the author left
  // empty, which is how the scenario fields get written at all.
  const sheet = text.match(/\[BLANKS[\s\S]*?\]\s*\n([\s\S]*?)(?=\n\s*\n|$)/);
  if (sheet) {
    const byLabel = {};
    for (const section of SECTIONS)
      for (const [id, label] of section.fields) byLabel[label.toLowerCase()] = id;
    for (const line of sheet[1].split("\n")) {
      const pair = line.match(/^(.+?):\s*(.+)$/);
      if (!pair) continue;
      const id = byLabel[pair[1].trim().toLowerCase()];
      const value = pair[2].trim();
      if (!id || !value || value.startsWith("[FILL")) continue;
      set(state.characters[0], id, value);
    }
  }

  // Acts the author left blank come back written. Ones they wrote are left alone.
  for (const piece of text.split(/^#Act\s+/m).slice(1)) {
    const head = piece.match(/^(\d+)\s*(?:[–—-]\s*)?([^\n]*)\n?([\s\S]*)$/);
    if (!head) continue;
    const act = state.acts[Number(head[1]) - 1];
    if (!act) continue;
    const title = head[2].trim();
    // the body runs until whatever block comes next
    const body = head[3].split("\n")
      .reduce((lines, line) => (lines.done || /^[#{\[]/.test(line.trim()) ? { ...lines, done: true }
                                                                           : { ...lines, out: [...lines.out, line] }),
              { out: [], done: false }).out.join("\n").trim();
    if (!(act.title || "").trim() && title && title !== "[name this act]") { act.title = title; written++; }
    if (!(act.text || "").trim() && body && body !== "[write this act]") { act.text = body; written++; }
  }

  for (const rule of RULES.filter((r) => r.aiOnly && state.rules[r.id])) {
    if (state.aiBlocks[rule.id]) continue;          // written on an earlier run
    const filledIn = captureBlocks(text, rule.text);
    if (filledIn && filledIn !== rule.text) { state.aiBlocks[rule.id] = filledIn; written++; }
  }
  return written;
}

// Find the same bracketed blocks in the reply and take them back whole —
// that is how a block with blanks in it comes home filled.
function captureBlocks(reply, template) {
  const out = [];
  for (const block of template.split("\n\n")) {
    const head = block.slice(0, Math.min(24, block.indexOf("\n") > 0 ? block.indexOf("\n") : block.length));
    const at = reply.indexOf(head);
    if (at < 0) return "";
    let depth = 0, end = at;
    for (let i = at; i < reply.length; i++) {
      if (reply[i] === "[") depth++;
      else if (reply[i] === "]") { depth--; if (!depth) { end = i + 1; break; } }
    }
    out.push(reply.slice(at, end).trim());
  }
  return out.join("\n\n");
}

// The shape SillyTavern and Chub read. Description carries the profile blocks;
// scenario and the opening message get their own slots, as the format expects.
// His plot engine, filled from the slots. One block, flowing text, no line
// breaks inside it — the shape is fixed, only the contents change.
function plotEngine(character, name) {
  const g = (id) => (chosen(id, character) || "").trim().replace(/\.$/, "");
  const place = g("pe_place"), who = g("pe_inhabitants"), goal = g("pe_goal");
  const things = g("pe_things"), threat = g("pe_threat"), cost = g("pe_cost");
  if (!place && !who && !goal) return "";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // "a shipment nobody signed for" + " for {{user}} to handle" reads badly
  const handle = /\bfor$/i.test(things) ? `${things}, for` : `${things} for`;
  return `{Plot engine: All manner of things live in ${place || "this place"}, ${who || "its people"}, and something is always about to happen. Do not let {{user}} fall into an endless sex loop. ${cap(place || "the place")} keeps moving whether or not {{user}} acts. ${name} wants ${goal || "what they are after"}, and their goal is to have {{user}} help them get it. Create ${things ? handle : "jobs, people, and problems for"} {{user}} to handle, with and without ${name} present. ${cap(threat || "the threat")} works the whole time. When {{user}} is idle, ${cost || "it costs them something"}. Create plots that lead toward what ${name} hides, so {{user}} can progress the plot through events. If {{user}} gets stuck having sex with ${name}, ${name} ends it and moves the story on. Regarding sex, create complications and let ${name} refuse on their own terms, because they decide when, never {{user}}. You have failed as GameMaster if you are not giving {{user}} things to do, people to deal with, and a place to move through beyond their bed.}`;
}

const BANNER = "━".repeat(60);
const RULE = "─".repeat(60);

// A paste-ready file: one block per platform field, in the order the site asks
// for them, so nobody has to work out which part goes where.
// One line per field the author left blank, so the model has somewhere to
// write them. Only ever sent to the model — never part of the download.
function blanksSheet() {
  const character = state.characters[0];
  const wanted = SECTIONS.find((s) => s.scenario).fields
    .filter(([id, , , opts = {}]) => !opts.ownStep && !(chosen(id, character) || "").trim());
  if (!wanted.length) return "";
  const lines = wanted.map(([, label, help]) => `${swap(label, character)}: [FILL: ${swap(help, character)}]`);
  return [
    "[BLANKS — the author left these empty. Fill every line: replace each [FILL: ...] with your own writing, a sentence or two, keep the label and the colon. The tool folds these into the card and deletes this block, so it never reaches the player.]",
    ...lines,
  ].join("\n");
}

function buildTxt(forModel = false) {
  const first = state.characters[0];
  const name = chosen("first_name", first) || charName(0);
  const parts = splitExport();
  const field = (n, title, where, body) => [
    BANNER,
    `FIELD ${n} — ${title}`,
    `Paste into ${where}`,
    BANNER,
    "",
    body || "[nothing written yet]",
    "",
  ].join("\n");

  return [
    "CHARACTER CARD EXPORT",
    `${name} — built with Skeletor's Bot Builder`,
    RULE, "",
    field(1, "NAME", "the Name field", name),
    field(2, "DESCRIPTION / PERSONALITY", "the Description field", parts.description),
    field(3, "OPENING", "the Opening field", parts.greeting),
    field(4, "INSTRUCTIONS", "the Instructions field",
          [parts.instructions, forModel ? blanksSheet() : ""].filter(Boolean).join("\n\n")),
  ].join("\n");
}

// Everything the card holds, split by where it belongs on a platform.
function splitExport() {
  const parts = buildParts();
  return {
    description: parts.description,      // who they are — goes in Description
    instructions: parts.instructions,    // how to run it — goes in Instructions
    scenario: parts.instructions,
    greeting: greetingOut(state.characters[0]),
  };
}

// The card as the sites want it: one flat object, every field spelled both
// ways (char_name and name, char_persona and description ...) because the
// importers disagree about which spelling they read.
function buildCardJson() {
  const first = state.characters[0];
  const grab = (id) => (chosen(id, first) || "").trim();
  const parts = splitExport();
  const name = chosen("first_name", first) || charName(0);
  const blurb = grab("blurb");
  const dialogue = grab("example_dialogue");

  return {
    spec: "",
    spec_version: "",
    avatar: "",
    tags: Object.keys(state.tags).filter((t) => state.tags[t]),
    state: 0,
    style: 1,
    nsfw: false,
    gender: 1,
    tg_bot_token: "",
    tg_bot_username: "",
    discord_bot_token: "",
    discord_bot_client_id: "",

    char_name: name,
    char_persona: parts.description,
    world_scenario: parts.scenario,
    char_greeting: parts.greeting,
    example_dialogue: dialogue,

    name,
    description: parts.description,
    personality: blurb,
    char_intro: blurb,
    creator_notes: blurb,
    scenario: parts.scenario,
    first_mes: parts.greeting,
    mes_example: dialogue,
  };
}

// SillyTavern reads the modern nested spec out of the PNG, not the flat one.
function buildV3Card() {
  const flat = buildCardJson();
  return {
    spec: "chara_card_v3",
    spec_version: "3.0",
    data: {
      name: flat.name,
      description: flat.description,
      personality: flat.personality,
      scenario: flat.scenario,
      first_mes: flat.first_mes,
      mes_example: flat.mes_example,
      creator_notes: flat.creator_notes,
      system_prompt: "",
      post_history_instructions: "",
      alternate_greetings: [],
      tags: flat.tags,
      creator: "",
      character_version: "",
      extensions: {},
    },
  };
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = el("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBytes(filename, bytes, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = el("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
