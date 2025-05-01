import { GenericService } from './generic.service'
import { SELECT_PROFILE_PROJECT_ID } from '../util/request.util'

export abstract class GenericProjectService extends GenericService {
    protected constructor (baseUrl: string | undefined = undefined) {
        super( baseUrl )
    }

    protected buildRequestBaseUrl (projectId: string | undefined): string {
        if (projectId != undefined) {
            return this.baseUrl.replace( SELECT_PROFILE_PROJECT_ID, projectId )
        }
        return this.baseUrl
    }
}
