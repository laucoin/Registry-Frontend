import { CommunicationModel } from '../../../domains/project/communication/data/model/communication.model'
import { StringUtil } from './string.util'

export class CommunicationUtil {
    public static getAuthorId (communication: CommunicationModel): string | undefined {
        switch (true) {
            case StringUtil.isNotNullNorBlank( communication.movement?.reason?.label ):
                return communication.movement!.id
            case StringUtil.isNotNullNorBlank( communication.lastEdition?.user?.firstName ):
                return communication.lastEdition!.user!.id
            default:
                return undefined
        }
    }
}
