import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'

export interface VehicleDto {
    licensePlate: string
    brand: string
    model: string
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
