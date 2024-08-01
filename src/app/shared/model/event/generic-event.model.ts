import { EnrichedEventModel } from './enriched-event.model'

export interface GenericEventModel {
    eventId: string | undefined
    event: EnrichedEventModel | undefined
}
