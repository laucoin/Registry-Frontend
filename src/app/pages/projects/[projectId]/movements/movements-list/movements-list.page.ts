import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { MovementsListSearchModel, toMovementsListSearchModel, toMovementsListSearchParams } from './movements-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import {MovementFacade} from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {MovementElementComponent} from '@shared/ui/domain/movement-element/movement-element.component'
import {RouterLink} from '@angular/router'
import {MovementRoutesEnum} from '@pages/projects/[projectId]/movements/movement-routes.enum'
import {Select, SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {DatePicker} from 'primeng/datepicker'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

/**
 * Purpose: Page listing the movements with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-movements-list',
    templateUrl: './movements-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        FormField,
        TranslocoPipe,
        InputTextModule,
        ToggleButtonModule,
        SelectModule,
        MovementElementComponent,
        RouterLink,
        Select,
        Button,
        DatePicker,
    ],
})
export class MovementsListPage extends GenericListComponent {
    protected readonly facade: MovementFacade = inject(MovementFacade)

    protected readonly MovementRoutesEnum: typeof MovementRoutesEnum = MovementRoutesEnum

    protected readonly model: WritableSignal<MovementsListSearchModel> = signal( toMovementsListSearchModel( {
        typeSearched: this.facade.movementsPageTypeSearchedParam(),
        startDateTimeSearched: this.facade.movementsPageStartDateTimeSearchedParam(),
        endDateTimeSearched: this.facade.movementsPageEndDateTimeSearchedParam(),
        visibilitySearched: this.facade.movementsPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<MovementsListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
    }

    protected loadData(): void {
        this.facade.fetchMovementsPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toMovementsListSearchParams> = toMovementsListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.typeSearched,
            search.startDateTimeSearched,
            search.endDateTimeSearched,
            search.visibilitySearched,
        )
        this.facade.fetchMovementsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
