import { StringHelper } from '@shared/helpers/string.helper';
import { InvitedUserModel } from '@shared/models/model/invited-user.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

const INVITED_BY_EMAIL_ID_PREFIX = 'invited-by-email:';
const USER_INITIALS_LENGTH = 2;

/**
 * Objectif: Construit les libellés des utilisateurs.
 * Périmètre: Mapping pur d'un utilisateur, ou d'un email à inviter, vers un select item ; nom complet et initiales
 * d'un utilisateur, avec repli sur son e-mail.
 * Limites: Aucun état et aucune traduction.
 */
export const UserHelper = {
	toSelectItem<T extends InvitedUserModel>(user: T): SelectOptionModel<T> {
		const hasName = StringHelper.isNotNullNorBlank(user.firstName) || StringHelper.isNotNullNorBlank(user.lastName);
		return {
			label: hasName ? `${user.email} (${user.firstName} ${user.lastName})` : user.email,
			value: user,
		};
	},

	fullName(user: InvitedUserModel): string {
		return [user.firstName, user.lastName?.toUpperCase()].filter(Boolean).join(' ') || user.email;
	},

	initials(user: InvitedUserModel): string {
		const letters = [user.firstName, user.lastName].map((name) => name?.charAt(0) ?? '').join('');
		return (letters || user.email.charAt(0)).slice(0, USER_INITIALS_LENGTH).toUpperCase();
	},

	toInvitedByEmail(email: string): InvitedUserModel {
		return {
			id: `${INVITED_BY_EMAIL_ID_PREFIX}${email.toLowerCase()}`,
			email,
			firstName: undefined,
			lastName: undefined,
		};
	},
} as const;
