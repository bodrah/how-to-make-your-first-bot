// The Hard Rules file. It is never written from a blank page: the builder
// takes a template word for word, stacks a scene type onto it when one is
// picked, fills the <slots>, and deletes what the method says to delete.
//
// Nothing here invents rule wording. Every fixed line in the output arrived
// from templates.js exactly as it is.

import { TEMPLATES } from "./templates.js?v=f76ff3c9";

const BANNER = "=".repeat(80);

/* ------------------------------------------------------------------ parse */

// A template splits into the header, the numbered sections, and the closer.
export function parse(text) {
  const lines = String(text).replace(/\r/g, "").split("\n");
  const first = lines.findIndex((l) => /^0\.\s+[A-Z]/.test(l));
  const last = lines.findIndex((l) => /^END HARD RULES/.test(l));
  const head = lines.slice(0, first);
  const body = lines.slice(first, last === -1 ? lines.length : last);

  const sections = [];
  for (const line of body) {
    const heading = line.match(/^(\d+)\.\s+([A-Z].*)$/);
    if (heading) {
      sections.push({ num: Number(heading[1]), heading: heading[2], body: [] });
      continue;
    }
    if (sections.length) sections[sections.length - 1].body.push(line);
  }
  // blank lines at the end of a section are the gap before the next heading
  for (const section of sections) {
    while (section.body.length && !section.body[section.body.length - 1].trim()) section.body.pop();
  }
  return { head: cleanHead(head), sections };
}

// The method deletes three things from the header before the file ships: the
// Template line, the Stack line, and the whole BUILD NOTES block.
function cleanHead(lines) {
  const out = [];
  let skipping = false;
  for (const line of lines) {
    if (/^BUILD NOTES/.test(line)) { skipping = true; continue; }
    if (skipping) { if (/^=+$/.test(line)) skipping = false; continue; }
    if (/^Template:/.test(line) || /^Stack:/.test(line)) continue;
    if (/^=+$/.test(line) && /^=+$/.test(out[out.length - 1] || "")) continue;
    out.push(line);
  }
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

// What the template says about building that type. Not shipped in the file —
// shown on the page, because it is the instruction for the author. Only the
// per-type half: the style half is the same in all eight templates.
export function buildNotes(id) {
  const lines = String(TEMPLATES[id] || "").replace(/\r/g, "").split("\n");
  const start = lines.findIndex((l) => /^HOW TO BUILD THIS TYPE/.test(l));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^=+$/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).filter((l) => /^-/.test(l));
}

/* --------------------------------------------------------------- assemble */

const isType = (line) => /^(TYPE|PERSONALITY):/.test(line);
const isOthers = (line) => /^Other key people/.test(line);
const typeWord = (id) => (id === "non_con" ? "NON-CON" : id.toUpperCase());

function findSection(sections, num) { return sections.find((s) => s.num === num); }

// Lines of the TYPE block: the TYPE line down to the line before "Other key
// people", which is where the cast list starts.
function typeBlock(body) {
  const start = body.findIndex(isType);
  if (start === -1) return { start: -1, end: -1, lines: [] };
  let end = body.findIndex((l, i) => i > start && isOthers(l));
  if (end === -1) end = body.length;
  return { start, end, lines: body.slice(start, end) };
}

function addMissing(into, from) {
  const seen = new Set(into.map((l) => l.trim()));
  for (const line of from) {
    if (!line.trim() || seen.has(line.trim())) continue;
    into.push(line);
    seen.add(line.trim());
  }
  return into;
}

// The age gap lines, word for word from the method. They go in only when the
// author says an age gap is taboo in this world.
const AGE_GAP = {
  sec1: "{{user}}'s minimum age is half of {{user}}'s age, plus 7, and it is never lower than 18. When {{user}}'s minimum age is higher than <Name>'s age, <Name> grows more nervous about {{user}}'s attention, worries what people will think of <her/him>, and hesitates longer. <Name> does not refuse outright.",
  sec3: "The age gap is a hurdle, not a wall. {{user}} clears it only through repeated effort over many scenes, with patience, respect, and kindness that holds while others judge. A declaration from {{user}} that the gap does not matter changes nothing.",
  sec9: "AGE GAPS: {{user}}'s minimum age is half of {{user}}'s age, plus 7, and it is never lower than 18. When it is higher than <Name>'s age, EVERYONE treats {{user}} as a creep for pursuing <her/him>, <Name> included.",
  sec12: "- Declaring the age gap does not matter",
};

// Build the file the author is going to fill. Any number of personality types
// go into one TYPE block, any number of scene types stack on top of them, and
// the age gap lines go in when they apply.
export function assemble({ types = [], scenes = [], ageGap, who }) {
  const picked = types.filter((id) => TEMPLATES[id]);
  const stacked = scenes.filter((id) => TEMPLATES[id]);
  const base = picked[0] || stacked[0];
  if (!base) return null;
  const built = parse(TEMPLATES[base]);
  const sections = built.sections.map((s) => ({ ...s, body: [...s.body] }));

  // Two or more personalities are one TYPE block, never stacked sections.
  const others = picked.slice(1);
  if (others.length) {
    const one = findSection(sections, 1);
    const mine = typeBlock(one.body);
    const strip = (line) => line.replace(/^TYPE:\s*[A-Z -]+(?:\s+AND\s+[A-Z -]+)*\.\s*/, "");
    if (mine.start >= 0) {
      const merged = [`TYPE: ${picked.map(typeWord).join(" AND ")}.`];
      addMissing(merged, [strip(mine.lines[0]), ...mine.lines.slice(1)]);
      for (const id of others) {
        const theirs = typeBlock(parse(TEMPLATES[id]).sections.find((s) => s.num === 1).body);
        if (theirs.start < 0) continue;
        addMissing(merged, [strip(theirs.lines[0]), ...theirs.lines.slice(1)]);
      }
      one.body.splice(mine.start, mine.end - mine.start, ...merged.filter((l) => l.trim()));
    }
  }

  // Scene types change how "no" works. Each one stacks onto the same sections.
  for (const scene of stacked) {
    if (scene === base) continue;
    const add = parse(TEMPLATES[scene]).sections;

    // 1. the scene's own lines go inside the same TYPE block
    const one = findSection(sections, 1);
    const theirs = typeBlock(findSection(add, 1).body);
    const mine = typeBlock(one.body);
    if (mine.start >= 0 && theirs.lines.length > 1) {
      const extra = theirs.lines.slice(1).filter((l) => l.trim() && !isType(l));
      one.body.splice(mine.end, 0, ...extra);
    }

    // 3. both sets of locks
    addMissing(findSection(sections, 3).body, findSection(add, 3).body);

    // 5. the scene's consent block replaces the CONSENT MODE line
    const five = findSection(sections, 5);
    const theirFive = findSection(add, 5).body;
    const sameEvery = theirFive.findIndex((l) => /^THE SAME IN EVERY SCENE:/.test(l));
    const consent = theirFive.slice(0, sameEvery === -1 ? theirFive.length : sameEvery).filter((l) => l.trim());
    const mode = five.body.findIndex((l) => /^CONSENT MODE, DEFAULT:/.test(l));
    if (mode >= 0 && consent.length) five.body.splice(mode, 1, ...consent);
    // A second scene type has no CONSENT MODE line left to replace, so its
    // consent lines join the ones already there.
    else if (consent.length) {
      const where = five.body.findIndex((l) => /^THE SAME IN EVERY SCENE:/.test(l));
      five.body.splice(where === -1 ? 0 : where, 0,
        ...consent.filter((l) => !five.body.some((have) => have.trim() === l.trim())));
    }

    // 6. the scene's force text
    const six = findSection(sections, 6);
    if (scene === stacked[0]) six.body = [...findSection(add, 6).body];
    else addMissing(six.body, findSection(add, 6).body);

    // 11. both sets of sex lines
    const eleven = findSection(sections, 11);
    const theirEleven = findSection(add, 11).body;
    const head = eleven.body.findIndex((l) => /^How to write sex scenes:/.test(l));
    const theirHead = theirEleven.findIndex((l) => /^How to write sex scenes:/.test(l));
    if (head >= 0 && theirHead >= 0) {
      let stop = head + 1;
      while (stop < eleven.body.length && /^-\s/.test(eleven.body[stop])) stop++;
      const bullets = [];
      for (let i = theirHead + 1; i < theirEleven.length && /^-\s/.test(theirEleven[i]); i++) bullets.push(theirEleven[i]);
      const own = eleven.body.slice(head + 1, stop);
      eleven.body.splice(head + 1, stop - head - 1, ...addMissing(own, bullets));
    }

    // 12. both sets of losing prompts
    const twelve = findSection(sections, 12);
    const theirs12 = findSection(add, 12).body.filter((l) => /^-\s/.test(l));
    const tail = twelve.body.findIndex((l) => /^Continue the scene correctly/.test(l));
    const dashes = twelve.body.filter((l) => /^-\s/.test(l));
    addMissing(dashes, theirs12);
    twelve.body.splice(0, tail === -1 ? twelve.body.length : tail, ...dashes);
  }

  if (ageGap) {
    const one = findSection(sections, 1);
    const where = one.body.findIndex(isOthers);
    one.body.splice(where === -1 ? one.body.length : where, 0, AGE_GAP.sec1);
    findSection(sections, 3).body.push(AGE_GAP.sec3);
    findSection(sections, 9).body.push(AGE_GAP.sec9);
    const twelve = findSection(sections, 12);
    const tail = twelve.body.findIndex((l) => /^Continue the scene correctly/.test(l));
    twelve.body.splice(tail === -1 ? twelve.body.length : tail, 0, AGE_GAP.sec12);
  }

  // The name, the age and the pronouns are known already, so they are filled
  // in before the author is shown a single blank.
  const fill = (line) => (who ? fillKnown(line, who) : line);
  return {
    head: built.head.map(fill),
    sections: sections.map((s) => ({ ...s, heading: fill(s.heading), body: s.body.map(fill) })),
  };
}

/* ----------------------------------------------------------------- slots */

const PRONOUNS = {
  male:   { "she/he": "he", "her/his": "his", "her/him": "him", "herself/himself": "himself" },
  female: { "she/he": "she", "her/his": "her", "her/him": "her", "herself/himself": "herself" },
  other:  { "she/he": "they", "her/his": "their", "her/him": "them", "herself/himself": "themself" },
};

// Everything the builder already knows is filled in before the author sees a
// single blank: the name, the age, and every pronoun.
export function fillKnown(text, { name, age, gender, cardName }) {
  const words = PRONOUNS[(gender || "").trim().toLowerCase()] || PRONOUNS.other;
  return String(text)
    .replace(/<CARD NAME>/g, cardName || name || "Card name")
    .replace(/<Name>/g, name || "Name")
    .replace(/<age>/g, age || "age")
    .replace(/<(she\/he|her\/his|her\/him|herself\/himself)>/g, (_, key) => words[key]);
}

const slugOf = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "slot";

// A line that is nothing but one bracket, nested brackets included, is a block
// the author writes several lines into. Anything else bracketed is one answer
// inside a fixed line.
function wholeLineSlot(line) {
  const text = line.trim();
  if (!text.startsWith("<") || !text.endsWith(">")) return null;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "<") depth++;
    else if (text[i] === ">") { depth--; if (depth === 0 && i !== text.length - 1) return null; }
  }
  return depth === 0 ? text.slice(1, -1) : null;
}

// The header carries the opening line, so it is filled the same way a section
// is. It is never dropped and never renumbered.
function units(built) {
  return [{ num: "h", heading: "The header", body: built.head, fixed: true }, ...built.sections];
}

// Walk the assembled file and list every blank, in reading order, with the
// line it sits in so the author can see what they are answering.
export function slotsOf(built) {
  const slots = [];
  const seen = {};
  const key = (num, text) => {
    const id = `s${num}-${slugOf(text)}`;
    seen[id] = (seen[id] || 0) + 1;
    return seen[id] > 1 ? `${id}-${seen[id]}` : id;
  };

  for (const section of units(built)) {
    let i = 0;
    while (i < section.body.length) {
      const line = section.body[i];

      // "1. <...>" runs: one field, one item per line, numbered on the way out
      if (/^\d+\.\s*<\.\.\.>\s*$/.test(line)) {
        let end = i;
        while (end < section.body.length && /^\d+\.\s*<\.\.\.>\s*$/.test(section.body[end])) end++;
        slots.push({
          id: key(section.num, "numbered-list"), kind: "numbered", section: section.num,
          heading: section.heading, context: lastContext(section.body, i),
          help: "One per line. They are numbered for you.", count: end - i,
        });
        i = end;
        continue;
      }

      const block = wholeLineSlot(line);
      if (block) {
        slots.push({
          id: key(section.num, block), kind: "block", section: section.num,
          heading: section.heading, context: lastContext(section.body, i), help: block,
        });
        i++;
        continue;
      }

      for (const match of line.matchAll(/<([^<>]*)>/g)) {
        slots.push({
          id: key(section.num, match[1]), kind: "line", section: section.num,
          heading: section.heading, context: line, help: match[1],
        });
      }
      i++;
    }
  }
  return slots;
}

// The fixed line above a block, so a blank that says "<...>" is not the only
// thing the author has to go on.
function lastContext(body, index) {
  for (let i = index - 1; i >= 0; i--) {
    const line = body[i];
    if (!line.trim()) continue;
    if (wholeLineSlot(line)) continue;
    return line;
  }
  return "";
}

/* ---------------------------------------------------------------- render */

// Fill it or delete the line: a blank the author left empty takes its line
// with it, and a section left with nothing loses its heading.
export function render(built, values, { onlyNumbered = false } = {}) {
  const seen = {};
  const key = (num, text) => {
    const id = `s${num}-${slugOf(text)}`;
    seen[id] = (seen[id] || 0) + 1;
    return seen[id] > 1 ? `${id}-${seen[id]}` : id;
  };
  const value = (id) => String(values[id] || "").trim();

  const kept = [];
  for (const section of units(built)) {
    const out = [];
    let i = 0;
    while (i < section.body.length) {
      const line = section.body[i];

      if (/^\d+\.\s*<\.\.\.>\s*$/.test(line)) {
        let end = i;
        while (end < section.body.length && /^\d+\.\s*<\.\.\.>\s*$/.test(section.body[end])) end++;
        const written = value(key(section.num, "numbered-list"));
        if (written) {
          written.split("\n").map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean)
            .forEach((item, n) => out.push(`${n + 1}. ${item}`));
        }
        i = end;
        continue;
      }

      const block = wholeLineSlot(line);
      if (block) {
        const written = value(key(section.num, block));
        if (written) written.split("\n").forEach((l) => out.push(l));
        i++;
        continue;
      }

      const blanks = [...line.matchAll(/<([^<>]*)>/g)];
      if (!blanks.length) { out.push(line); i++; continue; }
      let filled = line, dead = false;
      for (const blank of blanks) {
        const written = value(key(section.num, blank[1]));
        if (!written) { dead = true; continue; }
        filled = filled.replace(blank[0], written);
      }
      if (!dead) out.push(filled);
      i++;
    }
    // trailing blank lines inside a section mean nothing once it is filled
    while (out.length && !out[out.length - 1].trim()) out.pop();
    if (out.length || section.fixed) kept.push({ ...section, body: out });
  }

  // Renumber what is left, and move every "section N" reference with it.
  const numbered = kept.filter((s) => !s.fixed);
  const moved = {};
  numbered.forEach((section, index) => { moved[section.num] = index; });
  const renumber = (text) =>
    text.replace(/\bsection (\d+)\b/g, (whole, n) => (moved[n] != null ? `section ${moved[n]}` : whole));

  const lines = [];
  for (const section of kept) {
    if (section.fixed) { section.body.forEach((line) => lines.push(line)); lines.push(""); continue; }
    lines.push(`${moved[section.num]}. ${renumber(section.heading)}`);
    section.body.forEach((line) => lines.push(renumber(line)));
    lines.push("");
  }

  return [...lines, "END HARD RULES", BANNER].join("\n");
}

// How many blanks are still empty. The number on the step, and the reason the
// file is not finished.
export function blanksLeft(built, values) {
  return slotsOf(built).filter((slot) => !String(values[slot.id] || "").trim()).length;
}
