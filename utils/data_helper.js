function validateString(string) {
	return /^(?![0-9]+$)(?!.*-$)(?!.+-{2,}.+)(?!-)[a-zA-Z0-9- ]{1,25}$/g.test(string);
}

function clearString(string){

	// Remove space before and after
	string = string.trim();
	// Remove multipe spaces
	string = string.replace(/\s\s+/g, ' ');
	string = string.replace(/é/g, "e");
	string = string.replace(/è/g, "e");
	string = string.replace(/ê/g, "e");
	string = string.replace(/ë/g, "e");
	string = string.replace(/È/g, "e");
	string = string.replace(/É/g, "e");
	string = string.replace(/Ê/g, "e");
	string = string.replace(/Ë/g, "e");

	string = string.replace(/à/g, "a");
	string = string.replace(/â/g, "a");
	string = string.replace(/ä/g, "a");
	string = string.replace(/À/g, "a");
	string = string.replace(/Â/g, "a");
	string = string.replace(/Ä/g, "a");

	string = string.replace(/ô/g, "o");
	string = string.replace(/ö/g, "o");

	string = string.replace(/î/g, "i");
	string = string.replace(/ï/g, "i");
	string = string.replace(/Î/g, "i");
	string = string.replace(/Ï/g, "i");

	string = string.replace(/û/g, "u");
	string = string.replace(/ù/g, "u");
	string = string.replace(/ü/g, "u");
	string = string.replace(/Ù/g, "u");
	string = string.replace(/Ü/g, "u");
	string = string.replace(/Û/g, "u");

	string = string.replace(/ç/g, "c");
	string = string.replace(/ĉ/g, "c");
	string = string.replace(/Ç/g, "c");
	string = string.replace(/Ĉ/g, "c");

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
	string = string.replace(/;/g, "_");
	string = string.replace(/\?/g, "_");
	string = string.replace(/"/g, "_");
	string = string.replace(/&/g, "_");
	string = string.replace(/\*/g, "_");
	string = string.replace(/\$/g, "_");
	string = string.replace(/%/g, "_");
	string = string.replace(/£/g, "_");
	string = string.replace(/€/g, "_");
	string = string.replace(/µ/g, "_");
	string = string.replace(/°/g, "_");
	string = string.replace(/=/g, "_");
	string = string.replace(/\+/g, "_");
	string = string.replace(/\}/g, "_");
	string = string.replace(/\{/g, "_");
	string = string.replace(/#/g, "_");
	string = string.replace(/`/g, "_");
	string = string.replace(/\|/g, "_");
	string = string.replace(/@/g, "_");
	string = string.replace(/\^/g, "_");
	string = string.replace(/\]/g, "_");
	string = string.replace(/\[/g, "_");
	string = string.replace(/~/g, "_");
	string = string.replace(/:/g, "_");
	string = string.replace(/×/g, "_");
	string = string.replace(/¿/g, "_");
	string = string.replace(/¡/g, "_");
	string = string.replace(/÷/g, "_");

	string = string.replace(String.fromCharCode(65533), "e");
	string = string.replace(/[^a-z0-9]/gi, '_').toLowerCase();

	return string;
}

function prepareInstruction(instruction) {
	// Lower the first instruction word for the bot parser
	instruction = instruction.split(' ');
	instruction[0] = instruction[0].toLowerCase();
	instruction = instruction.join(' ');

	// Trim and remove double spaces or more inside the intruction
	instruction = instruction.trim();
	instruction = instruction.replace(/[ \t]{2,}/g, ' ');

	return instruction;
}

function addPrefix(string, instructionFunction) {
	switch (instructionFunction) {
		case 'createNewApplication':
		case 'deleteApplication':
		case 'selectApplication':
			return "a_" + string;
		case 'createNewModule':
		case 'deleteModule':
		case 'selectModule':
			return "m_" + string;
		case 'createNewEntity':
		case 'selectEntity':
		case 'deleteEntity':
		case 'createNewHasOne':
		case 'createNewHasMany':
		case 'createNewFieldRelatedToMultiple':
		case 'createNewHasManyPreset':
		case 'createNewFieldRelatedTo':
		case 'createNewComponentContactForm':
		case 'deleteComponentContactForm':
		case 'addComponentFileStorage':
		case 'setIcon':
			return "e_" + string;
		case 'createNewField':
		case 'deleteField':
		case 'deleteTab':
		case 'using':
		case 'setFieldAttribute':
		case 'setFieldKnownAttribute':
		case 'setColumnVisibility':
		case 'createWidgetPiechart':
			if (string == 'id')
				return string;
			return "f_" + string;
		case 'foreignKey':
			return "fk_" + string;
		case 'alias':
			/* R for Relation */
			return "r_" + string;
		case 'createNewComponentAgenda':
		case 'deleteAgenda':
			return "c_" + string;
		case 'createNewComponentStatus':
		case 'deleteComponentStatus':
			return "s_" + string;
		case 'createNewComponentAddress':
			return string;
		default:
			return "u_" + string;
	}
}

function removePrefix(string, type) {
	const stringLower = string.toLowerCase();
	switch (type) {
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
		case 'relation':
			if (stringLower.substring(0, 2) == "r_")
				return string.substring(2);
			break;
		default:
			return string;
	}
}

function capitalizeFirstLetter(word) {
	return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

module.exports = {
	clearString: clearString,
	validateString: validateString,
	prepareInstruction: prepareInstruction,
	addPrefix: addPrefix,
	removePrefix: removePrefix,
	capitalizeFirstLetter: capitalizeFirstLetter,
	reworkData: (data) => {
		if(typeof data.options === "undefined")
			return data;

		/* If the instruction create something there is inevitably a value. We have to clean this value for the code */
		if(typeof data.options.value !== "undefined" && data.options.processValue){

			/* Keep the value for the trad file */
			data.options.showValue = data.options.value.trim();
			// Remove multipe spaces
			data.options.showValue = data.options.showValue.replace(/\s\s+/g, ' ');
			/* Clean the name of the value */
			data.options.value = clearString(data.options.value);

			if (data.function == 'createNewApplication' || data.function == 'deleteApplication') {
				data.options.value = data.options.value.replace(/_/g, "-");
				if (!validateString(data.options.value)){
					let errorText = "Le nom d'application doit respecter les règles suivantes :\n\n";
					errorText += "\n- Caractères alphanumériques uniquement.";
					errorText += "\n- Au moins une lettre.";
					errorText += "\n- Un espace maximum entre chaque mot.";
					errorText += "\n- Aucun espace en début ou fin.";
					errorText += "\n- 25 caractères maximum.";
					errorText += "\n- Pas de tiret (-) en début ou fin, ni deux ou plus à la suite(--).";

					// Generate an error to throw in controller.
					throw new Error(errorText);
				}
			}

			/* Value that will be used in url */
			data.options.urlValue = data.options.value.toLowerCase();
			/* Create a prefix depending the type of the created value (application, module, entity, field) */
			data.options.value = addPrefix(data.options.value, data.function);
			/* Always lower the code value */
			data.options.value = data.options.value.toLowerCase();
		}
		/* In case of instruction about Association / Relation there is a target instead of a value */
		else if(typeof data.options.target !== "undefined" && data.options.processValue){

			data.options.showTarget = data.options.target.trim();
			data.options.target = clearString(data.options.target);
			data.options.urlTarget = data.options.target.toLowerCase();
			data.options.target = addPrefix(data.options.target, data.function);
			data.options.target = data.options.target.toLowerCase();

			if(typeof data.options.source !== "undefined"){
				data.options.showSource = data.options.source.trim();
				data.options.source = clearString(data.options.source);
				data.options.urlSource = data.options.source.toLowerCase();
				data.options.source = addPrefix(data.options.source, data.function);
				data.options.source = data.options.source.toLowerCase();
			}

			if(typeof data.options.foreignKey !== "undefined"){
				data.options.showForeignKey = data.options.foreignKey.trim();
				data.options.foreignKey = clearString(data.options.foreignKey);
				data.options.foreignKey = addPrefix(data.options.foreignKey, "foreignKey");
				data.options.foreignKey = data.options.foreignKey.toLowerCase();
			}

			if(typeof data.options.as !== "undefined"){
				data.options.showAs = data.options.as.trim();
				data.options.as = clearString(data.options.as);
				data.options.urlAs = data.options.as.toLowerCase();
				data.options.as = addPrefix(data.options.as, "alias");
				data.options.as = data.options.as.toLowerCase();
			}

			if(typeof data.options.usingField !== "undefined"){
				const usingFields = data.options.usingField.split(",");
				data.options.showUsingField = data.options.usingField.split(",");
				for (let j = 0; j < usingFields.length; j++) {
					usingFields[j] = usingFields[j].trim();
					usingFields[j] = clearString(usingFields[j]);
					usingFields[j] = addPrefix(usingFields[j], "using");
					usingFields[j] = usingFields[j].toLowerCase();
				}
				data.options.usingField = usingFields;
			}
		}

		return data;
	}
}