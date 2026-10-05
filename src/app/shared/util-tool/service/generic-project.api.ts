import { SELECT_PROFILE_PROJECT_ID } from '../util/request.util'
import { GenericApi } from './generic.api'

export abstract class GenericProjectApi extends GenericApi {
	protected constructor(baseUrl: string | undefined = undefined) {
		super(baseUrl)
	}

	protected buildRequestBaseUrl(projectId: string | undefined): string {
		if (projectId != undefined) {
			return this.baseUrl.replace(SELECT_PROFILE_PROJECT_ID, projectId)
		}
		return this.baseUrl
	}
}
