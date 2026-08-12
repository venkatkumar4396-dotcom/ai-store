/**
 * Maps sidebar/nav route hrefs to their corresponding bot IDs from the FEATURED_BOTS constants.
 * Routes NOT listed here are always visible (Dashboard, Bot Store, Settings, AI Playground).
 */
export const ROUTE_TO_BOT_ID: Record<string, string> = {
  "/booking-hub": "bot-travel",
  "/travel-booking": "bot-travel",
  "/stock-intelligence": "bot-2",
  "/career-accelerator": "bot-3",
  "/productivity": "bot-productivity",
  "/document-agent": "bot-document",
  "/startup-cofounder": "bot-5",
  "/research-scientist": "bot-5",
  "/business-automator": "bot-5",
  "/whatsapp": "bot-1",
  "/file-tracker": "bot-4",
  "/compass": "bot-compass",
  "/sales-agent": "bot-sales",
};
