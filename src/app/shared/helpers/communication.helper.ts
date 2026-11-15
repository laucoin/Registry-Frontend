import { StringHelper } from '@shared/helpers/string.helper';
import { CommunicationModel } from '@shared/models/model/communication.model';

function movementAuthorId(communication: CommunicationModel): string | undefined {
	const movement = communication.movement;
	if (!movement || !StringHelper.isNotNullNorBlank(movement.reason?.label)) return undefined;
	return movement.id;
}

function editorAuthorId(communication: CommunicationModel): string | undefined {
	const user = communication.lastEdition?.user;
	return user && StringHelper.isNotNullNorBlank(user.firstName) ? user.id : undefined;
}

/** L'auteur d'une communication dont ni le mouvement ni l'éditeur ne sont identifiables, p. ex. un compte supprimé. */
const DELETED_AUTHOR_ID = 'deleted-author';

/**
 * Objectif: Identifie l'auteur d'une communication et de ses voisines dans une conversation.
 * Périmètre: Choisit le mouvement ou le dernier éditeur, selon celui qui est identifiable, et un auteur supprimé sinon.
 * Limites: Aucun état ; ne charge pas l'auteur.
 */
export const CommunicationHelper = {
	getAuthorId(communication: CommunicationModel): string {
		return movementAuthorId(communication) ?? editorAuthorId(communication) ?? DELETED_AUTHOR_ID;
	},

	chronological(communications: CommunicationModel[] | undefined): CommunicationModel[] {
		return [...(communications ?? [])].reverse();
	},

	previousAuthorId(communications: CommunicationModel[] | undefined, index: number): string | undefined {
		const previous = index > 0 ? communications?.[index - 1] : undefined;
		return previous ? CommunicationHelper.getAuthorId(previous) : undefined;
	},

	nextAuthorId(communications: CommunicationModel[] | undefined, index: number): string | undefined {
		const next = communications?.[index + 1];
		return next ? CommunicationHelper.getAuthorId(next) : undefined;
	},
} as const;
