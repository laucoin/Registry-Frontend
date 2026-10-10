import { WritableSignal } from '@angular/core'
import { FieldTree, form, SchemaPathTree } from '@angular/forms/signals'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { ParticipantModel } from '@shared/models/model/participant.model'

export interface AddMembersFormModel {
    participants: ParticipantModel[]
}

export function emptyAddMembersFormModel (): AddMembersFormModel {
    return { participants: [] }
}

export function toMemberIds (model: AddMembersFormModel): string[] {
    return model.participants.map( (item: ParticipantModel): string => item.id )
}

export function createAddMembersForm (model: WritableSignal<AddMembersFormModel>): FieldTree<AddMembersFormModel> {
    return form( model, (path: SchemaPathTree<AddMembersFormModel>): void => {
        RegistrySchemas.requiredList( path.participants )
    } )
}
