function clearString(string){
    string = string.replace(new RegExp(/é/, 'g'), "e");
    string = string.replace(new RegExp(/è/, 'g'), "e");
    string = string.replace(new RegExp(/à/, 'g'), "a");
    string = string.replace(new RegExp(/ô/, 'g'), "o");
    string = string.replace(new RegExp(/û/, 'g'), "u");
    string = string.replace(new RegExp(/ù/, 'g'), "u");
    string = string.replace(new RegExp(/ç/, 'g'), "c");
    string = string.replace(new RegExp(/â/, 'g'), "a");
    string = string.replace(new RegExp(/'/, 'g'), "_");
    string = string.replace(new RegExp(/,/, 'g'), "_");
    string = string.replace(new RegExp(/ /, 'g'), "_");
    string = string.replace(new RegExp(/-/, 'g'), "_");
    string = string.replace(new RegExp(/\\/, 'g'), "_");
    string = string.replace(new RegExp(/!/, 'g'), "_");
    string = string.replace(new RegExp(/\(/, 'g'), "_");
    string = string.replace(new RegExp(/\)/, 'g'), "_");
    string = string.replace(new RegExp(/\//, 'g'), "_");
    string = string.replace(new RegExp(/\\/, 'g'), "_");
    string = string.replace(new RegExp(/\./, 'g'), "_");
    string = string.replace(new RegExp(/\;/, 'g'), "_");
    string = string.replace(new RegExp(/\?/, 'g'), "_");
    return string;
}

function lowerFirstWord(instruction){
    var instructions = instruction.split(' ');
    instructions[0] = instructions[0].toLowerCase();
    return instructions.join(' ');
}

function addPrefix(string, instructionFunction){
    switch(instructionFunction){
        case 'createNewProject':
        case 'deleteProject':
            return "p_"+string;
            break;
        case 'createNewApplication':
        case 'deleteApplication':
            return "a_"+string;
            break;
        case 'createNewModule':
        case 'deleteModule':
            return "m_"+string;
            break;
        case 'createNewDataEntity':
        case 'deleteDataEntity':
        case 'createNewHasOne':
        case 'createNewHasMany':
        case 'createNewFieldset':
        case 'createNewFieldRelatedTo':
            return "e_"+string;
            break;
        case 'createNewDataField':
        case 'deleteDataField':
        case 'deleteTab':
        case 'foreignKey':
        case 'using':
        case 'setRequiredAttribute':
        case 'setColumnVisibility':
            return "f_"+string;
            break;
        case 'alias':
            /* R for Relation */
            return "r_"+string;
            break;
        case 'createNewComponentLocalFileStorage':
        case 'createNewComponentContactForm':
            return "c_"+string;
            break;
    }

    return "u_"+string;
}

function removePrefix(string, type){
    var stringLower = string.toLowerCase();
    switch(type){
        case 'project':
            if(stringLower.substring(0,2) == "p_")
                return string.substring(2);
            break;
        case 'application':
            if(stringLower.substring(0,2) == "a_")
                return string.substring(2);
            break;
        case 'module':
            if(stringLower.substring(0,2) == "m_")
                return string.substring(2);
            break;
        case 'entity':
            if(stringLower.substring(0,2) == "e_")
                return string.substring(2);
            break;
        case 'field':
            if(stringLower.substring(0,2) == "f_")
                return string.substring(2);
            break;
        case 'component':
            if(stringLower.substring(0,2) == "c_")
                return string.substring(2);
            break;
    }

    return string;
}

module.exports = {
    clearString: clearString,
    lowerFirstWord: lowerFirstWord,
    addPrefix: addPrefix,
    removePrefix: removePrefix,
    reworkAttr: function(attr){
        console.log("FUNCTION   ------>   "+attr.function);
        if(typeof attr.options !== "undefined"){
            /* If the instruction create something there is inevitably a value. We have to clean this value for the code */
            if(typeof attr.options.value !== "undefined" && attr.options.processValue){

                /* Keep the value for the trad file */
                attr.options.showValue = attr.options.value;
                /* Clean the name of the value */
                attr.options.value = clearString(attr.options.value);
                /* Value that will be used in url */
                attr.options.urlValue = attr.options.value.toLowerCase();
                /* Create a prefix depending the type of the created value (project, app, module, entity, field) */
                attr.options.value = addPrefix(attr.options.value, attr.function);
                /* Always lower the code value */
                attr.options.value = attr.options.value.toLowerCase();

                console.log("SHOW VALUE   ------>   "+attr.options.showValue);
                console.log("CODE VALUE   ------>   "+attr.options.value);
                console.log("URL VALUE   ------>   "+attr.options.urlValue);
            }
            /* In case of instruction about Association / Relation there is a target instead of a value */
            else if(typeof attr.options.target !== "undefined" && attr.options.processValue){

                attr.options.showTarget = attr.options.target;
                attr.options.target = clearString(attr.options.target);
                attr.options.urlTarget = attr.options.target.toLowerCase();
                attr.options.target = addPrefix(attr.options.target, attr.function);
                attr.options.target = attr.options.target.toLowerCase();

                console.log("SHOW TARGET   ------>   "+attr.options.showTarget);
                console.log("CODE TARGET   ------>   "+attr.options.target);
                console.log("URL TARGET   ------>   "+attr.options.urlTarget);

                if(typeof attr.options.source !== "undefined"){
                    attr.options.showSource = attr.options.source;
                    attr.options.source = clearString(attr.options.source);
                    attr.options.urlSource = attr.options.source;
                    attr.options.source = addPrefix(attr.options.source, attr.function);
                    attr.options.source = attr.options.source.toLowerCase();

                    console.log("SHOW SOURCE   ------>   "+attr.options.showSource);
                    console.log("CODE SOURCE   ------>   "+attr.options.source);
                    console.log("URL SOURCE   ------>   "+attr.options.urlSource);
                }

                if(typeof attr.options.foreignKey !== "undefined"){
                    attr.options.showForeignKey = attr.options.foreignKey;
                    attr.options.foreignKey = clearString(attr.options.foreignKey);
                    attr.options.foreignKey = addPrefix(attr.options.foreignKey, "foreignKey");
                    attr.options.foreignKey = attr.options.foreignKey.toLowerCase();

                    console.log("SHOW FOREIGNKEY   ------>   "+attr.options.showForeignKey);
                    console.log("CODE FOREIGNKEY   ------>   "+attr.options.foreignKey);
                }

                if(typeof attr.options.as !== "undefined"){
                    attr.options.showAs = attr.options.as;
                    attr.options.as = clearString(attr.options.as);
                    attr.options.urlAs = attr.options.as;
                    attr.options.as = addPrefix(attr.options.as, "alias");
                    attr.options.as = attr.options.as.toLowerCase();

                    console.log("SHOW AS   ------>   "+attr.options.showAs);
                    console.log("CODE AS   ------>   "+attr.options.as);
                    console.log("URL AS   ------>   "+attr.options.urlAs);
                }

                if(typeof attr.options.usingField !== "undefined"){
                    attr.options.showUsingField = attr.options.usingField;
                    attr.options.usingField = clearString(attr.options.usingField);
                    attr.options.usingField = addPrefix(attr.options.usingField, "using");
                    attr.options.usingField = attr.options.usingField.toLowerCase();

                    console.log("SHOW USINGFIELD   ------>   "+attr.options.showUsingField);
                    console.log("CODE USINGFIELD   ------>   "+attr.options.usingField);
                }
            }
        }
        return attr;
    }
}