import { inject } from '@angular/core'
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { SelectItem } from 'primeng/api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'
import { ProjectProfileStoreModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-store.model'
import { ProjectProfileApi } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.api'
import { refreshOnLanguageChange } from '@shared/helpers/store/language-refresh'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { metadataFetcher, pageFetcher, paramsUpdater, withEmptyOption } from '@shared/helpers/store/paged-store.methods'
import { UserHelper } from '@shared/helpers/user.helper'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserModel } from '@shared/models/model/user.model'

interface ProjectProfilesPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface SearchUsersRequest {
    projectId: string | undefined
    textSearched: string | undefined
}

const defaultProjectProfileStore: ProjectProfileStoreModel = {
    projectProfiles: PageStateHelper.initial<ProjectProfilePageParamsModel, ProjectProfileModel>( {
        resetSearch: false,
        availabilitySearched: undefined,
        statusSearched: undefined,
        textSearched: undefined,
        dateTimeSearched: undefined,
    } ),
    metadata: {
        roles: [],
        status: [],
        searched: [],
        availabilities: [
            { label: '-', value: undefined },
            { label: 'project-profiles.visible.true', value: true },
            { label: 'project-profiles.visible.false', value: false },
        ],
    },
}

/**
 * Purpose: Holds the project profile state.
 * Scope: Owns the data of the project profile pages and resources with their loading and error flags, and fetches them through the project profile api.
 * Limits: Reached through the project profile facade; it does not format data or notify the user of command results.
 */
export const ProjectProfileStore = signalStore(
    withState<ProjectProfileStoreModel>( defaultProjectProfileStore ),
    withMethods( (store, api = inject( ProjectProfileApi ), metadataApi = inject( MetadataApi ), errors = inject( ErrorReporter )) => ({
        fetchProfileStatus: metadataFetcher<ProjectProfileStoreModel, 'status', void, SelectItem<ProfileStatusEnum>[]>(
            store, 'status', () => metadataApi.getProfilesStatus(), errors, withEmptyOption,
        ),
        fetchProjectProfilesPage: pageFetcher( store, 'projectProfiles', (request: ProjectProfilesPageRequest, params: ProjectProfilePageParamsModel) =>
            api.findProjectProfiles( request.projectId, request.pageNumber, request.pageSize, params ), errors ),
        updateProjectProfilesPageSearchParams: paramsUpdater( store, 'projectProfiles' ),
        searchUsers: metadataFetcher<ProjectProfileStoreModel, 'searched', SearchUsersRequest, UserModel[]>(
            store, 'searched', (request: SearchUsersRequest) => api.searchUsers( request.projectId, request.textSearched ), errors,
            (users: UserModel[]): SelectItem<UserModel>[] => users.map( UserHelper.toSelectItem ),
        ),
        fetchAssignableRoles: metadataFetcher<ProjectProfileStoreModel, 'roles', string | undefined, SelectItem<string>[]>(
            store, 'roles', (projectId: string | undefined) => api.getAssignableProjectProfileRoles( projectId ), errors,
        ),
    }) ),
    withHooks( {
        onInit: (store): void => refreshOnLanguageChange( store.fetchProfileStatus ),
    } ),
)
