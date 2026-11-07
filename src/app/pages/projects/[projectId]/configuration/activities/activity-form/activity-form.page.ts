import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import {
	createActivityForm,
	toActivityDto,
	toActivityFormModel,
} from '@pages/projects/[projectId]/configuration/activities/activity-form/activity.form';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { ActivityModel } from '@shared/models/model/activity.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component';
import { NumberRangeFieldComponent } from '@shared/ui/common/number-range-field/number-range-field.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/duration-picker';
import '@sgdf/ui/input';
import '@sgdf/ui/textarea';

/**
 * Purpose: Page en dialogue avec le formulaire de création ou d'édition d'une activité, ouverte au-dessus de la liste des activités.
 * Scope: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-activity-form',
	imports: [
		FormDialogComponent,
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		FieldErrorDirective,
		NumberRangeFieldComponent,
		FormTitlePipe,
		FormButtonPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './activity-form.page.html',
})
export class ActivityFormPage extends BaseFormComponent {
	protected override readonly closesToParentRoute: boolean = true;
	protected readonly facade = inject(ActivityFacade);

	protected readonly activity: WritableSignal<ActivityModel | undefined> = signal(undefined);
	protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly model = signal(toActivityFormModel());
	protected readonly form = createActivityForm(this.model, {
		project: this.contextProject,
		formatDate: (date) => this.datePipe.transform(date),
	});

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected override loadData(): void {
		if (GenericHelper.nonNull(this.idParam)) {
			this.facade
				.fetchActivity(this.idParam)
				.pipe(withLoading(this.loading))
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((activity) => {
					this.activity.set(activity);
					this.applyActivity(activity);
				});
		}
	}

	protected handleLoadedElement(): void {
		if (!GenericHelper.nonNull(this.idParam)) {
			this.applyActivity(undefined);
		}
	}

	private applyActivity(activity: ActivityModel | undefined): void {
		this.contextProject.set(this.sessionFacade.selectedProject());
		if (activity) this.model.set(toActivityFormModel(activity));
	}

	protected submit(): void {
		const activity: ActivityModel | undefined = this.activity();
		if (!this.canSubmit(activity, () => this.isFormValid(this.form))) return;

		const dto = toActivityDto(this.model());
		this.save(
			activity
				? this.facade.updateActivity(activity.id, dto, ETagHelper.ifMatch(activity))
				: this.facade.createActivity(dto),
		);
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['activityId'];
	}
}
