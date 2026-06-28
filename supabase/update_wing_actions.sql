-- Update wing extension_content with concrete actions from the original curriculum

-- Wing 1: Your Starting Point
UPDATE public.learn_wings SET extension_content =
'Action: Pick one real task from your life right now — work, home, or a project you care about. Open any AI tool (ChatGPT, Claude, Gemini — any one works). Spend 10 minutes using it on that task.

Then reflect: where did AI help your thinking, and where did it fall short? Write a second paragraph capturing not what AI produced — but what you noticed about how you were thinking while using it. This is the meta-skill we are building across this entire course.'
WHERE id = 'w1000000-0000-0000-0000-000000000001';

-- Wing 2: It's Not Magic, It's Math
UPDATE public.learn_wings SET extension_content =
'Action: Open any AI tool you use. Ask it: "Explain to me how you work, like I am a curious ten-year-old." Then ask a follow-up: "Where are you most likely to get things wrong, and why?"

Go further: Find one moment this week where you caught AI being wrong — a confident mistake, an odd phrasing, an answer that felt off. Screenshot it. Then ask AI why it got it wrong. This is not a gotcha exercise. It is calibration. The people who use AI best are the ones who know its failure modes as well as its strengths.'
WHERE id = 'w1000000-0000-0000-0000-000000000002';

-- Wing 3: The Seventy-Year Journey
UPDATE public.learn_wings SET extension_content =
'Action: Ask any AI tool: "Give me a timeline of the five most important moments in AI history, and explain why each one mattered." Then ask: "What do you think comes next in the next five years?"

Go further: AI took 70 years to reach your phone. Think about one skill or craft in your own life — cooking, writing, managing people, designing — that took years to compound quietly before it clicked. Ask AI: "How does the way humans develop expertise compare to how AI models are trained?" Write two sentences: what is similar, and what is different.'
WHERE id = 'w1000000-0000-0000-0000-000000000003';

-- Wing 4: How AI Actually Reads You
UPDATE public.learn_wings SET extension_content =
'Action: Ask any AI tool: "What is tokenisation and show me how you would break this sentence into tokens: ''She learns AI one wing at a time.''" Then ask: "Why does rephrasing a prompt change your answer?"

Go further: Take a paragraph you wrote recently — an email, a message, a document. Paste it into any AI and ask: "If I rewrote this more concisely, would you understand it better? Rewrite it for me and explain what changed." You are starting to think like a prompt engineer.'
WHERE id = 'w1000000-0000-0000-0000-000000000004';

-- Wing 5: The Prediction Machine
UPDATE public.learn_wings SET extension_content =
'Action: Ask any AI: "Explain next-token prediction to me like I have never heard of it. Then give me an example where this prediction process goes wrong — a hallucination — and explain why it happened mathematically."

Go further: Think of one domain in your work or life where you make quick calls based on pattern recognition — reading a room, estimating a timeline, judging a mood from a message. Ask AI: "Help me build a checklist to verify my instinct in [that domain] before I act on it." Compare how you handle uncertainty versus how AI should handle its uncertainty.'
WHERE id = 'w1000000-0000-0000-0000-000000000005';

-- Wing 6: Training, Fine-Tuning, and You
UPDATE public.learn_wings SET extension_content =
'Action: Ask any AI: "Explain the difference between pretraining and fine-tuning. What kind of biases could creep in during each stage?" Then ask: "What is RLHF and how did human feedback shape how you respond?" Reflect on one bias you have noticed in AI responses.

Go further: Think of one strong professional opinion you hold — about how meetings should run, how feedback should be given, how projects get done. Ask AI the same question and compare its answer to yours. Then ask: "What life experiences or data might have shaped your answer differently from mine?" You are reverse-engineering bias in AI and in yourself simultaneously.'
WHERE id = 'w1000000-0000-0000-0000-000000000006';

-- Wing 7: The Layers You Never See
UPDATE public.learn_wings SET extension_content =
'Action: Ask any AI: "Explain the difference between a foundation model, an API, and a chat interface. If I wanted to build my own app using you as the brain — which layer would I be working with?" Then ask: "What is a system prompt and what can it do?"

Go further: Think of one tool you use at work or at home that you suspect has AI built in somewhere underneath — an email client, a writing tool, a search bar, a customer support chat. Ask the AI: "Does [tool name] use an AI model? What layer of the stack is the AI operating at?" Then ask: "If I wanted to customise how it behaves, what layer would I need to access?" You are starting to see the world as a stack, not a black box.'
WHERE id = 'w1000000-0000-0000-0000-000000000007';

-- Wing 8: Reflect — AI Foundations
UPDATE public.learn_wings SET extension_content =
'Action: Take your three takeaways from this module and open an AI tool. Tell it: "Here are three things I learned about AI: [paste them]. Based on this, what should I learn next, and what is one thing I can try in my own work or life using just what I know so far?" Let AI help you design your own next step.

Go further: Share your biggest insight from this module with one person in your life who is curious about AI. Teaching is the fastest way to cement what you have learned.'
WHERE id = 'w1000000-0000-0000-0000-000000000008';

-- Wing 9: What Is a Prompt?
UPDATE public.learn_wings SET extension_content =
'Action: Pick one real task from your life — a work email, a plan, a problem you are thinking about. Write the first prompt that comes to mind and see what you get. Then rewrite it with more specificity and context. Compare the two responses.

Go further: Take the same task and write five different versions of the prompt — each one adding a different element: role, tone, format, constraint, example. Run all five. Notice which dimension made the biggest difference. Then write a one-line "prompt formula" for this type of task that you will reuse.'
WHERE id = 'w1000000-0000-0000-0000-000000000009';

-- Wing 10: Simple Prompts That Work
UPDATE public.learn_wings SET extension_content =
'Action: Take three everyday tasks — something you would normally do yourself — and write one prompt for each that is specific, gives context, and asks for a clear format. Try: a message to a friend, a to-do list for your week, a summary of something you read recently.

Go further: Find the most complex, annoying, recurring task in your work week — the one that takes you the longest and feels the most draining. Write the most specific, context-rich prompt you can for it. Run it. If the output is not good enough, ask AI: "What additional information would you need from me to do this better?" This is how you build a prompt you will actually reuse every week.'
WHERE id = 'w1000000-0000-0000-0000-000000000010';

-- Wing 11: Role, Context, Task
UPDATE public.learn_wings SET extension_content =
'Action: Write one prompt using all three parts — Role, Context, Task — for something meaningful in your life right now. Example: "You are an experienced career coach who specialises in women in the UAE. I have been in my current role for two years and I feel like I am not growing. I have a 1:1 with my manager tomorrow. Write me five questions I can ask to open a conversation about my growth path."

Go further: Build a reusable "master prompt" in Role-Context-Task format for your most common AI use case — writing, planning, research, or feedback. This becomes your personal system prompt — your AI''s default mode of working with you. Save it somewhere you will actually use it.'
WHERE id = 'w1000000-0000-0000-0000-000000000011';

-- Wing 12: When AI Gets It Wrong
UPDATE public.learn_wings SET extension_content =
'Action: Intentionally write a vague or incomplete prompt on a topic you care about. Get the response. Then diagnose what went wrong and rewrite the prompt to fix it. Do this twice with two different topics. Notice the pattern in what was missing each time.

Go further: Find a decision you made recently at work or at home that did not go the way you wanted. Describe it to AI and ask: "Based on what I have told you, what information was I missing when I made this decision, and what questions should I have asked myself first?" You are using AI to debug your thinking the same way you debug a prompt.'
WHERE id = 'w1000000-0000-0000-0000-000000000012';

-- Wing 13: Complex Prompts for Complex Tasks
UPDATE public.learn_wings SET extension_content =
'Action: Pick a complex task you have been putting off — a plan, a proposal, a difficult message, a strategy. Break it into at least three sequential prompts. Run them one after another, letting each response inform the next. Notice how the final output compares to what a single prompt would have produced.

Go further: Map your most complex recurring work process as a prompt chain. Think of something that happens monthly or quarterly — a report, a review, a planning session. Write the full sequence of prompts you would use to AI-assist that process from start to finish. This is the beginning of building your own AI workflow — a repeatable, improvable process that compounds every time you use it.'
WHERE id = 'w1000000-0000-0000-0000-000000000013';

-- Wing 14: Prompting Across Tools
UPDATE public.learn_wings SET extension_content =
'Action: Take one prompt — something from this module that worked well — and run it across at least two different AI tools (ChatGPT, Claude, Gemini, Perplexity). Compare the responses. What did each do differently? Which one served the task better, and why?

Go further: Build a personal "AI toolkit" decision tree. Think of the five types of tasks you most commonly use AI for. For each one, decide which tool you will default to and why. Then test your hypothesis: run the same task on your chosen tool versus your second choice. Does your default still win? This exercise builds tool intuition, not tool loyalty.'
WHERE id = 'w1000000-0000-0000-0000-000000000014';

-- Wing 15: Reflect — Prompt Engineering
UPDATE public.learn_wings SET extension_content =
'Action: Take your best prompt from this module and turn it into a reusable template. Generalise it — replace the specific details with placeholders like [topic], [audience], [tone], [constraint], [success criteria]. Save it somewhere you will actually find it.

Go further: Open console.anthropic.com. Use "Generate a prompt" to produce a professional-grade prompt from plain language, or "Improve a prompt" to upgrade a weak one. This is Claude engineering prompts at Claude''s own standard. Compare what it produces with your best work from this module.'
WHERE id = 'w1000000-0000-0000-0000-000000000015';

-- Wing 16: What Is Context?
UPDATE public.learn_wings SET extension_content =
'Action: Start a new conversation with any AI tool and give it zero context. Ask it to help you with something specific in your life. See what you get. Then start a fresh conversation and spend three sentences giving it full context before asking the same question. Compare the two responses.

Go further: Write your personal context block — a 10-line description of who you are, what you do, how you think, and what you use AI for. Every time you start a new AI conversation about your work or life, paste this at the top. Over the next week, notice how the quality of your interactions changes. Refine the block each time something feels missing.'
WHERE id = 'w1000000-0000-0000-0000-000000000016';

-- Wing 17: Connecting AI to Your World
UPDATE public.learn_wings SET extension_content =
'Action: Ask any AI: "What is an API? Give me three examples of how an AI connected to APIs could help someone in my kind of work — give me specific, concrete use cases, not abstract ones." Pick the use case that excites you most and describe what your life would look like if that existed.

Go further: Pick one of the three use cases and map out the workflow: what data flows in, what AI does with it, and what you get back. Draw it on paper or describe it in your notes. Then ask AI: "Help me design this workflow in detail. What would I need to set up to make this real today?" You may be surprised how close you already are.'
WHERE id = 'w1000000-0000-0000-0000-000000000017';

-- Wing 18: What Is an MCP?
UPDATE public.learn_wings SET extension_content =
'Action: Open Claude at claude.ai and look at the connectors available in the left panel. Connect one — Notion, Google Drive, or whatever you use. Then ask Claude: "What are the most important things I should pay attention to today based on what you can see?"

Go further: Connect a second tool and ask Claude to reason across both. For example: connect your calendar and your email, then ask: "Based on my meetings this week and my unread emails, what should my priorities be today?" This is AI as a chief of staff, not just a chat window. Notice what it gets right and what it misses. That gap is your next prompt engineering challenge.'
WHERE id = 'w1000000-0000-0000-0000-000000000018';

-- Wing 19: Building Your First Integration
UPDATE public.learn_wings SET extension_content =
'Action: Go to zapier.com and create a free account. Build the simplest possible automation: when a new email arrives with a specific label or keyword, send yourself a Slack message or a notification. You do not need AI in it yet — just connect two tools and make something happen automatically.

Go further: Go back to Zapier and add a step that sends the data through an AI action — Zapier has built-in AI steps. Ask it to summarise, classify, or extract something useful from the data before it hits the output. For example: email arrives — AI extracts the action item — action item is added to your task list. You have just built an AI-powered workflow.'
WHERE id = 'w1000000-0000-0000-0000-000000000019';

-- Wing 20: Context in Practice
UPDATE public.learn_wings SET extension_content =
'Action: Build your own morning brief prompt. Write a detailed system prompt that tells AI exactly who you are, what your role is, what your current priorities are, and what a useful morning brief looks like for you. Then run it — either manually by pasting your context, or by connecting your tools.

Go further: Build the evening version too — a daily close-out brief. What did you finish? What moved? What is still open? What one thing are you carrying into tomorrow that needs a decision? Compare your morning expectations to your evening reality. That gap — between what you planned and what happened — is your most useful data. Ask AI: "Based on this pattern, what should I change about how I plan my days?"'
WHERE id = 'w1000000-0000-0000-0000-000000000020';

-- Wing 21: RAG and Beyond
UPDATE public.learn_wings SET extension_content =
'Action: Go to NotebookLM (notebooklm.google.com) — it is free. Upload three documents that matter to you: a report, a set of notes, a presentation, anything. Then ask it questions about those documents — questions you would normally have to search through pages to answer.

Go further: Design your ideal personal knowledge base. What are the 10 most important documents in your professional life — the ones you refer to repeatedly, the ones that contain your core thinking? List them. Upload them to NotebookLM. Then ask it to synthesise across all of them: "What are the recurring themes across these documents? What tensions exist? What questions am I not yet answering?" You have just built a thinking partner that knows your body of work.'
WHERE id = 'w1000000-0000-0000-0000-000000000021';

-- Wing 22: Reflect — Context Engineering
UPDATE public.learn_wings SET extension_content =
'Action: List every tool you used this week — work and personal. For each one, ask: does this tool have an AI layer? Could it connect to another tool? Is there a workflow I am still doing manually that sits between two connected tools? Map the gaps.

Go further: Pick one gap and ask AI: "Design the simplest automation to close this gap for me." Your goal is to have at least three workflows running without you. Start the list today. The people who will get the most from AI in the next five years are not the ones who prompt best — they are the ones who delegate best.'
WHERE id = 'w1000000-0000-0000-0000-000000000022';
