import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import {
	createVehicleForm,
	toVehicleDto,
	toVehicleFormModel,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { withLoading } from '@shared/helpers/rx.helper';
import { ProjectModel } from '@shared/models/model/project.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/input';

/**
 * Purpose: Page en dialogue avec le formulaire de création ou d'édition d'un véhicule, ouverte au-dessus de la liste des véhicules.
 * Scope: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-vehicle-form',
	imports: [
		FormDialogComponent,
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		FieldErrorDirective,
		FormTitlePipe,
		FormButtonPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './vehicle-form.page.html',
})
export class VehicleFormPage extends BaseFormComponent {
	protected override readonly closesToParentRoute: boolean = true;
	protected readonly facade = inject(VehicleFacade);

	protected readonly vehicle: WritableSignal<VehicleModel | undefined> = signal(undefined);
	protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined);
	protected readonly model = signal(toVehicleFormModel());
	protected readonly form = createVehicleForm(this.model, {
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
				.fetchVehicle(this.idParam)
				.pipe(withLoading(this.loading))
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((vehicle) => {
					this.vehicle.set(vehicle);
					this.applyVehicle(vehicle);
				});
		}
	}

	protected handleLoadedElement(): void {
		if (!GenericHelper.nonNull(this.idParam)) {
			this.applyVehicle(undefined);
		}
	}

	private applyVehicle(vehicle: VehicleModel | undefined): void {
		this.contextProject.set(this.sessionFacade.selectedProject());
		if (vehicle) this.model.set(toVehicleFormModel(vehicle));
	}

	protected submit(): void {
		const vehicle: VehicleModel | undefined = this.vehicle();
		if (!this.canSubmit(vehicle, () => this.isFormValid(this.form))) return;

		const dto = toVehicleDto(this.model());
		this.save(
			vehicle
				? this.facade.updateVehicle(vehicle.id, dto, ETagHelper.ifMatch(vehicle))
				: this.facade.createVehicle(dto),
		);
	}

	protected get idParam(): string | undefined {
		return this.route.snapshot.params['vehicleId'];
	}
}
