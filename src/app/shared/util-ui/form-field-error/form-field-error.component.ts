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
    styleUrl: './form-field-error.component.scss',
} )
export class FormFieldErrorComponent extends GenericComponent {
    @Input( { required: true } ) public control!: AbstractControl
    @Input( { required: true } ) public label!: string
    @Input() public example: string | undefined
    @Input() public message: Map<string, string> | undefined

    protected buildText (code: string): string {
        return this.translateService.instant(
            this.buildTranslationKey( code ),
            this.buildTranslationParams( code ),
        )
    }

    private buildTranslationKey (code: string): string {
        let translationKey: string = `error.form.${code}.message`

        if (this.example) {
            translationKey += '-example'
        }

        if (this.message) {
            this.message.forEach( (key: string, value: string): void => {
                if (key === code) translationKey = value
            } )
        }

        return translationKey
    }

    protected buildTranslationParams (code: string): object {
        const params: object = {
            label: this.label,
            example: this.example,
        }

        switch (code) {
            case 'min':
                return {
                    ...params,
                    min: this.errorProperty( code, 'min' ),
                }
            case 'max':
                return {
                    ...params,
                    max: this.errorProperty( code, 'max' ),
                }
            case 'minlength':
                return {
                    ...params,
                    min: this.errorProperty( code, 'min' ),
                }
            case 'maxlength':
                return {
                    ...params,
                    max: this.errorProperty( code, 'max' ),
                }
            case 'eventOptionConflict':
                return {
                    ...params,
                    require: this.translateService.instant( this.errorProperty( code, 'required' ) ),
                    for: this.translateService.instant( this.errorProperty( code, 'for' ) ),
                }
            default:
                return params
        }
    }

    private errorProperty (code: string, property: string): string {
        if (!this.control.errors) return ''
        if (!this.control.errors[code]) return ''
        return this.control.errors[code][property]
    }
}
