import { FormControl, FormGroup } from '@angular/forms'

export class FormUtil {
    public static markAllControlsAsDirty (form: FormGroup): void {
        Object.values( form.controls ).forEach( (control: unknown) => {
            if (control instanceof FormGroup) {
                this.markAllControlsAsDirty( control )
            } else if (control instanceof FormControl) {
                control.markAsDirty( { onlySelf: true } )
                control.updateValueAndValidity()
            }
        } )
    }

    public static markControlsAsDirty (control: FormControl): void {
        control.markAsDirty( { onlySelf: true } )
        control.updateValueAndValidity()
    }

    public static buildDateRange (start: Date | string | undefined, end: Date | string | undefined): Date[] {
        let range: Date[] = []
        if (start) {
            range = [ new Date( start ) ]

            if (end) {
                range = [ ...range, new Date( end ) ]
            }
        }
        return range
    }
}
