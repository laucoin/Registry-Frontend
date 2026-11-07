import { FieldContext, maxLength, required, SchemaPath, validate, ValidationError } from '@angular/forms/signals';

import { DateHelper } from '@shared/helpers/date.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { StringHelper } from '@shared/helpers/string.helper';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { NumericRangeModel } from '@shared/models/model/numeric-range.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

type RegistryError = ValidationError.WithoutFieldTree & Readonly<Record<string, unknown>>;

export interface ProjectDateContext {
	project: () => ProjectModel | undefined;
	formatDate: (date: CustomDatetimeModel) => string | undefined;
}

type DateTimeValue = CustomDatetimeModel | Date | null;

function registryError(kind: string, params: Record<string, unknown> = {}): RegistryError {
	return { kind, ...params };
}

function toCustomDateTime(value: CustomDatetimeModel | Date): CustomDatetimeModel | undefined {
	return 'date' in value ? value : DateHelper.toCustomDateTime(value);
}

function firstMissingPreRequired(
	selected: Record<string, boolean>,
	options: ProjectOptionModel[],
): RegistryError | undefined {
	for (const option of options.filter((it) => !!selected[it.value])) {
		const absent = option.preRequired.find((it) => !selected[it.value]);
		if (absent) return registryError('preRequiredOptions', { for: option.label, missing: absent.label });
	}
	return undefined;
}

function projectBoundsError(
	date: CustomDatetimeModel | undefined,
	{ begin, end }: ProjectModel,
	format: (date: CustomDatetimeModel) => string | undefined,
): RegistryError | null {
	if (begin && DateHelper.isCustomBefore(date, begin)) return registryError('minDate', { min: format(begin) });
	if (end && DateHelper.isCustomDateAfter(date, end)) return registryError('maxDate', { max: format(end) });
	return null;
}

/**
 * Purpose: Règles de validation des signal forms de l'application, utilisant les codes d'erreur des traductions.
 * Scope: Fournit des règles de blancs, de dates, de plages, dépendantes des options et inter-champs appliquées aux chemins du schéma.
 * Limits: Valide côté client pour l'usage ; le backend valide à nouveau.
 */
export const RegistrySchemas = {
	nonBlank(path: SchemaPath<string>): void {
		validate(path, (ctx) => (StringHelper.isBlank(ctx.value()) ? registryError('blank') : null));
	},

	nonBlankIfFilled(path: SchemaPath<string>): void {
		validate(path, (ctx) =>
			ctx.value().length > 0 && StringHelper.isBlank(ctx.value()) ? registryError('blank') : null,
		);
	},

	requiredText(path: SchemaPath<string>, max: number): void {
		required(path);
		maxLength(path, max);
		RegistrySchemas.nonBlank(path);
	},

	notInTheFuture(path: SchemaPath<Date | null>, now: () => Date = () => new Date(), kind = 'maxDate'): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			return value && value.getTime() > now().getTime() ? registryError(kind, { max: undefined }) : null;
		});
	},

	requiredList<T>(path: SchemaPath<T[]>, when: (ctx: FieldContext<T[]>) => boolean = (): boolean => true): void {
		// Le `required` d'Angular n'échoue jamais sur un tableau vide ; il marque seulement le champ comme requis pour le contrôle.
		required(path, { when });
		validate(path, (ctx) => (ctx.value().length === 0 && when(ctx) ? registryError('required') : null));
	},

	projectDateTime(path: SchemaPath<CustomDatetimeModel | null>, context: ProjectDateContext): void {
		RegistrySchemas.dateRequiredForTime(path);
		RegistrySchemas.withinProject(path, context.project, context.formatDate);
	},

	withinProject(
		path: SchemaPath<DateTimeValue>,
		project: () => ProjectModel | undefined,
		format: (date: CustomDatetimeModel) => string | undefined,
	): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			if (GenericHelper.isNull(value)) return null;
			return projectBoundsError(toCustomDateTime(value), project() ?? ({} as ProjectModel), format);
		});
	},

	dateRequiredForTime(path: SchemaPath<CustomDatetimeModel | null>): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			if (!value) return null;
			return StringHelper.isNullOrBlank(value.date) && !StringHelper.isNullOrBlank(value.time)
				? registryError('dateRequiredForTime')
				: null;
		});
	},

	numericRange(path: SchemaPath<NumericRangeModel | null>): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			if (!value || GenericHelper.isNull(value.lower) || GenericHelper.isNull(value.upper)) return null;
			return value.upper < value.lower
				? registryError('rangeMin', { min: value.lower, actual: value.upper })
				: null;
		});
	},

	numericRangeMin(path: SchemaPath<NumericRangeModel | null>, min: number): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			if (!value || GenericHelper.isNull(value.lower)) return null;
			return value.lower < min ? registryError('min', { min, actual: value.lower }) : null;
		});
	},

	numericRangeMax(path: SchemaPath<NumericRangeModel | null>, max: number): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			if (!value || GenericHelper.isNull(value.upper)) return null;
			return value.upper > max ? registryError('max', { max, actual: value.upper }) : null;
		});
	},

	numericRangeBothDefined(path: SchemaPath<NumericRangeModel | null>): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			if (!value) return null;
			const lowerDefined = GenericHelper.nonNull(value.lower);
			const upperDefined = GenericHelper.nonNull(value.upper);
			return lowerDefined !== upperDefined ? registryError('rangeBothDefined') : null;
		});
	},

	beginDateBeforeEndDate(
		begin: SchemaPath<CustomDatetimeModel | null>,
		end: SchemaPath<CustomDatetimeModel | null>,
	): void {
		validate(end, (ctx) => {
			const beginDateTime = ctx.valueOf(begin);
			const endDateTime = ctx.value();
			const bothDefined = GenericHelper.nonNull(beginDateTime) && GenericHelper.nonNull(endDateTime);
			return bothDefined && DateHelper.isAfterOrEqual(beginDateTime ?? undefined, endDateTime ?? undefined)
				? registryError('beginDateBeforeEndDate')
				: null;
		});
	},

	atLeastOneRequired<T extends object>(path: SchemaPath<T>, firstKey: keyof T, secondKey: keyof T): void {
		validate(path, (ctx) => {
			const value = ctx.value();
			const noneDefined = GenericHelper.isNull(value[firstKey]) && GenericHelper.isNull(value[secondKey]);
			return noneDefined ? registryError('atLeastOneRequired') : null;
		});
	},

	preRequiredOptions(path: SchemaPath<Record<string, boolean>>, options: () => ProjectOptionModel[]): void {
		validate(path, (ctx) => {
			const selected = ctx.value();
			const missing = firstMissingPreRequired(selected, options());
			return missing ?? null;
		});
	},
} as const;
