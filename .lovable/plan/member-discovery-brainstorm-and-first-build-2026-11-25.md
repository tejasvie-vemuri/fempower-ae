# Member discovery: brainstorm and first build

## What's there today
The directory already lets signed-in members search by name and filter by city, industry and what someone is open to (mentoring, collaboration, hiring, friendship). It also has weekly suggestions, "Ask me about" tags, a New this week strip, badges and profile progress.

## Ideas to make finding people more fun

**Find people faster**
1. **One smart search box.** Typing "marketing Dubai mentor" matches name, job title, company, industry, city and tags all at once, with suggestions as you type.
2. **Quick topic chips.** A row of tappable chips like Founders, Tech, Wellness, Moms in business, Arabic speakers, built from what members actually write.
3. **"Ask the directory".** Members type in plain words, e.g. "someone who knows UAE visas for freelancers", and Zara suggests 3 matching members with the reason for each.

**Recognise people at a glance**
4. **Richer member cards.** Photo, name, job title @ company, industry, city, and a one-line "I can help with…".
5. **Industry and profession groups.** A browse page showing groups like "Finance (23)", "Design (14)" that open into the members inside.
6. **"Met at" link to events.** Show who went to the same events, so members can find "the woman from Roundtable 09".

**Make it interactive**
7. **Member of the week.** One member featured on the directory with a short Q&A.
8. **Say hi / ask for an intro.** A button that opens WhatsApp or sends a short intro request, with a daily limit to avoid spam.
9. **Coffee roulette.** Opt-in monthly pairing with another member by shared interest.
10. **Shared-interest hints.** "You both like hiking and work in tech" on each card.

## Suggested first round
Build 1, 2, 4 and 6: the fastest wins for "recognise people by name, profession and industry", using information members already fill in. Ideas 3, 8 and 9 can follow.

## Technical notes
- Add job title and company to member profiles if missing, plus to the profile edit page and completeness score.
- Search across name, title, company, industry, city and tags in one query; topic chips counted from approved profiles only.
- "Met at" uses the existing member-only badge facts approach so booking rows stay private; only shows shared confirmed events.
- Add tests for the matching and chip rules in the existing directory rules file.
