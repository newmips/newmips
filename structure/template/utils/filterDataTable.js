var models = require('../models/');
var entity_helper = require('./entity_helper');

module.exports = function(modelName, params, speInclude, speWhere) {
    return new Promise(function(resolve, reject) {
        var start = 1,
            length = 10,
            count = 0;

        if (typeof params.start !== 'undefined')
            start = params.start;
        if (typeof params.length !== 'undefined')
            length = params.length;

        start = parseInt(start);
        length = parseInt(length);

        // Building where values -> {$or: [{id: 'id'}, {name: {$like: '%jero%'}}]};
        var search = {
            $or: []
        };
        for (var i = 0; i < params.columns.length; i++) {
            var column = params.columns[i];
            var descriptor;
            if (column.search.value != '') {
                descriptor = JSON.parse(column.search.value);
                column.search.value = descriptor.value;
            }
            var orRow = {};
            if (column.searchable == 'true') {
                // Column search
                if (column.search.value != '') {
                    if (descriptor && descriptor.type == 'datetime') {
                        if (column.search.value.indexOf(' ') != -1)
                            orRow[column.data] = {
                                $between: [column.search.value, column.search.value]
                            };
                        else
                            orRow[column.data] = {
                                $between: [column.search.value + ' 00:00:00', column.search.value + ' 23:59:59']
                            };
                    } else if (descriptor && descriptor.type == 'date') {
                        orRow[column.data] = {
                            $between: [column.search.value + ' 00:00:00', column.search.value + ' 23:59:59']
                        };
                    } else if (column.data.split('.').length > 1) {
                        //if we have to search in relation data
                        updateInclude(column);
                    } else if (descriptor && descriptor.type == 'boolean') {
                        orRow[column.data] = column.search.value;
                    } else if (descriptor && descriptor.type == 'currency') {
                        orRow[column.data] = models.Sequelize.where(models.Sequelize.col(column.data), {
                            like: `${column.search.value}%`
                        });
                    } else {
                        orRow[column.data] = {
                            $like: '%' + column.search.value + '%'
                        };
                    }
                    if (Object.keys(orRow).length)
                        search.$or.push(orRow);
                }
                // Global search
                if (params.search.value != '') {
                    var data = column.data;
                    var partsOfData = data.split('.');
                    if (partsOfData.length === 1) {
                        orRow[column.data] = {
                            $like: '%' + params.search.value + '%'
                        };
                        search.$or.push(orRow);
                    } else
                        updateInclude(column);
                }
            }
        }

        function updateInclude(column) {
            var partOfColumn = column.data.split('.');
            //partOfColumn[0] is a first relation include to find
            var include = entity_helper.find_include(speInclude, 'as', partOfColumn[0]);
            for (var j = 1; j < partOfColumn.length - 1; j++) {
                if (include.include) {
                    //choose the good next include if many
                    var relation = partOfColumn[j];
                    var include = entity_helper.find_include(include.include, 'as', relation);
                    //update true objet
                    include.required = true;
                }
            }
            //now set where option on field
            //the last value of partOfColumn is the field value
            var field = partOfColumn[partOfColumn.length - 1];
            //set required for innerJoin
            include.required = true;
            include.where = {};
            include.where[field] = {
                $like: '%' + column.search.value + '%'
            };
        }

        // Defining order by
        // IMPORTANT --> include[{all: true}] will crash the application, you have to define precisely all the inclusion
        // TODO -> Gerer l'erreur avec le include all

        /* Return the include that has the as */
        function searchInInclude(include, searchAs) {
            for (var x = 0; x < include.length; x++) {
                if (searchAs == include[x].as) {
                    return include[x];
                } else if (typeof include[x].include !== "undefined") {
                    return searchInInclude(include[x].include, searchAs);
                }
            }
        }

        /* ORDER BY Managment on inclusion column */
        var order;
        var stringOrder = params.columns[params.order[0].column].data;
        var arrayOrder = stringOrder.split(".");

        /* If there are inclusions, seperate with dot */
        if (arrayOrder.length > 1) {
            order = [];
            var orderContent = [];
            for (var j = 0; j < arrayOrder.length; j++) {
                if (j < arrayOrder.length - 1) {
                    var modelInclude = searchInInclude(speInclude, arrayOrder[j]);
                    /* Apparently modelInclude.model is an OBJECT !! So use modelInclude.model.name to get the name */
                    orderContent.push({
                        model: models[modelInclude.model.name],
                        as: arrayOrder[j]
                    });
                } else {
                    /* Add the field and the order */
                    orderContent.push(arrayOrder[j]);
                    orderContent.push(params.order[0].dir);
                }
            }
            /* Create the new order for the Sequelize request */
            order.push(orderContent);
        } else {
            // Defining a simple order by
            order = params.columns[params.order[0].column].data + ' ' + params.order[0].dir;
        }

        // Building final query object
        var where = speWhere;
        if (search.$or.length == 0)
            where = {
                order: order,
                limit: length,
                offset: start
            };
        else
            where = {
                where: search,
                order: order,
                limit: length,
                offset: start
            };
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
        });
    });
}