import { GenerationCandidate } from "../models/generation-candidate.model.js";

export const queueTarget = 10;

const concepts = [
  ["Noir Analytics Blocks", "dashboard", "charts, metrics, and tables"],
  ["Carbon Commerce Flow", "ui-kit", "catalog, cart, and checkout screens"],
  ["Archive Editorial System", "landing-page", "type-led launch sections"],
  ["Mono Mobile Patterns", "mobile-ui", "focused mobile product flows"],
  ["Obsidian Token Library", "design-system", "semantic tokens and states"],
  ["Signal AI Workspace", "dashboard", "prompt, history, and agent panels"],
  ["Atelier Portfolio Kit", "landing-page", "case-study storytelling blocks"],
  ["Ledger Finance Mobile", "mobile-ui", "accounts and transaction flows"],
  ["Foundry Form System", "design-system", "accessible inputs and validation"],
  ["Index SaaS Starter", "ui-kit", "auth, billing, and settings screens"],
  ["Slate CRM Console", "dashboard", "pipeline and account management"],
  ["Museum Content Frames", "landing-page", "gallery and exhibit layouts"],
] as const;

/** Restores the ready-to-publish generation queue to its target size. */
export async function ensureGenerationQueue(): Promise<void> {
  const count = await GenerationCandidate.countDocuments();
  if (count >= queueTarget) return;

  const timestamp = Date.now();
  const needed = queueTarget - count;
  const candidates = Array.from({ length: needed }, (_, index) => {
    const concept = concepts[(count + index) % concepts.length] ?? concepts[0];
    const [title, category, detail] = concept;
    return {
      title: `${title} ${String(timestamp + index).slice(-3)}`,
      description: `A generated monochrome Figma concept covering ${detail}.`,
      tags: [category, "monochrome", "figma"],
      suggestedCategorySlug: category,
      previewVariant: ((count + index) % 6) + 1,
      sourceLabel: "LayerLab Generator",
      sourceUrl: "https://www.figma.com/templates/",
      generationNote: "Generated from LayerLab's grayscale component recipe.",
    };
  });
  await GenerationCandidate.insertMany(candidates);
}
