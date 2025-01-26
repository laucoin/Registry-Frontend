import { GenericModel } from './generic.model'
import { SelectItem } from 'primeng/api'

export interface EventModel extends GenericModel {
    name: string,
    begin: Date | undefined,
    end: Date | undefined,
    options: SelectItem<string>[],
}
