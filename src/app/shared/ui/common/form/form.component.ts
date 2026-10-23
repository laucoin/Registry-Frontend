import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, Signal } from '@angular/core'
import '@sgdf/ui/spinner'
import { ErrorModel } from '@shared/models/model/error.model'
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component'

/**
 * Purpose: Wrapper of a form with a title, a loader and action buttons.
 * Scope: Projects the fields and shows the saving state.
 * Limits: Owns no form model; the page provides it.
 */
@Component( {
    selector: 'app-form',
    imports: [
        FormErrorComponent,
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './form.component.html',
    styles: 'h1 { font-size: var(--sgdf-text-3xl); }',
} )
export class FormComponent {
    public readonly loading: InputSignal<boolean> = input.required()
    public readonly form: InputSignal<() => { touched: () => boolean }> = input.required()
    public readonly error: InputSignal<ErrorModel | undefined> = input<ErrorModel | undefined>()
    public readonly showTitle: InputSignal<boolean> = input<boolean>( true )
    public readonly title: InputSignal<string | undefined> = input<string | undefined>()

    protected readonly untouched: Signal<boolean> = computed((): boolean => !this.form()().touched())
}
