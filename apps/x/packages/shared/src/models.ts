import { z } from "zod";

export const LlmProvider = z.object({
  flavor: z.enum([
    "openai",
    "anthropic",
    "google",
    "openrouter",
    "aigateway",
    "ollama",
    "openai-compatible",
    "codex-cli",
    "gemini-cli",
    "claude-cli",
  ]),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const LlmModelConfig = z.object({
  provider: LlmProvider,
  model: z.string(),
  models: z.array(z.string()).optional(),
  knowledgeGraphModel: z.string().optional(),
  meetingNotesModel: z.string().optional(),
});
