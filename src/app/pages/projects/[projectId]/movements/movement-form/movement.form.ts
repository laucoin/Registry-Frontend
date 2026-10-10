import { WritableSignal } from '@angular/core'
import { applyEach, disabled, FieldContext, FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { MovementContentDto } from '@pages/projects/[projectId]/movements/data/dto/movement-content.dto'
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import { DateHelper } from '@shared/helpers/date.helper'
import { FormModelHelper } from '@shared/helpers/form/form-model.helper'
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

export interface MovementInformationModel {
    dateTime: Date | null
    type: string
    contentType: ParticipantTypeEnum
}

export interface MovementGuestModel {
    id: string
    firstName: string
    lastName: string
    birthday: Date | null
}

export interface MovementContentFormModel {
    reason: MovementReasonModel | null
    participants: MovementContentModel[]
    guests: MovementGuestModel[]
}

export interface MovementVehicleModel {
    vehicle: VehicleModel
    driver: ParticipantModel | null
}

export interface MovementFormModel {
    information: MovementInformationModel
    content: MovementContentFormModel
    vehicles: MovementVehicleModel[]
}

export interface MovementFormContext extends ProjectDateContext {
    editing: () => boolean
}

export function emptyGuest (participant?: ParticipantModel): MovementGuestModel {
    return {
        id: participant?.id ?? '',
        firstName: participant?.firstName ?? '',
        lastName: participant?.lastName ?? '',
        birthday: participant?.birthday ? new Date( participant.birthday ) : null,
    }
}

export function isContentSelection (information: MovementInformationModel): boolean {
    return information.contentType === ParticipantTypeEnum.REGISTERED || information.type === MovementTypeEnum.OUT
}

export function isReasonRequired (information: MovementInformationModel): boolean {
    const { type, contentType }: MovementInformationModel = information
    return (type === MovementTypeEnum.OUT && contentType === ParticipantTypeEnum.REGISTERED)
        || (type === MovementTypeEnum.IN && contentType === ParticipantTypeEnum.GUEST)
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

export function emptyMovementFormModel (now: Date): MovementFormModel {
    return {
        information: { dateTime: now, type: '', contentType: ParticipantTypeEnum.REGISTERED },
        content: { reason: null, participants: [], guests: [] },
        vehicles: [],
    }
}

export function withKind (model: MovementFormModel, type: string, contentType: ParticipantTypeEnum): MovementFormModel {
    const information: MovementInformationModel = { ...model.information, type, contentType }
    const guests: MovementGuestModel[] = isContentSelection( information ) ? [] : (model.content.guests.length ? model.content.guests : [ emptyGuest() ])
    return { ...model, information, content: { ...model.content, reason: null, guests } }
}

function vehiclesOf (movement: MovementModel): MovementVehicleModel[] {
    return FormModelHelper.copyItems( movement.content )
        .filter( (content: MovementContentModel): boolean => !!content.vehicle )
        .map( (content: MovementContentModel): MovementVehicleModel => ({ vehicle: content.vehicle!, driver: content.participant }) )
}

export function toMovementFormModel (movement: MovementModel): MovementFormModel {
    const information: MovementInformationModel = {
        dateTime: new Date( movement.dateTime ),
        type: movement.type.value,
        contentType: movement.contentType,
    }
    const guestArrival: boolean = !isContentSelection( information )
    return {
        information,
        content: {
            reason: movement.reason ? FormModelHelper.copy( movement.reason ) : null,
            participants: guestArrival ? [] : FormModelHelper.copyItems( movement.content ),
            guests: guestArrival ? movement.content.map( (content: MovementContentModel): MovementGuestModel => emptyGuest( content.participant ) ) : [],
        },
        vehicles: vehiclesOf( movement ),
    }
}

export function driversOf (model: MovementFormModel): SelectOptionModel<ParticipantModel>[] {
    return model.content.participants
        .filter( (element: MovementContentModel): boolean => element.participant?.major ?? true )
        .map( (element: MovementContentModel): SelectOptionModel<ParticipantModel> => ParticipantHelper.toSelectItem( element.participant ) )
}

function vehicleOfDriver (model: MovementFormModel, driverId: string): string | undefined {
    return model.vehicles.find( (item: MovementVehicleModel): boolean => item.driver?.id === driverId )?.vehicle.id
}

function contentDtoOf (model: MovementFormModel): MovementContentDto[] {
    return model.content.participants.map( (content: MovementContentModel): MovementContentDto => ({
        poolName: content.poolName,
        participantId: content.participant.id,
        vehicleId: vehicleOfDriver( model, content.participant.id ),
    }) )
}

function guestsDtoOf (model: MovementFormModel): ParticipantModel[] {
    return model.content.guests.map( (guest: MovementGuestModel): ParticipantModel => ({
        id: guest.id || undefined,
        firstName: guest.firstName,
        lastName: guest.lastName,
        birthday: DateHelper.getDate( new Date( guest.birthday! ) ),
    }) as unknown as ParticipantModel )
}

export function toMovementDto (model: MovementFormModel): MovementDto {
    const reason: MovementReasonModel | null = model.content.reason
    return {
        dateTime: model.information.dateTime!,
        type: model.information.type,
        reason: reason?.kind === 'REASON' ? reason.value : undefined,
        activityId: reason?.kind === 'ACTIVITY' ? reason.value : undefined,
        contentType: model.information.contentType,
        content: contentDtoOf( model ),
        guests: guestsDtoOf( model ),
    }
}

function informationRules (path: SchemaPathTree<MovementInformationModel>, context: MovementFormContext): void {
    required( path.dateTime )
    RegistrySchemas.withinProject( path.dateTime, context.project, context.formatDate )
    required( path.type )
    required( path.contentType )
    disabled( path.type, { when: context.editing } )
    disabled( path.contentType, { when: context.editing } )
}

function contentRules (path: SchemaPathTree<MovementFormModel>): void {
    const { content, information }: SchemaPathTree<MovementFormModel> = path
    required( content.reason, { when: (ctx: FieldContext<MovementReasonModel | null>): boolean => isReasonRequired( ctx.valueOf( information ) ) } )
    RegistrySchemas.requiredList( content.participants, (ctx: FieldContext<MovementContentModel[]>): boolean => isContentSelection( ctx.valueOf( information ) ) )
    RegistrySchemas.requiredList( content.guests, (ctx: FieldContext<MovementGuestModel[]>): boolean => !isContentSelection( ctx.valueOf( information ) ) )
    applyEach( content.guests, (guest: SchemaPathTree<MovementGuestModel>): void => {
        required( guest.firstName )
        required( guest.lastName )
        required( guest.birthday )
    } )
}

export function createMovementForm (model: WritableSignal<MovementFormModel>, context: MovementFormContext): FieldTree<MovementFormModel> {
    return form( model, (path: SchemaPathTree<MovementFormModel>): void => {
        informationRules( path.information, context )
        contentRules( path )
        applyEach( path.vehicles, (item: SchemaPathTree<MovementVehicleModel>): void => required( item.driver ) )
    } )
}
