import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms'
import { EventOptionModel } from '../../../domains/event/data/model/event-option.model'
import { SelectItem } from 'primeng/api'

export class CustomValidators {
    public static nonBlank (): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const isBlank: boolean = (control.value || '').trim().length === 0
            return isBlank ? { blank: true } : null
        }
    }

    public static minDate (min: Date, formatedMinDate: string | undefined): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null
            const dates: Date[] = CustomValidators.getDateAsArray( control )
            const isInvalid: boolean = dates.some( (date: Date): boolean => date < min )
            return isInvalid ? { minDate: { min: formatedMinDate } } : null
        }
    }

    public static maxDate (max: Date, formatedMaxDate: string | undefined): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null
            const dates: Date[] = CustomValidators.getDateAsArray( control )
            const isInvalid: boolean = dates.some( (date: Date): boolean => date > max )
            return isInvalid ? { maxDate: { max: formatedMaxDate } } : null
        }
    }

    private static getDateAsArray (control: AbstractControl): Date[] {
        return Array.isArray( control.value ) ? control.value.map( (it: string | Date): Date => new Date( it ) ) : [
            new Date( control.value ),
        ]
    }

    public static preRequiredOptions (options: EventOptionModel[]): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const form: FormGroup = control as FormGroup
            let missingFor: string | undefined = undefined
            let missing: string | undefined = undefined

            Object.keys( form.controls )
                  .filter( (option: string): boolean => form.get( option )?.value )
                  .forEach( (option: string): void => {
                      const eventOption: EventOptionModel = options.find( (opt: EventOptionModel): boolean => opt.value === option )!
                      eventOption.preRequired.forEach( (preRequired: SelectItem<string>): void => {
                          if (!form.get( preRequired.value )?.value) {
                              missingFor = eventOption.label
                              missing = preRequired.label
                              return
                          }
                      } )
                  } )

            return missingFor && missing ? { preRequiredOptions: { for: missingFor, missing: missing } } : null
        }
    }
}
