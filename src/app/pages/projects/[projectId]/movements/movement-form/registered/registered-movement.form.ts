import { WritableSignal } from '@angular/core'
import { applyEach, FieldContext, FieldTree, form, required, SchemaPathTree } from '@angular/forms/signals'
import { MovementContentDto } from '@pages/projects/[projectId]/movements/data/dto/movement-content.dto'
import { MovementDto } from '@pages/projects/[projectId]/movements/data/dto/movement.dto'
import {
    informationRules,
    MovementFormContext,
    MovementInformationModel,
    reasonFieldsOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared'
import { MovementPrefillModel } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.model'
import { FormModelHelper } from '@shared/helpers/form/form-model.helper'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

interface RegisteredContentModel {
    reason: MovementReasonModel | null
    participants: MovementContentModel[]
}

export interface MovementVehicleModel {
    vehicle: VehicleModel
    driver: ParticipantModel | null
}

export interface RegisteredMovementFormModel {
    information: MovementInformationModel
    content: RegisteredContentModel
    vehicles: MovementVehicleModel[]
}

export function emptyRegisteredMovementFormModel (now: Date): RegisteredMovementFormModel {
    return {
        information: { dateTime: now, type: '' },
        content: { reason: null, participants: [] },
        vehicles: [],
    }
}

export function withRegisteredPrefill (model: RegisteredMovementFormModel, prefill: MovementPrefillModel): RegisteredMovementFormModel {
    return {
        ...model,
        information: { ...model.information, type: prefill.type },
        content: {
            reason: prefill.type === MovementTypeEnum.OUT && prefill.reason ? FormModelHelper.copy( prefill.reason ) : null,
            participants: FormModelHelper.copyItems( prefill.content ),
        },
    }
}

export function isRegisteredReasonRequired (information: MovementInformationModel): boolean {
    return information.type === MovementTypeEnum.OUT
}

export function withRegisteredType (model: RegisteredMovementFormModel, type: string): RegisteredMovementFormModel {
    return { ...model, information: { ...model.information, type }, content: { ...model.content, reason: null } }
}

function vehiclesOf (movement: MovementModel): MovementVehicleModel[] {
    return FormModelHelper.copyItems( movement.content )
        .filter( (content: MovementContentModel): boolean => !!content.vehicle )
        .map( (content: MovementContentModel): MovementVehicleModel => ({ vehicle: content.vehicle!, driver: content.participant }) )
}

export function toRegisteredMovementFormModel (movement: MovementModel): RegisteredMovementFormModel {
    return {
        information: { dateTime: new Date( movement.dateTime ), type: movement.type.value },
        content: {
            reason: movement.reason ? FormModelHelper.copy( movement.reason ) : null,
            participants: FormModelHelper.copyItems( movement.content ),
        },
        vehicles: vehiclesOf( movement ),
    }
}

export function driversOf (model: RegisteredMovementFormModel): SelectOptionModel<ParticipantModel>[] {
    return model.content.participants
        .filter( (element: MovementContentModel): boolean => element.participant?.major ?? true )
        .map( (element: MovementContentModel): SelectOptionModel<ParticipantModel> => ParticipantHelper.toSelectItem( element.participant ) )
}

function vehicleOfDriver (model: RegisteredMovementFormModel, driverId: string): string | undefined {
    return model.vehicles.find( (item: MovementVehicleModel): boolean => item.driver?.id === driverId )?.vehicle.id
}

function contentDtoOf (model: RegisteredMovementFormModel): MovementContentDto[] {
    return model.content.participants.map( (content: MovementContentModel): MovementContentDto => ({
        poolName: content.poolName,
        participantId: content.participant.id,
        vehicleId: vehicleOfDriver( model, content.participant.id ),
    }) )
}

export function toRegisteredMovementDto (model: RegisteredMovementFormModel): MovementDto {
    return {
        dateTime: model.information.dateTime!,
        type: model.information.type,
        ...reasonFieldsOf( model.content.reason ),
        content: contentDtoOf( model ),
    }
}

export function createRegisteredMovementForm (
    model: WritableSignal<RegisteredMovementFormModel>,
    context: MovementFormContext,
): FieldTree<RegisteredMovementFormModel> {
    return form( model, (path: SchemaPathTree<RegisteredMovementFormModel>): void => {
        informationRules( path.information, context )
        required( path.content.reason, {
            when: (ctx: FieldContext<MovementReasonModel | null>): boolean => isRegisteredReasonRequired( ctx.valueOf( path.information ) ),
        } )
        RegistrySchemas.requiredList( path.content.participants )
        applyEach( path.vehicles, (item: SchemaPathTree<MovementVehicleModel>): void => required( item.driver ) )
    } )
}
