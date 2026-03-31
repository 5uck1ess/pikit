import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Ask-user tool: lets the LLM pause and ask the user a question.
 * Used in workflows when the model needs clarification before proceeding.
 */
export function registerAskUser(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "ask_user",
    description: "Ask the user a question and wait for their response. Use when you need clarification or input before proceeding.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question to ask the user" },
      },
      required: ["question"],
    },
    async execute(args, ctx) {
      if (!ctx.ui?.ask) {
        return "Unable to prompt user in this context.";
      }
      const answer = await ctx.ui.ask(args.question);
      return answer ?? "(no response)";
    },
  });
}
