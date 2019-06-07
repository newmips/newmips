const expect = require('chai').expect;

const {
  capitalizeFirstLetter,
  findInclude
} = require('../entity_helper.js');


describe('structure template entity_helper', () => {
  it('Should capitalyse the first letter of a word', () => {
    const word = "a_word";

    expect(capitalizeFirstLetter(word)).to.eql("A_word");
  });

  const includes = [{
    "target": "e_type_balle",
    "relation": "belongsTo",
    "foreignKey": "fk_id_type_balle_type_de_balle",
    "as": "r_type_de_balle",
    "showAs": "Type de balle",
    "structureType": "relatedTo",
    "usingField": [{
      "value": "f_libelle",
      "type": "string"
    }]
  }]

  const foundInclude = {
    "target": "e_type_balle",
    "relation": "belongsTo",
    "foreignKey": "fk_id_type_balle_type_de_balle",
    "as": "r_type_de_balle",
    "showAs": "Type de balle",
    "structureType": "relatedTo",
    "usingField": [{
      "value": "f_libelle",
      "type": "string"
    }]
  };

  it('Should find the object r_type_de_balle in includes', () => {
    const found = findInclude(includes, "as", "r_type_de_balle");
    expect(found).to.eql(foundInclude);
  });
});
