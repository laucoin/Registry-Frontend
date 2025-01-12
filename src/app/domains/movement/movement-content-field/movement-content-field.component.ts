import { Component, EventEmitter, forwardRef, Input, Output, signal, WritableSignal } from '@angular/core'
import { ParticipantUtil } from '../../../shared/util-tool/util/participant.util'
import { GroupUtil } from '../../../shared/util-tool/util/group.util'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { Button } from 'primeng/button'
import { TranslatePipe } from '@ngx-translate/core'
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms'
import { SelectItem, SelectItemGroup } from 'primeng/api'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../shared/util-model/model/group.model'
import { StateUtil } from '../../../shared/util-tool/state/state.util'
import { RegistryFacade } from '../../../shared/util-common/state/registry.facade'

@Component( {
    selector: 'app-movement-content-field',
    imports: [
        AutoComplete,
        Button,
        TranslatePipe,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef( (): typeof MovementContentFieldComponent => MovementContentFieldComponent ),
            multi: true,
        },
    ],
    templateUrl: './movement-content-field.component.html',
    styleUrl: './movement-content-field.component.scss',
} )
export class MovementContentFieldComponent implements ControlValueAccessor {
    protected readonly ParticipantUtil: typeof ParticipantUtil = ParticipantUtil
    protected readonly GroupUtil: typeof GroupUtil = GroupUtil

    @Input( { required: true } ) public formControl!: FormControl
    @Input() public suggestions: SelectItemGroup<ParticipantModel | GroupModel>[] = []
    @Input() public fluid: boolean = true
    @Input() public unique: boolean = true
    @Input() public inputId: string | undefined
    @Input() public searchLabel: string | undefined
    @Input() public emptyPlaceholder: string | undefined

    @Output() public handleSearch: EventEmitter<AutoCompleteCompleteEvent> = new EventEmitter<AutoCompleteCompleteEvent>()

    private onChange: ((value: SelectItem<ParticipantModel | GroupModel>[]) => void) | undefined = undefined
    private onTouched: (() => void) | undefined = undefined

    protected readonly disabled: WritableSignal<boolean> = signal( false )
    protected readonly participants: WritableSignal<ParticipantModel[]> = signal( [] )
    protected readonly groups: WritableSignal<GroupModel[]> = signal( [] )

    public constructor (private readonly registryFacade: RegistryFacade) {}

    private isGroup (element: ParticipantModel | GroupModel): boolean {
        return 'name' in element
    }

    protected onRemoveParticipant (participantId: string): void {
        this.updateValue(
            this.formControl.value.filter( (item: ParticipantModel | GroupModel): boolean =>
                !(!this.isGroup( item ) && item.id == participantId),
            ),
        )
    }

    protected onRemoveGroup (groupId: string): void {
        this.updateValue(
            this.formControl.value.filter( (item: ParticipantModel | GroupModel): boolean =>
                !(this.isGroup( item ) && item.id == groupId),
            ),
        )
    }

    protected onRemoveGroupParticipant (groupId: string, memberId: string): void {
        const content: (ParticipantModel | GroupModel)[] = this.formControl.value
        const index: number = content.findIndex( (item: ParticipantModel | GroupModel): boolean =>
            this.isGroup( item ) && item.id == groupId,
        )
        const group: GroupModel = this.formControl.value[index] as GroupModel
        if (group.members.length === 1) {
            this.onRemoveGroup( groupId )
        } else {
            content[index] = {
                ...group,
                members: group.members.filter( (member: ParticipantModel): boolean =>
                    member.id !== memberId,
                ),
            }
            this.updateValue( content )
        }
    }

    protected onElementSelection (element: SelectItem<ParticipantModel | GroupModel>): void {
        const newParticipantIds: string[] = []
        if (this.isGroup( element.value )) {
            if (this.groups().find( (group: GroupModel): boolean => group.id == element.value.id )) {
                this.registryFacade.notify(
                    StateUtil.buildNotificationMessage(
                        'warn',
                        'warning.title.duplicated-selection.group',
                        'warning.message.duplicated-selection.group',
                        undefined,
                        { name: element.label },
                    ),
                )
                return
            }

            newParticipantIds.push(
                ...(element.value as GroupModel).members.map( (member: ParticipantModel): string => member.id ),
            )
        } else {
            newParticipantIds.push( element.value.id )
        }

        let duplicationCount: number = 0

        this.participants()
            .filter( (participant: ParticipantModel): boolean => newParticipantIds.includes( participant.id ) )
            .forEach( (participant: ParticipantModel): void => {
                duplicationCount++
                this.onRemoveParticipant( participant.id )
            } )

        this.groups().forEach( (group: GroupModel): void => {
            group.members
                 .filter( (member: ParticipantModel): boolean => newParticipantIds.includes( member.id ) )
                 .forEach( (member: ParticipantModel): void => {
                     duplicationCount++
                     this.onRemoveGroupParticipant( group.id, member.id )
                 } )
        } )

        if (duplicationCount > 0) {
            this.registryFacade.notify(
                StateUtil.buildNotificationMessage(
                    'warn',
                    'warning.title.duplicated-selection.participant.' + (duplicationCount > 1 ? 'plural' : 'singular'),
                    'warning.message.duplicated-selection.participant.' + (duplicationCount > 1 ? 'plural' : 'singular'),
                    undefined,
                    { count: duplicationCount },
                ),
            )
        }

        this.updateValue( [ ...this.groups(), ...this.participants(), element.value ] )
    }

    private updateValue (value: (GroupModel | ParticipantModel)[]): void {
        this.formControl.setValue( value )
        this.handleContentChanges()
    }

    private handleContentChanges (): void {
        const content: (GroupModel | ParticipantModel)[] = this.formControl.value
        const participants: ParticipantModel[] = []
        const groups: GroupModel[] = []

        content.forEach( (item: GroupModel | ParticipantModel): void => {
            if (this.isGroup( item )) {
                groups.push( item as GroupModel )
            } else {
                participants.push( item as ParticipantModel )
            }
        } )

        this.participants.set( participants )
        this.groups.set( groups )
    }

    public writeValue (value: (ParticipantModel | GroupModel)[]): void {
        const participants: ParticipantModel[] = []
        const groups: GroupModel[] = []

        value.forEach( (item: GroupModel | ParticipantModel): void => {
            if (this.isGroup( item )) {
                groups.push( item as GroupModel )
            } else {
                participants.push( item as ParticipantModel )
            }
        } )

        this.participants.set( participants )
        this.groups.set( groups )
    }

    public registerOnChange (fn: (value: SelectItem<ParticipantModel | GroupModel>[]) => void): void {
        this.onChange = fn
    }

    public registerOnTouched (fn: () => void): void {
        this.onTouched = fn
    }

    public setDisabledState? (isDisabled: boolean): void {
        this.disabled.set( isDisabled )
    }
}
