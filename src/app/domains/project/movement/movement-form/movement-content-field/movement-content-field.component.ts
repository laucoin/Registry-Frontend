import {
    ChangeDetectionStrategy,
    Component,
    computed,
    forwardRef,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    Signal,
    signal,
    WritableSignal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MovementContentModel } from '../../../../../shared/util-model/model/movement-content.model'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { SelectItem, SelectItemGroup } from 'primeng/api'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../../../shared/util-model/model/group.model'
import { GenericUtil } from '../../../../../shared/util-tool/util/generic.util'
import { TranslatePipe } from '@ngx-translate/core'
import { Button } from 'primeng/button'
import { ParticipantUtil } from '../../../../../shared/util-tool/util/participant.util'

@Component( {
    selector: 'app-movement-content-field',
    imports: [
        AutoComplete,
        TranslatePipe,
        Button,
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
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class MovementContentFieldComponent implements ControlValueAccessor {
    protected readonly ParticipantUtil: typeof ParticipantUtil = ParticipantUtil
    protected readonly Object: typeof Object = Object

    public readonly suggestions: InputSignal<SelectItemGroup<ParticipantModel | GroupModel>[]> = input.required()
    public readonly inputId: InputSignal<string | undefined> = input()
    public readonly fluid: InputSignal<boolean> = input( false )
    public readonly invalid: InputSignal<boolean> = input( false )
    public readonly emptyMessage: InputSignal<string | undefined> = input<string | undefined>( undefined )
    public readonly selectionLabel: InputSignal<string | undefined> = input.required()

    public readonly handleSearch: OutputEmitterRef<AutoCompleteCompleteEvent> = output()

    protected readonly value: WritableSignal<MovementContentModel[]> = signal( [] )
    protected readonly groups: Signal<Record<string, ParticipantModel[]>>
    protected readonly orphanParticipants: Signal<ParticipantModel[]>
    protected readonly disabled: WritableSignal<boolean> = signal( false )

    public constructor () {
        this.groups = computed( (): Record<string, ParticipantModel[]> => this.groupByPoolName( this.value() ) )
        this.orphanParticipants = computed( (): ParticipantModel[] => this.extractOrphanParticipants( this.value() ) )
    }

    public onChange: ((value: MovementContentModel[]) => void) | undefined = undefined
    public onTouched: (() => void) | undefined = undefined

    protected handleElementSelection (element: SelectItem<ParticipantModel | GroupModel>): void {
        const selectedContent: MovementContentModel[] = this.buildContent( element.value )

        const duplicatedParticipants: string[] = []
        const contentToAdd: MovementContentModel[] = selectedContent.filter(
            (content: MovementContentModel): boolean => {
                if (this.isDuplicates( content )) {
                    duplicatedParticipants.push( content.participant.id )
                    return false
                }
                return true
            },
        )

        this.onInputChange( [ ...this.value(), ...contentToAdd ] )

        if (duplicatedParticipants.length > 0) {
            duplicatedParticipants.forEach( (id: string): void => this.highlightDuplicated( id ) )
        }
    }

    protected handleParticipantRemoving (participantId: string): void {
        this.onInputChange(
            this.value().filter( (content: MovementContentModel): boolean => content.participant.id !== participantId ),
        )
    }

    protected handleGroupRemoving (groupName: string): void {
        this.onInputChange(
            this.value().filter( (content: MovementContentModel): boolean => content.poolName !== groupName ),
        )
    }

    private groupByPoolName (content: MovementContentModel[]): Record<string, ParticipantModel[]> {
        return content.filter( (value: MovementContentModel): boolean => GenericUtil.nonNull( value.poolName ) )
                      .reduce( (
                          acc: Record<string, ParticipantModel[]>,
                          value: MovementContentModel,
                      ): Record<string, ParticipantModel[]> => {
                          (acc[value.poolName!] ||= []).push( value.participant )
                          return acc
                      }, {} )
    }

    private extractOrphanParticipants (content: MovementContentModel[]): ParticipantModel[] {
        return content.filter( (value: MovementContentModel): boolean => GenericUtil.isNull( value.poolName ) )
                      .map( (value: MovementContentModel): ParticipantModel => value.participant )
    }

    private isDuplicates (content: MovementContentModel): boolean {
        return this.value().some( (value: MovementContentModel): boolean => value.participant.id === content.participant.id )
    }

    private buildContent (element: ParticipantModel | GroupModel): MovementContentModel[] {
        if (this.isGroup( element )) {
            const group: GroupModel = element as GroupModel
            return group.members.map(
                (member: ParticipantModel): MovementContentModel => ({
                    poolName: group.name,
                    participant: member,
                    vehicle: undefined,
                }),
            )
        } else {
            return [
                {
                    poolName: undefined,
                    participant: element as ParticipantModel,
                    vehicle: undefined,
                },
            ]
        }
    }

    protected highlightDuplicated (participantId: string): void {
        const element: HTMLElement | null = document.querySelector( `[data-value="${participantId}"]` )
        if (element) {
            element.classList.add( 'highlight' )
            setTimeout( () => element.classList.remove( 'highlight' ), 1000 )
        }
    }

    private onInputChange (value: MovementContentModel[]): void {
        this.value.set( value )
        this.onChange?.( value )
        this.onTouched?.()
    }

    private isGroup (element: ParticipantModel | GroupModel): boolean {
        return 'name' in element
    }

    public registerOnChange (fn: (value: MovementContentModel[]) => void): void {
        this.onChange = fn
    }

    public registerOnTouched (fn: () => void): void {
        this.onTouched = fn
    }

    public setDisabledState (disabled: boolean): void {
        this.disabled.set( disabled )
    }

    public writeValue (value: MovementContentModel[]): void {
        this.value.set( value )
    }
}
