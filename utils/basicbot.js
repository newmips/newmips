module.exports = {
    clearString: function(string){
        string = string.replace(new RegExp("é", 'g'), "e");
        string = string.replace(new RegExp("è", 'g'), "e");
        string = string.replace(new RegExp("à", 'g'), "a");
        string = string.replace(new RegExp("ù", 'g'), "u");
        string = string.replace(new RegExp("ç", 'g'), "c");
        return string;
    },
    lowerFirstWord: function(instruction){
        var instructions = instruction.split(' ');
        instructions[0] = instructions[0].toLowerCase();
        return instructions.join(' ');
    }
}