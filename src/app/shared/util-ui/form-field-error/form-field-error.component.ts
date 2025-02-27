import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core'
import { ValidationErrors } from '@angular/forms'
import { MessageModule } from 'primeng/message'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'

@Component( {
    selector: 'app-form-field-error',
    standalone: true,
    imports: [
        MessageModule,
        TranslateModule,
    ],
    templateUrl: './form-field-error.component.html',
} )
export class FormFieldErrorComponent {
    private readonly translateService: TranslateService = inject( TranslateService )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public readonly invalid: InputSignal<boolean> = input.required()
    public readonly errors: InputSignal<ValidationErrors | null> = input.required()
    public readonly translationPrefix: InputSignal<string> = input.required()
    public readonly translationArgs: InputSignal<object> = input( {} )

    protected readonly errorText: Signal<string | undefined>

    public constructor () {
        this.errorText = computed( (): string | undefined => {
            if (this.errors() === null || !this.invalid()) return undefined
            return this.definedError( Object.keys( this.errors()! )[0] )
        } )
    }

    private definedError (code: string | undefined): string | undefined {
        if (!code) return undefined
        return this.translateService.instant(
            `${this.translationPrefix()}.${code}`,
            this.buildTranslationParams( code ),
        )
    }

    private buildTranslationParams (code: string): object {
        switch (code) {
            case 'min':
                return {
                    ...this.translationArgs(),
                    min: this.errorProperty( code, 'min' ),
                    actual: this.errorProperty( code, 'actual' ),
                }
            case 'max':
                return {
                    ...this.translationArgs(),
                    max: this.errorProperty( code, 'max' ),
                    actual: this.errorProperty( code, 'actual' ),
                }
            case 'minlength':
                return {
                    ...this.translationArgs(),
                    actualLength: this.errorProperty( code, 'actualLength' ),
                    requiredLength: this.errorProperty( code, 'requiredLength' ),
                }
            case 'maxlength':
                return {
                    ...this.translationArgs(),
                    actualLength: this.errorProperty( code, 'actualLength' ),
                    requiredLength: this.errorProperty( code, 'requiredLength' ),
                }
            case 'minDate':
                return {
                    ...this.translationArgs(),
                    min: this.errorProperty( code, 'min' ),
                }
            case 'maxDate':
                return {
                    ...this.translationArgs(),
                    max: this.errorProperty( code, 'max' ),
                }
            case 'rangeMin':
                return {
                    ...this.translationArgs(),
                    min: this.errorProperty( code, 'min' ),
                    actual: this.errorProperty( code, 'actual' ),
                }
            case 'rangeMax':
                return {
                    ...this.translationArgs(),
                    max: this.errorProperty( code, 'max' ),
                    actual: this.errorProperty( code, 'actual' ),
                }
            case 'pattern':
                return {
                    ...this.translationArgs(),
                    actual: this.errorProperty( code, 'actualValue' ),
                }
            default:
                return this.translationArgs()
        }
    }

    private errorProperty (code: string, property: string): string {
        if (!this.errors()) return ''
        if (!this.errors()![code]) return ''
        return this.errors()![code][property]
    }
}
