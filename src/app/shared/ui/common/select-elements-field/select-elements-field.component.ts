import {
    Component,
    computed,
    ContentChildren,
    inject,
    input,
    InputSignal,
    model,
    ModelSignal,
    output,
    OutputEmitterRef,
    QueryList,
    Signal,
} from '@angular/core'
import { FormValueControl } from '@angular/forms/signals'
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete'
import { Button } from 'primeng/button'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SelectItem } from 'primeng/api'
import { BaseModel } from '@shared/models/model/base.model'
import { BrowserService } from '@core/browser/browser.service'
import { TranslocoPipe } from '@jsverse/transloco'

/**
 * Purpose: Form field selecting several searched elements.
 * Scope: Searches with a debounced query, shows the selection and highlights duplicates.
 * Limits: Owns no data source; the parent provides the search and the options.
 */
@Component( {
    selector: 'app-select-elements-field',
    imports: [
        TranslocoPipe,
        Button,
        AutoComplete,
    ],
    templateUrl: './select-elements-field.component.html',
    styleUrl: './select-elements-field.component.css',
} )
export class SelectElementsFieldComponent<T extends BaseModel> implements FormValueControl<T[]> {
    private readonly browser: BrowserService = inject( BrowserService )
    @ContentChildren( RegistryTemplateDirective ) public templates: QueryList<RegistryTemplateDirective> | undefined

    public readonly value: ModelSignal<T[]> = model<T[]>( [] )
    public readonly disabled: InputSignal<boolean> = input( false )
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly touched: InputSignal<boolean> = input( false )
    public readonly dirty: InputSignal<boolean> = input( false )
    public readonly touch: OutputEmitterRef<void> = output<void>()

    public readonly suggestions: InputSignal<SelectItem<T>[]> = input<SelectItem<T>[]>( [] )
    public readonly selectItemBuilder: InputSignal<(element: T) => SelectItem<T>> = input.required()
    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly fluid: InputSignal<boolean> = input( false )
    public readonly placeholder: InputSignal<string | undefined> = input()
    public readonly selectionLabel: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptyMessage: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptySelectionMessage: InputSignal<string | undefined> = input<string | undefined>()

    protected readonly showInvalid: Signal<boolean> = computed( (): boolean => this.invalid() && (this.touched() || this.dirty()) )

    public handleSearch: OutputEmitterRef<AutoCompleteCompleteEvent> = output<AutoCompleteCompleteEvent>()

    protected handleElementSelection ( event: AutoCompleteSelectEvent ): void {
        const selected: T = event.value.value
        if (this.value().some( (element: T): boolean => element.id === selected.id )) {
            this.highlightDuplicated( selected.id )
        } else {
            this.onInputChange( [ ...this.value(), selected ] )
        }
    }

    protected handleElementRemoving ( elementId: string ): void {
        this.onInputChange( this.value().filter( (element: T): boolean => element.id !== elementId ) )
    }

    protected highlightDuplicated ( elementId: string ): void {
        this.browser.highlightByDataValue( elementId )
    }

    private onInputChange ( value: T[] ): void {
        this.value.set( value )
        this.touch.emit()
    }
}
