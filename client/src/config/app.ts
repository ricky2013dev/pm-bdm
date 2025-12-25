export const APP_CONFIG = {
  name: "DMS Care Center",
  shortName: "DMS SMS",
  description: "DMS Student Management System",
  fullTitle: "DMS Care Training Center - Student Management System",
} as const;

/**
 * Theme Configuration
 *
 * Primary colors control the main button colors and interactive elements.
 * To change the theme color, update the HSL values below and run the app.
 *
 * HSL Format: "hue saturation% lightness%"
 * - Hue: 0-360 (color wheel position)
 * - Saturation: 0-100% (color intensity)
 * - Lightness: 0-100% (brightness)
 */
export const THEME_CONFIG = {
  colors: {
    // Main brand color (blue)
    primary: {
      light: "220 90% 56%",  // Light mode primary color
      dark: "220 90% 60%",   // Dark mode primary color
      foreground: "0 0% 100%", // Text color on primary background
    },
    // You can add more custom colors here
  },
} as const;
