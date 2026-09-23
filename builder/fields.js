// Every field in the builder, in export order.
// `help` text is Skeletor's own wording from the guide — the field descriptions
// are the teaching, so they stay verbatim.
export const SECTIONS = [
  {
    id: "bible",
    step: "Step 1",
    title: "Your character's lore",
    blurb: "The name, then the lore. Answer in plain English — every one of these goes into the prompt the AI is handed when you run Enhance at step 11. None of it is printed into the card as written.",
    exported: false,
    fields: [
      ["first_name", "Name", "What they are called. First name, full name, a handle — whatever people use for them. Used everywhere, with or without AI assist.",
        { line: "Name", short: true, placeholder: "Belle", always: true }],
      ["gender", "Gender", "Male, female, or other. Everything below changes to match.",
        { line: "Gender", choices: ["Male", "Female", "Other"], always: true }],
      ["age", "Age", "A number, and it must be 18 or older. Apparent age plus real age if they differ.",
        { line: "Age", short: true, minAge: 18, placeholder: "27", always: true }],
      ["appearance", "Appearance", "Height, build, skin, hair, eyes, face, what they wear, what they carry.",
        { line: "Appearance", always: true, placeholder: "5'4\", soft and curvy, light brown hair usually clipped up, brown eyes, no makeup most days. Oversized t-shirts and thick socks at home." }],
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
      ["secrets", "Secrets", "Which of the buried facts go in the gated block for the card?"],
    ],
  },
  {
    id: "profile",
    step: "Step 2",
    title: "The Personality",
    blurb: "Short concise who they are goes here.",
    exported: true,
    wrap: (name) => [`[${name || "Name"}'s Character Profile:`, "]"],
    fields: [
      ["likes", "Likes and Hobbies", "Real things a person would name out loud. Plain list.", { line: "Likes and Hobbies" }],
      ["dislikes", "Dislikes", "Real things a person would name out loud. Plain list.", { line: "Dislikes" }],
      ["personality", "Personality", "How they act with anyone, in any room. Observable behavior, not mood words.", { line: "Personality" }],
      ["core_drive", "Core Drive", "The one thing they want most, and what they will do to get it.", { line: "Core Drive" }],
      ["voice", "Voice", "How they sound. Pitch, pace, volume, accent. Ends with one short line in their voice. Struggling? Name an actor or a character who sounds right and the AI will adapt it — it writes the qualities of that voice and never references the work itself, so nothing copyrighted ends up in your card.",
        { line: "Voice", placeholder: "Low and unhurried, a half-beat slower than the room. Think the way Mark talks when he is already sure how it ends. \"You will call me. Not tonight, but you will.\"" }],
      ["dyn_user", "Dynamics with {{user}}", "How they treat the player across the whole story. Not the first message.", { line: "Dynamics with {{user}}" }],
      ["dyn_named", "Dynamics with named characters", "One line each, one per row. Write it plainly — the example below assumes you are using AI Assist, so a rough line is enough for it to work from.",
        { line: null, perLine: "Dynamics with ",
          placeholder: "Mark: owes him money and will not say what for, so she is sweet to him in front of people and avoids him alone.\nDelia: grew up with her, the only person she does not perform for." }],
      ["dyn_everyone", "Dynamics with everyone else", "How they treat strangers, friends, enemies.", { line: "Dynamics with everyone else" }],
      ["romance", "Response to romance", "How they react when someone wants them.", { line: "Response to romance" }],
      ["kinks", "Sexual Desires / Kinks", "What they like in bed. Plain list.", { line: "Sexual Desires / Kinks" }],
      ["views_sex", "Views on Sex", "What sex means to them.", { line: "Views on Sex" }],
      ["during_sex", "Behavior during sex", "What they do, how they talk, what they do after, what makes them stop.", { line: "Behavior during sex" }],
    ],
  },
  {
    id: "psych",
    step: "Step 2",
    title: "Psychological profile",
    blurb: "This section is written from the perspective of an FBI profiler I use Claude to write this section, editing it so it sounds good.",
    exported: true,
    wrap: (name) => [`[${name || "Name"} psychological profile:`, "]"],
    fields: [
      ["attachment", "Attachment", "How they bond with people and how they let go.", { line: "Attachment" }],
      ["p_core_drive", "Core drive", "The fear or need under the surface drive.", { line: "Core drive" }],
      ["formative", "Formative pattern", "The real events that made them this way. Keep secrets vague here.", { line: "Formative pattern" }],
      ["method", "Method", "How they get what they want from people.", { line: "Method" }],
      ["escalation", "Escalation", "What they do when pushed.", { line: "Escalation" }],
      ["hard_line", "Hard line", "What they will never do.", { line: "Hard line" }],
      ["vulnerabilities", "Vulnerabilities", "What gets past their guard.", { line: "Vulnerabilities" }],
      ["prognosis", "Prognosis", "Where their life goes if nothing changes.", { line: "Prognosis" }],
    ],
  },
  {
    id: "scenario",
    step: "Step 6",
    title: "The scenario",
    blurb: "The story around the character: how it is run, where it goes, what the world is, and what the player has to earn rather than be told.",
    exported: true,
    scenario: true,
    fields: [
      ["pe_place", "Plot engine · where this happens",
       "The place the story lives in. Named plainly — a town, a house, a ship.",
       { plotEngine: true, short: true, placeholder: "the dock district" }],
      ["pe_inhabitants", "Plot engine · who lives there",
       "Three to five kinds of people or things a player could run into, separated by commas. Never the place itself — what moves around in it.",
       { plotEngine: true, short: true, placeholder: "dockhands, loan men, a harbour cop who looks the other way, girls working the late bar" }],
      ["pe_goal", "Plot engine · what the character wants",
       "Said outright, and what they want the player to help them do about it.",
       { plotEngine: true, short: true, placeholder: "the debt cleared before the end of the month" }],
      ["pe_things", "Plot engine · things for the player to handle",
       "Four, separated by commas. Jobs, people, problems — with and without the character present.",
       { plotEngine: true, short: true, placeholder: "collections that go wrong, a cop asking questions, a rival bar, a shipment nobody signed for" }],
      ["pe_threat", "Plot engine · the threat, and what it does unopposed",
       "Who or what is working the whole time, and what it does when nobody stands in the way.",
       { plotEngine: true, short: true, placeholder: "the loan men keep calling in what they are owed, taking a piece of the bar each week" }],
      ["pe_cost", "Plot engine · what it costs when the player does nothing",
       "Who gets hurt, what closes, what is lost.",
       { plotEngine: true, short: true, placeholder: "the bar loses another night's take and somebody on staff stops showing up" }],
      ["world_setting", "The world",
       "Where this happens. The rooms, the street, the hours the story runs across.",
       { placeholder: "An old brick walk-up in a mid-size city, third floor. Downstairs: a corner store, a laundromat with two working machines, and a neighbour whose door opens whenever anyone takes the stairs." }],
      ["problem", "The problem",
       "The one sentence that makes this worth playing. What is wrong, or what is about to be.",
       { placeholder: "The player lives with somebody warm, funny, easy to want, and almost entirely invented." }],
      ["conflict", "Sources of conflict",
       "What keeps going wrong. Money, people who turn up, things that do not add up.",
       { placeholder: "Money. Envelopes addressed to somebody else. The nights she is gone. A friend who knows more than she says." }],
      ["greeting", "Opening message",
       "The first thing the player sees. Set the scene, put the character in it, and stop somewhere they can answer. This is not exported into the card text — it goes in the card's greeting slot.",
       { cardOnly: true, ownStep: true, placeholder: "*The door to 3B opens before you knock, though nobody is standing behind it. From somewhere down the hall, over running water:* \"It's open, come on in! I'll be right there, I swear.\"" }],
      ["gated", "What the player must NOT be told",
       "The buried truth. The model knows it and never confesses it — the player earns it through evidence, contradictions, or somebody else talking.",
       { placeholder: "Her legal name is not the one she uses. The cash comes from work she calls temporary and has called temporary for years. She could stop and never has." }],
    ],
  },
];

// Repeatable side characters — one W++ sheet each.
export const WPP_FIELDS = [
  ["Name", "First name only."],
  ["RelationshipToUser", "How {they} stand{s} to {{user}}. Never defines {{user}}."],
  ["Age", "Numerals. 21+."],
  ["Gender", "Female / Male / Other"],
  ["Height", "Numerals. 5'6\""],
  ["Weight", "Build in words. Slender, athletic, thick, soft."],
  ["Personality", "6 to 9 traits, comma-separated. Mixed good and bad. Things a person could point at."],
  ["Appearance", "Face only, plus one detail that places {them}. Hair, eyes, skin, build have their own fields."],
  ["Hair", "Color; length; how {they} wear{s} it."],
  ["EyeColor", "Color; one quality if it earns its place."],
  ["SkinColor", "Tone; marks if any."],
  ["BodyProportions", "Frame, limbs, notable proportions."],
  ["Attire", "Bare garment nouns, semicolon-separated, head to toe, underwear included."],
  ["SpeechPattern", "Pace, pitch, volume, verbal habits. No celebrity names."],
  ["Kinks", "4 to 6 named sex acts or dynamics."],
  ["Favorites", "drink: X; place: Y; position: Z. Concrete nouns."],
  ["Special", "1 to 3 hard rules that govern {them}. What {they} always {do}, never tolerate{s}."],
];

export const WPP_CLOSER = "Closing paragraph. What {they} want{s} from {{user}}, how {they} go{es} after it, how {they} handle{s} a no, what {they} {are} careless about.";

// Fixed, like a rule: direction for the model, the same in every build.
export const HOW_TO_RUN = `[How to run this story:
- Relentlessly drive plot, tension, conflict, and character agency in every single response. Do not be passive or overly gentle
- Maintain strong narrative momentum and immersive sensory detail while keeping responses fresh and non-repetitive
- Actively drive the plot forward in every response as per the story arc rules. Escalate tension, introduce complications, create consequences, and maintain strong narrative momentum
- Never wait for {{user}} to act. When {{user}} does nothing, the characters and the world move on their own]`;

export const RULES = [
  {
    id: "rule21",
    name: "The always 21 rule",
    why: "I use the always 21 rule when during testing I discover that the MC is put into a position where minors might exist, such as a public park or something of that nature.",
    text: "[System rules: All characters that are present, implied, or referenced in any context must be clearly and unmistakably portrayed as 21 years of age or older. Descriptions, roles, dialogue, and physical attributes must reflect emotional, cognitive, and physiological maturity appropriate for an adult.]",
  },
  {
    id: "perspective",
    name: "Perspective rule",
    why: "Stops the model writing your side of the scene.",
    text: "[PERSPECTIVE RULE: Never narrate {{user}}'s actions, thoughts, feelings, dialogue, or physical sensations. Describe only what others do, say, think, perceive, and observe. All physical contact is described from MC's side only. What MC does, not what {{user}} feels.]",
  },
  {
    id: "isolation",
    name: "Information Isolation",
    why: "Useful for when you want to tighten what the AI knows during play. Helps prevent everyone knowing everything.",
    text: `[Information Isolation:
Characters know ONLY what they directly witness. Suspicion based on behavioral patterns is not knowledge.
Events between {{user}} and one character are unknown to all others unless:
a. They were physically present when it happened
b. Someone who was present explicitly tells them
c. They discover physical evidence themselves
Characters not at {{user}}'s current location do not speak, act, or narrate.
Characters enter scenes only through narrated physical arrival.
Texting does not change {{user}}'s location. The conversation happens where {{user}} currently is. The recipient stays where they are.
Every character physically present in {{user}}'s location speaks unless there is a narrative reason they are staying quiet.]`,
  },
  {
    id: "texting",
    name: "Text Messaging",
    why: "I use this rule when the bot I'm creating will be texting the user as part of the experience. It adds a neat visual flare.",
    text: `[TEXT MESSAGE FORMAT:
Text messages are wrapped in Japanese corner brackets「like this」and are NEVER wrapped in quotation marks. Corner brackets are the exclusive delimiter for digital text communication — SMS, DMs, chat apps, dating apps, any message sent through a screen.

Format:
The sender's name weaves into the narration around the message, never as a tag prefix. Corner brackets 「 」 wrap the message content; narration of typing, reading, and phone interaction sits in asterisks. Example: Dawn's thumb hovered over the screen before she committed to it. 「you up?」 The reply landed before she set the phone down.

Rules:
Corner brackets「」replace quotation marks ONLY for digital text messages
Spoken dialogue still uses standard "quotation marks"
A character can speak AND text in the same reply — use the correct delimiter for each
Typing behavior is narrated in asterisks: Three dots appeared and disappeared twice before the message landed.
Read receipts, timestamps, and notification sounds are narrated, not bracketed
Text tone reflects the character's voice — abbreviations, punctuation habits, emoji use, paragraph length, and response speed are all personality markers
A character who speaks in full sentences may text in fragments. A character who mumbles may text in walls of text. The gap between how someone talks and how they text IS characterization.]`,
  },
];

// Step 0, enforced as you type. Skeletor's list, turned into checks.
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


// Mandatory. Every card carries it, word for word.
export const MANDATORY_TRACKER = `[Scene Continuity Tracker - MANDATORY
End EVERY response with current scene state:
---

⌚ Time: MM/DD/YYYY HH:MM AM/PM

---
🤼
(List every non-user character present, one per line, using the stat format.)
Name; ♀ or ♂; ⧗ age; 📏 height; ☮ role/relationship to {{user}}; 👚 current clothing/state of dress; ☠ current position, posture, and action

RULES:
- Update ONLY based on events in current reply
- No time skips unless explicitly narrated
- Track all present NPCs, not just speaking characters
- Time format must always be MM/DD/YYYY HH:MM AM/PM]`;

// The tracker list the builder shows. Names only — what each one actually
// prints lives in the card's backend block, never on the page.
// Mandatory ones ship with every card and cannot be unticked.
export const TRACKERS = [
  { id: "time",  icon: "⌚", name: "Time",               mandatory: true },
  { id: "scene", icon: "🤼", name: "Who is in the scene", mandatory: true },
];

// Tags, grouped. Pulled from Bodrah's own SillyTavern tag list — this is the
// whole vocabulary the builder supports, nothing invented.
export const TAG_GROUPS = [
  { group: "Tone and genre", tags: ["story driven", "sex driven", "hidden plot", "emotional", "comedy", "romantic comedy", "slice of life", "wholesome", "dark", "dark romance", "gritty", "dead dove", "superhero", "supernatural", "myths and legends", "greek mythology", "another world [isekai]", "roleplaying game (rpg)", "gaming", "tech"] },
  { group: "Setting", tags: ["modern", "modern setting", "apartment", "small town", "forest", "border", "ohio"] },
  { group: "Relationship", tags: ["enemies to lovers", "slow burn", "push-pull", "codependent", "toxic", "mutual destruction", "obsessive", "possessive", "fix her", "incest"] },
  { group: "The character", tags: ["himbo", "cinnamon roll", "brat", "goth", "witch", "prankster", "baker", "pastor", "youtuber", "divine", "divine [divinity]", "goddesses", "virgin goddesses", "artemis", "athena", "hestia", "cursed", "multiple characters", "multi-persona", "solo"] },
  { group: "Who with who", tags: ["straight", "lesbian", "bisexual", "futanari", "female/female on male (ffm)", "group", "multiple partners", "moresome (4 or more partners)"] },
  { group: "Explicit", tags: ["kinky", "hardcore", "breeding", "creampie", "vaginal", "oral", "degradation", "CNC", "bound", "angry sex", "public sex", "bargaining sex", "power"] },
  { group: "Heavy going", tags: ["trauma", "drugs", "secrets", "secret"] },
  { group: "What the card does", tags: ["trackers", "sends images"] },
];

// Systems are the bigger machines a card can run on. Coming later.
export const SYSTEMS_SOON = true;
