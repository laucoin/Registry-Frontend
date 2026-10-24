import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal, model, ModelSignal } from '@angular/core'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/drawer'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { AlertModel } from '@shared/models/model/alert.model'
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component'
import { TitleCasePipe } from '@angular/common'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { toSignal } from '@angular/core/rxjs-interop'
import { filter, interval, map } from 'rxjs'
import {TranslocoPipe} from '@jsverse/transloco'
import {
    AlertCommunicationsListComponent,
} from '@shared/ui/domain/alert-communications-list/alert-communications-list.component'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { AlertActions } from '@shared/ui/domain/alert-element/alert-actions.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { EventHelper } from '@shared/helpers/event.helper'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { IntervalModel } from '@shared/models/model/interval.model'
import { StringHelper } from '@shared/helpers/string.helper'
import { DateHelper } from '@shared/helpers/date.helper'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { BrowserService } from '@core/browser/browser.service'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const STATUS_ICONS: Record<string, string> = {
    [ AlertStatusEnum.IN_PROGRESS ]: 'triangle-exclamation',
    [ AlertStatusEnum.CANCELED ]: 'xmark',
    [ AlertStatusEnum.RESOLVED ]: 'circle-check',
}

/** Zero-width characters a title may hold without showing anything. */
const INVISIBLE_CHARACTERS: RegExp = /[\u200B-\u200D\u2060\uFEFF]/g

/**
 * Purpose: Presents one alert with its actions, as a list item (attribute of `sgdf-list-item`).
 * Scope: Renders the details, the action menu, the confirmations and the drawer listing the communications of the alert.
 * Limits: Receives the element as an input and calls the facade for commands; it holds no list state.
 */
@Component( {
    selector: 'sgdf-list-item[appAlertElement], app-alert-element',
    providers: [AlertActions],
    host: { '[disabled]': '!alert().visible' },
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        EllipsisDirective,
        ElementActionsComponent,
        TitleCasePipe,
        DateFormatPipe,
        TranslocoPipe,
        AlertCommunicationsListComponent,
        CommunicationFormComponent,
    ],
    templateUrl: './alert-element.component.html',
} )
export class AlertElementComponent extends GenericComponent {
    protected readonly facade: AlertFacade = inject( AlertFacade )
    private readonly actionsService: AlertActions = inject( AlertActions )
    protected readonly intervalPipe: IntervalPipe = inject( IntervalPipe )
    private readonly browser: BrowserService = inject( BrowserService )

    public readonly actionMenuVisible: InputSignal<boolean> = input( true )
    public readonly addButtonVisible: InputSignal<boolean> = input( true )
    public readonly alert: InputSignal<AlertModel> = input.required()

    protected readonly titleBlank: Signal<boolean> = computed( (): boolean => StringHelper.isNullOrBlank( this.alert().title?.replace( INVISIBLE_CHARACTERS, '' ) ) )

    protected readonly accessibleTitle: Signal<string> = computed( (): string =>
        this.titleBlank() ? this.translateService.translate( 'alerts.untitled' ) : this.alert().title )

    protected readonly actions: Signal<ElementActionModel[]> = computed( (): ElementActionModel[] => this.actionsService.actionsFor( this.alert() ) )

    protected readonly isInProgress: Signal<boolean> = computed( (): boolean => this.alert().status.value === AlertStatusEnum.IN_PROGRESS )

    protected readonly statusIconName: Signal<string> = computed( (): string => STATUS_ICONS[ this.alert().status.value ] ?? 'circle-check' )
    protected readonly statusVariant: Signal<'warning' | 'neutral' | 'success'> = computed( (): 'warning' | 'neutral' | 'success' =>
        AlertHelper.getTagVariant( this.alert().status.value ) )

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
