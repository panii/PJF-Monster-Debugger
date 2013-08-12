var find2betidivSelectorCur = 'span[rel="find2beticur"]';
var find2betidivSelectorOther = 'span[rel="find2betihig"]';
var find2finddiv = null;
var find2finddivshow = false;
var find2finddivinput;
var find2totaldiv;

var find2cacheItem = [];
var find2currentItemIndex = -1;
var find2curfindstr = null;

function find2show() {
	if(find2finddiv == null) {
		find2finddiv = document.createElement('div');
		find2finddiv.style.position = 'fixed';
		find2finddiv.style.top = '2px';
		find2finddiv.style.right = '20px';
		find2finddiv.style.width = "200px";
		find2finddiv.style.height = "60px";
		find2finddiv.style.border = "5px solid #EEE";
		find2finddiv.style.cursor = 'pointer';
		find2finddiv.style.backgroundColor = '#FFF';
		find2finddivinput = document.createElement('input');
		find2finddivinput.type = 'text';
		find2finddivinput.style.border='1px solid #AAA';
		find2finddivinput.style.marginRight = '3px'
		find2finddivinput.style.height = '30px'
		find2finddivinput.style.width = '130px'
		find2finddivinput.style.backgroundColor = '#FFF';
		find2finddivinput.addEventListener('keydown', function(e){if(e.keyCode==27) { find2show(); e.stopPropagation();return false; } if(e.keyCode==13){ var findwhat = find2finddivinput.value; if(findwhat) {if(find2curfindstr==findwhat) find2next(); else find2find(findwhat); e.preventDefault();} }}, false);
		var prevBtn = document.createElement('button');
		prevBtn.style.border = '1px solid #EEE';
		prevBtn.style.backgroundColor = '#FFF';
		prevBtn.style.cursor = 'pointer';
		prevBtn.style.padding = '1px 6px';
		prevBtn.innerHTML = '<strong>&lt;</strong>';
		prevBtn.addEventListener('click', function(){ find2prev(); }, false);
		var nextBtn = document.createElement('button');
		nextBtn.innerHTML = '<strong>&gt;</strong>';
		nextBtn.style.border = '1px solid #EEE';
		nextBtn.style.backgroundColor = '#FFF';
		nextBtn.style.cursor = 'pointer';
		nextBtn.style.padding = '1px 6px';
		nextBtn.addEventListener('click', function(){ find2next(); }, false);
		find2finddiv.appendChild(find2finddivinput);
		find2finddiv.appendChild(prevBtn);
		find2finddiv.appendChild(nextBtn);
		find2totaldiv = document.createElement('div');
		find2totaldiv.style.height = '30px'
		find2totaldiv.style.lineHeight = '30px'
		find2totaldiv.style.border = '1 px solid #EFEFEF';
		find2totaldiv.style.paddingLeft = '8px';
		find2finddiv.appendChild(find2totaldiv);
		document.body.appendChild(find2finddiv);
		find2finddivshow = true;
		find2finddivinput.focus();
		find2finddivinput.select();
	} else {
		if(find2finddivshow == true) {find2finddiv.style.display='none'; find2finddivinput.blur(); find2finddivshow = false;}
		else {find2finddiv.style.display='block'; find2finddivshow = true; find2finddivinput.focus();find2finddivinput.select();}
	}
}

function find2init() {
	find2cacheItem = [];
	find2currentItemIndex = -1;
	find2curfindstr = null;
}
function find2find(findwhat) {
	find2finddivinput.disabled = true;
	find2finddivinput.style.backgroundColor = '#AAA';
	find2cancel();
	find2curfindstr = findwhat;
	find2cacheItem = [];
	find2currentItemIndex = -1;
	find2totaldiv.innerHTML = 'finding...';
	var all;
	var str;
	var reg;
	var index = 0;
	var matchh;
	for(var i = 0; i < find2Selector.length; i++) {
		all = document.querySelectorAll(find2Selector[i]);
		for(var ii = 0 , l = all.length; ii < l; ii++) { 
			if(all[ii].children.length == 0) {
				str = all[ii].innerHTML;
				reg = new RegExp(findwhat, 'i');
				if((matchh = str.match(reg)) !== null) {
					if(index == 0) {
						find2currentItemIndex = 0;
						all[ii].innerHTML = str.replace(reg, '<span rel="find2beticur" style="background-color:#FF9632">' + matchh[0] + '</span>');
					} else {
						all[ii].innerHTML = str.replace(reg, '<span rel="find2betihig" style="background-color:#FFFF96">' + matchh[0] + '</span>');
					}
					find2cacheItem[index] = all[ii];
					index++;
				}
			}
		} 
	}
	find2finddivinput.removeAttribute('disabled');
	find2finddivinput.style.backgroundColor = '#FFF';
	if(find2currentItemIndex == -1) { find2totaldiv.innerHTML = 'not found'; }
	else { find2from.scrollTop = getPos(find2cacheItem[find2currentItemIndex])[1] - 500; find2totaldiv.innerHTML = index + ' found'; }
}

function find2cancel() {
	var all;
	var i;
	var l;
	var cur;
	all = document.querySelectorAll(find2betidivSelectorCur);
	var r1 = /\<span rel\=\"find2beticur\" style\=\"background\-color\:\#FF9632\"\>(.*)\<\/span\>/;
	for(i = 0, l = all.length; i < all.length; i++) {
		cur = all[i];
		r1.exec(cur.parentNode.innerHTML);
		cur.parentNode.innerHTML = cur.parentNode.innerHTML.replace(r1, RegExp.$1);
	}
	r1 = /\<span rel\=\"find2betihig\" style\=\"background\-color\:\#FFFF96\"\>(.*)\<\/span\>/;
	all = document.querySelectorAll(find2betidivSelectorOther);
	for(i = 0, l = all.length; i < all.length; i++) {
		cur = all[i];
		r1.exec(cur.parentNode.innerHTML);
		cur.parentNode.innerHTML = cur.parentNode.innerHTML.replace(r1, RegExp.$1);
	}
}

function getPos(ele){
    var x=0;
    var y=0;
    while(true){
        x += ele.offsetLeft;
        y += ele.offsetTop;
        if(ele.offsetParent === null){
            break;
        }
        ele = ele.offsetParent;
    }
    return [x, y];
}

function find2next() {
	var l = find2cacheItem.length;
	if(l == 1) return;
	if(l > 0) {
		if(find2currentItemIndex == l-1) {
			find2currentItemIndex = -1;
		}
		var cur = document.querySelector(find2betidivSelectorCur)
		if(cur) {
			cur.parentNode.innerHTML = cur.parentNode.innerHTML.replace(/FF9632/, 'FFFF96').replace(/find2beticur/, 'find2betihig');
		}
		find2cacheItem[++find2currentItemIndex].innerHTML = find2cacheItem[find2currentItemIndex].innerHTML.replace(/FFFF96/, 'FF9632').replace(/find2betihig/, 'find2beticur');
		find2from.scrollTop = getPos(find2cacheItem[find2currentItemIndex])[1] - 500;
	}
}

function find2prev() {
	var l = find2cacheItem.length;
	if(l == 1) return;
	if(l > 0) {
		if(find2currentItemIndex == 0) {
			find2currentItemIndex = l;
		}
		var cur = document.querySelector(find2betidivSelectorCur)
		if(cur) {
			cur.parentNode.innerHTML = cur.parentNode.innerHTML.replace(/FF9632/, 'FFFF96').replace(/find2beticur/, 'find2betihig');
		}
		find2cacheItem[--find2currentItemIndex].innerHTML = find2cacheItem[find2currentItemIndex].innerHTML.replace(/FFFF96/, 'FF9632').replace(/find2betihig/, 'find2beticur');
		find2from.scrollTop = getPos(find2cacheItem[find2currentItemIndex])[1] - 500;
	}
}