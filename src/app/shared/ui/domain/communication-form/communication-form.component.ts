import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    computed,
    inject,
    input,
    InputSignal,
    OnDestroy,
    OnInit,
    Signal,
    signal,
    WritableSignal,
} from '@angular/core'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { FieldTree, FormField } from '@angular/forms/signals'
import {
    CommunicationFormModel,
    createCommunicationForm,
    emptyCommunicationFormModel,
    toCommunicationDto,
    toNewAlertDto,
} from '@shared/ui/domain/communication-form/communication.form'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { tap } from 'rxjs'
import { MenuEntryModel } from '@shared/models/model/menu-entry.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { AlertModel } from '@shared/models/model/alert.model'
import { FormModelHelper } from '@shared/helpers/form/form-model.helper'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import {TranslocoPipe} from '@jsverse/transloco'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CommunicationDto } from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'

import '@sgdf/ui/divider'
import '@sgdf/ui/icon'
import '@sgdf/ui/icon-button'
import '@sgdf/ui/input'
import '@sgdf/ui/menu'
import '@sgdf/ui/menu-item'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import '@sgdf/ui/textarea'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component'
import { ETagHelper } from '@shared/helpers/etag.helper'

enum CommunicationModulableFieldEnum {
    MOVEMENT = 'movement',
    ALERT = 'alert',
}

enum AlertModulableFieldEnum {
    SELECT = 'SELECT',
    NEW = 'NEW',
}


/**
 * Purpose: Form to create or edit a communication.
 * Scope: Links the communication to a movement or an alert and submits through the communication facade.
 * Limits: Does not decide where to navigate after submit.
 */
@Component( {
    selector: 'app-communication-form',
    imports: [
        FormErrorComponent,
        FieldErrorComponent,
        TranslocoPipe,
        FormField,
        SgdfFieldDirective,
        DateFormatPipe,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './communication-form.component.html',
    styleUrl: './communication-form.component.css',
} )
export class CommunicationFormComponent extends BaseFormComponent implements OnInit, OnDestroy {
    protected readonly facade: CommunicationFacade = inject( CommunicationFacade )
    protected readonly alertFacade: AlertFacade = inject( AlertFacade )
    protected readonly classicDatePipe: DateFormatPipe = inject( DateFormatPipe )

    protected readonly movementChoices: Signal<SelectOptionModel<MovementModel>[]> = computed(
        (): SelectOptionModel<MovementModel>[] => this.withSelected( this.facade.searchedMovementsMetadata(), this.model().movement ),
    )
    protected readonly alertChoices: Signal<SelectOptionModel<AlertModel>[]> = computed(
        (): SelectOptionModel<AlertModel>[] => this.withSelected( this.facade.searchedAlertsMetadata(), this.model().alert ),
    )
    protected readonly hasLinkField: Signal<boolean> = computed( (): boolean =>
        GenericHelper.isNull( this.facade.communication() ) && (this.movementSelectorVisible() || GenericHelper.nonNull( this.alertSelectorMode() )),
    )
    protected readonly selectedMovementKey: Signal<string> = computed( (): string => this.model().movement?.value.id ?? '' )
    protected readonly selectedAlertKey: Signal<string> = computed( (): string => this.model().alert?.value.id ?? '' )
    protected readonly now: Date = new Date()
    protected readonly AlertModulableFieldEnum: typeof AlertModulableFieldEnum = AlertModulableFieldEnum

    public readonly redirect: InputSignal<boolean> = input( true )
    public readonly initialAlert: InputSignal<AlertModel | undefined> = input<AlertModel | undefined>()
    public readonly initialMovement: InputSignal<MovementModel | undefined> = input<MovementModel | undefined>(
        undefined )

    private readonly allActions: Signal<MenuEntryModel[]> = signal( [
        {
            id: CommunicationModulableFieldEnum.MOVEMENT,
            label: 'communications.form.actions.add-movement',
            icon: 'right-left',
            disabled: false,
            command: (): void => this.movementSelectorVisible.set( true ),
        },
        {
            id: CommunicationModulableFieldEnum.ALERT,
            label: 'communications.form.actions.link-alert',
            icon: 'triangle-exclamation',
            disabled: false,
            command: (): void => this.alertSelectorMode.set( AlertModulableFieldEnum.SELECT ),
        },
        {
            id: CommunicationModulableFieldEnum.ALERT,
            label: 'communications.form.actions.add-alert',
            icon: 'triangle-exclamation',
            disabled: false,
            command: (): void => {
                this.alertSelectorMode.set( AlertModulableFieldEnum.NEW )
            },
        },
    ] )

    private readonly hasAlertOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption( ProjectOptionEnum.ALERT )

    protected readonly actions: Signal<MenuEntryModel[]> = computed( () => this.buildModulableFields( this.allActions() ) )

    protected readonly movementSelectorVisible: WritableSignal<boolean> = signal( false )
    protected readonly alertSelectorMode: WritableSignal<AlertModulableFieldEnum | undefined> = signal<AlertModulableFieldEnum | undefined>(
        undefined )

    protected readonly model: WritableSignal<CommunicationFormModel> = signal( emptyCommunicationFormModel() )
    protected readonly form: FieldTree<CommunicationFormModel> = createCommunicationForm( this.model, {
        newAlert: (): boolean => this.alertSelectorMode() === AlertModulableFieldEnum.NEW,
    } )

    public constructor () {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    public ngOnInit (): void {
        this.applyInitialLinks()
    }

    private applyInitialLinks (): void {
        const alert: AlertModel | undefined = this.initialAlert()
        const movement: MovementModel | undefined = this.initialMovement()
        this.model.update( (current: CommunicationFormModel): CommunicationFormModel => ({
            ...current,
            alert: alert ? FormModelHelper.copy( AlertHelper.toSelectItem( alert, this.classicDatePipe ) ) : current.alert,
            movement: movement ? FormModelHelper.copy( MovementHelper.toActivitySelectItem( movement, this.classicDatePipe ) ) : current.movement,
        }) )
    }

    protected override loadData (): void {
        this.facade.resetCommunication()

        if (GenericHelper.nonNull( this.idParam )) {
            this.facade.fetchCommunication( this.idParam! )
        }
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.communication$.pipe(
                tap( (communication: CommunicationModel | undefined): void => this.fillForm( communication ) ),
            ).subscribe(),
        )
    }

    private fillForm (element: CommunicationModel | undefined): void {
        if (!element) return

        this.model.set( {
            ...this.model(),
            message: element.message ?? '',
            movement: element.movement ? FormModelHelper.copy( MovementHelper.toActivitySelectItem( element.movement, this.classicDatePipe ) ) : null,
            alert: element.alert ? FormModelHelper.copy( AlertHelper.toSelectItem( element.alert, this.classicDatePipe ) ) : null,
        } )
    }

    protected resetForm (): void {
        this.facade.resetCommunication()
        this.movementSelectorVisible.set( false )
        this.alertSelectorMode.set( undefined )
        this.form().reset( emptyCommunicationFormModel() )
        this.applyInitialLinks()
    }

    protected submit (): void {
        if (this.saving()) return

        if (!this.isFormValid( this.form )) {
            this.logInvalidForm( this.model() )
            return
        }

        if (this.alertSelectorMode() === AlertModulableFieldEnum.NEW) {
            this.submitAlert()
        } else {
            this.submitCommunication()
        }
    }

    private submitCommunication (): void {
        const dto: CommunicationDto = toCommunicationDto( this.model(), this.facade.communication() )
        this.save(
            (this.facade.communication()
             ? this.facade.updateCommunication( this.facade.communication()!.id, dto, ETagHelper.ifMatch( this.facade.communication() ) )
             : this.facade.createCommunication( dto )
            ).pipe( tap( (): void => this.resetForm() ) ),
            false,
        )
    }

    private submitAlert (): void {
        const dto: AlertDto = toNewAlertDto( this.model(), this.facade.communication() )
        this.save( this.alertFacade.createAlert( dto ).pipe( tap( (): void => this.resetForm() ) ), false )
    }

    protected handleMovementSearch (searched: { query: string }): void {
        this.facade.searchMovements( searched.query )
    }

    protected handleAlertSearch (searched: { query: string }): void {
        this.facade.searchAlerts( searched.query )
    }

    protected selectMovement (key: string): void {
        const chosen: SelectOptionModel<MovementModel> | undefined = this.movementChoices().find( (option: SelectOptionModel<MovementModel>): boolean => option.value.id === key )
        this.model.update( (current: CommunicationFormModel): CommunicationFormModel => ({ ...current, movement: chosen ? FormModelHelper.copy( chosen ) : null }) )
    }

    protected selectAlert (key: string): void {
        const chosen: SelectOptionModel<AlertModel> | undefined = this.alertChoices().find( (option: SelectOptionModel<AlertModel>): boolean => option.value.id === key )
        this.model.update( (current: CommunicationFormModel): CommunicationFormModel => ({ ...current, alert: chosen ? FormModelHelper.copy( chosen ) : null }) )
    }

    private withSelected<T extends { id: string }> (found: SelectOptionModel<T>[], selected: SelectOptionModel<T> | null): SelectOptionModel<T>[] {
        const isSelectedListed: boolean = !selected || found.some( (option: SelectOptionModel<T>): boolean => option.value.id === selected.value.id )
        return isSelectedListed ? found : [ selected!, ...found ]
    }

    protected removeMovementField (): void {
        this.model.update( (current: CommunicationFormModel): CommunicationFormModel => ({ ...current, movement: null }) )
        this.movementSelectorVisible.set( false )
    }

    protected removeAlertField (): void {
        this.model.update( (current: CommunicationFormModel): CommunicationFormModel => ({ ...current, alert: null, newAlertTitle: '' }) )
        this.alertSelectorMode.set( undefined )
    }

    protected override get idParam (): string | undefined {
        return this.route.snapshot.params['communicationId']
    }

    private buildModulableFields (actions: MenuEntryModel[]): MenuEntryModel[] {
        return actions.filter( (action: MenuEntryModel): boolean => {
            switch (true) {
                case action.id === CommunicationModulableFieldEnum.ALERT:
                    return GenericHelper.isNull( this.initialAlert() ) && this.hasAlertOption()
                case action.id === CommunicationModulableFieldEnum.MOVEMENT:
                    return GenericHelper.isNull( this.initialMovement() )
                default:
                    return true
            }
        } ).map( (action: MenuEntryModel): MenuEntryModel => ({
            ...action,
            disabled: action.disabled || (action.id === CommunicationModulableFieldEnum.ALERT && GenericHelper.nonNull(
                this.alertSelectorMode() )) || (action.id === CommunicationModulableFieldEnum.MOVEMENT && this.movementSelectorVisible()),
        }) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
