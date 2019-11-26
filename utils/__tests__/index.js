const expect = require('chai').expect;
const lowerFirstWord = require('../attr_helper').lowerFirstWord;

describe('entity_helper', () => {
  it('Should lower the first word', () => {
    const expression = lowerFirstWord("AN expression");

    expect(expression).to.eql("an expression");
  });
});