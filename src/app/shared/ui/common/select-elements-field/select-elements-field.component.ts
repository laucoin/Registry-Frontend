import { NgTemplateOutlet } from '@angular/common'
import {
    Component,
    computed,
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
    Signal,
    WritableSignal,
} from '@angular/core'
import { FormValueControl } from '@angular/forms/signals'
import '@sgdf/ui/icon-button'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import '@sgdf/ui/tag'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { BaseModel } from '@shared/models/model/base.model'
import { BrowserService } from '@core/browser/browser.service'
import { EventHelper } from '@shared/helpers/event.helper'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper'
import { FieldErrorState } from '@shared/helpers/form/field-state.helper'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const identities: WeakMap<object, string> = new WeakMap<object, string>()

// Les éléments sans id ne doivent pas entrer en collision : chaque objet reçoit sa propre clé stable.
function identityOf (element: unknown): string {
    if (typeof element !== 'object' || element === null) return String( element )
    if (!identities.has( element )) identities.set( element, `identity-${ crypto.randomUUID() }` )
    return identities.get( element )!
}

/**
 * Purpose: Champ de formulaire sélectionnant plusieurs éléments recherchés.
 * Scope: Demande au parent de rechercher pendant la saisie, choisit une suggestion à la fois dans la liste de sélection, met en évidence un doublon, et peut déplier une suggestion en plusieurs éléments affichés sous un groupe supprimable.
 * Limits: Ne possède aucune source de données ; le parent fournit la recherche, les options, le dépliage et le regroupement.
 */
@Component( {
    selector: 'app-select-elements-field',
    imports: [
        EllipsisDirective,
        NgTemplateOutlet,
        TranslocoPipe,
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './select-elements-field.component.html',
    styleUrl: './select-elements-field.component.css',
} )
export class SelectElementsFieldComponent<T extends object, S extends BaseModel = T & BaseModel> implements FormValueControl<T[]> {
    private readonly browser: BrowserService = inject( BrowserService )
    private readonly transloco: TranslocoService = inject( TranslocoService )
    private readonly host: ElementRef<HTMLElement> = inject( ElementRef )

    protected readonly announcement: WritableSignal<string> = signal( '' )

    public readonly value: ModelSignal<T[]> = model<T[]>( [] )
    public readonly disabled: InputSignal<boolean> = input( false )
    public readonly touched: InputSignal<boolean> = input( false )
    public readonly required: InputSignal<boolean> = input( false )
    public readonly appFieldError: InputSignal<(() => FieldErrorState) | undefined> = input<(() => FieldErrorState) | undefined>()
    public readonly translationPrefix: InputSignal<string | undefined> = input<string | undefined>()
    public readonly touch: OutputEmitterRef<void> = output<void>()

    public readonly suggestions: InputSignal<SelectOptionModel<S>[]> = input<SelectOptionModel<S>[]>( [] )
    public readonly selectItemBuilder: InputSignal<(element: T) => SelectOptionModel<unknown>> = input.required()
    public readonly identify: InputSignal<(element: T) => string> = input( (element: T): string => (element as Partial<BaseModel>).id ?? identityOf( element ) )
    public readonly expand: InputSignal<(chosen: S) => T[]> = input( (chosen: S): T[] => [ chosen as unknown as T ] )
    public readonly groupOf: InputSignal<(element: T) => string | undefined> = input<(element: T) => string | undefined>( (): undefined => undefined )
    public readonly warningOf: InputSignal<(element: T) => string | undefined> = input<(element: T) => string | undefined>( (): undefined => undefined )
    public readonly groupLabel: InputSignal<(name: string) => string> = input( (name: string): string => name )
    public readonly ungroupedLabel: InputSignal<string | undefined> = input<string | undefined>()
    public readonly label: InputSignal<string | undefined> = input()
    public readonly hint: InputSignal<string | undefined> = input()
    public readonly loading: InputSignal<boolean> = input( false )
    public readonly placeholder: InputSignal<string | undefined> = input()
    public readonly selectionLabel: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptyMessage: InputSignal<string | undefined> = input<string | undefined>()
    public readonly emptySelectionMessage: InputSignal<string | undefined> = input<string | undefined>()

    public handleSearch: OutputEmitterRef<{ query: string }> = output<{ query: string }>()

    protected readonly ungrouped: Signal<T[]> = computed( (): T[] => this.value().filter( (element: T): boolean => this.groupOf()( element ) === undefined ) )
    protected readonly errorText: Signal<string> = computed( (): string => {
        const field: (() => FieldErrorState) | undefined = this.appFieldError()
        const prefix: string | undefined = this.translationPrefix()
        if (!field || !prefix) return ''
        return FieldErrorHelper.text( field, prefix, {}, (key: string, params: object): string => this.transloco.translate( key, params ) ) ?? ''
    } )
    protected readonly groups: Signal<{ name: string, elements: T[] }[]> = computed( (): { name: string, elements: T[] }[] => this.groupElements() )

    protected handleChoice ( event: Event ): void {
        const field: HTMLElement & { value: string } = event.target as HTMLElement & { value: string }
        const chosen: S | undefined = this.suggestions().find( (suggestion: SelectOptionModel<S>): boolean => suggestion.value.id === EventHelper.valueOf( event ) )?.value
        field.value = ''
        if (chosen) this.handleElementSelection( chosen )
    }

    private handleElementSelection ( chosen: S ): void {
        const elements: T[] = this.expand()( chosen )
        const added: T[] = elements.filter( (element: T): boolean => !this.isSelected( element ) )
        elements.filter( (element: T): boolean => this.isSelected( element ) ).forEach( (element: T): void => this.highlightDuplicated( this.identify()( element ) ) )
        if (added.length > 0) this.onInputChange( [ ...this.value(), ...added ] )
        this.announceChoice( elements, added )
    }

    private announceChoice ( elements: T[], added: T[] ): void {
        if (elements.length === 0) return
        if (added.length === 0) this.announce( 'duplicate', elements[ 0 ] )
        else this.announce( 'added', added[ 0 ] )
    }

    private isSelected ( element: T ): boolean {
        return this.value().some( (selected: T): boolean => this.identify()( selected ) === this.identify()( element ) )
    }

    protected handleElementRemoving ( elementId: string ): void {
        const removed: T | undefined = this.value().find( (element: T): boolean => this.identify()( element ) === elementId )
        this.onInputChange( this.value().filter( (element: T): boolean => this.identify()( element ) !== elementId ) )
        if (removed) this.announce( 'removed', removed )
        this.focusSearch()
    }

    protected handleGroupRemoving ( name: string ): void {
        this.onInputChange( this.value().filter( (element: T): boolean => this.groupOf()( element ) !== name ) )
        this.announcement.set( this.transloco.translate( 'global.selection.removed', { name: this.groupLabel()( name ) } ) )
        this.focusSearch()
    }

    private focusSearch (): void {
        this.host.nativeElement.querySelector<HTMLElement>( 'sgdf-select' )?.focus( { preventScroll: true } )
    }

    private groupElements (): { name: string, elements: T[] }[] {
        const byName: Map<string, T[]> = new Map<string, T[]>()
        this.value().forEach( (element: T): void => {
            const name: string | undefined = this.groupOf()( element )
            if (name !== undefined) byName.set( name, [ ...(byName.get( name ) ?? []), element ] )
        } )
        return [ ...byName.entries() ].map( ([ name, elements ]: [ string, T[] ]): { name: string, elements: T[] } => ({ name, elements }) )
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
