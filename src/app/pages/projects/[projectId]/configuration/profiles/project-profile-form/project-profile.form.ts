import { WritableSignal } from '@angular/core'
import { FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals'
import { ProjectProfileDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import { ProjectProfilesDto } from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserModel } from '@shared/models/model/user.model'

export interface ProjectProfileFormModel {
    role: string
    beginDateTime: CustomDatetimeModel | null
    endDateTime: CustomDatetimeModel | null
}

export interface ProjectProfileInvitationFormModel extends ProjectProfileFormModel {
    users: UserModel[]
}

export function toProjectProfileFormModel (profile?: ProjectProfileModel): ProjectProfileFormModel {
    return {
        role: profile?.role.value ?? '',
        beginDateTime: profile?.startAccess ?? null,
        endDateTime: profile?.endAccess ?? null,
    }
}

export function toProjectProfileInvitationFormModel (): ProjectProfileInvitationFormModel {
    return { ...toProjectProfileFormModel(), users: [] }
}

export function toProjectProfileDto (model: ProjectProfileFormModel): ProjectProfileDto {
    return {
        role: model.role,
        startAccess: model.beginDateTime ?? undefined,
        endAccess: model.endDateTime ?? undefined,
    }
}

export function toProjectProfilesDto (model: ProjectProfileInvitationFormModel): ProjectProfilesDto {
    return {
        ...toProjectProfileDto( model ),
        userIds: model.users.map( (user: UserModel): string => user.id ),
    }
}

function profileRules (path: SchemaPathTree<ProjectProfileFormModel>): void {
    required( path.role )
    RegistrySchemas.dateRequiredForTime( path.beginDateTime )
    RegistrySchemas.dateRequiredForTime( path.endDateTime )
    RegistrySchemas.beginDateBeforeEndDate( path )
}

export function createProjectProfileForm (model: WritableSignal<ProjectProfileFormModel>): FieldTree<ProjectProfileFormModel> {
    return form( model, profileRules )
}

export function createProjectProfileInvitationForm (
    model: WritableSignal<ProjectProfileInvitationFormModel>,
): FieldTree<ProjectProfileInvitationFormModel> {
    return form( model, (path: SchemaPathTree<ProjectProfileInvitationFormModel>): void => {
        profileRules( path )
        RegistrySchemas.requiredList( path.users )
    } )
}
