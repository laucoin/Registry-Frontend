import { GenericService } from './generic.service'
import { SELECT_PROFILE_EVENT_ID } from '../util/request.util'

export abstract class GenericEventService extends GenericService {
    protected constructor (baseUrl: string | undefined = undefined) {
        super( baseUrl )
    }

    protected buildRequestBaseUrl (eventId: string | undefined): string {
        if (eventId != undefined) {
            return this.baseUrl.replace( SELECT_PROFILE_EVENT_ID, eventId )
        }
        return this.baseUrl
    }
}
