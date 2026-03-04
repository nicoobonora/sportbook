/**
 * Utility per la gestione dei colori del circolo.
 * Converte i colori esadecimali del DB nel formato HSL
 * richiesto dalle CSS variables di Tailwind/shadcn.
 */

/** Converte un colore esadecimale (#RRGGBB) in HSL (H S% L%) */
export function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return "0 0% 0%"

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Scurisce un colore esadecimale di una percentuale (0-100) */
export function darkenHex(hex: string, percent: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex

  const factor = 1 - percent / 100
  const r = Math.round(parseInt(result[1], 16) * factor)
  const g = Math.round(parseInt(result[2], 16) * factor)
  const b = Math.round(parseInt(result[3], 16) * factor)

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

/**
 * Genera le CSS variables per un circolo basandosi sui colori del DB.
 * Restituisce un oggetto style da applicare al container del sito.
 */
export function getClubThemeStyles(primaryColor: string, accentColor: string): React.CSSProperties {
  const primaryDark = darkenHex(primaryColor, 20)

  return {
    "--color-primary": hexToHSL(primaryColor),
    "--color-primary-dark": hexToHSL(primaryDark),
    "--color-accent": hexToHSL(accentColor),
    "--primary": hexToHSL(primaryColor),
    "--accent": hexToHSL(accentColor),
    "--ring": hexToHSL(primaryColor),
  } as React.CSSProperties
}
