import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	inject,
	input,
	OnInit,
	output,
	Signal,
	signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';
import { tap } from 'rxjs';

import { BrowserService } from '@core/browser/browser.service';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { AlertHelper } from '@shared/helpers/alert.helper';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { MovementHelper } from '@shared/helpers/movement.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { MenuEntryModel } from '@shared/models/model/menu-entry.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { BaseFormComponent } from '@shared/ui/base/base-form.component';
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component';
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import {
	CommunicationFormModel,
	createCommunicationForm,
	emptyCommunicationFormModel,
	toCommunicationDto,
	toNewAlertDto,
} from '@shared/ui/domain/communication-form/communication.form';
import { CommunicationFieldMenuComponent } from '@shared/ui/domain/communication-form/communication-field-menu/communication-field-menu.component';
import { CommunicationLinkSelectComponent } from '@shared/ui/domain/communication-form/communication-link-select/communication-link-select.component';
import { CommunicationNewAlertFieldComponent } from '@shared/ui/domain/communication-form/communication-new-alert-field/communication-new-alert-field.component';

import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/icon-button';
import '@sgdf/ui/input';
import '@sgdf/ui/menu';
import '@sgdf/ui/menu-item';
import '@sgdf/ui/option';
import '@sgdf/ui/select';
import '@sgdf/ui/textarea';

enum CommunicationModulableFieldEnum {
	MOVEMENT = 'movement',
	ALERT = 'alert',
}

enum AlertModulableFieldEnum {
	SELECT = 'SELECT',
	NEW = 'NEW',
}

/**
 * Objectif: Formulaire de création ou d'édition d'une communication.
 * Périmètre: Lie la communication à un mouvement ou une alerte et la soumet via la facade des communications.
 * Limites: Ne décide pas de la navigation après la soumission.
 */
@Component({
	selector: 'app-communication-form',
	imports: [
		FieldErrorDirective,
		FormErrorComponent,
		FieldErrorComponent,
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		DateFormatPipe,
		SectionErrorComponent,
		CommunicationLinkSelectComponent,
		CommunicationNewAlertFieldComponent,
		CommunicationFieldMenuComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './communication-form.component.html',
	styleUrl: './communication-form.component.css',
})
export class CommunicationFormComponent extends BaseFormComponent implements OnInit {
	protected readonly GenericHelper = GenericHelper;
	protected readonly DateFormatTypeEnum = DateFormatTypeEnum;
	protected readonly facade = inject(CommunicationFacade);
	protected readonly alertFacade = inject(AlertFacade);
	protected readonly classicDatePipe = inject(DateFormatPipe);

	protected readonly searchError = computed(
		() => this.facade.metadataErrors()['searchedMovements'] ?? this.facade.metadataErrors()['searchedAlerts'],
	);

	protected readonly movementChoices = computed(() =>
		this.withSelected(this.facade.searchedMovementsMetadata(), this.model().movement),
	);
	protected readonly alertChoices = computed(() =>
		this.withSelected(this.facade.searchedAlertsMetadata(), this.model().alert),
	);
	protected readonly hasLinkField = computed(
		() =>
			GenericHelper.isNull(this.facade.communication()) &&
			(this.movementSelectorVisible() || GenericHelper.nonNull(this.alertSelectorMode())),
	);
	protected readonly selectedMovementKey = computed(() => this.model().movement?.value.id ?? '');
	protected readonly selectedAlertKey = computed(() => this.model().alert?.value.id ?? '');
	protected readonly now = new Date();
	protected readonly AlertModulableFieldEnum = AlertModulableFieldEnum;

	public readonly initialAlert = input<AlertModel | undefined>();
	public readonly startWithNewAlert = input<boolean>(false);
	public readonly saved = output();
	public readonly initialMovement = input<MovementModel | undefined>(undefined);

	private readonly allActions: Signal<MenuEntryModel[]> = signal([
		{
			id: CommunicationModulableFieldEnum.MOVEMENT,
			label: 'communications.form.actions.add-movement',
			icon: 'right-left',
			disabled: false,
			command: () => this.movementSelectorVisible.set(true),
		},
		{
			id: CommunicationModulableFieldEnum.ALERT,
			label: 'communications.form.actions.link-alert',
			icon: 'triangle-exclamation',
			disabled: false,
			command: () => this.alertSelectorMode.set(AlertModulableFieldEnum.SELECT),
		},
		{
			id: CommunicationModulableFieldEnum.ALERT,
			label: 'communications.form.actions.add-alert',
			icon: 'triangle-exclamation',
			disabled: false,
			command: () => this.alertSelectorMode.set(AlertModulableFieldEnum.NEW),
		},
	]);

	private readonly hasAlertOption = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.ALERT);

	protected readonly actions = computed(() => this.buildModulableFields(this.allActions()));

	protected readonly movementSelectorVisible = signal(false);
	protected readonly alertSelectorMode = signal<AlertModulableFieldEnum | undefined>(undefined);

	protected readonly model = signal(emptyCommunicationFormModel());
	protected readonly form = createCommunicationForm(this.model, {
		newAlert: () => this.alertSelectorMode() === AlertModulableFieldEnum.NEW,
	});

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	public ngOnInit(): void {
		this.applyInitialLinks();
	}

	private applyInitialLinks(): void {
		const alert = this.initialAlert();
		const movement = this.initialMovement();
		if (this.startWithNewAlert() && !alert && this.hasAlertOption())
			this.alertSelectorMode.set(AlertModulableFieldEnum.NEW);
		this.model.update((current): CommunicationFormModel => ({
			...current,
			alert: alert ? FormModelHelper.copy(AlertHelper.toSelectItem(alert, this.classicDatePipe)) : current.alert,
			movement: movement
				? FormModelHelper.copy(MovementHelper.toActivitySelectItem(movement, this.classicDatePipe))
				: current.movement,
		}));
	}

	protected override loadData(): void {
		this.facade.resetCommunication();

		if (GenericHelper.nonNull(this.idParam)) {
			this.facade.fetchCommunication(this.idParam);
		}
	}

	protected handleLoadedElement(): void {
		this.facade.communication$
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((communication) => this.fillForm(communication));
	}

	private fillForm(element: CommunicationModel | undefined): void {
		if (!element) return;

		this.model.set({
			...this.model(),
			message: element.message ?? '',
			movement: element.movement
				? FormModelHelper.copy(MovementHelper.toActivitySelectItem(element.movement, this.classicDatePipe))
				: null,
			alert: element.alert
				? FormModelHelper.copy(AlertHelper.toSelectItem(element.alert, this.classicDatePipe))
				: null,
		});
	}

	protected resetForm(): void {
		this.facade.resetCommunication();
		this.movementSelectorVisible.set(false);
		this.alertSelectorMode.set(undefined);
		this.form().reset(emptyCommunicationFormModel());
		this.applyInitialLinks();
	}

	protected readonly shortcutLabel: string = inject(BrowserService).isApplePlatform ? '⌘ + ↵' : 'Ctrl + ↵';

	protected submitOnShortcut(event: KeyboardEvent): void {
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			this.submit();
		}
	}

	protected submit(): void {
		if (this.saving()) return;

		if (!this.isFormValid(this.form)) {
			return;
		}

		if (this.alertSelectorMode() === AlertModulableFieldEnum.NEW) {
			this.submitAlert();
		} else {
			this.submitCommunication();
		}
	}

	private submitCommunication(): void {
		const communication = this.facade.communication();
		const dto = toCommunicationDto(this.model(), communication);
		this.save(
			(communication
				? this.facade.updateCommunication(communication.id, dto, ETagHelper.ifMatch(communication))
				: this.facade.createCommunication(dto)
			).pipe(tap(() => this.afterSubmit())),
			false,
		);
	}

	private afterSubmit(): void {
		this.resetForm();
		this.saved.emit();
	}

	private submitAlert(): void {
		const dto = toNewAlertDto(this.model(), this.facade.communication());
		this.save(this.alertFacade.createAlert(dto).pipe(tap(() => this.afterSubmit())), false);
	}

	protected handleMovementSearch(searched: { query: string }): void {
		this.facade.searchMovements(searched.query);
	}

	protected handleAlertSearch(searched: { query: string }): void {
		this.facade.searchAlerts(searched.query);
	}

	protected selectMovement(key: string): void {
		const chosen = this.movementChoices().find((option) => option.value.id === key);
		this.model.update((current): CommunicationFormModel => ({
			...current,
			movement: chosen ? FormModelHelper.copy(chosen) : null,
		}));
	}

	protected selectAlert(key: string): void {
		const chosen = this.alertChoices().find((option) => option.value.id === key);
		this.model.update((current): CommunicationFormModel => ({
			...current,
			alert: chosen ? FormModelHelper.copy(chosen) : null,
		}));
	}

	private withSelected<T extends { id: string }>(
		found: SelectOptionModel<T>[],
		selected: SelectOptionModel<T> | null,
	): SelectOptionModel<T>[] {
		if (!selected) return found;
		const isSelectedListed = found.some((option) => option.value.id === selected.value.id);
		return isSelectedListed ? found : [selected, ...found];
	}

	protected removeMovementField(): void {
		this.model.update((current): CommunicationFormModel => ({
			...current,
			movement: null,
		}));
		this.movementSelectorVisible.set(false);
	}

	protected removeAlertField(): void {
		this.model.update((current): CommunicationFormModel => ({
			...current,
			alert: null,
			newAlertTitle: '',
		}));
		this.alertSelectorMode.set(undefined);
	}

	protected override get idParam(): string | undefined {
		return this.route.snapshot.params['communicationId'];
	}

	private buildModulableFields(actions: MenuEntryModel[]): MenuEntryModel[] {
		return actions
			.filter((action) =>
				action.id === CommunicationModulableFieldEnum.ALERT
					? GenericHelper.isNull(this.initialAlert()) && this.hasAlertOption()
					: GenericHelper.isNull(this.initialMovement()),
			)
			.map((action): MenuEntryModel => ({
				...action,
				disabled:
					action.disabled ||
					(action.id === CommunicationModulableFieldEnum.ALERT &&
						GenericHelper.nonNull(this.alertSelectorMode())) ||
					(action.id === CommunicationModulableFieldEnum.MOVEMENT && this.movementSelectorVisible()),
			}));
	}
}
