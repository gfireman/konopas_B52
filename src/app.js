function KonOpas(set) {
	this.id = '';
	this.lc = 'en';
	this.tag_categories = false;
	this.default_duration = 60;
	this.time_show_am_pm = false;
	this.abbrev_00_minutes = true; // only for am/pm time
	this.always_show_participants = false;
	this.max_items_per_page = 200;
	this.non_ascii_people = false; // setting true enables correct but slower sort
	this.people_per_screen = 100;
	this.use_server = false;
	this.log_messages = true;
	this.cache_refresh_interval_mins = 60;
	this.views = [ "star", "prog", "part", "info" ];
	if (typeof set == 'object') for (var i in set) this[i] = set[i];

	if (!this.log_messages) _log = function(){};
	if (i18n[this.lc]) {
		i18n.txt = function(key, data){ return key in i18n[this.lc] ? i18n[this.lc][key](data) : key; }.bind(this);
		i18n.translate_html(i18n[this.lc], 'data-txt');
	} else alert('Locale "' + this.lc + '" not found.');
	if (!this.id) alert(i18n.txt('no_ko_id'));
	if (!Array.prototype.indexOf || !Array.prototype.filter || !Array.prototype.map
		|| !Date.now || !('localStorage' in window)) alert(i18n.txt('old_browser'));

	this.store = new KonOpas.Store(this.id);
	this.stars = new KonOpas.Stars(this.id);
	this.server = this.use_server && KonOpas.Server && new KonOpas.Server(this.id, this.stars);
	this.item = new KonOpas.Item();
	this.info = new KonOpas.Info();
	this.more = [];
	window.onhashchange = this.set_view.bind(this);
	var pl = document.getElementsByClassName('popup-link');
	for (var i = 0; i < pl.length; ++i) pl[i].addEventListener('click', KonOpas.popup_open);
	if (_el('refresh')) window.addEventListener('load', this.refresh_cache.bind(this), false);
}

KonOpas.prototype.set_program = function(list, opt) { this.program = new KonOpas.Prog(list, opt); }
KonOpas.prototype.set_people = function(list) { this.people = new KonOpas.Part(list, this); }

KonOpas.prototype.set_view = function() {
	var hash = window.location.hash.substr(1);
	var view = hash.substr(0, 4), tabs = _el('tabs');
	if (!this.program || !this.program.list.length) {
		view = 'info';
		tabs.style.display = 'none';
		this.info.show();
		if (this.server) this.server.error('Program loading failed!');
	} else {
		tabs.style.display = 'block';
		if (!this.people || !this.people.list.length) {
			tabs.classList.add('no-people');
			if (view == 'part') view = '';
		} else {
			tabs.classList.remove('no-people');
		}
		switch (view) {
			case 'part': this.people.show();  break;
			case 'star': this.stars.show();   break;
			case 'info': this.info.show();    break;
			case 'more': {
				_el("prog_ls").innerHTML = "";
				// Dynamically populate 'moreX' tab objects and classes
				if (this.more.indexOf(hash) === -1) { this.more.push(hash); }
				break;
			};
			default:     this.program.show(); view = 'prog';
		}
	}
	for (var i = 0; i < this.views.length; ++i) {
		document.body.classList[view == this.views[i] ? 'add' : 'remove'](this.views[i]);
	}

	for (var i = 0; i < this.more.length; ++i) {
		_el(this.more[i] + '_view').classList[this.more[i] === hash ? 'add' : 'remove']('active');
    _el('tab_' + this.more[i]).classList[this.more[i] === hash ? 'add' : 'remove']('active');
	}

	if (_el('load_disable')) _el('load_disable').style.display = 'none';
}

KonOpas.prototype.refresh_cache = function() {
	var t_interval = this.cache_refresh_interval_mins * 60000;
	var last_updated = document.body.parentNode.getAttribute('data-last-updated');
	if (!last_updated) {
		console.log('Info: data-last-updated attribute not set on html tag; refresh disabled.');
		return;
	}
	if (!t_interval || (t_interval <= 0)) {
		console.log('Info: cache_refresh_interval_mins is zero or not set; refresh disabled.')
		return;
	}
	if (!/^http[s]?:/.test(location.protocol)) {
		// Note: CORS will block request for requests issued when index.html is loaded from file.
		console.log('Info: location prefix is not http[s]; refresh disabled.');
		return;
	}

	console.log('refresh-cache: starting with interval',  this.cache_refresh_interval_mins, 'minutes');
	var load_time = new Date();
	var check_for_updates = function() {
		console.log('refresh-cache: fetching');
		var x = new XMLHttpRequest();
		x.onload = function() {
			var lu_time = new Date(this.getResponseHeader("Last-Modified"));
			if (lu_time > load_time) {
				console.log('refresh-cache: UPDATES AVAILABLE');
				_el('refresh').classList.add('enabled');
				_el('refresh').onclick = function() { window.location.reload(); };
			} else {
				console.log('refresh-cache: no updates available');
			}
		};
		x.open('GET', last_updated, true);
		x.setRequestHeader("Cache-Control", "max-age=0");
		x.send();
	};

	window.setInterval(check_for_updates, t_interval);
}
