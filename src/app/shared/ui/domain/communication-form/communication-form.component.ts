import {
    Component,
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
import { AlertModel } from '@shared/models/model/alert.model'
import { FormModelHelper, SelectableItem } from '@shared/helpers/form/form-model.helper'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import { Textarea } from 'primeng/textarea'
import {TranslocoPipe} from '@jsverse/transloco'
import { ProjectHelper } from '@shared/helpers/project.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { Menu } from 'primeng/menu'
import { Ripple } from 'primeng/ripple'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { Divider } from 'primeng/divider'
import { InputText } from 'primeng/inputtext'
import { CommunicationDto } from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'

enum CommunicationModulableFieldEnum {
    MOVEMENT = 'movement',
    ALERT = 'alert',
}

enum AlertModulableFieldEnum {
    SELECT = 'SELECT',
    NEW = 'NEW',
}

import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component'

/**
 * Purpose: Form to create or edit a communication.
 * Scope: Links the communication to a movement or an alert and submits through the communication facade.
 * Limits: Does not decide where to navigate after submit.
 */
@Component( {
    selector: 'app-communication-form',
    imports: [
        FormErrorComponent,
        Button,
        Card,
        FieldErrorComponent,
        Textarea,
        TranslocoPipe,
        FormField,
        Menu,
        Ripple,
        AutoComplete,
        DateFormatPipe,
        Divider,
        InputText,
    ],
    templateUrl: './communication-form.component.html',
    styleUrl: './communication-form.component.css',
} )
export class CommunicationFormComponent extends BaseFormComponent implements OnInit, OnDestroy {
    protected readonly facade: CommunicationFacade = inject( CommunicationFacade )
    protected readonly alertFacade: AlertFacade = inject( AlertFacade )
    protected readonly classicDatePipe: DateFormatPipe = inject( DateFormatPipe )
    protected readonly optionPipe: ProjectOptionIconPipe = inject( ProjectOptionIconPipe )

    protected readonly movementOptions: Signal<SelectableItem<MovementModel>[]> = computed(
        (): SelectableItem<MovementModel>[] => FormModelHelper.selectable( this.facade.searchedMovementsMetadata() ),
    )
    protected readonly alertOptions: Signal<SelectableItem<AlertModel>[]> = computed(
        (): SelectableItem<AlertModel>[] => FormModelHelper.selectable( this.facade.searchedAlertsMetadata() ),
    )
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
            icon: 'pi pi-sort-alt',
            disabled: false,
            command: (): void => this.movementSelectorVisible.set( true ),
        },
        {
            id: CommunicationModulableFieldEnum.ALERT,
            label: 'communications.form.actions.link-alert',
            icon: this.optionPipe.transform( ProjectOptionEnum.ALERT ),
            disabled: false,
            command: (): void => this.alertSelectorMode.set( AlertModulableFieldEnum.SELECT ),
        },
        {
            id: CommunicationModulableFieldEnum.ALERT,
            label: 'communications.form.actions.add-alert',
            icon: this.optionPipe.transform( ProjectOptionEnum.ALERT ),
            disabled: false,
            command: (): void => {
                this.alertSelectorMode.set( AlertModulableFieldEnum.NEW )
            },
        },
    ] )

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
             ? this.facade.updateCommunication( this.facade.communication()!.id, dto )
             : this.facade.createCommunication( dto )
            ).pipe( tap( (): void => this.resetForm() ) ),
            false,
        )
    }

    private submitAlert (): void {
        const dto: AlertDto = toNewAlertDto( this.model(), this.facade.communication() )
        this.save( this.alertFacade.createAlert( dto ).pipe( tap( (): void => this.resetForm() ) ), false )
    }

    protected handleMovementSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchMovements( searched.query )
    }

    protected handleAlertSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchAlerts( searched.query )
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
                    return GenericHelper.isNull( this.initialAlert() ) && ProjectHelper.hasOption(
                        this.sessionFacade.selectedProject(),
                        ProjectOptionEnum.ALERT,
                    )
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
