//                    潘
var currentUniqueId = null;
var currentTab = null;
var uniqueIdTabRecord = {};

var datas = {};
var jsonStrsArr = [];
var jsonStrsSubArr = [];
var labelsArr = [];
var tagsArr = [];

function clearOrInit(uniqueId)
{
	if(uniqueId) {
		window.datas[uniqueId] = { 'All' : [], 'Trace' : [], 'Debug' : [], 'Info' : [], 'Warn' : [], 'Error' : [] };
	}
	else {
		if(window.currentUniqueId) {
			clearOrInit(window.currentUniqueId);
			window.jsonsTable.innerHTML = document.getElementById('jsonsTable-init-value').value;
			reInitTagTabs(window.currentUniqueId);
			window.currentTab = null;
			changeToTag('All');
			//(elem=document.getElementById('uniqueId-' + window.currentUniqueId)).parentNode.removeChild(elem);
		}
	}
}

var lastUniqueIdDataStart = {};
function dataStart(uniqueId, socketId) {
	if(typeof window.datas[uniqueId] == 'undefined') {
		clearOrInit(uniqueId);
		addUniqueTab(uniqueId);
	}
	var dataStartStr = 'data start ' + socketId + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '' + uniqueId + '';
	window.lastUniqueIdDataStart[uniqueId] = dataStartStr
	for(var tab in window.datas[uniqueId]) {
		window.datas[uniqueId][tab].push(dataStartStr);
	}
	if(window.currentUniqueId === uniqueId && window.currentTab !== null) {
		var l = window.datas[uniqueId][window.currentTab].length;
		addCurrentRow(l, window.datas[uniqueId][window.currentTab][l - 1]);
	}
}

function dataEnd(uniqueId) {
	for(var tab in window.datas[uniqueId]) {
		window.datas[uniqueId][tab].push('data end');
	}
	if(window.currentUniqueId === uniqueId && window.currentTab !== null) {
		var l = window.datas[uniqueId][window.currentTab].length;
		addCurrentRow(l, window.datas[uniqueId][window.currentTab][l - 1]);
	}
}

function dataIn(uniqueId, json, label, level, tag)
{
	// return;
	if(!uniqueId) return;
	if(typeof json == 'undefined') return;
	if(!tag || tag == '') tag = 'All';
	if(!level || level == '') level = 'Trace';
	if(!label || label == '') label = '&nbsp;';
	if(level == 'trace') level = 'Trace';
	if(level == 'debug') level = 'Debug';
	if(level == 'info') level = 'Info';
	if(level == 'warn') level = 'Warn';
	if(level == 'error') level = 'Error';
	window.jsonStrsArr.push(json);
	window.jsonStrsSubArr.push(JSON.stringify(json).substring(0, 150));
	window.labelsArr.push(label);
	window.tagsArr.push(tag);
	var jsonIndex = window.jsonStrsArr.length - 1;
	var jsonSubstrIndex = window.jsonStrsSubArr.length - 1;
	var labelIndex = window.labelsArr.length - 1;
	var tagIndex = window.tagsArr.length - 1;
	if(typeof window.datas[uniqueId] == 'undefined') {
		clearOrInit(uniqueId);
		addUniqueTab(uniqueId);
	}
	if(typeof window.datas[uniqueId][level] == 'undefined') {
		level = 'Trace';
	}
	if(typeof window.datas[uniqueId][tag] == 'undefined') {
		window.datas[uniqueId][tag] = [window.lastUniqueIdDataStart[uniqueId]];
		if(window.currentUniqueId == uniqueId) {
			addTabTag(tag);
		}
	}
	if(tag !== 'All') {
		window.datas[uniqueId][tag].push([labelIndex, jsonSubstrIndex, jsonIndex, tagIndex, level]);
	}
	window.datas[uniqueId]['All'].push([labelIndex, jsonSubstrIndex, jsonIndex, tagIndex, level]);
	window.datas[uniqueId][level].push([labelIndex, jsonSubstrIndex, jsonIndex, tagIndex, level]);
	
	var l;
	if(window.currentUniqueId == uniqueId) {
		if(window.currentTab == 'All') {
			l = window.datas[uniqueId]['All'].length;
			addCurrentRow(l, window.datas[uniqueId]['All'][l - 1]);
		} else if(window.currentTab == level) {
			l = window.datas[uniqueId][level].length;
			addCurrentRow(l, window.datas[uniqueId][level][l - 1]);
		} else if(window.currentTab == tag) {
			l = window.datas[uniqueId][tag].length;
			addCurrentRow(l, window.datas[uniqueId][tag][l - 1]);
		}
	}
}

function addUniqueTab(uniqueId)
{
	var li = document.createElement('li');
	var a = document.createElement('a');
	a.innerHTML = '' + uniqueId;
	a.href = 'javascript:;';
	a.addEventListener('click' , function(){ changeToUniqueId(uniqueId, li) }, false);
	li.appendChild(a);
	li.id = 'uniqueId-' + uniqueId;
	var n = document.getElementById('navigation');
	n.appendChild(li);
	if(window.currentUniqueId == null) {
		changeToUniqueId(uniqueId);
	}
}

function addTabTag(tabName)
{
	var li = document.createElement('li');
	var a = document.createElement('a');
	a.innerHTML = '' + tabName;
	a.href = 'javascript:;';
	a.addEventListener('click' , function(){ changeToTag(tabName) }, false);
	li.appendChild(a);
	li.id = 'tabName-' + tabName;
	document.getElementById('tag-tabs').appendChild(li);
}

function changeToUniqueId(uniqueId)
{
	if(window.currentUniqueId != null) { document.getElementById('uniqueId-' + window.currentUniqueId).className = ''; }
	window.currentUniqueId = uniqueId;
	document.getElementById('uniqueId-' + window.currentUniqueId).className = 'active';
	reInitTagTabs(uniqueId);
	window.currentTab = null;
	if(typeof window.uniqueIdTabRecord[window.currentUniqueId] == 'undefined')
		changeToTag('All');
	else
		changeToTag(window.uniqueIdTabRecord[window.currentUniqueId]);
	window.curSelectedRow = null;
	find2init();
}

function changeToTag(tabName)
{
	window.uniqueIdTabRecord[window.currentUniqueId] = tabName;
	if(window.currentTab != null) { document.getElementById('tabName-' + window.currentTab).className = ''; }
	window.currentTab = tabName;
	document.getElementById('tabName-' + window.currentTab).className = 'selected';
	window.jsonsTable.innerHTML = document.getElementById('jsonsTable-init-value').value;
	showTagItems();
	window.curSelectedRow = null;
	find2init();
}

function showTagItems()
{
	for(var i = 1, l = window.datas[window.currentUniqueId][window.currentTab].length; i <= l; i++) {
		addCurrentRow_innerHTML(i, window.datas[window.currentUniqueId][window.currentTab][i - 1]);
	}
	setJsonsTable();
}

function reInitTagTabs(uniqueId) {
	var tabArr = [];
	for(var tab in window.datas[uniqueId]) {
		tabArr.push(tab);
	}
	var li, a;
	var tabs = document.getElementById('tag-tabs');
	tabs.innerHTML = "";
	for(var i = 0,l = tabArr.length; i < l; i++) {
		li = document.createElement('li');
		a = document.createElement('a');
		a.innerHTML = '' + tabArr[i];
		a.href = 'javascript:;';
		a.addEventListener('click' , new function(){ var that = tabArr[i]; return function(){changeToTag(that);} }, false);
		li.appendChild(a);
		li.id = 'tabName-' + tabArr[i];
		tabs.appendChild(li);
	}
}

var jsonsTable;
var curSelectedRow = null;
function addCurrentRow(id, /* label, substrjson, detailJson, tag, level= */arr)
{
	var table = window.jsonsTable;
	var row = table.insertRow(table.rows.length);
	if(arr == 'data end') {
		row.className = 'connection-end';
		var td1 = row.insertCell(0);
		td1.setAttribute('colspan', '1');
		td1.innerHTML = '' + id;
		td1.className = 'id';
		var td2 = row.insertCell(1);
		td2.setAttribute('colspan', '3');
		td2.style.textAlign = 'center';
		td2.innerHTML = 'Connection End';
		var r2 = table.insertRow(table.rows.length);
		var r2_td = r2.insertCell(0);
		r2_td.setAttribute('colspan', '4');
		r2_td.innerHTML = '&nbsp;';
		r2_td.style.border = '0 none';
	} else if(arr.indexOf('data start') == 0) {
		row.className = 'connection-start';
		var td1 = row.insertCell(0);
		td1.setAttribute('colspan', '1');
		td1.innerHTML = '' + id;
		td1.className = 'id';
		var td2 = row.insertCell(1);
		td2.setAttribute('colspan', '3');
		td2.style.textAlign = 'center';
		td2.innerHTML = 'Connection Start&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + arr.replace(/data start /g, '');
	} else {
		row.className = '' + arr[4];
		row.setAttribute('rel', 'dumpData:' + arr[0] + ':' + arr[2] + ':' + arr[3]);
		var idtd = row.insertCell(0);
		idtd.innerHTML = '' + id;
		idtd.className = 'id';
		var labeltd = row.insertCell(1);
		labeltd.innerHTML = '' + window.labelsArr[arr[0]];
		labeltd.className = 'label';
		var detailtd = row.insertCell(2);
		detailtd.innerHTML = '<textarea readonly>' + window.jsonStrsSubArr[arr[1]] + '</textarea>';
		detailtd.className = 'detail';
		var tagtd = row.insertCell(3);
		tagtd.innerHTML = '' + ((window.tagsArr[arr[3]]=='All')?'':window.tagsArr[arr[3]]);
		tagtd.className = 'tag';
	}
}

var temp_addCurrentRow_innerHTML = [];
function addCurrentRow_innerHTML(id, /* label, substrjson, detailJson, tag, level= */arr)
{
	if(!arr) return;
	if(arr == 'data end') {
		window.temp_addCurrentRow_innerHTML.push('<tr class="connection-end"><td class="id">' + id + '</td><td colspan="3" style="text-align:center">Connection End</td></tr>');
		window.temp_addCurrentRow_innerHTML.push('<tr><td colspan="4" style="border:0 none">&nbsp;</td></tr>');
	} else if(arr.indexOf && arr.indexOf('data start') == 0) {
		window.temp_addCurrentRow_innerHTML.push('<tr class="connection-start"><td class="id">' + id + '</td><td colspan="3" style="text-align:center">' + 'Connection Start&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + arr.replace(/data start /g, '') + '</td></tr>');
	} else if(arr.length) {
		window.temp_addCurrentRow_innerHTML.push('<tr class="' + arr[4] + '" rel="' + 'dumpData:' + arr[0] + ':' + arr[2] + ':' + arr[3] + '">');
			
			window.temp_addCurrentRow_innerHTML.push('<td class="id">');
			window.temp_addCurrentRow_innerHTML.push(id);
			window.temp_addCurrentRow_innerHTML.push('</td>');
			
			window.temp_addCurrentRow_innerHTML.push('<td class="label">');
			window.temp_addCurrentRow_innerHTML.push(window.labelsArr[arr[0]]);
			window.temp_addCurrentRow_innerHTML.push('</td>');
			
			window.temp_addCurrentRow_innerHTML.push('<td class="detail">');
			window.temp_addCurrentRow_innerHTML.push('<textarea readonly>' + window.jsonStrsSubArr[arr[1]] + '</textarea>');
			window.temp_addCurrentRow_innerHTML.push('</td>');
			
			window.temp_addCurrentRow_innerHTML.push('<td class="tag">');
			window.temp_addCurrentRow_innerHTML.push(((window.tagsArr[arr[3]]=='All')?'':window.tagsArr[arr[3]]));
			window.temp_addCurrentRow_innerHTML.push('</td>');
		
		window.temp_addCurrentRow_innerHTML.push('</tr>');
	}
}
function setJsonsTable()
{
	window.jsonsTable.innerHTML = window.temp_addCurrentRow_innerHTML.join('');
	window.temp_addCurrentRow_innerHTML = [];
}

function jsonsTableDblClick(e)
{
	var row = e.srcElement;
	var rel;
	var index;
	while(row != window.jsonsTable && ((rel = row.getAttribute('rel')) == null || (index = rel.indexOf('dumpData:')) != 0)) {
		row = row.parentNode;
	}
	if(index == 0) {
		var arr = rel.split(':')
		window.dumpF(1, arr[1], arr[2], arr[3], window.jsonStrsArr[arr[2]]);
	}
}

function jsonsTableClick(e)
{
	var row = e.srcElement;
	var rel;
	var index;
	while(row != window.jsonsTable && ((rel = row.getAttribute('rel')) == null || (index = rel.indexOf('dumpData:')) != 0)) {
		row = row.parentNode;
	}
	if(index == 0) {
		if(window.curSelectedRow !== null) { window.curSelectedRow.className = window.curSelectedRow.className.replace(/ selectedRow/g,''); } window.curSelectedRow = row; row.className += " selectedRow";
	}
}

var postID = 0;
function postBtnClick(clickEvent)
{
	document.getElementById('postBtn').style.visibility = 'hidden';
	var loader = new air.URLLoader();
	loader.addEventListener(air.Event.COMPLETE, function(e/* :Event */) {
		if(document.getElementById('postShowReponse').checked && clickEvent) window.dumpF(0, ++postID, postID, postID, '<textarea style="width:100%;height:100%;">'+e.target.data.replace(/\<textarea\>/g, "&lt;textarea&gt;").replace(/\<\/textarea\>/g, "&lt;/textarea&gt;") + '</textarea>');
		document.getElementById('postBtn').style.visibility = 'visible';
	});
	if(clickEvent) {
		loader.addEventListener(air.HTTPStatusEvent.HTTP_STATUS, function(e/* :HTTPStatusEvent */) {
			if(document.getElementById('postShowReponse').checked) alert('status: ' + e.status);
		});
	}
	loader.addEventListener(air.IOErrorEvent.IO_ERROR, function(e/* :IOErrorEvent */) {
		alert('io error');
		alert(e.text);
		document.getElementById('postBtn').style.visibility = 'visible';
	});
	var request = new air.URLRequest(document.getElementById('postUrl').value);
	if(document.getElementById('postRaw').value) {
		request.method = air.URLRequestMethod.POST;
		request.contentType = "application/x-www-form-urlencoded";
		var byteArray = new air.ByteArray();
		byteArray.writeUTFBytes(document.getElementById('postRaw').value);
		request.data = byteArray;
	}
	else {
		request.method = air.URLRequestMethod.GET;
	}
	try {
		loader.load(request);
		window.state['postUrl'] = document.getElementById('postUrl').value;
		window.state['postRaw'] = document.getElementById('postRaw').value;
		saveState();
	} catch (err) {
		alert("Unable to load requested document.");
	}
}
function onOffPost() {
	if(document.getElementById('execPost').style.bottom == '-50px' || !document.getElementById('execPost').style.bottom) {
		document.getElementById('execPost').style.bottom = '39px';
	} else {
		document.getElementById('execPost').style.bottom = '-50px';
	}
}