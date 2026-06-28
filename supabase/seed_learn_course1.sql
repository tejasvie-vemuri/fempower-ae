-- Seed: Learn AI from Scratch — Course 1 for FemPower Learn
-- Run this AFTER the learn tables migration

-- 1. Insert the course
INSERT INTO public.learn_courses (id, title, description, emoji, display_order, status)
VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'Learn AI from Scratch',
  'No jargon. No overwhelm. Just a clear, honest path from "what even is AI?" to confidently using it in your work and life. Built for women who want to understand the technology shaping their world — not just use it blindly.',
  '🧠',
  1,
  'published'
);

-- 2. Insert modules
INSERT INTO public.learn_modules (id, course_id, title, description, display_order) VALUES
(
  'm1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'AI Foundations',
  'What is AI really? Not the hype, not the fear — the actual technology. You will understand how AI thinks, where it came from, why it gets things wrong, and what is happening underneath the chat window you use every day.',
  1
),
(
  'm1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000001',
  'Prompt Engineering',
  'AI only performs as well as the instructions you give it. This module teaches you how to talk to AI with precision — how to ask for what you actually want, debug bad responses, and build prompts you can reuse across your work and life.',
  2
),
(
  'm1000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000001',
  'Context Engineering',
  'AI does not know your world unless you bring it in. This module teaches you how to connect AI to your actual data, documents, and tools — so it stops giving generic answers and starts giving answers built for your life.',
  3
);

-- 3. Insert wings

-- ═══════════════════════════════════════════════════════════
-- MODULE 1: AI FOUNDATIONS (8 wings)
-- ═══════════════════════════════════════════════════════════

-- Wing 1: Your Starting Point
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000001',
  'm1000000-0000-0000-0000-000000000001',
  'Your Starting Point',
  'Every day a new AI tool launches. Every week someone tells you everything has changed. And you are sitting there thinking — where do I even start?

That feeling is real. It is also a signal. It means you care. It means you know something important is happening and you do not want to be left behind.

FemPower Learn exists for exactly that moment.

This is not about memorising prompts or following templates. A colouring book never made an artist. We are not here to hand you answers every day. We are here to help you think with AI — using your own mind, in your own life.

Right now, most people use AI the way most people use Excel. You open it, you get some value, you close it. But only a small percentage of people know how to use it at full potential — to write a formula, build a pivot table, make it work for them.

We are moving you from casual user to confident practitioner. Someone who knows why something works, not just that it does.

By the end of this course, you will not know everything. Nobody does. But you will know how to think with AI. That is the skill that compounds forever.',
  'Describe your current relationship with AI in one sentence. Is it a tool? A toy? A mystery? Something you use but do not fully trust? Something exciting but overwhelming? Write it honestly. There is no wrong answer. This is your baseline. You will read it again at the end.',
  'Pick one real task from your life right now — work, home, or a project you care about. Open any AI tool. Spend 10 minutes using it on that task. Then reflect: where did AI help your thinking, and where did it fall short? Notice not what AI produced — but what you noticed about how you were thinking while using it.',
  1, 5
);

-- Wing 2: It's Not Magic, It's Math
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000002',
  'm1000000-0000-0000-0000-000000000001',
  'It''s Not Magic, It''s Math',
  'Everything you see AI do today — write an email, generate an image, answer a question, write code — is the result of seventy years of mathematics built by millions of scientists across the world.

AI is not a genie. It is not magic. It is a very sophisticated pattern-matching engine that predicts the next most likely word, pixel, or token. That is it.

Once you understand that, you stop being afraid of it.

When AI gives you a wrong answer confidently, it is not lying to you — it is doing math that went slightly off. When you understand that, you can fix it instead of feeling fooled by it.

This single shift in understanding — from "AI is mysterious" to "AI is math I can work with" — changes everything about how you use it.',
  'What is one thing you believed about AI before today that feels different now?',
  'Open any AI tool you use — ChatGPT, Claude, Gemini, it does not matter. Ask it: "Explain to me how you work, like I am a curious ten-year-old." Then ask a follow-up: "Where are you most likely to get things wrong, and why?" Notice what surprises you.',
  2, 4
);

-- Wing 3: The Seventy-Year Journey
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000003',
  'm1000000-0000-0000-0000-000000000001',
  'The Seventy-Year Journey',
  'AI did not appear overnight. It started in the 1950s with simple models called perceptrons that could barely tell a circle from a square.

Then came the AI winters — decades where funding dried up because the technology was not working. Then breakthroughs: neural networks in the 80s, deep learning in the 2010s, transformers in 2017, and ChatGPT in 2022 — which put everything into the hands of ordinary people.

You are living at the peak of seventy years of stubbornness and curiosity.

When you know the history, you understand why AI feels like it arrived suddenly — it did not. It was being built quietly for decades. Knowing that helps you trust it more intelligently, not blindly.',
  'Which moment in AI history surprised you the most — and why?',
  'Ask any AI tool: "Give me a timeline of the five most important moments in AI history, and explain why each one mattered." Then ask: "What do you think comes next in the next five years?" Notice how knowing the past changes how you think about the future.',
  3, 4
);

-- Wing 4: How AI Actually Reads You
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000004',
  'm1000000-0000-0000-0000-000000000001',
  'How AI Actually Reads You',
  'When you type a sentence to an AI, it does not see words the way you do. It breaks your sentence into small chunks called tokens — sometimes a whole word, sometimes just part of one.

It then converts each token into a number, and that number lives inside a vast mathematical space called an embedding. Words that mean similar things live close together in that space. "Cat" and "kitten" are neighbours. "Cat" and "invoice" are far apart.

This is how AI understands meaning — not through dictionaries, but through mathematical proximity.

This is why punctuation matters. This is why rephrasing a prompt can get you a completely different answer. This is why longer, more specific prompts often work better. You are not typing to a person — you are navigating a mathematical space with words.',
  'Does knowing AI reads numbers instead of words change how you will write prompts going forward?',
  'Ask any AI tool: "What is tokenisation and show me how you would break this sentence into tokens: ''She learns AI one wing at a time.''" Then ask: "Why does rephrasing a prompt change your answer?" Notice the gap between how you write and how AI reads.',
  4, 5
);

-- Wing 5: The Prediction Machine
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000005',
  'm1000000-0000-0000-0000-000000000001',
  'The Prediction Machine',
  'Here is the single most important thing to understand about how AI generates text: it is predicting the next most likely token, one at a time.

Every single word you see in an AI response is the result of a calculation — given everything said so far, what word comes next? There is a mathematical function called softmax that turns a huge list of possible next words into probabilities. The AI picks from those probabilities.

No understanding. No feelings. Pure prediction.

This is exactly why AI hallucinates. It is not lying — it is confidently predicting what words should come next, even when it has run out of real knowledge to draw from.

Once you understand this, you stop being shocked when it makes things up, and you start knowing when to verify.',
  'Now that you know AI is predicting word by word — does that change how much you trust it? What will you verify from now on?',
  'Ask any AI: "Explain next-token prediction to me like I have never heard of it. Then give me an example where this prediction process goes wrong — a hallucination — and explain why it happened." Notice the gap between confidence and accuracy.',
  5, 5
);

-- Wing 6: Training, Fine-Tuning, and You
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000006',
  'm1000000-0000-0000-0000-000000000001',
  'Training, Fine-Tuning, and You',
  'Before AI can predict anything, it has to learn. This happens in stages.

First, pretraining — the model reads a vast portion of the internet and learns the patterns of human language. This takes months and costs millions.

Then fine-tuning — the model is shaped to be helpful and safe, using human feedback. Real people rated responses as good or bad, and those ratings taught the model how to behave. This process is called RLHF — Reinforcement Learning from Human Feedback.

Every thumbs up and thumbs down you have ever given an AI has been part of training future models.

You are not just a user of AI. You have been — without knowing it — a contributor to how it thinks. Understanding this helps you see AI not as an oracle, but as a mirror of human knowledge, with all its biases and blind spots included.',
  'If AI learned from human feedback — what do you think it learned about how women communicate, ask questions, and seek help?',
  'Ask any AI: "Explain the difference between pretraining and fine-tuning. What kind of biases could creep in during each stage?" Then ask: "What is RLHF and how did human feedback shape how you respond?" Notice what it says about whose feedback shaped the model.',
  6, 5
);

-- Wing 7: The Layers You Never See
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000007',
  'm1000000-0000-0000-0000-000000000001',
  'The Layers You Never See',
  'When you open ChatGPT or Claude, you are not talking directly to the raw AI model. You are talking through layers.

At the bottom is the foundation model — billions of parameters, trained on vast data. On top of that sits a system prompt, invisible to you, that shapes how the AI behaves. On top of that is the API — a way for software to talk to the model programmatically, without any chat interface at all. And finally, the product layer — the chat window you actually see.

Strip away all those layers and the math still runs. AI can work even when the friendly interface is gone.

The chat interface is just one way to interact with AI. Apps, automations, agents — they all bypass the chat window and talk directly to the API. Understanding the layers means you understand what is possible.',
  'Looking back at this whole module — what is the one thing that most changed how you see AI?',
  'Ask any AI: "Explain the difference between a foundation model, an API, and a chat interface. If I wanted to build my own app using you as the brain — which layer would I be working with?" Then ask: "What is a system prompt and what can it do?" Notice how much sits between you and the actual model.',
  7, 5
);

-- Wing 8: Reflect — AI Foundations
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000008',
  'm1000000-0000-0000-0000-000000000001',
  'Reflect: AI Foundations',
  'Take a breath. Look at what you now know.

You started not knowing what was underneath the chat window. Now you know: tokens, embeddings, next-token prediction, softmax, pretraining, RLHF, APIs, system prompts.

You did not just learn vocabulary — you built a mental model. AI is no longer a black box. It is a very sophisticated prediction machine built on seventy years of human curiosity.

The core insight from this module: AI is a mirror of your own clarity. When the output is generic, the prompt was generic. When the prompt is specific, AI becomes a thinking partner. You are the variable. Not the tool.

Take five minutes and write down:
1. One thing you learned that you will never forget
2. One thing you want to go deeper on
3. One thing you are excited to try in the next module when we get into prompting',
  'Before this module, I thought AI was ___. Now I know it is ___. What surprised me most was ___.',
  'Take your three takeaways from this module and open an AI tool. Tell it: "Here are three things I learned about AI: [paste them]. Based on this, what should I learn next, and what is one thing I can try in my own work or life using just what I know so far?" Let AI help you design your own next step.',
  8, 3
);

-- ═══════════════════════════════════════════════════════════
-- MODULE 2: PROMPT ENGINEERING (7 wings)
-- ═══════════════════════════════════════════════════════════

-- Wing 1: What Is a Prompt?
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000009',
  'm1000000-0000-0000-0000-000000000002',
  'What Is a Prompt?',
  'A prompt is simply what you say to AI to get it to do something. But that is like saying a recipe is just words on a page.

The quality of your prompt determines everything — the clarity of the answer, the usefulness of the output, whether you feel like AI is working with you or against you.

Most people type the first thing that comes to mind. Skilled prompters think like designers: what do I actually want, who do I want AI to be, and what context does it need to help me well?

The gap between a mediocre AI response and an exceptional one is almost always the prompt. The model has not changed. The question has.',
  'What was different between your first prompt and your second? What did adding context actually change?',
  'Pick one real task from your life — a work email, a plan, a problem you are thinking about. Write the first prompt that comes to mind and see what you get. Then rewrite it with more specificity and context. Compare the two responses. Notice the gap.',
  1, 4
);

-- Wing 2: Simple Prompts That Work
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000010',
  'm1000000-0000-0000-0000-000000000002',
  'Simple Prompts That Work',
  'You do not need complex frameworks to get good results from AI. You need clarity.

The three ingredients of a prompt that works:
1. Be specific about what you want
2. Tell it the format you want it in
3. Give it enough context to actually help you

"Write me an email" is weak.

"Write a short, warm email to my manager explaining I will be 30 minutes late to tomorrow''s 10am meeting, and suggest we push it to 10:30" is strong.

Same task. Completely different result.

Most people give up on AI too early because their vague prompts get vague responses. Specificity is the single biggest lever you have. Pull it.',
  'Which of your three prompts got the best result — and what made it work?',
  'Take three everyday tasks — something you would normally do yourself — and write one prompt for each that is specific, gives context, and asks for a clear format. Try: a message to a friend, a to-do list for your week, a summary of something you read recently. Notice which one lands best.',
  2, 4
);

-- Wing 3: Role, Context, Task
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000011',
  'm1000000-0000-0000-0000-000000000002',
  'Role, Context, Task',
  'The most reliable prompt structure you will ever use has three parts.

First, the Role — tell AI who to be. "Act as a senior product manager" or "You are a warm, experienced coach." This shapes the tone, expertise, and perspective of everything that follows.

Second, the Context — tell it what it needs to know. Your situation, constraints, what has already happened.

Third, the Task — tell it exactly what to do.

When you combine all three, AI stops being a search engine and starts being a thinking partner.

Role shapes voice. Context shapes relevance. Task shapes output. Miss any one of the three and the response feels generic. Nail all three and it feels like it was written for you — because it was.

Example: "You are an experienced career coach who specialises in women in the UAE. I have been in my current role for two years and I feel like I am not growing. I have a 1:1 with my manager tomorrow. Write me five questions I can ask to open a conversation about my growth path."',
  'How did adding a role change the tone of the response? Would you have written it differently yourself?',
  'Build a reusable version of Role-Context-Task for your most common AI use case. Think about the single thing you use AI for most — writing, planning, research, feedback. Write a "master prompt" that you can paste at the start of any conversation on that topic. Save it somewhere you will actually use it.',
  3, 5
);

-- Wing 4: When AI Gets It Wrong
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000012',
  'm1000000-0000-0000-0000-000000000002',
  'When AI Gets It Wrong',
  'AI will get things wrong. It will misunderstand your question, give you something too generic, go off in the wrong direction, or simply make something up.

This is not a failure — it is information.

Every bad response tells you something about what your prompt was missing. The skill is not writing a perfect prompt the first time. The skill is knowing how to read a bad response and iterate.

Did it misunderstand your context? Did it take the wrong tone? Was it too long, too short, too formal? Each of these has a fix.

The people who get the most out of AI are not the ones who write perfect prompts. They are the ones who are not afraid to push back, refine, and ask again.

Iteration is the skill. One-shot is the myth.',
  'What does a bad AI response actually tell you about what was missing from your prompt?',
  'Intentionally write a vague or incomplete prompt on a topic you care about. Get the response. Then diagnose what went wrong and rewrite the prompt to fix it. Do this twice with two different topics. Notice the pattern in what was missing each time.',
  4, 5
);

-- Wing 5: Complex Prompts for Complex Tasks
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000013',
  'm1000000-0000-0000-0000-000000000002',
  'Complex Prompts for Complex Tasks',
  'Some tasks are too big for a single prompt. A report, a plan, a multi-step analysis — these need a different approach.

Chaining is the technique of breaking a big task into smaller prompts where each output feeds the next. First, ask AI to think through the problem. Then ask it to structure the solution. Then ask it to write it.

You can also use a single long prompt with numbered steps — tell AI exactly what to do in sequence.

The key insight: AI does not get tired. You can have a long, structured conversation and build something substantial, one step at a time.

One long, overwhelming prompt produces one mediocre response. A sequence of focused prompts — each building on the last — produces something genuinely useful.

This is how you build with AI, not just chat with it.',
  'What did breaking the task into steps allow you to do that a single prompt could not?',
  'Pick a complex task you have been putting off — a plan, a proposal, a difficult message, a strategy. Break it into at least three sequential prompts. Run them one after another, letting each response inform the next. Notice how the final output compares to what a single prompt would have produced.',
  5, 6
);

-- Wing 6: Prompting Across Tools
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000014',
  'm1000000-0000-0000-0000-000000000002',
  'Prompting Across Tools',
  'The prompting principles you have learned in this module work everywhere. ChatGPT, Claude, Gemini, Copilot, Perplexity — they all respond to the same fundamentals: be specific, give context, assign a role, iterate.

The differences between tools are real but secondary.

Claude tends to be more thoughtful and nuanced. ChatGPT is fast and versatile. Gemini is deeply connected to Google''s ecosystem. Perplexity is excellent for research with live sources.

Knowing the strengths of each means you can pick the right tool for the right job — and your prompting skills transfer instantly.

You are not learning how to use one tool. You are learning how to think with AI. That skill is durable. Tools will change. Your ability to prompt well will not.',
  'If you could only use one AI tool from now on, which would it be — and what would you miss from the others?',
  'Take one prompt — something from this module that worked well — and run it across at least two different AI tools. Compare the responses. What did each do differently? Which one served the task better, and why? Build your own sense of which tool fits which job.',
  6, 5
);

-- Wing 7: Reflect — Prompt Engineering
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000015',
  'm1000000-0000-0000-0000-000000000002',
  'Reflect: Prompt Engineering',
  'The first module was about understanding. This module was about directing.

You came in not knowing how to prompt. You leave with an instinct for it. You know what makes a prompt weak and what makes one strong. You know Role, Context, Task. You debug bad responses instead of giving up on them. You chain prompts to solve problems too big for one turn. And you carry the same skill across every AI tool.

The insight this module builds toward: AI is a mirror of your own clarity. When the output is generic, the prompt was generic. When the prompt is specific, AI becomes a thinking partner. You are the variable. Not the tool.

Techniques to carry forward:
• Success criteria — tell AI what good looks like, not just the format
• Ask AI what it needs — say "tell me what else you need from me to do this really well"
• Show, do not tell — two examples beat three paragraphs of description
• Let AI rewrite your prompt — paste your messy first attempt and ask AI to restructure it

Take five minutes and write down:
1. The best prompt you wrote in this module, and why it worked
2. One prompting habit you are going to keep
3. One moment when AI became genuinely useful in your life',
  'Before this module, the first thing I typed into AI was ___. Now I write ___ instead. The moment I realised I was driving and not the passenger was ___.',
  'Take your best prompt from this module and turn it into a reusable template. Generalise it — replace the specific details with placeholders like [topic], [audience], [tone], [constraint], [success criteria]. Save it somewhere you will actually find it. One strong template you reuse is worth more than a hundred one-off prompts.',
  7, 3
);

-- ═══════════════════════════════════════════════════════════
-- MODULE 3: CONTEXT ENGINEERING (7 wings)
-- ═══════════════════════════════════════════════════════════

-- Wing 1: What Is Context?
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000016',
  'm1000000-0000-0000-0000-000000000003',
  'What Is Context?',
  'AI only knows what you tell it. Within a single conversation, it remembers everything you have said — but the moment you start a new conversation, it forgets all of it.

This is called the context window. Think of it like a whiteboard that gets wiped clean every session.

The size of that whiteboard varies by model — some can hold a few thousand words, others can hold entire books. The more relevant information you put on that whiteboard, the better AI performs.

Context engineering is the practice of filling that whiteboard deliberately.

Most people talk to AI like it already knows them. It does not. Every conversation starts fresh. The people who get the most out of AI are the ones who bring the right context every time — who they are, what they are working on, what they have already tried, what good looks like.',
  'What three sentences of context would make AI most useful to you personally — every single day?',
  'Start a new conversation with any AI tool and give it zero context. Ask it to help you with something specific in your life. See what you get. Then start a fresh conversation and spend three sentences giving it full context before asking the same question. Compare the two responses. Notice the difference context makes.',
  1, 4
);

-- Wing 2: Connecting AI to Your World
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000017',
  'm1000000-0000-0000-0000-000000000003',
  'Connecting AI to Your World',
  'The chat window is the smallest version of what AI can do.

In the real world, AI does not have to wait for you to type information — it can go and fetch it. This is done through APIs. An API is a door between two pieces of software.

When AI is connected to an API, it can reach into your calendar, your email, your documents, your databases — and bring that information into the conversation automatically. You stop being the one who has to remember and relay everything. The AI does that for you.

This is the shift from AI as a chat tool to AI as a working partner. The moment it has access to your actual world — your actual data, your actual context — it stops giving generic answers and starts giving answers that are specific to your situation.',
  'If AI could connect to three things in your digital life right now — what would they be, and what would you want it to do with them?',
  'Ask any AI: "What is an API? Give me three examples of how an AI connected to APIs could help someone in my kind of work — give me specific, concrete use cases, not abstract ones." Pick the use case that excites you most and think about what your life would look like if that existed.',
  2, 4
);

-- Wing 3: What Is an MCP?
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000018',
  'm1000000-0000-0000-0000-000000000003',
  'What Is an MCP?',
  'MCP stands for Model Context Protocol. It is a standard — a common language — that lets AI connect to tools and data sources in a structured, reliable way.

Think of it as a universal adapter. Before MCP, every integration between AI and a tool was custom-built and fragile. With MCP, an AI can connect to your Notion, your Gmail, your calendar, your GitHub — using the same protocol each time.

This is what makes it possible for AI to look at your emails and say "here are the three things you need to act on today" — without you copying and pasting anything.

MCP is one of the most important infrastructure shifts happening in AI right now. It is what makes AI genuinely useful in your daily work — not just as a chat tool, but as something that knows your context and acts on it. Understanding it now puts you ahead.',
  'What was it like having AI look at your actual data instead of imagined data? What surprised you?',
  'Open Claude at claude.ai and look at the connectors available. Connect one — Notion, Google Drive, or whatever you use. Then ask Claude: "What are the most important things I should pay attention to today based on what you can see?" Notice the difference between AI guessing and AI knowing.',
  3, 5
);

-- Wing 4: Building Your First Integration
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000019',
  'm1000000-0000-0000-0000-000000000003',
  'Building Your First Integration',
  'Today you stop reading about integrations and build one.

An integration is simply two tools talking to each other. The simplest integrations use something called a webhook — a way for one tool to send a message to another whenever something happens.

More powerful integrations use Zapier or Make, which let you connect hundreds of tools without writing a single line of code.

The principle is always the same: when this happens in tool A, do that in tool B. AI can sit in the middle — receiving the data, doing something intelligent with it, and sending a result back.

This is the moment AI stops being a chat window and becomes infrastructure. One working integration — even a simple one — changes how you think about what is possible.',
  'What repetitive thing in your life could an integration handle — so you never have to think about it again?',
  'Go to zapier.com and create a free account. Build the simplest possible automation: when a new email arrives with a specific label or keyword, send yourself a notification. You do not need AI in it yet — just connect two tools and make something happen automatically. Then try adding an AI step in the middle to summarise or classify the data.',
  4, 7
);

-- Wing 5: Context in Practice
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000020',
  'm1000000-0000-0000-0000-000000000003',
  'Context in Practice',
  'Let us make this real.

The idea: every morning, AI looks at what is happening in your world — your calendar, your top tasks, your emails — and gives you a structured brief. Not a generic one. Your brief. What needs your attention, what can wait, what decision is coming that you should be thinking about.

This is what becomes possible when AI has context. It stops being reactive and starts being proactive.

Most people use AI to answer questions. Context engineering lets you use AI to surface questions you did not even know to ask. That is a fundamentally different — and more powerful — relationship with the technology.

Build your own morning brief prompt. Write a detailed prompt that tells AI exactly who you are, what your role is, what your current priorities are, and what a useful morning brief looks like for you.',
  'What would change in your mornings if you had a personalised AI brief waiting for you every day?',
  'Build the evening version too: a daily close-out brief. What did you finish? What moved? What is still open? What one thing are you carrying into tomorrow that needs a decision? Run it tonight by pasting in your day''s notes or task list. Compare your morning expectations to your evening reality. That gap is your most useful data.',
  5, 6
);

-- Wing 6: RAG and Beyond
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000021',
  'm1000000-0000-0000-0000-000000000003',
  'RAG and Beyond',
  'RAG stands for Retrieval Augmented Generation. It sounds technical but the idea is simple.

Instead of relying only on what the AI learned during training, you give it access to a specific set of documents — your documents — and it retrieves the relevant ones before answering your question.

This is how you build an AI that knows your company''s policies, your personal notes, your research library, your product documentation. You ask a question, it searches your documents, it answers based on what it finds. No more "I do not have access to that information."

RAG is the technology behind tools like NotebookLM, Perplexity, and any AI that can answer questions about your specific content. Understanding it means you can choose and use these tools intelligently.',
  'What collection of documents — if AI could search them instantly — would change how you work?',
  'Go to NotebookLM (notebooklm.google.com) — it is free. Upload three documents that matter to you: a report, a set of notes, a presentation, anything. Then ask it questions about those documents — questions you would normally have to search through pages to answer. Notice how different this feels from a generic AI conversation.',
  6, 6
);

-- Wing 7: Reflect — Context Engineering
INSERT INTO public.learn_wings (id, module_id, title, context_content, reflection_prompt, extension_content, display_order, estimated_minutes) VALUES (
  'w1000000-0000-0000-0000-000000000022',
  'm1000000-0000-0000-0000-000000000003',
  'Reflect: Context Engineering',
  'You started this module knowing how to talk to AI. You end it knowing how to connect AI to your world.

Context windows, APIs, MCP, integrations, morning briefs, RAG — these are not abstract concepts anymore. You have touched them, explored them, seen what becomes possible when AI knows more than what you typed into a chat window.

This is the shift from user to builder.

The core insight: the people who get the most out of AI are not the ones who prompt best. They are the ones who give AI the richest context. Your data, your documents, your patterns, your priorities — when AI has those, it stops being a general-purpose tool and becomes your tool.

Take five minutes and write down:
1. One integration or connection you tried in this module
2. One context-rich prompt you will keep using
3. What you want to explore next — agents, building, or going deeper on what you have learned',
  'Before this module I thought AI needed me to ___. Now I know it can ___ on its own. The integration that surprised me most was ___.',
  'List every tool you used this week — work and personal. For each one, ask: does this tool have an AI layer? Could it connect to another tool? Is there a workflow I am still doing manually that sits between two connected tools? Map the gaps. Then pick one gap and ask AI: "Design the simplest automation to close this gap for me."',
  7, 3
);
