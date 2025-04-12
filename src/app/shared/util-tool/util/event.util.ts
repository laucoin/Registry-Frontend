import { EventModel } from '../../util-model/model/event.model'
import { SelectItem } from 'primeng/api'

export class EventUtil {
    public static hasOption (event: EventModel | undefined, option: string | undefined): boolean {
        if (!event || !option) return true
        return event?.options?.some( (item: SelectItem<string>): boolean => item.value == option )
    }
}
