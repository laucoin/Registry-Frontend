import { Message } from 'primeng/api'

export interface GenericStateModel {
    loading: boolean
    error: Message | undefined
}
