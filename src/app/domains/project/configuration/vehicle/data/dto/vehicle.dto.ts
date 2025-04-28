import { CustomDatetimeModel } from '../../../../../../shared/util-model/model/custom-datetime.model'

export interface VehicleDto {
    licensePlate: string
    brand: string
    model: string
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
}
