import {
    Component,
    computed,
    ContentChildren,
    forwardRef,
    inject,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    QueryList,
    Signal,
    signal,
    WritableSignal,
} from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms'
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete'
import { Button } from 'primeng/button'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SelectItem } from 'primeng/api'
import { BaseModel } from '@shared/models/model/base.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { BrowserService } from '@core/browser/browser.service'
import { TranslocoPipe } from '@jsverse/transloco'

/**
 * Purpose: Form field selecting one or several searched elements.
 * Scope: Searches with a debounced query, shows the selection and highlights duplicates.
 * Limits: Owns no data source; the parent provides the search and the options.
 */
@Component( {
    selector: 'app-select-elements-field',
    imports: [
        TranslocoPipe,
        ReactiveFormsModule,
        Button,
        FormsModule,
        AutoComplete,

    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef( (): typeof SelectElementsFieldComponent => SelectElementsFieldComponent ),
            multi: true,
        },
    ],
    templateUrl: './select-elements-field.component.html',
    styleUrl: './select-elements-field.component.css',
} )
export class SelectElementsFieldComponent<T extends BaseModel> implements ControlValueAccessor {
    private readonly browser: BrowserService = inject( BrowserService )
    @ContentChildren( RegistryTemplateDirective ) public templates: QueryList<RegistryTemplateDirective> | undefined

    protected readonly GenericHelper: typeof GenericHelper = GenericHelper

    public readonly suggestions: InputSignal<SelectItem<T>[]> = input<SelectItem<T>[]>( [] )
    public readonly selectItemBuilder: InputSignal<(element: T) => SelectItem<T>> = input.required()
    public readonly multiple: InputSignal<boolean> = input( false )
    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly fluid: InputSignal<boolean> = input( false )
    public readonly placeholder: InputSignal<string | undefined> = input()
    public readonly selectionLabel: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptyMessage: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptySelectionMessage: InputSignal<string | undefined> = input<string | undefined>()

    protected readonly value: WritableSignal<T | T[] | undefined> = signal( undefined )
    protected readonly multipleValue: Signal<T[]> = computed( (): T[] => {
        if (!this.multiple()) return []
        return this.value() as T[] ?? []
    } )
    protected readonly simpleValue: Signal<T | undefined> = computed( (): T | undefined => {
        if (this.multiple()) return undefined
        return this.value() as T
    } )
    protected readonly disabled: WritableSignal<boolean> = signal( false )

    public handleSearch: OutputEmitterRef<AutoCompleteCompleteEvent> = output<AutoCompleteCompleteEvent>()

    private onChange: ((value: T | T[] | undefined) => void) | undefined = undefined
    private onTouched: (() => void) | undefined = undefined

    protected handleElementSelection (event: AutoCompleteSelectEvent): void {
        if (!this.multiple()) {
            this.onInputChange( event.value.value )
            return
        }

        const existingElement: T | undefined = this.multipleValue().find( (value: T): boolean => value.id === event.value.value.id )

        if (existingElement) {
            this.highlightDuplicated( event.value.value.id )
        } else {
            this.onInputChange( [ ...this.multipleValue(), event.value.value ] )
        }
    }

    protected handleElementRemoving (elementId: string): void {
        if (!this.multiple()) {
            this.onInputChange( undefined )
            return
        }

        this.onInputChange( this.multipleValue().filter( (value: T): boolean => value.id !== elementId ) )
    }

    protected highlightDuplicated (elementId: string): void {
        this.browser.highlightByDataValue( elementId )
    }

    protected onInputChange (value: T | T[] | undefined): void {
        this.value.set( value )
        this.onChange?.( value )
        this.onTouched?.()
    }

    public registerOnChange (fn: (value: T | T[] | undefined) => void): void {
        this.onChange = fn
    }

    public registerOnTouched (fn: () => void): void {
        this.onTouched = fn
    }

    public setDisabledState (disabled: boolean): void {
        this.disabled.set( disabled )
    }

    public writeValue (value: T | T[] | undefined): void {
        this.value.set( value )
    }
}
