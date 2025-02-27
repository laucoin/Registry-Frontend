import { GenericModel } from './generic.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from './custom-datetime.model'

export interface EventModel extends GenericModel {
    name: string,
    begin: CustomDatetimeModel | undefined,
    end: CustomDatetimeModel | undefined,
    options: SelectItem<string>[],
}
