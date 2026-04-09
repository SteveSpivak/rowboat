import { toJSONSchema } from 'zod';
import { trackBlock } from '@x/shared';

const trackBlockJsonSchema = JSON.stringify(toJSONSchema(trackBlock.TrackBlockSchema), null, 2);

const skill = `
# Create Track Block Skill

You are creating a track block in the user's note. Track blocks define sections that automatically
update themselves when relevant events arrive (emails, meetings, messages).

## Track Block Format

The track block is a code fence with language "track" containing YAML that matches this schema:

\`\`\`json
${trackBlockJsonSchema}
\`\`\`

Example:

\`\`\`track
trackId: trk_acme_updates
instruction: |
  Maintain a summary of the latest developments with Acme Corp,
  including deal status, key decisions, action items, and meeting outcomes.
matchCriteria: |
  Acme Corp: emails, meetings, deal progress, decisions,
  action items, status changes
active: true
\`\`\`

## Rules

- Use workspace-edit to insert the track block at the appropriate position in the note
- Do NOT use executeCommand — shell commands are not available in this context
- Do NOT ask clarifying questions — make reasonable assumptions about what to track
- Generate a descriptive trackId (e.g., "trk_acme_deal", "trk_hiring_pipeline"). Lowercase with underscores.
- Write matchCriteria BROADLY — better to over-match than under-match
- Write instruction SPECIFICALLY — it controls exactly what content is produced
- Read the note first to understand context and find the right insertion point
- Do NOT create the target region (<!--track-target:...-->) — the system creates it automatically
- The content inside the code fence MUST be valid YAML, not JSON
- Use YAML pipe \`|\` for instruction and matchCriteria so they can span multiple lines for readability

## Examples

User: "track updates for Acme Corp"

\`\`\`track
trackId: trk_acme_updates
instruction: |
  Maintain a running summary of the latest developments with Acme Corp,
  including deal status, key decisions, action items, and meeting outcomes.
matchCriteria: |
  Acme Corp: emails, meetings, deal progress, decisions,
  action items, status changes
active: true
\`\`\`

User: "monitor hiring pipeline"

\`\`\`track
trackId: trk_hiring_pipeline
instruction: |
  Track the current state of the hiring pipeline including open roles,
  candidates in progress, interview outcomes, and offers.
matchCriteria: |
  Hiring: candidates, interviews, offers, job postings,
  recruiting updates, new hires
active: true
\`\`\`
`;

export default skill;
