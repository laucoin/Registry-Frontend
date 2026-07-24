import {ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal} from '@angular/core'
import {TranslatePipe} from '@ngx-translate/core'
import {ToastMessageOptions} from 'primeng/api'
import {SeverityEnum} from '../../util-model/enumeration/severity.enum'
import {MessageComponent} from '../message/message.component'
import {MessageModule} from 'primeng/message'

enum InformationImageEnum {
    SAD = 'console_someone',
    DESERT = 'no_data'
}

@Component({
    selector: 'app-severity-information',
    standalone: true,
    imports: [TranslatePipe, MessageModule, MessageComponent],
    templateUrl: './severity-information.component.html',
    styleUrl: './severity-information.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeverityInformationComponent {
    public readonly showImage: InputSignal<boolean> = input(true)
    public readonly message: InputSignal<ToastMessageOptions | undefined> = input.required()

    private readonly errorSeverities: string[] = [
        SeverityEnum.DANGER.toString(),
        SeverityEnum.ERROR?.toString(),
    ]

    private readonly informationImage: Signal<string> = computed(() =>
        this.errorSeverities.includes(this.message()?.severity ?? '')
            ? InformationImageEnum.SAD
            : InformationImageEnum.DESERT,
    )

    protected readonly imagePath: Signal<string> = computed((): string => `img/${this.informationImage()}.webp`)
    protected readonly imageAlt: Signal<string> = computed((): string => `global.img.${this.informationImage()}`)
}
