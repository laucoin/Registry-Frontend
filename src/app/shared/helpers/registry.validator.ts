import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { SelectItem } from 'primeng/api'
import { NumericRangeModel } from '@shared/models/model/numeric-range.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

/**
 * Purpose: Reactive form validators of the application.
 * Scope: Provides blank, date, range and option-dependent validators.
 * Limits: Validates on the client for usability; the backend validates again.
 */
export class RegistryValidators {
    public static nonBlank (): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const isBlank: boolean = StringHelper.isBlank( control.value )
            return isBlank ? { blank: true } : null
        }
    }

    public static minDateTime (min: CustomDatetimeModel, formatedMinDate: string | undefined): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (GenericHelper.isNull( control.value )) return null
            const value: CustomDatetimeModel | undefined = 'date' in control.value
                                                           ? control.value
                                                           : DateHelper.toCustomDateTime( control.value )
            if (DateHelper.isCustomBefore( value, min )) {
                return { minDate: { min: formatedMinDate } }
            }

            return null
        }
    }

    public static maxDateTime (max: CustomDatetimeModel, formatedMaxDate: string | undefined): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (GenericHelper.isNull( control.value )) return null
            const value: CustomDatetimeModel | undefined = 'date' in control.value
                                                           ? control.value
                                                           : DateHelper.toCustomDateTime( control.value )

            if (DateHelper.isCustomDateAfter( value, max )) {
                return { maxDate: { max: formatedMaxDate } }
            }

            return null
        }
    }

    public static preRequiredOptions (options: ProjectOptionModel[]): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const form: FormGroup = control as FormGroup
            let missingFor: string | undefined = undefined
            let missing: string | undefined = undefined

            Object.keys( form.controls )
                  .filter( (option: string): boolean => form.get( option )?.value )
                  .forEach( (option: string): void => {
                      const projectOption: ProjectOptionModel | undefined = options.find( (opt: ProjectOptionModel): boolean => opt.value === option )
                      if (!projectOption) return
                      projectOption.preRequired.forEach( (preRequired: SelectItem<ProjectOptionEnum>): void => {
                          if (!form.get( preRequired.value )?.value) {
                              missingFor = projectOption.label
                              missing = preRequired.label
                              return
                          }
                      } )
                  } )

            return missingFor && missing ? { preRequiredOptions: { for: missingFor, missing: missing } } : null
        }
    }

    public static numericRange (): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: NumericRangeModel | undefined = control.value
            if (!value || GenericHelper.isNull( value.lower ) || GenericHelper.isNull( value.upper )) return null

            if (value.upper! < value.lower!) {
                return { rangeMin: { min: value.lower, actual: value.upper } }
            }

            return null
        }
    }

    public static numericRangeMin (min: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: NumericRangeModel | undefined = control.value
            if (!value || GenericHelper.isNull( value.lower )) return null

            if (value.lower! < min) {
                return { min: { min: min, actual: value.lower } }
            }

            return null
        }
    }

    public static numericRangeMax (max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: NumericRangeModel | undefined = control.value
            if (!value || GenericHelper.isNull( value.upper )) return null

            if (value.upper! > max) {
                return { max: { max: max, actual: value.upper } }
            }

            return null
        }
    }

    public static numericRangeBothDefined (): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: NumericRangeModel | undefined = control.value
            if (!value) return null

            if (
                (GenericHelper.isNull( value.lower ) && GenericHelper.nonNull( value.upper ))
                || (GenericHelper.isNull( value.upper ) && GenericHelper.nonNull( value.lower ))
            ) {
                return { rangeBothDefined: true }
            }

            return null
        }
    }

    public static dateRequiredForTime (): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: CustomDatetimeModel | undefined = control.value
            if (!value) return null

            if (StringHelper.isNullOrBlank( value.date ) && !StringHelper.isNullOrBlank( value.time )) {
                return { dateRequiredForTime: true }
            }

            return null
        }
    }

    public static beginDateBeforeEndDate (beginKey: string, endKey: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const begin: CustomDatetimeModel | undefined = group.get( beginKey )?.value
            const end: CustomDatetimeModel | undefined = group.get( endKey )?.value

            if (GenericHelper.nonNull( begin ) && GenericHelper.nonNull( end ) && DateHelper.isAfterOrEqual( begin, end )) {
                return { beginDateBeforeEndDate: true }
            }

            return null
        }
    }

    public static atLeastOneRequired (firstKey: string, secondKey: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const first: unknown | undefined = group.get( firstKey )?.value
            const second: unknown | undefined = group.get( secondKey )?.value

            if (GenericHelper.isNull( first ) && GenericHelper.isNull( second )) {
                return { atLeastOneRequired: true }
            }

            return null
        }
    }
}
