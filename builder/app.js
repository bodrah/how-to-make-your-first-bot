// Skeletor's Bot Builder — storycard v5.
//
// The Hard Rules file is the primary method. The builder stacks the templates
// the author picks, fills the blanks, and assembles the card around it: the
// profile, the psychological profile, the secondary characters, the plot
// engine, the numbered plots, the gated secrets, and the trackers. The rule
// blocks ship as their own file.

import {
  SECTIONS, SECONDARY_FIELDS, PLOT_RUN_RULES, ALWAYS_21, RULE_MENU,
  LINTS, STYLE_LINTS, TRACKER_HEAD, TRACKER_RULES, TRACKER_KIT,
  TAG_GROUPS, TAG_LIMIT, TIPSY_WRAP_OPEN, TIPSY_DIVIDER,
} from "./fields.js?v=f76ff3c9";
import { PERSONALITY_TYPES, SCENE_TYPES, RULE_BLOCKS } from "./templates.js?v=f76ff3c9";
import * as HR from "./hardrules.js?v=f76ff3c9";
import { VENDORS, buildFileRequest } from "./ai.js?v=f76ff3c9";
import { makeZip, textBytes } from "./zip.js?v=f76ff3c9";
import { embedCard, toPngBytes } from "./png.js?v=f76ff3c9";

const STORE = "skeletor-bot-builder-v5";
const OLDSTORE = "skeletor-bot-builder-v1";
const KEYSTORE = "skeletor-bot-builder-key";

function blankCharacter(name = "") {
  return { values: name ? { first_name: name } : {}, enhanced: {}, choice: {} };
}

const state = load() || {
  characters: [blankCharacter()],
  hard: { types: [], scenes: [], ageGap: false, slots: {}, edited: null },
  secondary: [],
  embeds: [],
  plots: [{ title: "", bullets: "" }, { title: "", bullets: "" }],
  rules: {},
  narrator: {},
  trackers: { relationship: true, plots: true },
  trackerRules: {},
  trackerStart: {},
  tipsyHtml: false,
  tags: {},
  extraTags: "",
  meta: { creator: "", version: "" },
  openingCast: "",
  ai: { on: false, vendor: "anthropic", model: "", remember: false, instruction: "",
        baseUrl: "http://localhost:11434/v1" },
};

state.characters ||= [blankCharacter()];
state.characters.forEach((c) => { c.values ||= {}; c.enhanced ||= {}; c.choice ||= {}; });
state.hard ||= { types: [], scenes: [], ageGap: false, slots: {}, edited: null };
state.hard.types ||= []; state.hard.scenes ||= []; state.hard.slots ||= {};
state.secondary ||= [];
state.embeds ||= [];
state.plots ||= [];
while (state.plots.length < 2) state.plots.push({ title: "", bullets: "" });
state.rules ||= {};
state.narrator ||= {};
state.trackers ||= {};
state.trackerRules ||= {};
state.trackerStart ||= {};
state.tags ||= {};
state.meta ||= { creator: "", version: "" };
state.ai ||= { on: false, vendor: "anthropic", model: "", remember: false, instruction: "",
               baseUrl: "http://localhost:11434/v1" };
{
  const known = new Set(TAG_GROUPS.flatMap((g) => g.tags));
  for (const name of Object.keys(state.tags)) if (!known.has(name)) delete state.tags[name];
}

let who = 0;                       // which character is on screen
let activeSection = state.ai.on ? "ai" : "bible";
let apiKey = sessionStorage.getItem(KEYSTORE) || localStorage.getItem(KEYSTORE) || "";
let reviewChangedOnly = false;
let hardEditing = false;

function current() { return state.characters[who] || state.characters[0]; }
function charName(index) {
  const c = state.characters[index];
  if (!c) return `Character ${index + 1}`;
  return (c.choice?.first_name === "ai" ? c.enhanced.first_name : c.values.first_name) || `Character ${index + 1}`;
}
function leadName() { return chosen("first_name", state.characters[0]) || charName(0); }

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

/* ---------------------------------------------------------------- tooltip */
function tip(text) {
  const mark = el("button", "qmark", "?");
  mark.type = "button";
  mark.setAttribute("aria-label", text);
  const show = () => {
    hideTips();
    const bubble = el("div", "tipbubble show", text);
    document.body.append(bubble);
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
  mark.onclick = (e) => { e.preventDefault(); e.stopPropagation(); show(); };
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
  bible: "Your character's lore. Raw material only — none of it is printed into the card as written. With AI assist on, this is what the model works from.",
  hard: "The Hard Rules file. It is the primary method: it governs conduct, the locks, the kinks the GameMaster must use, and the voice line. It is never written from a blank page — it is built from templates.",
  profile: "What a stranger can see. The body, the cover story, likes, dislikes. Nothing about how they behave: the Hard Rules hold that.",
  psych: "An outside analyst's case assessment. It explains the cause behind behaviour the profile only shows. Nobody in the story can see it, and no secret appears in it.",
  side: "A secondary character gets the same profile as the lead plus the two fields the Hard Rules would otherwise hold. Minor people stay one-line embeds.",
  scenario: "The plot engine, then the numbered plots. The engine keeps the world moving on its own; the plots are what the player works through.",
  secrets: "The facts the character hides. The player earns them through evidence, slips, and contradictions — never a confession.",
  greeting: "The opening message. First time meeting everybody, one hook at the end, and the filled tracker underneath.",
  rules: "The rule blocks, shipped as their own file beside the card. Not in the scenario, not in the Hard Rules.",
  trackers: "The status lines the card keeps under every reply. Few, and each one has to change what the GameMaster does.",
  tags: "The tags the sites know. Ten at most on a card.",
  ai: "Optional. Write everything in plain English, then run Enhance. The model fills what you left blank and offers a version of what you wrote — you pick, field by field.",
  review: "Your version and the AI's version, side by side. Nothing is replaced — you pick which one exports.",
  export: "The finished card in the formats the sites ask for: the tipsy txt, the json, the png, and the rules file.",
  lintflag: "Step 0 runs while you type: no child ages, no pre-adult words, nothing minor-coded. It checks every field, including anything the AI wrote.",
};

/* --------------------------------------------------------------- storage */
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} }
function load() {
  try {
    const mine = localStorage.getItem(STORE);
    if (mine) return JSON.parse(mine);
    // A save from the old method cannot be folded into this one: the fields
    // are different. It is left where it is, untouched.
    return null;
  } catch { return null; }
}
function hasOldSave() { try { return !!localStorage.getItem(OLDSTORE); } catch { return false; } }

/* ------------------------------------------------------------ step 0 lint */
function lintText(text, rules = LINTS) {
  if (!text) return [];
  const hits = [];
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    const found = [...String(text).matchAll(rule.re)].map((m) => m[0]);
    if (found.length) hits.push({ ...rule, found: [...new Set(found)] });
  }
  return hits;
}
function allLintHits(rules = LINTS) {
  const out = [];
  for (const entry of registry()) {
    for (const hit of lintText(entry.get(), rules)) out.push({ where: entry.label, ...hit });
    const ai = state.characters[0] && aiOut(entry.key);
    if (ai) for (const hit of lintText(ai, rules)) out.push({ where: `${entry.label} (AI version)`, ...hit });
  }
  return out;
}

/* ------------------------------------------------------- the value layer */
// Everything fillable in the builder has one key. The steps write through
// their own state, and Review, the blanks sheet and the AI readback all walk
// the register, so nothing is left out of any of them.

function chosen(id, character = current()) {
  return character.choice[id] === "ai" && character.enhanced[id]
    ? character.enhanced[id] : character.values[id];
}
function aiOut(key) {
  const [kind, ...rest] = key.split(".");
  if (kind === "char") {
    const index = Number(rest[0]);
    return (state.characters[index] || {}).enhanced?.[rest[1]] || "";
  }
  return (state.aiOut || {})[key] || "";
}
function pickAi(key, on) {
  const [kind, ...rest] = key.split(".");
  if (kind === "char") {
    const character = state.characters[Number(rest[0])];
    if (character) character.choice[rest[1]] = on ? "ai" : "mine";
    return;
  }
  state.pickAi ||= {};
  state.pickAi[key] = !!on;
}
function usingAi(key) {
  const [kind, ...rest] = key.split(".");
  if (kind === "char") {
    const character = state.characters[Number(rest[0])];
    return !!character && character.choice[rest[1]] === "ai";
  }
  return !!(state.pickAi || {})[key];
}
function setAi(key, text) {
  const [kind, ...rest] = key.split(".");
  if (kind === "char") {
    const character = state.characters[Number(rest[0])];
    if (character) character.enhanced[rest[1]] = text;
    return;
  }
  state.aiOut ||= {};
  state.aiOut[key] = text;
}

// key -> { label, help, own value, setter }
function registry() {
  const out = [];
  state.characters.forEach((character, index) => {
    const prefix = state.characters.length > 1 ? `${charName(index)} · ` : "";
    for (const section of SECTIONS) {
      for (const [id, label, help, opts = {}] of section.fields) {
        if (section.id === "scenario" && index > 0) continue;   // one card, one story
        out.push({
          key: `char.${index}.${id}`, id, label: prefix + swap(label, character),
          help: swap(help, character), section: section.title, exported: section.exported,
          get: () => own(`char.${index}.${id}`),
          set: (v) => { character.values[id] = v; },
        });
      }
    }
  });
  const built = hardBuilt();
  if (built) {
    for (const slot of HR.slotsOf(built)) {
      out.push({
        key: `hard.${slot.id}`, id: slot.id,
        label: `Hard Rules ${slot.section === "h" ? "header" : "section " + slot.section} · ${slot.help.slice(0, 60)}`,
        help: slot.help, section: "Hard Rules", exported: true,
        // The line the blank sits inside is most of what the answer has to fit.
        hint: `${slot.help.replace(/\.$/, "")}${slot.context ? `. It goes into this line, so it has to read as part of it: "${slot.context.replace(/<[^<>]*>/g, "…")}"` : ""}`,
        get: () => state.hard.slots[slot.id] || "",
        set: (v) => { state.hard.slots[slot.id] = v; },
      });
    }
  }
  state.secondary.forEach((person, index) => {
    for (const [id, label, help] of SECONDARY_FIELDS)
      out.push({
        key: `second.${index}.${id}`, id, label: `${person.first_name || `Secondary ${index + 1}`} · ${label}`,
        help, section: "Secondary characters", exported: true,
        get: () => person[id] || "",
        set: (v) => { person[id] = v; },
      });
  });
  state.embeds.forEach((value, index) => {
    out.push({
      key: `embed.${index}`, id: `embed${index}`, label: `Embed ${index + 1}`,
      help: "One line: name, age, gender, appearance tags, then a sentence or two.",
      section: "NPC embeds", exported: true,
      get: () => state.embeds[index] || "",
      set: (v) => { state.embeds[index] = v; },
    });
  });
  state.plots.forEach((plot, index) => {
    out.push({
      key: `plot.${index}.title`, id: `plot${index}title`, label: `Plot ${index + 1} · title`,
      help: "What this plot is called.", section: "The plots", exported: true,
      get: () => plot.title || "", set: (v) => { plot.title = v; },
    });
    out.push({
      key: `plot.${index}.bullets`, id: `plot${index}bullets`, label: `Plot ${index + 1} · bullets`,
      help: "Four to nine bullets, one fact each, one per line. The last one starts \"This plot ends when\" and names an event the GameMaster can see in the scene.",
      section: "The plots", exported: true,
      get: () => plot.bullets || "", set: (v) => { plot.bullets = v; },
    });
  });
  for (const tracker of liveTrackers()) {
    if (tracker.rule) continue;                       // fixed wording
    out.push({
      key: `trackrule.${tracker.id}`, id: `trackrule_${tracker.id}`,
      label: `${tracker.name} tracker · update rule`, help: tracker.ruleHelp || "",
      section: "Trackers", exported: true,
      get: () => state.trackerRules[tracker.id] || "",
      set: (v) => { state.trackerRules[tracker.id] = v; },
    });
  }
  if (state.rules.narrator) {
    for (const [id, label, help] of RULE_MENU.find((r) => r.id === "narrator").slots)
      out.push({
        key: `narrator.${id}`, id: `narrator_${id}`, label: `Narrator · ${label}`, help,
        section: "Rules file", exported: true,
        get: () => state.narrator[id] || "", set: (v) => { state.narrator[id] = v; },
      });
  }
  out.push({
    key: "cast.opening", id: "openingCast", label: "Who is in the opening scene",
    help: "One stat line per character in the scene, in the tracker format.",
    section: "Greeting", exported: true,
    get: () => state.openingCast || "", set: (v) => { state.openingCast = v; },
  });
  return out;
}

const byKey = () => Object.fromEntries(registry().map((e) => [e.key, e]));

// What the author themselves wrote, straight out of the state the step keeps.
// Reading it this way means nothing has to walk the whole register.
function own(key) {
  const parts = key.split(".");
  const [kind, a, b] = parts;
  switch (kind) {
    case "char": return (state.characters[Number(a)] || {}).values?.[b] || "";
    case "hard": return state.hard.slots[parts.slice(1).join(".")] || "";
    case "second": return (state.secondary[Number(a)] || {})[b] || "";
    case "embed": return state.embeds[Number(a)] || "";
    case "plot": return (state.plots[Number(a)] || {})[b] || "";
    case "trackrule": return state.trackerRules[a] || "";
    case "narrator": return state.narrator[a] || "";
    case "cast": return state.openingCast || "";
    default: return "";
  }
}

// What exports: the AI version where it is picked, otherwise what they wrote.
function value(key) {
  return usingAi(key) && aiOut(key) ? aiOut(key) : own(key);
}

/* ------------------------------------------------------------ hard rules */
function hardWho() {
  const character = state.characters[0];
  return {
    name: chosen("first_name", character) || "Name",
    age: chosen("age", character) || "",
    gender: character.values.gender || "",
    cardName: (chosen("first_name", character) || "Card name").toUpperCase(),
  };
}
let hardCache = null;
function hardBuilt() {
  const { types, scenes, ageGap } = state.hard;
  if (!types.length && !scenes.length) return null;
  const who = hardWho();
  const stamp = JSON.stringify([types, scenes, ageGap, who]);
  if (!hardCache || hardCache.stamp !== stamp) {
    hardCache = { stamp, built: HR.assemble({ types, scenes, ageGap, who }) };
  }
  return hardCache.built;
}
function hardText() {
  if (state.hard.edited != null) return state.hard.edited;
  const built = hardBuilt();
  if (!built) return "";
  const values = {};
  for (const slot of HR.slotsOf(built)) values[slot.id] = value(`hard.${slot.id}`);
  return HR.render(built, values);
}
function hardBlanks() {
  const built = hardBuilt();
  if (!built) return 0;
  return HR.slotsOf(built).filter((slot) => !value(`hard.${slot.id}`).trim()).length;
}

/* -------------------------------------------------------------- assemble */
function profileBlock(character, index) {
  const section = SECTIONS.find((s) => s.id === "profile");
  const name = chosen("first_name", character) || charName(index);
  const lines = [];
  const promoted = SECTIONS.find((s) => s.id === "bible").fields.filter((f) => (f[3] || {}).always && (f[3] || {}).line);
  for (const [id, , , opts] of promoted) {
    const text = value(`char.${index}.${id}`).trim();
    if (text) lines.push(`${opts.line}: ${text}`);
  }
  for (const [id, , , opts = {}] of section.fields) {
    const text = value(`char.${index}.${id}`).trim();
    if (text) lines.push(`${opts.line}: ${text}`);
  }
  if (!lines.length) return "";
  const [open, close] = section.wrap(name);
  return [open, ...lines, close].join("\n");
}

function psychBlock(character, index) {
  const section = SECTIONS.find((s) => s.id === "psych");
  const name = chosen("first_name", character) || charName(index);
  const lines = section.fields
    .map(([id, , , opts = {}]) => {
      const text = value(`char.${index}.${id}`).trim();
      return text ? `${opts.line}: ${text}` : "";
    })
    .filter(Boolean);
  if (!lines.length) return "";
  const [open, close] = section.wrap(name);
  return [open, ...lines, close].join("\n");
}

function secondaryBlock(person, index) {
  const lines = SECONDARY_FIELDS
    .map(([id, label]) => {
      const text = value(`second.${index}.${id}`).trim();
      return text ? `${label}: ${text}` : "";
    })
    .filter(Boolean);
  if (!lines.length) return "";
  const name = value(`second.${index}.first_name`).trim() || "Name";
  return [`[${name}'s Character Profile:`, ...lines, "]"].join("\n");
}

// Takes whatever they wrote and lands it in the embed shape from the method:
// [Name — age:XX;gender:X;appearance:tag,tag. Personality sentences.]
function formatEmbed(raw) {
  let text = String(raw).trim().replace(/^\[|\]$/g, "").trim();
  if (/—\s*age:/i.test(text)) return `[${text}]`;
  const parts = text.split(/,\s*/);
  const name = (parts.shift() || "Name").trim();
  const age = (parts.find((p) => /^\d{1,3}$/.test(p.trim())) || "").trim();
  const gender = (parts.find((p) => /^(male|female|man|woman|other|nb|non-?binary|m|f)$/i.test(p.trim())) || "").trim();
  const used = new Set([age, gender]);
  const remainder = parts.filter((p) => !used.has(p.trim())).join(", ");
  // The appearance tags run until the first sentence ends. Everything after
  // that full stop is the personality, however the author punctuated it.
  const stop = remainder.search(/[.!?]/);
  const tags = (stop === -1 ? remainder : remainder.slice(0, stop))
    .split(/,\s*/).map((s) => s.trim()).filter(Boolean);
  const prose = stop === -1 ? "" : remainder.slice(stop + 1).trim();
  const head = [name, age && `age:${age}`, gender && `gender:${gender.toLowerCase()}`,
                tags.length && `appearance:${tags.join(",")}`].filter(Boolean);
  return `[${head[0]} — ${head.slice(1).join(";")}${prose ? ". " + prose : "."}]`;
}

// The description: the Hard Rules once at the top, then the profiles, then
// the embeds. Nothing is repeated anywhere else in the card.
function buildDescription() {
  const blocks = [hardText()];
  state.characters.forEach((character, index) => {
    blocks.push(profileBlock(character, index));
    blocks.push(psychBlock(character, index));
  });
  state.secondary.forEach((person, index) => blocks.push(secondaryBlock(person, index)));
  const embeds = state.embeds.map((e, i) => value(`embed.${i}`)).filter((e) => e && e.trim()).map(formatEmbed);
  if (embeds.length) blocks.push(embeds.join("\n"));
  return blocks.filter((b) => b && b.trim()).join("\n\n");
}

// The plot engine, in the shape the method fixes. Only the contents change.
function plotEngine() {
  // A field dropped into the middle of a sentence loses a trailing full stop.
  // A field that is its own sentence keeps every mark the author typed.
  const mid = (id) => value(`char.0.${id}`).trim().replace(/\s*\.$/, "");
  const whole = (id) => {
    const text = value(`char.0.${id}`).trim();
    return text && !/[.!?]$/.test(text) ? `${text}.` : text;
  };
  const lines = (id) => value(`char.0.${id}`).split("\n").map((l) => l.trim()).filter(Boolean);
  const name = leadName();
  const words = pronounsFor(state.characters[0]);
  const place = mid("pe_place"), beings = mid("pe_beings"), inhabitants = mid("pe_inhabitants");
  const goal = mid("pe_goal"), help = mid("pe_help"), trouble = mid("pe_trouble");
  const antagonists = whole("pe_antagonists"), idle = mid("pe_idle"), sources = mid("pe_sources");
  const loop = lines("pe_loop");
  const refuse = lines("pe_refuse");
  if (!place && !inhabitants && !goal) return "";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const quote = (list) => list.map((l) => `“${l.replace(/^[“"]|[”"]$/g, "")}”`).join("\n");

  const one = [
    `All manner of ${beings || "people"} live in ${place || "this place"}, ${inhabitants || "its people"}, and something is always about to happen.`,
    "Do not let {{user}} fall into an endless sex loop.",
    `${cap(place || "The place")} keeps moving whether or not {{user}} acts.`,
    `${name} wants ${goal || "what they are after"}, and ${words.their} goal is to have {{user}} help ${words.them}${help ? " " + help : ""}.`,
    trouble ? `Create trouble for {{user}} to handle, with and without ${name} present: ${trouble}.` : "",
    antagonists,
    idle ? `When {{user}} goes idle, ${idle}.` : "",
  ].filter(Boolean).join(" ");

  const two = [
    `Once the main story is over, ${name} will always have new stories for {{user}}.`,
    "Build each new story the same way.",
    `Start with a problem that reaches ${name}.`,
    `Give {{user}} clues, dead ends, and complications to work through, with and without ${name} present.`,
    "Let the problem end only when {{user}} has earned it.",
    sources ? `Pull new problems from ${place || "the place"} itself: ${sources}.` : "",
  ].filter(Boolean).join(" ");

  const parts = [one, two];
  if (loop.length) parts.push(`If {{user}} gets stuck having sex with ${name}, ${name} ends it and moves the story on:\n${quote(loop)}`);
  if (refuse.length) parts.push(`Regarding sex, create complications and let ${name} refuse on ${words.their} own terms, because ${words.they} ${words.do === "does" ? "decides" : "decide"} when, never {{user}}:\n${quote(refuse)}`);
  return `{Plot engine: ${parts.join("\n\n")}}`;
}

function plotsSection() {
  const written = state.plots
    .map((plot, index) => ({ index, title: value(`plot.${index}.title`).trim(), bullets: value(`plot.${index}.bullets`).trim() }))
    .filter((p) => p.title || p.bullets);
  if (!written.length) return "";
  const opening = value("char.0.plots_opening").trim();
  const out = ["#Plots"];
  if (opening) out.push(opening);
  out.push(...PLOT_RUN_RULES);
  written.forEach((plot, n) => {
    out.push("", `#Plot ${n + 1}${plot.title ? " – " + plot.title : ""}`);
    plot.bullets.split("\n").map((l) => l.trim()).filter(Boolean)
      .forEach((line) => out.push(/^[-•]/.test(line) ? line.replace(/^[•]/, "-") : `- ${line}`));
  });
  return out.join("\n");
}

function gatedBlock() {
  const secrets = value("char.0.gated").trim();
  if (!secrets) return "";
  const knows = value("char.0.secrets_who").trim();
  const name = leadName();
  const head = `{ABSOLUTELY CRITICAL INFORMATION BELOW IS ONLY KNOWN BY ${name}${knows ? ` and ${knows}` : ""}, and no one else. ${name} never confesses any of it. Anything the player learns must be earned slowly, through physical evidence, overheard moments, contradictions caught side by side, or somebody else talking, and it should always land in a meaningful moment rather than casually:`;
  const lines = secrets.split("\n").map((l) => l.trim()).filter(Boolean)
    .map((l) => (/^[-•]/.test(l) ? l.replace(/^[•]/, "-") : `- ${l}`));
  return [head, ...lines, "}"].join("\n");
}

function liveTrackers() {
  return TRACKER_KIT.filter((tracker) => {
    if (tracker.withPlots) return state.plots.some((p, i) => value(`plot.${i}.title`).trim() || value(`plot.${i}.bullets`).trim());
    return !!state.trackers[tracker.id];
  });
}

function trackerLine(tracker) {
  const start = (state.trackerStart[tracker.id] ?? tracker.start ?? "").trim();
  return `[${tracker.icon} ${tracker.label}: ${start || "<start value>"}]:#`;
}

function trackerBlock() {
  const live = liveTrackers();
  const rules = live.map((tracker) => {
    if (tracker.rule) return tracker.rule;                 // fixed wording, as it is
    const written = value(`trackrule.${tracker.id}`).trim();
    if (!written) return "";
    return written.startsWith(`${tracker.label}:`) ? written : `${tracker.label}: ${written}`;
  }).filter(Boolean);
  const parts = [TRACKER_HEAD, ""];
  if (live.length) parts.push(live.map(trackerLine).join("\n"), "");
  parts.push(TRACKER_RULES);
  if (rules.length) parts.push("", `[Tracker update rules:`, ...rules, "]");
  parts.push("]");
  return parts.join("\n");
}

function buildScenario() {
  return [plotEngine(), plotsSection(), gatedBlock(), trackerBlock()]
    .filter((b) => b && b.trim()).join("\n\n");
}

// The greeting as it ships: their opening, then the filled tracker.
function trackerSeed() {
  const cast = value("cast.opening").trim();
  const lines = ["---", "", "⌚ Time: MM/DD/YYYY HH:MM AM/PM", "", "---", "", "🤼", ""];
  lines.push(cast || "N/A; N/A; ⧗ N/A; 📏 N/A; ☮ N/A; 👚 N/A; ☠ N/A");
  const live = liveTrackers();
  if (live.length) { lines.push(""); live.forEach((tracker) => lines.push(trackerLine(tracker))); }
  return lines.join("\n");
}

function greetingPlain() {
  const own = value("char.0.greeting").trim();
  if (!own) return "";
  return `${own}\n\n${trackerSeed()}`;
}

// tipsy.chat: paragraphs separated by <p></p>, or the HTML greeting when the
// card has HTML switched on. The json and the png never use either.
function greetingTipsy() {
  const own = value("char.0.greeting").trim();
  if (!own) return "";
  if (!state.tipsyHtml) {
    const body = own.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).join("\n<p></p>\n");
    return `${body}\n<p></p>\n${trackerSeed()}`;
  }
  return greetingHtml();
}

function greetingHtml() {
  const own = value("char.0.greeting").trim();
  if (!own) return "";
  // Narration is wrapped in <em>, spoken lines stay plain in their quotes.
  const markup = (paragraph) =>
    paragraph.replace(/\*([^*]+)\*/g, (_, inner) => `<em>${inner.trim()}</em>`).replace(/\n/g, " ").trim();
  const body = own.split(/\n{2,}/).map((p) => markup(p)).filter(Boolean).join("<br><br>");
  const cast = value("cast.opening").trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const live = liveTrackers();
  const out = [TIPSY_WRAP_OPEN, body, "<br><br>", TIPSY_DIVIDER, "<br>",
               "⌚ Time: MM/DD/YYYY HH:MM AM/PM", "<br><br>", TIPSY_DIVIDER, "<br>", "🤼", "<br>"];
  out.push((cast.length ? cast : ["N/A; N/A; ⧗ N/A; 📏 N/A; ☮ N/A; 👚 N/A; ☠ N/A"]).join("<br>"));
  out.push("<br><br>");
  if (live.length) out.push(live.map(trackerLine).join("<br>"));
  out.push("</div>");
  return out.join("\n");
}

function rulesFile() {
  const blocks = [ALWAYS_21];
  if (state.rules.isolation) blocks.push(RULE_BLOCKS.isolation);
  if (state.rules.texting) blocks.push(`[TEXT MESSAGE FORMAT:\n${RULE_BLOCKS.texting}]`);
  if (state.rules.narrator) blocks.push(narratorBlock());
  return blocks.join("\n\n");
}

function narratorBlock() {
  const slot = (id) => value(`narrator.${id}`).trim();
  let text = RULE_BLOCKS.narrator;
  const swaps = [
    [/\[PURPOSE\]/g, slot("purpose")],
    [/\[SETTING-SPECIFIC SENSORY FOCUS\]/g, slot("sensory")],
    [/\[CHARACTER\]/g, slot("character") || leadName()],
    [/\[CHARACTER-SPECIFIC BEHAVIOR\]/g, slot("behavior")],
    [/\[purpose — e\.g\., dread-builder, clue-dropper, tension-builder\]/g, slot("purpose")],
    [/\[tone — e\.g\., ominous and clinical, cold and observant\]/g, slot("tone")],
    [/\[what it accomplishes — e\.g\., make \{\{user\}\} feel unsafe\]/g, slot("goal")],
    [/\[stance — e\.g\., neutral observer, does not protect, does not warn\]/g, slot("stance")],
  ];
  // A slot he has not answered keeps its bracket, so nothing is invented.
  for (const [pattern, written] of swaps) if (written) text = text.replace(pattern, written);
  return text;
}

/* ----------------------------------------------------------------- steps */
const STEPS = [
  { id: "bible",    label: "Lore",        tip: () => TIPS.bible },
  { id: "hard",     label: "Hard Rules",  tip: () => TIPS.hard },
  { id: "profile",  label: "Profile",     tip: () => TIPS.profile },
  { id: "psych",    label: "Psychology",  tip: () => TIPS.psych },
  { id: "side",     label: "Side cast",   tip: () => TIPS.side },
  { id: "scenario", label: "Scenario",    tip: () => TIPS.scenario },
  { id: "secrets",  label: "Secrets",     tip: () => TIPS.secrets },
  { id: "greeting", label: "Greeting",    tip: () => TIPS.greeting },
  { id: "rules",    label: "Rules file",  tip: () => TIPS.rules },
  { id: "trackers", label: "Trackers",    tip: () => TIPS.trackers },
  { id: "tags",     label: "Tags",        tip: () => TIPS.tags },
  { id: "ai",       label: "AI assist",   tip: () => TIPS.ai },
  { id: "review",   label: "Review",      tip: () => TIPS.review },
  { id: "export",   label: "Export",      tip: () => TIPS.export },
];

function stepState(id) {
  const section = SECTIONS.find((s) => s.id === id);
  if (section && id !== "scenario") {
    let filled = 0, total = 0, problem = false;
    for (let index = 0; index < state.characters.length; index++) {
      for (const field of section.fields) {
        if ((field[3] || {}).ownStep) continue;
        total++;
        const text = value(`char.${index}.${field[0]}`) || "";
        if (text.trim()) filled++;
        if (lintText(text).length || lintText(aiOut(`char.${index}.${field[0]}`)).length) problem = true;
      }
    }
    if (section.fields.some((f) => (f[3] || {}).minAge) && ageProblem()) problem = true;
    if (problem) return { state: "problem", count: `${filled}/${total}` };
    if (!filled) return { state: "empty", count: `0/${total}` };
    return { state: filled >= total ? "done" : "part", count: `${filled}/${total}` };
  }

  if (id === "hard") {
    if (!state.hard.types.length && !state.hard.scenes.length) return { state: "empty", count: "" };
    const built = hardBuilt();
    const total = HR.slotsOf(built).length;
    const left = hardBlanks();
    if (state.hard.edited != null) return { state: "done", count: "edited" };
    if (left) return { state: left === total ? "empty" : "part", count: `${total - left}/${total}` };
    return { state: "done", count: `${total}/${total}` };
  }
  if (id === "scenario") {
    const engine = ["pe_place", "pe_inhabitants", "pe_goal", "pe_help", "pe_trouble", "pe_antagonists", "pe_idle", "pe_sources", "pe_loop", "pe_refuse", "pe_beings"];
    const done = engine.filter((key) => value(`char.0.${key}`).trim()).length;
    const plots = state.plots.filter((p, i) => value(`plot.${i}.bullets`).trim()).length;
    const total = engine.length + Math.max(state.plots.length, 2);
    const filled = done + plots;
    if (!filled) return { state: "empty", count: `0/${total}` };
    return { state: filled >= total ? "done" : "part", count: `${filled}/${total}` };
  }
  if (id === "secrets") {
    const text = value("char.0.gated").trim();
    if (lintText(text).length) return { state: "problem", count: "" };
    return { state: text ? "done" : "empty", count: text ? String(text.split("\n").filter((l) => l.trim()).length) : "0" };
  }
  if (id === "side") {
    const items = state.secondary.length + state.embeds.filter(Boolean).length;
    const problem = registry().filter((e) => e.key.startsWith("second.") || e.key.startsWith("embed."))
      .some((e) => lintText(e.get()).length);
    if (problem) return { state: "problem", count: String(items) };
    return { state: items ? "done" : "empty", count: String(items) };
  }
  if (id === "greeting") {
    const text = value("char.0.greeting").trim();
    if (lintText(text).length) return { state: "problem", count: "" };
    return { state: text ? "done" : "empty", count: "" };
  }
  if (id === "rules") {
    const on = RULE_MENU.filter((r) => state.rules[r.id]).length;
    return { state: "done", count: String(on + 1) };      // the always-21 block is always in
  }
  if (id === "trackers") return { state: "done", count: String(liveTrackers().length) };
  if (id === "tags") {
    const on = pickedTags().length;
    return { state: on ? "done" : "empty", count: String(on) };
  }
  if (id === "ai") return { state: aiCount() ? "done" : "part", count: aiCount() ? String(aiCount()) : "" };
  if (id === "review") {
    if (allLintHits().length) return { state: "problem", count: String(allLintHits().length) };
    return { state: aiCount() ? "done" : "empty", count: aiCount() ? String(aiCount()) : "" };
  }
  if (id === "export") return { state: allLintHits().length ? "problem" : "done", count: "" };
  return { state: "empty", count: "" };
}

function activeSteps() {
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
    go.append(el("span", "pillnum", String(index + 1)));
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
  $("#progress").textContent = `Step ${index + 1} of ${steps.length} · ${steps[index].label}`;
  const back = $("#back"), next = $("#next");
  back.disabled = index === 0;
  next.disabled = index === steps.length - 1;
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

function aiCount() {
  const mine = state.characters.reduce((n, c) => n + Object.values(c.enhanced).filter(Boolean).length, 0);
  return mine + Object.values(state.aiOut || {}).filter(Boolean).length;
}

/* ---------------------------------------------------------------- fields */
function fieldBox(id, label, help, text, onInput, opts = {}) {
  const wrap = el("div", "field");
  const head = el("div", "fieldhead");
  head.append(el("label", null, label));
  head.append(tip(opts.tip || help));
  if (opts.badge) head.append(el("span", "badge", opts.badge));
  wrap.append(head);
  if (help) wrap.append(el("p", "help", help));
  if (opts.choices) {
    const picks = el("div", "choices");
    for (const choice of opts.choices) {
      const btn = el("button", "choice" + (text === choice ? " on" : ""), choice);
      btn.type = "button";
      btn.onclick = () => { onInput(choice); save(); render(); };
      picks.append(btn);
    }
    wrap.append(picks);
    return wrap;
  }
  const input = el("textarea");
  if (opts.short) input.rows = 1;
  if (opts.rows) input.rows = opts.rows;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  input.value = text || "";
  input.oninput = (e) => {
    onInput(e.target.value);
    save();
    showLint(wrap, e.target.value);
    renderRail();
    if (id === "first_name") refreshChips();
  };
  wrap.append(input);
  showLint(wrap, text);
  return wrap;
}

function showLint(wrap, text) {
  wrap.querySelectorAll(".lint").forEach((n) => n.remove());
  for (const hit of lintText(text)) {
    const warn = el("p", "lint");
    warn.append(el("strong", null, `Step 0 — ${hit.label}: `));
    warn.append(document.createTextNode(`“${hit.found.join("”, “")}”. ${hit.why}`));
    wrap.append(warn);
  }
  for (const hit of lintText(text, STYLE_LINTS)) {
    const warn = el("p", "lint soft");
    warn.append(el("strong", null, `House style — ${hit.label}: `));
    warn.append(document.createTextNode(`“${hit.found.join("”, “")}”. ${hit.why}`));
    wrap.append(warn);
  }
}

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
  if (tipText) head.append(tip(tipText));
  main.append(head);
  if (blurb) main.append(el("p", "blurb", blurb));
}

function refreshChips() {
  const chips = document.querySelectorAll(".chips .chip:not(.add)");
  chips.forEach((chip, index) => { chip.textContent = charName(index); });
}

function portraitBox() {
  const card = el("div", "card portrait");
  const head = el("div", "fieldhead");
  head.append(el("label", null, "Picture (optional)"));
  head.append(tip("Two uses. With AI assist on, the model looks at it while writing the appearance. On export it becomes the card image, with the character written inside the file."));
  card.append(head);
  card.append(el("p", "help", "Stays on your device. It is sent to the AI only when you run Enhance, and only to the vendor you picked."));

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
    try { current().image = await shrink(chosenFile); save(); render(); }
    catch (err) { status(err.message, true); }
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
  label.append(el("label", null, `Characters with a full build: ${state.characters.length}`));
  label.append(tip("A character here gets the profile and the psychological profile. The Hard Rules cover the main character only — everybody else belongs on the side cast step."));
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
  main.append(bar);
}

function renderSection(section) {
  const main = $("#main");
  sectionHeading(main, `${section.step} · ${section.title}`, section.blurb, TIPS[section.id]);
  castBar(main);
  if (section.id === "bible") main.append(portraitBox());
  if (state.characters.length > 1)
    main.append(el("p", "note", `Writing ${charName(who)} — character ${who + 1} of ${state.characters.length}.`));
  if (!section.exported) main.append(el("p", "note",
    "Not printed into the card as written. It is the raw material behind it, and what the AI works from."));

  for (const [id, label, help, opts = {}] of section.fields) {
    if (opts.ownStep || opts.plotEngine) continue;
    main.append(fieldBox(id, swap(label, current()), swap(help, current()), value(`char.${who}.${id}`),
      (v) => { current().values[id] = v; current().choice[id] = "mine"; }, opts));
  }
}

/* ----------------------------------------------------------- hard rules */
function pickRow(main, title, help, list, picked, onToggle) {
  const card = el("div", "card");
  const head = el("div", "fieldhead");
  head.append(el("h3", null, title));
  head.append(tip(help));
  card.append(head);
  card.append(el("p", "help", help));
  const wrap = el("div", "pickwrap");
  for (const item of list) {
    const on = picked.includes(item.id);
    const row = el("label", "pickcard" + (on ? " on" : ""));
    const box = el("input");
    box.type = "checkbox";
    box.checked = on;
    box.onchange = () => { onToggle(item.id, box.checked); };
    row.append(box);
    const text = el("div", "picktext");
    text.append(el("strong", null, item.label));
    text.append(el("span", null, item.cue));
    row.append(text);
    wrap.append(row);
  }
  card.append(wrap);
  main.append(card);
}

function renderHard() {
  const main = $("#main");
  sectionHeading(main, "Step 2 · The Hard Rules file",
    "The primary method. It governs conduct, the locks, the kinks the GameMaster must use, and what the GameMaster always or never does. It covers the main character only — a secondary character never gets Hard Rules.",
    TIPS.hard);

  const toggle = (bucket) => (id, on) => {
    const list = state.hard[bucket];
    const at = list.indexOf(id);
    if (on && at === -1) list.push(id);
    if (!on && at >= 0) list.splice(at, 1);
    state.hard.edited = null;
    save(); render();
  };

  pickRow(main, "Personality types", "Who the character is. Pick as many as fit — they go into one TYPE block, never stacked as separate sections.",
    PERSONALITY_TYPES, state.hard.types, toggle("types"));
  pickRow(main, "Scene types", "How “no” works in this card. Add one only when the story needs it. Picked on its own, a scene type becomes the base and you write the TYPE block yourself.",
    SCENE_TYPES, state.hard.scenes, toggle("scenes"));

  const gap = el("div", "card");
  gap.append(toggleSwitch("An age gap is taboo in this world", !!state.hard.ageGap, (on) => {
    state.hard.ageGap = on; state.hard.edited = null; save(); render();
  }));
  const why = el("div", "fieldhead");
  why.append(el("p", "help", "Yes adds four lines to the file, in his wording: how the character reacts, the lock, what the world thinks, and the player prompt that loses. {{user}}'s minimum age is half of {{user}}'s age plus 7, never under 18, and the gap breaks the rule when that number is higher than the character's age."));
  why.append(tip("Left off, nothing is added anywhere."));
  gap.append(why);
  main.append(gap);

  const built = hardBuilt();
  if (!built) {
    main.append(el("p", "note", "Pick at least one template and the file appears here, with every blank in it listed in order."));
    return;
  }

  // What the templates say about building this type. Not shipped in the file.
  const notes = [...state.hard.types, ...state.hard.scenes].flatMap((id) => {
    const lines = HR.buildNotes(id).map((line) => HR.fillKnown(line, hardWho()));
    const label = [...PERSONALITY_TYPES, ...SCENE_TYPES].find((t) => t.id === id)?.label || id;
    return lines.length ? [{ label, lines }] : [];
  });
  if (notes.length) {
    const card = el("div", "card");
    const head = el("div", "fieldhead");
    head.append(el("h3", null, "How to build these types"));
    head.append(tip("The notes the templates carry. They are instructions for you, and they are deleted from the file before it ships."));
    card.append(head);
    for (const note of notes) {
      card.append(el("h4", "castheading", note.label));
      const list = el("ul", "ridelist");
      note.lines.forEach((line) => list.append(el("li", null, line.replace(/^-\s*/, ""))));
      card.append(list);
    }
    main.append(card);
  }

  const slots = HR.slotsOf(built);
  const left = hardBlanks();
  const count = el("div", "card" + (left ? " warn" : ""));
  count.append(el("h3", null, left
    ? `${left} blank${left === 1 ? "" : "s"} left of ${slots.length}`
    : `Every blank is filled — ${slots.length} of ${slots.length}`));
  count.append(el("p", "help", "A blank you leave empty takes its line out of the file, and a section left with nothing loses its heading and the rest renumber. That is the method: fill it or delete the line."));
  main.append(count);

  let lastSection = null;
  for (const slot of slots) {
    if (slot.section !== lastSection) {
      lastSection = slot.section;
      const where = slot.section === "h" ? "The header" : `${slot.section}. ${slot.heading}`;
      main.append(el("h3", "castheading", where));
    }
    const box = fieldBox(slot.id, slot.help, "", value(`hard.${slot.id}`),
      (v) => { state.hard.slots[slot.id] = v; state.hard.edited = null; },
      { short: slot.kind === "line", rows: slot.kind === "numbered" ? 4 : undefined,
        tip: slot.kind === "numbered" ? "One per line. They are numbered in the file for you." : slot.help });
    if (slot.context) {
      const line = el("p", "slotline", slot.context.replace(/<[^<>]*>/g, "⟨…⟩"));
      box.insertBefore(line, box.querySelector("textarea"));
    }
    main.append(box);
  }

  const file = el("div", "card");
  const fileHead = el("div", "fieldhead");
  fileHead.append(el("h3", null, "The file"));
  fileHead.append(tip("Everything above, assembled. This is what goes at the top of the description and into the HARD RULES section of the tipsy file."));
  if (state.hard.edited != null) fileHead.append(el("span", "badge", "edited by hand"));
  file.append(fileHead);
  if (hardEditing || state.hard.edited != null) {
    const area = el("textarea", "hardedit");
    area.rows = 24;
    area.value = hardText();
    area.oninput = () => { state.hard.edited = area.value; save(); renderRail(); };
    file.append(area);
    const row = el("div", "row buttons");
    const back = el("button", "ghost danger", "Throw my edits away");
    back.onclick = () => {
      if (!confirm("Drop the hand edits and go back to the file the templates build?")) return;
      state.hard.edited = null; hardEditing = false; save(); render();
    };
    row.append(back);
    file.append(row);
    file.append(el("p", "note", "While this is edited by hand, the blanks above no longer change the file."));
  } else {
    file.append(el("pre", "output", hardText() || "Nothing yet."));
    const row = el("div", "row buttons");
    const edit = el("button", "ghost", "Edit the file by hand");
    edit.onclick = () => { hardEditing = true; render(); };
    const copy = el("button", "ghost", "Copy it");
    copy.onclick = async () => {
      await navigator.clipboard.writeText(hardText());
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy it"), 1500);
    };
    row.append(edit, copy);
    file.append(row);
  }
  main.append(file);
}

/* ------------------------------------------------------------ side cast */
function renderSideCast() {
  const main = $("#main");
  sectionHeading(main, "Step 5 · Side cast",
    "A secondary character gets the same six profile fields as the lead, plus Behavior during sex and Kinks — they have no Hard Rules, so those two fields carry that job. Anybody who only fills a scene stays an embed.",
    TIPS.side);

  state.secondary.forEach((person, index) => {
    const card = el("div", "card");
    const head = el("div", "cardhead");
    head.append(el("h3", null, person.first_name || `Secondary character ${index + 1}`));
    const del = el("button", "mini danger", "Remove");
    del.onclick = () => { state.secondary.splice(index, 1); save(); render(); };
    head.append(del);
    card.append(head);
    for (const [id, label, help, opts = {}] of SECONDARY_FIELDS)
      card.append(fieldBox(`sec${index}.${id}`, label, swap(help, null), value(`second.${index}.${id}`),
        (v) => { person[id] = v; }, opts));
    main.append(card);
  });
  const add = el("button", "go", "Add a secondary character");
  add.onclick = () => { state.secondary.push({}); save(); render(); };
  main.append(add);

  main.append(el("hr", "enginerule"));
  sectionHeading(main, "NPC embeds",
    "One line for somebody who turns up once. Defining them stops the model inventing an inconsistent person. Never embed a character whose existence is itself a secret.",
    null);
  main.append(el("p", "note", "[Name — age:XX;gender:X;appearance:tag,tag,tag,tag,tag,tag. One or two personality sentences.]"));
  state.embeds.forEach((text, index) => {
    const box = fieldBox(`embed${index}`, `Embed ${index + 1}`,
      "Name, age, gender, appearance tags, then a sentence or two. Write it however you like — it is put into the shape above on export.",
      value(`embed.${index}`), (v) => { state.embeds[index] = v; },
      { placeholder: "Mark, 34, male, tall, grey at the temples, work boots, always early. Runs the garage on the corner and talks to everyone like they already agreed with him." });
    const del = el("button", "mini danger", "Remove");
    del.onclick = () => { state.embeds.splice(index, 1); save(); render(); };
    $(".fieldhead", box).append(del);
    main.append(box);
  });
  const addEmbed = el("button", "go", "Add an embed");
  addEmbed.onclick = () => { state.embeds.push(""); save(); render(); };
  main.append(addEmbed);
}

/* ------------------------------------------------------------- scenario */
function renderScenario() {
  const main = $("#main");
  const section = SECTIONS.find((s) => s.id === "scenario");
  sectionHeading(main, "Step 6 · The scenario", section.blurb, TIPS.scenario);

  const head = el("div", "fieldhead enginehead");
  head.append(el("h3", null, "The plot engine"));
  head.append(tip("One block, required on every card. It keeps the world moving on its own, breaks sex loops by having the character end the scene and push the story, and says how to keep making new stories once the main one is over."));
  main.append(head);
  main.append(el("p", "help", "Short answers. They are written into the block in the shape the method fixes."));

  for (const [id, label, help, opts = {}] of section.fields) {
    if (!opts.plotEngine) continue;
    main.append(fieldBox(id, swap(label.replace(/^Plot engine · /, ""), current()), swap(help, current()),
      value(`char.0.${id}`),
      (v) => { state.characters[0].values[id] = v; state.characters[0].choice[id] = "mine"; }, opts));
  }

  const preview = el("div", "card");
  const previewHead = el("div", "fieldhead");
  previewHead.append(el("h3", null, "The block as it ships"));
  previewHead.append(tip("The fixed shape with your answers in it. Only the contents change."));
  preview.append(previewHead);
  preview.append(el("pre", "output", plotEngine() || "Fill the place, who lives there, and what the character wants, and the block appears here."));
  main.append(preview);

  main.append(el("hr", "enginerule"));
  const plotsHead = el("div", "fieldhead enginehead");
  plotsHead.append(el("h3", null, "The plots"));
  plotsHead.append(tip("The story runs as numbered plots. There are no acts. Plots 1 and 2 start active, so they are the two pressures that reach {{user}} first."));
  main.append(plotsHead);

  main.append(fieldBox("plots_opening", "The opening line",
    swap(section.fields.find((f) => f[0] === "plots_opening")[2], current()),
    value("char.0.plots_opening"),
    (v) => { state.characters[0].values.plots_opening = v; state.characters[0].choice.plots_opening = "mine"; },
    { placeholder: section.fields.find((f) => f[0] === "plots_opening")[3].placeholder }));

  const fixed = el("div", "card");
  const fixedHead = el("div", "fieldhead");
  fixedHead.append(el("h3", null, "The six run rules"));
  fixedHead.append(el("span", "badge", "always included"));
  fixedHead.append(tip("Fixed text. They go into every card exactly as written, so there is nothing to decide here."));
  fixed.append(fixedHead);
  fixed.append(el("pre", "rulebox", PLOT_RUN_RULES.join("\n")));
  main.append(fixed);

  state.plots.forEach((plot, index) => {
    const card = el("div", "card");
    const cardHead = el("div", "cardhead");
    cardHead.append(el("h3", null, `Plot ${index + 1}`));
    if (index < 2) cardHead.append(el("span", "badge", "active from the start"));
    if (state.plots.length > 2) {
      const del = el("button", "mini danger", "Remove");
      del.onclick = () => { state.plots.splice(index, 1); save(); render(); };
      cardHead.append(del);
    }
    card.append(cardHead);
    const title = el("input", "acttitle");
    title.placeholder = "What this plot is called";
    title.value = plot.title || "";
    title.oninput = () => { plot.title = title.value; save(); renderRail(); };
    card.append(title);
    card.append(fieldBox(`plot${index}`, "The bullets",
      "Four to nine, one fact per line, every one a full sentence that says who does what. {{user}} is in every plot: it happens where {{user}} is, or {{user}} learns of it from the character, or {{user}} finds evidence. The last line starts \"This plot ends when\" and names an event the GameMaster can see in the scene.",
      value(`plot.${index}.bullets`), (v) => { plot.bullets = v; },
      { rows: 7, placeholder: "Dessel sends two men to the bar on collection nights.\nBelle pays them out of the till and writes it down as breakage.\nDelia has started asking why the Tuesday takings never match.\nThis plot ends when the debt is paid off, Dessel is driven off, or Dessel takes the bar." }));
    main.append(card);
  });
  const add = el("button", "go", "Add another plot");
  add.onclick = () => { state.plots.push({ title: "", bullets: "" }); save(); render(); };
  main.append(add);
}

/* -------------------------------------------------------------- secrets */
function renderSecrets() {
  const main = $("#main");
  const section = SECTIONS.find((s) => s.id === "scenario");
  sectionHeading(main, "Step 7 · The gated secrets",
    "The facts the character hides. None of them may appear in the greeting, the profile, the embeds, or anywhere in the Hard Rules the player can trigger — the foreshadowing ladder points at them with objects and slips instead.",
    TIPS.secrets);

  for (const id of ["secrets_who", "gated"]) {
    const [, label, help, opts = {}] = section.fields.find((f) => f[0] === id);
    main.append(fieldBox(id, label, swap(help, current()), value(`char.0.${id}`),
      (v) => { state.characters[0].values[id] = v; state.characters[0].choice[id] = "mine"; },
      { ...opts, rows: id === "gated" ? 6 : undefined }));
  }

  const preview = el("div", "card");
  preview.append(el("h3", null, "The block as it ships"));
  preview.append(el("pre", "output", gatedBlock() || "Nothing yet."));
  main.append(preview);
}

/* ------------------------------------------------------------- greeting */
function renderGreeting() {
  const main = $("#main");
  sectionHeading(main, "Step 8 · The greeting",
    "{{user}}'s first time meeting everybody. Introduce who is who and where they are through the narration, end on one hook that hands {{user}} a single decision, and do not pilot {{user}}. The opening has to match the Hard Rules opening line.",
    TIPS.greeting);

  const section = SECTIONS.find((s) => s.id === "scenario");
  const [, label, help, opts = {}] = section.fields.find((f) => f[0] === "greeting");
  main.append(fieldBox("greeting", label, swap(help, current()), value("char.0.greeting"),
    (v) => { state.characters[0].values.greeting = v; state.characters[0].choice.greeting = "mine"; },
    { ...opts, rows: 10 }));

  main.append(fieldBox("openingCast", "Who is in the opening scene",
    "One stat line per character in the scene, one per line. If nobody else is there, leave it empty and the line seeds as N/A.",
    value("cast.opening"), (v) => { state.openingCast = v; },
    { rows: 3, placeholder: "Belle; ♀; ⧗ 32; 📏 5'4\"; ☮ runs the bar, a stranger to {{user}}; 👚 work shirt, jeans, bar apron; ☠ behind the bar, counting the till, not looking up" }));

  const html = el("div", "card");
  html.append(toggleSwitch("tipsy.chat is using HTML for this card", !!state.tipsyHtml,
    (on) => { state.tipsyHtml = on; save(); render(); }));
  const htmlWhy = el("div", "fieldhead");
  htmlWhy.append(el("p", "help", "Off, the tipsy greeting is the same words with <p></p> between paragraphs. On, the same words go out as HTML in his layout. The json and the png always keep the plain greeting."));
  htmlWhy.append(tip("Only the markup changes. The words never do."));
  html.append(htmlWhy);
  if (state.tipsyHtml)
    html.append(el("p", "note", "The method does not say how a hidden []:# tracker goes inside the HTML, so those lines ship as they are, one per line. Nothing has been invented for them."));
  main.append(html);

  const note = el("div", "card");
  note.append(el("h3", null, "Added to the end for you"));
  note.append(el("p", "help", "The time, the stat lines, and every tracker at its start value. Fill in the real values for this first scene once you paste it."));
  note.append(el("pre", "output", trackerSeed()));
  main.append(note);

  const out = el("div", "card");
  out.append(el("h3", null, state.tipsyHtml ? "The tipsy greeting, as HTML" : "The tipsy greeting"));
  out.append(el("pre", "output", greetingTipsy() || "Nothing yet."));
  main.append(out);
}

/* ----------------------------------------------------------- rules file */
function renderRules() {
  const main = $("#main");
  sectionHeading(main, "Step 9 · The rules file",
    "The rule blocks ship as their own file beside the card. The Hard Rules never repeat them and the scenario never holds them.",
    TIPS.rules);

  const fixed = el("div", "card");
  const head = el("label", "toggle");
  const box = el("input");
  box.type = "checkbox";
  box.checked = true;
  box.disabled = true;
  head.append(box, el("span", null, "The always 21 rule"));
  head.append(el("span", "badge", "always on"));
  fixed.append(head);
  const why = el("div", "fieldhead");
  why.append(el("p", "help", "It heads the stack in every rules file, word for word."));
  why.append(tip("This block is the rule. Never paraphrase it, never write a replacement."));
  fixed.append(why);
  fixed.append(el("pre", "rulebox", ALWAYS_21));
  main.append(fixed);

  for (const rule of RULE_MENU) {
    const card = el("div", "card");
    const label = el("label", "toggle");
    const tick = el("input");
    tick.type = "checkbox";
    tick.checked = !!state.rules[rule.id];
    tick.onchange = () => { state.rules[rule.id] = tick.checked; save(); render(); };
    label.append(tick, el("span", null, rule.name));
    card.append(label);
    const reason = el("div", "fieldhead");
    reason.append(el("p", "help", rule.why));
    reason.append(tip("Ticking it adds the block below to the rules file, word for word."));
    card.append(reason);
    card.append(el("pre", "rulebox", rule.id === "texting" ? `[TEXT MESSAGE FORMAT:\n${RULE_BLOCKS.texting}]` : RULE_BLOCKS[rule.id]));
    if (rule.slots && state.rules[rule.id]) {
      card.append(el("p", "help", "This block has blanks. Anything you leave empty keeps its bracket in the file rather than being invented for you."));
      for (const [id, slotLabel, slotHelp, placeholder] of rule.slots)
        card.append(fieldBox(`narrator_${id}`, slotLabel, slotHelp, value(`narrator.${id}`),
          (v) => { state.narrator[id] = v; }, { short: true, placeholder }));
    }
    main.append(card);
  }

  const out = el("div", "card");
  const outHead = el("div", "fieldhead");
  outHead.append(el("h3", null, `${leadName()}_Rules.txt`));
  outHead.append(tip("Delivered beside the card, as its own file."));
  out.append(outHead);
  out.append(el("pre", "output", rulesFile()));
  main.append(out);
}

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

/* ------------------------------------------------------------- trackers */
function renderTrackers() {
  const main = $("#main");
  sectionHeading(main, "Step 10 · Trackers",
    "The status lines the card keeps under every reply. Keep them few: each one has to change what the GameMaster does. Every change is tied to something that happens in the scene, never to a time word.",
    TIPS.trackers);

  const fixed = el("div", "card");
  const head = el("div", "fieldhead");
  head.append(el("h3", null, "The Scene Continuity Tracker"));
  head.append(el("span", "badge", "every card"));
  head.append(tip("The time, the stat line for everybody in the scene, and the rules that keep the format intact. Fixed text."));
  fixed.append(head);
  fixed.append(el("pre", "rulebox", `${TRACKER_HEAD}\n\n${TRACKER_RULES}`));
  main.append(fixed);

  for (const tracker of TRACKER_KIT) {
    const comesWithPlots = !!tracker.withPlots;
    const live = liveTrackers().some((t) => t.id === tracker.id);
    const card = el("div", "card");
    const label = el("label", "toggle");
    const tick = el("input");
    tick.type = "checkbox";
    tick.checked = live;
    tick.disabled = comesWithPlots;
    tick.onchange = () => { state.trackers[tracker.id] = tick.checked; save(); render(); };
    label.append(tick, el("span", null, `${tracker.icon} ${tracker.name}`));
    if (comesWithPlots) label.append(el("span", "badge", "comes with the plots"));
    else if (tracker.every) label.append(el("span", "badge", "every card"));
    card.append(label);
    const why = el("div", "fieldhead");
    why.append(el("p", "help", tracker.what));
    why.append(tip(comesWithPlots ? "It is in the card as soon as the card has plots." : "Tick it only when the card has something for it to track."));
    card.append(why);
    if (live) {
      card.append(fieldBox(`start_${tracker.id}`, "Start value, as it appears in the greeting",
        "", state.trackerStart[tracker.id] ?? tracker.start ?? "",
        (v) => { state.trackerStart[tracker.id] = v; }, { short: true, placeholder: tracker.start }));
      if (tracker.rule) {
        card.append(el("p", "help", "Its update rule is fixed text:"));
        card.append(el("pre", "rulebox", tracker.rule));
      } else {
        card.append(fieldBox(`rule_${tracker.id}`, "Update rule",
          tracker.ruleHelp || "One plain paragraph. Tie every change to an event the GameMaster can see in the scene.",
          value(`trackrule.${tracker.id}`), (v) => { state.trackerRules[tracker.id] = v; }, { rows: 3 }));
      }
      card.append(el("p", "note", trackerLine(tracker)));
    }
    main.append(card);
  }

  const out = el("div", "card");
  out.append(el("h3", null, "The block as it ships"));
  out.append(el("pre", "output", trackerBlock()));
  main.append(out);
}

/* ----------------------------------------------------------------- tags */
function pickedTags() {
  const picked = Object.keys(state.tags).filter((t) => state.tags[t]);
  const extra = (state.extraTags || "").split(",").map((t) => t.trim()).filter(Boolean);
  return [...new Set([...picked, ...extra])];
}

function renderTags() {
  const main = $("#main");
  sectionHeading(main, "Step 11 · Tags", `Tick what fits. ${TAG_LIMIT} at most on a card, and the card has to earn every one.`, TIPS.tags);
  const picked = pickedTags();
  const counter = el("p", "note", `${picked.length} of ${TAG_LIMIT} picked.`);
  const clear = el("button", "mini danger", "Clear all");
  clear.onclick = () => { state.tags = {}; state.extraTags = ""; save(); render(); };
  const countRow = el("div", "row buttons");
  countRow.append(counter, clear);
  main.append(countRow);

  main.append(fieldBox("extraTags", "Your own tags",
    "Separated by commas. The sites take words that are not on the list below — nsfw and original are both tags, not switches.",
    state.extraTags || "", (v) => { state.extraTags = v; }, { short: true, placeholder: "nsfw, original, slow burn" }));

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
        if (box.checked && pickedTags().length >= TAG_LIMIT) {
          box.checked = false;
          return status(`That is the limit — a card carries ${TAG_LIMIT} tags. Untick one first.`, true);
        }
        state.tags[name] = box.checked;
        row.classList.toggle("on", box.checked);
        counter.textContent = `${pickedTags().length} of ${TAG_LIMIT} picked.`;
        save(); renderRail();
      };
      row.append(box);
      row.append(el("span", null, name));
      wrap.append(row);
    }
    main.append(wrap);
  }
}

/* -------------------------------------------------------------- ai panel */
function renderAI() {
  const main = $("#main");
  sectionHeading(main, "AI assist", null, TIPS.ai);
  const pitch = el("div", "card");
  pitch.append(el("p", "blurb",
    "Optional. Write everything in plain English, then run Enhance. The model is handed the whole build — the templates you picked, every blank in the Hard Rules, the plots, the trackers — and writes what is missing."));
  pitch.append(el("p", "warnline",
    "You do not use what the AI gives you as is. Use it as a starting point — edit, rewrite, expand. If you publish a bot written entirely by AI, people WILL notice, and they will NOT have a good time."));
  main.append(pitch);

  if (!state.ai.on) {
    const off = el("div", "card");
    off.append(el("p", null, "AI assist is off. Turn it on with the switch at the top of the page."));
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
    { tip: "This rides along with your lore and your written fields." }));

  const blanks = blanksList();
  const go = el("button", "go", "Enhance the card");
  go.onclick = () => confirmThenEnhance(go, main);
  main.append(go);
  main.append(el("p", "note",
    `${blanks.length} blank${blanks.length === 1 ? "" : "s"} to write, and ${registry().filter((e) => e.get().trim()).length} field${registry().filter((e) => e.get().trim()).length === 1 ? "" : "s"} already written. Nothing you typed is overwritten: where you wrote something, the AI version lands beside yours in Review and you pick which one exports. Run it again later and anything the AI has already written is left alone.`));
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

  const style = allLintHits(STYLE_LINTS);
  if (style.length) {
    const card = el("div", "card");
    const styleHead = el("div", "fieldhead");
    styleHead.append(el("h3", null, `${style.length} house-style note${style.length > 1 ? "s" : ""}`));
    styleHead.append(tip("The sweep the method runs before a card is delivered. None of it blocks an export — they are the lines worth another look."));
    card.append(styleHead);
    for (const hit of style.slice(0, 40)) {
      const line = el("p", "help");
      line.append(el("strong", null, `${hit.where}: `));
      line.append(document.createTextNode(`“${hit.found.join("”, “")}” — ${hit.why}`));
      card.append(line);
    }
    if (style.length > 40) card.append(el("p", "note", `${style.length - 40} more.`));
    main.append(card);
  }

  const pairs = registry()
    .map((entry) => ({ entry, mine: entry.get(), ai: aiOut(entry.key) }))
    .filter((pair) => pair.mine || pair.ai);

  if (!pairs.some((p) => p.ai)) {
    const none = el("div", "card");
    none.append(el("p", "help", "No AI versions to compare — this is the card as you have written it."));
    main.append(none);
    filePreview(main);
    return;
  }

  const bar = el("div", "row buttons");
  const takeAll = el("button", "go", "Use every AI version");
  takeAll.onclick = () => { pairs.forEach((p) => p.ai && pickAi(p.entry.key, true)); save(); render(); };
  const keepAll = el("button", "ghost", "Keep all of mine");
  keepAll.onclick = () => { pairs.forEach((p) => pickAi(p.entry.key, false)); save(); render(); };
  const only = el("label", "toggle small");
  const onlyBox = el("input");
  onlyBox.type = "checkbox";
  onlyBox.checked = reviewChangedOnly;
  onlyBox.onchange = () => { reviewChangedOnly = onlyBox.checked; render(); };
  only.append(onlyBox, el("span", null, "Only show fields the AI changed"));
  bar.append(takeAll, keepAll, only);
  main.append(bar);

  let lastSection = null;
  for (const pair of pairs) {
    const changed = pair.ai && pair.ai.trim() !== pair.mine.trim();
    if (reviewChangedOnly && !changed) continue;
    if (pair.entry.section !== lastSection) {
      lastSection = pair.entry.section;
      main.append(el("h3", "castheading", lastSection));
    }
    const card = el("div", "card compare");
    const head = el("div", "fieldhead");
    head.append(el("h3", null, pair.entry.label));
    head.append(tip(`From ${pair.entry.section}. The version you pick here is the one that goes into the card.`));
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

function filePreview(main) {
  const card = el("div", "card");
  const head = el("div", "fieldhead");
  head.append(el("h3", null, `${leadName()}_tipsy.txt`));
  head.append(tip("The card as it goes to tipsy.chat, and the same text the json and the png are built from."));
  card.append(head);
  card.append(el("pre", "output", buildTipsyTxt()));
  const copy = el("button", "ghost", "Copy it");
  copy.onclick = async () => {
    await navigator.clipboard.writeText(buildTipsyTxt());
    copy.textContent = "Copied";
    setTimeout(() => (copy.textContent = "Copy it"), 1500);
  };
  card.append(copy);
  main.append(card);
}

function versionCol(pair, which, title, text) {
  const using = usingAi(pair.entry.key) ? "ai" : "mine";
  const chosenNow = using === which;
  const col = el("div", "col" + (chosenNow ? " picked" : ""));
  const head = el("div", "colhead");
  head.append(el("strong", null, title));
  if (text) {
    const pick = el("button", "mini" + (chosenNow ? " on" : ""), chosenNow ? "In use" : "Use this");
    pick.onclick = () => { pickAi(pair.entry.key, which === "ai"); save(); render(); };
    head.append(pick);
  }
  col.append(head);
  col.append(el("p", "coltext", text || "—"));
  for (const hit of lintText(text)) {
    const warn = el("p", "lint");
    warn.append(el("strong", null, `Step 0 — ${hit.label}: `));
    warn.append(document.createTextNode(`“${hit.found.join("”, “")}”`));
    col.append(warn);
  }
  return col;
}

/* --------------------------------------------------------------- export */
function buildTipsyTxt() {
  return [
    "== HARD RULES ==",
    "",
    hardText() || "[nothing yet]",
    "",
    "== BACKGROUND ==",
    "",
    [buildDescriptionWithoutHardRules(), buildScenario()].filter(Boolean).join("\n\n"),
    "",
    "== GREETING ==",
    "",
    greetingTipsy() || "[nothing yet]",
  ].join("\n");
}

// The tipsy file keeps the Hard Rules in their own section, so the background
// holds the profiles and the scenario only.
function buildDescriptionWithoutHardRules() {
  const whole = buildDescription();
  const rules = hardText();
  return rules && whole.startsWith(rules) ? whole.slice(rules.length).trim() : whole;
}

function buildCardJson() {
  const name = leadName();
  return {
    spec: "",
    spec_version: "",
    avatar: "",
    tags: pickedTags(),
    state: 5,
    style: 1,
    nsfw: pickedTags().some((t) => /^nsfw$/i.test(t)),
    gender: ((state.characters[0].values.gender || "").toLowerCase() === "male") ? 1 : 2,
    tg_bot_token: "",
    tg_bot_username: "",
    discord_bot_token: "",
    discord_bot_client_id: "",

    char_name: "",
    char_persona: "",
    world_scenario: "",
    char_greeting: "",
    example_dialogue: "",

    name,
    description: buildDescription(),
    personality: "",
    char_intro: value("char.0.char_intro") || "",
    creator_notes: "",
    scenario: buildScenario(),
    first_mes: greetingPlain(),
    mes_example: "",
    opening_scene: "",
  };
}

// The png carries one flat card, the way the importers read it.
function buildFlatCard() {
  return {
    name: leadName(),
    description: buildDescription(),
    personality: "",
    scenario: buildScenario(),
    first_mes: greetingPlain(),
    mes_example: "",
    creator_notes: "",
    system_prompt: "",
    post_history_instructions: "",
    alternate_greetings: [],
    tags: pickedTags(),
    creator: state.meta.creator || "",
    character_version: state.meta.version || "",
  };
}


function renderExport() {
  const main = $("#main");
  sectionHeading(main, "Export the card", null, TIPS.export);
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

  const left = hardBlanks();
  if (left) {
    const warn = el("div", "card warn");
    warn.append(el("h3", null, `${left} blank${left === 1 ? "" : "s"} still open in the Hard Rules`));
    warn.append(el("p", "help", "Every one of them takes its line out of the file. That is allowed, so this is a heads-up, not a stop."));
    const jump = el("button", "ghost", "Back to the Hard Rules");
    jump.onclick = () => { activeSection = "hard"; render(); };
    warn.append(jump);
    main.append(warn);
  }

  const name = leadName();
  const lead = state.characters[0];

  const meta = el("div", "card");
  const metaHead = el("div", "fieldhead");
  metaHead.append(el("h3", null, "Who made it"));
  metaHead.append(tip("Written into the png, where importers show it. Both are optional."));
  meta.append(metaHead);
  meta.append(fieldBox("creator", "Creator", "Your name or handle, as you want it on the card.",
    state.meta.creator || "", (v) => { state.meta.creator = v; }, { short: true }));
  meta.append(fieldBox("version", "Card version", "For example 1.0. Bump it when you re-upload a card you have changed.",
    state.meta.version || "", (v) => { state.meta.version = v; }, { short: true, placeholder: "1.0" }));
  meta.append(fieldBox("char_intro", "Card intro", "The short blurb the sites show under the card. It never spoils anything.",
    value("char.0.char_intro"), (v) => { lead.values.char_intro = v; lead.choice.char_intro = "mine"; },
    { rows: 3, placeholder: "In this experience, you wait in line at a beach snack cart while a tourist yells at the shy woman running it." }));
  main.append(meta);

  const box = el("div", "card");
  const boxHead = el("div", "fieldhead");
  boxHead.append(el("h3", null, "Download"));
  boxHead.append(tip("The txt is the paste-from file, split into the three sections tipsy.chat asks for. The json is for linkin.love and CraveU. The rules file ships beside the card. Add a picture on step 1 and you get the png as well."));
  box.append(boxHead);

  const files = [`${name}_tipsy.txt`, `${name}.json`, `${name}_Rules.txt`];
  if (lead.image) files.push(`${name}.png`);
  box.append(el("p", "help", `One zip holding ${files.join(", ")}.`));
  if (!lead.image) box.append(el("p", "note", "Add a picture on step 1 and the card comes as a .png too, with the character written inside the file."));

  const grab = el("button", "go", "Download the card (.zip)");
  grab.onclick = async () => {
    grab.disabled = true;
    try {
      const out = [
        { name: `${name}_tipsy.txt`, bytes: textBytes(buildTipsyTxt()) },
        { name: `${name}.json`, bytes: textBytes(JSON.stringify(buildCardJson(), null, 2)) },
        { name: `${name}_Rules.txt`, bytes: textBytes(rulesFile()) },
      ];
      if (lead.image) {
        const png = await toPngBytes(lead.image);
        out.push({ name: `${name}.png`, bytes: embedCard(png, buildFlatCard()) });
      }
      downloadBlob(`${name}.zip`, makeZip(out));
      status(`Saved ${name}.zip — ${out.map((f) => f.name).join(", ")} inside.`);
    } catch (err) { status(err.message, true); }
    finally { grab.disabled = false; }
  };
  box.append(grab);
  main.append(box);

  const show = (title, text, tipText) => {
    const card = el("div", "card");
    const head = el("div", "fieldhead");
    head.append(el("h3", null, title));
    if (tipText) head.append(tip(tipText));
    card.append(head);
    card.append(el("pre", "output", text || "Nothing written yet."));
    const copy = el("button", "ghost", "Copy it");
    copy.onclick = async () => {
      await navigator.clipboard.writeText(text);
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy it"), 1500);
    };
    card.append(copy);
    main.append(card);
  };

  show(`${name}_tipsy.txt`, buildTipsyTxt(), "Paste the three sections into tipsy.chat's Hard Rules, Background and Greeting boxes.");
  show("Description", buildDescription(), "The Hard Rules once at the top, then the profiles, then the embeds. This is the Description field on linkin.love and CraveU.");
  show("Scenario", buildScenario(), "The plot engine, the numbered plots, the gated secrets, then the tracker. No rule blocks in here.");
  show("Greeting", greetingPlain(), "The plain greeting, as the json and the png carry it.");
  show(`${name}_Rules.txt`, rulesFile(), "Delivered beside the card as its own file.");

  const buttons = el("div", "row buttons");
  const saveWork = el("button", "ghost", "Save your work (.json)");
  saveWork.onclick = () => download(`${name}-builder-save.json`, JSON.stringify(state, null, 2));
  const loadWork = el("button", "ghost", "Open a saved build");
  const picker = el("input");
  picker.type = "file";
  picker.accept = ".json,application/json";
  picker.hidden = true;
  picker.onchange = async () => {
    const file = picker.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !parsed.characters) throw new Error("That file is not a builder save.");
      if (!confirm("Replace everything in the builder with that saved build?")) return;
      localStorage.setItem(STORE, JSON.stringify(parsed));
      location.reload();
    } catch (err) { status(err.message, true); }
  };
  loadWork.onclick = () => picker.click();
  const wipe = el("button", "ghost danger", "Start over");
  wipe.onclick = () => {
    if (!confirm("Erase everything in this builder and start a new character?")) return;
    localStorage.removeItem(STORE);
    location.reload();
  };
  buttons.append(saveWork, loadWork, picker, wipe);
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
  const sameStep = lastRendered === activeSection;
  const scrollWas = window.scrollY;
  lastRendered = activeSection;
  main.innerHTML = "";
  renderRail();
  if (activeSection === "bible" || activeSection === "profile" || activeSection === "psych")
    renderSection(SECTIONS.find((s) => s.id === activeSection));
  else if (activeSection === "hard") renderHard();
  else if (activeSection === "side") renderSideCast();
  else if (activeSection === "scenario") renderScenario();
  else if (activeSection === "secrets") renderSecrets();
  else if (activeSection === "greeting") renderGreeting();
  else if (activeSection === "rules") renderRules();
  else if (activeSection === "trackers") renderTrackers();
  else if (activeSection === "tags") renderTags();
  else if (activeSection === "ai") renderAI();
  else if (activeSection === "review") renderReview();
  else renderExport();
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

// Every blank in the build, by key. This is what the model is asked to fill,
// and the keys come back in its reply so each answer lands in its own field.
function blanksList() {
  return registry().filter((entry) => !entry.get().trim() && !aiOut(entry.key).trim());
}

function blanksSheet() {
  const lines = blanksList().map((entry) => {
    const hint = entry.hint || (entry.help && !entry.label.includes(entry.help.slice(0, 20))
      ? `${entry.label} — ${entry.help}` : entry.label);
    return `${entry.key}: [FILL: ${hint}]`;
  });
  if (!lines.length) return "";
  return [
    "BLANKS — every line below is empty in the build. Fill each one: keep the key and the colon, replace the whole [FILL: ...] bracket with your writing. One answer per line unless the label asks for several lines, and then keep every line under that same key.",
    ...lines,
  ].join("\n");
}

// Everything the model needs that is not in the card text itself.
function buildContext() {
  const out = [];
  const lead = state.characters[0];
  const types = [...state.hard.types, ...state.hard.scenes]
    .map((id) => [...PERSONALITY_TYPES, ...SCENE_TYPES].find((t) => t.id === id))
    .filter(Boolean);
  if (types.length)
    out.push(`HARD RULES TEMPLATES in this card: ${types.map((t) => `${t.label} (${t.cue})`).join("; ")}. The fixed lines of those templates are already in the file. You are filling their blanks and nothing else — never rewrite a fixed line, never add a rule.`);
  if (state.hard.ageGap)
    out.push("AGE GAP: this world treats an age gap as taboo, and the four age-gap lines are already in the file.");
  if (state.hard.edited != null)
    out.push("The author has edited the Hard Rules file by hand. Leave it alone.");
  if (state.characters.length > 1)
    out.push(`THE CAST with a full build: ${state.characters.map((c, i) => charName(i)).join(", ")}.`);
  const secondary = state.secondary.map((p) => p.first_name).filter(Boolean);
  if (secondary.length) out.push(`SECONDARY CHARACTERS: ${secondary.join(", ")}. They have no Hard Rules, so their Behavior during sex and Kinks fields carry that job.`);
  const trackers = liveTrackers().map((t) => t.name);
  if (trackers.length) out.push(`TRACKERS this card runs: ${trackers.join(", ")}.`);
  const rules = RULE_MENU.filter((r) => state.rules[r.id]).map((r) => r.name);
  out.push(`RULES FILE: the always 21 rule${rules.length ? `, ${rules.join(", ")}` : ""}. Write nothing that fights them.`);
  const tags = pickedTags();
  if (tags.length) out.push(`TAGS the author picked — the card has to earn every one: ${tags.join(", ")}.`);
  out.push("FIXED BLOCKS the tool assembles after you: the Hard Rules header, the six plot run rules, the gated secrets wrapper, the Scene Continuity Tracker, and the rules file. Do not write them and do not repeat them.");
  return out;
}

// The lore is the only thing not already in the card, so it rides along.
function loreNotes() {
  const bible = SECTIONS.find((s) => s.id === "bible");
  return state.characters.map((character, index) => {
    const lines = bible.fields
      .filter(([id]) => (character.values[id] || "").trim())
      .map(([id, label]) => `  ${swap(label, character)}: ${character.values[id].trim()}`);
    return lines.length ? `${charName(index)}:\n${lines.join("\n")}` : "";
  }).filter(Boolean).join("\n\n");
}

function unfinishedSteps() {
  return activeSteps()
    .filter((step) => !["ai", "review", "export"].includes(step.id))
    .map((step) => ({ step, status: stepState(step.id) }))
    .filter(({ status }) => status.state !== "done");
}

function confirmThenEnhance(button, main) {
  main.querySelectorAll(".precheck").forEach((n) => n.remove());
  if (!state.hard.types.length && !state.hard.scenes.length) {
    const card = el("div", "card precheck warn");
    card.append(el("h3", null, "No Hard Rules template picked yet"));
    card.append(el("p", "help", "The Hard Rules file is the method. Picking the templates is a real decision, and it is not the AI's to make — pick them on step 2 first."));
    const jump = el("button", "go", "Go to the Hard Rules");
    jump.onclick = () => { activeSection = "hard"; render(); };
    card.append(jump);
    main.append(card);
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  const loose = unfinishedSteps();
  if (!loose.length) return enhanceAll(button);

  const card = el("div", "card precheck warn");
  const problems = loose.filter((l) => l.status.state === "problem");
  card.append(el("h3", null, problems.length
    ? "Some steps have a problem, and some are unfinished"
    : "Some steps are not finished"));
  card.append(el("p", "help", "The AI works from what is there. Anything still empty is the AI's to invent, which is rarely what you want. Worth a look before you spend a request:"));
  const list = el("ul", "ridelist");
  for (const { step, status: how } of loose) {
    const what = how.state === "problem" ? "has a problem"
      : how.state === "empty" ? "nothing written"
      : `part written${how.count ? ` — ${how.count}` : ""}`;
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
  const anything = registry().some((entry) => entry.get().trim());
  if (!anything) return status("Write something first — the model works from what you put in.", true);

  button.disabled = true;
  const label = button.textContent;
  button.textContent = "Writing…";

  try {
    status(`Sending the whole build to ${vendor.label} (${model})…`);
    const { system, user } = buildFileRequest({
      file: buildTipsyTxt(),
      lore: loreNotes(),
      context: buildContext(),
      blanks: blanksSheet(),
      instruction: state.ai.instruction,
    });
    const image = state.characters.find((c) => c.image);
    const reply = await vendor.complete(apiKey, model, system, user,
      { baseUrl: state.ai.baseUrl, image: image ? image.image : null });

    const { written, kept } = readReply(reply);
    if (!written && !kept) throw new Error("The model sent back something this builder could not read. Try again, or try a stronger model.");
    save();
    activeSection = "review";
    render();
    status(written
      ? `${written} field${written === 1 ? "" : "s"} came back${kept ? `, and ${kept} the AI had already written were left alone` : ""}. Yours are untouched — compare them and pick.`
      : `Nothing new to write — the ${kept} field${kept === 1 ? "" : "s"} the AI had already written were left alone.`);
  } catch (err) {
    status(err.message, true);
    save();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

// Read the reply. Every answer arrives as "key: value", and a value may run
// over several lines until the next key, so both the one-line fields and the
// list fields come home intact.
function readReply(reply) {
  const text = String(reply || "").replace(/```[a-z]*\n?/gi, "");
  const known = byKey();
  const isKey = (line) => {
    const match = line.match(/^\s*([a-z]+(?:\.[A-Za-z0-9_-]+)+)\s*:\s*(.*)$/);
    return match && known[match[1]] ? match : null;
  };

  const answers = {};
  let key = null, buffer = [];
  const flush = () => {
    if (key) {
      const value = buffer.join("\n").trim();
      if (value) answers[key] = value;
    }
    key = null; buffer = [];
  };
  for (const raw of text.split("\n")) {
    const match = isKey(raw);
    if (match) {
      flush();
      key = match[1];
      buffer = match[2] ? [match[2]] : [];
      continue;
    }
    if (key) buffer.push(raw.replace(/\r$/, ""));
  }
  flush();

  let written = 0, kept = 0;
  for (const [id, value] of Object.entries(answers)) {
    const clean = value.replace(/^\[FILL:[\s\S]*?\]$/i, "").trim();
    if (!clean || /^\[FILL:/i.test(clean)) continue;
    if (aiOut(id).trim()) { kept++; continue; }        // a second run fills the gaps only
    const own = known[id].get().trim();
    if (clean === own) continue;
    setAi(id, clean);
    if (!own) pickAi(id, true);                        // nothing to compare against
    written++;
  }
  return { written, kept };
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
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

// A build from the old method is still in this browser. It cannot be folded
// into this one — the fields are different — so it is left untouched and the
// author is told where it is.
if (hasOldSave() && !localStorage.getItem(STORE)) {
  setTimeout(() => status("A build from the old method is still saved in this browser. The method changed, so it is not loaded here — the old builder's save is untouched.", true), 400);
}

render();
