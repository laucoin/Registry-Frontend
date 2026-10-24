import { CommunicationModel } from '@shared/models/model/communication.model'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Identifie l'auteur d'une communication et de ses voisines dans une conversation.
 * Scope: Choisit le mouvement ou le dernier éditeur, selon celui qui est identifiable.
 * Limits: Aucun état ; ne charge pas l'auteur.
 */
export class CommunicationHelper {
    public static getAuthorId (communication: CommunicationModel): string | undefined {
        switch (true) {
            case StringHelper.isNotNullNorBlank( communication.movement?.reason?.label ):
                return communication.movement!.id
            case StringHelper.isNotNullNorBlank( communication.lastEdition?.user?.firstName ):
                return communication.lastEdition!.user!.id
            default:
                return undefined
        }
    }

    public static chronological (communications: CommunicationModel[] | undefined): CommunicationModel[] {
        return [ ...(communications ?? []) ].reverse()
    }

    public static previousAuthorId (communications: CommunicationModel[] | undefined, index: number): string | undefined {
        const previous: CommunicationModel | undefined = index > 0 ? communications?.[ index - 1 ] : undefined
        return previous ? CommunicationHelper.getAuthorId( previous ) : undefined
    }

    public static nextAuthorId (communications: CommunicationModel[] | undefined, index: number): string | undefined {
        const next: CommunicationModel | undefined = communications?.[ index + 1 ]
        return next ? CommunicationHelper.getAuthorId( next ) : undefined
    }
}
