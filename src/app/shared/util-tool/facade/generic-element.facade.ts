import { GenericModel } from '../../util-model/model/generic.model'
import { GenericFacade } from './generic.facade'

export abstract class GenericElementFacade<M extends GenericModel> extends GenericFacade<M> {

    public abstract startPageLoader (): void

    public abstract stopPageLoader (): void

    public abstract fetchPage (offset: number | undefined, limit: number | undefined, force: boolean): void

    public abstract startElementLoader (): void

    public abstract stopElementLoader (): void

    public abstract fetchElement (id: string): void

    public abstract deleteElement (element: M): void
}
