import { EventOptionEnum } from '../../../../shared/util-model/enumeration/event-option.enum'

export interface EventDto {
    name: string
    begin: Date | undefined
    end: Date | undefined
    options: EventOptionEnum[] | undefined
}
