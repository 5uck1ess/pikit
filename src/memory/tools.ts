import * as store from "./store.js";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getCwd } from "../core/context.js";

export function registerMemoryTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "memory_set",
    description: "Store a key-value pair in a named store. Creates the store if it doesn't exist.",
    parameters: {
      type: "object",
      properties: {
        store: { type: "string", description: "Store name" },
        key: { type: "string", description: "Key to set" },
        value: { type: "string", description: "Value to store" },
      },
      required: ["store", "key", "value"],
    },
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      store.set(cwd, args.store, args.key, args.value);
      return `Stored "${args.key}" in ${args.store}`;
    },
  });

  pi.registerTool({
    name: "memory_get",
    description: "Retrieve a value by key from a named store.",
    parameters: {
      type: "object",
      properties: {
        store: { type: "string", description: "Store name" },
        key: { type: "string", description: "Key to retrieve" },
      },
      required: ["store", "key"],
    },
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      const val = store.get(cwd, args.store, args.key);
      return val ?? `Key "${args.key}" not found in ${args.store}`;
    },
  });

  pi.registerTool({
    name: "memory_list",
    description: "List all stores, or all keys in a specific store.",
    parameters: {
      type: "object",
      properties: {
        store: { type: "string", description: "Store name (omit to list all stores)" },
      },
    },
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      if (!args.store) {
        const stores = store.listStores(cwd);
        return stores.length ? stores.join("\n") : "No stores found.";
      }
      const k = store.keys(cwd, args.store);
      return k.length ? k.join("\n") : `Store "${args.store}" is empty or doesn't exist.`;
    },
  });

  pi.registerTool({
    name: "memory_delete",
    description: "Delete a key from a store, or delete an entire store.",
    parameters: {
      type: "object",
      properties: {
        store: { type: "string", description: "Store name" },
        key: { type: "string", description: "Key to delete (omit to delete entire store)" },
      },
      required: ["store"],
    },
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      if (!args.key) {
        return store.deleteStore(cwd, args.store)
          ? `Deleted store "${args.store}"`
          : `Store "${args.store}" not found`;
      }
      const old = store.remove(cwd, args.store, args.key);
      return old !== null
        ? `Deleted "${args.key}" from ${args.store}`
        : `Key "${args.key}" not found in ${args.store}`;
    },
  });
}
