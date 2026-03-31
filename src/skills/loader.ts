import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "../core/frontmatter.js";

export interface SkillSummary {
  name: string;
  description: string;
  dir: string;
}

export interface SkillFull extends SkillSummary {
  body: string;
  references: string[];
}

/**
 * Scan a skills directory for SKILL.md files.
 * Returns lightweight summaries (name + description only).
 */
export function discoverSkills(skillsDir: string): SkillSummary[] {
  if (!existsSync(skillsDir)) return [];
  const results: SkillSummary[] = [];

  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(skillsDir, entry.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    const raw = readFileSync(skillFile, "utf-8");
    const { attrs } = parseFrontmatter(raw);
    results.push({
      name: (attrs.name as string) ?? entry.name,
      description: (attrs.description as string) ?? "",
      dir: join(skillsDir, entry.name),
    });
  }

  return results;
}

/**
 * Load the full content of a skill on demand.
 * Called when the model actually needs the skill's content.
 */
export function loadSkill(dir: string): SkillFull | null {
  const skillFile = join(dir, "SKILL.md");
  if (!existsSync(skillFile)) return null;

  const raw = readFileSync(skillFile, "utf-8");
  const { attrs, body } = parseFrontmatter(raw);

  // Discover reference files
  const refsDir = join(dir, "references");
  const references: string[] = [];
  if (existsSync(refsDir)) {
    for (const f of readdirSync(refsDir)) {
      if (f.endsWith(".md")) references.push(join(refsDir, f));
    }
  }

  return {
    name: (attrs.name as string) ?? "",
    description: (attrs.description as string) ?? "",
    dir,
    body,
    references,
  };
}

/**
 * Load skills from multiple directories.
 * Core skills (.pi/skills/) come first, then local (.pikit/skills/).
 */
export function discoverAllSkills(dirs: string[]): SkillSummary[] {
  const all: SkillSummary[] = [];
  const seen = new Set<string>();
  for (const dir of dirs) {
    for (const skill of discoverSkills(dir)) {
      if (seen.has(skill.name)) continue;
      seen.add(skill.name);
      all.push(skill);
    }
  }
  return all;
}
