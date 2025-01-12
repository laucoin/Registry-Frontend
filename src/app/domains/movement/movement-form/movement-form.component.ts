import { Component, signal, WritableSignal } from '@angular/core'
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
import { MovementTypeEnum } from '../data/model/movement-type.enum'
import { DropdownModule } from 'primeng/dropdown'
import { MovementContentDto } from '../data/dto/movement-content.dto'
import { Select } from 'primeng/select'
import { DatePicker } from 'primeng/datepicker'
import { Observable, of } from 'rxjs'
import { SelectItemGroup } from 'primeng/api'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { MovementContentFieldComponent } from '../movement-content-field/movement-content-field.component'
import { MovementContentModel } from '../data/model/movement-content.model'
import { StringUtils } from '../../../shared/util-tool/util/string.util'

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
export class MovementFormComponent extends GenericFormComponent {
    protected now: Date = new Date()

    protected typeMetadata: { label: string, value: MovementTypeEnum }[] = [
        { label: this.translateService.instant( 'movement.type.IN' ), value: MovementTypeEnum.IN },
        { label: this.translateService.instant( 'movement.type.OUT' ), value: MovementTypeEnum.OUT },
    ]

    protected contentSuggestions$: Observable<SelectItemGroup<ParticipantModel | GroupModel>[]> = of( [] )

    protected readonly movement: WritableSignal<MovementModel | undefined> = signal( undefined )

    public constructor (protected readonly facade: MovementFacade) {
        super(
            AppRouteEnum.MOVEMENTS,
            facade.elementLoading,
            facade.elementError,
        )

        facade.resetElement()

        this.handleIdParam()
        this.handleLoadedMovement()

        this.contentSuggestions$ = this.facade.searchedParticipantsAndGroups
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            dateTime: this.formBuilder.control( new Date(), [ Validators.required ] ),
            type: this.formBuilder.control( undefined, [ Validators.required ] ),
            content: this.formBuilder.control( [], [ Validators.required ] ),
        } )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.MOVEMENTS )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
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
                this.type.setValue( movement.type )
                this.content.setValue(
                    movement.content.map( (content: MovementContentModel): ParticipantModel | GroupModel =>
                        content.participant,
                    ),
                )
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
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
        const participantsFromGroup: MovementContentDto[] = []

        this.content.value.forEach( (item: GroupModel | ParticipantModel): void => {
            if (this.isGroup( item )) {
                (item as GroupModel).members.forEach( (member: ParticipantModel): void => {
                    participantsFromGroup.push( {
                        participantId: member.id,
                    } )
                } )
            } else {
                participantsFromGroup.push( { participantId: item.id } )
            }
        } )

        return participantsFromGroup
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
