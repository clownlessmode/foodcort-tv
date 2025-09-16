import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Конвертирует hex цвет в HSL формат
 * @param hex - hex цвет в формате #RRGGBB или #RGB
 * @returns HSL строка в формате "hsl(h, s%, l%)"
 */
export function hexToHsl(hex: string): string {
  // Удаляем # если есть
  hex = hex.replace("#", "");

  // Если короткий формат (#RGB), расширяем до полного (#RRGGBB)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Парсим RGB значения
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(
    l * 100
  )}%)`;
}

/**
 * Устанавливает яркость HSL цвета в 100% (белый цвет)
 * @param hsl - HSL строка в формате "hsl(h, s%, l%)"
 * @returns HSL строка с яркостью 100%
 */
export function setHslBrightness(
  hsl: string,
  brightness: number = 100
): string {
  // Извлекаем h и s из HSL строки
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*\d+%\)/);
  if (!match) return hsl;

  const h = match[1];
  const s = match[2];

  return `hsl(${h}, ${s}%, ${brightness}%)`;
}
