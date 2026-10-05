import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { Select, SelectModule } from 'primeng/select'
import { ToggleButtonModule } from 'primeng/togglebutton'
import { PageEventModel } from '../../../../../shared/util-model/model/page-event.model'
import { GenericListComponent } from '../../../../../shared/util-tool/component/generic-list.component'
import { RegistryTemplateDirective } from '../../../../../shared/util-tool/directive/registry-template.directive'
import { ListComponent } from '../../../../../shared/util-ui/list/list.component'
import {
	ParticipantElementComponent,
} from '../../../../../shared/util-ui/participant-element/participant-element.component'
import { ParticipantFacade } from '../data/state/participant.facade'
import { ParticipantRoutesEnum } from '../participant-routes.enum'

@Component({
	selector: 'app-participants-list',
	templateUrl: './participants-list.component.html',
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
export class ParticipantsListComponent extends GenericListComponent {
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
		this.facade.fetchParticipantsPage(undefined, undefined, false)
	}

	protected loadPage(pageEvent: PageEventModel): void {
		this.facade.inputPageSearchParameters(
			this.textSearched.value,
			this.statusSearched.value,
			this.visibilitySearched.value,
		)
		this.facade.fetchParticipantsPage(pageEvent.pageNumber, pageEvent.pageSize, false)
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
