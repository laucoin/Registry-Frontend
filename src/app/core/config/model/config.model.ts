export interface ConfigModel {
	defaultLanguage: string;
	languages: string[];
	application: {
		name: string;
		organization: string;
		version?: string;
		creator: {
			name: string;
			email: string;
			website: string;
		};
		support: {
			documentationUrl?: string;
			issuesUrl?: string;
		};
	};
	list: {
		searchDebounce: number;
		searchMinLength: number;
	};
	notification: {
		duration: {
			info: number | undefined;
			success: number | undefined;
			warn: number | undefined;
			error: number | undefined;
			secondary: number | undefined;
			contrast: number | undefined;
		};
	};
}

export const DEFAULT_LIST_CONFIG = { searchDebounce: 400, searchMinLength: 3 };
