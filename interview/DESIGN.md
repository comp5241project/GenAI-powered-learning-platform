# Interview studio design

The interview is a course activity: choose a focus, explain an approach, explore a scenario change, then revisit the answer. The interface keeps one question prominent and defers history and configuration until needed.

## References

These references inform interaction patterns. Their branding, illustrations and screen layouts are not included in this repository.

| Reference                                                   | Verified award                           | Adaptation in this module                                                                                                                            |
| ----------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CapWords](https://developer.apple.com/design/awards/2025/) | Apple Design Award 2025, Delight and Fun | A small action reveals useful new information. Strategy cards reveal an authored scenario consequence rather than adding a decorative points system. |
| [Crouton](https://developer.apple.com/design/awards/2024/)  | Apple Design Award 2024, Interaction     | One step and one primary action at a time; earlier answers and activity settings are secondary.                                                      |
| [Rytmos](https://developer.apple.com/design/awards/2024/)   | Apple Design Award 2024, Interaction     | Progress builds gradually. A three-step path fills as the learner contributes, and the complete conversation is assembled at the end.                |

The adaptations above are our design decisions, not claims that these products implement interview activities or prove learning gains.

## Clarity and learning

- [Amershi et al., Guidelines for Human-AI Interaction, CHI 2019](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/): set expectations about capability and quality. The entry explains the task, input method and output; a visible demo note identifies preset questions and self-review. No AI score is implied.
- [W3C WAI, Multi-page Forms](https://www.w3.org/WAI/tutorials/forms/multi-page/) and [clear step-by-step instructions](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/): expose the sequence, current step and optional actions. The page shows Choose a topic / Answer 3 questions / Review & improve, explicit question counts, nearby writing instructions and destination-specific buttons. Practice is untimed.
- [Nielsen, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/?lm=listbox-dropdown&pt=article): defer secondary controls. Scenario choices are optional help; custom activity tools and earlier answers are collapsed. The answer field remains the main task.

These principles guide the interface; they do not establish that this prototype improves interview performance. Revisions and reflection are optional. The three questions concern software-development decisions, evidence and trade-offs, rather than a generic personality quiz or decorative game.

## Walkthrough iterations

The following are developer walkthroughs using a local browser, not participant usability studies.

| Pass                | Task and observation                                                                                                                                                                                                   | Change                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First use           | Complete three answers, revise one, finish. Abstract opening copy and no clear ending made the task difficult to explain.                                                                                              | Concrete entry instructions, visible journey, next-question labels, numbered review answers, Done and a saved confirmation.                                                                          |
| Resume              | Choose a scenario, answer once, save a second draft, exit, reload, continue and reopen the review. The opening did not say where a saved session continued; restoring could show a misleading new-answer confirmation. | Show the resumed question number and only announce a newly saved answer after submission. Give hint controls explicit Show / Hide states.                                                            |
| Mobile and revision | Complete a different topic at 390px and 320px, revise the second answer, finish and change topic. Reopening the first answer after a later revision lengthened the review; the two progress trails competed on phones. | Keep only the edited answer expanded after saving. Show the overall journey and current question count on small screens, hide the redundant side trail, and use larger touch targets and input text. |

Final browser checks cover scenario branches, draft/hint persistence, three-question completion, original/revised comparison, review persistence, export, custom activity isolation, narrow layouts, course/version context, legacy import, corrupt storage and blocked storage. Real student and instructor feedback remains the next validation step.

## Boundaries

- Reuse SkillLoop's warm white, charcoal, terracotta and gold colours and its local Lucide icons.
- Use native buttons, text fields, details and dialog controls. Every strategy can be selected with a keyboard; drag gestures are unnecessary.
- Strategy choices, hint use, original submissions, revisions and reflection belong to the practice record. Checkboxes are self-review, not automatically inferred mastery.
- Keep sample mode visible. Authored branches are not a connected AI interviewer.
- Course context is data, separate from page styling and sample content. Activity settings are local drafts, not an instructor account or publishing system.
- Respect reduced motion. Do not add a countdown, sound, streak penalties or random scores to this activity.
