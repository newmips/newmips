module.exports = {
    clearString: function (string) {
        string = string.replace(new RegExp("é", 'g'), "e");
        string = string.replace(new RegExp("è", 'g'), "e");
        string = string.replace(new RegExp("à", 'g'), "a");
        string = string.replace(new RegExp("ù", 'g'), "u");
        string = string.replace(new RegExp("ç", 'g'), "c");
        string = string.replace(new RegExp("'", 'g'), "_");
        string = string.replace(new RegExp(",", 'g'), "_");
        return string;
    },
    lowerFirstWord: function (instruction) {
        var instructions = instruction.split(' ');
        instructions[0] = instructions[0].toLowerCase();
        return instructions.join(' ');
    },
    addPrefix: function (string, instructionFunction) {
        switch (instructionFunction) {
            case 'createNewProject':
                return "P_" + string;
                break;
            case 'createNewApplication':
                return "A_" + string;
                break;
            case 'createNewModule':
                return "M_" + string;
                break;
            case 'createNewDataEntity':
                return "E_" + string;
                break;
            case 'createNewDataField':
                return "F_" + string;
                break;
            case 'createNewComponentLocalFileStorage':
            case 'createNewComponentContactForm':
                return "C_" + string;
                break;
        }

        return "U_" + string;
    },
    removePrefix: function (string, type) {
        var stringLower = string.toLowerCase();
        switch (type) {
            case 'project':
                if (stringLower.substring(0, 2) == "p_")
                    return string.substring(2);
                break;
            case 'application':
                if (stringLower.substring(0, 2) == "a_")
                    return string.substring(2);
                break;
            case 'module':
                if (stringLower.substring(0, 2) == "m_")
                    return string.substring(2);
                break;
            case 'entity':
                if (stringLower.substring(0, 2) == "e_")
                    return string.substring(2);
                break;
            case 'field':
                if (stringLower.substring(0, 2) == "f_")
                    return string.substring(2);
                break;
            case 'component':
                if (stringLower.substring(0, 2) == "c_")
                    return string.substring(2);
                break;
            case 'entityOrComponent':
                if (stringLower.substring(0, 2) == "e_" || stringLower.substring(0, 2) == "c_")
                    return string.substring(2);
                break;
        }

        return string;
    }
}