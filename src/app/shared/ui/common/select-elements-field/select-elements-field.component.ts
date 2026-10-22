import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    inject,
    input,
    InputSignal,
    model,
    ModelSignal,
    output,
    OutputEmitterRef,
    signal,
    WritableSignal,
} from '@angular/core'
import { FormValueControl } from '@angular/forms/signals'
import '@sgdf/ui/icon-button'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { BaseModel } from '@shared/models/model/base.model'
import { BrowserService } from '@core/browser/browser.service'
import { EventHelper } from '@shared/helpers/event.helper'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'

/**
 * Purpose: Form field selecting several searched elements.
 * Scope: Asks the parent to search as the user types, picks one suggestion at a time into the selection list and highlights a duplicate.
 * Limits: Owns no data source; the parent provides the search and the options.
 */
@Component( {
    selector: 'app-select-elements-field',
    imports: [
        TranslocoPipe,
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './select-elements-field.component.html',
    styleUrl: './select-elements-field.component.css',
} )
export class SelectElementsFieldComponent<T extends BaseModel> implements FormValueControl<T[]> {
    private readonly browser: BrowserService = inject( BrowserService )
    private readonly transloco: TranslocoService = inject( TranslocoService )
    private readonly host: ElementRef<HTMLElement> = inject( ElementRef )

    protected readonly announcement: WritableSignal<string> = signal( '' )

    public readonly value: ModelSignal<T[]> = model<T[]>( [] )
    public readonly disabled: InputSignal<boolean> = input( false )
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly touched: InputSignal<boolean> = input( false )
    public readonly dirty: InputSignal<boolean> = input( false )
    public readonly touch: OutputEmitterRef<void> = output<void>()

    public readonly suggestions: InputSignal<SelectOptionModel<T>[]> = input<SelectOptionModel<T>[]>( [] )
    public readonly selectItemBuilder: InputSignal<(element: T) => SelectOptionModel<T>> = input.required()
    public readonly label: InputSignal<string | undefined> = input()
    public readonly hint: InputSignal<string | undefined> = input()
    public readonly loading: InputSignal<boolean> = input( false )
    public readonly placeholder: InputSignal<string | undefined> = input()
    public readonly selectionLabel: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptyMessage: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptySelectionMessage: InputSignal<string | undefined> = input<string | undefined>()

    public handleSearch: OutputEmitterRef<{ query: string }> = output<{ query: string }>()

    protected handleChoice ( event: Event ): void {
        const field: HTMLElement & { value: string } = event.target as HTMLElement & { value: string }
        const chosen: T | undefined = this.suggestions().find( (suggestion: SelectOptionModel<T>): boolean => suggestion.value.id === EventHelper.valueOf( event ) )?.value
        field.value = ''
        if (chosen) this.handleElementSelection( chosen )
    }

    private handleElementSelection ( selected: T ): void {
        if (this.value().some( (element: T): boolean => element.id === selected.id )) {
            this.highlightDuplicated( selected.id )
            this.announce( 'duplicate', selected )
        } else {
            this.onInputChange( [ ...this.value(), selected ] )
            this.announce( 'added', selected )
        }
    }

    protected handleElementRemoving ( elementId: string ): void {
        const removed: T | undefined = this.value().find( (element: T): boolean => element.id === elementId )
        this.onInputChange( this.value().filter( (element: T): boolean => element.id !== elementId ) )
        if (removed) this.announce( 'removed', removed )
        this.host.nativeElement.querySelector<HTMLElement>( 'sgdf-select' )?.focus()
    }

    private announce ( kind: 'added' | 'removed' | 'duplicate', element: T ): void {
        this.announcement.set( this.transloco.translate( `global.selection.${ kind }`, { name: this.selectItemBuilder()( element ).label } ) )
    }

    protected highlightDuplicated ( elementId: string ): void {
        this.browser.highlightByDataValue( elementId, this.host.nativeElement )
    }

    private onInputChange ( value: T[] ): void {
        this.value.set( value )
        this.touch.emit()
    }
}
