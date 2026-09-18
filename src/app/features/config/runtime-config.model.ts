export interface RuntimeConfigModel {
	backend: {
		url: string;
	};
	organization: {
		name: string;
		website: string | null;
	};
	creator: {
		name: string;
		website: string | null;
		email: string | null;
	};
	hosting: {
		providerName: string | null;
		providerAddress: string | null;
	};
	support: {
		issuesUrl: string | null;
	};
}
