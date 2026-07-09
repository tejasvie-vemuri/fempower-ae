-- Seed: Build with AI -- Course 2 for FemPower Learn
-- Run this AFTER the learn tables migration and AFTER seed_learn_course1.sql
-- Inserted with status = 'draft'. Flip to 'published' in /admin/learn (or via SQL) when ready to go live.

-- 1. Insert the course
INSERT INTO public.learn_courses (id, title, description, emoji, display_order, status)
VALUES (
  'c2000000-0000-0000-0000-000000000001',
  'Build with AI',
  'You understand AI now. You can talk to it, and you can bring your world into it. This course is where you use it to build something real, a working project, from a blank page to a live link. No computer science degree required. Just the same habit of clear thinking you''ve been building all along, now pointed at something you can point to.',
  '🛠',
  2,
  'draft'
);

-- 2. Insert modules
INSERT INTO public.learn_modules (id, course_id, title, description, display_order) VALUES
(
  'a2000000-0000-0000-0000-000000000001',
  'c2000000-0000-0000-0000-000000000001',
  'AI Agents',
  'A chatbot waits for you to ask. An agent acts on a goal, using tools, without you guiding every step. This module is where you learn what agents actually are, how they reason, where they''re useful in your own life, and where they can go wrong.',
  1
),
(
  'a2000000-0000-0000-0000-000000000002',
  'c2000000-0000-0000-0000-000000000001',
  'Planning to Build',
  'Before you write anything, you plan. This module is about choosing a direction, being honest about scope, thinking about who your project affects, and sketching how the pieces fit together, all before you touch a keyboard.',
  2
),
(
  'a2000000-0000-0000-0000-000000000003',
  'c2000000-0000-0000-0000-000000000001',
  'Building Your First Project',
  'This is where you actually build. Small, rough, and real. You''ll write your first working file, understand what the common tools actually do, connect to an API, debug with AI instead of panic, and give your project somewhere to store data.',
  3
),
(
  'a2000000-0000-0000-0000-000000000004',
  'c2000000-0000-0000-0000-000000000001',
  'Shipping',
  'A project on your laptop is invisible. This module is about making it real: version control, a public home for your code, a live link anyone can open, and the habit of shipping something rough rather than polishing something forever.',
  4
);

-- 3. Insert wings

-- ===============================================================
-- MODULE 4: AI AGENTS (7 wings)
-- ===============================================================

-- Wing 1: What Is an AI Agent?
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000001',
  'What Is an AI Agent?',
  'A chatbot answers and stops. An agent has a goal, a set of tools, and the ability to decide what to do next without you steering every step. Tell it "research the top competitors in my market and send me a summary by 9am," and it searches, reads, synthesises, writes, and sends, while you were doing something else entirely. This is the shift from AI as a tool you operate to AI as a colleague you delegate to. The people who get the most from AI in the next few years won''t be the best prompters. They''ll be the best delegators, the ones who know what goal to give an agent, what tools to hand it, and when to trust it versus when to check its work.',
  'What''s the one task you''d most want to hand off to an agent, and what would you do with the time you got back?',
  'Ask any AI tool to explain what an agent is versus a chatbot, then ask for three concrete examples relevant to your own work, not generic ones. Pick the one task from your reflection and write it out as if you were briefing a new hire: what''s the goal, what does it need to know, what should it never do without checking with you first.',
  1, 5
);

-- Wing 2: How Agents Actually Work
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000002',
  'a2000000-0000-0000-0000-000000000001',
  'How Agents Actually Work',
  'Underneath, every agent runs a loop: receive a goal, make a plan, pick a tool, take an action, look at the result, decide what''s next. Repeat until the goal is done or it gets stuck. This is called ReAct, short for Reason, Act, Observe. The tools it has access to set the ceiling on what it can do. Give it your calendar and it can schedule. Give it your email and it can draft and send. Give it the web and it can research. Understanding this loop means understanding the limits too. Agents aren''t magic, they''re structured reasoning plus tool access, and they get confused exactly where you''d expect: vague goals, failed tools, context that''s run out.',
  'Where in that reasoning loop would you want to stay in control, and where would you happily let it run on its own?',
  'Pick a real task you did recently, a decision, a piece of research, a plan. Map what you actually did onto Reason-Act-Observe. Then ask an AI tool to do the same task through the same loop and compare the two paths. Where your reasoning diverged from the AI''s is exactly where your judgment lives.',
  2, 5
);

-- Wing 3: Designing Your First Agent Use Case
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000003',
  'a2000000-0000-0000-0000-000000000001',
  'Designing Your First Agent Use Case',
  'Agents take different shapes depending on the job. A research agent takes a question, searches, reads, and returns a structured answer. A scheduling agent looks at your calendar and drafts the invite. A support agent reads incoming messages, classifies them, and drafts a response. None of these are hypothetical, all of them exist now. The useful question is never "does an agent exist for this." It''s "what''s the goal, what are the inputs, what''s the output, and what decisions happen in between." Frame any problem that way and you can design an agent for it, even one you never build.',
  'Of the use cases you can picture in your own life or work, which one would save you the most time or mental energy on a normal week?',
  'Map three agent use cases from your own life using: Goal, Trigger, Input, What the AI does, Output, Who it helps. They don''t need to be built. Just mapped clearly enough that someone else could build them from your notes.',
  3, 5
);

-- Wing 4: Building a Simple Automated Workflow
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000004',
  'a2000000-0000-0000-0000-000000000001',
  'Building a Simple Automated Workflow',
  'You don''t need to write code to build your first working agent. Tools like Zapier and Make let you connect apps and add an AI step that reasons about the data passing through, no code required. The result is a small working system: something that runs on a trigger, thinks, and acts, without you in the middle. It won''t be sophisticated. That''s the point. Every complex automation you''ll ever build starts with one trigger, one AI step, one output.',
  'What did it feel like to watch something run without you doing the work? What does that free you up for?',
  'Build one workflow in Zapier or Make with at least one AI step in it. The simplest version: a new row in a spreadsheet triggers an AI-written summary sent to your inbox. Then give it five different inputs and watch where it holds up and where it produces something generic, and tighten the prompt inside the workflow based on what you see.',
  4, 7
);

-- Wing 5: When One Agent Isn't Enough
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000005',
  'a2000000-0000-0000-0000-000000000001',
  'When One Agent Isn''t Enough',
  'Some jobs are too complex for a single agent. A multi-agent system splits the work: an orchestrator receives the goal and breaks it into sub-tasks, then hands each one to a specialist, one for research, one for drafting, one for checking facts, one for formatting. Each does its job and hands back to the orchestrator, who assembles the final result. This isn''t a research-lab idea, it''s how a growing share of real AI workflows already run. Thinking this way, in terms of specialisation and handoffs, is a genuinely transferable skill: it''s how you''d design a team, not just a system.',
  'If you had a team of specialist agents working for you, what would each one own, and what would you keep for yourself?',
  'Take one complex, recurring output you produce, a report, a client update, a strategy note, and break it into component parts. Assign each part a specialist role. Draw the handoffs between them. Then ask an AI tool to review the design and point out the weakest handoff, the place this system would most likely break.',
  5, 5
);

-- Wing 6: When Agents Go Wrong
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000006',
  'a2000000-0000-0000-0000-000000000001',
  'When Agents Go Wrong',
  'Agents are powerful and they''re fallible. They can misread a goal and chase it confidently in the wrong direction. They can loop on a failed step. They can believe they''ve done something they haven''t. They can take irreversible actions: sending a message, deleting a file, posting publicly. This is why human-in-the-loop matters: knowing exactly which decisions an agent can make on its own and which ones it should pause and check with you first. Not everything should run unattended. Knowing the difference is the actual skill, not a footnote to it.',
  'What''s the one action you''d never want an agent to take without checking with you first, and why that one specifically?',
  'Take your strongest use case from earlier in this module. Ask an AI tool for the five most likely ways it could go wrong, and a guardrail for each. Then write the short version, three rules: always do, never do, always check with me first.',
  6, 5
);

-- Wing 7: Reflect: AI Agents
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000007',
  'a2000000-0000-0000-0000-000000000001',
  'Reflect: AI Agents',
  'You came into this module thinking of AI as something you prompt and wait on. You leave it understanding delegation: agents that hold a goal, use tools, reason in a loop, and sometimes fail in specific, predictable ways you now know how to guard against. The shift underneath all of it is the same one that''s been building this whole course. AI doing more doesn''t mean you think less. It means your judgment moves to a different place: not what to type, but what to delegate, what to check, and what never to hand off at all.',
  'Before this module I thought agents were ___. Now I know they''re ___. The guardrail I''ll always build in is ___.',
  'Take the use case you''re most excited about and write the shortest possible version you could actually try soon, even a rough manual version with no automation at all. A rough draft of a delegation beats a polished plan for one you never run.',
  7, 3
);

-- ===============================================================
-- MODULE 5: PLANNING TO BUILD (7 wings)
-- ===============================================================

-- Wing 1: Choosing Your Direction
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000008',
  'a2000000-0000-0000-0000-000000000002',
  'Choosing Your Direction',
  'There are a few broad directions a first build can take. Frontend, where you build what people see and click, websites and interfaces. Backend, the logic and data underneath, APIs and automations. Full-stack, both end to end. Or agent-builder, focused on AI-powered workflows rather than a coded app. None is more legitimate than the others. The only wrong choice is staying vague. Pick the direction that matches the thing you actually want to exist, and commit to it for this module and the next two.',
  'What''s the one thing you most want to have built, and who would it actually serve?',
  'Write two sentences: what you''re building, and who it''s for. Not "I''m thinking about," a commitment you''d be comfortable repeating to someone else next week.',
  1, 4
);

-- Wing 2: Can I Actually Build This?
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000009',
  'a2000000-0000-0000-0000-000000000002',
  'Can I Actually Build This?',
  'Before you write a line of anything, answer honestly: not "could a developer build this," but "can I, with the time and tools I actually have, build a working version." Scope is everything. Most unfinished projects didn''t die from lack of skill, they died from being too big, too vague, or dependent on things the builder couldn''t control. A simple thing that works beats a complex thing that doesn''t exist. Sizing your project honestly, before you start, is what lets you finish it.',
  'What did you cut from your original idea to make it buildable, and does the smaller version still excite you?',
  'Describe what you want to build to any AI tool and ask for the smallest version you could realistically finish, what you''d need to learn, and what could go wrong. If you can, describe the problem to two or three people who actually have it and ask what they currently do about it. Adjust your smallest version based on what you hear.',
  2, 5
);

-- Wing 3: Should I Build This?
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000010',
  'a2000000-0000-0000-0000-000000000002',
  'Should I Build This?',
  'Can I build this and should I build this are different questions. Should is about value and impact: does this make someone''s life better, or worse? Who benefits, who could be affected badly? Does it respect people''s privacy? Is it solving a real problem, or just one you find interesting? As building gets faster and cheaper, the judgment about what''s worth building matters more, not less. Anyone can ship something now. Whether it''s worth having in the world is still a human question, and it''s yours to ask before you start, not after.',
  'Did asking this change anything about your project, its scope, its design, or how you''ll handle people''s data?',
  'Describe your project to an AI tool and ask it to play devil''s advocate: who could this harm, what data does it need and is collecting it fair, what would make it genuinely valuable rather than just interesting. Sit with the most uncomfortable answer for a minute before moving on.',
  3, 5
);

-- Wing 4: Thinking in Architecture
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000011',
  'a2000000-0000-0000-0000-000000000002',
  'Thinking in Architecture',
  'Every piece of software has an architecture, the way its parts fit together. Even the simplest project has three layers: a frontend (what the user sees), a backend (the logic), and a place data lives. You don''t need to be an engineer to think this way, you just need to be able to draw the boxes and the arrows between them. Builders who skip this step often get halfway through before realising their tools don''t fit together or their data has nowhere to live. Fifteen minutes of this thinking saves weeks of rebuilding later.',
  'Which part of your architecture are you least sure about, and what would you ask an expert if one were in the room?',
  'Draw your project as three boxes and the arrows between them, even on paper. Then describe it to an AI tool and ask what''s missing or what you''d change. As a sharper exercise, pick a tool you use daily and ask AI to describe its likely architecture at a high level. Compare its hard problems to yours.',
  4, 5
);

-- Wing 5: Planning With AI
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000012',
  'a2000000-0000-0000-0000-000000000002',
  'Planning With AI',
  'AI isn''t just useful for building, it''s genuinely good at planning. Give it your idea, your timeline, your constraints, and your skill level, and it can break the work into tasks, flag dependencies, and name the risks you haven''t thought of yet. It''s seen far more projects like yours than you have. Using that before you start, not after you''re stuck, is the entire value of it.',
  'What did the plan include that you hadn''t thought of, and what did it get wrong about your actual situation?',
  'Ask an AI tool to build you a realistic plan given your actual constraints: how much time you have, your skill level, what''s already true about your life. Push back on anything that feels unrealistic until the plan feels like something you''d actually follow. Put it somewhere you''ll return to regularly.',
  5, 5
);

-- Wing 6: Getting Comfortable in the Terminal
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000013',
  'a2000000-0000-0000-0000-000000000002',
  'Getting Comfortable in the Terminal',
  'The terminal is just a place where you type instructions directly to your computer, no clicking, no menus. It looks intimidating and turns out to be a handful of commands you''ll use constantly: ls to see what''s in a folder, cd to move between folders, mkdir to create one, and npm install or pip install to add tools to a project. That''s most of what you need. Every tool in the modules ahead assumes you''re willing to open this window and type into it. Getting comfortable now means nothing stops you later.',
  'What made the terminal stop feeling intimidating, once you actually opened it?',
  'Open your terminal, create a project folder, create a file inside it, and write a line into that file using only terminal commands. If you get stuck at any point, paste the error into an AI tool and ask it to walk you through it. That loop, error, ask, understand, fix, is the one you''ll use constantly from here on.',
  6, 6
);

-- Wing 7: Reflect: Planning to Build
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000014',
  'a2000000-0000-0000-0000-000000000002',
  'Reflect: Planning to Build',
  'You picked a direction, sized it honestly, asked whether it was worth building, sketched how the pieces fit, planned it with AI, and made peace with the terminal. You''re no longer someone thinking about building. You''re someone about to build, which is a genuinely different place to stand than most people ever reach.',
  'My project in one sentence is ___. My biggest known risk is ___, and my plan for it is ___.',
  'Find one project built by someone at roughly your level, not a polished flagship product, and study how it''s put together. Ask an AI tool what you can learn from its structure given what you''re about to build. Change one decision in your own plan based on what you find.',
  7, 3
);

-- ===============================================================
-- MODULE 6: BUILDING YOUR FIRST PROJECT (7 wings)
-- ===============================================================

-- Wing 1: Your First Build
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000015',
  'a2000000-0000-0000-0000-000000000003',
  'Your First Build',
  'In this wing, you write the first real piece of your project. It''ll probably be small: a page with your project''s name on it, a script that prints something to the terminal, a workflow with its first trigger. What matters isn''t the size, it''s that it exists now and didn''t before. The blank page is the actual obstacle in every first build. Everything after this is iteration, and iteration is just practice.',
  'What was the hardest part of starting, and what finally got you to do it anyway?',
  'Open your editor, create your project folder, and write the first file. Run it. See something happen. Then ask an AI tool to suggest the next small piece that would move you toward a working first version, build that one piece, and ask again. You''re not planning five steps ahead, you''re staying one step ahead of yourself.',
  1, 6
);

-- Wing 2: Demystifying React, Node, and Python
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000016',
  'a2000000-0000-0000-0000-000000000003',
  'Demystifying React, Node, and Python',
  'These words show up everywhere and they''re simpler than they sound. Python is a programming language, readable and beginner-friendly, strong for AI, data, and backend logic. Node.js is a way of running JavaScript outside the browser, on a server, heavily used for backends and APIs. React is a library for building interfaces, the thing that makes a website feel interactive rather than static. They''re not competitors, they''re tools for different layers of a project. You don''t need all three, you need to know which one your project actually needs and why.',
  'Which technology in your stack feels the most unfamiliar, and what''s your plan for getting comfortable with it?',
  'Describe your project to an AI tool and ask which of these you actually need and why. Then take the first file you wrote and ask it to explain every line. Where you don''t fully understand something, keep asking until you do, rather than just copying and moving on.',
  2, 5
);

-- Wing 3: Frontend vs Backend
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000017',
  'a2000000-0000-0000-0000-000000000003',
  'Frontend vs Backend',
  'Frontend is everything a user sees and touches: layout, buttons, the words on the screen. It lives in the browser. Backend is everything that happens before the user sees anything: logic, calculations, checking whether a password is correct. It lives on a server. A login form is frontend. Checking the password is backend. The result travelling back to the screen is the handoff between them. Knowing where something lives tells you where to look when it breaks, and where to build it in the first place.',
  'In your project, what decisions belong to the frontend and what belongs to the backend, and where''s the line between them?',
  'Build something with both layers, even simply: a form that collects one piece of information your project actually needs, and a description of what should happen to that data once it''s submitted. Ask an AI tool to walk you through the backend logic step by step.',
  3, 5
);

-- Wing 4: How APIs Actually Talk to Each Other
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000018',
  'a2000000-0000-0000-0000-000000000003',
  'How APIs Actually Talk to Each Other',
  'An API is a door one piece of software opens so other software can talk to it. Your weather app called a weather API. A "log in with Google" button calls Google''s own API. Calling one means sending a request, "give me the forecast for Dubai," and getting back a response, usually structured data called JSON. Almost everything interesting you''ll build talks to at least one API. Once you''ve called one and seen the response come back, the idea stops being abstract.',
  'Which API would make your project meaningfully more useful if you connected to it, and what data would it actually give you?',
  'Call any free public API with no login required and print one piece of its response. Then find the documentation for the API your own project actually needs, look for a free tier, and ask an AI tool to help you make that first real call. Even raw data on screen means your project just touched something outside itself.',
  4, 6
);

-- Wing 5: Debugging With AI
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000019',
  'a2000000-0000-0000-0000-000000000003',
  'Debugging With AI',
  'Your project will break. That''s not failure, it''s the job. Without AI, debugging meant hours of searching for someone else''s version of your error. With it, the loop is: copy the error, paste it in, describe what you were trying to do, ask what went wrong. Most of the time you have an answer in under a minute. The skill was never avoiding errors, it''s reading them clearly enough to ask the right question.',
  'What''s the difference between an error you could work out yourself and one where you genuinely needed the help?',
  'Break something in your project on purpose, delete a bracket, misname a variable, and read the error before you touch anything else. Then ask an AI tool what''s wrong and compare its diagnosis to your own guess. Start a running log: what broke, what fixed it, kept in one place. The pattern in that log over time tells you more about your own growth than any single fix does.',
  5, 5
);

-- Wing 6: Where Your Project Remembers Things
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000020',
  'a2000000-0000-0000-0000-000000000003',
  'Where Your Project Remembers Things',
  'A database is where your project keeps what it needs to remember. Without one, everything disappears the moment someone closes the app. With one, you can store people, entries, submissions, and pull them back later. The simplest way to picture it: a table is a spreadsheet, rows are records, columns are fields. Most stalled projects didn''t get stuck on the frontend or the logic, they got stuck because nobody thought about where the data would live until it was too late to do simply.',
  'What does your project need to remember, and what breaks if that information disappears?',
  'Set up a free Supabase project and create one table your project actually needs, by hand, no code. Add a few rows of sample data. Then ask an AI tool to show you how to connect your project to that table in code, write one row, and read it back. Create, write, read: everything else is a variation on that loop.',
  6, 6
);

-- Wing 7: Reflect: Building Your First Project
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000021',
  'a2000000-0000-0000-0000-000000000003',
  'Reflect: Building Your First Project',
  'Something exists now that didn''t before this module. It''s probably rough. It''s probably broken something and gotten fixed at least once. You''ve written code, called an API, given your project somewhere to store data, and started to feel the difference between what happens in the browser and what happens on a server. That''s a genuine shift, from thinking about building to actually doing it.',
  'What can your project do now that it couldn''t when this module started? What''s still standing between you and calling it done?',
  'Paste your most important file into an AI tool and ask what a more experienced builder would change about it. Make exactly one improvement based on that answer, not a rewrite. Small, real improvements compounding over time is how projects actually get better.',
  7, 3
);

-- ===============================================================
-- MODULE 7: SHIPPING (7 wings)
-- ===============================================================

-- Wing 1: What Is Git, Really?
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000022',
  'a2000000-0000-0000-0000-000000000004',
  'What Is Git, Really?',
  'Git tracks every change you make to your project over time, who changed what and when. Think of it as a time machine: if something breaks, you can go back. If you want to try something risky, you branch off, a parallel version, and either merge it back or throw it away. Every professional project lives in Git for exactly this reason: it''s the safety net that lets you build boldly, because you always know you can undo it.',
  'What would you have lost in this module without the ability to go back to an earlier version?',
  'Install Git if you haven''t, then in your terminal run the three commands that start tracking a project: initialise it, stage your files, and commit a snapshot with a short message describing what''s in it. From here on, commit every time you finish something that works, not every line, every working chunk.',
  1, 5
);

-- Wing 2: GitHub Basics
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000023',
  'a2000000-0000-0000-0000-000000000004',
  'GitHub Basics',
  'Git lives on your laptop. GitHub is where you push it so it''s backed up, shareable, and visible from anywhere. A repository is just a project folder Git is tracking. Once it''s on GitHub, other people can see it if it''s public, and tools that deploy your project automatically can read straight from it. Your laptop can break. GitHub doesn''t. Every project you build from here should live there.',
  'What does it mean to you that your project is now visible outside your own laptop, even rough?',
  'Create a free GitHub account, create a repository for your project, and push your code to it. Then write it a proper README: what it does, who it''s for, how to run it, what''s coming next. That README is the first thing anyone sees, and it''s also the start of your public record of what you built.',
  2, 5
);

-- Wing 3: Deploying Your First Project
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000024',
  'a2000000-0000-0000-0000-000000000004',
  'Deploying Your First Project',
  'Deployment means making your project reachable by anyone, not just you on your laptop. Tools like Vercel and Netlify have made this close to instant for web projects: connect your GitHub repository, they detect what kind of project it is, and you get a live link in under two minutes. A project that only lives on your laptop is a work in progress. A project with a link is a thing that exists in the world.',
  'What did it feel like to open a link and see something you built, live?',
  'Create a free account with a deploy tool like Vercel, connect your GitHub repository, and deploy. Open the link. Then send it to someone who has no context, and ask them to use it and tell you one thing that confused them and one thing they liked, without explaining anything first.',
  3, 6
);

-- Wing 4: Domains, DNS, and Owning Your Address
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000025',
  'a2000000-0000-0000-0000-000000000004',
  'Domains, DNS, and Owning Your Address',
  'Right now your project probably lives at an address that isn''t really yours, a subdomain of whatever tool deployed it. A domain is an address you own outright. DNS is the system that quietly translates that human-readable address into where your project actually lives on a server. Buying one is inexpensive and connecting it takes a few minutes. After that, your project has a home that belongs to you, not to a platform.',
  'What does having your own domain say about how seriously you''re treating what you built?',
  'Search for a domain that fits your project on a registrar like Namecheap. You don''t have to buy it right away, but decide if it''s worth it, and if so, buy it and connect it in your deploy tool''s settings.',
  4, 4
);

-- Wing 5: Keeping Secrets Out of Your Code
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000026',
  'a2000000-0000-0000-0000-000000000004',
  'Keeping Secrets Out of Your Code',
  'Your project likely connects to at least one external service, an AI API, a database, an email provider, and each one gives you a key that proves it''s you. That key must never sit directly in your code, because your code likely lives on GitHub, and GitHub is public. A leaked key means anyone can use your account under your name. Environment variables are the safe way to store secrets: they live outside your code, in your deploy tool''s settings, and your code reads them without ever exposing them.',
  'What secrets does your project currently have, and where exactly are they stored right now?',
  'Create a file for your secrets that never gets pushed to GitHub, and add the same values in your deploy tool''s environment variable settings instead. Ask an AI tool to show you how to read one in your code. Then ask it for the top security risks specific to a project like yours, and fix at least one.',
  5, 5
);

-- Wing 6: Shipping Is a Mindset
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000027',
  'a2000000-0000-0000-0000-000000000004',
  'Shipping Is a Mindset',
  'Done isn''t perfect, done is live. Version one is meant to be rough, its job is to exist so version two can be better. Every product you use now started as something a little embarrassing. The pattern is always the same: ship something real, watch how people actually use it, make it better. The loop only starts once you ship, not before, and perfectionism is very often procrastination wearing better clothes.',
  'What would "good enough to share" actually look like for your project, and are you there yet?',
  'Make one real improvement to your live project, push it, and watch it redeploy automatically. Then write the announcement post you''d share if you were ready, what you built, why, what you learned, even if you''re not ready to post it yet. Having it written means shipping again is one click away.',
  6, 5
);

-- Wing 7: Reflect: Shipping
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'b2000000-0000-0000-0000-000000000028',
  'a2000000-0000-0000-0000-000000000004',
  'Reflect: Shipping',
  'Your project has a link now. It has a home on GitHub, somewhere to store data, and secrets that are actually safe. You know what Git does, how deployment works, why a domain matters, and how to push a change and watch it go live in minutes. Wanting to build something and having actually shipped something are two very different places to stand, and you''re standing in the second one now.',
  'My project is live. Here''s what it does and what''s still rough about it: ___',
  'Do a short retrospective: what''s working, what''s genuinely broken, what you''d do differently starting over. Ask an AI tool what to prioritise given what you have left before you consider this build "finished" for now.',
  7, 3
);
