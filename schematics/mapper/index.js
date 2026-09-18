'use strict';

const { createFileRule } = require('../_lib/create-file-rule');

function mapper(options) {
	return createFileRule(options, {
		suffix: 'mapper',
		defaultPath: 'src/app/shared/mappers',
		render: (classifiedName) => `export class ${classifiedName} {\n}\n`,
	});
}

exports.mapper = mapper;
