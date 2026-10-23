import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade'
import { ProjectActions } from '@pages/projects/projects-list/project-actions.service'
import { ProjectsListPage } from '@pages/projects/projects-list/projects-list.page'
import { ProjectsListSearchModel } from '@pages/projects/projects-list/projects-list.search'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum'
import { ProjectModel } from '@shared/models/model/project.model'

interface ProjectsListApi {
    model: WritableSignal<ProjectsListSearchModel>
    optionsProject: WritableSignal<ProjectModel | undefined>
    canCreate: () => boolean
    canFilterByProfile: () => boolean
    activeFilters: () => number
    search: () => void
    resetFilters: () => void
    loadBatch: (event: { pageNumber: number, pageSize: number }) => void
    initials: (project: ProjectModel) => string
    isAvailable: (project: ProjectModel) => boolean
    hiddenProject: WritableSignal<ProjectModel | undefined>
    closeDialog: (event: Event, shown: WritableSignal<ProjectModel | undefined>) => void
}

describe('ProjectsListPage', () => {
    let facade: Record<string, Mock>
    let authorities: WritableSignal<string[]>

    function create(): ProjectsListApi {
        facade = autoMock()
        facade['projectsPageTextSearchedParam'].mockReturnValue(undefined)
        facade['projectsPageDateTimeSearchedParam'].mockReturnValue(undefined)
        facade['projectsPageWithProfileSearchedParam'].mockReturnValue(true)
        facade['projectsPageVisibilitySearchedParam'].mockReturnValue(undefined)
        authorities = signal(['REGISTRY_PROJECT_C', 'REGISTRY_PROJECT_R'])
        TestBed.configureTestingModule({
            providers: [
                { provide: ProjectFacade, useValue: facade },
                { provide: ProjectActions, useValue: {} },
                { provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }) } },
            ],
        })
        TestBed.overrideComponent(ProjectsListPage, { set: { template: '', imports: [], providers: [] } })
        return TestBed.createComponent(ProjectsListPage).componentInstance as unknown as ProjectsListApi
    }

    beforeEach(() => {
        TestBed.resetTestingModule()
    })

    it('loads the first batch when it opens', () => {
        // Arrange
        // Act
        create()

        // Assert
        expect(facade['fetchProjectsPage']).toHaveBeenCalledWith(undefined, undefined)
    })

    it('starts from the search parameters kept by the facade', () => {
        // Arrange
        const page: ProjectsListApi = create()

        // Act
        const model: ProjectsListSearchModel = page.model()

        // Assert
        expect(model).toEqual({ textSearched: '', dateTimeSearched: null, withProfile: true, visibilitySearched: '' })
    })

    it('sends the typed filters to the facade and restarts from the first batch', () => {
        // Arrange
        const page: ProjectsListApi = create()
        const when: Date = new Date(2026, 9, 3)
        page.model.set({ textSearched: 'camp', dateTimeSearched: when, withProfile: false, visibilitySearched: 'false' })

        // Act
        page.search()

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith('camp', when, false, false)
        expect(facade['fetchProjectsPage']).toHaveBeenLastCalledWith(0, undefined)
    })

    it('clears the filters but keeps the profile switch when they are reset, then searches again', () => {
        // Arrange
        const page: ProjectsListApi = create()
        page.model.set({ textSearched: 'camp', dateTimeSearched: new Date(), withProfile: false, visibilitySearched: 'true' })

        // Act
        page.resetFilters()

        // Assert
        expect(page.model()).toEqual({ textSearched: '', dateTimeSearched: null, withProfile: false, visibilitySearched: '' })
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(undefined, undefined, false, undefined)
    })

    it('asks the facade for the requested batch without touching the search parameters', () => {
        // Arrange
        const page: ProjectsListApi = create()

        // Act
        page.loadBatch({ pageNumber: 2, pageSize: 20 })

        // Assert
        expect(facade['fetchProjectsPage']).toHaveBeenLastCalledWith(2, 20)
        expect(facade['inputPageSearchParameters']).not.toHaveBeenCalled()
    })

    it('counts the filters applied by the facade, leaving out the profile switch', () => {
        // Arrange
        const page: ProjectsListApi = create()
        facade['projectsPageTextSearchedParam'].mockReturnValue('camp')
        facade['projectsPageVisibilitySearchedParam'].mockReturnValue(false)

        // Act
        const count: number = page.activeFilters()

        // Assert
        expect(count).toBe(2)
    })

    it('reads the creation and profile search rights from the session', () => {
        // Arrange
        const page: ProjectsListApi = create()
        authorities.set(['REGISTRY_PROJECT_R'])

        // Act
        const rights: boolean[] = [page.canCreate(), page.canFilterByProfile()]

        // Assert
        expect(rights).toEqual([false, true])
    })

    it.each([['  vercors 2026', 'V2'], ['Camp d\'été Vercors', 'CD'], ['Rallye', 'RA']])('builds the avatar initials of "%s"', (name: string, expected: string) => {
        // Arrange
        const page: ProjectsListApi = create()

        // Act
        const initials: string = page.initials({ name } as ProjectModel)

        // Assert
        expect(initials).toBe(expected)
    })

    it('tells whether a project is available from its status', () => {
        // Arrange
        const page: ProjectsListApi = create()

        // Act
        const results: boolean[] = [
            page.isAvailable({ status: { value: AvailabilityStatusEnum.AVAILABLE } } as ProjectModel),
            page.isAvailable({ status: undefined } as ProjectModel),
        ]

        // Assert
        expect(results).toEqual([true, false])
    })

    it('closes a dialog only when the dialog itself is hidden', () => {
        // Arrange
        const page: ProjectsListApi = create()
        const dialog: EventTarget = new EventTarget()
        const nested: EventTarget = new EventTarget()
        page.optionsProject.set({ id: 'p1' } as ProjectModel)

        // Act
        page.closeDialog({ target: nested, currentTarget: dialog } as unknown as Event, page.optionsProject)
        const afterNested: ProjectModel | undefined = page.optionsProject()
        page.closeDialog({ target: dialog, currentTarget: dialog } as unknown as Event, page.optionsProject)

        // Assert
        expect(afterNested).toBeDefined()
        expect(page.optionsProject()).toBeUndefined()
    })
})
