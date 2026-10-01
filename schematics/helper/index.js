'use strict';

const { createFileRule } = require('../_lib/create-file-rule');

function helper(options) {
	return createFileRule(options, {
		suffix: 'helper',
		defaultPath: 'src/app/shared/helpers',
		render: (classifiedName) => `export class ${classifiedName} {\n}\n`,
	});
}

exports.helper = helper;
