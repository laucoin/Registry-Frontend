import { FieldContext, maxLength, required, SchemaPath, validate, ValidationError } from '@angular/forms/signals'
import { SelectItem } from 'primeng/api'
import { ProjectModel } from '@shared/models/model/project.model'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { DateHelper } from '@shared/helpers/date.helper'
import { StringHelper } from '@shared/helpers/string.helper'

export type RegistryError = ValidationError.WithoutFieldTree & Readonly<Record<string, unknown>>

export interface ProjectDateContext {
    project: () => ProjectModel | undefined
    formatDate: (date: CustomDatetimeModel) => string | undefined
}

export interface DateRangeValue {
    beginDateTime: CustomDatetimeModel | null
    endDateTime: CustomDatetimeModel | null
}

type DateTimeValue = CustomDatetimeModel | Date | null

function registryError (kind: string, params: Record<string, unknown> = {}): RegistryError {
    return { kind, ...params }
}

function toCustomDateTime (value: CustomDatetimeModel | Date): CustomDatetimeModel | undefined {
    return 'date' in value ? value : DateHelper.toCustomDateTime( value )
}

/**
 * Purpose: Signal form validation rules of the application, keeping the legacy error codes used by the translations.
 * Scope: Provides blank, date, range, option-dependent and cross-field rules applied to schema paths.
 * Limits: Validates on the client for usability; the backend validates again.
 */
export class RegistrySchemas {
    public static nonBlank (path: SchemaPath<string>): void {
        validate( path, (ctx: FieldContext<string>): RegistryError | null =>
            StringHelper.isBlank( ctx.value() ) ? registryError( 'blank' ) : null )
    }

    public static requiredText (path: SchemaPath<string>, max: number): void {
        required( path )
        maxLength( path, max )
        RegistrySchemas.nonBlank( path )
    }

    public static requiredList<T> (path: SchemaPath<T[]>): void {
        validate( path, (ctx: FieldContext<T[]>): RegistryError | null =>
            ctx.value().length === 0 ? registryError( 'required' ) : null )
    }

    public static projectDateTime (path: SchemaPath<CustomDatetimeModel | null>, context: ProjectDateContext): void {
        RegistrySchemas.dateRequiredForTime( path )
        RegistrySchemas.withinProject( path, context.project, context.formatDate )
    }

    public static withinProject (
        path: SchemaPath<DateTimeValue>,
        project: () => ProjectModel | undefined,
        format: (date: CustomDatetimeModel) => string | undefined,
    ): void {
        validate( path, (ctx: FieldContext<DateTimeValue>): RegistryError | null => {
            const value: DateTimeValue = ctx.value()
            if (GenericHelper.isNull( value )) return null
            const date: CustomDatetimeModel | undefined = toCustomDateTime( value! )
            const { begin, end }: ProjectModel = project() ?? ({} as ProjectModel)
            if (begin && DateHelper.isCustomBefore( date, begin )) return registryError( 'minDate', { min: format( begin ) } )
            if (end && DateHelper.isCustomDateAfter( date, end )) return registryError( 'maxDate', { max: format( end ) } )
            return null
        } )
    }

    public static dateRequiredForTime (path: SchemaPath<CustomDatetimeModel | null>): void {
        validate( path, (ctx: FieldContext<CustomDatetimeModel | null>): RegistryError | null => {
            const value: CustomDatetimeModel | null = ctx.value()
            if (!value) return null
            return StringHelper.isNullOrBlank( value.date ) && !StringHelper.isNullOrBlank( value.time )
                   ? registryError( 'dateRequiredForTime' )
                   : null
        } )
    }

    public static numericRange (path: SchemaPath<NumericRangeModel | null>): void {
        validate( path, (ctx: FieldContext<NumericRangeModel | null>): RegistryError | null => {
            const value: NumericRangeModel | null = ctx.value()
            if (!value || GenericHelper.isNull( value.lower ) || GenericHelper.isNull( value.upper )) return null
            return value.upper! < value.lower!
                   ? registryError( 'rangeMin', { min: value.lower, actual: value.upper } )
                   : null
        } )
    }

    public static numericRangeMin (path: SchemaPath<NumericRangeModel | null>, min: number): void {
        validate( path, (ctx: FieldContext<NumericRangeModel | null>): RegistryError | null => {
            const value: NumericRangeModel | null = ctx.value()
            if (!value || GenericHelper.isNull( value.lower )) return null
            return value.lower! < min ? registryError( 'min', { min, actual: value.lower } ) : null
        } )
    }

    public static numericRangeMax (path: SchemaPath<NumericRangeModel | null>, max: number): void {
        validate( path, (ctx: FieldContext<NumericRangeModel | null>): RegistryError | null => {
            const value: NumericRangeModel | null = ctx.value()
            if (!value || GenericHelper.isNull( value.upper )) return null
            return value.upper! > max ? registryError( 'max', { max, actual: value.upper } ) : null
        } )
    }

    public static numericRangeBothDefined (path: SchemaPath<NumericRangeModel | null>): void {
        validate( path, (ctx: FieldContext<NumericRangeModel | null>): RegistryError | null => {
            const value: NumericRangeModel | null = ctx.value()
            if (!value) return null
            const lowerDefined: boolean = GenericHelper.nonNull( value.lower )
            const upperDefined: boolean = GenericHelper.nonNull( value.upper )
            return lowerDefined !== upperDefined ? registryError( 'rangeBothDefined' ) : null
        } )
    }

    public static beginDateBeforeEndDate<T extends DateRangeValue> (path: SchemaPath<T>): void {
        validate( path, (ctx: FieldContext<T>): RegistryError | null => {
            const { beginDateTime, endDateTime }: DateRangeValue = ctx.value()
            const bothDefined: boolean = GenericHelper.nonNull( beginDateTime ) && GenericHelper.nonNull( endDateTime )
            return bothDefined && DateHelper.isAfterOrEqual( beginDateTime ?? undefined, endDateTime ?? undefined )
                   ? registryError( 'beginDateBeforeEndDate' )
                   : null
        } )
    }

    public static atLeastOneRequired<T extends object> (path: SchemaPath<T>, firstKey: keyof T, secondKey: keyof T): void {
        validate( path, (ctx: FieldContext<T>): RegistryError | null => {
            const value: T = ctx.value()
            const noneDefined: boolean = GenericHelper.isNull( value[firstKey] ) && GenericHelper.isNull( value[secondKey] )
            return noneDefined ? registryError( 'atLeastOneRequired' ) : null
        } )
    }

    public static preRequiredOptions (path: SchemaPath<Record<string, boolean>>, options: ProjectOptionModel[]): void {
        validate( path, (ctx: FieldContext<Record<string, boolean>>): RegistryError | null => {
            const selected: Record<string, boolean> = ctx.value()
            const missing: RegistryError | undefined = RegistrySchemas.firstMissingPreRequired( selected, options )
            return missing ?? null
        } )
    }

    private static firstMissingPreRequired (
        selected: Record<string, boolean>,
        options: ProjectOptionModel[],
    ): RegistryError | undefined {
        for (const option of options.filter( (it: ProjectOptionModel): boolean => !!selected[it.value] )) {
            const absent: SelectItem<ProjectOptionEnum> | undefined = option.preRequired.find(
                (it: SelectItem<ProjectOptionEnum>): boolean => !selected[it.value],
            )
            if (absent) return registryError( 'preRequiredOptions', { for: option.label, missing: absent.label } )
        }
        return undefined
    }
}
