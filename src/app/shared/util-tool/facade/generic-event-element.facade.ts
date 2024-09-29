import { GenericModel } from '../../util-model/model/generic.model'
import { StateModel } from '../../util-model/model/state.model'
import { GenericFacade } from './generic.facade'

export abstract class GenericEventElementFacade<M extends GenericModel> extends GenericFacade<M> {
    protected get actualSelectedEventId (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.registry.authentication.currentUser?.preferences?.selectedProfile?.event?.id )
    }

    public abstract startPageLoader (): void

    public abstract stopPageLoader (): void

    public abstract fetchElementPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined,
    ): void

    public abstract startElementLoader (): void

    public abstract stopElementLoader (): void

    public abstract fetchElement (id: string, eventId: string | undefined): void

    public abstract deleteElement (element: M, eventId: string | undefined): void
}
