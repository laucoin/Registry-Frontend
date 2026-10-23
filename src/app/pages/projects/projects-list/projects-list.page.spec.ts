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
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';

interface ProjectsListApi {
    model: WritableSignal<ProjectsListSearchModel>
    optionsProject: WritableSignal<ProjectModel | undefined>
    canCreate: () => boolean
    canFilterByProfile: () => boolean
    activeFilters: () => number
    search: () => void
    resetFilters: () => void
    loadBatch: (event: { page: number, size: number }) => void
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
        facade['projectsPageQueryParam'].mockReturnValue(undefined)
        facade['projectsPageAtParam'].mockReturnValue(undefined)
        facade['projectsPageIsVisibleParam'].mockReturnValue(undefined)
        facade['projectsPageIsFavoriteParam'].mockReturnValue(undefined)
        facade['projectsPageWithProfileParam'].mockReturnValue(undefined)
        authorities = signal(['REGISTRY_PROJECT_C', 'REGISTRY_PROJECT_R'])
        TestBed.configureTestingModule({
            providers: [
                REFRESH_SERVICE_STUB,
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
        expect(model).toEqual({ q: '', at: null, isVisible: '', isFavorite: '', withProfile: '' })
    })

    it('sends the typed filters to the facade and restarts from the first batch', () => {
        // Arrange
        const page: ProjectsListApi = create()
        const when: Date = new Date(2026, 9, 3)
        page.model.set({ q: 'camp', at: when, isVisible: 'false', isFavorite: 'true', withProfile: '' })

        // Act
        page.search()

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith('camp', when, false, true, undefined)
        expect(facade['fetchProjectsPage']).toHaveBeenLastCalledWith(0, undefined)
    })

    it('clears the filters when they are reset, then searches again', () => {
        // Arrange
        const page: ProjectsListApi = create()
        page.model.set({ q: 'camp', at: new Date(), isVisible: 'true', isFavorite: 'false', withProfile: '' })

        // Act
        page.resetFilters()

        // Assert
        expect(page.model()).toEqual({ q: '', at: null, isVisible: '', isFavorite: '', withProfile: '' })
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, undefined)
    })

    it('toggles the favorite of a project through the facade', () => {
        // Arrange
        const page: ProjectsListApi = create()
        const project: ProjectModel = { id: 'p1', favorite: false } as ProjectModel

        // Act
        ;(page as unknown as { toggleFavorite: (project: ProjectModel) => void }).toggleFavorite(project)

        // Assert
        expect(facade['toggleFavorite']).toHaveBeenCalledWith(project)
    })

    it('asks the facade for the requested batch without touching the search parameters', () => {
        // Arrange
        const page: ProjectsListApi = create()

        // Act
        page.loadBatch({ page: 2, size: 20 })

        // Assert
        expect(facade['fetchProjectsPage']).toHaveBeenLastCalledWith(2, 20)
        expect(facade['inputPageSearchParameters']).not.toHaveBeenCalled()
    })

    it('counts the filters applied by the facade, leaving out the profile switch', () => {
        // Arrange
        const page: ProjectsListApi = create()
        facade['projectsPageQueryParam'].mockReturnValue('camp')
        facade['projectsPageIsVisibleParam'].mockReturnValue(false)

        // Act
        const count: number = page.activeFilters()

        // Assert
        expect(count).toBe(2)
    })

    it('sends the profile filter when the user has the global read authority', () => {
        // Arrange
        const page: ProjectsListApi = create()
        page.model.set({ q: '', at: null, isVisible: '', isFavorite: '', withProfile: 'true' })

        // Act
        page.search()

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, true)
    })

    it('never sends the profile filter without the global read authority', () => {
        // Arrange
        const page: ProjectsListApi = create()
        authorities.set(['REGISTRY_PROJECT_C'])
        page.model.set({ q: '', at: null, isVisible: '', isFavorite: '', withProfile: 'true' })

        // Act
        page.search()

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, undefined)
    })

    it('reads the creation right from the session', () => {
        // Arrange
        const page: ProjectsListApi = create()
        authorities.set(['REGISTRY_PROJECT_R'])

        // Act
        const rights: boolean[] = [page.canCreate()]

        // Assert
        expect(rights).toEqual([false])
    })

    it.each([['  vercors 2026', 'V2'], ['Camp d\'été Vercors', 'CD'], ['Rallye', 'RA'], ['🔥 feu de camp', '🔥F'], ['🔥🔥🔥', '🔥🔥']])('builds the avatar initials of "%s"', (name: string, expected: string) => {
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
