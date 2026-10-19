/** Course content for module 1. Keep IDs stable: the learning-path module links to them. */
window.SkillLoopTopics = [
  {
    id: 'foundations', title: 'Foundations', icon: 'blocks',
    description: 'From an idea to a working application.',
    lesson: 'Start with a specific user need. Describe what the application should do, choose a small first version, implement it, and check the result against the original request. Development includes requirements, design, implementation, testing and deployment.',
  },
  {
    id: 'requirements', title: 'Requirements', icon: 'list-checks',
    description: 'Turn an idea into clear requirements.',
    lesson: 'A request such as “help me manage assignments” leaves many questions open. Ask who will use it, what information each assignment needs, and which actions matter most. Write acceptance criteria, such as “a student can add a title and deadline, then mark an assignment complete.”',
  },
  {
    id: 'code-reading', title: 'Code reading', icon: 'code-xml',
    description: 'Predict behavior. Explain what the code does.',
    lesson: 'Identify the inputs and expected outputs before running a program. Trace one example through the code, including branches and loops. Predict the output, run the example, and investigate any difference between the prediction and the result.',
  },
  {
    id: 'software-testing', title: 'Software testing', icon: 'flask-conical',
    description: 'Check behavior, not just whether code runs.',
    lesson: 'Running without an error does not prove that a program is correct. Compare actual and expected results. Include ordinary inputs, empty inputs, boundary values and invalid inputs. An average function, for example, needs a defined rule for an empty list.',
  },
  {
    id: 'communication', title: 'Communication', icon: 'messages-square',
    description: 'Ask better questions. Explain your decisions.',
    lesson: 'Clarify the user and scenario before proposing a solution. Ask about priorities and constraints, explain the options you considered, and check that both sides agree on what success means. In an interview, explain your assumptions and approach as well as your final answer.',
  },
  {
    id: 'ai-code-review', title: 'AI code review', icon: 'scan-line',
    description: 'Challenge assumptions in generated code.',
    lesson: 'Compare generated code with the actual requirements. Check the assumptions it makes, the cases it omits, and the APIs it uses. Create a counterexample and use tests or documentation to verify a proposed fix. A confident explanation is not evidence that the code is correct.',
  },
  {
    id: 'edge-cases', title: 'Edge cases', icon: 'split',
    description: 'Explore empty, extreme and invalid inputs.',
    lesson: 'Consider the boundaries of the input: no items, one item, repeated items, and values at the allowed minimum or maximum. Also consider invalid types. State what should happen for each input before checking the implementation.',
  },
];
