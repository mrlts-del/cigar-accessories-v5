Since I open sourced my .mdc rules for Cursor I've been getting a lot of questions.

Here are all the answers in one place:

1. Isn't 20 mdc files too much information for Cursor?
No. This is what .mdc files solve. Cursor Rules file is now deprecated. You no longer provide all your information in one go, but in small chunks (.mdc files). Each of my .mdc files is <50 lines.

2. Do you need to manually tag Cursor?
There are 4 options for rules:
a. Always - the rule is part of every chat
b. Auto attached - e.g. auto attach whenever you're chatting about ".tsx" files, or "tailwind.config" file.
c. Agent requested - the agent can request to read the file. This is what I use most of the time. The agent decides whether to request a rule based on the description you set for the rule
d. Manual - only applied when tagging it.

I mostly use c. And I'll often tag the a rule file for Cursor myself as I'm not certain it will always read it otherwise.

3. How do I write the rules?
I have a cursor-rules.mdc that writes rules. Easiest way to do this:
* Share a snippet of code with Cursor (command-shift-L on relevant text)
* Tag the .cursor-rules.mdc file
* Ask Cursor to create a new .mdc file for this pattern

Pro tip" Cursor a little bit buggy here. I prefer to do this in Ask mode and copy the result into an mdc file. Sometimes you'll see Cursor show empty files when I do this in Agent mode.

4. Does it work?
Yes. Watch it in action at the end of the video (linked in next tweet).
If you let the AI do its own thing it will invent new patterns. A lot of the code we write is the same thing over and over (e.g. add a form, make an LLM call, add a server action that updates the db, etc.). There's no one right way to write code. But in your project there is. You want the code to be consistent. The code for each form should look more or less the same. Rules help Cursor do this effectively. (Tagging other code examples in your codebase is another way to do this, but .mdc is cleaner and less noise).

5. Is it worth the effort to set up rules?
Yes. It's a minimal, one-time effort to set up a rule. Especially once you have a base to work off of. And they provide value forever.
Cursor Agent is my no 1 employee. Giving it the context it needs to be as effective as possible is well worth the effort.

6. What rules do you use?
So far my rules can be broken down into a few buckets:
a. Code patterns (e.g. add a form, server action, or test)
b. General knowledge (e.g. project structure)
c. Features (e.g. this is what the inbox cleaner does and how it works)

Most of my rules fall under "code patterns". But I'm steadily adding more "feature" rules. I'm often repeating myself over and over to LLMs. I might be using Claude or Anthropic and I can copy paste in these notes now. And of course I can tag these notes in Cursor too.

If you want to see my rules in action, check out my YouTube channel or Inbox Zero GitHub. Links below.

https://github.com/elie222/inbox-zero

https://x.com/elie2222/status/1906985581835419915
