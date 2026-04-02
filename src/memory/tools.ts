import { Type } from "@sinclair/typebox";
import * as store from "./store.js";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export function registerMemoryTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "memory_set",
    label: "Memory Set",
    description: "Store a key-value pair in a named store. Creates the store if it doesn't exist.",
    parameters: Type.Object({
      store: Type.String({ description: "Store name" }),
      key: Type.String({ description: "Key to set" }),
      value: Type.String({ description: "Value to store" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      store.set(ctx.cwd, params.store, params.key, params.value);
      return {
        content: [{ type: "text", text: `Stored "${params.key}" in ${params.store}` }],
      };
    },
  });

  pi.registerTool({
    name: "memory_get",
    label: "Memory Get",
    description: "Retrieve a value by key from a named store.",
    parameters: Type.Object({
      store: Type.String({ description: "Store name" }),
      key: Type.String({ description: "Key to retrieve" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const val = store.get(ctx.cwd, params.store, params.key);
      return {
        content: [{ type: "text", text: val ?? `Key "${params.key}" not found in ${params.store}` }],
      };
    },
  });

  pi.registerTool({
    name: "memory_list",
    label: "Memory List",
    description: "List all stores, or all keys in a specific store.",
    parameters: Type.Object({
      store: Type.Optional(Type.String({ description: "Store name (omit to list all stores)" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!params.store) {
        const stores = store.listStores(ctx.cwd);
        return {
          content: [{ type: "text", text: stores.length ? stores.join("\n") : "No stores found." }],
        };
      }
      const k = store.keys(ctx.cwd, params.store);
      return {
        content: [{ type: "text", text: k.length ? k.join("\n") : `Store "${params.store}" is empty or doesn't exist.` }],
      };
    },
  });

  pi.registerTool({
    name: "memory_delete",
    label: "Memory Delete",
    description: "Delete a key from a store, or delete an entire store.",
    parameters: Type.Object({
      store: Type.String({ description: "Store name" }),
      key: Type.Optional(Type.String({ description: "Key to delete (omit to delete entire store)" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!params.key) {
        const ok = store.deleteStore(ctx.cwd, params.store);
        return {
          content: [{ type: "text", text: ok ? `Deleted store "${params.store}"` : `Store "${params.store}" not found` }],
        };
      }
      const old = store.remove(ctx.cwd, params.store, params.key);
      return {
        content: [{ type: "text", text: old !== null ? `Deleted "${params.key}" from ${params.store}` : `Key "${params.key}" not found in ${params.store}` }],
      };
    },
  });
}
