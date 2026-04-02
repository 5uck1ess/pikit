import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Ask-user tool: lets the LLM pause and ask the user a question.
 * Used in workflows when the model needs clarification before proceeding.
 */
export function registerAskUser(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "ask_user",
    label: "Ask User",
    description: "Ask the user a question and wait for their response. Use when you need clarification or input before proceeding.",
    parameters: Type.Object({
      question: Type.String({ description: "The question to ask the user" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const answer = await ctx.ui.input(params.question);
      return {
        content: [{ type: "text", text: answer ?? "(no response)" }],
      };
    },
  });
}
