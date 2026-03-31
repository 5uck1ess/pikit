import { describe, it, expect } from "vitest";
import { extractQA } from "./extract.js";

describe("extractQA", () => {
  it("extracts Q: ... A: ... pattern", () => {
    const text = `Q: What is TypeScript?
A: A typed superset of JavaScript.`;
    const pairs = extractQA(text);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].question).toBe("What is TypeScript?");
    expect(pairs[0].answer).toBe("A typed superset of JavaScript.");
  });

  it("extracts **Q:** ... **A:** ... pattern", () => {
    const text = `**Q:** What is Rust?
**A:** A systems programming language.`;
    const pairs = extractQA(text);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].question).toBe("What is Rust?");
    expect(pairs[0].answer).toBe("A systems programming language.");
  });

  it("extracts Question: ... Answer: ... pattern", () => {
    const text = `Question: What is Go?
Answer: A language by Google.`;
    const pairs = extractQA(text);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].question).toBe("What is Go?");
    expect(pairs[0].answer).toBe("A language by Google.");
  });

  it("returns empty array when no matches", () => {
    const text = "This is just a normal paragraph with no Q&A.";
    expect(extractQA(text)).toEqual([]);
  });

  it("extracts multiple Q&A pairs", () => {
    const text = `Q: First question?
A: First answer.
Q: Second question?
A: Second answer.`;
    const pairs = extractQA(text);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].question).toBe("First question?");
    expect(pairs[0].answer).toBe("First answer.");
    expect(pairs[1].question).toBe("Second question?");
    expect(pairs[1].answer).toBe("Second answer.");
  });

  it("handles empty string", () => {
    expect(extractQA("")).toEqual([]);
  });

  it("handles mixed patterns", () => {
    const text = `Q: Plain question?
A: Plain answer.
**Q:** Bold question?
**A:** Bold answer.`;
    const pairs = extractQA(text);
    expect(pairs).toHaveLength(2);
  });
});
