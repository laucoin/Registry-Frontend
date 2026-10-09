import { WritableSignal } from '@angular/core'
import { FieldTree, form, maxLength, SchemaPathTree } from '@angular/forms/signals'
import { ActivityDto } from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import { DateHelper } from '@shared/helpers/date.helper'
import { ProjectDateContext, RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { ActivityModel } from '@shared/models/model/activity.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { SplitTimeModel } from '@shared/models/model/split-time.model'

const MAX_ALLOWED_PARTICIPANTS: number = 2147483647

export interface ActivityFormModel {
    name: string
    description: string
    duration: SplitTimeModel | null
    allowedParticipants: NumericRangeModel | null
    beginDateTime: CustomDatetimeModel | null
    endDateTime: CustomDatetimeModel | null
}

export function toActivityFormModel (activity?: ActivityModel): ActivityFormModel {
    return {
        name: activity?.name ?? '',
        description: activity?.description ?? '',
        duration: activity ? DateHelper.parseIsoDuration( activity.duration?.value ) : null,
        allowedParticipants: activity?.allowedParticipants ?? null,
        beginDateTime: activity?.startAvailability ?? null,
        endDateTime: activity?.endAvailability ?? null,
    }
}

export function toActivityDto (model: ActivityFormModel): ActivityDto {
    return {
        name: model.name,
        description: model.description,
        duration: model.duration ? DateHelper.toIsoDuration( model.duration.hours, model.duration.minutes ) : undefined,
        allowedParticipants: model.allowedParticipants ?? undefined,
        startAvailability: model.beginDateTime ?? undefined,
        endAvailability: model.endDateTime ?? undefined,
    }
}

function allowedParticipantsRules (path: SchemaPathTree<NumericRangeModel | null>): void {
    RegistrySchemas.numericRange( path )
    RegistrySchemas.numericRangeMin( path, 1 )
    RegistrySchemas.numericRangeMax( path, MAX_ALLOWED_PARTICIPANTS )
    RegistrySchemas.numericRangeBothDefined( path )
}

export function createActivityForm (model: WritableSignal<ActivityFormModel>, context: ProjectDateContext): FieldTree<ActivityFormModel> {
    return form( model, (path: SchemaPathTree<ActivityFormModel>): void => {
        RegistrySchemas.requiredText( path.name, 150 )
        maxLength( path.description, 2000 )
        allowedParticipantsRules( path.allowedParticipants )
        RegistrySchemas.projectDateTime( path.beginDateTime, context )
        RegistrySchemas.projectDateTime( path.endDateTime, context )
        RegistrySchemas.beginDateBeforeEndDate( path )
    } )
}
