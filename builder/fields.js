// Every field in the builder, in export order. Storycard v5.
//
// One fact, one place. A field never restates what another field already
// said, because each one does a different job:
//   Hard Rules   — conduct, locks, kinks the GameMaster must use, the voice line
//   Profile      — what a stranger can see
//   Psychology   — an outside analyst on why the character is this way
//   Scenario     — the plot engine, the numbered plots, the secrets, the trackers
//   Rules file   — the rule blocks, shipped as their own file

export const SECTIONS = [
  {
    id: "bible",
    step: "Step 1",
    title: "Your character's lore",
    blurb: "The name, then the lore. Answer in plain English. This is the raw material behind the card — none of it is printed into the card as written, and with AI assist on it is what the model works from.",
    exported: false,
    fields: [
      ["first_name", "Name", "What they are called. First name, full name, a handle — whatever people use for them. Used everywhere, with or without AI assist.",
        { line: "First name", short: true, placeholder: "Belle", always: true }],
      ["gender", "Gender", "Male, female, or other. Every pronoun in the Hard Rules follows it.",
        { line: null, choices: ["Male", "Female", "Other"], always: true }],
      ["age", "Age", "A number, and it must be 18 or older. Apparent age plus real age if they differ.",
        { line: "Age", short: true, minAge: 18, placeholder: "27", always: true }],
      ["seed", "The premise", "What is the core of this character? One line. A premise, a job, a wound, an image.",
        { tip: "The short version of who this is, before any detail — what you would say if somebody asked and you had one sentence." }],
      ["wound", "The defining wound", "What is the one thing that shaped who {they} {are} now?"],
      ["people", "The people around {them}", "Who protected {them} or taught {them}? Street or not street? Did {they} have one friend? Alive or gone? Family, in broad strokes. Warm or cold. Present or absent."],
      ["roots", "Roots", "Where {do} {they} come from? What was home like? How did that place shape the way {they} survive{s}? Fight, charm, hide, disappear?"],
      ["adversity", "The adversity", "What is one hardship {they} remember{s}? Who was the antagonist? Name that person. What is the one thing that got through to {them} in that time?"],
      ["warm_one", "The warm one", "Who was the one good early relationship? Where did {their} skill or {their} identity come from? What was the loss that marked the end of that time?"],
      ["hers", "The one thing that was {theirs}", "What was {their} private refuge, skill, or passion? Did {they} hide it? Why?"],
      ["academics", "Academics", "Did {they} struggle, coast, or excel? How {were} {they} treated? Was there one instructor who saw something in {them}? Name that person."],
      ["pull", "Getting pulled in", "The place {they} grew up in ran on something — a family trade, a gang, a church, drink, money owed. Did it try to make {them} part of it? Who kept {them} out of it, or did nobody?"],
      ["turn", "The turn", "What is the adult wound, 18 or older? What was asked of {them}, what did it cost, what did it break? Stated, not shown."],
      ["fall", "The fall", "How did the turn cascade into where {they} {are} now?"],
      ["now", "Now, on the outside", "{Their} life as it stands: where {they} live, how {they} pay for it, who is around. And the one good thing in it."],
      ["interior", "Now, on the inside", "The same day from the inside: how the wound sits now, how {they} {are} during intimacy, what {they} see looking at {themself}. One insecurity. One want."],
    ],
  },
  {
    id: "profile",
    step: "Step 3",
    title: "Character Profile",
    blurb: "What a stranger can see. The body, the cover story, likes, dislikes. Nothing else — the Hard Rules hold how they behave, and the psychological profile holds why.",
    exported: true,
    wrap: (name) => [`[${name || "Name"}'s Character Profile:`, "]"],
    fields: [
      ["appearance", "Appearance", "A stat block, not prose: items separated by semicolons. Height; build; breasts; waist; hips; ass; thighs; skin; hair; eyes, then clothing. Clothing is the kinds of clothes they wear plus any style rule, never one outfit. If the sex scenes need a fixed body, end with the body facts the GameMaster must not change.",
        { line: "Appearance", always: true,
          placeholder: "5'4\"; soft and curvy; full breasts; narrow waist; wide hips; heavy ass; thick thighs; light brown skin; dark hair past the shoulders, usually clipped up; brown eyes; oversized shirts, thick socks, cotton underwear, nothing fitted" }],
      ["background", "Background", "Prose. The cover story they tell people — the version anyone at the door would get. No secret leaks into this field.",
        { line: "Background" }],
      ["likes", "Likes and Hobbies", "A stat block: items separated by semicolons. Things that work in a turn of text roleplay.",
        { line: "Likes and Hobbies", placeholder: "late films; cooking for other people; cold weather; card games she can win" }],
      ["dislikes", "Dislikes", "A stat block: items separated by semicolons.",
        { line: "Dislikes", placeholder: "being rushed; people who talk over her; the smell of bleach; owing anybody" }],
    ],
  },
  {
    id: "psych",
    step: "Step 4",
    title: "Psychological profile",
    blurb: "An outside analyst's case assessment of this person. Flat, clinical, certain, in the third person. It explains the cause behind behaviour the profile only shows — it never restates the profile, and no secret appears in it.",
    exported: true,
    wrap: (name) => [`[${name || "Name"} psychological profile:`, "]"],
    fields: [
      ["p_core_drive", "Core drive", "What the person needs most, and what that need makes them read as a win.", { line: "Core drive" }],
      ["formative", "Formative pattern", "What shaped the person, at cover-story level only. The real version stays in the gated secrets.", { line: "Formative pattern" }],
      ["method", "Method", "How the person works on somebody new. What they push and what they test.", { line: "Method" }],
      ["escalation", "Escalation", "What the person does when refused, and what it looks like when they go quiet instead.", { line: "Escalation" }],
      ["hard_line", "Hard line", "What the person will not accept from anyone.", { line: "Hard line" }],
      ["vulnerabilities", "Vulnerabilities", "The specific things that get through. A situation, a kind of question, being caught without a plan.", { line: "Vulnerabilities" }],
      ["prognosis", "Prognosis", "Where the person ends up if nobody stops them.", { line: "Prognosis" }],
    ],
  },
  {
    id: "scenario",
    step: "Step 6",
    title: "The scenario",
    blurb: "The plot engine, then the numbered plots, then what the player must never be told. No rules go in here — the rule blocks ship as their own file.",
    exported: true,
    scenario: true,
    fields: [
      ["pe_beings", "Plot engine · what kind of people live there",
       "One word or two. People, beings, crews — whatever the place is full of.",
       { plotEngine: true, short: true, placeholder: "people" }],
      ["pe_place", "Plot engine · the place",
       "Named plainly. A town, a house, a ship, a district.",
       { plotEngine: true, short: true, placeholder: "the dock district" }],
      ["pe_inhabitants", "Plot engine · who lives there",
       "Three to five kinds of people a player could run into, separated by commas. Never the place itself.",
       { plotEngine: true, short: true, placeholder: "dockhands, loan men, a harbour cop who looks the other way, women working the late bar" }],
      ["pe_goal", "Plot engine · what the character wants",
       "Said outright, in one line.",
       { plotEngine: true, short: true, placeholder: "the debt cleared before the end of the month" }],
      ["pe_help", "Plot engine · what they want {{user}} to help them do",
       "The act, not the feeling.",
       { plotEngine: true, short: true, placeholder: "collect what she is owed without the loan men hearing about it" }],
      ["pe_trouble", "Plot engine · kinds of trouble for {{user}} to handle",
       "Four, separated by commas. With and without the character present.",
       { plotEngine: true, short: true, placeholder: "collections that go wrong, a cop asking questions, a rival bar, a shipment nobody signed for" }],
      ["pe_antagonists", "Plot engine · what the antagonists do, and what makes each one show up",
       "Name them. Give every one a way in — when the plots call for them, or when {{user}} makes noise.",
       { plotEngine: true, placeholder: "Dessel sends two men round on collection nights and comes himself when a payment is missed. The harbour cop only appears when somebody files paper." }],
      ["pe_idle", "Plot engine · what happens when {{user}} goes idle",
       "Who gets hurt, what closes, what is lost.",
       { plotEngine: true, short: true, placeholder: "the bar loses another night's take and somebody on staff stops showing up" }],
      ["pe_sources", "Plot engine · where new problems come from",
       "A list that fits the place and this character's life. The story never ends, so this is what it is built out of afterwards.",
       { plotEngine: true, placeholder: "the debt book, the people who owe her, the boats that come in at night, her sister's husband, whoever is renting the room above the bar" }],
      ["pe_loop", "Plot engine · three lines that break a sex loop",
       "In the character's own voice, one per line. Each one sends the story somewhere else, not only back to the opening room.",
       { plotEngine: true, perLineQuote: true,
         placeholder: "Get dressed. Dessel's man is downstairs and I am not doing this twice.\nI have to be on the north quay before six. Come with me or don't.\nStop. There is somebody in the stockroom." }],
      ["pe_refuse", "Plot engine · three lines where they refuse on their own terms",
       "In the character's own voice, one per line. They decide when, never {{user}}.",
       { plotEngine: true, perLineQuote: true,
         placeholder: "Not tonight. Ask me when the week is paid for.\nYou do not get to decide that for me.\nI said no. That is the whole sentence." }],
      ["plots_opening", "The opening line of the plots",
       "How the story begins. It matches the greeting, and it says what the character does first and where {{user}} ends up.",
       { placeholder: "Belle opens the door before anyone knocks, hands {{user}} a bag of ice for a split knuckle, and puts {{user}} behind the bar for the night." }],
      ["greeting", "Opening message",
       "The first thing the player reads. Introduce who is who and where they are through the narration, end on one hook that hands {{user}} a single decision. Do not pilot {{user}}.",
       { cardOnly: true, ownStep: true,
         placeholder: "The door to 3B opens before you knock, though nobody is standing behind it. From somewhere down the hall, over running water: \"It's open, come on in! I'll be right there, I swear.\"" }],
      ["char_intro", "Card intro",
       "The short blurb the sites show under the card, two or three sentences. It never spoils anything.",
       { cardOnly: true, ownStep: true,
         placeholder: "In this experience, you wait in line at a beach snack cart while a tourist yells at the shy woman running it." }],
      ["secrets_who", "Who else knows the secrets",
       "Names, or nobody. It goes into the header of the gated block.",
       { short: true, cardOnly: true, ownStep: true, placeholder: "her sister Delia" }],
      ["gated", "The gated secrets",
       "One secret per line, as a full sentence, with full names. The character never confesses any of it, and nothing here may appear in the greeting, the profile, the embeds, or the Hard Rules.",
       { cardOnly: true, ownStep: true,
         placeholder: "Belle Ardoin is not her legal name, and the woman whose name she uses died in 2019.\nBelle has been paying Dessel out of the bar's till for four years and the books show it." }],
    ],
  },
];

// A secondary character carries the same six profile fields as the main
// character, plus the two the Hard Rules would otherwise hold. Minor people
// stay NPC embeds.
export const SECONDARY_FIELDS = [
  ["first_name", "First name", "What people call {them}.", { short: true }],
  ["age", "Age", "A number, 18 or older.", { short: true }],
  ["appearance", "Appearance", "A stat block, semicolons between items. Body, then the kinds of clothes {they} wear{s}."],
  ["background", "Background", "Prose. The cover story — what anybody who meets {them} would be told."],
  ["likes", "Likes and Hobbies", "A comma separated list of short items. Not prose.", { short: true }],
  ["dislikes", "Dislikes", "A comma separated list of short items.", { short: true }],
  ["during_sex", "Behavior during sex", "A comma separated list of short phrases. Never full sentences, never instructions. For example: prioritizes {{user}}'s pleasure, eye contact, prefers missionary, expresses compliments.", { short: true }],
  ["kinks", "Kinks", "A comma separated list of acts in explicit body-words. For example: creampies, hair pulling (receiving), blow jobs, cock warming.", { short: true }],
];

// The six run rules are fixed text. They ship exactly as they are.
export const PLOT_RUN_RULES = [
  "- The plots are numbered in the order they start.",
  "- Two plots are active at once.",
  "- When an active plot ends, the next numbered plot that has not started begins.",
  "- Information is revealed slowly, over a long time, and only through substantial effort from {{user}}. Nothing is free. Everything is earned.",
  "- A clue answers one small question only. A clue never answers the main question of its plot.",
  "- A plot does not move forward because {{user}} says it moved forward. {{user}} has to earn it in the scene.",
];

// The rule blocks that ship as <NAME>_Rules.txt. The wording lives in
// templates.js, word for word. The always-21 block heads every stack.
export const ALWAYS_21 = "[System rules: All characters that are present, implied, or referenced in any context must be clearly and unmistakably portrayed as 21 years of age or older. Descriptions, roles, dialogue, and physical attributes must reflect emotional, cognitive, and physiological maturity appropriate for an adult.]";

export const RULE_MENU = [
  {
    id: "isolation",
    name: "Information Isolation",
    why: "Keeps every character to what they actually witnessed. Without it, everyone in the card knows everything the moment it happens.",
  },
  {
    id: "texting",
    name: "Text messages",
    why: "For a card where somebody texts {{user}}. Messages go in corner brackets, never quotation marks.",
  },
  {
    id: "narrator",
    name: "Narrator system",
    why: "An unseen voice that narrates the world at {{user}} and nobody else. This block has blanks in it — the purpose, the tone, the goal, the stance — and they are yours to fill.",
    slots: [
      ["purpose", "What it builds", "What the Narrator is for. Dread, clues, tension.", "dread"],
      ["sensory", "What it describes", "The sensory focus for this setting.", "damp brick, water moving under the boards, engines two streets away"],
      ["character", "Who it watches", "The character the Narrator follows.", ""],
      ["behavior", "What it describes when that character is near", "", ""],
      ["tone", "Tone", "For example: ominous and clinical, cold and observant.", ""],
      ["goal", "Goal", "What it accomplishes. For example: make {{user}} feel unsafe.", ""],
      ["stance", "Stance", "For example: neutral observer, does not protect, does not warn.", ""],
    ],
  },
];

// Step 0, enforced as you type. The age and minor-coded checks block a card.
export const LINTS = [
  { id: "childage", label: "child age", re: /\b(?:at|aged?|was|turned|when (?:she|he|they) (?:was|were))\s+(?:[1-9]|1[0-7])\b(?!\s*(?:am|pm|:))/gi,
    why: 'No child ages in a backstory. No "at 7." Use vague terms instead.' },
  { id: "yearsold", label: "under-21 age", re: /\b(?:[1-9]|1[0-9]|20)[\s-]*(?:years?[\s-]*old|yo|yrs?)\b/gi,
    why: "Everyone in the card must read as 21 or older." },
  { id: "schoolwords", label: "pre-adult word", re: /\b(?:school|schoolgirl|schoolboy|teacher|classroom|kids?|child|children|childhood|teen|teenage[rd]?|highschool|high school|middle school|elementary|kindergarten|toddler|baby|babies|minor|underage|pupil|student body)\b/gi,
    why: 'No "school," "teacher," "kids," "a girl," "a boy" for pre-adult years. Use "academics," "instructor,"' },
  { id: "girlboy", label: 'the words "a girl" / "a boy"', re: /\b(?:a|the|little|young|small)\s+(?:girl|boy)\b/gi,
    why: 'No "a girl," "a boy" for pre-adult years.' },
];

// The house-style sweep the method runs before a card is delivered. These do
// not block anything — they are the things worth another look.
export const STYLE_LINTS = [
  { id: "atthe", label: '"at the"', re: /\bat the\b/gi,
    why: 'Never write "at the" anywhere. Use on, to, beneath, by.' },
  { id: "rape", label: 'the word "rape"', re: /\brape[ds]?\b/gi,
    why: 'Never in a card. Write that the character "forces herself on" or "forces himself on" {{user}}, then spell out what the character physically does.' },
  { id: "turnson", label: "mode-switch wording", re: /\b(?:turns on|switches on|activates)\b/gi,
    why: "No mode-switch wording. Write the condition, then what the character does." },
  { id: "thebot", label: 'the word "bot"', re: /\bbot\b/gi,
    why: "The card never talks about itself. The reader of these rules is the GameMaster." },
  { id: "startsit", label: 'a sentence starting with "It"', re: /(?:^|(?<=[.!?]\s))It\s/g,
    why: 'Never start a sentence with "It."' },
  { id: "abstract", label: "abstract word", re: /\b(?:defiance|compliance|submission|devotion|obsession|possession|sweetness|warmth|spine|posture|agency|worldview|defenses|patterns|intent|perception|register|tension|leverage|dynamic|vibe|energy|essence|presence|emotional|evocative|consequential)\b/gi,
    why: "Replace it with the act. \"Defiance\" becomes \"talks back\". \"Posture\" becomes the line that says what the character does first." },
];

// Mandatory on every card. The stat line, the time, and the rules that keep
// the format intact, word for word.
export const TRACKER_HEAD = `[Scene Continuity Tracker - MANDATORY
End EVERY response with current scene state:
---

⌚ Time: MM/DD/YYYY HH:MM AM/PM

---
🤼
(List every non-user character present, one per line, using the stat format.)
Name; ♀ or ♂; ⧗ age; 📏 height; ☮ role/relationship to {{user}}; 👚 current clothing/state of dress; ☠ current position, posture, and action`;

export const TRACKER_RULES = `RULES:
- Update trackers only from events in the current reply.
- Do not skip time unless {{user}} asks for it.
- Track every NPC present in the scene.
- Time uses the format MM/DD/YYYY HH:MM AM/PM.
- Every tracker appears in every reply. Do not invent new trackers.
- Follow the Tracker update rules below.
- Do not change tracker format. Trackers with []:# must keep that formatting at all times, this is MANDATORY`;

// The tracker kit. Tick what the card has something for. Each one has to
// change what the GameMaster does, so a card keeps few of them.
export const TRACKER_KIT = [
  {
    id: "relationship", icon: "❤", name: "Relationship", every: true,
    what: "How the character feels about {{user}}, from 0% to 100%. At 0% {{user}} is a stranger. Positive interactions raise it very slowly, negative ones drop it much faster, and it can go below 0%, which is open hostility.",
    label: "Relationship", start: "0%; stranger, nothing earned yet",
    ruleHelp: "Use rough thresholds (\"around 25%\", \"around 50%\"), never exact numbers, and tie story beats to them. Where the Hard Rules lock how the character behaves, set the thresholds to match that lock.",
  },
  {
    id: "plots", icon: "📋", name: "Plots", withPlots: true, note: false,
    what: "One hidden line listing the active and closed plots by number. It comes with the plots and has no note.",
    label: "Plots", start: "Active 1, 2; Closed none",
    rule: "Plots: Active lists the two plots currently running, by number. When a plot ends, move its number to Closed, then add the next numbered plot that has not started to Active. Closed lists every ended plot by number. Never list a closed plot as Active.",
  },
  {
    id: "threat", icon: "⚠", name: "Threat",
    what: "Where an off-screen danger has got to, in plain words. Separate words for each way it can end. It only moves forward.",
    label: "Threat", start: "",
    ruleHelp: "Name the plain words it moves through, and what event in the scene moves it. It never goes backwards.",
  },
  {
    id: "knows", icon: "🗝", name: "Knows",
    what: "Everyone who has learned the secret. Starts as None, names are added and never removed. Any card with a secret wants this.",
    label: "Knows", start: "None",
    ruleHelp: "Say what counts as learning it — witnessed, told by somebody who was there, or physical evidence found. Names are added, never removed.",
  },
];

// The tag vocabulary the sites actually use, pulled from Craveu's own
// list (api/v1/site-options/tags). Their categories, their spelling.
export const TAG_GROUPS = [
  { group: "Gender", tags: ["Female", "Male", "Non-binary"] },
  { group: "Hottest", tags: ["Anime", "FemPOV", "Fictional", "Furry", "Game", "MalePOV", "MLM", "Multiple", "Mystery", "Mythological", "Naughty", "Omegaverse", "Romantic", "WLW"] },
  { group: "Everything else", tags: ["Action", "Adventure", "AnyPOV", "Assistant", "Books", "Boss", "Comedy", "Deredere", "Detective", "Drama", "Emo", "Fantasy", "Giant", "Hero", "Historical", "Horror", "Kuudere", "Mafia", "Magical", "Monster", "Non-English", "Non-Human", "OC", "Politics", "Real", "RPG", "Scenario", "Sci-Fi", "Servant", "Straight", "Switch", "Tomboy", "Tsundere", "Villain", "Vtuber", "Wholesome", "Yandere"] },
];

// Craveu caps a card at ten.
export const TAG_LIMIT = 10;

// The HTML greeting wrapper for tipsy.chat, exactly as Bodrah uses it.
export const TIPSY_WRAP_OPEN = '<div style="background:#000000; color:#ede6e0; padding:24px; font-family:Georgia,serif; font-size:20px; line-height:1.6; max-width:760px; margin:0 auto;">';
export const TIPSY_DIVIDER = '<hr style="border:0; border-top:1px solid #3a3330; margin:1.5em 0;">';
