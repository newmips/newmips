const fs = require("fs");
const domHelper = require('../utils/jsDomHelper');

module.exports = {
	addHasOne: function(fileBase, target, targetAlias) {
		return new Promise(function(resolve, reject) {
			const sourceTemplatePath = fileBase + '/print_fields.dust';
			let content = '';
			content += '<div class="dontbreakitplz">\n';
			content += '<!--{#entityAccess entity="'+target.substring(2)+'" }-->\n';
			content += "<div id='"+targetAlias+"_print' class='row'>\n";
			content += "	<div class=\"col-xs-12\">\n";
			content += "		<h3><!--{#__ key=\"entity."+target+".name_entity\" /}--></h3>\n";
			content += "		<hr>\n";
			content += "	</div>\n";
			content += "	<div class=\"col-xs-12\">\n";
			content += '		<!--{#'+targetAlias+'}-->{>"' + target + '/print_fields" /}{/'+targetAlias+'}\n';
			content += "	</div>\n";
			content += "</div>\n";
			content += '{/entityAccess}\n';
			content += '</div>\n';
			domHelper.read(sourceTemplatePath).then(function ($) {
				$(".dontbreakitplz:last-child").after(content);
				domHelper.write(sourceTemplatePath, $).then(resolve);
			});
		});
	},
	addHasMany: function(fileBase, target, targetAlias) {
		return new Promise(function(resolve, reject) {
			const sourceTemplatePath = fileBase + '/print_fields.dust';
			let content = '';
			content += '<div class="dontbreakitplz">\n';
			content += '<!--{#entityAccess entity="'+target.substring(2)+'" }-->\n';
			content += "<div id='"+targetAlias+"_print' class=\"row\">\n";
			content += "	<div class=\"col-xs-12\">\n";
			content += "		<h3><!--{#__ key=\"entity."+target+".name_entity\" /}--></h3>\n";
			content += "		<hr>\n";
			content += "	</div>\n";
			content += "	<div class=\"col-xs-12\">\n";
			content += '		<!--{#' + targetAlias + ' ' + target + '=' + targetAlias + '}-->\n';
			content += '		<!--{#eq key=id value=' + target + '[0].id}-->\n';
			content += '		{>"' + target + '/list_fields" associationAlias="' + targetAlias + '" associationForeignKey="" associationFlag="" associationSource="" associationUrl="" for="hasMany" /}\n';
			content += '		<!--{/eq}-->\n';
			content += '		<!--{:else}-->\n';
			content += '		{>"' + target + '/list_fields" /}\n';
			content += '		<!--{/' + targetAlias + '}-->\n';
			content += '	</div>\n';
			content += '<br>\n';
			content += '</div>\n';
			content += '<!--{/entityAccess}-->\n';
			content += '</div>\n';
			domHelper.read(sourceTemplatePath).then(function ($) {
				$(".dontbreakitplz:last-child").after(content);
				domHelper.write(sourceTemplatePath, $).then(resolve);
			});
		});
	},
	addLocalFileStorage: function(fileBase, componentName) {
		return new Promise(function(resolve, reject) {
			const sourceTemplatePath = fileBase + '/print_fields.dust';
			const content = ""+
			"<div class='dontbreakitplz'>\n"+
			'<!--{#entityAccess entity="'+target.substring(2)+'" }-->\n'+
			"<div id='"+componentName+"_print' class='row'>\n"+
			"	<div class=\"col-xs-12\">\n"+
			"		<h3><!--{#__ key=\"component."+componentName+".label_component\" /}--></h3>\n"+
			"		<hr>\n"+
			"	</div>\n"+
			"	<div class=\"col-xs-12\">\n"+
			"	   <table id=\"table_print_"+componentName+"\" class=\"table table-bordered table-striped\" style=\"margin-bottom: 50px;\">\n"+
			"		   <thead class=\"main\">\n"+
			"			   <tr class=\"fields\">\n"+
			"				   <th data-col=\"id\">ID</th>\n"+
			"				   <th data-field=\"f_filename\" data-col=\"f_filename\"><!--{#__ key=\"global_component.local_file_storage.filename\"/}--></th>\n"+
			"			   </tr>\n"+
			"		   </thead>\n"+
			"		   <tbody>\n"+
			"			   <!--{#"+componentName+"}-->\n"+
			"				   <tr id=\"bodyTR\">\n"+
			"					   <td>{id}</td>\n"+
			"					   <td data-field=\"f_filename\">{f_name}</td>\n"+
			"				   </tr>\n"+
			"			   <!--{/"+componentName+"}-->\n"+
			"		   </tbody>\n"+
			"	   </table>\n"+
			"   </div>\n"+
			"</div>\n"+
			"<!--{/entityAccess}-->\n"+
			"</div>";
			domHelper.read(sourceTemplatePath).then(function ($) {
				$(".dontbreakitplz:last-child").after(content);
				domHelper.write(sourceTemplatePath, $).then(resolve);
			});
		});
	},
	addAddressComponent: function(fileBase, componentName) {
		return new Promise(function(resolve, reject) {
			const sourceTemplatePath = fileBase + '/print_fields.dust';
			const content = ""+
			"<div class='dontbreakitplz'>\n"+
			"<!--{#entityAccess entity=\""+componentName+"\"}-->\n"+
			"<div id='"+componentName+"_print' class='row'>\n"+
			"	<div class=\"col-xs-12\">\n"+
			"		<h3><!--{#__ key=\"component.c_address.label_component\" /}--></h3>\n"+
			"		<hr>\n"+
			"	</div>\n"+
			"	<div class=\"col-xs-12\">\n"+
			"	   <!--{#r_" + componentName + " " + componentName + "=r_" + componentName + "}-->\n"+
			"	   <!--{#eq key=id value=" + componentName + "[0].id}-->\n"+
			"	   {>\"" + componentName + "/list_fields\" associationAlias=\"r_" + componentName + "\" for=\"hasMany\" /}\n"+
			"	   <!--{/eq}-->\n"+
			"	   <!--{:else}-->\n"+
			"	   {>\"" + componentName + "/list_fields\" /}\n"+
			"	   {/r_" + componentName + "}\n"+
			"   </div>\n"+
			"</div>\n";
			"<!--{/entityAcess}-->\n";
			"</div>\n"
			domHelper.read(sourceTemplatePath).then(function ($) {
				$(".dontbreakitplz:last-child").after(content);
				domHelper.write(sourceTemplatePath, $).then(resolve);
			});
		});
	}
}