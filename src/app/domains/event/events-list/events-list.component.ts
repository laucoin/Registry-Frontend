import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { EventFacade } from '../data/state/event.facade'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { EventElementComponent } from '../event-element/event-element.component'
import { Button } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { TranslateModule } from '@ngx-translate/core'
import { RouterLink } from '@angular/router'
import { EventRoutesEnum } from '../event-routes.enum'
import { Select } from 'primeng/select'
import { DatePicker } from 'primeng/datepicker'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'

@Component( {
    selector: 'app-events-list',
    standalone: true,
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        EventElementComponent,
        Button,
        FormsModule,
        InputTextModule,
        ToggleButtonModule,
        TranslateModule,
        ReactiveFormsModule,
        RouterLink,
        Select,
        DatePicker,
    ],
    templateUrl: './events-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class EventsListComponent extends GenericListComponent {
    protected readonly facade: EventFacade = inject( EventFacade )

    protected readonly EventRoutesEnum: typeof EventRoutesEnum = EventRoutesEnum

    public constructor () {
        super()

        this.form = this.initForm()

        this.facade.fetchEventsPage( undefined, undefined, false )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.eventsPageTextSearchedParam() ),
            dateTimeSearched: this.formBuilder.control( this.facade.eventsPageDateTimeSearchedParam() ),
            visibilitySearched: this.formBuilder.control( this.facade.eventsPageVisibilitySearchedParam() ),
        } )
    }

    protected loadPage (pageEvent: PageEventModel): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.visibilitySearched.value,
        )
        this.facade.fetchEventsPage( pageEvent.pageNumber, pageEvent.pageSize, false )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get dateTimeSearched (): FormControl {
        return this.form.get( 'dateTimeSearched' ) as FormControl
    }

    protected get visibilitySearched (): FormControl {
        return this.form.get( 'visibilitySearched' ) as FormControl
    }
}
