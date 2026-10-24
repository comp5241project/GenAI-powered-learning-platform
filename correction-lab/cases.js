/**
 * Authored correction cases for module 4, grouped by course topic. Explanations and evidence are
 * written by hand; nothing here is executed or graded. Keep case IDs stable: saved progress and
 * activity use them. conceptId must be one of the shared concept IDs in docs/DATA-CONTRACTS.md.
 * fluency names the AI Fluency competency a case practises (Delegation, Description,
 * Discernment or Diligence). format 'text' shows the material as prose instead of code.
 */
window.SkillLoopCases = [
  {
    id: 'average-empty-list',
    topic: 'Software fundamentals',
    name: 'Average of a list',
    kind: 'Code',
    conceptId: 'edge-cases',
    title: 'Does this handle every list?',
    code: `def average(numbers):
    return sum(numbers) / len(numbers)

# AI: "This handles any list."`,
    prompt: 'What input breaks this assumption?',
    reference: {
      title: 'Counterexample: []',
      text: 'An empty list causes division by zero. Define the empty-input rule before calculating.',
      evidence: 'average([]) raises ZeroDivisionError: division by zero.',
    },
    criteria: [
      'Names an input that breaks the claim, such as []',
      'Explains why it fails: len(numbers) is 0',
      'Chooses a rule for empty input, such as raising a clear error or returning None',
      'Adds a test for the empty case',
    ],
    followUp: 'A function returns items[0]. What inputs would you test, and why?',
  },
  {
    id: 'password-boundary',
    topic: 'Software fundamentals',
    name: 'Password length',
    kind: 'Requirement',
    conceptId: 'requirements',
    title: 'Does this match the requirement?',
    code: `# Requirement: passwords must be at least 8 characters.
def is_valid_password(password):
    return len(password) > 8

# AI: "This enforces the 8-character minimum."`,
    prompt: 'Which password would show the gap between the code and the requirement?',
    reference: {
      title: 'Boundary: exactly 8 characters',
      text: 'An 8-character password meets the requirement but is rejected, because > 8 excludes 8. Use >= 8, and test lengths on both sides of the boundary.',
      evidence: "is_valid_password('abcdefgh') returns False, but the requirement expects True.",
    },
    criteria: [
      'Names a password with exactly 8 characters',
      'Explains that > excludes the boundary value',
      'Changes the check to len(password) >= 8',
      'Tests lengths 7, 8 and 9',
    ],
    followUp: 'The requirement adds "at most 64 characters". Which lengths would you test, and why?',
  },
  {
    id: 'passing-test-no-assert',
    topic: 'Software fundamentals',
    name: 'Passing tests',
    kind: 'Testing',
    conceptId: 'software-testing',
    title: 'Is this change ready to merge?',
    code: `$ pytest
tests/test_discount.py .        1 passed

# tests/test_discount.py
def test_discount():
    apply_discount(100, 0.2)

# AI: "All tests pass, so this change is ready to merge."`,
    prompt: 'What does the passing test actually prove? What would you ask for before merging?',
    reference: {
      title: 'The test checks nothing',
      text: 'The test calls apply_discount but has no assertion, so it passes even when the result is wrong. A passing test is evidence only if it checks the expected behaviour.',
      evidence: 'If apply_discount always returned 0, pytest would still report 1 passed.',
    },
    criteria: [
      'Notices that the test has no assertion',
      'Explains why "tests pass" is not enough evidence here',
      'Adds an expected value, such as assert apply_discount(100, 0.2) == 80',
      'Asks for more cases, such as a 0 rate or an invalid rate, before merging',
    ],
    followUp:
      'A pull request reports 100% line coverage. What could still be wrong, and how would you check?',
  },
  {
    id: 'vague-agent-request',
    topic: 'AI coding agents',
    name: 'Vague request',
    kind: 'Prompt',
    fluency: 'Description',
    conceptId: 'requirements',
    title: 'Why did the agent change so much?',
    format: 'text',
    code: `You → coding agent:
"Make the login page better."

Agent:
"Done! I redesigned the page, switched to a new CSS framework, renamed the /auth API routes for consistency and updated 23 files."`,
    prompt: 'What was missing from the request? Rewrite it.',
    reference: {
      title: 'No goal, limits or definition of done',
      text: '"Better" gives the agent nothing to aim for, so it guessed and changed far more than needed. Describe the problem, the scope it may touch, the constraints to keep, and how you will check the result. Asking for a plan before edits also helps.',
      label: 'Better request',
      evidence:
        '"On the login page, users cannot tell why sign-in failed. Show a clear message for a wrong password and for an unknown email. Only change login.html and login.js. Do not add dependencies or rename API routes. Done when both messages appear and existing tests pass. Show me your plan first."',
    },
    criteria: [
      'Points out that "better" is not a goal the agent can check',
      'Limits the scope: which files or features may change',
      'States constraints, such as no new dependencies and stable API routes',
      'Says how the result will be checked, or asks for a plan first',
    ],
    followUp:
      'Write a request asking an agent to add a "forgot password" link. Include the goal, scope, constraints and how you will check it.',
  },
  {
    id: 'agent-edits-test',
    topic: 'AI coding agents',
    name: 'Agent "fixed" a test',
    kind: 'Code review',
    fluency: 'Discernment',
    conceptId: 'software-testing',
    title: 'Did the agent fix the bug?',
    code: `# You: "Fix the failing test in test_cart.py."
# Agent's change:
  def test_add_two_pens():
      cart = Cart()
      cart.add('pen', qty=2)
-     assert cart.count() == 2
+     assert cart.count() == 1

# Agent: "Fixed. All tests pass now."`,
    prompt: 'Read the diff. What did the agent really change, and what should happen instead?',
    reference: {
      title: 'The test was changed to match the bug',
      text: 'Adding two pens should give a count of 2. The agent changed the expected value instead of fixing Cart, so the bug is now hidden by a passing test. Review the diff, not only the result: the fix belongs in the code under test.',
      evidence: 'The diff only touches the test file. Cart.count() still counts entries, not quantities.',
    },
    criteria: [
      'Notices that only the test changed',
      'Explains that the original expectation of 2 was correct',
      'Says the fix belongs in Cart.count()',
      'Tells the agent not to edit tests unless the requirement changed',
    ],
    followUp:
      'Next time you hand a failing test to an agent, what would you delegate to it, and what would you check yourself?',
  },
  {
    id: 'api-key-in-client',
    topic: 'AI coding agents',
    name: 'Key in the browser',
    kind: 'Code',
    fluency: 'Diligence',
    conceptId: 'ai-code-review',
    title: 'Is this safe to deploy?',
    code: `// script.js — runs in every visitor's browser
const API_KEY = 'sk-example-not-a-real-key';

fetch('https://api.example.com/v1/chat', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${API_KEY}\` },
  body: JSON.stringify({ prompt }),
});

// Agent: "AI feedback works. I tested it and committed the change."`,
    prompt: 'Who can see this key, and how would you fix it?',
    reference: {
      title: 'The secret key is public',
      text: 'Browser code is sent to every visitor, so anyone can read the key in developer tools, and it is now in the Git history too. Call the AI service from a server or serverless function that reads the key from an environment variable, and revoke the exposed key.',
      evidence:
        'DevTools → Sources shows the full key. git log -p still shows it after the line is deleted.',
    },
    criteria: [
      'Spots that anyone using the site can read the key',
      'Moves the call behind a server or serverless function',
      'Keeps the key in an environment variable, outside Git',
      'Revokes or rotates the key that was exposed',
    ],
    followUp:
      'Write a short checklist an agent should follow before committing code that calls an external API.',
  },
  {
    id: 'vague-status-update',
    topic: 'Soft and product skills',
    name: 'Status update',
    kind: 'Communication',
    conceptId: 'communication',
    title: 'Does this update help the team?',
    format: 'text',
    code: `Team chat, two days before the demo.

AI-drafted update:
"Everything is basically done! Just a few small issues left, nothing major. Should be fine for the demo."`,
    prompt: 'What would your teammates still not know after reading this?',
    reference: {
      title: 'No facts, no blocker, no request',
      text: 'Teammates cannot tell what works, what is left or whether they need to help. A useful update says what is done, what remains with an estimate, any blocker, and what you need from whom.',
      label: 'Better version',
      evidence:
        '"Done: case switching and saved progress. Left: phone layout, about 2 hours. Blocked: I cannot push to the repo. Could someone add me as a collaborator today?"',
    },
    criteria: [
      'Points out that "basically done" and "small issues" cannot be checked',
      'Lists what is done and what is left',
      'Names any blocker and who can help',
      'Gives a time estimate or next step',
    ],
    followUp:
      'The demo will slip by one day. Write two sentences telling your team, with the reason and your next step.',
  },
  {
    id: 'vague-user-story',
    topic: 'Soft and product skills',
    name: 'User story',
    kind: 'Product',
    conceptId: 'requirements',
    title: 'Could a team build and test this?',
    format: 'text',
    code: `AI-generated user story for SkillLoop:

"As a user, I want AI features so that the app is smarter."

Acceptance criteria: "The AI works well."`,
    prompt: 'Who is the user, what do they need, and how would you know it is done?',
    reference: {
      title: 'No real user, need or test',
      text: '"A user" and "AI features" do not say who has which problem, and "works well" cannot be checked. Name a specific learner, the problem they face and the outcome they want, then write criteria someone could test.',
      label: 'Better version',
      evidence:
        '"As a non-CS student preparing for an internship, I want feedback on my code-review answer, so that I know what I missed. Done when: feedback appears within 10 seconds and names at least one point I missed."',
    },
    criteria: [
      'Names a specific user instead of "a user"',
      'States their problem and goal',
      'Writes acceptance criteria someone can test',
      'Starts from the need, not from "AI features"',
    ],
    followUp:
      'Write one user story for a CS graduate preparing for interviews, with two testable acceptance criteria.',
  },
  {
    id: 'harsh-review-comment',
    topic: 'Soft and product skills',
    name: 'Review comment',
    kind: 'Communication',
    conceptId: 'communication',
    title: 'Can the author act on this comment?',
    format: 'text',
    code: `Pull request: "Add password validation"

AI-suggested review comment:
"This is wrong. Did you even test it? Rewrite the whole function."`,
    prompt: 'How would you rewrite this comment so the author knows what to do?',
    reference: {
      title: 'It blames, but does not help',
      text: 'The comment judges the author and does not say what is wrong or how to fix it. A good review comment points to a specific line, explains the problem with an example, suggests a fix and stays about the code.',
      label: 'Better version',
      evidence:
        '"Line 3: len(password) > 8 rejects an 8-character password, but the requirement says at least 8. Could we use >= 8 and add tests for lengths 7, 8 and 9?"',
    },
    criteria: [
      'Removes blame and judgement of the person',
      'Points to a specific line or behaviour',
      'Explains the problem with an example input',
      'Suggests a concrete fix or asks a clear question',
    ],
    followUp:
      "A teammate's code works but is hard to read. Write a review comment that is honest and kind.",
  },
];
