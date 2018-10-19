var models = require('../models/');
var entity_helper = require('./entity_helper');

module.exports = function (modelName, params, speInclude, speWhere) {

    // speWhere param example: [{field: value}]
    return new Promise(function (resolve, reject) {
        var start = 1,
                length = 10,
                count = 0;

        if (typeof params.start !== 'undefined')
            start = params.start;
        if (typeof params.length !== 'undefined')
            length = params.length;

        start = parseInt(start);
        length = parseInt(length);

        var searchType = "$or";
        var isGlobalSearch = true;
        if (params.search.value == ""){
            searchType = "$and";
            isGlobalSearch = false;
        }

        // Building where values -> {$and: [{id: 'id'}, {name: {$like: '%jero%'}}]};
        var search = {};
        search[searchType] = [];
        var attributes = ['id'];

        for (var i = 0; i < params.columns.length; i++) {
            var column = params.columns[i];
            var descriptor;
            if (column.search.value != '') {
                descriptor = JSON.parse(column.search.value);
                column.search.value = descriptor.value;
            }
            var orRow = {};
            if (column.searchable == 'true') {
                // Build attributes array to query only necessary ones
                if (column.data.indexOf('.') == -1)
                    attributes.push(column.data);
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
                        search[searchType].push(orRow);
                }
                // Global search
                if (params.search.value != '') {
                    var data = column.data;
                    var partsOfData = data.split('.');
                    if (partsOfData.length === 1) {
                        orRow[column.data] = {
                            $like: '%' + params.search.value + '%'
                        };
                        search[searchType].push(orRow);
                    } else{
                        column.search.value = params.search.value;
                        updateInclude(column);
                    }
                }
            }
        }

        function updateInclude(column) {
            var partOfColumn = column.data.split('.');
            // partOfColumn[0] is a first relation include to find
            var include = entity_helper.find_include(speInclude, 'as', partOfColumn[0]);
            for (var j = 1; j < partOfColumn.length - 1; j++) {
                if (include.include) {
                    // Choose the good next include if many
                    var relation = partOfColumn[j];
                    var include = entity_helper.find_include(include.include, 'as', relation);
                    // Update true objet
                    // No required in include for a global search
                    if(isGlobalSearch)
                        include.required = false;
                    else
                        include.required = true;
                }
            }
            // Now set where option on field
            // The last value of partOfColumn is the field value
            var field = partOfColumn[partOfColumn.length - 1];
            // Set required for innerJoin
            if(isGlobalSearch){
                // No required in include for a global search
                include.required = false;
                // The where condition in global search need to be in the first where
                // With $$ you can add condition on include attribute
                orRow['$'+include.as+'.'+field+'$'] = {
                    $like: '%' + params.search.value + '%'
                };
                search[searchType].push(orRow);
            } else {
                include.required = true;
                if (!include.where)
                    include.where = {};

                include.where[field] = {
                    $like: '%' + column.search.value + '%'
                };
            }
        }

        // Defining order by
        // IMPORTANT --> include[{all: true}] will crash the application, you have to define precisely all the inclusion
        // TODO -> Gerer l'erreur avec le include all

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
                    var modelInclude = entity_helper.searchInInclude(speInclude, arrayOrder[j]);
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
            order = [[params.columns[params.order[0].column].data, params.order[0].dir]];
        }

        // Building final query object
        var queryObject = speWhere;
        if (search[searchType].length == 0)
            queryObject = {order: order};
        else
            queryObject = {
                where: search,
                order: order
            };
        if (length != -1) {
            queryObject.limit = length
            queryObject.offset = start
        }

        if (speInclude)
            queryObject.include = speInclude;
        if (speWhere) {
            if (!queryObject.where)
                queryObject.where = speWhere;
            else
                for (var prop in speWhere)
                    queryObject.where[prop] = speWhere[prop];
        }
        if (speInclude)
            queryObject.distinct = true;

        queryObject.attributes = attributes;

        // If postgres, then we have to parse all value to text, postgres cannot compare varchar with integer for example
        if(models.sequelize.options.dialect == "postgres" && typeof queryObject.where !== "undefined"){
            for(var item in queryObject.where[searchType]){
                var attribute = Object.keys(queryObject.where[searchType][item])[0]
                queryObject.where[searchType][item][attribute] = models.sequelize.where(
                    models.sequelize.cast(models.sequelize.col(modelName+'.'+attribute), 'text'),
                    queryObject.where[searchType][item][attribute])
            }
        }

        // Execute query with filters and get total count
        models[modelName].findAndCountAll(queryObject).then(function (result) {
            var data = {};
            data.recordsTotal = result.count;
            data.recordsFiltered = result.count;
            lightRows = [];
            for (var i = 0; i < result.rows.length; i++)
                lightRows.push(result.rows[i].get({plain: true}));
            data.data = lightRows;
            return resolve(data);
        }).catch(function (err) {
            reject(err);
        });
    });
}