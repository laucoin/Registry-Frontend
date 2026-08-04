// AA-safe (WCAG 2.2 AA, ADR 015) SOLID tag colours for status indicators.
// AntD's tinted preset tags (green/red/blue…) render coloured text on a light
// tint at ~3.4:1, which fails AA in both modes; a solid dark background with
// AntD's automatic white text clears 4.5:1 regardless of the surrounding mode.
// White-text contrast: success (dark green) ≈ 6.4:1, danger (dark red) ≈ 7.5:1,
// neutral (dark grey) ≈ 7:1, info (dark blue) ≈ 6:1, accent (dark purple) ≈ 8:1.
export const STATUS_COLOR = {
	success: '#237804',
	danger: '#a8071a',
	neutral: '#595959',
	info: '#0050a0',
	accent: '#531dab',
} as const
