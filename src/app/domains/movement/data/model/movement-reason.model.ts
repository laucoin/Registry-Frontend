import { SelectItem } from 'primeng/api'

export interface MovementReasonModel extends SelectItem<string> {
    type?: 'IN' | 'OUT'
    kind: 'REASON' | 'ACTIVITY'
}
