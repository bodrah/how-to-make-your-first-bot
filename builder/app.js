import { SECTIONS, WPP_FIELDS, WPP_CLOSER, RULES, LINTS } from "./fields.js";
import { VENDORS, parseReply, buildRequest } from "./ai.js";

const STORE = "skeletor-bot-builder-v1";
const KEYSTORE = "skeletor-bot-builder-key";

const state = load() || {
  values: {},
  sideChars: [],
  embeds: [],
  rules: { rule21: true, perspective: false, isolation: false, texting: false },
  ai: { on: false, vendor: "anthropic", model: "", remember: false, instruction: "", baseUrl: "http://localhost:11434/v1" },
};
let activeSection = "bible";
let apiKey = sessionStorage.getItem(KEYSTORE) || localStorage.getItem(KEYSTORE) || "";

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

/* --------------------------------------------------------------- storage */
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {}
}
function load() {
  try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; }
}

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
  for (const section of SECTIONS)
    for (const [id, label] of section.fields) scan(label, state.values[id]);
  state.sideChars.forEach((c, i) =>
    Object.entries(c).forEach(([k, v]) => scan(`Side character ${i + 1} · ${k}`, v)));
  state.embeds.forEach((e, i) => scan(`Embed ${i + 1}`, e));
  return out;
}

/* ----------------------------------------------------------------- export */
function fieldLine(spec, value) {
  const [, , , opts = {}] = spec;
  if (!value || !value.trim()) return null;
  if (opts.perLine) {
    return value.split("\n").filter((l) => l.trim())
      .map((l) => (l.includes(":") ? `${opts.perLine}${l.trim()}` : `${opts.perLine}${l.trim()}`)).join("\n");
  }
  if (opts.block) return `${opts.line}:\n${value.trim()}`;
  return `${opts.line}: ${value.trim()}`;
}

function buildExport() {
  const name = state.values.first_name || "Name";
  const blocks = [];

  for (const section of SECTIONS) {
    if (!section.exported) continue;
    const lines = section.fields.map((f) => fieldLine(f, state.values[f[0]])).filter(Boolean);
    if (!lines.length) continue;
    const [open, close] = section.wrap(name);
    blocks.push([open, ...lines, close].join("\n"));
  }

  for (const character of state.sideChars) {
    const written = WPP_FIELDS.filter(([key]) => (character[key] || "").trim());
    if (!written.length) continue;
    const who = character.Name || "Name";
    const sheet = [
      `[SystemNote: Below is ${who}'s character sheet. You will portray ${who} according to the information provided and interact with {{user}}. You will roleplay as ${who} and any other non-{{user}} characters. You will never assume, portray, or take over as {{user}}'s character. Only {{user}} will roleplay as {{user}}.]`,
      "",
      `[character("${who}")`,
      ...written.map(([key]) => `${key}("${character[key].trim().replace(/"/g, "'")}"),`),
      character.closer ? character.closer.trim() + "]" : "]",
    ];
    blocks.push(sheet.join("\n"));
  }

  const embeds = state.embeds.filter((e) => e && e.trim());
  if (embeds.length) blocks.push(embeds.map((e) => e.trim()).join("\n"));

  const rules = RULES.filter((r) => state.rules[r.id]).map((r) => r.text);
  if (rules.length) blocks.push(rules.join("\n\n"));

  return blocks.join("\n\n");
}

/* ------------------------------------------------------------------ views */
function renderNav() {
  const nav = $("#nav");
  nav.innerHTML = "";
  const groups = [
    ["The character", SECTIONS.map((s) => [s.id, `${s.step} · ${s.title}`, countFilled(s)])],
    ["Cast", [["side", "Side characters (W++)", state.sideChars.length || 0],
              ["embeds", "Character Embeds", state.embeds.filter(Boolean).length || 0]]],
    ["Options", [["rules", "Rules", Object.values(state.rules).filter(Boolean).length],
                 ["ai", "AI assist", state.ai.on ? "on" : ""]]],
    ["Finish", [["export", "Export card", ""]]],
  ];
  for (const [heading, items] of groups) {
    nav.append(el("p", "navhead", heading));
    for (const [id, label, badge] of items) {
      const link = el("button", "navitem" + (activeSection === id ? " on" : ""));
      link.append(el("span", null, label));
      if (badge !== "" && badge != null) link.append(el("span", "badge", String(badge)));
      link.onclick = () => { activeSection = id; render(); };
      nav.append(link);
    }
  }
  const hits = allLintHits();
  const flag = $("#lintflag");
  flag.className = hits.length ? "lintflag bad" : "lintflag ok";
  flag.textContent = hits.length
    ? `Step 0: ${hits.length} thing${hits.length > 1 ? "s" : ""} to fix`
    : "Step 0: clean";
  flag.onclick = () => { activeSection = "export"; render(); };
}

function countFilled(section) {
  return section.fields.filter((f) => (state.values[f[0]] || "").trim()).length + "/" + section.fields.length;
}

function fieldBox(id, label, help, value, onInput, opts = {}) {
  const wrap = el("div", "field");
  const head = el("div", "fieldhead");
  head.append(el("label", null, label));
  if (opts.enhance) {
    const btn = el("button", "mini", "Enhance");
    btn.onclick = () => enhance([id], btn);
    head.append(btn);
  }
  wrap.append(head);
  wrap.append(el("p", "help", help));
  const input = el("textarea");
  if (opts.short) input.rows = 1;
  input.value = value || "";
  input.oninput = (e) => {
    onInput(e.target.value);
    save();
    showLint(wrap, e.target.value);
    renderNav();
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

function renderSection(section) {
  const main = $("#main");
  main.append(el("h2", null, `${section.step} · ${section.title}`));
  main.append(el("p", "blurb", section.blurb));
  if (!section.exported) main.append(el("p", "note", "Not exported. This is yours to think in."));
  for (const [id, label, help, opts = {}] of section.fields) {
    main.append(fieldBox(id, label, help, state.values[id],
      (v) => { state.values[id] = v; }, { ...opts, enhance: true }));
  }
  if (section.id !== "bible") {
    const btn = el("button", "go", `Write this whole section with AI`);
    btn.onclick = () => enhance(section.fields.map((f) => f[0]), btn);
    main.append(btn);
  }
}

function renderSideChars() {
  const main = $("#main");
  main.append(el("h2", null, "Side characters (W++)"));
  main.append(el("p", "blurb", "So this is what I do when a character needs some depth but it doesn't need to hold steady for a long period of time. A side character. Big enough to need some depth, small enough to not be a main character."));

  state.sideChars.forEach((character, index) => {
    const card = el("div", "card");
    const head = el("div", "cardhead");
    head.append(el("h3", null, character.Name ? character.Name : `Side character ${index + 1}`));
    const del = el("button", "mini danger", "Remove");
    del.onclick = () => { state.sideChars.splice(index, 1); save(); render(); };
    head.append(del);
    card.append(head);
    for (const [key, help] of WPP_FIELDS) {
      card.append(fieldBox(`sc${index}.${key}`, key, help, character[key],
        (v) => { character[key] = v; }, { short: key.length < 12 }));
    }
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
  main.append(el("h2", null, "Character Embeds"));
  main.append(el("p", "blurb", "Okay but what if this is a throw away character, I want it to appear maybe once so it really doesn't need very much attention at all? Simply fill this out to define your very minor npc."));
  main.append(el("p", "note", "[Name — age:XX;gender:X;appearance:tag,tag,tag,tag,tag,tag. One or two personality sentences.]"));
  state.embeds.forEach((value, index) => {
    const box = fieldBox(`embed${index}`, `Embed ${index + 1}`, "One line. Name, age, gender, appearance tags, then a sentence or two.",
      value, (v) => { state.embeds[index] = v; });
    const del = el("button", "mini danger", "Remove");
    del.onclick = () => { state.embeds.splice(index, 1); save(); render(); };
    $(".fieldhead", box).append(del);
    $("#main").append(box);
  });
  const add = el("button", "go", "Add an embed");
  add.onclick = () => { state.embeds.push(""); save(); render(); };
  main.append(add);
}

function renderRules() {
  const main = $("#main");
  main.append(el("h2", null, "Rules"));
  main.append(el("p", "blurb", "These are optional rules I use on an as needed basis."));
  for (const rule of RULES) {
    const card = el("div", "card");
    const head = el("label", "toggle");
    const box = el("input");
    box.type = "checkbox";
    box.checked = !!state.rules[rule.id];
    box.onchange = () => { state.rules[rule.id] = box.checked; save(); renderNav(); };
    head.append(box, el("span", null, rule.name));
    card.append(head);
    card.append(el("p", "help", rule.why));
    card.append(el("pre", null, rule.text));
    main.append(card);
  }
}

function renderAI() {
  const main = $("#main");
  main.append(el("h2", null, "AI assist"));
  main.append(el("p", "blurb", "Optional. Type what you want in plain English, and the model writes the fields in the house style from the guide — the rules in Step 0 included. You bring your own key; it goes straight from your browser to the vendor, and never to this site."));

  const onoff = el("label", "toggle");
  const box = el("input");
  box.type = "checkbox";
  box.checked = state.ai.on;
  box.onchange = () => { state.ai.on = box.checked; save(); render(); };
  onoff.append(box, el("span", null, "Turn on AI assist"));
  main.append(onoff);

  if (!state.ai.on) return;

  const card = el("div", "card");
  const vendorRow = el("div", "row");
  vendorRow.append(el("label", null, "Vendor"));
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
    const urlRow = el("div", "row");
    urlRow.append(el("label", null, "Server address"));
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

  const keyRow = el("div", "row");
  keyRow.append(el("label", null, vendor.keyOptional ? "API key (if your server wants one)" : "API key"));
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
  remember.append(rbox, el("span", null, "Remember the key on this device (otherwise it is forgotten when you close the tab)"));
  card.append(remember);
  if (vendor.keyUrl) {
    const link = el("p", "help");
    link.append(document.createTextNode("Get a key: "));
    const a = el("a", null, vendor.keyUrl);
    a.href = vendor.keyUrl; a.target = "_blank"; a.rel = "noreferrer";
    link.append(a);
    card.append(link);
  }

  const modelRow = el("div", "row");
  modelRow.append(el("label", null, "Model"));
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
      picker.onchange = () => { state.ai.model = picker.value; model.value = picker.value; save(); };
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

  main.append(fieldBox("ai_instruction", "What do you want?",
    "Plain English. \"A bartender who used to be a medic, warm to strangers, cold to anyone who knew her before.\" The model reads this plus your notes.",
    state.ai.instruction, (v) => { state.ai.instruction = v; }));

  const go = el("button", "go");
  go.textContent = "Draft the whole card";
  go.onclick = () => {
    const ids = SECTIONS.filter((s) => s.exported).flatMap((s) => s.fields.map((f) => f[0]));
    enhance(ids, go);
  };
  main.append(go);
  main.append(el("p", "note", "Anything already written is kept and improved rather than replaced. You see every change before it is applied."));
}

function renderExport() {
  const main = $("#main");
  main.append(el("h2", null, "Export card"));
  const hits = allLintHits();
  if (hits.length) {
    const warn = el("div", "card warn");
    warn.append(el("h3", null, `Step 0 — ${hits.length} thing${hits.length > 1 ? "s" : ""} to fix first`));
    for (const hit of hits) {
      const line = el("p", "help");
      line.append(el("strong", null, `${hit.where}: `));
      line.append(document.createTextNode(`“${hit.found.join("”, “")}” — ${hit.why}`));
      warn.append(line);
    }
    main.append(warn);
  } else {
    main.append(el("p", "note ok", "Step 0 checks pass: no child ages, no pre-adult words, nothing minor-coded."));
  }

  const text = buildExport();
  const out = el("pre", "output", text || "Nothing written yet.");
  main.append(out);

  const row = el("div", "row buttons");
  const copy = el("button", "go", "Copy");
  copy.onclick = async () => {
    await navigator.clipboard.writeText(text);
    copy.textContent = "Copied";
    setTimeout(() => (copy.textContent = "Copy"), 1500);
  };
  const txt = el("button", "ghost", "Download .txt");
  txt.onclick = () => download(`${state.values.first_name || "character"}.txt`, text);
  const json = el("button", "ghost", "Download .json");
  json.onclick = () => download(`${state.values.first_name || "character"}.json`, JSON.stringify(state, null, 2));
  const wipe = el("button", "ghost danger", "Start over");
  wipe.onclick = () => {
    if (!confirm("Erase everything in this builder and start a new character?")) return;
    localStorage.removeItem(STORE);
    location.reload();
  };
  row.append(copy, txt, json, wipe);
  main.append(row);
}

function render() {
  const main = $("#main");
  main.innerHTML = "";
  renderNav();
  const section = SECTIONS.find((s) => s.id === activeSection);
  if (section) renderSection(section);
  else if (activeSection === "side") renderSideChars();
  else if (activeSection === "embeds") renderEmbeds();
  else if (activeSection === "rules") renderRules();
  else if (activeSection === "ai") renderAI();
  else renderExport();
  main.scrollTop = 0;
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

async function enhance(fieldIds, button) {
  if (!state.ai.on) { activeSection = "ai"; render(); return status("Turn on AI assist first.", true); }
  if (!apiKey && !VENDORS[state.ai.vendor].keyOptional) { activeSection = "ai"; render(); return status("Add your API key first.", true); }
  const vendor = VENDORS[state.ai.vendor];
  const model = state.ai.model || vendor.fallbackModels[0];
  if (!model) { activeSection = "ai"; render(); return status("Pick a model first.", true); }

  const specs = SECTIONS.flatMap((s) => s.fields.map(([id, label, help]) => ({ id, label, help })));
  const bible = {};
  for (const [id, label] of SECTIONS[0].fields) if (state.values[id]) bible[label] = state.values[id];
  const current = {};
  for (const section of SECTIONS) {
    if (!section.exported) continue;
    for (const [id] of section.fields) if (state.values[id]) current[id] = state.values[id];
  }

  const { system, user } = buildRequest({
    askedFor: fieldIds, fieldSpecs: specs, bible, current, instruction: state.ai.instruction,
  });

  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Writing…";
  status(`Asking ${vendor.label} (${model})…`);
  try {
    const reply = await vendor.complete(apiKey, model, system, user, { baseUrl: state.ai.baseUrl });
    const { fields, note } = parseReply(reply);
    const changes = Object.entries(fields).filter(([id]) => fieldIds.includes(id));
    if (!changes.length) throw new Error("The model returned nothing for those fields.");
    if (reviewChanges(changes, note)) {
      for (const [id, value] of changes) state.values[id] = value;
      save();
      render();
      status(`Applied ${changes.length} field${changes.length > 1 ? "s" : ""}.`);
    }
  } catch (err) {
    status(err.message, true);
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

function reviewChanges(changes, note) {
  const preview = changes.map(([id, value]) => {
    const spec = SECTIONS.flatMap((s) => s.fields).find((f) => f[0] === id);
    return `${spec ? spec[1] : id}:\n${value}`;
  }).join("\n\n");
  return confirm(`${note ? note + "\n\n" : ""}Apply these ${changes.length} field(s)?\n\n${preview.slice(0, 2400)}`);
}

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = el("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

render();
