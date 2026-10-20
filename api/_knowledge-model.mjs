/** Validation shared by the Vercel function and its dependency-free tests. */
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const relationTypes = new Set(['prerequisite', 'enables', 'supports', 'related']);
const sharedTopicIds = ['foundations', 'requirements', 'code-reading', 'software-testing',
  'communication', 'ai-code-review', 'edge-cases'];

function text(value, name, min = 1, max = 1000) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    throw new Error(`${name} must be ${min}–${max} characters.`);
  }
  return value.trim();
}

function date(value, name) {
  if (typeof value !== 'string' || !datePattern.test(value) ||
      Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error(`${name} must be a date.`);
}

function list(value, name, max) {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${name} must be a list of at most ${max}.`);
  return value;
}

function id(value, name) {
  if (typeof value !== 'string' || !idPattern.test(value)) throw new Error(`${name} has an invalid ID.`);
}

export function validateGraph(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Graph payload is required.');
  const publication = payload.publication;
  if (!publication || typeof publication !== 'object') throw new Error('Publication metadata is required.');
  id(publication.id, 'Publication');
  text(publication.version, 'Publication version', 1, 40);
  text(publication.title, 'Publication title', 2, 160);
  date(publication.publishedAt, 'Publication date');
  const topics = list(payload.topics, 'Topics', 50);
  if (!topics.length) throw new Error('At least one topic is required.');
  const topicIds = new Set();
  for (const topic of topics) {
    id(topic?.id, 'Topic');
    if (topicIds.has(topic.id)) throw new Error(`Duplicate topic: ${topic.id}`);
    topicIds.add(topic.id);
    text(topic.title, 'Topic title', 2, 100);
    text(topic.icon, 'Topic icon', 2, 50);
    text(topic.description, 'Topic description', 5, 280);
    if (!['core', 'extension'].includes(topic.pathRole) || !Number.isInteger(topic.order) || topic.order < 1 || topic.order > 50) throw new Error(`Invalid path for ${topic.id}.`);
    if (!topic.position || !Number.isInteger(topic.position.column) || !Number.isInteger(topic.position.row) ||
        topic.position.column < 1 || topic.position.column > 5 || topic.position.row < 1 || topic.position.row > 20) throw new Error(`Invalid position for ${topic.id}.`);
    for (const field of ['goal', 'explanation', 'example', 'nextAction']) text(topic.lesson?.[field], `Lesson ${field}`, 8, 2000);
    if (topic.practiceHref && (typeof topic.practiceHref !== 'string' || !/^\.\.\/correction-lab\/$/.test(topic.practiceHref))) throw new Error('Practice link is not an approved local route.');
  }
  if (sharedTopicIds.some((topicId) => !topicIds.has(topicId))) throw new Error('A shared concept ID is missing.');
  const relations = list(payload.relations, 'Relations', 150);
  const relationIds = new Set();
  for (const relation of relations) {
    id(relation?.id, 'Relation');
    if (relationIds.has(relation.id)) throw new Error(`Duplicate relation: ${relation.id}`);
    relationIds.add(relation.id);
    if (!topicIds.has(relation.source) || !topicIds.has(relation.target) || relation.source === relation.target || !relationTypes.has(relation.type)) throw new Error(`Invalid endpoints or type for ${relation.id}.`);
    text(relation.reason, 'Relationship reason', 12, 280);
  }
  const events = list(payload.events, 'Events', 20);
  const eventIds = new Set();
  for (const event of events) {
    id(event?.id, 'Event');
    if (eventIds.has(event.id)) throw new Error(`Duplicate event: ${event.id}`);
    eventIds.add(event.id);
    text(event.title, 'Event title', 5, 160);
    text(event.summary, 'Event summary', 20, 1000);
    date(event.date, 'Event date');
    text(event.source?.title, 'Source title', 5, 240);
    try { if (new URL(event.source.url).protocol !== 'https:') throw new Error(); }
    catch { throw new Error('Source URL must use HTTPS.'); }
    date(event.source.publishedDate, 'Source publication date');
    date(event.source.checkedDate, 'Source checked date');
    const claims = list(event.claims, 'Claims', 10);
    if (!claims.length) throw new Error('An event needs a claim.');
    for (const claim of claims) {
      if (!['source-supported', 'teaching-inference'].includes(claim.kind)) throw new Error('Invalid claim kind.');
      text(claim.text, 'Claim', 8, 500);
      if (claim.kind === 'source-supported') text(claim.sourceSection, 'Source section', 3, 100);
    }
    const links = list(event.links, 'Event links', 10);
    if (!links.length) throw new Error('An event needs a concept link.');
    for (const link of links) {
      if (!topicIds.has(link.topicId) || !['application', 'context', 'introduced'].includes(link.kind)) throw new Error('Invalid event link.');
      text(link.reason, 'Event link reason', 12, 280);
    }
  }
  const activities = list(payload.activities, 'Activities', 30);
  const activityIds = new Set();
  for (const activity of activities) {
    id(activity?.id, 'Activity');
    if (activityIds.has(activity.id)) throw new Error(`Duplicate activity: ${activity.id}`);
    activityIds.add(activity.id);
    if (!['relation-judgment', 'scenario-decision'].includes(activity.kind) || !relationIds.has(activity.relationId)) throw new Error('Invalid activity relationship.');
    if (!list(activity.topicIds, 'Activity topics', 5).length || activity.topicIds.some((topicId) => !topicIds.has(topicId))) throw new Error('Invalid activity topic.');
    text(activity.prompt, 'Activity prompt', 10, 600);
    if (list(activity.options, 'Activity options', 4).length < 2 || activity.options.some((option) => typeof option !== 'string' || option.trim().length < 2 || option.length > 240)) throw new Error('Activity needs 2–4 options.');
    if (!Number.isInteger(activity.answerIndex) || activity.answerIndex < 0 || activity.answerIndex >= activity.options.length) throw new Error('Invalid activity answer.');
    text(activity.feedback, 'Activity feedback', 10, 900);
  }
  return payload;
}
