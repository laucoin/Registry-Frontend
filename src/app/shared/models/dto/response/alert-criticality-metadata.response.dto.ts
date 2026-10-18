import { AlertCriticalityEnum } from '@shared/models/enumeration/alert-criticality.enum'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface AlertCriticalityMetadataResponseDto {
    levels: SelectOptionModel<AlertCriticalityEnum>[]
    rule: string
}
