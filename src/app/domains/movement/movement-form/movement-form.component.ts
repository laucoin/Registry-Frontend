import { Component, OnInit, signal, WritableSignal } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Params } from '@angular/router'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { MovementFacade } from '../data/state/movement.facade'
import { MovementModel } from '../../../shared/util-model/movement.model'
import { MovementDto } from '../data/dto/movement.dto'
import { AsyncPipe, DatePipe } from '@angular/common'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { TranslateModule, TranslatePipe } from '@ngx-translate/core'
import { DropdownModule } from 'primeng/dropdown'
import { MovementContentDto } from '../data/dto/movement-content.dto'
import { Select } from 'primeng/select'
import { DatePicker } from 'primeng/datepicker'
import { filter, mergeMap, Observable, of } from 'rxjs'
import { SelectItem, SelectItemGroup } from 'primeng/api'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { MovementContentFieldComponent } from '../movement-content-field/movement-content-field.component'
import { MovementContentModel } from '../../../shared/util-model/movement-content.model'
import { StringUtils } from '../../../shared/util-tool/util/string.util'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { EventUtil } from '../../../shared/util-tool/util/event.util'
import { MovementVehicleFieldComponent } from '../movement-vehicle-field/movement-vehicle-field.component'
import { ParticipantUtil } from '../../../shared/util-tool/util/participant.util'

@Component( {
    selector: 'app-movement-form',
    standalone: true,
    imports: [
        AsyncPipe,
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FormFieldErrorComponent,
        InputTextModule,
        ReactiveFormsModule,
        TranslateModule,
        DropdownModule,
        Select,
        DatePicker,
        RegistryRequiredDirective,
        MovementContentFieldComponent,
        TranslatePipe,
        DatePipe,
        MovementVehicleFieldComponent,
    ],
    templateUrl: './movement-form.component.html',
} )
export class MovementFormComponent extends GenericFormComponent implements OnInit {
    protected now: Date = new Date()
    protected readonly movementTypes$: Observable<SelectItem<string>[]>

    protected contentSuggestions$: Observable<SelectItemGroup<ParticipantModel | GroupModel>[]> = of( [] )
    protected vehicleSuggestions$: Observable<SelectItem<VehicleModel>[]> = of( [] )

    protected readonly movement: WritableSignal<MovementModel | undefined> = signal( undefined )
    protected readonly drivers: WritableSignal<SelectItem<ParticipantModel>[]> = signal( [] )

    public constructor (
        protected readonly facade: MovementFacade,
        private readonly datePipe: DatePipe,
    ) {
        super(
            AppRouteEnum.MOVEMENTS,
            facade.movementLoading,
        )

        facade.resetMovement()
        this.movementTypes$ = facade.movementTypesMetadata

        this.handleContextEvent()
        this.handleIdParam()
        this.handleLoadedMovement()
        this.handleContentChange()

        this.contentSuggestions$ = this.facade.searchedParticipantAndGroupMetadata
        this.vehicleSuggestions$ = this.facade.searchedVehicleMetadata
    }

    public ngOnInit (): void {
        this.facade.fetchMovementTypes( this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            dateTime: this.formBuilder.control( new Date(), [ Validators.required ] ),
            type: this.formBuilder.control( undefined, [ Validators.required ] ),
            content: this.formBuilder.control( [], [ Validators.required ] ),
            vehiclesWithDrivers: this.formBuilder.array( [], [] ),
        } )
    }

    private handleContextEvent (): void {
        this.subscriptions.add(
            this.contextEvent$.subscribe( (event: EventModel | undefined): void => {
                if (event?.begin) {
                    this.dateTime.addValidators( CustomValidators.minDate(
                        new Date( event?.begin ),
                        this.datePipe.transform(
                            new Date( event?.begin ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
                if (event?.end) {
                    this.dateTime.addValidators( CustomValidators.maxDate(
                        new Date( event?.end ),
                        this.datePipe.transform(
                            new Date( event?.end ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
            } ),
        )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.MOVEMENTS )) {
            return
        }
        this.subscriptions.add(
            this.movementTypes$.pipe(
                filter( (types: SelectItem<string>[]): boolean => types && types.length > 0 ),
                mergeMap( (): Observable<Params> => this.route.params ),
            ).subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( this.buildUri( AppRouteEnum.MOVEMENTS_CREATION ) ).catch( console.error )
                } else {
                    this.facade.fetchMovement( params['id'], this.contextEventId() )
                }
            } ),
        )
    }

    private handleLoadedMovement (): void {
        this.subscriptions.add(
            this.facade.movement?.subscribe( (movement: MovementModel | undefined): void => {
                this.movement.set( movement )
                if (!movement) return
                this.dateTime.setValue( new Date( movement?.dateTime ) )
                this.type.setValue( movement.type.value )
                this.content.setValue( this.buildContentFromLoadedMovement() )
                this.buildVehiclesFromLoadedMovement()
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
    }

    private handleContentChange (): void {
        this.subscriptions.add(
            this.content.valueChanges.subscribe( (content: (GroupModel | ParticipantModel)[]): void => {
                const drivers: SelectItem<ParticipantModel>[] = []
                content.forEach( (item: GroupModel | ParticipantModel): void => {
                    if (this.isGroup( item )) {
                        (item as GroupModel).members.forEach( (member: ParticipantModel): void => {
                            drivers.push( ParticipantUtil.toSelectItem( member as ParticipantModel ) )
                        } )
                    } else {
                        drivers.push( ParticipantUtil.toSelectItem( item as ParticipantModel ) )
                    }
                } )
                this.drivers.set( drivers )
            } ),
        )
    }

    private buildContentFromLoadedMovement (): (ParticipantModel | GroupModel)[] {
        const participants: ParticipantModel[] = []
        const groups: GroupModel[] = []

        this.movement()?.content.forEach( (content: MovementContentModel): void => {
            if (content.poolName) {
                const groupIndex: number = groups.findIndex( (group: GroupModel): boolean => group.name === content.poolName )
                if (groupIndex === -1) {
                    groups.push( {
                        name: content.poolName,
                        members: [ content.participant ],
                    } as GroupModel )
                } else {
                    groups[groupIndex].members.push( content.participant )
                }
            } else {
                participants.push( content.participant )
            }
        } )

        return [ ...participants, ...groups ]
    }

    private buildVehiclesFromLoadedMovement (): void {
        this.vehiclesWithDrivers.clear()
        this.movement()?.content
            .filter( (content: MovementContentModel): boolean => !!content.vehicle )
            .forEach( (content: MovementContentModel): void => {
                this.vehiclesWithDrivers.push(
                    this.formBuilder.group( {
                        vehicle: this.formBuilder.control( content.vehicle!, [ Validators.required ] ),
                        driver: this.formBuilder.control( content.participant!, [ Validators.required ] ),
                    } ),
                )
            } )
    }

    protected next (): void {
        const movement: MovementDto = {
            dateTime: this.dateTime.value,
            type: this.type.value,
            content: this.buildContent(),
        }

        this.subscriptions.add(
            (
                this.movement()
                ? this.facade.updateMovement( this.movement()!.id, movement, this.contextEventId() )
                : this.facade.createMovement( movement, this.contextEventId() )
            ).subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    private buildContent (): MovementContentDto[] {
        const content: MovementContentDto[] = []

        this.content.value.forEach( (item: GroupModel | ParticipantModel): void => {
            if (this.isGroup( item )) {
                (item as GroupModel).members.forEach( (member: ParticipantModel): void => {
                    content.push( {
                        poolName: (item as GroupModel).name,
                        participantId: member.id,
                        vehicleId: this.getVehicleFromDriver( member )?.id,
                    } )
                } )
            } else {
                content.push( {
                    participantId: item.id,
                    vehicleId: this.getVehicleFromDriver( item as ParticipantModel )?.id,
                } )
            }
        } )

        return content
    }

    private getVehicleFromDriver (driver: ParticipantModel): VehicleModel | undefined {
        const group: FormGroup | undefined = this.vehiclesWithDrivers.value
                                                 .find( (formGroup: FormGroup): boolean => Object.values( formGroup )[1].id === driver.id )
        return group ? Object.values( group )[0] : undefined
    }

    protected hasVehicleOption (event: EventModel | undefined): boolean {
        return EventUtil.hasOption( event, 'VEHICLE' )
    }

    private isGroup (element: ParticipantModel | GroupModel): boolean {
        return 'name' in element
    }

    protected handleParticipantsAndGroupsSearch (searched: string | undefined): void {
        this.facade.searchParticipantsAndGroups(
            searched,
            this.contextEventId(),
        )
    }

    protected handleVehiclesSearch (searched: string | undefined): void {
        this.facade.searchVehicles(
            searched,
            this.contextEventId(),
        )
    }

    protected get dateTime (): FormControl {
        return this.form.get( 'dateTime' ) as FormControl
    }

    protected get type (): FormControl {
        return this.form.get( 'type' ) as FormControl
    }

    protected get content (): FormControl {
        return this.form.get( 'content' ) as FormControl
    }

    protected get vehiclesWithDrivers (): FormArray {
        return this.form.get( 'vehiclesWithDrivers' ) as FormArray
    }
}
