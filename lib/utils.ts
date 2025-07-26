import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { Tool } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Nettoie une URL des entités HTML et caractères de contrôle dangereux
 */
function sanitizeUrl(url: string): string {
  return (
    url
      // Supprimer les entités HTML
      .replace(/&#x([0-9a-f]+);?/gi, "") // Entités hexadécimales comme &#x09;
      .replace(/&#(\d+);?/g, "") // Entités décimales comme &#9;
      .replace(/&[a-z]+;?/gi, "") // Entités nommées comme &tab;
      // Supprimer les caractères de contrôle non imprimables
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      .trim()
  );
}

/**
 * Valide une URL de manière sécurisée avec allowlist des protocoles
 */
function validateUrlSafety(url: string): { isValid: boolean; error?: string } {
  try {
    // 1. Décoder l'URL si elle est encodée
    const decodedUrl = decodeURIComponent(url);

    // 2. Nettoyer les entités HTML et caractères dangereux
    const sanitizedUrl = sanitizeUrl(decodedUrl);

    // 3. Valider avec le constructeur URL
    const parsedUrl = new URL(sanitizedUrl);

    // 4. Allowlist des protocoles autorisés (plus sécurisé qu'une denylist)
    const allowedProtocols = ["http:", "https:"];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: `Protocol "${parsedUrl.protocol}" is not allowed. Use http:// or https://`,
      };
    }

    // 5. Vérifications supplémentaires de sécurité
    if (parsedUrl.hostname.length === 0) {
      return {
        isValid: false,
        error: "URL must have a valid hostname",
      };
    }

    // 5.1. Vérifier qu'il y a un TLD valide et que tous les segments du domaine sont corrects
    const hostname = parsedUrl.hostname.toLowerCase();
    const parts = hostname.split(".");

    // Il faut au moins 2 parties (domaine + TLD)
    if (parts.length < 2) {
      return {
        isValid: false,
        error: "URL must have a valid domain with TLD (e.g., .com, .org)",
      };
    }

    // Vérifier que TOUS les segments sont valides (pas vides)
    for (const part of parts) {
      if (!part || part.length === 0) {
        return {
          isValid: false,
          error: "Invalid domain format - empty segments not allowed",
        };
      }
    }

    // Vérifier que le TLD fait au moins 2 caractères
    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      return {
        isValid: false,
        error: "URL must have a valid TLD (e.g., .com, .org)",
      };
    }

    // 6. Bloquer les IP locales/privées pour éviter SSRF
    const localHostPatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "10.",
      "172.",
      "192.168.",
    ];

    if (localHostPatterns.some((pattern) => hostname.includes(pattern))) {
      return {
        isValid: false,
        error: "Local or private IP addresses are not allowed",
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: "Invalid URL format",
    };
  }
}

/**
 * Schéma Zod pour validation d'URL sécurisée
 */
export const urlSchema = z
  .string()
  .min(1, "URL is required")
  .refine(
    (url) => {
      const result = validateUrlSafety(url);
      return result.isValid;
    },
    (url) => {
      const result = validateUrlSafety(url);
      return {
        message: result.error || "Invalid URL",
      };
    }
  );

// =============================================================================
// SPONSORED TOOLS TRANSFORMATION UTILITIES
// =============================================================================

// Common sponsored tool interface used across pages
export interface SponsoredTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string;
  logoUrl: string | null;
  category: string | null;
  advertisementId: string;
  placement: string;
  startDate: Date;
  endDate: Date;
  appImageUrl: string | null;
}

// Tool with sponsorship metadata
export interface ToolWithSponsorship extends Tool {
  isSponsored: boolean;
}

// Transform sponsored tools to match Tool interface with sponsorship flag
export function transformSponsoredTools(
  sponsoredTools: SponsoredTool[]
): ToolWithSponsorship[] {
  return sponsoredTools.map((sponsored) => ({
    id: sponsored.id,
    name: sponsored.name,
    slug: sponsored.slug,
    description: sponsored.description,
    url: sponsored.url,
    logoUrl: sponsored.logoUrl,
    appImageUrl: sponsored.appImageUrl,
    category: sponsored.category,
    featured: true, // Sponsored tools are always featured
    origin: "advertisement" as const,
    requiresSubscription: false, // No subscription required during ad period
    boostedFromId: sponsored.advertisementId,
    submittedBy: "", // Not needed for display
    createdAt: sponsored.startDate,
    updatedAt: sponsored.startDate,
    isSponsored: true,
    promoCode: null,
    promoDiscount: null,
  }));
}

// Transform regular tools to include sponsorship flag
export function transformRegularTools(tools: Tool[]): ToolWithSponsorship[] {
  return tools.map((tool) => ({
    ...tool,
    isSponsored: false,
  }));
}

// Combine sponsored and regular tools in the correct order
export function combineToolsWithSponsorship(
  sponsoredTools: SponsoredTool[],
  regularTools: Tool[]
): ToolWithSponsorship[] {
  const sponsoredWithFlag = transformSponsoredTools(sponsoredTools);
  const regularWithFlag = transformRegularTools(regularTools);

  return [...sponsoredWithFlag, ...regularWithFlag];
}

// =============================================================================
// URL VALIDATION UTILITIES
// =============================================================================

// Validate URL format with specific error messages
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: "URL is required" };
  }

  try {
    const urlObj = new URL(url);

    // Check if protocol is http or https
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { isValid: false, error: "URL must use http or https protocol" };
    }

    // Check if hostname exists
    if (!urlObj.hostname) {
      return { isValid: false, error: "Invalid URL format" };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
}
