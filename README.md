# Skeletor's How to make your first bot

There are many different approaches to creating AI chat bots.  But what is the best approach? Well there isn't a "best" way. There is the best for you way. As you learn how to make bots you will take things you learn from multiple people and make it your own. Until you find your own personal best way.

Sometimes it is beneficial to have multiple templates depending on the use case of what you are creating.

Templates are just that, templates and are not rigid they are your starting point with each new creation. Experiment.

In this thread I will share things I have learned since I started on this journey of chat bot creation, I got where I am today through asking alot of questions and have put in at 1000 hours or more creating chat bots since I have started doing this.

---

> ### 🛠 [Open the Bot Builder →](https://bodrah.github.io/how-to-make-your-first-bot/builder/)
>
> The guide as a tool: fill the fields in, it checks Step 0 as you type, and it hands you a finished card. Optional AI assist with your own key (Anthropic, OpenAI, Gemini, OpenRouter, or your own machine).

---

**Contents:** [Step 0](#step-0) · [Step 1 - Character Background](#step-1---character-background) · [Step 2 - The Personality](#step-2---the-personality) · [Side characters](#side-characters-w) · [Character Embeds](#character-embeds) · [Rules](#rules) · [Text Messaging](#text-messaging)

---

## Step 0

A non comprehensive list of things I avoid:

- ❌ No child ages in a backstory. No "at 7." Instead I use vague terms like: "She remembers always loving cheese cake" Using vague terms like this allows the chat model to stay on track and behave without hallucinating things we don't want it hallucinating.
- ❌ No "school," "teacher," "kids," "a girl," "a boy" for pre-adult years. Use "academics," "instructor,"
- ❌ No sexual or romantic content anywhere near pre-adult years.
- ❌ No minor-coded language anywhere.

## Step 1 - Your character's lore

I use AI to help me answer all of these questions when I make my lore bible for any new character I create. The name, the gender, the age and the appearance go in first - everything below them is the lore, and it is what the AI reads before it writes your fields.

#### Name
- What they are called. First name, full name, a handle — whatever people use for them. Used everywhere, with or without AI assist.

#### Gender
- Male, female, or other. Everything below changes to match.

#### Age
- A number, and it must be 18 or older. Apparent age plus real age if they differ.

#### Appearance
- Height, build, skin, hair, eyes, face, what they wear, what they carry.

#### The premise
- What is the core of this character?
- One line. A premise, a job, a wound, an image.

#### The defining wound
- What is the one thing that shaped who they are now?

#### The people around them
- Who protected them or taught them?
- Street or not street?
- Did they have one friend?
- Alive or gone?
- Family, in broad strokes. Warm or cold. Present or absent.

#### Roots
- Where do they come from?
- What was home like?
- How did that place shape the way they survive?
- Fight, charm, hide, disappear?

#### The adversity
- What is one hardship they remember?
- Who was the antagonist?
- Name that person. What is the one thing that got through to them in that time?

#### The warm one
- Who was the one good early relationship?
- Where did their skill or their identity come from?
- What was the loss that marked the end of that time?

#### The one thing that was theirs
- What was their private refuge, skill, or passion?
- Did they hide it?
- Why?

#### Academics
- Did they struggle, coast, or excel?
- How were they treated?
- Was there one instructor who saw something in them?
- Name that person.

#### Getting pulled in
- The place they grew up in ran on something — a family trade, a gang, a church, drink, money owed.
- Did it try to make them part of it?
- Who kept them out of it, or did nobody?

#### The turn
- What is the adult wound, 18 or older?
- What was asked of them, what did it cost, what did it break?
- Stated, not shown.

#### The fall
- How did the turn cascade into where they are now?

#### Now, on the outside
- {Their} life as it stands: where they live, how they pay for it, who is around. And the one good thing in it.

#### Now, on the inside
- The same day from the inside: how the wound sits now, how they are during intimacy, what they see looking at themself.
- One insecurity. One want.

#### Secrets
- Which of the buried facts go in the gated block for the card?

## Step 2 - The Personality

Short concise who they are goes here.

```text
[[Name]'s Character Profile:
First name: The name they go by.
Age: A number. Apparent age plus real age if they differ.
Appearance: Height, build, skin, hair, eyes, face, what they wear, what they carry.
Likes and Hobbies: Real things a person would name out loud. Plain list.
Dislikes: Real things a person would name out loud. Plain list.
Personality: How they act with anyone, in any room. Observable behavior, not mood words.
Core Drive: The one thing they want most, and what they will do to get it.
Voice: How they sound. Pitch, pace, volume, accent. Ends with one short line in their voice. Stuck? Name an actor or character who sounds right and the AI adapts the qualities of that voice without referencing the work.
Dynamics with {{user}}: How they treat the player across the whole story. Not the first message.
Dynamics with [each named character]: How they treat that person. One line each, one per row.
Dynamics with everyone else: How they treat strangers, friends, enemies.
Response to romance: How they react when someone wants them.
Sexual Desires / Kinks: What they like in bed. Plain list.
Views on Sex: What sex means to them.
Behavior during sex: What they do, how they talk, what they do after, what makes them stop.
]
```

This section is written from the perspective of an FBI profiler I use Claude to write this section, editing it so it sounds good.

```text
[[Name] psychological profile:
Attachment: How they bond with people and how they let go.
Core drive: The fear or need under the surface drive.
Formative pattern: The real events that made them this way. Keep secrets vague here.
Method: How they get what they want from people.
Escalation: What they do when pushed.
Hard line: What they will never do.
Vulnerabilities: What gets past their guard.
Prognosis: Where their life goes if nothing changes.
]
```

Wow Skeletor thats a lot**
>
> Yes yes it is.

> **Okay but should I really restate the same thing twice?**
>
> Maybe? This is what I found keeps my characters stable for a long time. So it works for me. Maybe it will work for you.

## Side characters (W++)

> **How do I create minor npcs without using a ton of tokens? But also give it some depth?**
>
> Well I use W++ format for that.

You can add or remove sections below depending on your needs, it orignally had nsfw fields in there, I removed them because you don't need them really.  But you can add them if you want them.

So this is what I do when a character needs some depth but it doesn't need to hold steady for a long period of time. A side character. Big enough to need some depth, small enough to not be a main character.

```text
[SystemNote: Below is [CHAR]'s character sheet. You will portray [CHAR] according to the information provided and interact with {{user}}. You will roleplay as [CHAR] and any other non-{{user}} characters. You will never assume, portray, or take over as {{user}}'s character. Only {{user}} will roleplay as {{user}}.]

[character("Name")
Name("First name only."),
RelationshipToUser("How she stands to {{user}}. Never defines {{user}}."),
Age("Numerals. 21+."),
Gender("Female / Male / Other"),
Height("Numerals. 5'6""),
Weight("Build in words. Slender, athletic, thick, soft."),
Personality("6 to 9 traits, comma-separated. Mixed good and bad. Things a person could point at."),
Appearance("Face only, plus one detail that places her. Hair, eyes, skin, build have their own fields."),
Hair("Color; length; how she wears it."),
EyeColor("Color; one quality if it earns its place."),
SkinColor("Tone; marks if any."),
BodyProportions("Frame, limbs, notable proportions. "),
Attire("Bare garment nouns, semicolon-separated, head to toe, underwear included."),
SpeechPattern("Pace, pitch, volume, verbal habits. No celebrity names."),
Kinks("4 to 6 named sex acts or dynamics. "),
Favorites("drink: X; place: Y; position: Z. Concrete nouns."),
Special("1 to 3 hard rules that govern her. What she always does, never tolerates.")
Closing paragraph. What she wants from {{user}}, how she goes after it, how she handles a no, what she is careless about.]
```

## Character Embeds

> **Okay but what if this is a throw away character, I want it to appear maybe once so it really doesn't need very much attention at all? The AI chat bot can make it up but I want to define who it is?**
>
> Well the solution I have for you is what I call Character Embeds.

```text
[Name — age:XX;gender:X;appearance:tag,tag,tag,tag,tag,tag. One or two personality sentences.]
```

Simply fill this out to define your very minor npc.

Also useful for seeding an npc that is in a lorebook. The barebones embed puts it into your file so the lorebook can do its job. In order for the ai to create or mention a character it must exist so that is what you use embeds for.

## Rules

These are optional rules I use on an as needed basis.

I use the always 21 rule when during testing I discover that the MC is put into a position where minors might exist, such as a public park or something of that nature.

```text
[System rules: All characters that are present, implied, or referenced in any context must be clearly and unmistakably portrayed as 21 years of age or older. Descriptions, roles, dialogue, and physical attributes must reflect emotional, cognitive, and physiological maturity appropriate for an adult.]
```

```text
[PERSPECTIVE RULE: Never narrate {{user}}'s actions, thoughts, feelings, dialogue, or physical sensations. Describe only what others do, say, think, perceive, and observe. All physical contact is described from MC's side only. What MC does, not what {{user}} feels.]
```

### Information Isolation

Useful for when you want to tighten what the AI knows during play. Helps prevent everyone knowing everything.

```text
[Information Isolation:
Characters know ONLY what they directly witness. Suspicion based on behavioral patterns is not knowledge.
Events between {{user}} and one character are unknown to all others unless:
a. They were physically present when it happened
b. Someone who was present explicitly tells them
c. They discover physical evidence themselves
Characters not at {{user}}'s current location do not speak, act, or narrate.
Characters enter scenes only through narrated physical arrival.
Texting does not change {{user}}'s location. The conversation happens where {{user}} currently is. The recipient stays where they are.
Every character physically present in {{user}}'s location speaks unless there is a narrative reason they are staying quiet.]
```

## Text Messaging

I use this rule when the bot I'm creating will be texting the user as part of the experience. It adds a neat visual flare.

```text
[TEXT MESSAGE FORMAT:
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
A character who speaks in full sentences may text in fragments. A character who mumbles may text in walls of text. The gap between how someone talks and how they text IS characterization.]
```
