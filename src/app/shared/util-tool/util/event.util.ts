import { EventOptionEnum } from '../../util-model/enumeration/event-option.enum'
import { EventModel } from '../../util-model/model/event.model'
import { ArrayUtil } from './array.util'

export class EventUtil {
    public static hasOption (event: EventModel | undefined, option: EventOptionEnum | undefined): boolean {
        if (!event) return true
        return ArrayUtil.includes( event!.options, option )
    }
}
