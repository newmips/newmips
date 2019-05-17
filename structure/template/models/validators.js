exports.getValidator = function(attrDef) {
	switch (attrDef.newmipsType) {
		case 'enum':
		case 'radio':
			return {isIn: {
				args: [attrDef.values],
				msg: "error.validation.radio"
			}}

		case 'number':
		case 'big number':
			return {isInt: {msg: "error.validation.number"}}

		case 'decimal':
		case 'euro':
		case 'float':
		case 'money':
			return {isFloat: {msg: "error.validation.float"}}

		case 'boolean':
			return {isIn: {
				args: [[true, false]],
				msg: "error.validation.boolean"
			}}

		case 'email':
			return {isEmail: {msg: "error.validation.email"}}

		case 'date':
		case 'datetime':
			return {isDate: {msg: "error.validation.date"}}

		case 'tel':
			return {
				isPhone: function(value) {
					if (!/^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/.test(value))
						throw "error.validation.tel";
				}
			}

		case 'color':
			return {
				isColor: function(value) {
					if (!/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value))
						throw "error.validation.color";
				}
			}

		case 'password':
			return {len: {
				args: [3, 32],
				msg: "error.validation.password"
			}}

		case 'url':
			return {isUrl: {msg: "error.validation.url"}};

		case 'text':
		case 'regular text':
		case 'time':
		case 'fax':
		case 'qrcode':
		case 'ean8':
		case 'code39':
		case 'picture':
			return undefined;
	}
}