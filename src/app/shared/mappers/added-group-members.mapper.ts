import { AddedGroupMembersResponseDto } from '@shared/models/dto/response/added-group-members.response.dto';
import { AddedGroupMembersModel } from '@shared/models/model/added-group-members.model';

/**
 * Objectif: Convertit la réponse de l'ajout de membres à un groupe en modèle.
 * Périmètre: Copie les identifiants des membres ajoutés et de ceux qui n'ont pas pu l'être.
 * Limites: Ne valide ni ne calcule rien ; le décompte des ajouts reste à la facade.
 */
export const AddedGroupMembersMapper = {
	toModel(dto: AddedGroupMembersResponseDto): AddedGroupMembersModel {
		return { members: [...dto.members], notAddedMemberIds: [...dto.notAddedMemberIds] };
	},
} as const;
