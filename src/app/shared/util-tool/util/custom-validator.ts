import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

export class CustomValidators {
    public static nonBlank (): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const isBlank: boolean = (control.value || '').trim().length === 0
            return isBlank ? { blank: true } : null
        }
    }
}
