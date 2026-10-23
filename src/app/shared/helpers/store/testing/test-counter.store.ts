import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'

export const TestCounterStore = signalStore(
    { providedIn: 'root' },
    withState<{ count: number, other: number }>( { count: 0, other: 0 } ),
    withMethods( (store) => ({
        setCount: (count: number): void => patchState( store, { count } ),
        setOther: (other: number): void => patchState( store, { other } ),
    }) ),
)
