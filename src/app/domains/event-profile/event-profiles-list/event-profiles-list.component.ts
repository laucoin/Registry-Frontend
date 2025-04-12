import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { PageEventModel } from '../../../shared/util-model/model/page-event.model'
import { EventProfileFacade } from '../data/state/event-profile.facade'
import { ListComponent } from '../../../shared/util-ui/list/list.component'
import { RegistryTemplateDirective } from '../../../shared/util-tool/directive/registry-template.directive'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'
import { ToggleButtonModule } from 'primeng/togglebutton'
import {
    EventProfileElementComponent,
} from '../../../shared/util-ui/event-profile-element/event-profile-element.component'
import { RouterLink } from '@angular/router'
import { DropdownModule } from 'primeng/dropdown'
import { EventProfileRoutesEnum } from '../event-profile-routes.enum'
import { Select } from 'primeng/select'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { GenericListComponent } from '../../../shared/util-tool/component/generic-list.component'

@Component( {
    selector: 'app-event-profiles-list',
    standalone: true,
    templateUrl: './event-profiles-list.component.html',
    imports: [
        ListComponent,
        RegistryTemplateDirective,
        ReactiveFormsModule,
        TranslateModule,
        InputTextModule,
        ToggleButtonModule,
        EventProfileElementComponent,
        DropdownModule,
        RouterLink,
        Select,
        Button,
        DatePicker,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class EventProfilesListComponent extends GenericListComponent {
    protected readonly facade: EventProfileFacade = inject( EventProfileFacade )

    protected readonly EventProfileRoutesEnum: typeof EventProfileRoutesEnum = EventProfileRoutesEnum

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            textSearched: this.formBuilder.control( this.facade.eventProfilesPageTextSearchedParam() ),
            dateTimeSearched: this.formBuilder.control( this.facade.eventProfilesPageDateTimeSearchedParam() ),
            statusSearched: this.formBuilder.control( this.facade.eventProfilesPageStatusSearchedParam() ),
            availabilitySearched: this.formBuilder.control( this.facade.eventProfilesPageAvailabilitySearchedParam() ),
        } )
    }

    protected loadData (): void {
        const eventId: string = this.route.snapshot.params['eventId']
        if (!eventId) return
        this.facade.fetchEventProfilesPage( undefined, undefined, false, eventId )
    }

    protected loadPage (pageEvent: PageEventModel, eventId: string | undefined): void {
        this.facade.inputPageSearchParameters(
            this.textSearched.value,
            this.dateTimeSearched.value,
            this.statusSearched.value,
            this.availabilitySearched.value,
        )
        this.facade.fetchEventProfilesPage( pageEvent.pageNumber, pageEvent.pageSize, false, eventId )
    }

    protected get textSearched (): FormControl {
        return this.form.get( 'textSearched' ) as FormControl
    }

    protected get dateTimeSearched (): FormControl {
        return this.form.get( 'dateTimeSearched' ) as FormControl
    }

    protected get statusSearched (): FormControl {
        return this.form.get( 'statusSearched' ) as FormControl
    }

    protected get availabilitySearched (): FormControl {
        return this.form.get( 'availabilitySearched' ) as FormControl
    }
}
