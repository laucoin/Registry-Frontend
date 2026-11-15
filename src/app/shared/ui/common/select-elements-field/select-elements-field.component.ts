import { NgTemplateOutlet } from '@angular/common';
import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	InputSignal,
	model,
	output,
	signal,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { BrowserService } from '@core/browser/browser.service';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { EventHelper } from '@shared/helpers/event.helper';
import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper';
import { FieldErrorState } from '@shared/helpers/form/field-state.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { SelectionAnnouncementEnum } from '@shared/models/enumeration/selection-announcement.enum';
import { BaseModel } from '@shared/models/model/base.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

import '@sgdf/ui/icon-button';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/option';
import '@sgdf/ui/select';
import '@sgdf/ui/tag';

const identities = new WeakMap<object, string>();

// Les éléments sans id ne doivent pas entrer en collision : chaque objet reçoit sa propre clé stable.
function identityOf(element: object): string {
	const known = identities.get(element);
	if (known) return known;
	const identity = `identity-${crypto.randomUUID()}`;
	identities.set(element, identity);
	return identity;
}

/**
 * Objectif: Champ de formulaire sélectionnant plusieurs éléments recherchés.
 * Périmètre: Demande au parent de rechercher pendant la saisie, choisit une suggestion à la fois dans la liste de sélection, met en évidence un doublon, et peut déplier une suggestion en plusieurs éléments affichés sous un groupe supprimable.
 * Limites: Ne possède aucune source de données ; le parent fournit la recherche, les options, le dépliage et le regroupement.
 */
@Component({
	selector: 'app-select-elements-field',
	imports: [EllipsisDirective, NgTemplateOutlet, TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './select-elements-field.component.html',
	styleUrl: './select-elements-field.component.css',
})
export class SelectElementsFieldComponent<
	T extends object,
	S extends BaseModel = T & BaseModel,
> implements FormValueControl<T[]> {
	private readonly browser = inject(BrowserService);
	private readonly transloco = inject(TranslocoService);
	private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

	protected readonly announcement = signal('');

	public readonly value = model<T[]>([]);
	public readonly disabled = input(false);
	public readonly touched = input(false);
	public readonly required = input(false);
	public readonly appFieldError = input<(() => FieldErrorState) | undefined>();
	public readonly translationPrefix = input<string | undefined>();
	public readonly touch = output();

	public readonly suggestions = input<SelectOptionModel<S>[]>([]);
	public readonly selectItemBuilder: InputSignal<(element: T) => SelectOptionModel<unknown>> = input.required();
	public readonly identify: InputSignal<(element: T) => string> = input(
		(element: T) => (element as Partial<BaseModel>).id ?? identityOf(element),
	);
	public readonly expand: InputSignal<(chosen: S) => T[]> = input((chosen: S) => [chosen as unknown as T]);
	public readonly groupOf = input<(element: T) => string | undefined>(() => undefined);
	public readonly warningOf = input<(element: T) => string | undefined>(() => undefined);
	public readonly groupLabel: InputSignal<(name: string) => string> = input((name: string): string => name);
	public readonly ungroupedLabel = input<string | undefined>();
	public readonly label: InputSignal<string | undefined> = input();
	public readonly hint: InputSignal<string | undefined> = input();
	public readonly loading = input(false);
	public readonly placeholder: InputSignal<string | undefined> = input();
	public readonly selectionLabel = input<string | undefined>();
	public readonly emptyMessage = input<string | undefined>();
	public readonly emptySelectionMessage = input<string | undefined>();

	public handleSearch = output<{ query: string }>();

	protected readonly ungrouped = computed(() =>
		this.value().filter((element) => this.groupOf()(element) === undefined),
	);
	protected readonly errorText = computed(() => this.buildErrorText());
	protected readonly groups = computed(() => this.groupElements());

	protected handleChoice(event: Event): void {
		const chosen = this.suggestions().find(
			(suggestion) => suggestion.value.id === EventHelper.valueOf(event),
		)?.value;
		if (chosen) this.handleElementSelection(chosen);
	}

	private handleElementSelection(chosen: S): void {
		const elements = this.expand()(chosen);
		const added = elements.filter((element) => !this.isSelected(element));
		elements
			.filter((element) => this.isSelected(element))
			.forEach((element) => this.highlightDuplicated(this.identify()(element)));
		if (added.length > 0) this.onInputChange([...this.value(), ...added]);
		this.announceChoice(elements, added);
	}

	private announceChoice(elements: T[], added: T[]): void {
		if (elements.length === 0) return;
		if (added.length === 0) this.announce(SelectionAnnouncementEnum.DUPLICATE, elements[0]);
		else this.announce(SelectionAnnouncementEnum.ADDED, added[0]);
	}

	private isSelected(element: T): boolean {
		return this.value().some((selected) => this.identify()(selected) === this.identify()(element));
	}

	protected handleElementRemoving(elementId: string): void {
		const removed = GenericHelper.require(
			this.value().find((element) => this.identify()(element) === elementId),
			'removed element',
		);
		this.onInputChange(this.value().filter((element) => this.identify()(element) !== elementId));
		this.announce(SelectionAnnouncementEnum.REMOVED, removed);
		this.focusSearch();
	}

	protected handleGroupRemoving(name: string): void {
		this.onInputChange(this.value().filter((element) => this.groupOf()(element) !== name));
		this.announcement.set(this.transloco.translate('global.selection.removed', { name: this.groupLabel()(name) }));
		this.focusSearch();
	}

	private focusSearch(): void {
		this.browser.elementOf(this.host).querySelector<HTMLElement>('sgdf-select')?.focus({ preventScroll: true });
	}

	private groupElements(): { name: string; elements: T[] }[] {
		const byName = new Map<string, T[]>();
		this.value().forEach((element) => {
			const name = this.groupOf()(element);
			if (name !== undefined) byName.set(name, [...(byName.get(name) ?? []), element]);
		});
		return [...byName.entries()].map(([name, elements]) => ({
			name,
			elements,
		}));
	}

	private announce(kind: SelectionAnnouncementEnum, element: T): void {
		this.announcement.set(
			this.transloco.translate(`global.selection.${kind}`, { name: this.selectItemBuilder()(element).label }),
		);
	}

	protected highlightDuplicated(elementId: string): void {
		this.browser.highlightByDataValue(elementId, this.browser.elementOf(this.host));
	}

	private onInputChange(value: T[]): void {
		this.value.set(value);
		this.touch.emit();
	}

	private buildErrorText(): string {
		const field = this.appFieldError();
		const prefix = this.translationPrefix();
		if (!field || !prefix) return '';
		return FieldErrorHelper.text(field, prefix, {}, (key, params) => this.transloco.translate(key, params)) ?? '';
	}
}
