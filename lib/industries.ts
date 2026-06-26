/**
 * Industry registry.
 * 
 * This file contains ONLY static metadata used for the signu dropdown
 * and validation. There are no hardcoded persona promts here.
 * 
 * Persona prompts are generated dynamically by Groq at runtime - 
 * see lib/persona-generator.ts.
 */

export type IndustryKey =
  | "pharma"
  | "education"
  | "infrastructure"
  | "retail"
  | "finance"
  | "general";

export type IndustryDefinition = {
  key: IndustryKey;
  label: string;
  emoji: string;
  /** Short description shown in the dropdown */
  description: string;
  /** Injected into the RAG system prompt to shape the bot's behaviour */
  // persona: string;
};

export const INDUSTRIES: IndustryDefinition[] = [
  {
    key: "pharma",
    label: "Pharma & Healthcare",
    emoji: "💊",
    description: "Medicines, clinical services, hospitals, pharmacies",
  },
  {
    key: "education",
    label: "Education",
    emoji: "🎓",
    description: "Schools, colleges, universities, ed-tech",
  },
  {
    key: "infrastructure",
    label: "Infrastructure & Construction",
    emoji: "🏗️",
    description: "Real estate, construction, civil engineering, EPC",
  },
  {
    key: "retail",
    label: "Retail & E-commerce",
    emoji: "🛍️",
    description: "Stores, brands, online shopping",
  },
  {
    key: "finance",
    label: "Finance & Banking",
    emoji: "🏦",
    description: "Banks, NBFCs, fintech, insurance, investment",
  },
  {
    key: "general",
    label: "Other / General Business",
    emoji: "🏢",
    description: "Anything else not listed above",
  },
];

export const INDUSTRY_MAP: Record<IndustryKey, IndustryDefinition> =
  Object.fromEntries(INDUSTRIES.map((i) => [i.key, i])) as Record<
    IndustryKey,
    IndustryDefinition
  >;

export function isValidIndustry(value: string): value is IndustryKey {
  return value in INDUSTRY_MAP;
}

export function getIndustryLabel(industry: string): string {
  return INDUSTRY_MAP[industry as IndustryKey]?.label ?? industry;
}
