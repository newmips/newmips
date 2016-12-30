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
        // IMPORTANT --> include[{all: true}] will crash the application, you have to define precisely all the inclusion
        // TODO -> Gerer l'erreur avec le include all

        /* Return the include that has the as */
		function searchInInclude(include, searchAs){
			for(var x=0; x<include.length; x++){
				if(searchAs == include[x].as){
					return include[x];
				}
				else if(typeof include[x].include !== "undefined"){
					return searchInInclude(include[x].include, searchAs);
				}
			}
		}

		/* ORDER BY Managment on inclusion column */
		var order;
		var stringOrder = params.columns[params.order[0].column].data;
		var arrayOrder = stringOrder.split(".");

		/* If there are inclusions, seperate with dot */
		if(arrayOrder.length > 1){
			order = [];
			var orderContent = [];
			for(var j=0; j<arrayOrder.length; j++){
				if(j < arrayOrder.length - 1){
					var modelInclude = searchInInclude(speInclude, arrayOrder[j]);
					/* Apparently modelInclude.model is an OBJECT !! So use modelInclude.model.name to get the name */
					orderContent.push({model: models[modelInclude.model.name], as: arrayOrder[j]});
				}
				else{
					/* Add the field and the order */
					orderContent.push(arrayOrder[j]);
					orderContent.push(params.order[0].dir);
				}
			}
			/* Create the new order for the Sequelize request */
			order.push(orderContent);
		}
		else{
			// Defining a simple order by
			order = params.columns[params.order[0].column].data+' '+params.order[0].dir;
		}

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