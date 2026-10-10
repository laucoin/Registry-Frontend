import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

export interface TestProfileState {
    items: string[]
    language: string
}

const initial: TestProfileState = { items: [], language: 'fr' }

export const TestProfileStore = signalStore(
    withState<TestProfileState>( initial ),
    withProfileScope<TestProfileState>( initial, (current: TestProfileState): Partial<TestProfileState> => ({ language: current.language }) ),
    withMethods( (store) => ({
        add: (item: string): void => patchState( store, (state: TestProfileState) => ({ items: [ ...state.items, item ] }) ),
        setLanguage: (language: string): void => patchState( store, { language } ),
    }) ),
)
