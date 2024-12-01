import { Message } from 'primeng/api'

export interface ElementRequestInformationModel<M> {
    element: M | undefined
    loading: boolean
    error: Message | undefined
}
