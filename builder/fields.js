// Every field in the builder, in export order.
// `help` text is Skeletor's own wording from the guide — the field descriptions
// are the teaching, so they stay verbatim.
export const SECTIONS = [
  {
    id: "bible",
    step: "Step 1",
    title: "Character Background",
    blurb: "Your lore bible. Answer in plain English — this is thinking space, and it is not exported. The AI reads it when you ask it to draft the card.",
    exported: false,
    fields: [
      ["seed", "The seed", "What is the core of this character? One line. A premise, a job, a wound, an image."],
      ["wound", "The defining wound", "What is the one thing that shaped who she is now?"],
      ["name_options", "The name", "Pick one from four to six grounded options I offer. Or give me yours."],
      ["people", "The people around her", "Who protected her or taught her? Street or not street? Did she have one friend? Alive or gone? Family, in broad strokes. Warm or cold. Present or absent."],
      ["roots", "Roots", "Where does she come from? What was home like? How did that place shape the way she survives? Fight, charm, hide, disappear?"],
      ["adversity", "The adversity", "What is one hardship she remembers? Who was the antagonist? Name that person. What is the one thing that got through to her in that time?"],
      ["warm_one", "The warm one", "Who was the one good early relationship? Where did her skill or her identity come from? What was the loss that marked the end of that time?"],
      ["hers", "The one thing that was hers", "What was her private refuge, skill, or passion? Did she hide it? Why?"],
      ["academics", "Academics", "Did she struggle, coast, or excel? How was she treated? Was there one instructor who saw something in her? Name that person."],
      ["pull", "The pull of her world", "Did the world she grew up in try to take her too? Who kept her out?"],
      ["turn", "The turn", "What is the adult wound, 18 or older? What was asked of her, what did it cost, what did it break? Stated, not shown."],
      ["fall", "The fall", "How did the turn cascade into where she is now?"],
      ["now", "Now", "What is her current state? What is the one good thing in her life right now? How does she relate to the thing she lost?"],
      ["interior", "The interior", "How does she carry the wound today? How is she during intimacy? What does she see when she looks at herself? One insecurity. One want."],
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
      ["first_name", "First name", "The name they go by.", { line: "First name", short: true }],
      ["age", "Age", "A number. Apparent age plus real age if they differ.", { line: "Age", short: true }],
      ["appearance", "Appearance", "Height, build, skin, hair, eyes, face, what they wear, what they carry.", { line: "Appearance" }],
      ["background", "Background", "The cover story they tell people. Where they came from and how they got here. No secrets.", { line: "Background" }],
      ["likes", "Likes and Hobbies", "Real things a person would name out loud. Plain list.", { line: "Likes and Hobbies" }],
      ["dislikes", "Dislikes", "Real things a person would name out loud. Plain list.", { line: "Dislikes" }],
      ["personality", "Personality", "How they act with anyone, in any room. Observable behavior, not mood words.", { line: "Personality" }],
      ["core_drive", "Core Drive", "The one thing they want most, and what they will do to get it.", { line: "Core Drive" }],
      ["voice", "Voice", "How they sound. Pitch, pace, volume, accent. Ends with one short line in their voice.", { line: "Voice" }],
      ["dyn_user", "Dynamics with {{user}}", "How they treat the player across the whole story. Not the first message.", { line: "Dynamics with {{user}}" }],
      ["dyn_named", "Dynamics with named characters", "How they treat that person. One line each.", { line: null, perLine: "Dynamics with " }],
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
    id: "facts",
    step: "Step 2",
    title: "Facts",
    blurb: "Facts, things that doesn't need explaining",
    exported: true,
    wrap: (name) => [`[${name || "Name"} Facts:`, "]"],
    fields: [
      ["f_likes", "Likes", "Small concrete things. Food, drink, weather, habits.", { line: "Likes", block: true }],
      ["f_hates", "Hates", "Small concrete things. Sounds, smells, kinds of people.", { line: "Hates", block: true }],
      ["f_believes", "Believes", "Opinions they hold. Religion, luck, people, money.", { line: "Believes", block: true }],
      ["f_knows", "Knows", "Skills they have. Practical things they can do.", { line: "Knows", block: true }],
    ],
  },
];

// Repeatable side characters — one W++ sheet each.
export const WPP_FIELDS = [
  ["Name", "First name only."],
  ["RelationshipToUser", "How she stands to {{user}}. Never defines {{user}}."],
  ["Age", "Numerals. 21+."],
  ["Gender", "Female / Male / Other"],
  ["Height", "Numerals. 5'6\""],
  ["Weight", "Build in words. Slender, athletic, thick, soft."],
  ["Personality", "6 to 9 traits, comma-separated. Mixed good and bad. Things a person could point at."],
  ["Appearance", "Face only, plus one detail that places her. Hair, eyes, skin, build have their own fields."],
  ["Hair", "Color; length; how she wears it."],
  ["EyeColor", "Color; one quality if it earns its place."],
  ["SkinColor", "Tone; marks if any."],
  ["BodyProportions", "Frame, limbs, notable proportions."],
  ["Attire", "Bare garment nouns, semicolon-separated, head to toe, underwear included."],
  ["SpeechPattern", "Pace, pitch, volume, verbal habits. No celebrity names."],
  ["Kinks", "4 to 6 named sex acts or dynamics."],
  ["Favorites", "drink: X; place: Y; position: Z. Concrete nouns."],
  ["Special", "1 to 3 hard rules that govern her. What she always does, never tolerates."],
];

export const WPP_CLOSER = "Closing paragraph. What she wants from {{user}}, how she goes after it, how she handles a no, what she is careless about.";

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
