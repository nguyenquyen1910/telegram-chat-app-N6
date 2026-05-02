/**
 * Danh sách các bộ gradient đẹp cho màn hình cuộc gọi.
 * Mỗi bộ gồm 3 màu cho LinearGradient từ trên xuống.
 */

type GradientTheme = {
  colors: [string, string, string];
  ripple: string; // màu vòng ripple quanh avatar
};

export const CALL_GRADIENT_THEMES: GradientTheme[] = [
  // Teal-green (Telegram audio call style)
  { colors: ["#1E6B5B", "#2D8B6A", "#4BA882"], ripple: "rgba(100,220,170,0.45)" },
  // Purple (Telegram incoming style)
  { colors: ["#5B57A2", "#7A66C8", "#9B84E0"], ripple: "rgba(160,140,230,0.45)" },
  // Ocean blue
  { colors: ["#1A3A6B", "#1E5FAF", "#2E82D4"], ripple: "rgba(80,160,240,0.45)" },
  // Coral sunset
  { colors: ["#7B2D4A", "#B84D6A", "#D4718A"], ripple: "rgba(230,130,160,0.45)" },
  // Forest dark
  { colors: ["#1A4A2A", "#2B7040", "#3A9255"], ripple: "rgba(80,200,120,0.45)" },
  // Midnight navy
  { colors: ["#0F1E3D", "#1A3166", "#2A4A9A"], ripple: "rgba(80,120,220,0.45)" },
  // Amber warm
  { colors: ["#7A3B0A", "#B56015", "#D4841E"], ripple: "rgba(230,170,80,0.45)" },
  // Rose plum
  { colors: ["#5A1A4A", "#8B3078", "#B050A0"], ripple: "rgba(210,120,200,0.45)" },
  // Slate teal
  { colors: ["#1E3A4A", "#285E72", "#33849A"], ripple: "rgba(80,180,210,0.45)" },
  // Deep indigo
  { colors: ["#1A1A6B", "#2828AF", "#3A3AD4"], ripple: "rgba(100,100,240,0.45)" },
];

/**
 * Trả về một bộ gradient random cho mỗi cuộc gọi mới.
 */
export function getRandomCallTheme(): GradientTheme {
  const idx = Math.floor(Math.random() * CALL_GRADIENT_THEMES.length);
  return CALL_GRADIENT_THEMES[idx];
}
