import { WritableSignal } from '@angular/core'
import { disabled, FieldContext, FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ParticipantDto } from '@pages/projects/[projectId]/configuration/participants/data/dto/participant.dto'
import { DateHelper } from '@shared/helpers/date.helper'
import { FormModelHelper } from '@shared/helpers/form/form-model.helper'
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { UserHelper } from '@shared/helpers/user.helper'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GroupModel } from '@shared/models/model/group.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { UserModel } from '@shared/models/model/user.model'

export interface ParticipantFormModel {
    firstName: string
    lastName: string
    birthday: Date | null
    user: SelectOptionModel<UserModel> | null
    groups: GroupModel[]
    beginDateTime: CustomDatetimeModel | null
    endDateTime: CustomDatetimeModel | null
}

export interface PreviousNames {
    firstName: string | undefined
    lastName: string | undefined
}

export function toParticipantFormModel (participant?: ParticipantModel): ParticipantFormModel {
    return {
        firstName: participant?.firstName ?? '',
        lastName: participant?.lastName ?? '',
        birthday: participant?.birthday ? new Date( participant.birthday ) : null,
        user: participant?.user ? FormModelHelper.copy( UserHelper.toSelectItem( participant.user ) ) : null,
        groups: FormModelHelper.copyItems( participant?.groups ),
        beginDateTime: participant?.startAvailability ?? null,
        endDateTime: participant?.endAvailability ?? null,
    }
}

export function withSelectedUser (
    model: ParticipantFormModel,
    user: SelectOptionModel<UserModel> | null,
    previous: PreviousNames,
): ParticipantFormModel {
    if (!user) {
        return { ...model, user, firstName: previous.firstName ?? model.firstName, lastName: previous.lastName ?? model.lastName }
    }
    return {
        ...model,
        user,
        firstName: user.value.firstName || model.firstName,
        lastName: user.value.lastName || model.lastName,
    }
}

function groupIdsOf (model: ParticipantFormModel, defaultGroup: GroupModel | undefined): string[] {
    const groupIds: string[] = model.groups.map( (item: GroupModel): string => item.id )
    if (defaultGroup && !groupIds.includes( defaultGroup.id )) groupIds.push( defaultGroup.id )
    return groupIds
}

export function toParticipantDto (model: ParticipantFormModel, defaultGroup?: GroupModel): ParticipantDto {
    return {
        firstName: model.firstName,
        lastName: model.lastName,
        birthday: DateHelper.getDate( model.birthday! ),
        userId: model.user?.value.id,
        groupIds: groupIdsOf( model, defaultGroup ),
        startAvailability: model.beginDateTime ?? undefined,
        endAvailability: model.endDateTime ?? undefined,
    }
}

export function createParticipantForm (model: WritableSignal<ParticipantFormModel>, context: ProjectDateContext): FieldTree<ParticipantFormModel> {
    return form( model, (path: SchemaPathTree<ParticipantFormModel>): void => {
        RegistrySchemas.requiredText( path.firstName, 150 )
        RegistrySchemas.requiredText( path.lastName, 150 )
        disabled( path.firstName, { when: (ctx: FieldContext<string>): boolean => !!ctx.valueOf( path.user )?.value.firstName } )
        disabled( path.lastName, { when: (ctx: FieldContext<string>): boolean => !!ctx.valueOf( path.user )?.value.lastName } )
        required( path.birthday )
        RegistrySchemas.notInTheFuture( path.birthday )
        RegistrySchemas.projectDateTime( path.beginDateTime, context )
        RegistrySchemas.projectDateTime( path.endDateTime, context )
        RegistrySchemas.beginDateBeforeEndDate( path )
    } )
}
