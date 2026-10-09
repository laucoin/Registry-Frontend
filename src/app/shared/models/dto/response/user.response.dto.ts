import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface UserResponseDto extends GenericResponseDto {
    firstName: string | undefined
    lastName: string | undefined
    email: string
    role: SelectOptionModel<string> | undefined
    birthday: Date
    lastLogin: Date
    purged: boolean
}
