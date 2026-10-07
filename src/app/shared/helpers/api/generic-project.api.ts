import { GenericApi } from '@shared/helpers/api/generic.api'
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/util/request.util'

export abstract class GenericProjectApi extends GenericApi {
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
