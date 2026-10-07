import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { StringHelper } from '@shared/helpers/string.helper'

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
}
