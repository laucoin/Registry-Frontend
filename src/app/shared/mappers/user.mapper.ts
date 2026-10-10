import { UserModel } from '@shared/models/model/user.model'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Converts a User response of the backend into the User model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class UserMapper {
    public static toModel (dto: UserResponseDto): UserModel {
        return {
            ...GenericMapper.toModel( dto ),
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            role: dto.role,
            birthday: dto.birthday,
            lastLogin: dto.lastLogin,
            purged: dto.purged,
        }
    }
}
