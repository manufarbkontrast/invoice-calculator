export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Invoice Calculator";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/000000/FFFFFF?text=IC";

// Login URL now points to internal auth page
export const getLoginUrl = () => "/auth";
