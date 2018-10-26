module.exports = {
    clearString: function (string) {
        // Remove space before and after
        string = string.trim();
        string = string.replace(/é/g, "e");
        string = string.replace(/è/g, "e");
        string = string.replace(/\ê/g, "e");
        string = string.replace(/\ë/g, "e");
        string = string.replace(/\È/g, "e");
        string = string.replace(/\É/g, "e");
        string = string.replace(/\Ê/g, "e");
        string = string.replace(/\Ë/g, "e");

        string = string.replace(/à/g, "a");
        string = string.replace(/â/g, "a");
        string = string.replace(/ä/g, "a");
        string = string.replace(/\À/g, "a");
        string = string.replace(/\Â/g, "a");
        string = string.replace(/\Ä/g, "a");

        string = string.replace(/ô/g, "o");
        string = string.replace(/ö/g, "o");

        string = string.replace(/î/g, "i");
        string = string.replace(/ï/g, "i");
        string = string.replace(/Î/g, "i");
        string = string.replace(/Ï/g, "i");

        string = string.replace(/û/g, "u");
        string = string.replace(/ù/g, "u");
        string = string.replace(/ü/g, "u");
        string = string.replace(/\Ù/g, "u");
        string = string.replace(/\Ü/g, "u");
        string = string.replace(/\Û/g, "u");

        string = string.replace(/ç/g, "c");
        string = string.replace(/ĉ/g, "c");
        string = string.replace(/\Ç/g, "c");
        string = string.replace(/\Ĉ/g, "c");

        string = string.replace(/'/g, "_");
        string = string.replace(/,/g, "_");
        string = string.replace(/ /g, "_");
        string = string.replace(/-/g, "_");
        string = string.replace(/\\/g, "_");
        string = string.replace(/!/g, "_");
        string = string.replace(/\(/g, "_");
        string = string.replace(/\)/g, "_");
        string = string.replace(/\//g, "_");
        string = string.replace(/\\/g, "_");
        string = string.replace(/\./g, "_");
        string = string.replace(/\;/g, "_");
        string = string.replace(/\?/g, "_");
        string = string.replace(/\"/g, "_");
        string = string.replace(/\&/g, "_");
        string = string.replace(/\*/g, "_");
        string = string.replace(/\$/g, "_");
        string = string.replace(/\%/g, "_");
        string = string.replace(/\£/g, "_");
        string = string.replace(/\€/g, "_");
        string = string.replace(/\µ/g, "_");
        string = string.replace(/\°/g, "_");
        string = string.replace(/\=/g, "_");
        string = string.replace(/\+/g, "_");
        string = string.replace(/\}/g, "_");
        string = string.replace(/\{/g, "_");
        string = string.replace(/\#/g, "_");
        string = string.replace(/\`/g, "_");
        string = string.replace(/\|/g, "_");
        string = string.replace(/\@/g, "_");
        string = string.replace(/\^/g, "_");
        string = string.replace(/\]/g, "_");
        string = string.replace(/\[/g, "_");
        string = string.replace(/\~/g, "_");
        string = string.replace(/\:/g, "_");
        string = string.replace(/\×/g, "_");
        string = string.replace(/\¿/g, "_");
        string = string.replace(/\¡/g, "_");
        string = string.replace(/\÷/g, "_");

        string = string.replace(String.fromCharCode(65533), "e");
        string = string.replace(/[^a-z0-9]/gi, '_').toLowerCase();

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
            case 'createNewEntity':
                return "E_" + string;
                break;
            case 'createNewDataField':
                return "F_" + string;
                break;
            case 'createNewComponentLocalFileStorage':
            case 'createNewComponentContactForm':
                return "C_" + string;
                break;
            case 'createNewComponentStatus':
                return 's_'+string;
                break;
            default:
                return "U_" + string;
        }
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