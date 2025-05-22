import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines if a color is light or dark based on its luminance
 * @param color - CSS color value (hex, rgb, or CSS variable)
 * @returns true if the color is light, false if it's dark
 */
export function isLightColor(color: string): boolean {
  // Handle CSS variables
  if (color.startsWith('var(--')) {
    // For predefined colors, we'll use a lookup approach
    const colorName = color.replace('var(--', '').replace(')', '');
    // Our course colors are all light except for course-indigo
    if (colorName === 'course-indigo') return false;
    if (colorName.startsWith('course-')) return true;
    return false; // Default for unknown variables
  }

  // For hex colors
  let hexColor = color;
  if (hexColor.startsWith('#')) {
    hexColor = hexColor.slice(1);
  }

  // Convert 3-digit hex to 6-digit
  if (hexColor.length === 3) {
    hexColor = hexColor[0] + hexColor[0] + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2];
  }

  // Parse the hex color
  if (hexColor.length !== 6) {
    return false; // Default to dark if invalid format
  }

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate luminance using the formula: 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If luminance is greater than 0.5, color is considered light
  return luminance > 0.5;
}

/**
 * Creates a more vibrant, darker version of a hex color
 * @param hex - Hex color code
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened and more vibrant hex color
 */
export function darkenColor(hex: string, percent: number = 50): string {
  // Remove the # if present
  hex = hex.replace('#', '');

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Parse the hex color
  if (hex.length !== 6) {
    return '#000000'; // Default to black if invalid format
  }

  // Convert hex to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Convert to HSL to better manipulate the color
  // Algorithm from https://css-tricks.com/converting-color-spaces-in-javascript/
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }

    h /= 6;
  }

  // Increase saturation to make it more vibrant
  s = Math.min(1, s * 1.5);

  // Decrease lightness to make it darker
  l = Math.max(0, l * (100 - percent) / 100);

  // Convert back to RGB
  let r1, g1, b1;

  if (s === 0) {
    r1 = g1 = b1 = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r1 = hue2rgb(p, q, h + 1/3);
    g1 = hue2rgb(p, q, h);
    b1 = hue2rgb(p, q, h - 1/3);
  }

  // Convert back to 0-255 range
  r = Math.round(r1 * 255);
  g = Math.round(g1 * 255);
  b = Math.round(b1 * 255);

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Gets the appropriate text color based on background color
 * For light backgrounds, returns a darker shade of the same color
 * For dark backgrounds, returns white
 *
 * @param bgColor - Background color (hex or CSS variable)
 * @param darkColorFallback - Fallback color for dark backgrounds
 * @returns The appropriate text color for the background
 */
export function getTextColorForBackground(
  bgColor: string,
  darkColorFallback: string = 'white'
): string {
  // If it's a CSS variable, try to get its computed value
  if (bgColor.startsWith('var(--')) {
    // For CSS variables, we need to extract the actual color value
    // This is a bit tricky in a pure function, so we'll use a workaround

    // Extract the variable name
    const varName = bgColor.replace('var(--', '').replace(')', '');

    // Try to get the CSS variable value from a known mapping
    // These are approximate hex values for our CSS variables
    const cssVarMap: Record<string, string> = {
      'course-blue': '#E0EFFF',
      'course-purple': '#EDE9FE',
      'course-green': '#DCFCE7',
      'course-amber': '#FEF3C7',
      'course-pink': '#FCE7F3',
      'course-indigo': '#6366f1'
    };

    const hexColor = cssVarMap[varName];
    if (hexColor) {
      // If we found a mapping, use it to determine the text color
      if (isLightColor(hexColor)) {
        // For light backgrounds, return a darker, more vibrant shade of the same color
        return darkenColor(hexColor, 60);
      } else {
        // For dark backgrounds, return white
        return darkColorFallback;
      }
    }

    // If we don't have a mapping, make a best guess based on the variable name
    if (varName === 'course-indigo') {
      return darkColorFallback; // It's dark, so use white
    } else if (varName.startsWith('course-')) {
      // Most course colors are light, so darken them
      // We'll use a generic pastel color as a base
      return darkenColor('#E0E0FF', 60);
    }

    // Default fallback
    return '#1E293B';
  }

  // For hex colors
  if (bgColor.startsWith('#')) {
    if (isLightColor(bgColor)) {
      // For light backgrounds, return a darker, more vibrant shade of the same color
      return darkenColor(bgColor, 60);
    } else {
      // For dark backgrounds, return white
      return darkColorFallback;
    }
  }

  // For RGB colors
  if (bgColor.startsWith('rgb')) {
    try {
      // Extract RGB values
      const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        if (luminance > 0.5) {
          // Light color - convert to hex and darken
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          return darkenColor(hex, 60);
        } else {
          // Dark color - use white
          return darkColorFallback;
        }
      }
    } catch {
      // If parsing fails, use default
      return '#1E293B';
    }
  }

  // Default fallback
  return '#1E293B';
}
