import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { SelectItem } from 'primeng/api'

export interface UserResponseDto extends GenericResponseDto {
    firstName: string | undefined
    lastName: string | undefined
    email: string
    role: SelectItem<string> | undefined
    birthday: Date
    lastLogin: Date
    purged: boolean
}
