import { Component, inject} from '@angular/core'
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms'
import {PageEventModel} from '@shared/models/model/page-event.model'
import {ParticipantFacade} from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import {ListComponent} from '@shared/ui/common/list/list.component'
import {RegistryTemplateDirective} from '@shared/directives/registry-template.directive'
import {TranslatePipe} from '@ngx-translate/core'
import {InputTextModule} from 'primeng/inputtext'
import {ToggleButtonModule} from 'primeng/togglebutton'
import {
    ParticipantElementComponent,
} from '@shared/ui/participant-element/participant-element.component'
import {RouterLink} from '@angular/router'
import {ParticipantRoutesEnum} from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum'
import {Button} from 'primeng/button'
import {Select, SelectModule} from 'primeng/select'
import {GenericListComponent} from '@shared/ui/base/generic-list.component'

@Component({
    selector: 'app-participants-list',
    templateUrl: './participants-list.page.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslatePipe,
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

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            textSearched: this.formBuilder.control(this.facade.participantsPageTextSearchedParam()),
            statusSearched: this.formBuilder.control(this.facade.participantsPageStatusSearchedParam()),
            visibilitySearched: this.formBuilder.control(this.facade.participantsPageVisibilitySearchedParam()),
        })
    }

    protected loadData(): void {
        this.facade.fetchParticipantsPage(undefined, undefined)
    }

    protected loadPage(pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.statusSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchParticipantsPage(pageEvent.pageNumber, pageEvent.pageSize)
    }

    protected get textSearched(): FormControl {
        return this.form.get('textSearched') as FormControl
    }

    protected get statusSearched(): FormControl {
        return this.form.get('statusSearched') as FormControl
    }

    protected get visibilitySearched(): FormControl {
        return this.form.get('visibilitySearched') as FormControl
    }
}
