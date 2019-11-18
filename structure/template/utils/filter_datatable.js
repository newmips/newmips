const models = require('../models/');
const entity_helper = require('./entity_helper');
const model_builder = require('./model_builder');

// Prototype:
//  - modelName: 'E_user'
//  - params: {columnsTypes:[], columns:[], search:{}} - body from datatables (req.body)
//  - speInclude - optional: ['r_inclusion.r_specific.id',] - array of field path used to build query's include
//  - speWhere - optional: {id: 1, property: 'value'}
module.exports = function (modelName, params, speInclude, speWhere) {
	return new Promise(function (resolve, reject) {
		const count = 0;
		const start = params.start ? parseInt(params.start) : 1;
		const length = params.length ? parseInt(params.length) : 10;

		const toInclude = speInclude || [];
		const isGlobalSearch = params.search.value == "" ? false : true;
		const search = {}, searchTerm = isGlobalSearch ? '$or' : '$and';
		search[searchTerm] = [];

		// Loop over columns array
		for (let i = 0, columns = params.columns; i < columns.length; i++) {
			if (columns[i].searchable == 'false')
				continue;

			// Push column's field into toInclude. toInclude will be used to build the sequelize include. Ex: toInclude = ['r_alias.r_other_alias.f_field', 'f_name']
			toInclude.push(columns[i].data);

			// Add column own search
			if (columns[i].search.value != "") {
				const {type, value} = JSON.parse(columns[i].search.value);
				search[searchTerm].push(model_builder.formatSearch(columns[i].data, value, type));
			}
			// Add column global search
			if (isGlobalSearch)
				search[searchTerm].push(model_builder.formatSearch(columns[i].data, params.search.value, params.columnsTypes[columns[i].data]));
		}

		// ORDER BY Managment
		let order, stringOrder = params.columns[params.order[0].column].data;
		// If ordering on an association field, use Sequelize.literal so it can match field path 'r_alias.f_name'
		order = stringOrder.indexOf('.') != -1 ? [[models.Sequelize.literal(stringOrder), params.order[0].dir]] : [[stringOrder, params.order[0].dir]];

		// Building final query object
		let queryObject;
		if (search[searchTerm].length == 0)
			queryObject = {where: {}, order: order};
		else
			queryObject = {where: search, order: order}

		if (length != -1) {
			queryObject.limit = length
			queryObject.offset = start
		}

		if (speWhere)
			for (const prop in speWhere)
				queryObject.where[prop] = speWhere[prop];

		// TODO: handle attributes
		// queryObject.attributes = attributes;

		// If postgres, then we have to parse all value to text, postgres cannot compare varchar with integer for example
		if(models.sequelize.options.dialect == "postgres" && typeof queryObject.where !== "undefined"){
			for(const item in queryObject.where[searchTerm]){
				const attribute = Object.keys(queryObject.where[searchTerm][item])[0]
				queryObject.where[searchTerm][item][attribute] = models.sequelize.where(
					models.sequelize.cast(models.sequelize.col(modelName+'.'+attribute), 'text'),
					queryObject.where[searchTerm][item][attribute])
			}
		}

		// Build include from field array
		// At the moment queryObject.include = [ 'id', 'r_user.f_nom', 'r_user.r_parent.f_email']
		// `model_builder.getIncludeFromFields()` transform this array into a squelize include object
		const entityName = `e_${modelName.substring(2)}`;
		queryObject.include = model_builder.getIncludeFromFields(models, entityName, toInclude);

		// Execute query with filters and get total count
		models[modelName].findAndCountAll(queryObject).then(function (result) {
			const data = {};
			data.recordsTotal = result.count;
			data.recordsFiltered = result.count;
			lightRows = [];
			for (let i = 0; i < result.rows.length; i++)
				lightRows.push(result.rows[i].get({plain: true}));
			data.data = lightRows;
			return resolve(data);
		}).catch(function (err) {
			reject(err);
		});
	});
}