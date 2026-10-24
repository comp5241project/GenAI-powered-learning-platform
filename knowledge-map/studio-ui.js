// Teaching Studio view state. Forms stay mounted when a task is hidden.
(function () {
  const views = ['library', 'concepts', 'relationships', 'questions', 'cases', 'research', 'review'];
  function relatedCounts(draft, conceptId) {
    return {
      relationships: (draft?.relations || []).filter((item) => item.source === conceptId || item.target === conceptId).length,
      questions: (draft?.questions || []).filter((item) => item.topicId === conceptId && !item.archived).length,
      cases: (draft?.events || []).filter((item) => !item.archived && item.links?.some((link) => link.topicId === conceptId)).length,
    };
  }
  window.SkillLoopStudioUI = { views, relatedCounts };
})();
