import { WritableSignal } from '@angular/core'
import { applyWhen, FieldTree, form, SchemaPathTree } from '@angular/forms/signals'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import { CommunicationDto } from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { AlertModel } from '@shared/models/model/alert.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { MovementModel } from '@shared/models/model/movement.model'

export interface CommunicationFormModel {
    message: string
    movement: SelectOptionModel<MovementModel> | null
    alert: SelectOptionModel<AlertModel> | null
    newAlertTitle: string
}

export interface CommunicationFormContext {
    newAlert: () => boolean
}

export function emptyCommunicationFormModel (): CommunicationFormModel {
    return { message: '', movement: null, alert: null, newAlertTitle: '' }
}

function dateTimeOf (communication: CommunicationModel | undefined): string {
    return (communication?.dateTime ? new Date( communication.dateTime ) : new Date()).toISOString()
}

export function toCommunicationDto (model: CommunicationFormModel, communication?: CommunicationModel): CommunicationDto {
    return {
        dateTime: dateTimeOf( communication ),
        message: model.message,
        movementId: model.movement?.value.id,
        alertId: model.alert?.value.id,
    }
}

export function toNewAlertDto (model: CommunicationFormModel, communication?: CommunicationModel): AlertDto {
    return {
        title: model.newAlertTitle,
        dateTime: dateTimeOf( communication ),
        message: model.message,
        movementId: model.movement?.value.id,
    }
}

export function createCommunicationForm (
    model: WritableSignal<CommunicationFormModel>,
    context: CommunicationFormContext,
): FieldTree<CommunicationFormModel> {
    return form( model, (path: SchemaPathTree<CommunicationFormModel>): void => {
        RegistrySchemas.requiredText( path.message, 250 )
        RegistrySchemas.atLeastOneRequired( path, 'movement', 'alert' )
        applyWhen( path.newAlertTitle, context.newAlert, (title: SchemaPathTree<string>): void => {
            RegistrySchemas.requiredText( title, 50 )
        } )
    } )
}
