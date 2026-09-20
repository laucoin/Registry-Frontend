import { StringHelper } from '@shared/helpers/string.helper';
import { CurrentUserModel } from '@shared/models/current-user.model';

/**
 * Purpose: Static formatting helpers derived from a `CurrentUserModel` (display name, initials).
 * Scope: Pure, stateless functions; usable from any layer (component, facade, store, api).
 * Limits: Falls back to the email (or its first two characters) when no first/last name is set.
 */
export class UserHelper {
	public static displayName(
		user: CurrentUserModel | undefined,
		type: 'full' | 'short' = 'full',
	): string | undefined {
		if (!user) {
			return undefined;
		}

		if (type === 'short') {
			return user.firstName || user.email;
		}

		const fullName: string = [user.firstName, user.lastName]
			.filter(Boolean)
			.join(StringHelper.SPACE);

		return fullName || user.email;
	}

	public static initials(user: CurrentUserModel | undefined): string | undefined {
		if (!user) {
			return undefined;
		}
		const fromName: string = [user.firstName, user.lastName]
			.filter(Boolean)
			.map((part: string | undefined): string => part!.charAt(0))
			.join('');
		return (fromName || user.email?.slice(0, 2) || '').toUpperCase();
	}
}
