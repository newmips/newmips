/* 
 * Update local Entity Data before show or any
 */

module.exports = {
    update_local_data: function (entity, attributes) {

        for (var key in entity.dataValues) {
            for (var attribute in attributes) {
                if (attributes[attribute].newmipsType === 'file'
                        && attribute == key) {
                    var value = entity.dataValues[key] || '';
                    var partOfValue = value.split('-');
                    if (partOfValue.length)
//                      partOfValue[0] ==> month
                        entity.dataValues[key] = entity.name.singular.toLowerCase() + '/' + partOfValue[0] + '/' + entity.dataValues[key];

                    break;
                }
            }
        }
        return entity;
    }
};

