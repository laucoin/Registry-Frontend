'use strict';

const { createFileRule } = require('../_lib/create-file-rule');

function model(options) {
	return createFileRule(options, {
		suffix: 'model',
		defaultPath: 'src/app/shared/models',
		render: (classifiedName) => `export interface ${classifiedName} {\n}\n`,
	});
}

exports.model = model;
