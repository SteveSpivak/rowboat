import { Agent, ToolAttachment } from "@x/shared/dist/agent.js";
import z from "zod";
import { buildCopilotInstructions } from "./instructions.js";
import { BuiltinTools } from "../lib/builtin-tools.js";

/**
 * Build the CopilotAgent dynamically.
 * Tools are derived from the current BuiltinTools (which include Composio meta-tools),
 * and instructions include the live Composio connection status.
 */
export async function buildCopilotAgent(): Promise<z.infer<typeof Agent>> {
    const tools: Record<string, z.infer<typeof ToolAttachment>> = {};
    for (const name of Object.keys(BuiltinTools)) {
        tools[name] = { type: "builtin", name };
    }
    const instructions = await buildCopilotInstructions();
    return {
        name: "rowboatx",
        description: "Rowboatx copilot",
        instructions,
        tools,
    };
}

export const CopilotAgent: z.infer<typeof Agent> = {
    name: "rowboatx",
    description: "Rowboatx copilot",
    instructions: CopilotInstructions,
    tools,
}

const BACKGROUND_PREAMBLE = `# Background Mode

You are running as a background task — there is no user present to answer questions.

Rules for background mode:
- Do NOT ask clarifying questions — make reasonable assumptions
- Do NOT use executeCommand — shell commands are not available in this context
- DO use workspace tools freely (readFile, writeFile, edit, grep, glob, etc.)
- DO use loadSkill if you need specialized guidance
- Be concise and action-oriented — just do the work

`;

const backgroundTools: Record<string, z.infer<typeof ToolAttachment>> = {};
for (const name of Object.keys(BuiltinTools)) {
    if (name === 'executeCommand') continue;
    backgroundTools[name] = {
        type: "builtin",
        name,
    };
}

export const CopilotBackgroundAgent: z.infer<typeof Agent> = {
    name: "copilot-background",
    description: "Copilot running in background mode (no user interaction)",
    instructions: BACKGROUND_PREAMBLE + CopilotInstructions,
    tools: backgroundTools,
}
