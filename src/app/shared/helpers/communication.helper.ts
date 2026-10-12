import { CommunicationModel } from '@shared/models/model/communication.model'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Identifies the author of a communication and of its neighbours in a conversation.
 * Scope: Picks the movement or the last editor, whichever is identifiable.
 * Limits: No state; it does not load the author.
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

    public static previousAuthorId (communications: CommunicationModel[] | undefined, index: number): string | undefined {
        const previous: CommunicationModel | undefined = index > 0 ? communications?.[ index - 1 ] : undefined
        return previous ? CommunicationHelper.getAuthorId( previous ) : undefined
    }

    public static nextAuthorId (communications: CommunicationModel[] | undefined, index: number): string | undefined {
        const next: CommunicationModel | undefined = communications?.[ index + 1 ]
        return next ? CommunicationHelper.getAuthorId( next ) : undefined
    }
}
