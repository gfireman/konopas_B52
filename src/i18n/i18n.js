(function(){ window.i18n || (window.i18n = {})
var MessageFormat = { locale: {} };
MessageFormat.locale.en=function(n){return n===1?"one":"other"}
window.i18n.get=function(n,k,d){
var m=this[n],f=function(k,d){return typeof m[k]=="function"?m[k](d):k in m?m[k]:k};
return !m?null
:typeof k=="undefined"?f
:typeof d=="undefined"?typeof m[k]=="function"?m[k]:function(){return m[k]}
:f(k,d)}
window.i18n.fill=function(c,s){
var i,n,k,d,a,g=this.get(c),l=document.querySelectorAll('['+s+']');
if(g)for(i=0;n=l[i];++i){
k=n.getAttribute(s)||n.textContent.trim();
d=n.getAttribute(s+'-var');
d&&(d=JSON.parse('{'+d.replace(/[^,:]+/g,'"$&"')+'}'));
a=n.getAttribute(s+'-attr');
a?n.setAttribute(a,g(k,d)):n.innerHTML=g(k,d)}}
var
c=function(d){if(!d)throw new Error("MessageFormat: No data passed to function.")},
n=function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: `"+k+"` isnt a number.");return d[k]-(o||0)},
v=function(d,k){c(d);return d[k]},
p=function(d,k,o,l,p){c(d);return d[k] in p?p[d[k]]:(k=MessageFormat.locale[l](d[k]-o),k in p?p[k]:p.other)},
s=function(d,k,p){c(d);return d[k] in p?p[d[k]]:p.other};
window.i18n["en"] = {
"Program":"Program",
"weekday_n":function(d){return p(d,"N",0,"en",{"0":"Sunday","1":"Monday","2":"Tuesday","3":"Wednesday","4":"Thursday","5":"Friday","6":"Saturday","other":"???"})},
"weekday_short_n":function(d){return p(d,"N",0,"en",{"0":"Sun","1":"Mon","2":"Tue","3":"Wed","4":"Thu","5":"Fri","6":"Sat","other":"???"})},
"month_n":function(d){return p(d,"N",0,"en",{"0":"January","1":"February","2":"March","3":"April","4":"May","5":"June","6":"July","7":"August","8":"September","9":"October","10":"November","11":"December","other":"???"})},
"time_diff":function(d){return v(d,"T")+" "+p(d,"T_UNIT",0,"en",{"0":"seconds","1":"minutes","2":"hours","3":"days","4":"weeks","5":"months","6":"years","other":"???"})+" "+s(d,"T_PAST",{"true":"ago","other":"from now"})},
"search_example":function(d){return "For example, you could try <b>"+v(d,"X")+"</b>"},
"no_ko_id":"No ID set! Please assign konopas_set.id a unique identifier.",
"old_browser":"Unfortunately, your browser doesn't support some of the Javascript features required by KonOpas. To use, please try a different browser.",
"item_not_found":function(d){return "Program id <b>"+v(d,"ID")+"</b> not found!"},
"item_tags":function(d){return s(d,"T",{"tags":"Tags","track":"Track","type":"Type","other":v(d,"T")})},
"star_export_this":function(d){return "Your current selection is encoded in <a href=\""+v(d,"THIS")+"\" target=\"_blank\">this page's URL</a>, which you may open elsewhere to share your selection."},
"star_export_share":function(d){return "For easier sharing, you can also generate a <a href=\""+v(d,"SHORT")+"\">shorter link</a> or a <a href=\""+v(d,"QR")+"\">QR code</a>."},
"star_import_this":function(d){return "Your previously selected items are shown with a highlighted interior, while those imported via <a href=\""+v(d,"THIS")+"\">this link</a> have a highlighted border."},
"star_import_diff":function(d){return "Your previous selection "+p(d,"PREV",0,"en",{"0":"was empty","one":"had one item","other":"had "+n(d,"PREV")+" items"})+", and the imported selection has "+p(d,"NEW",0,"en",{"0":"no new items","one":"one new item","other":n(d,"NEW")+" new items"})+" "+p(d,"SAME",0,"en",{"0":"","one":"and one which was already selected","other":"and "+n(d,"SAME")+" which were already selected"})+"."},
"star_import_bad":function(d){return p(d,"BAD",0,"en",{"0":"","one":"One of the imported items had an invalid ID.","other":n(d,"BAD")+" of the imported items had invalid IDs."})},
"star_set":"Set my selection to the imported selection",
"add_n":function(d){return "add "+v(d,"N")},
"discard_n":function(d){return "discard "+v(d,"N")},
"star_add":function(d){return "Add the "+p(d,"N",0,"en",{"one":"new item","other":n(d,"N")+" new items"})+" to my selection"},
"star_export_link":function(d){return "<a href=\""+v(d,"URL")+"\">Export selection</a> ("+p(d,"N",0,"en",{"one":"one item","other":n(d,"N")+" items"})+")"},
"star_hint":function(d){return "To \"star\" a program item, click on the square next to it. Your selections will be remembered, and shown in this view. You currently don't have any program items selected, so this list is empty."},
"star_no_memory":function(d){return s(d,"WHY",{"FFcookies":"It looks like you're using a Firefox browser with cookies disabled, so ","IOSprivate":"It looks like you're using an iOS or Safari browser in private mode, so ","other":"For some reason,"})+" your <a href=\"http://en.wikipedia.org/wiki/Web_storage\">localStorage</a> is not enabled, and therefore your selection will not be remembered between sessions. "+s(d,"SERVER",{"true":"Please <span class=\"js-link\" onclick=\"var e=_el('login-popup-link');if(e)e.click();\">login</span> to enable persistent storage.","other":""})},
"filter_sum_id":function(d){return "Listing "+p(d,"N",0,"en",{"one":"one item: "+v(d,"TITLE"),"other":n(d,"N")+" items with id "+v(d,"ID")})},
"filter_sum":function(d){return "Listing "+p(d,"N",0,"en",{"one":"one","other":v(d,"ALL")+" "+n(d,"N")})+" "+s(d,"LIVE",{"undefined":"","other":"current and future"})+" "+v(d,"TAG")+" "+p(d,"N",0,"en",{"one":"item","other":"items"})+" "+s(d,"DAY",{"undefined":"","other":"on "+v(d,"DAY")+" "+s(d,"TIME",{"undefined":"","other":"after "+v(d,"TIME")})})+" "+s(d,"AREA",{"undefined":"","other":"in "+v(d,"AREA")})+" "+s(d,"Q",{"undefined":"","other":"matching the query "+v(d,"Q")})},
"day_link":function(d){return "Show "+v(d,"N")+" matching items from "+p(d,"D",0,"en",{"0":"Sunday","1":"Monday","2":"Tuesday","3":"Wednesday","4":"Thursday","5":"Friday","6":"Saturday","other":"???"})},
"hidden_link":function(d){return "Show "+v(d,"N")+" more matching items with an end time before "+v(d,"T")+" on "+p(d,"D",0,"en",{"0":"Sunday","1":"Monday","2":"Tuesday","3":"Wednesday","4":"Thursday","5":"Friday","6":"Saturday","other":"???"})},
"server_cmd_fail":function(d){return "The command \""+v(d,"CMD")+"\" failed."},
"post_author":function(d){return v(d,"N")+" posted…"},
"ical_login":function(d){return "To make your selection available in external calendars, please <span class=\"js-link\" onclick=\"var e=_el('login-popup-link');if(e)e.click();\">login</span>."},
"ical_link":"Your selection is available as an iCal (.ics) calendar at:",
"ical_hint":"Note that changes you make in this guide may not show up immediately in your external calendar software.",
"ical_make":function(d){return "To view your selection in your calendar app, you may also <br class=\"wide-only\">"+v(d,"A_TAG")+"make it available</a> in iCal (.ics) calendar format"},
"login_why":"Once you've verified your e-mail address, you'll be able to sync your data between different clients (including external calendars). After signing in, no information will be transmitted to these external services."}
})();