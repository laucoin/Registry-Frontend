import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal, model, ModelSignal } from '@angular/core'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/drawer'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { GenericElementComponent } from '@shared/ui/base/generic-element.component'
import { AlertModel } from '@shared/models/model/alert.model'
import { ElementCardComponent } from '@shared/ui/common/element-card/element-card.component'
import { SeverityCircleComponent } from '@shared/ui/common/severity-circle/severity-circle.component'
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component'
import { SeverityTagComponent } from '@shared/ui/common/severity-tag/severity-tag.component'
import { TitleCasePipe } from '@angular/common'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { toSignal } from '@angular/core/rxjs-interop'
import { filter, interval, map } from 'rxjs'
import { Button } from 'primeng/button'
import {TranslocoPipe} from '@jsverse/transloco'
import {
    AlertCommunicationsListComponent,
} from '@shared/ui/domain/alert-communications-list/alert-communications-list.component'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { AlertActions } from '@shared/ui/domain/alert-element/alert-actions.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { MenuEntryModel } from '@shared/models/model/menu-entry.model'
import { EventHelper } from '@shared/helpers/event.helper'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { IntervalModel } from '@shared/models/model/interval.model'
import { StringHelper } from '@shared/helpers/string.helper'
import { DateHelper } from '@shared/helpers/date.helper'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { BrowserService } from '@core/browser/browser.service'

// TODO: remove with the PrimeNG carousel card once the dashboard moves to @sgdf/ui
const CARD_ICONS: Record<string, string> = {
    'check': 'pi pi-check',
    'xmark': 'pi pi-times',
    'rotate-right': 'pi pi-replay',
    'eye-slash': 'pi pi-eye-slash',
    'trash': 'pi pi-trash',
}

const STATUS_ICONS: Record<string, string> = {
    [ AlertStatusEnum.IN_PROGRESS ]: 'triangle-exclamation',
    [ AlertStatusEnum.CANCELED ]: 'xmark',
    [ AlertStatusEnum.RESOLVED ]: 'circle-check',
}

/** Zero-width characters a title may hold without showing anything. */
const INVISIBLE_CHARACTERS: RegExp = /[\u200B-\u200D\u2060\uFEFF]/g

/**
 * Purpose: Presents one alert with its actions, as a list item (attribute of `sgdf-list-item`) or as a card in the carousel.
 * Scope: Renders the details, the action menu, the confirmations and the drawer listing the communications of the alert.
 * Limits: Receives the element as an input and calls the facade for commands; it holds no list state.
 */
@Component( {
    selector: 'sgdf-list-item[appAlertElement], app-alert-element',
    providers: [AlertActions],
    host: { '[disabled]': '!alert().visible' },
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        ElementActionsComponent,
        ElementCardComponent,
        SeverityCircleComponent,
        SeverityTagComponent,
        TitleCasePipe,
        DateFormatPipe,
        Button,
        TranslocoPipe,
        AlertCommunicationsListComponent,
        CommunicationFormComponent,
        ProjectOptionIconPipe,
    ],
    templateUrl: './alert-element.component.html',
} )
export class AlertElementComponent extends GenericElementComponent {
    protected readonly facade: AlertFacade = inject( AlertFacade )
    private readonly actionsService: AlertActions = inject( AlertActions )
    protected readonly intervalPipe: IntervalPipe = inject( IntervalPipe )
    private readonly browser: BrowserService = inject( BrowserService )

    protected readonly AlertStatusEnum: typeof AlertStatusEnum = AlertStatusEnum

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly addButtonVisible: InputSignal<boolean> = input( true )
    public readonly carouselView: InputSignal<boolean> = input( false )
    public readonly alert: InputSignal<AlertModel> = input.required()

    protected readonly titleBlank: Signal<boolean> = computed( (): boolean => StringHelper.isNullOrBlank( this.alert().title?.replace( INVISIBLE_CHARACTERS, '' ) ) )

    protected readonly accessibleTitle: Signal<string> = computed( (): string =>
        this.titleBlank() ? this.translateService.translate( 'alerts.untitled' ) : this.alert().title )

    protected readonly actions: Signal<ElementActionModel[]> = computed( (): ElementActionModel[] => this.actionsService.actionsFor( this.alert() ) )

    protected readonly cardActions: Signal<MenuEntryModel[]> = computed( (): MenuEntryModel[] =>
        this.actions().map( (action: ElementActionModel): MenuEntryModel => ({
            label: action.label,
            icon: CARD_ICONS[ action.icon ],
            disabled: action.disabled,
            command: action.run,
        }) ),
    )

    protected readonly isInProgress: Signal<boolean> = computed( (): boolean => this.alert().status.value === AlertStatusEnum.IN_PROGRESS )

    protected readonly statusIconName: Signal<string> = computed( (): string => STATUS_ICONS[ this.alert().status.value ] ?? 'circle-check' )
    protected readonly statusVariant: Signal<'warning' | 'neutral' | 'success'> = computed( (): 'warning' | 'neutral' | 'success' =>
        AlertHelper.getTagVariant( this.alert().status.value ) )

    protected readonly statusIcon: Signal<string> = computed( (): string => AlertHelper.getIconFromStatus( this.alert().status.value ) )
    protected readonly statusSeverity: Signal<SeverityEnum> = computed( (): SeverityEnum => AlertHelper.getSeverityFromStatus(
        this.alert().status.value ) )

    protected readonly statusLabel: Signal<string> = computed( (): string =>
        this.alert().status.label + (this.inProgressSince() ? ` (${this.intervalPipe.transform( this.inProgressSince(), undefined, true )!})` : ''),
    )

    private readonly inProgressSince: Signal<IntervalModel | undefined> = toSignal( interval( 1000 ).pipe(
        filter( (): boolean => this.browser.pageVisible ),
        map( (): IntervalModel | undefined => this.getInProgressSince() ),
    ) )

    protected readonly communicationsLayerOpened: ModelSignal<boolean> = model<boolean>( false )

    private getInProgressSince (): IntervalModel | undefined {
        if (this.alert().status.value !== AlertStatusEnum.IN_PROGRESS) return undefined
        return DateHelper.buildDateInterval( this.alert().dateTime, new Date() )
    }

    protected closeCommunications(event: Event): void {
        if (EventHelper.isFromHost(event)) {
            this.communicationsLayerOpened.set(false)
        }
    }
}
