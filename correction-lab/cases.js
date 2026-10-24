/**
 * Authored correction cases for module 4. Explanations and expected results are written by hand;
 * nothing here is executed or graded. Keep case IDs stable: saved progress and activity use them.
 * conceptId must be one of the shared concept IDs in docs/DATA-CONTRACTS.md.
 */
window.SkillLoopCases = [
  {
    id: 'average-empty-list',
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
    name: 'Password length',
    kind: 'Code',
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
    id: 'sum-skips-first',
    name: 'Total of prices',
    kind: 'Code',
    conceptId: 'code-reading',
    title: 'Does this add every price?',
    code: `def total(prices):
    result = 0
    for i in range(1, len(prices)):
        result += prices[i]
    return result

# AI: "This adds up every price."`,
    prompt: 'Which list gives a wrong total? Trace the loop.',
    reference: {
      title: 'Counterexample: [5]',
      text: 'range(1, len(prices)) starts at index 1, so the first price is never added. Start at 0, or use sum(prices) directly.',
      evidence: 'total([5]) returns 0 and total([2, 3]) returns 3.',
    },
    criteria: [
      'Names a list where the first price matters, such as [5]',
      'Points to the loop starting at index 1',
      'Fixes the range or replaces the loop with sum(prices)',
      'Adds a test with a single item',
    ],
    followUp: 'A loop uses range(len(items) - 1). Which item does it miss, and what test would reveal it?',
  },
  {
    id: 'passing-test-no-assert',
    name: 'Passing tests',
    kind: 'Workflow',
    conceptId: 'ai-code-review',
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
    followUp: 'A pull request reports 100% line coverage. What could still be wrong, and how would you check?',
  },
];
