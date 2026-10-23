import { GenericApi } from '@shared/helpers/api/generic.api'
import { SELECT_PROFILE_PROJECT_ID } from '@shared/helpers/request.helper'

/**
 * Purpose: Sends the HTTP requests of the generic project domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
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
