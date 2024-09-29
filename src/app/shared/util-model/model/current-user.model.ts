import { PreferencesModel } from './preferences.model'
import { UserModel } from './user.model'

export interface CurrentUserModel extends UserModel {
    authorities: string[],
    preferences: PreferencesModel,
}
