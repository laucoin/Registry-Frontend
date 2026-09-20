'use strict';

const { createFileRule } = require('../_lib/create-file-rule');

function service(options) {
	return createFileRule(options, {
		suffix: 'service',
		defaultPath: 'src/app/shared/services',
		render: (classifiedName) =>
			`import { Injectable } from '@angular/core';\n\n@Injectable({ providedIn: 'root' })\nexport class ${classifiedName} {\n}\n`,
	});
}

exports.service = service;
