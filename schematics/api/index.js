'use strict';

const { createFileRule } = require('../_lib/create-file-rule');

function api(options) {
	return createFileRule(options, {
		suffix: 'api',
		defaultPath: 'src/app/shared/api',
		render: (classifiedName) =>
			`import { Injectable } from '@angular/core';\n\n@Injectable({ providedIn: 'root' })\nexport class ${classifiedName} {\n}\n`,
	});
}

exports.api = api;
