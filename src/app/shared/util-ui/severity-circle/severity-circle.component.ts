import { Component, computed, input, InputSignal, Signal } from '@angular/core'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'

@Component( {
    selector: 'app-severity-circle',
    standalone: true,
    imports: [],
    templateUrl: './severity-circle.component.html',
    styleUrl: './severity-circle.component.scss',
} )
export class SeverityCircleComponent {
    public readonly severity: InputSignal<SeverityEnum | undefined> = input.required<SeverityEnum | undefined>()
    protected readonly secondary: Signal<boolean> = computed( (): boolean => this.severity() === SeverityEnum.SECONDARY )
    protected readonly success: Signal<boolean> = computed( (): boolean => this.severity() === SeverityEnum.SUCCESS )
    protected readonly info: Signal<boolean> = computed( (): boolean => this.severity() === SeverityEnum.INFO )
    protected readonly warning: Signal<boolean> = computed( (): boolean => this.severity() === SeverityEnum.WARNING )
    protected readonly danger: Signal<boolean> = computed( (): boolean => this.severity() === SeverityEnum.DANGER )
}
