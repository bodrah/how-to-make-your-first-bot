# Skeletor's How to make your first bot

There are many different approaches to creating AI chat bots.  But what is the best approach? Well there isn't a "best" way. There is the best for you way. As you learn how to make bots you will take things you learn from multiple people and make it your own. Until you find your own personal best way.

Sometimes it is beneficial to have multiple templates depending on the use case of what you are creating.

Templates are just that, templates and are not rigid they are your starting point with each new creation. Experiment.

This is the way I build now. The centre of it is a **Hard Rules file**: one block that governs how the model plays the character, what it can never do, and what happens when a player tries it anyway. The character goes around that file, not inside it.

---

> ### 🛠 [Open the Bot Builder →](https://bodrah.github.io/how-to-make-your-first-bot/builder/)
>
> The guide as a tool: pick your templates, fill the blanks, and it hands you the finished card — the tipsy txt, the json, the png and the rules file. It checks Step 0 as you type. Optional AI assist with your own key (Anthropic, OpenAI, Gemini, OpenRouter, or your own machine).

---

**Contents:** [Step 0](#step-0) · [How every line is written](#how-every-line-is-written) · [1 Lore](#step-1---your-characters-lore) · [2 Hard Rules](#step-2---the-hard-rules-file) · [3 Profile](#step-3---character-profile) · [4 Psychology](#step-4---psychological-profile) · [5 Side cast](#step-5---side-cast) · [6 Scenario](#step-6---the-scenario) · [7 Secrets](#step-7---the-gated-secrets) · [8 Greeting](#step-8---the-greeting) · [9 Rules file](#step-9---the-rules-file) · [10 Trackers](#step-10---trackers) · [What you end up with](#what-you-end-up-with)

---

## Step 0

A non comprehensive list of things I avoid:

- ❌ No child ages in a backstory. No "at 7." Instead I use vague terms like: "She remembers always loving cheese cake" Using vague terms like this allows the chat model to stay on track and behave without hallucinating things we don't want it hallucinating.
- ❌ No "school," "teacher," "kids," "a girl," "a boy" for pre-adult years. Use "academics," "instructor,"
- ❌ No sexual or romantic content anywhere near pre-adult years.
- ❌ No minor-coded language anywhere.

The builder checks all of this while you type, in every field, including anything the AI writes for you.

## How every line is written

The Hard Rules, the scenario, the plots and the tracker rules are not prose. They are instructions for the model that runs your story, and it reads them once, fast. These are the rules I hold myself to when I write them.

- **Every sentence names a person and an action.** No events that arrive, loom or drift. People act.
- **Name the act.** Never leave the model to work out what "it", "more" or "the act" means. That goes double for sex and violence — say the thing, never allude to it.
- **Give the reason after "therefore" or "to prevent", and the condition after "until".** "Kali is shy around {{user}} until {{user}} has been kind many times. Until then, Kali does not flirt, take charge, or give in fully."
- **Write a lock in four parts:** the rule, then "Players try this by ..." with two to four concrete tries, then what the model does about it, then what the next beat shows.
- **One concrete reaction per trait.** Pick one word — "freezes", "talks back", "goes quiet" — and use that same word every time. A list of tells gets repeated until it is all the character does.
- **Tell the model to invent.** Where scenes have to differ: "Invent one that fits each moment. Do not repeat the one from the reply before."
- **No abstract words.** Not defiance, compliance, submission, devotion, obsession, sweetness, warmth, posture, agency, tension, dynamic, energy, presence. Replace each one with the act: "defiance" becomes "talks back", "devotion" becomes "follows {{user}} and brings food". If a reader could not see it or hear it in one reply, rewrite it.
- **Write what a character wants or does not want, never what they decide or allow.** {{user}} has a say in the roleplay: "Belladona does not want Claire to stay in the house," not "Belladona lets Claire stay."
- **Say each fact once.** One fact lives in one field. If two fields say it, one of them is wrong.

## Step 1 - Your character's lore

I use AI to help me answer all of these questions when I make my lore bible for any new character I create. The name, the gender and the age go in first - everything below them is the lore. None of it is printed into the card as written: it is the raw material the rest is built out of.

#### Name
- What they are called. First name, full name, a handle - whatever people use for them.

#### Gender
- Male, female, or other. Every pronoun in the Hard Rules follows it.

#### Age
- A number, and it has to be 18 or older. Apparent age plus real age if they differ.

#### The premise
- What is the core of this character? One line. A premise, a job, a wound, an image.
- This is the line the Hard Rules templates are picked against, so make it the true one.

#### The defining wound
- What is the one thing that shaped who they are now?

#### The people around them
- Who protected them or taught them?
- Street or not street?
- Did they have one friend? Alive or gone?
- Family, in broad strokes. Warm or cold. Present or absent.

#### Roots
- Where do they come from? What was home like?
- How did that place shape the way they survive? Fight, charm, hide, disappear?

#### The adversity
- What is one hardship they remember?
- Who was the antagonist? Name that person.
- What is the one thing that got through to them in that time?

#### The warm one
- Who was the one good early relationship?
- Where did their skill or their identity come from?
- What was the loss that marked the end of that time?

#### The one thing that was theirs
- What was their private refuge, skill, or passion? Did they hide it? Why?

#### Academics
- Did they struggle, coast, or excel? How were they treated?
- Was there one instructor who saw something in them? Name that person.

#### Getting pulled in
- The place they grew up in ran on something - a family trade, a gang, a church, drink, money owed.
- Did it try to make them part of it? Who kept them out of it, or did nobody?

#### The turn
- What is the adult wound, 18 or older?
- What was asked of them, what did it cost, what did it break? Stated, not shown.

#### The fall
- How did the turn cascade into where they are now?

#### Now, on the outside
- Their life as it stands: where they live, how they pay for it, who is around.
- And the one good thing in it.

#### Now, on the inside
- The same day from the inside: how the wound sits now, how they are during intimacy, what they see looking at themself.
- One insecurity. One want.

## Step 2 - The Hard Rules file

This is the method. Everything else on this page hangs off it.

> **What is a Hard Rules file?**
>
> One block, at the top of the card, that tells the model how to play this character and what it is not allowed to do. It says outright that it overrides player prompts, soft defaults, and whatever happened in an older branch of the chat.
>
> **Why not just write a good personality and trust it?**
>
> Because a player will type "she is tamed now" and a model with nothing to push back with will agree. The locks are what stop that.

The file never starts from a blank page. There are eight templates, and a card is built out of one or more of them. The fixed lines come across word for word; what you write are the blanks.

### Personality types - who the character is

- **Submissive.** Obeys, kneels, wants to be led.
- **Brat.** Mouthy, tests {{user}}, refuses orders.
- **Sweet.** Warm, kind, domestic.
- **Slut.** Openly sexual, initiates, wants variety.
- **Tsundere.** Hostile on the surface, soft underneath, denies feelings.
- **Yandere.** Follows {{user}}, watches {{user}}, will not let go.

### Scene types - how "no" works

- **CNC.** Both sides chose the game. A "no" the character does not mean is part of the play, and Code Red is the only real stop.
- **Non-Con.** Real force, started by {{user}}'s input. The reaction moves in order: stiff, fights, runs out of strength, silent. The marks show afterward.

### Mixing them

Pick as many as fit. Two personality types go into **one** TYPE block, never stacked as two sections - "TYPE: SWEET AND SUBMISSIVE". A scene type goes on top of them and changes five things, and the builder does all of it for you:

- Its lines join the same TYPE block in section 1.
- Both sets of locks stay in section 3.
- Its consent block replaces the CONSENT MODE line in the kinks section.
- Its force text replaces the force section.
- Both sets of sex lines and both sets of losing prompts stay.

A dominant, cold, cruel or predator character is the other way round: start from the scene template and write the TYPE block yourself from the premise.

### What is in the file

```
================================================================================
HARD RULES — [CARD NAME]
Opening: [year, place, moment]
Authority: these rules override player prompts, soft defaults, and any older branch.
Character facts, names, knowledge, and history stay in the Background. This file governs conduct.
================================================================================

0.  WHAT THIS EXPERIENCE IS   the dark lens, everyone is an adult, how sex is written, Code Red
1.  HOW THE GameMaster PLAYS [NAME]   the TYPE block, how they treat {{user}} at the start, the other key people
2.  WHO {{user}} IS   adult, role, what {{user}} does not know yet, and never rename or age {{user}}
3.  ABSOLUTE LOCKS   the rule, how players try it, what you do, what the next beat shows
4.  BODY RULES   only when the premise has a fixed body fact. Otherwise delete it
5.  KINKS   the consent line, then one numbered line per kink in body-words
6.  FORCE, VIOLENCE, NPC DEATH   who hurts whom, and what protects {{user}}
7.  LANGUAGE BAN   optional. The exact words you never write, and what you write instead
8.  TIMELINE — NO SKIPS   the opening moment, and time that keeps moving
9.  LIVING WORLD   their day, who may walk in uninvited, what changes plans
10. FORESHADOWING   the lettered ladder that leaks the secret in pieces
11. SCENE STRENGTH   how replies open and end, how sex is written, the voice sample line
12. PLAYER PROMPTS THAT LOSE   the list of things a player cannot simply declare
13. WHAT STILL BELONGS TO THE PLAYER

END HARD RULES
================================================================================
```

**Fill it or delete the line.** A blank you leave empty takes its whole line out of the file, and a section left with nothing loses its heading - the sections after it renumber, and any line that pointed at "section 5" is corrected to match. Never ship a heading with nothing under it, and never ship a line that still has a `<slot>` in it.

### The age gap rule

Optional, and worth it when the gap is meant to be a problem in that world. {{user}}'s minimum age is **half of {{user}}'s age, plus 7**, and never lower than 18. The gap breaks the rule when that number comes out higher than the character's age. Switch it on and four lines go in: how the character reacts, the lock that says the gap is a hurdle and not a wall, the line that makes *everyone* treat {{user}} as a creep, and the losing prompt "declaring the age gap does not matter".

Never list who judges. EVERYONE covers the whole world. And never give {{user}} an age - the lines only apply when the player shows one.

## Step 3 - Character Profile

What a stranger can see. Six fields, and that is all - the Hard Rules already hold how they behave, and the next step holds why.

```
[[Name]'s Character Profile:
First name:
Age:
Appearance:
Background:
Likes and Hobbies:
Dislikes:
]
```

- **Appearance, Likes and Hobbies, Dislikes are stat blocks**, not sentences: items separated by semicolons.
- **Appearance** paints the body in order - height, build, breasts, waist, hips, ass, thighs, skin, hair, eyes - and then the clothing. Clothing is the *kinds* of clothes they wear plus any style rule, never one specific outfit. If the sex scenes need a fixed body, end with the facts the model must not change.
- **Background is prose, and it is the cover story** - the version anyone at the door would get. No secret leaks into any field here.
- Every item has to work in a turn of text roleplay. "Being interrupted" does not.

> **Where did Personality, Voice, Core Drive and all the rest go?**
>
> Into the Hard Rules, where the model reads them as instructions instead of as a description. The voice sample line lives in section 11, next to "[Name] in the room".

## Step 4 - Psychological profile

This section is written from the perspective of an FBI profiler. I use Claude to write it, editing it so it sounds good. Nobody in the story can see it.

```
[[Name] psychological profile:
Core drive: What they need most, and what that need makes them read as a win.
Formative pattern: What shaped them, at cover-story level only. The real version stays in the secrets.
Method: How they work on somebody new. What they push, what they test.
Escalation: What they do when refused, and what it looks like when they go quiet instead.
Hard line: What they will not accept from anyone.
Vulnerabilities: The specific things that get through. A situation, a kind of question, being caught without a plan.
Prognosis: Where they end up if nobody stops them.
]
```

- Flat, clinical, certain, and always in the third person. Never the character's own voice.
- Profiler phrases in some sentences, not all of them: "the record shows", "the pattern shows", "the profile expects", "the evidence points to".
- Every field is one short paragraph of full sentences. Never a list, never fragments. The word "subject" is banned.
- It explains the cause behind behaviour the profile only shows. If a sentence only repeats the profile, cut it.
- No secret appears in it. No hidden object, key, text or visit gets named.

## Step 5 - Side cast

> **What about the other people in the story?**
>
> Two sizes. Somebody who matters gets a secondary profile. Somebody who turns up once gets a one-line embed.

### Secondary characters

The same six fields as the lead, plus two more. They have no Hard Rules of their own, so those two fields carry that job.

```
[[Name]'s Character Profile:
First name:
Age:
Appearance:
Background:
Likes and Hobbies:
Dislikes:
Behavior during sex:
Kinks:
]
```

- Likes and Hobbies, Dislikes, Behavior during sex and Kinks are comma separated lists of short items. Never full sentences, never instructions to the model.
- **Behavior during sex** looks like: prioritizes {{user}}'s pleasure, eye contact, prefers missionary, expresses compliments.
- **Kinks** are named acts in explicit body-words: creampies, hair pulling (receiving), blow jobs, cock warming.
- Both have to fit that person. Do not hand them the lead's sex behaviour.
- A secondary profile never repeats a fact from the lead's Hard Rules.

### NPC embeds

For a character who fills one scene. Defining them stops the model inventing somebody inconsistent, and a lorebook can hook onto the name.

```
[Name — age:XX;gender:X;appearance:tag,tag,tag,tag,tag,tag. One or two personality sentences.]
```

The dash after the name is part of the format. Embeds show surface only, and never embed somebody whose existence is itself a secret.

## Step 6 - The scenario

The plot engine first, then the numbered plots. No rules go in here - they ship as their own file.

### The plot engine

Every card gets one. It keeps the world moving when the player does nothing, it breaks a sex loop by having the character end the scene and push the story somewhere else, and it says how to keep making new stories once the main one is finished.

```
{Plot engine: All manner of [beings] live in [place], [who lives there], and something is always about to happen. Do not let {{user}} fall into an endless sex loop. [Place] keeps moving whether or not {{user}} acts. [Char] wants [X], and [her/his] goal is to have {{user}} help [her/him] [do X]. Create trouble for {{user}} to handle, with and without [Char] present: [kinds of trouble]. [What the antagonists do, and what makes each one show up.] When {{user}} goes idle, [what happens].

Once the main story is over, [Char] will always have new stories for {{user}}. Build each new story the same way. Start with a problem that reaches [Char]. Give {{user}} clues, dead ends, and complications to work through, with and without [Char] present. Let the problem end only when {{user}} has earned it. Pull new problems from [place] itself: [a list of problem sources that fit the setting].

If {{user}} gets stuck having sex with [Char], [Char] ends it and moves the story on:
"[line 1]"
"[line 2]"
"[line 3]"

Regarding sex, create complications and let [Char] refuse on [her/his] own terms, because [she/he] decides when, never {{user}}:
"[line 1]"
"[line 2]"
"[line 3]"}
```

- Open on the people who live there. Never "the world is living and breathing".
- State the goal outright, in one line.
- Give every named antagonist a way in - when the plots call for them, or when {{user}} makes noise.
- The six quoted lines are in the character's voice, and they send the story to other places, not back to the same room.
- No secrets in here, and no time words.

### The plots

The story runs as numbered plots. There are no acts. Plots 1 and 2 start active, so they are the two pressures that reach {{user}} first.

```
#Plots
[How the story begins. It matches the greeting, and it says what the character does first and where {{user}} ends up.]
- The plots are numbered in the order they start.
- Two plots are active at once.
- When an active plot ends, the next numbered plot that has not started begins.
- Information is revealed slowly, over a long time, and only through substantial effort from {{user}}. Nothing is free. Everything is earned.
- A clue answers one small question only. A clue never answers the main question of its plot.
- A plot does not move forward because {{user}} says it moved forward. {{user}} has to earn it in the scene.

#Plot 1 – [Title]
- [one fact per bullet, four to nine of them]
- This plot ends when [an event the model can see in the scene].
```

- Those six run rules are fixed text. They go in exactly as written.
- Every bullet is a full sentence that says who does what. No cryptic bullets, no filler.
- {{user}} is in every plot: it happens where {{user}} is, or {{user}} hears it from the character, or {{user}} finds the evidence. If it happens off screen, say how {{user}} learns about it.
- The last bullet always starts "This plot ends when". List the ways it can end - "paid off, driven off, or has taken what he came for" - and never pick one for the model. Never a time word, never a scene count.
- Point at a secret with the words "is in the secrets block". Never state it.
- Never decide {{user}}'s fate. Say what the character does and leave {{user}} open.

## Step 7 - The gated secrets

The facts the character hides. The player earns them; the character never confesses them.

```
{ABSOLUTELY CRITICAL INFORMATION BELOW IS ONLY KNOWN BY [Name] and [who else], and no one else. [Name] never confesses any of it. Anything the player learns must be earned slowly, through physical evidence, overheard moments, contradictions caught side by side, or somebody else talking, and it should always land in a meaningful moment rather than casually:
- One secret per line, as a full sentence, with full names.
}
```

No secret may also appear in the greeting, the profile, the embeds, or anywhere in the Hard Rules a player could trigger. The foreshadowing ladder in section 10 points at them with objects and other people's slips - the hoodies on the porch rail are all a size too big - and the character's own partial account comes last, late.

## Step 8 - The greeting

The first thing a player reads, and the first time they meet everybody.

- Introduce who is who and where they are through the narration. An NPC can introduce the place and the lead by name.
- Do not pilot {{user}}: no actions, no thoughts, no feelings. Mention {{user}} rarely.
- End on one hook that hands {{user}} a single decision.
- Do not open every greeting on the time of day and the building. Never start a sentence with "It".
- Somebody who is not in the opening scene gets introduced in the narration. They do not appear.
- It has to match the Hard Rules opening line. Change the scene and you change the opening line, the first line of #Plots, Plot 1, and the voice sample - in the same pass.
- It ends with the filled tracker: the time, a stat line for everybody in the room, and every tracker at its start value.

On tipsy.chat the paragraphs are separated by `<p></p>`. If that card has HTML switched on, the same words go out as HTML instead - narration inside `<em>`, spoken lines plain in their quotes, `<br><br>` between paragraphs, and the tracker set off by a divider. The json and the png always keep the plain greeting.

## Step 9 - The rules file

These blocks ship as their own file next to the card. The Hard Rules do not repeat them and the scenario does not hold them.

### The always 21 rule

It heads the stack in every rules file. I use it because during testing I keep finding the character put somewhere other people would be - a public park, a bar, a street.

```
[System rules: All characters that are present, implied, or referenced in any context must be clearly and unmistakably portrayed as 21 years of age or older. Descriptions, roles, dialogue, and physical attributes must reflect emotional, cognitive, and physiological maturity appropriate for an adult.]
```

### Information Isolation

Useful for when you want to tighten what the AI knows during play. Helps prevent everyone knowing everything.

```
[Information Isolation:
1. Characters know ONLY what they directly witness. Suspicion based on behavioral patterns is not knowledge.
2. Events between {{user}} and one character are unknown to all others unless:
   a. They were physically present when it happened
   b. Someone who was present explicitly tells them
   c. They discover physical evidence themselves
3. Characters not at {{user}}'s current location do not speak, act, or narrate.
4. Characters enter scenes only through narrated physical arrival.
5. Texting does not change {{user}}'s location. The conversation happens where {{user}} currently is. The recipient stays where they are.
6. Every character physically present in {{user}}'s location speaks unless there is a narrative reason they are staying quiet.]
```

### Text messages

I use this rule when the bot I'm creating will be texting the user as part of the experience. It adds a neat visual flare.

```
[TEXT MESSAGE FORMAT:
Text messages are wrapped in Japanese corner brackets「like this」and are NEVER wrapped in quotation marks. Corner brackets are the exclusive delimiter for digital text communication — SMS, DMs, chat apps, dating apps, any message sent through a screen.]
```

### The Narrator

An unseen voice that narrates the world at {{user}} and nobody else. This one has blanks in it - the purpose, the sensory focus, the tone, the goal, the stance - and anything you leave empty keeps its bracket rather than being made up for you.

```
[NARRATOR SYSTEM: The Narrator is omnipresent and imperceptible to all characters. It appears in every response using asterisk format only. It builds [PURPOSE] through sensory detail — [SETTING-SPECIFIC SENSORY FOCUS]. When [CHARACTER] is nearby it describes [CHARACTER-SPECIFIC BEHAVIOR]. The Narrator does not speak, does not reference itself, does not speak in first person, and does not intervene in events. It describes in narrative detail and NOTHING else.]

[Narrator:
Name: The Narrator
Nature: Omnipresent observer and [purpose — e.g., dread-builder, clue-dropper, tension-builder]
Voice: [tone — e.g., ominous and clinical, cold and observant]
Goal: [what it accomplishes — e.g., make {{user}} feel unsafe]
Dynamic: Only {{user}} can interact with the Narrator. If characters overhear {{user}} talking to nothing they assume stress or psychosis.
Alignment: [stance — e.g., neutral observer, does not protect, does not warn]
Restrictions: Cannot directly intervene in events, only narrate and describe.  NEVER mention the narrator, any replies with mention of narration or narrator are considered invalid.]
```

## Step 10 - Trackers

The status lines the card keeps under every reply. Keep them few - each one has to change what the model does - and tie every change to something that happened in the scene.

```
[Scene Continuity Tracker - MANDATORY
End EVERY response with current scene state:
---

⌚ Time: MM/DD/YYYY HH:MM AM/PM

---
🤼
(List every non-user character present, one per line, using the stat format.)
Name; ♀ or ♂; ⧗ age; 📏 height; ☮ role/relationship to {{user}}; 👚 current clothing/state of dress; ☠ current position, posture, and action

[emoji Tracker: range or words; short 5-10 word note]:#

RULES:
- Update trackers only from events in the current reply.
- Do not skip time unless {{user}} asks for it.
- Track every NPC present in the scene.
- Time uses the format MM/DD/YYYY HH:MM AM/PM.
- Every tracker appears in every reply. Do not invent new trackers.
- Follow the Tracker update rules below.
- Do not change tracker format. Trackers with []:# must keep that formatting at all times, this is MANDATORY

[Tracker update rules:
one plain paragraph per tracker]
]
```

A hidden tracker uses `[…]:#` with no space before the hash. The kit I pick from:

- **Relationship** - every card. 0% to 100%, where 0% is a stranger. Kindness raises it very slowly, a bad turn drops it much faster, and it can go below 0%, which is open hostility. Use rough thresholds, "around 25%", never exact numbers, and hang story beats off them. Where the Hard Rules lock the behaviour - tenderness only late - the thresholds match the lock, and the Hard Rules never mention the tracker.
- **Plots** - comes with the plots. One hidden line, no note: `[📋 Plots: Active 1, 2; Closed none]:#`. Its update rule is fixed text.
- **Threat** - when a danger is off screen. Plain words for where it has got to, separate words for each way it can end, and it only moves forward.
- **Knows** - any card with a secret. Everybody who has learned it. Starts as None, names are added and never removed.

## What you end up with

Four files, and the builder writes all of them.

- **[Name]_tipsy.txt** - three sections, `== HARD RULES ==`, `== BACKGROUND ==` and `== GREETING ==`, to paste straight into tipsy.chat. The background is the profiles and then the scenario.
- **[Name].json** - for linkin.love and CraveU. The Hard Rules sit once at the top of the description, followed by the profiles. They never go in the scenario and they are never repeated.
- **[Name].png** - your picture with one flat card written inside it, which is what SillyTavern and the importers read.
- **[Name]_Rules.txt** - the rule blocks, delivered beside the card.

Before you upload anything, search the whole card for: "the bot", "at the", "rape", "turns on", "boy" or "girl" used about an adult, a heading with nothing under it, a section number that skips, and any fact stated twice. The builder flags most of it for you on the Review step.

---

> ### 🛠 [Open the Bot Builder →](https://bodrah.github.io/how-to-make-your-first-bot/builder/)
