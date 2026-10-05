import { SELECT_PROFILE_PROJECT_ID } from '../util/request.util'
import { GenericService } from './generic.service'

export abstract class GenericProjectService extends GenericService {
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
