'use strict';

const { strings } = require('@angular-devkit/schematics');
const { createFileRule } = require('../_lib/create-file-rule');

function store(options) {
	const stateName = `${strings.classify(options.name)}State`;

	return createFileRule(options, {
		suffix: 'store',
		defaultPath: 'src/app/shared/stores',
		render: (classifiedName) =>
			`import { signalStore, withState } from '@ngrx/signals';\n\ninterface ${stateName} {\n}\n\nconst initialState: ${stateName} = {\n};\n\nexport const ${classifiedName} = signalStore({ providedIn: 'root' }, withState(initialState));\n`,
	});
}

exports.store = store;
