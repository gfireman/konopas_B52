function Server(id, stars, opt) {
	this.id = id;
	this.stars = stars;

	opt = opt || {};
	this.host = opt.host ||  'https://konopas-server.appspot.com';
	this.el_id = opt.el_id || 'server_connect';
	this.err_el_id = opt.err_el_id || 'server_error';

	this.connected = false;
	this.ical = localStorage.getItem('konopas.'+this.id+'.ical_link') || false;
	this.prog_data = {};
	this.prog_server_mtime = 0;
	this.my_votes_data = {};
	this.my_votes_mtime = 0;
	this.pub_data = {};
	this.pub_comments = {};
	this.el = document.getElementById(this.el_id);
	this.err_el = false;

	this.disconnect();
	if (this.stars) this.stars.server = this;
	if (this.el && this.id) this.exec('info');
	else console.warn("server init failed");

	var m = /#server_error=(.+)/.exec(window.location.hash);
	if (m) this.error(decodeURIComponent(m[1].replace(/\+/g, ' ')), window.location.href, this);
}

Server.prototype.disconnect = function() {
	this.connected = false;
	if (this.el) this.el.innerHTML = '<div id="server_info">Not connected</div>';
}

Server.prototype.logout = function(ev) {
	console.log("server logout");
	server.exec('/logout');
	(ev || window.event).preventDefault();
}

Server.prototype.error = function(msg, url, server_ptr) {
	console.error('server error ' + msg + ', url: ' + url);
	server_ptr = server_ptr || this;
	if (msg =='') {
		var cmd = url.replace(server_ptr.host, '').replace('/' + server_ptr.id + '/', '');
		msg = 'The command "<code>' + cmd + '</code>" failed.';
	}
	if (!server_ptr.err_el) {
		var el = document.createElement('div');
		el.id = server_ptr.err_el_id;
		el.title = 'Click to close';
		el.onclick = function(ev) { server_ptr.err_el.style.display = 'none'; };
		document.body.appendChild(el);
		server_ptr.err_el = el;
	}
	server_ptr.err_el.innerHTML = '<div>Server error: <b>' + msg + '</b></div>';
	server_ptr.err_el.style.display = 'block';
	return true;
}

Server.prototype.prog_mtime = function() {
	var mtime = this.prog_server_mtime;
	for (var id in this.prog_data) {
		if (this.prog_data[id][1] > mtime) mtime = this.prog_data[id][1];
	}
	return mtime;
}

Server.prototype.add_prog = function(id, add_star) {
	if (id instanceof Array) id = id.join(',');
	console.log('server add_prog "' + id + '" ' + (add_star ? '1' : '0'));
	this.exec('prog'
		+ (add_star ? '?add=' : '?rm=') + id
		+ '&t=' + this.prog_mtime());
}

Server.prototype.set_prog = function(star_list) {
	console.log('server set_prog "' + star_list);
	this.exec('prog'
		+ '?set=' + star_list.join(',')
		+ '&t=' + this.prog_mtime());
}

Server.prototype.show_my_vote = function(id, v) {
	var v_el = document.getElementById('v' + id);
	if (!v_el) return;

	var a = v_el.getElementsByTagName('a');
	for (var i = 0, l = a.length; i < l; ++i) {
		var cl = a[i].classList;
		if (cl.contains('v_pos')) {
			switch (v) {
				case  2:  cl.add('voted');     cl.add('v2');     a[i].title = "doubleplusgood";  break;
				case  1:  cl.add('voted');     cl.remove('v2');  a[i].title = "good";            break;
				default:  cl.remove('voted');  cl.remove('v2');  a[i].title = "good";
			}
		} else if (cl.contains('v_neg')) {
			if (v < 0)  cl.add('voted');
			else        cl.remove('voted');
		}
	}
}

Server.prototype.vote = function(id, v, self) {
	self = self || this;
	if (self.pub_data) {
		var v0 = self.my_votes_data[id];
		if (v0) --self.pub_data[id][(v0 < 0) ? 0 : v0];
	}
	switch (self.my_votes_data[id]) {
		case -1: if (v < 0) v = 0; break;
		case  1: if (v > 0) v = 2; break;
		case  2: if (v > 0) v = 0; break;
	}
	console.log('server vote ' + id + ' ' + v);

	self.my_votes_data[id] = v;
	if (v && self.pub_data) {
		if (!(id in self.pub_data)) self.pub_data[id] = [0, 0, 0, 0];
		++self.pub_data[id][(v < 0) ? 0 : v];
	}
	self.show_pub_votes(id);
	self.show_my_vote(id, v);
	self.exec('vote?v=' + v + '&id=' + id + '&t=' + self.my_votes_mtime);
}

Server.prototype.vote_click = function(ev, self) {
	ev = ev || window.event;

	var bubble = false;
	var v = 0;
	switch (ev.target.classList[0]) {
		case 'v_pos': v =  1; break;
		case 'v_neg': v = -1; break;
	}
	if (v) {
		var p = ev.target.parentNode;
		if (p.parentNode.parentNode.classList.contains('expanded')) {
			self.vote(p.id.substr(1), v, self);
		} else {
			bubble = true;
		}
	}

	if (!bubble) {
		ev.cancelBubble = true;
		ev.preventDefault();
		ev.stopPropagation();
	}
}

Server.prototype.comment_click = function(ev, id, show_comments, show_form, self) {
	ev = ev || window.event;
	var c = document.getElementById('c' + id);

	if (c) c.style.display = show_comments ? 'block' : 'none';
	self.comment_link_setup(ev.target, id, !show_comments, self);

	if (show_comments) {
		self.exec('comments?id=' + id);
		if (show_form) self.show_comment_form(id, c, self);
	}

	ev.cancelBubble = true;
	ev.preventDefault();
	ev.stopPropagation();
}

Server.prototype.comment_link_setup = function(a, id, to_show, self) {
	if (to_show) {
		var p = self.pub_data[id];
		var n_comments = (p && (p[3] > 0)) ? p[3] : 0;
		switch (n_comments) {
			case  0: a.textContent = 'Add a comment...'; break;
			case  1: a.textContent = 'Show 1 comment...'; break;
			default: a.textContent = 'Show ' + n_comments + ' comments...';
		}
		a.onclick = function(ev) { self.comment_click(ev, id, true, (n_comments == 0), self); };
	} else {
		a.textContent = 'Hide comments';
		a.onclick = function(ev) { self.comment_click(ev, id, false, false, self); };
	}
}

Server.prototype.show_extras = function(id, p_el) {
	if (!this.connected) return;

	var self = this;

	var c_id = 'c' + id;
	if (!document.getElementById(c_id)) {
		var h = document.createElement('div');
		h.className = 'comments_wrap';

		var a = document.createElement('a');
		a.className = 'js-link show_comments';
		self.comment_link_setup(a, id, true, self);

		var c = document.createElement('div');
		c.className = 'comments';
		c.id = c_id;
		c.style.display = 'none';

		var pc = document.createElement('div');
		pc.className = 'prev_comments';
		c.appendChild(pc);

		h.appendChild(a);
		h.appendChild(c);
		p_el.appendChild(h);
	}

	var v_id = 'v' + id;
	var v = document.getElementById(v_id);
	if (v) v.onclick = function(ev) { self.vote_click(ev, self); };
	this.show_my_vote(id, this.my_votes_data[id]);
}

Server.prototype.show_pub_votes = function(id) {
	var v_el = document.getElementById('v' + id);
	if (!v_el) return;

	var v = this.pub_data[id];
	if (v && (v[0] || v[1] || v[2])) {
		v_el.classList.add("has_votes");
	} else {
		v_el.classList.remove("has_votes");
		if (!v) v = [0, 0, 0];
	}
	v_el.innerHTML = '<a class="v_pos" title="good">' + '+' + (v[1] + 2 * v[2]) + '</a>'
				   + ' / '
				   + '<a class="v_neg" title="not so good">' + '-' + v[0] + '</a>';
}

Server.prototype.show_comments = function(id) {
	var c_el = document.getElementById('c' + id);
	if (!c_el) return;
	var self = this;

	c_el.innerHTML = '';

	var c = this.pub_comments[id];
	if (c) for (var i in c) {
		var d = document.createElement('div');
		d.className = 'comment';
		d.innerHTML = '<b>' + c[i].name + '</b> posted:<br>' + c[i].text + '<br><i>on ' + c[i].ctime + '</i>';
		c_el.appendChild(d);
	}

	var a = document.createElement('a');
	a.className = 'js-link show_comments';
	a.textContent = 'Add a comment...';
	a.onclick = function(ev) {
		a.style.display = 'none';
		self.show_comment_form(id, c_el, self);

		ev = ev || window.event;
		ev.cancelBubble = true;
		ev.preventDefault();
		ev.stopPropagation();
	};
	c_el.appendChild(a);
}

Server.prototype.post_comment = function(f, id, self) {
	var url = self.url('comment');
	var data = 'id=' + encodeURIComponent(id)
	      + '&anon=' + (f.anon.checked ? '1' : '0')
	      + '&hide=' + (f.hide.checked ? '1' : '0')
	        + '&text=' + encodeURIComponent(f.text.value);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onload = function () {
		// do something to response
		console.log(this.responseText);
	};
	xhr.send(data);
}

Server.prototype.onmessage = function(ev) {
	ev = ev || window.event;
	console.log(ev);
	alert(ev.data);
}

Server.prototype.show_comment_form = function(id, c, self) {
	var f_id = 'f' + id;
	var f = document.getElementById(f_id);
	if (!f) {
		if (!document.getElementById('post_comment_iframe')) {
			var fi = document.createElement('iframe');
			fi.id = fi.name = 'post_comment_iframe';
			fi.src = 'javascript:false';
			fi.style.display = 'none';
			document.body.appendChild(fi);
			window.onmessage = self.onmessage;
		}
		f = document.createElement('form');
		f.id = f_id;
		f.className = 'add_comment';
		f.method = 'post';
		f.action = self.url('add_comment?id=' + encodeURIComponent(id));
		f.target = 'post_comment_iframe';
		f.innerHTML =
			  '<textarea name="text" rows="4" placeholder="' + self.connected[0] + ' posted..."></textarea>'
			+ '<input type="submit" name="submit" value="Post comment">'
			+ '<label><input type="checkbox" name="anon" value="1"> Post anonymously</label>'
			+ '<label><input type="checkbox" name="hide" value="1"> Hide from public</label>';
		f.onsubmit = function(ev) {
			f.submit.value = 'Posting...';
			f.submit.disabled = true;
			if (f.anon.checked) { f.action += '&anon=1'; f.anon.disabled = true; }
			if (f.hide.checked) { f.action += '&hide=1'; f.hide.disabled = true; }
		};
		f.onclick = function(ev) {
			ev = ev || window.event;
			ev.cancelBubble = true;
			ev.stopPropagation();
		};
		c.appendChild(f);
	} else {
		f.submit.value = 'Post comment';
		f.submit.disabled = false;
		f.anon.disabled = false;
		f.hide.disabled = false;
	}
	f.style.display = 'block';
}

Server.prototype.show_ical_link = function(p_el) {
	var html = '';
	if (!this.connected) {
		html = 'For other export options, please login.'
	} else if (this.ical) {
		if (typeof this.ical == 'string') {
			html = 'Your selection is available as an iCal (.ics) calendar at:<br><a href="' + this.ical + '">' + this.ical + '</a><br>'
				+ '<span class="hint">Note that changes you make in this guide may take some time to show in your external calendar software.</span>';
		} else {
			html = 'To make your selection viewable in your calendar app, you may also <a id="ical_link" class="js-link">make it available</a> in iCal (.ics) calendar format';
		}
	}
	if (p_el) p_el.innerHTML += '<p id="ical_text">' + html;
	else {
		var i_el = document.getElementById('ical_text');
		if (i_el) i_el.innerHTML = html;
	}
	var a = document.getElementById('ical_link');
	if (a) {
		var self = this;
		a.onclick = function() { self.exec('ical_link'); };
	}
}

Server.prototype.url = function(cmd) {
	return this.host + (cmd[0] == '/' ? '' : '/' + this.id + '/') + cmd;
}

// based on https://github.com/IntoMethod/Lightweight-JSONP/blob/master/jsonp.js
Server.prototype.exec = function(cmd) {
	if (/^(prog|vote)/.test(cmd) && !this.connected) {
		console.warn('server not connected: ' + cmd);
		return;
	}

	var script = document.createElement('script'),
		done = false,
		url = this.url(cmd),
		self = this;
	script.src = url;
	script.async = true;
	script.onerror = function(ev) { self.error('', (ev || window.event).target.src, self); };

	script.onload = script.onreadystatechange = function() {
		if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
			done = true;
			script.onload = script.onreadystatechange = null;
			if (script && script.parentNode) {
				script.parentNode.removeChild(script);
			}
		}
	};
	document.getElementsByTagName('head')[0].appendChild(script);
}

// callback for successful logout, prog, vote
Server.prototype.cb_ok = function(v) {
	var m = /^(?:https?:\/\/[^\/]+)?\/?([^?\/]*)(?:\/([^?]*))(?:\?([^?]*))?/.exec(v);
	switch (m[2]) {
		case 'logout':
			this.disconnect();
			this.prog_data = {};
			this.prog_server_mtime = 0;
			this.my_votes_data = {};
			this.my_votes_mtime = 0;
			if (this.stars) {
				this.stars.data = {};
				this.stars.write();
				init_view();
			}
			this.exec('info');
			console.log("server ok (logout): " + JSON.stringify(v));
			break;

		case 'prog':
			var t = /&server_mtime=(\d+)/.exec(m[3]);
			if (t) this.prog_server_mtime = parseInt(t[1], 10);
			console.log("server ok (prog): " + JSON.stringify(v));
			break;

		case 'vote':
			var t = /&server_mtime=(\d+)/.exec(m[3]);
			if (t) this.my_votes_mtime = parseInt(t[1], 10);
			console.log("server ok (vote): " + JSON.stringify(v));
			break;

		default:
			console.warn("server ok (???): " + JSON.stringify(v));
	}
}

// callback for reporting server errors
Server.prototype.cb_fail = function(v) {
	this.error(v.msg, v.url, this);
}

// callback for setting logged-in info
Server.prototype.cb_info = function(v) {
	console.log("server info: " + JSON.stringify(v));
	this.connected = [v.name, v.email];
	var n = (v.name == v.email) ? v.email : v.name + ' &lt;' + v.email + '&gt;';
	var html = '<div id="server_info"><span id="server_user">' + n + '</span>';
	if (v.ical) {
		this.ical = this.ical || true;
		this.show_ical_link(false);
	}
	html += '<a id="server_logout" href="' + this.url(v.logout) + '">Logout</a>';
	this.el.innerHTML = html;
	document.getElementById('server_logout').onclick = this.logout;
}

// callback for showing login options
Server.prototype.cb_login = function(v) {
	console.log("server login: " + JSON.stringify(v));
	var links = [];
	for (var cmd in v) {
		links.push('<a href="' + this.url(cmd) + '">' + v[cmd] + '</a>');
	}
	this.el.innerHTML = '<div id="login-links">'
		+ "\n&raquo; <span>Login to sync your data</span>\n"
		+ '<div id="login-disable-bg"></div>'
		+ '<div class="popup">Once you\'ve verified your e-mail address, you\'ll be able to sync your data between different browsers and devices.'
		+ "\n<ul>\n<li>" + links.join("\n<li>")
		+ "\n</ul></div></div>";
	make_popup_menu("login-links", "login-disable-bg");
}

// callback for setting starred items
Server.prototype.cb_my_prog = function(v) {
	console.log("server my_prog: " + JSON.stringify(v));
	this.prog_data = v.prog;
	if (v.t0) for (var id in this.prog_data) { this.prog_data[id][1] += v.t0; }
	if (this.stars) this.stars.sync(this.prog_data);
	else console.warn("Server.stars required for prog sync");
}

// callback for setting user's own votes
Server.prototype.cb_my_votes = function(v) {
	console.log("server my_votes: " + JSON.stringify(v));
	this.my_votes_data = v.votes;
	this.my_votes_mtime = v.mtime;
	for (var id in v.votes) this.show_my_vote(id, v.votes[id]);
}

// callback for public vote data
Server.prototype.cb_pub_data = function(p) {
	console.log("server pub_data: " + JSON.stringify(p));
	this.pub_data = p;
	for (var id in p) this.show_pub_votes(id);
}

// callback for public vote data
Server.prototype.cb_show_comments = function(id, c) {
	console.log("server show_comments (" + id + "): " + JSON.stringify(c));
	this.pub_comments[id] = c;
	this.show_comments(id);
}

Server.prototype.cb_ical_link = function(url) {
	this.ical = url;
	localStorage.setItem('konopas.'+this.id+'.ical_link', url);
	this.show_ical_link(false);
}