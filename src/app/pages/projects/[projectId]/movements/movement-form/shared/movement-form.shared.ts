import { disabled, required, SchemaPathTree } from '@angular/forms/signals'
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

export interface MovementInformationModel {
    dateTime: Date | null
    type: string
}

export interface MovementFormContext extends ProjectDateContext {
    editing: () => boolean
}

interface MovementReasonFields {
    reason: string | undefined
    activityId: string | undefined
}

export function informationRules (path: SchemaPathTree<MovementInformationModel>, context: MovementFormContext): void {
    required( path.dateTime )
    RegistrySchemas.withinProject( path.dateTime, context.project, context.formatDate )
    required( path.type )
    disabled( path.type, { when: context.editing } )
}

export function interpretedPresence (type: string): PresenceStatusEnum[] {
    switch (type) {
        case MovementTypeEnum.IN:
            return [ PresenceStatusEnum.IN ]
        case MovementTypeEnum.OUT:
            return [ PresenceStatusEnum.UNAVAILABLE, PresenceStatusEnum.OUT ]
        default:
            return []
    }
}

export function reasonKeyOf (reason: MovementReasonModel | null | undefined): string {
    return reason ? `${ reason.kind }:${ reason.value }` : ''
}

export function reasonChoices (searched: MovementReasonModel[], chosen: MovementReasonModel | null): MovementReasonModel[] {
    const known: boolean = !chosen || searched.some( (option: MovementReasonModel): boolean => reasonKeyOf( option ) === reasonKeyOf( chosen ) )
    return known ? searched : [ chosen!, ...searched ]
}

export function reasonFieldsOf (reason: MovementReasonModel | null): MovementReasonFields {
    return {
        reason: reason?.kind === 'REASON' ? reason.value : undefined,
        activityId: reason?.kind === 'ACTIVITY' ? reason.value : undefined,
    }
}

export function contentOfChoice (chosen: ParticipantModel | GroupModel): MovementContentModel[] {
    if ('name' in chosen) {
        return (chosen.members ?? []).map( (member: ParticipantModel): MovementContentModel => ({
            poolName: chosen.name,
            participant: member,
            vehicle: undefined,
        }) )
    }
    return [ { poolName: undefined, participant: chosen, vehicle: undefined } ]
}
