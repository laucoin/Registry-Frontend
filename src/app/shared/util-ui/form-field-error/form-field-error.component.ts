import { Component, Input } from '@angular/core'
import { AbstractControl } from '@angular/forms'
import { MessageModule } from 'primeng/message'
import { TranslateModule } from '@ngx-translate/core'
import { GenericComponent } from '../../util-tool/component/generic.component'

@Component( {
    selector: 'app-form-field-error',
    standalone: true,
    imports: [
        MessageModule,
        TranslateModule,
    ],
    templateUrl: './form-field-error.component.html',
} )
export class FormFieldErrorComponent extends GenericComponent {
    @Input( { required: true } ) public control!: AbstractControl
    @Input( { required: true } ) public translationPrefix!: string
    @Input() public translationArgs: object = {}

    protected buildText (code: string): string {
        return this.translateService.instant(
            `${this.translationPrefix}.${code}`,
            this.buildTranslationParams( code ),
        )
    }

    protected buildTranslationParams (code: string): object {
        switch (code) {
            case 'min':
                return {
                    ...this.translationArgs,
                    min: this.errorProperty( code, 'min' ),
                }
            case 'max':
                return {
                    ...this.translationArgs,
                    max: this.errorProperty( code, 'max' ),
                }
            case 'minlength':
                return {
                    ...this.translationArgs,
                    actualLength: this.errorProperty( code, 'actualLength' ),
                    requiredLength: this.errorProperty( code, 'requiredLength' ),
                }
            case 'maxlength':
                return {
                    ...this.translationArgs,
                    actualLength: this.errorProperty( code, 'actualLength' ),
                    requiredLength: this.errorProperty( code, 'requiredLength' ),
                }
            case 'minDate':
                return {
                    ...this.translationArgs,
                    min: this.errorProperty( code, 'min' ),
                }
            case 'maxDate':
                return {
                    ...this.translationArgs,
                    max: this.errorProperty( code, 'max' ),
                }
            case 'pattern':
                return {
                    ...this.translationArgs,
                    actual: this.errorProperty( code, 'actualValue' ),
                }
            default:
                return this.translationArgs
        }
    }

    private errorProperty (code: string, property: string): string {
        if (!this.control.errors) return ''
        if (!this.control.errors[code]) return ''
        return this.control.errors[code][property]
    }
}
