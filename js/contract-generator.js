// globals
var docObject = [];
var collDependency = [];
var collection;
var draggableDiv = document.getElementById("pick-option");
var isDown = false;

draggableDiv.addEventListener('mousedown', function(e) {
	isDown = true;
	offset = [
		draggableDiv.offsetLeft - e.clientX,
		draggableDiv.offsetTop - e.clientY
	];
}, true);

document.addEventListener('mouseup', function() {
	isDown = false;
}, true);

document.addEventListener('mousemove', function(event) {
	event.preventDefault();
	if (isDown) {
		mousePosition = {

			x : event.clientX,
			y : event.clientY

		};
		draggableDiv.style.left = (mousePosition.x + offset[0]) + 'px';
		draggableDiv.style.top  = (mousePosition.y + offset[1]) + 'px';
	}
}, true);

function findFather(objSearch, objAdd, idx)
{
	var found = false;
	objSearch.filter(function(item){ // find item father of the dependency
		if (!found)
		{
			if (item.id === objAdd.depends)
			{
				collDependency.splice(idx, 1); // remove current item
				item.childs.push(objAdd);
				found = true;
			}
			else if (item.childs.length > 0)
			{
				found = findFather(item.childs, objAdd, idx);
			}
		}
	});
	return found;
}

var myCallback = function (error, options, response) {
	if (!error) {
		debugger;
		//console.log(response.rows);
		// making sure it will work even if order changes
		var idIndex = response.rows[0].labels.indexOf('id');
		var descriptionIndex = response.rows[0].labels.indexOf('description');
		var contentIndex = response.rows[0].labels.indexOf('content');
		var typeIndex = response.rows[0].labels.indexOf('type');
		var dependsIndex = response.rows[0].labels.indexOf('depends');
		var mandatoryIndex = response.rows[0].labels.indexOf('mandatory');

		//collection = response.rows.slice(1, response.rows.length); // remove labels
		collection = response.rows; // remove labels
		collection.filter(function(item){ // get all objects that has no dependency
			if (item.cellsArray[dependsIndex] === "")
			{
				var tempObject = Object();
				tempObject.id = item.cellsArray[idIndex];
				tempObject.description = item.cellsArray[descriptionIndex];
				tempObject.content = item.cellsArray[contentIndex];
				tempObject.type = item.cellsArray[typeIndex];
				tempObject.depends = item.cellsArray[dependsIndex];
				tempObject.mandatory = item.cellsArray[mandatoryIndex];
				tempObject.used = false;
				tempObject.childs = [];

				docObject.push(tempObject);
			}
		});
		collDependency = collection.filter(function(item){ // get all objects that has dependency
			return (item.cellsArray[dependsIndex] !== "");
		});
		// TODO add while to deep decision tree
		var tempColl = [];
		var i = 0;
		var stop = false;
		var message = "";
		//while (collDependency.length > 0) {
		while ((!stop) && (collDependency.length > 0)) {
			tempColl = collDependency;
			$(tempColl).each(function(index){
				if (!stop)
				{
					var tempObject = Object();
					tempObject.id = this.cellsArray[idIndex];
					tempObject.description = this.cellsArray[descriptionIndex];
					tempObject.content = this.cellsArray[contentIndex];
					tempObject.type = this.cellsArray[typeIndex];
					tempObject.depends = this.cellsArray[dependsIndex];
					tempObject.mandatory = this.cellsArray[mandatoryIndex];
					tempObject.used = false;
					tempObject.childs = [];

					if (tempObject.id === tempObject.depends)
					{
						stop = true;
						message = "an item cannot depend of itself";
						return;
					}

					stop = !findFather(docObject, tempObject, index - i);
					i++;
				}
			});

			if (stop)
			{
				if (message !== "")
					window.alert(message);
			}
		}

		localStorage.setItem('CG-decisionsTree', JSON.stringify(docObject));
		localStorage.removeItem('CG-brothersIds');
		localStorage.removeItem('CG-vueVars');
		//localStorage.removeItem('CG-savedVueVars');

		var startBtn = $('<input/>').attr({class:'btn btn-primary', id:'start-btn', type: 'button', value:'Start', onClick:'startDecisions()'});
		$("#content").append(startBtn);
		$("#main-message").text("Let's get started :D");
	}
};

var sheetId = getURLParam("sheetId"); // 1HFGm_cSH_XeZtxfREusftu-4S1LYZeAVSVjWMmsRHtY
if (sheetId)
{
	sheetrock({
		url: "https://docs.google.com/spreadsheets/d/" + sheetId + "/edit#gid=0",
		callback: myCallback
	});
}
else{
	$("#main-message").text("Contract Generator");
	var innerDiv = $('<div/>').attr({id:'parse-sheet'});
	var paragraph = $('<p>').text("Paste your spreadsheet URL").attr({class:'align-center'});
	var input = $('<input/>').attr({type:'text', id:'sheet-input', class:'form-control', placeholder:'Example: https://docs.google.com/spreadsheets/d/1HFGm_cSH_XeZtxfREusftu-4S1LYZeAVSVjWMmsRHtY/edit#gid=0'});
	var startBtn = $('<input/>').attr({class:'btn btn-primary', id:'sheet-btn', type: 'button', value:'Go!', onClick:'parseSpreadsheet()'});
	paragraph.append(input);
	innerDiv.append(paragraph).append(startBtn);
	$("#content").append(innerDiv);
}

// functions
function parseSpreadsheet()
{
	var resourceUrl = $("#sheet-input").val();
	var spreadsheetId = new RegExp("/spreadsheets/d/([a-zA-Z0-9-_]+)").exec(resourceUrl)[1];
	var url = window.location.href;
	if (url.indexOf('?') > -1){
		url += '&sheetId=' + spreadsheetId;
	}
	else{
		url += '?sheetId=' + spreadsheetId;
	}
	window.location.href = url;
}
//			function toggleItem(id){
//				$('#' + id).toggle();
//			}

function updateMargin(data){
	var margin = data.className.split(' ')[0]; // get first class name
	var content = $("#content");

	if (margin === "margin-top")
		content.css('padding-top', data.value + "mm");
	if (margin === "margin-right")
		content.css('padding-right', data.value + "mm");
	if (margin === "margin-bottom")
		content.css('padding-bottom', data.value + "mm");
	if (margin === "margin-left")
		content.css('padding-left', data.value + "mm");
}

function changeListType(value){

}

function getURLParam(name){
	return (location.search.split(name + '=')[1] || '').split('&')[0];
}

function startDecisions()
{
	$("#start-btn").toggle();
	$("#main-message").html("").toggle();
	$("#vars-menu").show();
	var decisionsTree = JSON.parse(localStorage.getItem('CG-decisionsTree'));
	var decisionsDiv = $('<div/>').attr({id:'decisions'});
	//var pickOption = $('<div/>').attr({id:'pick-option', class:'no-print'});
	//var pickOption = $('#pick-option');
	var content = $("#content");
	content.append(decisionsDiv);
	content.css('background-color', '#ffffff');
	//var ids = [];
	//debugger;
	genChoices(decisionsTree, false); // first call to genHTML
}

function genHTMLContent(item)
{
	debugger;
//	if (item.used) // .toLowerCase() === "true"
//		return;
	var exists = $('#' + item.id);
	var pickOption = $("#pick-option");
	//pickOption.html("");
	if (exists.length > 0)
	{
		pickOption.hide("");
		return false;
	}
	var innerDiv = $('<div/>').attr({id:item.id});
	var decisionsDiv = $("#decisions");
	var content;

	if (item.type === 'list')
	{
		$('#list-style').show();
		var lastElement = decisionsDiv.children().last().prev();
		var lastElemName = lastElement.children().last().prop("nodeName");
		if (lastElemName === "UL")
		{
			//var qty = lastElement.find("ul").length;
			var lastLi = lastElement.children().last().children();
			var qty = parseInt(window.getComputedStyle(lastLi[0],':before').content.replace('"', ''));
			var numberClass = 'number-' + (++qty);
			content = $("<ul>").append($("<li>").html(item.content).attr({class:'list ' + numberClass})); // change to .text to not parse as HTML
			$('#custom-styles').append($('<style>.' + numberClass + ':before {content: "' + qty + '";margin-left: -20px;margin-right: 10px;}</style>'));
		}
		else
		{
			content = $("<ul>").append($("<li>").html(item.content).attr({class:'list number-1'})); // change to .text to not parse as HTML
			$('#custom-styles').append($('<style>.number-1:before {content: "1";margin-left: -20px;margin-right: 10px;}</style>'));
		}
	}
	else if (item.type === 'title')
		content = $("<h1>").html(item.content); // change to .text to not parse as HTML
	else if (item.type === 'subtitle')
		content = $("<h2>").html(item.content); // change to .text to not parse as HTML
	else if (item.type === 'paragraph')
		content = $("<p>").html(item.content); // change to .text to not parse as HTML

	innerDiv.append(content);
	decisionsDiv.append(innerDiv);
	decisionsDiv.append(pickOption);

	var match = item.content.match(/{{\s*[\w\.]+\s*}}/g);
	if (match)
	{
		var vueTemp = match.map(function(x) { return x.match(/[\w\.]+/)[0]; });
		if (vueTemp.length > 0)
		{
			updateVarsMenu(vueTemp, item.id);
		}
	}
	return true;
}

function updateVarsValue(data)
{
	var savedVueVars = JSON.parse(localStorage.getItem('CG-savedVueVars'));
	if (!(savedVueVars instanceof Object))
		savedVueVars = {};
	var content = document.getElementById("content");
	var classes = content.getElementsByClassName(data.placeholder);
	var len = Object.keys(classes).length;
	var val = data.value;
	savedVueVars[data.placeholder] = val; // update value on save vars
	if (val === "")
		val = data.placeholder;
	for (var i = 0; i < len; i++)
		classes[i].innerText = val;
	localStorage.setItem('CG-savedVueVars', JSON.stringify(savedVueVars));
}

function updateVarsMenu(arr, id)
{
	//debugger;
	var vueVars = JSON.parse(localStorage.getItem('CG-vueVars'));
	var savedVueVars = JSON.parse(localStorage.getItem('CG-savedVueVars'));
	if (!(vueVars instanceof Array))
		vueVars = [];
	if (!(savedVueVars instanceof Object))
		savedVueVars = {};
	var newVars = $(arr).not(vueVars).get();
	//debugger;
	$(arr).each(function(index){
		//debugger;
		var varName = "{{" + this + "}}";
		var text = varName;
		if (savedVueVars[varName])
			text = savedVueVars[varName];
		else
			savedVueVars[varName] = "";
		if (newVars.length > 0) // means there's new vars
		{
			var varDiv = $('<div/>').attr({id:'var_' + this, class:'vars'});
			var paragraph = $('<p>').text(varName);
			var input = $('<input/>').attr({type:'text', class:'vue-var form-control', placeholder:varName, oninput:"updateVarsValue(this)"});
			if (text !== varName)
				input.attr({value:text});
			paragraph.append(input);
			varDiv.append(paragraph);
			$("#vars-menu").append(varDiv);
		}
		// update var from HTML
		var pattern = new RegExp(varName, 'g');
		var content = $("#" + id);
		var newHTML = content.html().replace(pattern, '<abbr class="' + varName + '">' + text + '</abbr>');
		content.html(newHTML);
	});
	$.extend(vueVars, arr);
	//debugger;
	localStorage.setItem('CG-vueVars', JSON.stringify(vueVars));
	localStorage.setItem('CG-savedVueVars', JSON.stringify(savedVueVars));
}

function genChoices(json, replaceJson)
{
	//debugger;
	var decisionsDiv = $("#decisions");
//	var pickOption = $("#pick-option");
//	if (pickOption)
//		pickOption.remove();
	var pickOption = $('#pick-option');
	pickOption.show();
	pickOption.html("");
	var ids = JSON.parse(localStorage.getItem('CG-brothersIds'));
	var replaced = false;
	var buildNewIds = false;
	if (ids instanceof Array)
	{
		if ((ids.length > 0) && (replaceJson))
		{
			json = ids;
			replaced = true;
		}
	}
	else
	{
		ids = [];
		buildNewIds = true;
	}
	//var pickOption = $('<div/>').attr({id:'pick-option', class:'no-print'});
	var found = false;
	var i = 0;
	$(json).each(function(index){
		//debugger;
		if (!found)
		{
			if (this.mandatory.toLowerCase() === "true")
			{
				found = !genHTMLContent(this);
				this.used = true;
			}
			else // TODO when brothers, must be able to choose all of them
			{
				//ids.push(this.id);
				//this.description
				var innerDiv = $('<div/>').attr({id:'pick-inner'});
				var paragraph = $('<p>').html('<b>Use "' + this.description + '"?</b>');
				var btnYes = $('<input/>').attr({class:'btn btn-primary btn-pick no-print', id:'btn_' + this.id, type: 'button', value:'Yes', onClick:"parseJson(true, '" + this.id + "', '')"});
				var btnNo = $('<input/>').attr({class:'btn btn-primary btn-pick no-print', id:'btn_' + this.id, type: 'button', value:'No', onClick:"parseJson(false, '" + this.id + "', '')"});
				innerDiv.append(paragraph).append(btnYes).append(btnNo);
				pickOption.append(innerDiv);
				found = true;
			}
			if (replaced)
			{
				ids.splice(index - i, 1); // remove current item
				i++;
			}
		}
		else if (buildNewIds)
			ids.push(this);
		else if (!replaceJson) // if it's not replacing the json, means that it's not using ids, so increment
			ids.unshift(this);
	});
	if (found)
		decisionsDiv.append(pickOption);
	else
		pickOption.hide();
	localStorage.setItem('CG-brothersIds', JSON.stringify(ids));
}

function parseJson(add, item, json)
{
	//debugger;
	$("#pick-option").html("");
	var found = false;
	if (json === "")
		json = JSON.parse(localStorage.getItem('CG-decisionsTree'));
	if (add)
	{
		$(json).each(function(index){
			if (!found)
			{
				//debugger;
				if (this.id === item)
				{
					found = genHTMLContent(this);
					this.used = true;
					if (this.childs.length > 0)
					{
						//debugger;
						genChoices(this.childs, false);
					}
					else
						genChoices(json, true);
				}
				else if (this.childs.length > 0)
				{
					//debugger;
					found = parseJson(add, item, this.childs);
				}
			}
		});
	}
	else
		genChoices(json, true);

	return found;
}

function preparePrint()
{
	window.print();
}

function prepareDownload(contentId)
{
	//debugger;
	var htmlDoc = $('#' + contentId).html();
	htmlDoc = htmlDoc.replace(/(?:\r\n|\r|\n)/g, '<br/>');
	htmlDoc = htmlDoc.replace(/  /g, "&nbsp;&nbsp;"); // replace double whitespaces by double &nbsp;
	var converted = htmlDocx.asBlob(htmlDoc);
	saveAs(converted, 'contract.docx');
	//downloadFile(htmlDoc, "sample.docx", "text/html");
}

//function downloadFile(data, name, type) {
//	if (data !== null && navigator.msSaveBlob)
//		return navigator.msSaveBlob(new Blob([data], { type: type }), name);
//	var a = $("<a style='display: none;'/>");
//	var url = window.URL.createObjectURL(new Blob([data], {type: type}));
//	a.attr("href", url);
//	a.attr("download", name);
//	$("body").append(a);
//	a[0].click();
//	window.URL.revokeObjectURL(url);
//	a.remove();
//}
