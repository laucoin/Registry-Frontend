import { Component, Input, OnChanges, signal, WritableSignal } from '@angular/core'
import { ParticipantFacade } from '../../participant/data/state/participant.facade'
import { GenericComponent } from '../../../shared/util-tool/component/generic.component'
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Observable, of } from 'rxjs'
import { Button } from 'primeng/button'
import { TranslateModule } from '@ngx-translate/core'
import { LayerComponent } from '../../../shared/util-ui/layer/layer.component'
import { IconFieldModule } from 'primeng/iconfield'
import { InputIconModule } from 'primeng/inputicon'
import { InputTextModule } from 'primeng/inputtext'
import { ListboxChangeEvent, ListboxModule } from 'primeng/listbox'
import { AsyncPipe, NgForOf } from '@angular/common'
import { MessageComponent } from '../../../shared/util-ui/message/message.component'
import { ToastMessageOptions } from 'primeng/api'
import { CardModule } from 'primeng/card'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { ItemModel } from '../../../shared/util-model/model/item.model'

@Component( {
    selector: 'app-movement-content-field',
    standalone: true,
    imports: [
        Button,
        TranslateModule,
        LayerComponent,
        ReactiveFormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ListboxModule,
        AsyncPipe,
        NgForOf,
        MessageComponent,
        CardModule,
    ],
    templateUrl: './movement-content-field.component.html',
    styleUrl: './movement-content-field.component.scss',
} )
export class MovementContentFieldComponent extends GenericComponent implements OnChanges {
    @Input( { required: true } ) public formArray: FormArray | undefined
    protected readonly form: FormGroup

    protected layerOpened: boolean = false
    protected layerParticipants$: Observable<ItemModel[]> = of( [] )
    protected layerSelectedParticipants: WritableSignal<ParticipantModel[]> = signal( [] )
    protected layerForm: FormGroup

    protected message: ToastMessageOptions = {
        severity: 'warn', summary: 'warning.title.EMPTY', detail: 'warning.message.EMPTY',
    }

    public constructor (
        private readonly facade: ParticipantFacade,
        private readonly formBuilder: FormBuilder,
    ) {
        super()

        this.layerForm = this.initLayerForm()
        this.form = this.formBuilder.group( {
            content: this.formBuilder.array( [] ),
        } )
    }

    public ngOnChanges (): void {
        this.form.addControl( 'content', this.formArray )
    }

    private addContent (participant: ParticipantModel): void {
        const form: FormGroup = this.formBuilder.group( {
            participant: this.formBuilder.control( participant ),
        } )

        this.formArray?.push( form )
    }

    protected removeContent (index: number): void {
        this.formArray?.removeAt( index )
    }

    protected addSelectedParticipants (): void {
        const participants: ParticipantModel[] = (this.formArray?.controls as FormGroup[] ?? [])
            .map( (group: FormGroup): ParticipantModel => group.get( 'participant' )?.value )

        this.layerSelectedParticipants().forEach( (item: ParticipantModel): void => {
            if (!participants.some( (participant: ParticipantModel): boolean => item.id === participant.id )) {
                this.addContent( item )
            }
        } )

        this.closeLayer()
    }

    protected get invalid (): boolean {
        return ((this.formArray?.dirty || this.formArray?.touched) && this.formArray?.invalid) ?? false
    }

    private initLayerForm (): FormGroup {
        this.facade.searchParticipant( true, undefined, this.contextEventId() )
        this.layerParticipants$ = this.facade.searchedParticipants
        this.layerSelectedParticipants.set( [] )

        return this.formBuilder.group( {
            searched: this.formBuilder.control( '' ),
            participants: this.formBuilder.control( [] ),
        } )
    }

    protected closeLayer (): void {
        this.layerForm = this.initLayerForm()
        this.layerOpened = false
    }

    protected onLayerSelectionChange (event: ListboxChangeEvent): void {
        const selection: ParticipantModel[] =
            this.facade.actualSearchedParticipants
                .filter( (participant: ParticipantModel): boolean => event.value.includes( participant.id ) )

        this.layerSelectedParticipants.set( selection )
    }

    protected findParticipant (index: number): FormControl {
        return (this.formArray?.controls as FormGroup[])?.[index]?.get( 'participant' ) as FormControl
    }

    protected get layerSearched (): FormControl {
        return this.layerForm.get( 'searched' ) as FormControl
    }

    protected get layerParticipants (): FormControl {
        return this.layerForm.get( 'participants' ) as FormControl
    }
}
