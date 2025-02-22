import { GenericEventModel } from './generic-event.model'

export interface VehicleModel extends GenericEventModel {
    registration: string
    brand: string
    model: string
    begin: Date | undefined
    end: Date | undefined
}
