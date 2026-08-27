# FemPower Learn: Content Plan

Draft content for the next two courses of FemPower Learn, built from the She Vibes 66-day curriculum and reframed for the FemPower member. This file is a content source, not a seed script. Once approved, it gets turned into a `seed_learn_course2.sql` / `seed_learn_course3.sql` the same way `seed_learn_course1.sql` was built.

Dates, day numbers, and week labels from the source material are dropped throughout. Nothing here is tied to a calendar.

---

## Part 1: What's already built (do not touch)

**Course 1: "Learn AI from Scratch"**, published, fully seeded, 3 modules, 22 wings. Source: `supabase/seed_learn_course1.sql`.

| Module | Wings | What it covers |
|---|---|---|
| 1. AI Foundations | 8 | What AI actually is, its 70-year history, tokens and embeddings, next-token prediction, training and RLHF, the layers between you and the model. |
| 2. Prompt Engineering | 7 | What a prompt is, specificity as the biggest lever, Role-Context-Task, reading and fixing bad responses, chaining for complex tasks, prompting across tools. |
| 3. Context Engineering | 7 | Context windows, connecting AI to your world via APIs, MCP, building a first integration, morning/evening briefs, RAG. |

This maps to She Vibes Days 1–22 (Weeks 1–3), reframed already: no "Viber," no WhatsApp cohort mechanics, no "further reading" links, no separate optional-stretch tier. Each wing is one self-contained unit: `title`, `context_content`, `reflection_prompt`, `extension_content`, `estimated_minutes`. That four-field shape is the contract every wing below follows.

**What's pending:** She Vibes Days 23–66 (Weeks 4–8, Challenge Week, Offboarding) have not been built. `LEARN_ROADMAP.md` already earmarks this as:
- Course 2: Build with AI (Agents, Planning, Building, Shipping)
- Course 3: Build with AI, Responsibly (Collaboration, Ethics, Capstone)

Part 2 below distills that source material. Parts 3–4 are the actual drafted wings, ready for review.

---

## Part 2: Source material, distilled

| She Vibes week | Days | Core idea | Proposed home |
|---|---|---|---|
| Week 4: AI Agents | 23–29 | Agents act instead of just answering; the ReAct loop; tool access; use-case design; multi-agent systems; failure modes and guardrails | Course 2, Module 4 |
| Week 5: Planning | 30–36 | Choosing a build direction; sizing scope (can I build this); ethics of scope (should I build this); architecture thinking; planning with AI; the terminal | Course 2, Module 5 |
| Week 6: Building | 37–43 | First lines of code; demystifying React/Node/Python; frontend vs backend; calling APIs; debugging with AI; databases | Course 2, Module 6 |
| Week 7: Shipping | 44–50 | Git, GitHub, deployment, domains/DNS, environment variables, the "done not perfect" mindset | Course 2, Module 7 |
| Week 8: Collaboration | 51–57 | Branches and pull requests, documenting architecture, disclosing AI's role, owning AI-generated code, ethics audits, a builder's manifesto | Course 3, Module 8 |
| Challenge Week + Offboarding | 58–66 | A self-contained plan-build-break-fix-ship-tell-teach-reflect cycle, capstone | Course 3, Module 9 |

Cut entirely (cohort-specific, no equivalent in FemPower Learn's self-paced format): live WhatsApp reviews, "220 women," public noon deadlines, declaring a track to the group. Where the source assumed a live cohort, the drafts below convert the action into something a solo learner does on her own timeline. Where the source said "share on WhatsApp," the drafts say "notice" or leave it to the existing reflection/journal feature to hold it.

---

## Part 3: Course 2, "Build with AI"

**Course description:** You understand AI now. You can talk to it, and you can bring your world into it. This course is where you use it to build something real, a working project, from a blank page to a live link. No computer science degree required. Just the same habit of clear thinking you've been building all along, now pointed at something you can point to.

### Module 4: AI Agents

**Description:** A chatbot waits for you to ask. An agent acts on a goal, using tools, without you guiding every step. This module is where you learn what agents actually are, how they reason, where they're useful in your own life, and where they can go wrong.

**Wing 1: What Is an AI Agent?**
- Context: A chatbot answers and stops. An agent has a goal, a set of tools, and the ability to decide what to do next without you steering every step. Tell it "research the top competitors in my market and send me a summary by 9am," and it searches, reads, synthesises, writes, and sends, while you were doing something else entirely. This is the shift from AI as a tool you operate to AI as a colleague you delegate to. The people who get the most from AI in the next few years won't be the best prompters. They'll be the best delegators, the ones who know what goal to give an agent, what tools to hand it, and when to trust it versus when to check its work.
- Reflection: What's the one task you'd most want to hand off to an agent, and what would you do with the time you got back?
- Extension: Ask any AI tool to explain what an agent is versus a chatbot, then ask for three concrete examples relevant to your own work, not generic ones. Pick the one task from your reflection and write it out as if you were briefing a new hire: what's the goal, what does it need to know, what should it never do without checking with you first.

**Wing 2: How Agents Actually Work**
- Context: Underneath, every agent runs a loop: receive a goal, make a plan, pick a tool, take an action, look at the result, decide what's next. Repeat until the goal is done or it gets stuck. This is called ReAct, short for Reason, Act, Observe. The tools it has access to set the ceiling on what it can do. Give it your calendar and it can schedule. Give it your email and it can draft and send. Give it the web and it can research. Understanding this loop means understanding the limits too. Agents aren't magic, they're structured reasoning plus tool access, and they get confused exactly where you'd expect: vague goals, failed tools, context that's run out.
- Reflection: Where in that reasoning loop would you want to stay in control, and where would you happily let it run on its own?
- Extension: Pick a real task you did recently, a decision, a piece of research, a plan. Map what you actually did onto Reason-Act-Observe. Then ask an AI tool to do the same task through the same loop and compare the two paths. Where your reasoning diverged from the AI's is exactly where your judgment lives.

**Wing 3: Designing Your First Agent Use Case**
- Context: Agents take different shapes depending on the job. A research agent takes a question, searches, reads, and returns a structured answer. A scheduling agent looks at your calendar and drafts the invite. A support agent reads incoming messages, classifies them, and drafts a response. None of these are hypothetical, all of them exist today. The useful question is never "does an agent exist for this." It's "what's the goal, what are the inputs, what's the output, and what decisions happen in between." Frame any problem that way and you can design an agent for it, even one you never build.
- Reflection: Of the use cases you can picture in your own life or work, which one would save you the most time or mental energy on a normal week?
- Extension: Map three agent use cases from your own life using: Goal, Trigger, Input, What the AI does, Output, Who it helps. They don't need to be built. Just mapped clearly enough that someone else could build them from your notes.

**Wing 4: Building a Simple Automated Workflow**
- Context: You don't need to write code to build your first working agent. Tools like Zapier and Make let you connect apps and add an AI step that reasons about the data passing through, no code required. The result is a small working system: something that runs on a trigger, thinks, and acts, without you in the middle. It won't be sophisticated. That's the point. Every complex automation you'll ever build starts with one trigger, one AI step, one output.
- Reflection: What did it feel like to watch something run without you doing the work? What does that free you up for?
- Extension: Build one workflow in Zapier or Make with at least one AI step in it. The simplest version: a new row in a spreadsheet triggers an AI-written summary sent to your inbox. Then give it five different inputs and watch where it holds up and where it produces something generic, and tighten the prompt inside the workflow based on what you see.

**Wing 5: When One Agent Isn't Enough**
- Context: Some jobs are too complex for a single agent. A multi-agent system splits the work: an orchestrator receives the goal and breaks it into sub-tasks, then hands each one to a specialist, one for research, one for drafting, one for checking facts, one for formatting. Each does its job and hands back to the orchestrator, who assembles the final result. This isn't a research-lab idea, it's how a growing share of real AI workflows already run. Thinking this way, in terms of specialisation and handoffs, is a genuinely transferable skill: it's how you'd design a team, not just a system.
- Reflection: If you had a team of specialist agents working for you, what would each one own, and what would you keep for yourself?
- Extension: Take one complex, recurring output you produce, a report, a client update, a strategy note, and break it into component parts. Assign each part a specialist role. Draw the handoffs between them. Then ask an AI tool to review the design and point out the weakest handoff, the place this system would most likely break.

**Wing 6: When Agents Go Wrong**
- Context: Agents are powerful and they're fallible. They can misread a goal and chase it confidently in the wrong direction. They can loop on a failed step. They can believe they've done something they haven't. They can take irreversible actions: sending a message, deleting a file, posting publicly. This is why human-in-the-loop matters: knowing exactly which decisions an agent can make on its own and which ones it should pause and check with you first. Not everything should run unattended. Knowing the difference is the actual skill, not a footnote to it.
- Reflection: What's the one action you'd never want an agent to take without checking with you first, and why that one specifically?
- Extension: Take your strongest use case from earlier in this module. Ask an AI tool for the five most likely ways it could go wrong, and a guardrail for each. Then write the short version, three rules: always do, never do, always check with me first.

**Wing 7: Reflect: AI Agents**
- Context: You came into this module thinking of AI as something you prompt and wait on. You leave it understanding delegation: agents that hold a goal, use tools, reason in a loop, and sometimes fail in specific, predictable ways you now know how to guard against. The shift underneath all of it is the same one that's been building this whole course. AI doing more doesn't mean you think less. It means your judgment moves to a different place: not what to type, but what to delegate, what to check, and what never to hand off at all.
- Reflection: Before this module I thought agents were ___. Now I know they're ___. The guardrail I'll always build in is ___.
- Extension: Take the use case you're most excited about and write the shortest possible version you could actually try this week, even a rough manual version with no automation at all. A rough draft of a delegation beats a polished plan for one you never run.

### Module 5: Planning to Build

**Description:** Before you write anything, you plan. This module is about choosing a direction, being honest about scope, thinking about who your project affects, and sketching how the pieces fit together, all before you touch a keyboard.

**Wing 1: Choosing Your Direction**
- Context: There are a few broad directions a first build can take. Frontend, where you build what people see and click, websites and interfaces. Backend, the logic and data underneath, APIs and automations. Full-stack, both end to end. Or agent-builder, focused on AI-powered workflows rather than a coded app. None is more legitimate than the others. The only wrong choice is staying vague. Pick the direction that matches the thing you actually want to exist, and commit to it for this module and the next two.
- Reflection: What's the one thing you most want to have built, and who would it actually serve?
- Extension: Write two sentences: what you're building, and who it's for. Not "I'm thinking about," a commitment you'd be comfortable repeating to someone else next week.

**Wing 2: Can I Actually Build This?**
- Context: Before you write a line of anything, answer honestly: not "could a developer build this," but "can I, with the time and tools I actually have, build a working version." Scope is everything. Most unfinished projects didn't die from lack of skill, they died from being too big, too vague, or dependent on things the builder couldn't control. A simple thing that works beats a complex thing that doesn't exist. Sizing your project honestly, before you start, is what lets you finish it.
- Reflection: What did you cut from your original idea to make it buildable, and does the smaller version still excite you?
- Extension: Describe what you want to build to any AI tool and ask for the smallest version you could realistically finish, what you'd need to learn, and what could go wrong. If you can, describe the problem to two or three people who actually have it and ask what they currently do about it. Adjust your smallest version based on what you hear.

**Wing 3: Should I Build This?**
- Context: Can I build this and should I build this are different questions. Should is about value and impact: does this make someone's life better, or worse? Who benefits, who could be affected badly? Does it respect people's privacy? Is it solving a real problem, or just one you find interesting? As building gets faster and cheaper, the judgment about what's worth building matters more, not less. Anyone can ship something now. Whether it's worth having in the world is still a human question, and it's yours to ask before you start, not after.
- Reflection: Did asking this change anything about your project, its scope, its design, or how you'll handle people's data?
- Extension: Describe your project to an AI tool and ask it to play devil's advocate: who could this harm, what data does it need and is collecting it fair, what would make it genuinely valuable rather than just interesting. Sit with the most uncomfortable answer for a minute before moving on.

**Wing 4: Thinking in Architecture**
- Context: Every piece of software has an architecture, the way its parts fit together. Even the simplest project has three layers: a frontend (what the user sees), a backend (the logic), and a place data lives. You don't need to be an engineer to think this way, you just need to be able to draw the boxes and the arrows between them. Builders who skip this step often get halfway through before realising their tools don't fit together or their data has nowhere to live. Fifteen minutes of this thinking saves weeks of rebuilding later.
- Reflection: Which part of your architecture are you least sure about, and what would you ask an expert if one were in the room?
- Extension: Draw your project as three boxes and the arrows between them, even on paper. Then describe it to an AI tool and ask what's missing or what you'd change. As a sharper exercise, pick a tool you use daily and ask AI to describe its likely architecture at a high level. Compare its hard problems to yours.

**Wing 5: Planning With AI**
- Context: AI isn't just useful for building, it's genuinely good at planning. Give it your idea, your timeline, your constraints, and your skill level, and it can break the work into tasks, flag dependencies, and name the risks you haven't thought of yet. It's seen far more projects like yours than you have. Using that before you start, not after you're stuck, is the entire value of it.
- Reflection: What did the plan include that you hadn't thought of, and what did it get wrong about your actual situation?
- Extension: Ask an AI tool to build you a realistic week-by-week plan given your actual constraints: how much time you have, your skill level, what's already true about your life. Push back on anything that feels unrealistic until the plan feels like something you'd actually follow. Put it somewhere you'll return to weekly.

**Wing 6: Getting Comfortable in the Terminal**
- Context: The terminal is just a place where you type instructions directly to your computer, no clicking, no menus. It looks intimidating and turns out to be a handful of commands you'll use constantly: `ls` to see what's in a folder, `cd` to move between folders, `mkdir` to create one, and `npm install` or `pip install` to add tools to a project. That's most of what you need. Every tool in the modules ahead assumes you're willing to open this window and type into it. Getting comfortable now means nothing stops you later.
- Reflection: What made the terminal stop feeling intimidating, once you actually opened it?
- Extension: Open your terminal, create a project folder, create a file inside it, and write a line into that file using only terminal commands. If you get stuck at any point, paste the error into an AI tool and ask it to walk you through it. That loop, error, ask, understand, fix, is the one you'll use constantly from here on.

**Wing 7: Reflect: Planning to Build**
- Context: You picked a direction, sized it honestly, asked whether it was worth building, sketched how the pieces fit, planned it with AI, and made peace with the terminal. You're no longer someone thinking about building. You're someone about to build, which is a genuinely different place to stand than most people ever reach.
- Reflection: My project in one sentence is ___. My biggest known risk is ___, and my plan for it is ___.
- Extension: Find one project built by someone at roughly your level, not a polished flagship product, and study how it's put together. Ask an AI tool what you can learn from its structure given what you're about to build. Change one decision in your own plan based on what you find.

### Module 6: Building Your First Project

**Description:** This is where you actually build. Small, rough, and real. You'll write your first working file, understand what the common tools actually do, connect to an API, debug with AI instead of panic, and give your project somewhere to store data.

**Wing 1: Your First Build**
- Context: In this wing, you write the first real piece of your project. It'll probably be small: a page with your project's name on it, a script that prints something to the terminal, a workflow with its first trigger. What matters isn't the size, it's that it exists now and didn't before. The blank page is the actual obstacle in every first build. Everything after this is iteration, and iteration is just practice.
- Reflection: What was the hardest part of starting, and what finally got you to do it anyway?
- Extension: Open your editor, create your project folder, and write the first file. Run it. See something happen. Then ask an AI tool to suggest the next small piece that would move you toward a working first version, build that one piece, and ask again. You're not planning five steps ahead, you're staying one step ahead of yourself.

**Wing 2: Demystifying React, Node, and Python**
- Context: These words show up everywhere and they're simpler than they sound. Python is a programming language, readable and beginner-friendly, strong for AI, data, and backend logic. Node.js is a way of running JavaScript outside the browser, on a server, heavily used for backends and APIs. React is a library for building interfaces, the thing that makes a website feel interactive rather than static. They're not competitors, they're tools for different layers of a project. You don't need all three, you need to know which one your project actually needs and why.
- Reflection: Which technology in your stack feels the most unfamiliar, and what's your plan for getting comfortable with it?
- Extension: Describe your project to an AI tool and ask which of these you actually need and why. Then take the first file you wrote and ask it to explain every line. Where you don't fully understand something, keep asking until you do, rather than just copying and moving on.

**Wing 3: Frontend vs Backend**
- Context: Frontend is everything a user sees and touches: layout, buttons, the words on the screen. It lives in the browser. Backend is everything that happens before the user sees anything: logic, calculations, checking whether a password is correct. It lives on a server. A login form is frontend. Checking the password is backend. The result travelling back to the screen is the handoff between them. Knowing where something lives tells you where to look when it breaks, and where to build it in the first place.
- Reflection: In your project, what decisions belong to the frontend and what belongs to the backend, and where's the line between them?
- Extension: Build something with both layers, even simply: a form that collects one piece of information your project actually needs, and a description of what should happen to that data once it's submitted. Ask an AI tool to walk you through the backend logic step by step.

**Wing 4: How APIs Actually Talk to Each Other**
- Context: An API is a door one piece of software opens so other software can talk to it. Your weather app called a weather API. A "log in with Google" button calls Google's own API. Calling one means sending a request, "give me the forecast for Dubai," and getting back a response, usually structured data called JSON. Almost everything interesting you'll build talks to at least one API. Once you've called one and seen the response come back, the idea stops being abstract.
- Reflection: Which API would make your project meaningfully more useful if you connected to it, and what data would it actually give you?
- Extension: Call any free public API with no login required and print one piece of its response. Then find the documentation for the API your own project actually needs, look for a free tier, and ask an AI tool to help you make that first real call. Even raw data on screen means your project just touched something outside itself.

**Wing 5: Debugging With AI**
- Context: Your project will break. That's not failure, it's the job. Without AI, debugging meant hours of searching for someone else's version of your error. With it, the loop is: copy the error, paste it in, describe what you were trying to do, ask what went wrong. Most of the time you have an answer in under a minute. The skill was never avoiding errors, it's reading them clearly enough to ask the right question.
- Reflection: What's the difference between an error you could work out yourself and one where you genuinely needed the help?
- Extension: Break something in your project on purpose, delete a bracket, misname a variable, and read the error before you touch anything else. Then ask an AI tool what's wrong and compare its diagnosis to your own guess. Start a running log: what broke, what fixed it, kept in one place. At the end of a week of building, the pattern in that log tells you more about your own growth than any single fix does.

**Wing 6: Where Your Project Remembers Things**
- Context: A database is where your project keeps what it needs to remember. Without one, everything disappears the moment someone closes the app. With one, you can store people, entries, submissions, and pull them back later. The simplest way to picture it: a table is a spreadsheet, rows are records, columns are fields. Most stalled projects didn't get stuck on the frontend or the logic, they got stuck because nobody thought about where the data would live until it was too late to do simply.
- Reflection: What does your project need to remember, and what breaks if that information disappears?
- Extension: Set up a free Supabase project and create one table your project actually needs, by hand, no code. Add a few rows of sample data. Then ask an AI tool to show you how to connect your project to that table in code, write one row, and read it back. Create, write, read: everything else is a variation on that loop.

**Wing 7: Reflect: Building Your First Project**
- Context: Something exists now that didn't before this module. It's probably rough. It's probably broken something and gotten fixed at least once. You've written code, called an API, given your project somewhere to store data, and started to feel the difference between what happens in the browser and what happens on a server. That's a genuine shift, from thinking about building to actually doing it.
- Reflection: What can your project do today that it couldn't when this module started? What's still standing between you and calling it done?
- Extension: Paste your most important file into an AI tool and ask what a more experienced builder would change about it. Make exactly one improvement based on that answer, not a rewrite. Small, real improvements compounding weekly is how projects actually get better.

### Module 7: Shipping

**Description:** A project on your laptop is invisible. This module is about making it real: version control, a public home for your code, a live link anyone can open, and the habit of shipping something rough rather than polishing something forever.

**Wing 1: What Is Git, Really?**
- Context: Git tracks every change you make to your project over time, who changed what and when. Think of it as a time machine: if something breaks, you can go back. If you want to try something risky, you branch off, a parallel version, and either merge it back or throw it away. Every professional project lives in Git for exactly this reason: it's the safety net that lets you build boldly, because you always know you can undo it.
- Reflection: What would you have lost this module without the ability to go back to an earlier version?
- Extension: Install Git if you haven't, then in your terminal run the three commands that start tracking a project: initialise it, stage your files, and commit a snapshot with a short message describing what's in it. From here on, commit every time you finish something that works, not every line, every working chunk.

**Wing 2: GitHub Basics**
- Context: Git lives on your laptop. GitHub is where you push it so it's backed up, shareable, and visible from anywhere. A repository is just a project folder Git is tracking. Once it's on GitHub, other people can see it if it's public, and tools that deploy your project automatically can read straight from it. Your laptop can break. GitHub doesn't. Every project you build from here should live there.
- Reflection: What does it mean to you that your project is now visible outside your own laptop, even rough?
- Extension: Create a free GitHub account, create a repository for your project, and push your code to it. Then write it a proper README: what it does, who it's for, how to run it, what's coming next. That README is the first thing anyone sees, and it's also the start of your public record of what you built.

**Wing 3: Deploying Your First Project**
- Context: Deployment means making your project reachable by anyone, not just you on your laptop. Tools like Vercel and Netlify have made this close to instant for web projects: connect your GitHub repository, they detect what kind of project it is, and you get a live link in under two minutes. A project that only lives on your laptop is a work in progress. A project with a link is a thing that exists in the world.
- Reflection: What did it feel like to open a link and see something you built, live?
- Extension: Create a free account with a deploy tool like Vercel, connect your GitHub repository, and deploy. Open the link. Then send it to someone who has no context, and ask them to use it and tell you one thing that confused them and one thing they liked, without explaining anything first.

**Wing 4: Domains, DNS, and Owning Your Address**
- Context: Right now your project probably lives at an address that isn't really yours, a subdomain of whatever tool deployed it. A domain is an address you own outright. DNS is the system that quietly translates that human-readable address into where your project actually lives on a server. Buying one is inexpensive and connecting it takes a few minutes. After that, your project has a home that belongs to you, not to a platform.
- Reflection: What does having your own domain say about how seriously you're treating what you built?
- Extension: Search for a domain that fits your project on a registrar like Namecheap. You don't have to buy it today, but decide if it's worth it, and if so, buy it and connect it in your deploy tool's settings.

**Wing 5: Keeping Secrets Out of Your Code**
- Context: Your project likely connects to at least one external service, an AI API, a database, an email provider, and each one gives you a key that proves it's you. That key must never sit directly in your code, because your code likely lives on GitHub, and GitHub is public. A leaked key means anyone can use your account under your name. Environment variables are the safe way to store secrets: they live outside your code, in your deploy tool's settings, and your code reads them without ever exposing them.
- Reflection: What secrets does your project currently have, and where exactly are they stored right now?
- Extension: Create a file for your secrets that never gets pushed to GitHub, and add the same values in your deploy tool's environment variable settings instead. Ask an AI tool to show you how to read one in your code. Then ask it for the top security risks specific to a project like yours, and fix at least one.

**Wing 6: Shipping Is a Mindset**
- Context: Done isn't perfect, done is live. Version one is meant to be rough, its job is to exist so version two can be better. Every product you use today started as something a little embarrassing. The pattern is always the same: ship something real, watch how people actually use it, make it better. The loop only starts once you ship, not before, and perfectionism is very often procrastination wearing better clothes.
- Reflection: What would "good enough to share" actually look like for your project, and are you there yet?
- Extension: Make one real improvement to your live project, push it, and watch it redeploy automatically. Then write the announcement post you'd share if you were ready, what you built, why, what you learned, even if you're not ready to post it yet. Having it written means shipping again is one click away.

**Wing 7: Reflect: Shipping**
- Context: Your project has a link now. It has a home on GitHub, somewhere to store data, and secrets that are actually safe. You know what Git does, how deployment works, why a domain matters, and how to push a change and watch it go live in minutes. Wanting to build something and having actually shipped something are two very different places to stand, and you're standing in the second one now.
- Reflection: My project is live. Here's what it does and what's still rough about it: ___
- Extension: Do a short retrospective: what's working, what's genuinely broken, what you'd do differently starting over. Ask an AI tool what to prioritise given what you have left before you consider this build "finished" for now.

---

## Part 4: Course 3, "Build with AI, Responsibly"

**Course description:** You've built something. This course is about what happens once other people are involved, working alongside others when AI is part of the process, being able to explain and stand behind what you shipped, and thinking honestly about its impact. It closes with a self-directed week to take everything you've learned and run it end to end, on your own project, at your own pace.

### Module 8: Building Responsibly

**Description:** Most real projects involve more than one person, and AI adds a layer most teams haven't figured out norms for yet. This module is about collaborating with structure, documenting your work so it outlives you touching it daily, and being honest about what AI actually did versus what you did.

**Wing 1: Working With Others in Code**
- Context: The moment more than one person touches a project, you need structure. A branch is a parallel copy of the project someone can work on without touching the shared version. A pull request is the formal "I've made changes, please look before this goes live." Code review is someone else reading your work before it ships, which catches bugs, spreads knowledge, and keeps quality honest. Even building solo, understanding this means you can contribute to anything, or bring someone else into your own project, and operate like it's a real team from day one.
- Reflection: What would change about how you build if you knew someone would always read your code before it went live?
- Extension: Create a branch, make one small change on it, and open a pull request for it, describing what changed and why, even if you're merging it yourself. If you know someone else building something too, trade one file each and read it as a user would: what's unclear, what feels fragile.

**Wing 2: Making Your Work Legible**
- Context: A builder who can't explain what they built is only half a builder. A README is the front door: what it does, why it exists, how to set it up. A diagram shows how the pieces connect. Neither is a nice-to-have, they're the difference between a project that survives you stepping away from it for a month and one that quietly dies. Explaining your project clearly also does something for you: it surfaces the gaps in your own thinking, and it's what makes the project shareable, on LinkedIn, in a job conversation, anywhere it needs to speak for itself.
- Reflection: If someone found your project with zero context, what would they understand, and what would confuse them?
- Extension: Write or update your README: what it does in one sentence, who it's for, how to set it up, what technologies it uses, what's next. Add a simple architecture diagram, even a photo of a paper sketch, showing frontend, backend, database, and anything external it talks to.

**Wing 3: AI as Part of How You Work**
- Context: When AI is part of how you build, collaboration gets a little more complicated. A teammate might not know which parts AI wrote. A manager might not know how AI-assisted the output was. None of this is inherently wrong, but it asks for intentionality. The emerging norm on the strongest teams is transparency: say where AI helped, take responsibility for all of it regardless, and use it to raise the floor rather than hide the ceiling. Trust in collaborative work is built on honesty, and being clear about how you work is a mark of confidence, not a confession.
- Reflection: What would you want to know if someone on your team was using AI to contribute to shared work?
- Extension: Write one paragraph as your own personal policy: when you'll disclose AI's role, how you'll make sure you actually understand what it built for you, what you'll always do yourself. Then apply it to one real piece of collaborative work you're doing right now, not hypothetically.

**Wing 4: Owning What AI Wrote**
- Context: AI can write code faster than you can read it, and that speed is the trap. Copy it without understanding it, and you own the output but not the knowledge. If it breaks, you don't know why. If it has a flaw, you shipped it anyway. The rule is simple: never ship what you can't explain. That doesn't mean writing every line yourself, it means reading every line, asking what you don't understand until you do, and taking responsibility for what goes live under your name.
- Reflection: What would you do differently in this project if you knew you'd have to explain every line of it under pressure?
- Extension: Pick one piece of AI-written code in your project and read it line by line, asking an AI tool to explain anything you don't fully follow until you can explain the whole thing yourself. As a bigger version, go file by file and mark each: fully understood, mostly, or not really, and work through the "not really" ones until none are left.

**Wing 5: Ethics in the Wild**
- Context: Ethics in building isn't abstract, it shows up in specific, ordinary decisions. Does your project collect data it doesn't actually need? Does it work for someone using a screen reader or a slow connection? Does it quietly assume things about who the user is? These are design questions with real answers, and the strongest builders ask them early, before something goes wrong, not after. As AI makes building faster for more people, the responsibility to build thoughtfully falls to more of us too, not fewer.
- Reflection: What's the most ethically significant decision in your project, and would you make it the same way again?
- Extension: Ask an AI tool to audit your project description for three things specifically: data privacy, accessibility, and any assumptions it makes about users. Take the most important finding and fix it, or write down honestly why you're choosing not to yet.

**Wing 6: The Builder's Responsibility**
- Context: You can now create things that didn't exist before, things other people will use and rely on. That's real power, and power without reflection tends to be careless. The actual responsibility is thinking about impact before you ship, not after: who will use this, who could misuse it, what happens if it breaks, and what happens if it works exactly as designed, is that still good. Not to slow you down, but because what gets built in this era with AI is also what gets remembered, and you get to decide, every time you ship, whether it's worth building.
- Reflection: What kind of builder do you want to be, and what does that mean for what you build next?
- Extension: Write your own short builder's manifesto, three to five sentences: what you stand for, what you'll never build, what you'll always check before shipping. Share it with one person outside any tech context and ask what it makes them trust, and what it makes them question.

**Wing 7: Reflect: Building Responsibly**
- Context: You learned to work with others through branches and pull requests, to document your work so it can outlive your daily attention, to be honest about AI's role, to own what you ship, and to think ethically about what you build. None of these are soft skills. They're what determines whether what you build lasts, and whether it's worth lasting.
- Reflection: My builder's manifesto: ___. The hardest thing I had to sit with this module was ___, and here's where I landed.
- Extension: Imagine handing your project to a new collaborator tomorrow with no other explanation. Write the ten-line handoff note you'd give them: what they'd need to know, what's still undocumented, what decisions need explaining. Making your own work legible to someone else is often what makes it clearer to you too.

### Module 9: The Capstone

**Description:** Everything so far has been building toward this. No new concepts, just a self-directed cycle: plan something, build it, test it honestly, fix what breaks, ship it, tell people about it, teach someone what you learned, and look back at how far you've actually come. Move through these wings at whatever pace fits your week, they're meant to be worked through in order, close together.

**Wing 1: Plan Your Capstone**
- Context: This is yours. No template, no guided steps, just a clear target and enough runway to reach it. It can be your project from the last two courses taken further, or something new entirely. It needs to be small enough to actually finish and meaningful enough that finishing it means something. Write your brief in four parts: what you're building in one sentence, who it's for in one sentence, three bullet points describing what "done" looks like, and your biggest risk with a one-line plan for it.
- Reflection: Does this brief actually excite you, or does it feel safe? If it feels safe, make it slightly harder.
- Extension: Write the brief, then post it somewhere you'll actually see it again, a note, a doc, your journal here. A commitment you've written down and can find later carries more weight than one that only existed in your head for a minute.

**Wing 2: Build It**
- Context: Today is building, not planning, not researching, not optimising. Set a timer for an hour and build without stopping to look things up beyond what's strictly necessary to keep moving. The goal isn't polish, it's something working, however rough, by the end of the hour. A working rough version beats a perfect unfinished one, always, and you already know how to do this. You've been building for weeks.
- Reflection: What surprised you about building today, either harder or easier than you expected?
- Extension: After your first focused hour, spend a second one on the single part of this project you've been avoiding, the feature you're not sure will work, the integration that scares you a little. Give it your full attention with AI as your pair. Whatever you were avoiding is almost always smaller than it felt from a distance.

**Wing 3: Break It**
- Context: Today you test your project by deliberately trying to break it. Go through it as someone who has no idea how it's meant to work: click things out of order, submit empty forms, use it on your phone, on a slow connection. For everything that breaks, note what happened, what you expected instead, and whether it's critical or something you can live with for now. Then prioritise. You can't fix everything today, just the handful of things that would actually stop a real person from getting value out of it.
- Reflection: What did testing surface that you'd missed, and what does that tell you about what you assumed while building?
- Extension: If you can, ask one person who's never seen your project to use it for five minutes while you watch silently, no explaining, no helping. Note where they hesitate and what confuses them. Five minutes of someone else's honest confusion tells you more than a week of testing it yourself.

**Wing 4: Fix It**
- Context: Yesterday you found the cracks. Today you close the ones that matter and, with whatever's left, add the one improvement that would make the biggest real difference to someone using this, not the flashiest feature, the one that actually helps. Use AI aggressively here, for debugging, for suggestions, for design calls. The goal is closing the gap between what you said you'd build and what actually exists.
- Reflection: Are you proud of what you're about to ship? If not, what's the one thing still standing in the way?
- Extension: Once your priority fixes are done, spend a focused hour writing a short QA checklist for your project, ten things a user might do and whether each one works as expected. Keep it. Run it before every future update, and you've built a quality habit, not just a one-time fix.

**Wing 5: Ship It**
- Context: Today it goes live, whatever state it's in. Push your latest code, let it redeploy, and check the live link actually works and does the core thing it promises. Then do three things: share the link somewhere you're comfortable, no caveats or apologies attached to it. Send it to one person outside this course and ask what they think. And take a screenshot of this moment, you'll want it later.
- Reflection: Does what you built actually match what you said "done" would look like when you started? If not, what does that tell you about scope and planning next time?
- Extension: Write your version-two backlog: everything you didn't get to, prioritised by what would make the biggest difference to a real user against what would take the least time to add. Shipping and immediately planning the next version, rather than stopping, is how solo projects actually keep growing.

**Wing 6: Tell Your Story**
- Context: Writing about what you built is part of the work, not an optional extra bolted on at the end. A good post has a specific hook, not "excited to share," something that actually makes someone stop scrolling. Then the story: what you built, who it's for, what problem it solves. Then the learning: the hardest part, what surprised you. Then the link, with no apology attached to it. Sixty-six days of quiet building becomes visible the moment you post it, and that visibility is evidence, for you and for anyone watching, of what's actually possible.
- Reflection: What felt vulnerable about posting this publicly, and did you post it anyway?
- Extension: Draft the post, using AI to help structure it, then rewrite it fully in your own voice before it goes anywhere. As a second piece, write a shorter one specifically about the moments AI actually helped, the prompt that unlocked something, the debugging session that saved you an hour. Concrete and specific is worth more than any tutorial.

**Wing 7: Teach What You Learned**
- Context: You know something now you didn't when you started. Teaching it to someone who doesn't yet is the final test of whether you actually understand it. Find one person who feels the way you felt at the very beginning, overwhelmed, unsure where to start, and spend twenty minutes teaching them one thing. It doesn't need to be sophisticated. It needs to be the thing that would have helped you most if someone had told you earlier.
- Reflection: When you tried to explain what you'd learned, did you understand it better than you thought, or did you find gaps you didn't know were there?
- Extension: Write a short list, five things you wish you'd known before you started building with AI, based entirely on your own experience, not generic advice. Share it publicly if you're comfortable. It's your first piece of original thinking as a builder, and it didn't exist before you did this work.

**Wing 8: Reflect on the Full Journey**
- Context: Go back and read your very first reflection, the one about your relationship with AI, right at the start of this course. Read it slowly. You built a mental model of how AI actually works. You learned to direct it with precision. You connected it to your world. You designed for delegation and guarded against its failure modes. You planned, built, shipped, and stood behind what you made. That's not a small amount of ground covered, and it happened one wing at a time.
- Reflection: Before this course I thought ___. Now I know ___. Before I couldn't ___. Now I can ___.
- Extension: Write your next direction, not a detailed plan, just where you want to be next: what to build a version two of, what skill to go deeper on, who to teach next. Ask an AI tool, given everything you've built and learned, what it would suggest, then decide for yourself what you actually want to do with the answer. This course ends here. Building doesn't.

---

## Part 5: Tone and format rules (keep these consistent for every future wing)

1. **No dates, no days, no weeks.** Everything is self-paced. Never write "today" as a calendar reference, only as "in this wing."
2. **No cohort mechanics.** No WhatsApp groups, no "220 women," no live review slots, no public noon deadlines. FemPower Learn is solo-paced; where She Vibes assumed a live group, convert the action into something a solo learner does alone, or drop it.
3. **No em dashes.** Use commas or periods instead, per standing preference.
4. **Four fields per wing, always:** `title`, `context_content` (idea + why it matters, folded into one flowing passage, no separate "why it matters" header), `reflection_prompt`, `extension_content` (a single merged action, no separate "stretch" or "further reading" tier).
5. **Second person, warm, direct, no hype.** Say what's true plainly. Avoid "unlock," "supercharge," "game-changer."
6. **The recurring insight to protect:** AI is a mirror of your own clarity. Generic prompt, generic output. Specific prompt, real thinking partner. This should surface naturally across modules, not just in Course 1.
7. **UAE and FemPower texture where it's natural, not forced.** A career-coach example can specialise in "women in the UAE." Not every wing needs a local reference, but don't default to Silicon Valley or US-centric examples either.
8. Each module closes with a "Reflect" wing that looks back at the whole module, matching the existing pattern in Course 1.
