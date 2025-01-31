import { Component, OnInit, signal, WritableSignal } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Params } from '@angular/router'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { MovementFacade } from '../data/state/movement.facade'
import { MovementModel } from '../data/model/movement.model'
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
import { MovementContentModel } from '../data/model/movement-content.model'
import { StringUtils } from '../../../shared/util-tool/util/string.util'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'

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

    ],
    templateUrl: './movement-form.component.html',
} )
export class MovementFormComponent extends GenericFormComponent implements OnInit {
    protected now: Date = new Date()
    protected readonly movementTypes$: Observable<SelectItem<string>[]>

    protected contentSuggestions$: Observable<SelectItemGroup<ParticipantModel | GroupModel>[]> = of( [] )

    protected readonly movement: WritableSignal<MovementModel | undefined> = signal( undefined )

    public constructor (
        protected readonly facade: MovementFacade,
        private readonly datePipe: DatePipe,
    ) {
        super(
            AppRouteEnum.MOVEMENTS,
            facade.elementLoading,
        )

        facade.resetElement()
        this.movementTypes$ = facade.movementTypes

        this.handleContextEvent()
        this.handleIdParam()
        this.handleLoadedMovement()

        this.contentSuggestions$ = this.facade.searchedParticipantsAndGroups
    }

    public ngOnInit (): void {
        this.facade.fetchMovementTypes( this.contextEventId() )
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            dateTime: this.formBuilder.control( new Date(), [ Validators.required ] ),
            type: this.formBuilder.control( undefined, [ Validators.required ] ),
            content: this.formBuilder.control( [], [ Validators.required ] ),
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
                    this.facade.fetchElement( params['id'], this.contextEventId() )
                }
            } ),
        )
    }

    private handleLoadedMovement (): void {
        this.subscriptions.add(
            this.facade.element?.subscribe( (movement: MovementModel | undefined): void => {
                this.movement.set( movement )
                if (!movement) return
                this.dateTime.setValue( new Date( movement?.dateTime ) )
                this.type.setValue( movement.type.value )
                this.content.setValue( this.buildContentFromLoadedMovement() )
                FormUtil.markAllControlsAsDirty( this.form )
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

    protected next (): void {
        const movement: MovementDto = {
            dateTime: this.dateTime.value,
            type: this.type.value,
            content: this.buildContent(),
        }

        this.subscriptions.add(
            (
                this.movement() ?
                this.facade.updateElement( this.movement()!.id, movement, this.contextEventId() )
                                : this.facade.createElement( movement, this.contextEventId() )
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
                    } )
                } )
            } else {
                content.push( { participantId: item.id } )
            }
        } )

        return content
    }

    private isGroup (element: ParticipantModel | GroupModel): boolean {
        return 'name' in element
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipantsAndGroups(
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
}
