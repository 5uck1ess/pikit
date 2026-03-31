import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "./frontmatter.js";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter with key-value pairs", () => {
    const input = `---
name: my-skill
description: A cool skill
---
Body content here.`;
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs.name).toBe("my-skill");
    expect(attrs.description).toBe("A cool skill");
    expect(body).toBe("Body content here.");
  });

  it("returns empty attrs and full body when no frontmatter", () => {
    const input = "Just some text without frontmatter.";
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs).toEqual({});
    expect(body).toBe(input);
  });

  it("returns empty attrs and full body for malformed YAML (no closing ---)", () => {
    const input = `---
name: broken
This never closes`;
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs).toEqual({});
    expect(body).toBe(input);
  });

  it("handles empty body after frontmatter", () => {
    const input = `---
title: empty-body
---`;
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs.title).toBe("empty-body");
    expect(body).toBe("");
  });

  it("handles leading whitespace before frontmatter", () => {
    const input = `
---
key: value
---
Content`;
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs.key).toBe("value");
    expect(body).toBe("Content");
  });

  it("handles values with colons", () => {
    const input = `---
url: https://example.com
---
Body`;
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs.url).toBe("https://example.com");
  });

  it("handles empty frontmatter block", () => {
    const input = `---
---
Body`;
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs).toEqual({});
    expect(body).toBe("Body");
  });

  it("handles multiple key-value pairs", () => {
    const input = `---
a: 1
b: 2
c: 3
---
text`;
    const { attrs, body } = parseFrontmatter(input);
    expect(attrs.a).toBe("1");
    expect(attrs.b).toBe("2");
    expect(attrs.c).toBe("3");
  });
});
