import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import {
	ActivityFormModel,
	createActivityForm,
	toActivityDto,
	toActivityFormModel,
} from '@pages/projects/[projectId]/configuration/activities/activity-form/activity.form';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { ActivityModel } from '@shared/models/model/activity.model';
import { BaseElementFormComponent } from '@shared/ui/base/base-element-form.component';
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component';
import { NumberRangeFieldComponent } from '@shared/ui/common/number-range-field/number-range-field.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/duration-picker';
import '@sgdf/ui/input';
import '@sgdf/ui/textarea';

/**
 * Objectif: Page en dialogue avec le formulaire de création ou d'édition d'une activité, ouverte au-dessus de la liste des activités.
 * Périmètre: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
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
export class ActivityFormPage extends BaseElementFormComponent<ActivityModel, ActivityFormModel> {
	protected override readonly closesToParentRoute: boolean = true;
	protected readonly idParamName: string = 'activityId';
	private readonly facade = inject(ActivityFacade);

	protected readonly model = signal(toActivityFormModel());
	protected readonly form = createActivityForm(this.model, this.dateContext);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected fetchElement(id: string): Observable<ActivityModel> {
		return this.facade.fetchActivity(id);
	}

	protected toFormModel(activity: ActivityModel): ActivityFormModel {
		return toActivityFormModel(activity);
	}

	protected create(model: ActivityFormModel): Observable<ActivityModel> {
		return this.facade.createActivity(toActivityDto(model));
	}

	protected update(
		activity: ActivityModel,
		model: ActivityFormModel,
		ifMatch: string | undefined,
	): Observable<ActivityModel> {
		return this.facade.updateActivity(activity.id, toActivityDto(model), ifMatch);
	}
}
