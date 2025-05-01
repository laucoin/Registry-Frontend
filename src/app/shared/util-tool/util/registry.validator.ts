import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms'
import { ProjectOptionModel } from '../../../domains/project/data/model/project-option.model'
import { SelectItem } from 'primeng/api'
import { NumericRangeModel } from '../../../domains/project/configuration/activity/data/model/numeric-range.model'
import { GenericUtil } from './generic.util'
import { CustomDatetimeModel } from '../../util-model/model/custom-datetime.model'
import { DateUtil } from './date.util'
import { StringUtil } from './string.util'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'

export class RegistryValidators {
    public static nonBlank (): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const isBlank: boolean = StringUtil.isBlank( control.value )
            return isBlank ? { blank: true } : null
        }
    }

    public static minDateTime (min: CustomDatetimeModel, formatedMinDate: string | undefined): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (GenericUtil.isNull( control.value )) return null
            const value: CustomDatetimeModel | undefined = 'date' in control.value
                                                           ? control.value
                                                           : DateUtil.toCustomDateTime( control.value )
            if (DateUtil.isBefore( value, min )) {
                return { minDate: { min: formatedMinDate } }
            }

            return null
        }
    }

    public static maxDateTime (max: CustomDatetimeModel, formatedMaxDate: string | undefined): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (GenericUtil.isNull( control.value )) return null
            const value: CustomDatetimeModel | undefined = 'date' in control.value
                                                           ? control.value
                                                           : DateUtil.toCustomDateTime( control.value )

            if (DateUtil.isAfter( value, max )) {
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
            if (!value || GenericUtil.isNull( value.lower ) || GenericUtil.isNull( value.upper )) return null

            if (value.upper! < value.lower!) {
                return { rangeMin: { min: value.lower, actual: value.upper } }
            }

            return null
        }
    }

    public static numericRangeMin (min: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: NumericRangeModel | undefined = control.value
            if (!value || GenericUtil.isNull( value.lower )) return null

            if (value.lower! < min) {
                return { min: { min: min, actual: value.lower } }
            }

            return null
        }
    }

    public static numericRangeMax (max: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: NumericRangeModel | undefined = control.value
            if (!value || GenericUtil.isNull( value.upper )) return null

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
                (GenericUtil.isNull( value.lower ) && GenericUtil.nonNull( value.upper ))
                || (GenericUtil.isNull( value.upper ) && GenericUtil.nonNull( value.lower ))
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

            if (StringUtil.isBlank( value.date ) && StringUtil.isNotBlank( value.time )) {
                return { dateRequiredForTime: true }
            }

            return null
        }
    }

    public static beginDateBeforeEndDate (beginKey: string, endKey: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const begin: CustomDatetimeModel | undefined = group.get( beginKey )?.value
            const end: CustomDatetimeModel | undefined = group.get( endKey )?.value

            if (DateUtil.isAfterOrEqual( begin, end )) {
                return { beginDateBeforeEndDate: true }
            }

            return null
        }
    }
}
