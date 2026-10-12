import { PreferencesModel } from '@shared/models/model/preferences.model'
import { UserModel } from '@shared/models/model/user.model'

export interface CurrentUserModel extends UserModel {
    authorities: string[],
    preferences: PreferencesModel,
}
