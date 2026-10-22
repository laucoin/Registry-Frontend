import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum'
import {
    MovementsListSearchModel,
    toMovementsListSearchModel,
    toMovementsListSearchParams,
} from '@pages/projects/[projectId]/movements/movements-list/movements-list.search'
import { ProjectEyebrowDirective } from '@shared/directives/project-eyebrow.directive'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component'

/**
 * Purpose: Page listing the movements of the selected project with search and a "load more" trigger.
 * Scope: Binds the list component to the movement facade and owns the search form; each row is a movement element.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-movements-list',
    imports: [
        ProjectEyebrowDirective,
        ListComponent,
        MovementElementComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        BooleanChoicePipe,
        TranslocoPipe,
        FormField,
        RouterLink,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './movements-list.page.html',
})
export class MovementsListPage {
    protected readonly facade: MovementFacade = inject(MovementFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly createRegisteredRoute: MovementRoutesEnum = MovementRoutesEnum.CREATE_REGISTERED
    protected readonly createGuestRoute: MovementRoutesEnum = MovementRoutesEnum.CREATE_GUEST

    protected readonly canCreate: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        this.facade.movementsPageTypeParam() !== undefined,
        this.facade.movementsPageFromParam() !== undefined,
        this.facade.movementsPageToParam() !== undefined,
        this.facade.movementsPageIsVisibleParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<MovementsListSearchModel> = signal(toMovementsListSearchModel({
        type: this.facade.movementsPageTypeParam(),
        from: this.facade.movementsPageFromParam(),
        to: this.facade.movementsPageToParam(),
        isVisible: this.facade.movementsPageIsVisibleParam(),
    }))
    protected readonly form: FieldTree<MovementsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchMovementsPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toMovementsListSearchParams> = toMovementsListSearchParams(this.model())
        this.facade.inputPageSearchParameters(search.type, search.from, search.to, search.isVisible)
        this.facade.fetchMovementsPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ type: '', from: null, to: null, isVisible: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchMovementsPage(pageEvent.page, pageEvent.size)
    }
}
