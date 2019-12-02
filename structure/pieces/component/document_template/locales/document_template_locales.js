module.exports = {
	"fr-FR": {
		fileTypeNotValid: "Type de document non valide",
		failToFillPDF: "Erreur lors du remplissage du PDF",
		useVariable: "Pour utiliser les variables de cette entité dans un <b>Docx</b>, veuillez les placer en l'intérieur de la boucle de l'entité.",
		example: "Exemple:",
		name: "nom",
		output: "Rendra réellement",
		nl: "Où NL= Nouvelle ligne vide",
		empty: "Pour empêcher les nouvelles lignes vides entre les données, placer la variable sur la même ligne que le début de la boucle",
		whereIsNL: "Les nouvelles lignes sont conservées à l'intérieur des sections, donc le modèle exemple suivant",
		one: "Un",
		two: "Deux",
		readme: {
			pageTitle: "Modèle de document : variables utilisables",
			description: ""+
				"<p style='text-align:justify;'> Les modèles de document sont utilisables dans l'onglet où est positionné le composant <b>document template</b> de chaque entité."+
				"   Pour ce faire, vous devez inclure dans les documents de type Word (Docx) ou PDF"+
				"   les variables listées ci-dessous."+
				"</p>"+
				"<p style='text-align:justify;'>"+
				"   Pour un template Docx, les variables doivent être copiées tel quel dans votre texte placées entre accolades."+
				"   Elles seront remplacées à la volée par les données de l'entité au moment où vous cliquerez sur le bouton 'Générer'."+
				"</p>"+
				"<p>NB: cliquez sur les titres des sections de chaque entité pour découvrir l'usage des variables.</p>"+
				"<h5><i class='fa fa-info-circle text-blue'></i>&nbsp; Pour utiliser la date de création ou de modification de chaque enregistrement veuillez utiliser:<br>"+
				"- <b>{createdAt}</b> format Docx ou <b>createdAt</b> format PDF pour la date de création <br>"+
				"- <b>{updatedAt}</b> format Docx ou <b>updatedAt</b> format PDF pour la date de modification."+
				"</h5>"+
				"<h5><i class='fa fa-info-circle text-blue'></i>&nbsp; Type boolean<br>"+
				"- {variable_<b>value</b>} pour avoir accès à la valeur non traduite du champs"+
				"</h5>"+
				"<h5><i class='fa fa-info-circle text-blue'></i>&nbsp; Type enum<br>"+
				"- {variable_<b>value</b>} pour avoir accès à la valeur non traduite du champs pour un fichier PDF<br>"+
				"- {variable_<b>translation</b>} pour avoir accès à la traduction du champs"+
				"</h5>",
			entityInformations: "Informations concernant l'entité",
			entityTableRow1: "Entité",
			entityTableRow2: "Variable",
			entityTableRow3: "Accès variable document format DOCX",
			entityTableRow4: "Accès variable document format PDF",
			entityTableRow5: "Description",
			variables: "Variables globales"
		},
		global: {
			variables: "Variables globales",
			description: "Ces variables commencent par un <b> g_ </b> et sont accessibles dans toutes les entités.",
			entityTableRow5: "Exemple"
		},
		subEntities: {
			help: " <p>Supprimer les sous entités qui ne figurent pas dans le document pour gagner en temps de réponse lors de la génération.</p>"
		},
		template: {
			notFound: "Fichier non trouvé"
		},
		fields: {
			boolean: {
				true: "Vrai",
				false: "Faux"
			}
		}
	},
	"en-EN": {
		fileTypeNotValid: "File type not valid",
		failToFillPDF: "Failed to fill PDF",
		useVariable: "To use the variables of this entity in a <b> Docx </b>, please place them within the loop of the entity.",
		example: "Example:",
		name: "name",
		output: "Will actually render",
		nl: " NL= New Line",
		empty: "To prevent new empty lines between data, place the variable on the same line of loop",
		whereIsNL: "The new lines are kept inside the sections, so the following example template",
		one: "One",
		two: "Two",
		description: ""+
			"<p style='text-align:justify;'>"+
			"	The document templates can be used in the tab where the component is positioned."+
			"	To do this, you must include the variables listed below in Word (Docx) or PDF documents"+
			"</p>"+
			"<p style='text-align:justify;'>"+
			"	For a Docx template, variables must be copied in your text enclosed in braces."+
			"	They will be replaced by the entity's data when you click on the \"Generate\" button who is on entity show page."+
			"</p>"+
			"<p>Click on each entity name to discover the use of the variables.</p>"+
			"<h5><i class='fa fa-info-circle text-blue'></i>&nbsp; To use createdAt and updatedAt of each entity please add:<br>"+
			"<b>{createdAt}</b> for Docx file or <b>createdAt</b> for PDF file <br>"+
			"<b>{updatedAt}</b> for Docx file or <b>updatedAt</b> for PDF file"+
			"</h5>"+
			"<h5><i class='fa fa-info-circle text-blue'></i>&nbsp; Type boolean<br>"+
			"{variable_<b>value</b>} to access the untranslated value of field"+
			"</h5>"+
			"<h5><i class='fa fa-info-circle text-blue'></i>&nbsp; Type enum<br>"+
			"{variable_<b>value</b>} to access the untranslated value or code of field for PDF file<br>"+
			"{variable_<b>translation</b>} to access field translation"+
			"</h5>",
		readme: {
			pageTitle: "Usable variables",
			entityInformations: "Entity informations",
			entityTableRow1: "Entity",
			entityTableRow2: "Variable",
			entityTableRow3: "Variable access for DOCX",
			entityTableRow4: "Variable access for PDF",
			entityTableRow5: "Description",
			variables: "Global variables"
		},
		global: {
			variables: "Global variables",
			description: "These varibales start with <b>g_</b> and are accessible in all entities.",
			entityTableRow5: "Example"
		},
		subEntities: {
			help: " <p>Delete sub entities who are not in the document to save response time on document generation.</p>"
		},
		template: {
			notFound: "File not found"
		},
		fields: {
			boolean: {
				true: "True",
				false: "False"
			}
		}
	}
};