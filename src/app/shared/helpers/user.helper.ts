import { InvitedUserModel } from '@shared/models/model/invited-user.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { StringHelper } from '@shared/helpers/string.helper'

const INVITED_BY_EMAIL_ID_PREFIX: string = 'invited-by-email:'

/**
 * Purpose: Construit les select items des utilisateurs.
 * Scope: Mapping pur d'un utilisateur, ou d'un email à inviter, vers un select item.
 * Limits: Aucun état et aucune traduction.
 */
export class UserHelper {
    public static toSelectItem<T extends InvitedUserModel> (user: T): SelectOptionModel<T> {
        const hasName: boolean = StringHelper.isNotNullNorBlank( user.firstName ) || StringHelper.isNotNullNorBlank( user.lastName )
        return {
            label: hasName ? `${user.email} (${user.firstName} ${user.lastName})` : user.email,
            value: user,
        }
    }

    public static toInvitedByEmail (email: string): InvitedUserModel {
        return { id: `${INVITED_BY_EMAIL_ID_PREFIX}${email.toLowerCase()}`, email, firstName: undefined, lastName: undefined }
    }
}
