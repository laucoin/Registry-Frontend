import { WritableSignal } from '@angular/core'
import { FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals'
import { UserModel } from '@shared/models/model/user.model'

export interface UserFormModel {
    role: string
}

function userFormSchema (path: SchemaPathTree<UserFormModel>): void {
    required( path.role )
}

export function toUserFormModel (user?: UserModel): UserFormModel {
    return { role: user?.role?.value ?? '' }
}

export function createUserForm (model: WritableSignal<UserFormModel>): FieldTree<UserFormModel> {
    return form( model, userFormSchema )
}
