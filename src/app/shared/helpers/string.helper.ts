/**
 * Purpose: Static string utilities (blank checks, shared constants).
 * Scope: Pure, stateless functions; usable from any layer (component, facade, store, api).
 * Limits: None beyond that — kept intentionally minimal.
 */
export class StringHelper {
	public static SPACE: string = ' ';

	public static isBlank(value: string | undefined | null): boolean {
		return !value || !value.trim();
	}

	public static isNotBlank(value: string | undefined | null): boolean {
		return !StringHelper.isBlank(value);
	}
}
