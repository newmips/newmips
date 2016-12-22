var models = require('../models/');

module.exports = function(modelName, params, speInclude, speWhere) {
	return new Promise(function(resolve, reject) {
		var start = 1, length = 10, count = 0;

        if (typeof params.start !== 'undefined')    start = params.start;
        if (typeof params.length !== 'undefined')    length = params.length;
        start = parseInt(start); length = parseInt(length);

		// Building where values -> {$or: [{id: 'id'}, {name: {$like: '%jero%'}}]};
		var search = {$or: []};
		for (var i = 0; i < params.columns.length; i++){
			var column = params.columns[i];
			var orRow = {};
			if (column.searchable == 'true') {
				// Column search
				if (column.search.value != '') {
					orRow[column.data] = {$like: '%'+column.search.value+'%'};
					search.$or.push(orRow);
				}
				// Global search
				if (params.search.value != '') {
					orRow[column.data] = {$like: '%'+params.search.value+'%'};
					search.$or.push(orRow);
				}
			}
		}

        // Defining order by
        order = params.columns[params.order[0].column].data + ' ' + params.order[0].dir;

		// Building final query object
		var where = speWhere;
		if (search.$or.length == 0)
			where = {order: order, limit: length, offset: start};
		else
			where = {where: search, order: order, limit: length, offset: start};
		if (speInclude)
			where.include = speInclude;
		if (speWhere) {
			if (!where.where)
				where.where = speWhere;
			else
				for (var prop in speWhere)
					where.where[prop] = speWhere[prop];
		}
		if (speInclude)
			where.distinct = true;

        // Execute query with filters and get total count
        models[modelName].findAndCountAll(where).then(function(result) {
            var data = {};
            data.recordsTotal = result.count;
            data.recordsFiltered = result.count;
            data.data = result.rows;
            return resolve(data);
        }).catch(function(err) {
            console.log(err);
            reject(err);
        })
    });
}