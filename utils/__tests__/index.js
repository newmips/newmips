const expect = require('expect.js');
const lowerFirstWord = require('../attr_helper').lowerFirstWord;


it('Should lower the first word', () => {
  const expression = lowerFirstWord("AN expression");

  expect(expression).to.equal("an expression");
});