import { FieldTree, FormField } from '@angular/forms/signals'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { ParticipantsListSearchModel, toParticipantsListSearchModel, toParticipantsListSearchParams } from './participants-list.search'
import { Component, inject, signal, WritableSignal } from '@angular/core'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ParticipantFacade} from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {
    ParticipantElementComponent,
} from '@shared/ui/domain/participant-element/participant-element.component'
import {RouterLink} from '@angular/router'
import {ParticipantRoutesEnum} from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum'
import {Button} from 'primeng/button'
import {Select, SelectModule} from 'primeng/select'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

/**
 * Purpose: Page listing the participants with search and lazy loading.
 * Scope: Binds the list component to the facade and reloads on command events.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-participants-list',
    templateUrl: './participants-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        FormField,
        TranslocoPipe,
        InputTextModule,
        SelectModule,
        ToggleButtonModule,
        ParticipantElementComponent,
        RouterLink,
        Button,
        Select,
    ],
})
export class ParticipantsListPage extends GenericListComponent {
    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)

    protected readonly ParticipantRoutesEnum: typeof ParticipantRoutesEnum = ParticipantRoutesEnum

    protected readonly model: WritableSignal<ParticipantsListSearchModel> = signal( toParticipantsListSearchModel( {
        textSearched: this.facade.participantsPageTextSearchedParam(),
        statusSearched: this.facade.participantsPageStatusSearchedParam(),
        visibilitySearched: this.facade.participantsPageVisibilitySearchedParam(),
    } ) )
    protected readonly form: FieldTree<ParticipantsListSearchModel> = createSearchForm( this.model )

    public constructor() {
        super()

        this.loadData()
    }

    protected loadData(): void {
        this.facade.fetchParticipantsPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        const search: ReturnType<typeof toParticipantsListSearchParams> = toParticipantsListSearchParams( this.model() )
        this.facade.inputPageSearchParameters(
            search.textSearched,
            search.statusSearched,
            search.visibilitySearched,
        )
        this.facade.fetchParticipantsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

}
