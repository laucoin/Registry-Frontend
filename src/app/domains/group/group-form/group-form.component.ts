import { Component, signal, WritableSignal } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Params } from '@angular/router'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { GroupFacade } from '../data/state/group.facade'
import { GroupDto } from '../data/dto/group.dto'
import { AsyncPipe, DatePipe } from '@angular/common'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { DatePicker } from 'primeng/datepicker'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { InputText } from 'primeng/inputtext'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { Observable } from 'rxjs'
import { Divider } from 'primeng/divider'
import {
    SelectElementsFieldComponent,
} from '../../../shared/util-ui/select-elements-field/select-elements-field.component'
import { ParticipantUtil } from '../../../shared/util-tool/util/participant.util'
import { SelectItem } from 'primeng/api'
import { StringUtils } from '../../../shared/util-tool/util/string.util'

@Component( {
    selector: 'app-group-form',
    imports: [
        AsyncPipe,
        Button,
        Card,
        DatePicker,
        DatePipe,
        FormComponent,
        FormFieldErrorComponent,
        RegistryRequiredDirective,
        TranslatePipe,
        InputText,
        ReactiveFormsModule,
        Divider,
        SelectElementsFieldComponent,
    ],
    templateUrl: './group-form.component.html',
} )
export class GroupFormComponent extends GenericFormComponent {
    protected readonly participantsSuggestion$: Observable<SelectItem<ParticipantModel>[]>
    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )

    public constructor (protected readonly facade: GroupFacade) {
        super(
            AppRouteEnum.GROUPS,
            facade.elementLoading,
            facade.elementError,
        )

        facade.resetElement()

        this.handleIdParam()

        this.handleLoadedGroup()

        this.participantsSuggestion$ = this.facade.searchedParticipants
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            name: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.max( 150 ), CustomValidators.nonBlank() ],
            ),
            presence: this.formBuilder.control( [] ),
            participants: this.formBuilder.control( [], [ Validators.required ] ),
        } )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.GROUPS )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( this.buildUri( AppRouteEnum.GROUPS_CREATION ) ).catch( console.error )
                } else {
                    this.facade.fetchElement( params['id'], this.contextEventId() )
                }
            } ),
        )
    }

    private handleLoadedGroup (): void {
        this.subscriptions.add(
            this.facade.element?.subscribe( (group: GroupModel | undefined): void => {
                this.group.set( group )
                if (!group) return
                this.name.setValue( group.name )
                this.presence.setValue( FormUtil.buildDateRange( group?.begin, group?.end ) )
                this.participants.setValue( this.buildFormFromMembers( group.members ) )
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
    }

    private buildFormFromMembers (members: ParticipantModel[]): SelectItem<ParticipantModel>[] {
        return members.map( (member: ParticipantModel): SelectItem<ParticipantModel> =>
            ParticipantUtil.toSelectItem( member ),
        )
    }

    protected next (): void {
        const participant: GroupDto = {
            name: this.name.value,
            begin: this.presence.value?.[0],
            end: this.presence.value?.[1],
            members: this.buildContent(),
        }

        this.subscriptions.add(
            (
                this.group() ?
                this.facade.updateElement( this.group()!.id, participant, this.contextEventId() )
                             : this.facade.createElement( participant, this.contextEventId() )
            ).subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    private buildContent (): string[] {
        return (this.participants.value ?? []).map( (item: SelectItem<ParticipantModel>): string => item.value.id )
    }

    protected get exampleBeginDate (): Date {
        const now: Date = new Date()

        if (now.getMonth() > 6) {
            now.setFullYear( now.getFullYear() + 1 )
        }

        now.setMonth( 6, 20 )
        return now
    }

    protected get exampleEndDate (): Date {
        const now: Date = this.exampleBeginDate
        now.setMonth( 7, 2 )
        return now
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipants(
            searched,
            this.contextEventId(),
        )
    }

    protected get name (): FormControl {
        return this.form.get( 'name' ) as FormControl
    }

    protected get presence (): FormControl {
        return this.form.get( 'presence' ) as FormControl
    }

    protected get participants (): FormControl {
        return this.form.get( 'participants' ) as FormControl
    }
}
