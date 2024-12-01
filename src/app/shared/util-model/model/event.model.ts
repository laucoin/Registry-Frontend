import { EventOptionEnum } from '../enumeration/event-option.enum'
import { GenericModel } from './generic.model'

export interface EventModel extends GenericModel {
    name: string,
    begin: Date | undefined,
    end: Date | undefined,
    options: EventOptionEnum[],
}
