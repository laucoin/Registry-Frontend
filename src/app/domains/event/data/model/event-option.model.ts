import { SelectItem } from 'primeng/api'

export interface EventOptionModel {
    value: string,
    label: string,
    ask: string,
    preRequired: SelectItem<string>[],
}
