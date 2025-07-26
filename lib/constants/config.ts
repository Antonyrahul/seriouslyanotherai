import { CATEGORIES } from "./categories";

// =============================================================================
// SITE CONFIGURATION - Modify these values to customize your directory.
// =============================================================================

export const SITE_CONFIG = {
  title: "findly.tools",
  description: "The best tools, all in one place.",
  tagline: "Find the best tools for you.",
  url: "https://findly.tools",
  author: "Eric",
  keywords: ["tools", "directory", "findly"],
  email: "contact@findly.tools",
  x: "https://x.com/ericbn09",
  navigation: {
    categories: CATEGORIES,
  },
};
// =============================================================================
// BUSINESS CONFIGURATION - Modify these values to customize your directory.
// =============================================================================

const PRICES_MONTHLY = {
  //in USD
  "starter-monthly": 5,
  "plus-monthly": 9,
  "max-monthly": 15,
};
const PRICES_YEARLY = {
  //in USD
  "starter-yearly": 50,
  "plus-yearly": 90,
  "max-yearly": 150,
};
const LIMITS_PER_PLAN = {
  Starter: 1,
  Plus: 5,
  Max: 10,
};

const ADVERTISEMENT = {
  //in USD
  All: 5,
  Homepage: 4,
  Discount: {
    PerDay: 1,
    Max: 30,
  },
};

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 32,
  CATEGORY_PAGE_SIZE: 32,
  RELATED_TOOLS_COUNT: 6,
} as const;

// =============================================================================
// DO NOT CHANGE the code below this line !
// =============================================================================

export const getPlanPrice = (planName: string): number => {
  if (planName.includes("yearly")) {
    return (
      SUBSCRIPTION_PLANS.PRICES_YEARLY[
        planName as keyof typeof SUBSCRIPTION_PLANS.PRICES_YEARLY
      ] || 0
    );
  }
  return (
    SUBSCRIPTION_PLANS.PRICES_MONTHLY[
      planName as keyof typeof SUBSCRIPTION_PLANS.PRICES_MONTHLY
    ] || 0
  );
};

export const getPlanLimit = (planName: string): number => {
  return (
    SUBSCRIPTION_PLANS.LIMITS[
      planName as keyof typeof SUBSCRIPTION_PLANS.LIMITS
    ] || 0
  );
};

export const getAdvertisementDailyRate = (
  placement: "all" | "homepage"
): number => {
  return ADVERTISEMENT_CONFIG.DAILY_RATES[placement];
};

export const calculateAdvertisementDiscount = (duration: number): number => {
  return Math.min(
    Math.max(0, duration - 1) * ADVERTISEMENT_CONFIG.DISCOUNT.PER_DAY_PERCENT,
    ADVERTISEMENT_CONFIG.DISCOUNT.MAX_PERCENT
  );
};

const calculatePriceCentsYearly = (yearlyPrice: number): number => {
  return yearlyPrice * 100;
};

const calculatePriceCentsMonthly = (monthlyPrice: number): number => {
  return monthlyPrice * 100;
};

export const SUBSCRIPTION_PLANS = {
  PRICES_MONTHLY: {
    "starter-monthly": calculatePriceCentsMonthly(
      PRICES_MONTHLY["starter-monthly"]
    ),
    "plus-monthly": calculatePriceCentsMonthly(PRICES_MONTHLY["plus-monthly"]),
    "max-monthly": calculatePriceCentsMonthly(PRICES_MONTHLY["max-monthly"]),
  },
  PRICES_YEARLY: {
    "starter-yearly": calculatePriceCentsYearly(
      PRICES_YEARLY["starter-yearly"]
    ),
    "plus-yearly": calculatePriceCentsYearly(PRICES_YEARLY["plus-yearly"]),
    "max-yearly": calculatePriceCentsYearly(PRICES_YEARLY["max-yearly"]),
  },
  LIMITS: {
    "starter-monthly": LIMITS_PER_PLAN.Starter,
    "starter-yearly": LIMITS_PER_PLAN.Starter,
    "plus-monthly": LIMITS_PER_PLAN.Plus,
    "plus-yearly": LIMITS_PER_PLAN.Plus,
    "max-monthly": LIMITS_PER_PLAN.Max,
    "max-yearly": LIMITS_PER_PLAN.Max,
  },
} as const;

export const ADVERTISEMENT_CONFIG = {
  DAILY_RATES: {
    all: ADVERTISEMENT.All,
    homepage: ADVERTISEMENT.Homepage,
  },
  DISCOUNT: {
    PER_DAY_PERCENT: ADVERTISEMENT.Discount.PerDay,
    MAX_PERCENT: ADVERTISEMENT.Discount.Max,
  },
} as const;
