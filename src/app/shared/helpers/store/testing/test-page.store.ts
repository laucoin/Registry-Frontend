import { signalStore, withMethods, withState } from '@ngrx/signals';

import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PageSlice, pageSlice } from '@shared/helpers/store/track-page.operator';
import { GenericModel } from '@shared/models/model/generic.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';

export type TestPageBlock = PageRequestInformationModel<object, GenericModel>;

export const TestPageStore = signalStore(
	{ providedIn: 'root' },
	withState<{ items: TestPageBlock }>({ items: PageStateHelper.initial<object, GenericModel>({}) }),
	withMethods((store) => ({
		itemsSlice: (): PageSlice<TestPageBlock> => pageSlice(store, 'items'),
	})),
);
