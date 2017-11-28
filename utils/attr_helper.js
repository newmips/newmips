
function validateString(string) {
    return /^(?![0-9]+$)(?!.*-$)(?!.+-{2,}.+)(?!-)[a-zA-Z0-9-]{1,25}$/g.test(string);
}

function clearString(string){

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

    // €
    string = string.replace(String.fromCharCode(65533), "e");
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
        case 'createNewEntity':
        case 'deleteDataEntity':
        case 'createNewHasOne':
        case 'createNewHasMany':
        case 'createNewFieldRelatedToMultiple':
        case 'createNewHasManyPreset':
        case 'createNewFieldRelatedTo':
        case 'createNewComponentContactForm':
            return "e_"+string;
            break;
        case 'createNewDataField':
        case 'deleteDataField':
        case 'deleteTab':
        case 'using':
        case 'setFieldAttribute':
        case 'setColumnVisibility':
            return "f_"+string;
            break;
        case 'foreignKey':
            return "fk_"+string;
            break;
        case 'alias':
            /* R for Relation */
            return "r_"+string;
            break;
        case 'createNewComponentLocalFileStorage':
        case 'createNewComponentAgenda':
        case 'createNewComponentCra':
        case 'createNewComponentPrint':
        case 'deleteComponentPrint':
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
        case 'relation':
            if(stringLower.substring(0,2) == "r_")
                return string.substring(2);
            break;
    }

    return string;
}

module.exports = {
    clearString: clearString,
    validateString: validateString,
    lowerFirstWord: lowerFirstWord,
    addPrefix: addPrefix,
    removePrefix: removePrefix,
    reworkAttr: function(attr){
        //console.log("FUNCTION   ------>   "+attr.function);
        if(typeof attr.options !== "undefined"){
            /* If the instruction create something there is inevitably a value. We have to clean this value for the code */
            if(typeof attr.options.value !== "undefined" && attr.options.processValue){

                /* Keep the value for the trad file */
                attr.options.showValue = attr.options.value;
                /* Clean the name of the value */
                attr.options.value = clearString(attr.options.value);

                if (attr.function == 'createNewApplication') {
                    attr.options.value = attr.options.value.replace(/_/g, "-");
                    if (!validateString(attr.options.value)){
                        var errorText = "Le nom d'application doit respecter les règles suivantes :<br>";
                        errorText += "<ul>";
                        errorText += "<li>- Caractères alphanumériques uniquement.</li>";
                        errorText += "<li>- Au moins une lettre.</li>";
                        errorText += "<li>- Un espace maximum entre chaque mot.</li>";
                        errorText += "<li>- Aucun espace en début ou fin.</li>";
                        errorText += "<li>- 25 caractères maximum.</li>";
                        errorText += "<li>- Pas de tiret (-) en début ou fin, ni deux ou plus à la suite(--).</li>";
                        errorText += "</ul>";

                        // Generate an error to throw in controller.
                        attr.error = errorText;
                    }
                }

                /* Value that will be used in url */
                attr.options.urlValue = attr.options.value.toLowerCase();
                /* Create a prefix depending the type of the created value (project, app, module, entity, field) */
                attr.options.value = addPrefix(attr.options.value, attr.function);
                /* Always lower the code value */
                attr.options.value = attr.options.value.toLowerCase();

                //console.log("SHOW VALUE   ------>   "+attr.options.showValue);
                //console.log("CODE VALUE   ------>   "+attr.options.value);
                //console.log("URL VALUE   ------>   "+attr.options.urlValue);
            }
            /* In case of instruction about Association / Relation there is a target instead of a value */
            else if(typeof attr.options.target !== "undefined" && attr.options.processValue){

                attr.options.showTarget = attr.options.target;
                attr.options.target = clearString(attr.options.target);
                attr.options.urlTarget = attr.options.target.toLowerCase();
                attr.options.target = addPrefix(attr.options.target, attr.function);
                attr.options.target = attr.options.target.toLowerCase();

                //console.log("SHOW TARGET   ------>   "+attr.options.showTarget);
                //console.log("CODE TARGET   ------>   "+attr.options.target);
                //console.log("URL TARGET   ------>   "+attr.options.urlTarget);

                if(typeof attr.options.source !== "undefined"){
                    attr.options.showSource = attr.options.source;
                    attr.options.source = clearString(attr.options.source);
                    attr.options.urlSource = attr.options.source.toLowerCase();
                    attr.options.source = addPrefix(attr.options.source, attr.function);
                    attr.options.source = attr.options.source.toLowerCase();

                    //console.log("SHOW SOURCE   ------>   "+attr.options.showSource);
                    //console.log("CODE SOURCE   ------>   "+attr.options.source);
                    //console.log("URL SOURCE   ------>   "+attr.options.urlSource);
                }

                if(typeof attr.options.foreignKey !== "undefined"){
                    attr.options.showForeignKey = attr.options.foreignKey;
                    attr.options.foreignKey = clearString(attr.options.foreignKey);
                    attr.options.foreignKey = addPrefix(attr.options.foreignKey, "foreignKey");
                    attr.options.foreignKey = attr.options.foreignKey.toLowerCase();

                    //console.log("SHOW FOREIGNKEY   ------>   "+attr.options.showForeignKey);
                    //console.log("CODE FOREIGNKEY   ------>   "+attr.options.foreignKey);
                }

                if(typeof attr.options.as !== "undefined"){
                    attr.options.showAs = attr.options.as;
                    attr.options.as = clearString(attr.options.as);
                    attr.options.urlAs = attr.options.as.toLowerCase();
                    attr.options.as = addPrefix(attr.options.as, "alias");
                    attr.options.as = attr.options.as.toLowerCase();

                    //console.log("SHOW AS   ------>   "+attr.options.showAs);
                    //console.log("CODE AS   ------>   "+attr.options.as);
                    //console.log("URL AS   ------>   "+attr.options.urlAs);
                }

                if(typeof attr.options.usingField !== "undefined"){
                    var usingFields = attr.options.usingField.split(",");
                    attr.options.showUsingField = attr.options.usingField.split(",");
                    for (var j = 0; j < usingFields.length; j++) {
                        usingFields[j] = usingFields[j].trim();
                        usingFields[j] = clearString(usingFields[j]);
                        usingFields[j] = addPrefix(usingFields[j], "using");
                        usingFields[j] = usingFields[j].toLowerCase();
                    }
                    attr.options.usingField = usingFields;
                }
            }
        }
        return attr;
    }
}