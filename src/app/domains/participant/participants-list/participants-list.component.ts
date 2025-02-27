import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { ParticipantFacade } from '../data/state/participant.facade'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { DropdownModule } from 'primeng/dropdown'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { ParticipantElementComponent } from '../../../shared/util-ui/participant-element/participant-element.component'
import { RouterLink } from '@angular/router'
import { ParticipantRoutesEnum } from '../participant-routes.enum'
import { Button } from 'primeng/button'
import { Select } from 'primeng/select'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'

@Component( {
    selector: 'app-participants-list',
    standalone: true,
    templateUrl: './participants-list.component.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        DropdownModule,
        ToggleButtonModule,
        ParticipantElementComponent,
        RouterLink,
        Button,
        Select,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ParticipantsListComponent extends GenericListComponent {
    protected readonly facade: ParticipantFacade = inject( ParticipantFacade )

    protected readonly ParticipantRoutesEnum: typeof ParticipantRoutesEnum = ParticipantRoutesEnum

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.participantsPageTextSearchedParam() ),
            statusSearched: this.formBuilder.control( this.facade.participantsPageStatusSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.participantsPageVisibilitySearchedParam() ),
        } )
    }

    protected loadData (): void {
        const eventId: string | undefined = this.route.snapshot.params['eventId']
        if (!eventId) return
        this.facade.fetchParticipantsPage( undefined, undefined, false, eventId )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.statusSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchParticipantsPage( pageEvent.pageNumber, pageEvent.pageSize, false, eventId )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get statusSearched (): FormControl {
        return this.form.get( 'statusSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }
}
