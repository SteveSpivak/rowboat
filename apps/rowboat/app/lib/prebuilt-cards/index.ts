// Static index of prebuilt workflow templates so they are bundled in Vercel.
// Canonical IDs should match file basenames; aliases keep older links working.

import githubDataToSpreadsheet from './github-data-to-spreadsheet.json';
import interviewScheduler from './interview-scheduler.json';
import meetingPrepAssistant from './meeting-prep-assistant.json';
import redditOnSlack from './reddit-on-slack.json';
import twitterSentiment from './twitter-sentiment.json';
import tweetAssistant from './tweet-assistant.json';
import customerSupport from './customer-support.json';
import githubIssueToSlack from './github-issue-to-slack.json';
import githubPrToSlack from './github-pr-to-slack.json';
import eisenhowerEmailOrganizer from './eisenhower-email-organizer.json';

type PrebuiltTemplate = typeof githubDataToSpreadsheet;

interface PrebuiltTemplateEntry {
  id: string;
  aliases?: string[];
  template: PrebuiltTemplate;
}

const prebuiltTemplateEntries: PrebuiltTemplateEntry[] = [
  { id: 'github-data-to-spreadsheet', template: githubDataToSpreadsheet },
  { id: 'interview-scheduler', template: interviewScheduler },
  { id: 'meeting-prep-assistant', aliases: ['Meeting Prep Assistant'], template: meetingPrepAssistant },
  { id: 'reddit-on-slack', aliases: ['Reddit on Slack'], template: redditOnSlack },
  { id: 'twitter-sentiment', aliases: ['Twitter Sentiment'], template: twitterSentiment },
  { id: 'tweet-assistant', aliases: ['Tweet Assistant'], template: tweetAssistant },
  { id: 'customer-support', aliases: ['Customer Support'], template: customerSupport },
  { id: 'github-issue-to-slack', aliases: ['GitHub Issue to Slack'], template: githubIssueToSlack },
  { id: 'github-pr-to-slack', aliases: ['GitHub PR to Slack'], template: githubPrToSlack },
  { id: 'eisenhower-email-organizer', aliases: ['Eisenhower Email Organizer'], template: eisenhowerEmailOrganizer },
];

function normalizePrebuiltTemplateKey(key: string): string {
  return key
    .trim()
    .replace(/^prebuilt:/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export const prebuiltTemplates = Object.fromEntries(
  prebuiltTemplateEntries.map(({ id, template }) => [id, template]),
) as Record<string, PrebuiltTemplate>;

const prebuiltTemplateLookup = new Map<string, PrebuiltTemplateEntry>();
for (const entry of prebuiltTemplateEntries) {
  const rawKeys = [
    entry.id,
    entry.template.name,
    ...(entry.aliases || []),
  ].filter((value): value is string => Boolean(value));

  for (const rawKey of rawKeys) {
    prebuiltTemplateLookup.set(normalizePrebuiltTemplateKey(rawKey), entry);
  }
}

export function listPrebuiltTemplates(): PrebuiltTemplateEntry[] {
  return prebuiltTemplateEntries.map((entry) => ({ ...entry }));
}

export function resolvePrebuiltTemplate(key: string) {
  return prebuiltTemplateLookup.get(normalizePrebuiltTemplateKey(key)) || null;
}
