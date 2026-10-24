import { UserInvitationModel } from '@shared/models/model/user-invitation.model'
import { UserInvitationResponseDto } from '@shared/models/dto/response/user-invitation.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Convertit une réponse d'invitation d'utilisateur du backend en modèle UserInvitation.
 * Scope: Copie chaque champ et le résumé du projet.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class UserInvitationMapper {
    public static toModel (dto: UserInvitationResponseDto): UserInvitationModel {
        return {
            ...GenericMapper.toModel( dto ),
            project: dto.project
                ? { id: dto.project.id, name: dto.project.name, begin: dto.project.begin, end: dto.project.end, favorite: dto.project.favorite }
                : undefined,
            role: dto.role,
            availabilityStatus: dto.availabilityStatus,
            status: dto.status,
            startAccess: dto.startAccess,
            endAccess: dto.endAccess,
        }
    }
}
