/**
 * ContextMenu plugin script
 */

rcube_webmail.prototype.context_menu_skip_commands = new Array('mail-checkmail', 'mail-compose', 'addressbook-add', 'addressbook-import', 'addressbook-advanced-search', 'addressbook-search-create', 'addressbook-search-delete');
rcube_webmail.prototype.context_menu_overload_commands = new Array('move', 'copy');
rcube_webmail.prototype.context_menu_hide_bound = false;
rcube_webmail.prototype.context_menu_commands = new Array();

rcube_webmail.prototype.context_menu_command_pattern = /rcmail\.command\(\'([^\']+)\',\'([^\']*)\'/;

function rcm_listmenu_init(row, props, events) {
	if (!events)
		events = {};

	var menu = rcm_callbackmenu_init(this, props, $.extend({
		'beforeactivate': function(p) {
			rcmail['rcm_selection'] = p.ref.list_selection(true);
		},
		'afteractivate': function(p) {
			p.ref.list_selection(false, rcmail['rcm_selection']);
		}
	}, events));

	var list_object = props.list_object ? props.list_object : rcmail.message_list;
	$("#" + row).bind("contextmenu", function(e) {
		if (String($(this).attr('id')).match(list_object.id_regexp)) {
			rcm_show_menu(e, this, RegExp.$1, menu);
		}
	});
}

function rcm_foldermenu_init(el, props, events) {
	if (!events)
		events = {};

	var menu = rcm_callbackmenu_init(this, $.extend({'menu_name': 'folderlist', 'list_object': null, 'check_active': true}, props), $.extend({
		'afteractivate': function(p) {
			if (rcmail.env.context_menu_source_id != rcmail.env.mailbox) {
				p.obj.find('a').removeClass('active').addClass('disabled');
			}

			if ($(p.source).children('a:first').has('span.unreadcount').length)
				p.obj.find('a.readfolder').addClass('active');

			p.obj.find('a.rcmglobal').addClass('active');
		}
	}, events));

	$(el).bind("contextmenu",function(e) {
		if (String($(this).children('a').attr('onclick')).match(/.*rcmail.command\(["']list["'],\s*["']([^"']*)["'],\s*this\).*/i)) {
			rcm_show_menu(e, this, RegExp.$1, menu);
		}
	});
}

function rcm_abookmenu_init(el, props, events) {
	if (!events)
		events = {};

	var menu = rcm_callbackmenu_init(this, $.extend({'menu_name': 'abooklist'}, props), $.extend({
		'beforeactivate': function(p) {
			p.obj.find('li.submenu').remove();
		},
		'afteractivate': function(p) {
			if (!rcmail.env.address_sources[rcmail.env.context_menu_source_id].groups || rcmail.env.address_sources[rcmail.env.context_menu_source_id].readonly)
				p.obj.find('a').removeClass('active').addClass('disabled');;
		},
		'beforeselect': function(p) {
			if (!$(p.el).hasClass('active'))
				return false;

			rcmail.env.source = rcmail.env.context_menu_source_id;
		},
		'afterselect': function(p) {
			if (rcmail.env.source = rcmail.env.context_menu_source_id)
				rcmail.command('list', rcmail.env.context_menu_source_id, p.el);
		}
	}, events));

	$(el).bind("contextmenu",function(e) {
		if (String($(this).children('a').attr('rel')).match(/([A-Z0-9\-_]+)/i)) {
			rcm_show_menu(e, this, RegExp.$1, menu);
		}
	});
}

function rcm_groupmenu_init(el, props, events) {
	if (!events)
		events = {};

	var menu = rcm_callbackmenu_init(this, $.extend({'menu_name': 'grouplist', 'list_object': null, 'check_active': true}, props), $.extend({
		'afteractivate': function(p) {
			var ids = rcmail.env.context_menu_source_id.split(':', 2);
			cur_source = ids[0];

			if (!rcmail.env.address_sources[cur_source].readonly)
				p.obj.find('a').addClass('active');
		},
		'select': function(p) {
			if (!$(p.el).hasClass('active'))
				return false;

			var prev_source = rcmail.env.source;
			var prev_group = rcmail.env.group;
			var result = false;

			var ids = rcmail.env.context_menu_source_id.split(':', 2);
			cur_source = ids[0];
			cur_id = ids[1];

			rcmail.env.source = cur_source;
			rcmail.env.group = cur_id;

			// enable the required command
			var prev_command = rcmail.commands[p.command];
			rcmail.enable_command(p.command, true);

			switch (p.command) {
				case 'group-rename':
					result = rcmail.command(p.command, p.args, p.el);

					// callback requires target is selected
					rcmail.enable_command('listgroup', true);
					rcmail.env.source = prev_source
					rcmail.env.group = prev_group;
					prev_source = cur_source;
					prev_group = cur_id;
					rcmail.command('listgroup', {'source': prev_source, 'id': prev_group}, p.el);
					rcmail.enable_command('listgroup', false);
					break;
				case 'group-delete':
					result = rcmail.command(p.command, p.args, p.el);
					break;
			}

			rcmail.enable_command(p.command, prev_command);
			rcmail.env.source = prev_source;
			rcmail.env.group = prev_group;

			return result;
		}
	}, events));

	$(el).bind("contextmenu",function(e) {
		if (String($(this).children('a').attr('rel')).match(/([A-Z0-9\-_]+(:[A-Z0-9\-_]+)?)/i)) {
			rcm_show_menu(e, this, RegExp.$1, menu);
		}
	});
}

function rcm_callbackmenu_init(obj, props, events) {
	var std_events = {
		'select': function(p) {
			if (!$(p.el).hasClass('active'))
				return false;

			if (p.ref.list_object) {
				var prev_display_next = rcmail.env.display_next;

				if (!(p.ref.list_object.selection.length == 1 && p.ref.list_object.in_selection(rcmail.env.context_menu_source_id)))
					rcmail.env.display_next = false;

				var prev_sel = p.ref.list_selection(true);
			}

			// enable the required command
			var prev_command = rcmail.commands[p.command];
			rcmail.enable_command(p.command, true);
			var result = rcmail.command(p.command, p.args, p.el);
			rcmail.enable_command(p.command, prev_command);

			if (p.ref.list_object) {
				p.ref.list_selection(false, prev_sel);
				rcmail.env.display_next = prev_display_next;
			}

			if ($.inArray(p.command, rcmail.context_menu_overload_commands) >= 0) {
				rcmail.context_menu_commands[p.command] = rcmail.commands[p.command];
				rcmail.enable_command(p.command, true);
			}

			return result;
		}
	}

	if (events)
		$.extend(std_events, events);

	if (!rcmail['rcm_' + props.menu_name]) {
		var menu = new rcube_context_menu(props);
		$.each(std_events, function(trigger, func) {
			menu.addEventListener(trigger, function(p) { func(p); });
		});
		menu.init();
		rcmail['rcm_' + props.menu_name] = menu;
	}
	else {
		var menu = rcmail['rcm_' + props.menu_name];
	}

	return menu;
}

function rcm_show_menu(e, obj, id, menu) {
	e.preventDefault();
	e.cancelBubble = true;
	if (e.stopPropagation)
		e.stopPropagation();

	rcmail.env.context_menu_source_id = id;
	menu.show(obj, e);
}

function rcube_context_menu(p) {
	this.menu_name = null;
	this.menu_source = null;
	this.is_submenu = false;
	this.check_active = false;
	this.list_object = rcmail.message_list;
	this.list_object_select = true;
	this.source_class = 'contextRow';
	this.mouseover_submenu = true;
	this.mouseover_timeout = 400;

	this.parent_menu = this;
	this.parent_object = null;
	this.container = null;
	this.original_selection = new Array();
	this.menu_selection = new Array();
	this.submenus = new Array();
	this.timers = new Array();

	// overwrite default paramaters
	if (p && typeof p === 'object')
		for (var n in p)
			this[n] = p[n];

	var ref = this;

	this.init = function() {
		if (!this.container) {
			var rows = [],
			ul = $('<ul class="toolbarmenu iconized">'),
			li = document.createElement('li'),
			link = document.createElement('a'),
			span = document.createElement('span');

			this.container = $('<div id="rcm_'+ this.menu_name +'" class="contextmenu popupmenu" style="display: none;"></div>');

			link.href = '#';
			link.className = 'icon active';
			span.className = this.is_submenu ? 'icon' : 'icon cmicon';

			if (this.is_submenu)
				this.container.addClass('rcmsubmenu');

			// loop over possible menu elements
			sources = typeof this.menu_source == 'string' ? [this.menu_source] : this.menu_source;
			$.each(sources, function(i) {
				$.each($(sources[i]).children(), function() {
					var elem, command, args;

					if ($(this).is('a')) {
						elem = $(this).clone();
					}
					else if ($(this).is('span') && $(this).children('a').length == 1) {
						elem = $(this).children('a').clone();

						if ($(this).is('span') && $(this).children('span').length == 1 && $(this).children('span:first').attr('onclick').match(rcmail.context_menu_popup_pattern)) {
							$(elem).attr('onclick', $(this).children('span').attr('onclick'));
						}
					}
					else if ($(this).is('li') && $(this).children('a').length == 1) {
						elem = $(this).children('a:first').clone();;

						if (!elem.attr('onclick') || !elem.attr('onclick').match(rcmail.context_menu_command_pattern))
							return;
					}
					else if ($(this).parent().is('a')) {
						elem = $(this).parent().clone();;
					}
					else {
						return;
					}

					// skip any element that does not look like a Roundcube button
					if (!elem.attr('onclick')) {
						return;
					}

					if (elem.attr('onclick').match(rcmail.context_menu_command_pattern)) {
						command = RegExp.$1;
						args = RegExp.$2;
					}

					// skip elements we dont need
					if ($.inArray(rcmail.env.task + '-' + command, rcmail.context_menu_skip_commands) > -1) {
						return;
					}

					var a = link.cloneNode(false), row = li.cloneNode(false);

					// add command name element
					tmp = span.cloneNode(false);
					$(tmp).text($.trim(elem.text()).length > 0 ? $.trim(elem.text()) : elem.attr('title'));
					tmp.className += elem.children('span').attr('class') ? ' ' + elem.children('span').attr('class') : '';
					a.appendChild(tmp);
					a.className += elem.attr('class') ? ' ' + elem.attr('class') : '';
					$(a).removeClass('button').removeClass('disabled');

					if (elem.attr('onclick').match(rcmail.context_menu_popup_pattern)) {
						$(a).data('popup_id', RegExp.$1);
						$(row).addClass('submenu');
						a.onclick = function(e) { ref.submenu(a, e); return false; }

						if (ref.mouseover_submenu) {
							a.onmouseover = function(e) {
								ref.timers['submenu_show'] = window.setTimeout(function() {
									ref.submenu(a, e);
								}, ref.mouseover_timeout);
							}

							a.onmouseout = function(e) { clearTimeout(ref.timers['submenu_show']);	}
						}
					}
					else {
						$(a).addClass('cmd_' + command);
						if (elem.attr('target'))
							$(a).attr('target', elem.attr('target'));

						a.onclick = function(e) {
							ref.parent_menu.triggerEvent('beforeselect', {ref: ref, el: this, command: command, args: args});
							var result = ref.parent_menu.triggerEvent('select', {ref: ref, el: this, command: command, args: args});
							ref.parent_menu.triggerEvent('afterselect', {ref: ref, el: this, command: command, args: args});

							// ensure menu is always hidden after action (for Safari)
							ref.hide(e);

							return result;
						}

						if (ref.mouseover_submenu && !ref.is_submenu) {
							a.onmouseover = function(e) {
								ref.timers['submenu_hide'] = window.setTimeout(function() {
									$('div.rcmsubmenu').hide();
									$('#folder-selector').hide();
								}, ref.mouseover_timeout);
							}

							a.onmouseout = function(e) { clearTimeout(ref.timers['submenu_hide']); }
						}
					}

					elem.addClass('rcm_elem_' + elem.attr('id'));
					$(a).addClass('rcm_elem_' + elem.attr('id'));

					row.appendChild(a);
					ref.parent_menu.triggerEvent('insertitem', {item: row});
					rows.push(row);
				});
			});

			ul.append(rows).appendTo(this.container);
			this.parent_menu.triggerEvent('init', {ref: this, obj: this.container});
			this.container.appendTo($('body'));

			if (!rcmail.env.context_menu_hide_bound) {
				// Hide bindings
				$(document).bind('click', function(e) {
					ref.hide(e);
				});

				// Hide menu after clicks in iframes (eg. preview pane)
				$('iframe').load(function() {
					// this == iframe
					var doc = this.contentDocument ? this.contentDocument : this.contentWindow ? this.contentWindow.document : null;
					doc.onclick = function() { $(document).click(); };
				});

				$('iframe').contents().mouseup( function() { $(document).click(); } );

				rcmail.env.contextmenu_hide_bound = true;
			}
		}
	};

	this.show = function(obj, e) {
		if (obj) {
			this.hide(e);
			$(obj).addClass(this.source_class);
		}

		this.parent_menu.triggerEvent('beforeactivate', {ref: this, obj: this.container, source: obj});
		if (ref.check_active)
			typeof ref.menu_source == 'string' ? $(ref.menu_source).parent().show() : $.each(ref.menu_source, function(i) { $(ref.menu_source[i]).parent().show(); } );

		$.each(this.container.find('a'), function() {
			if (btn = $(this).attr('class').match(/rcm_elem_([a-z0-9]+)/)) {
				$(this).parent('li')[$('#' + btn[1]).is(':visible') ? 'show' : 'hide']();
				$(this).removeClass('active').removeClass('disabled');

				if ($('#' + btn[1]).hasClass('disabled') && ref.list_object && ref.list_object.selection.length > 1) {
					$(this).addClass('disabled');
				}
				else if (!ref.check_active || $('#' + btn[1]).hasClass('active')) {
					$(this).addClass('active');
				}
			}
		});
		if (ref.check_active)
			typeof ref.menu_source == 'string' ? $(ref.menu_source).parent().hide() : $.each(ref.menu_source, function(i) { $(ref.menu_source[i]).parent().hide(); } );

		this.parent_menu.triggerEvent('afteractivate', {ref: this, obj: this.container, source: obj});

		// position menu on the screen
		if (this.is_submenu) {
			rcmail.element_position(this.container, this.parent_object);
		}
		else {
			this.position(e, this.container);
		}

		this.container.show();
	};

	this.hide = function(e) {
		// use window.event when e is not defined (legacy support for IE8)
		var target = e ? e.target : window.event.srcElement;
		if (!$(target).is('.folder-selector-link')) {
			$('.' + this.source_class).removeClass(this.source_class);
			$('div.contextmenu').hide();
			$('#folder-selector').hide();

			for (var i in rcmail.context_menu_commands) {
				if (!rcmail.context_menu_commands[i]) {
					rcmail.enable_command(i, false);
				}
			}

			rcmail.context_menu_commands = new Array();
		}
	};

	this.submenu = function(link, e) {
		// use window.event when e is not defined (legacy support for IE8)
		if (!e)
			e = window.event;

		if (e) {
			e.cancelBubble = true;
			if (e.stopPropagation)
				e.stopPropagation();
		}

		$('.rcmsubmenu').hide();
		$('#folder-selector').hide();

		var id = rcmail.gui_containers[$(link).data('popup_id')] ? rcmail.gui_containers[$(link).data('popup_id')].attr('id') : $(link).data('popup_id');
		if (!this.submenus[id]) {
			this.submenus[id] = new rcube_context_menu({'menu_name': id, 'menu_source': '#' + id + ' ul', 'parent_menu': this, 'parent_object': link, 'is_submenu': true, 'check_active': true, 'list_object': this.list_object});
			this.submenus[id].init();
		}

		this.submenus[id].show(null, e);
	};

	this.position = function(e, menu) {
		// temporarily show element to calculate its size
		this.container.css({left: '-1000px', top: '-1000px'}).show();

		var win = $(window),
		win_height = win.height(),
		elem_height = $(menu).height(),
		elem_width = $(menu).width(),
		top = e.pageY,
		left = e.pageX;

		if (top + elem_height > win_height) {
			top -= elem_height;

			if (top < 0)
				top = Math.max(0, (win_height - elem_height) / 2);
		}

		if (left + elem_width > win.width())
			left -= elem_width;

		menu.css({left: left + 'px', top: top + 'px'});
	};

	this.list_selection = function(show, prev_sel) {
		if (show) {
			if (this.list_object.selection.length == 0 || !this.list_object.in_selection(rcmail.env.context_menu_source_id)) {
				prev_sel = this.list_object.get_selection();
				this.list_object.highlight_row(rcmail.env.context_menu_source_id, true);

				for (var i in prev_sel)
					this.list_object.highlight_row(prev_sel[i], true);

				if (this.list_object_select)
					this.list_object.triggerEvent('select');
			}
		}
		else if (prev_sel) {
			for (var i in prev_sel)
				this.list_object.highlight_row(prev_sel[i], true);

			this.list_object.highlight_row(rcmail.env.context_menu_source_id, true);

			if (this.list_object_select)
				this.list_object.triggerEvent('select');
		}

		return prev_sel;
	};

	this.addEventListener = rcube_event_engine.prototype.addEventListener;
	this.removeEventListener = rcube_event_engine.prototype.removeEventListener;
	this.triggerEvent = rcube_event_engine.prototype.triggerEvent;
};

function rcm_override_mailbox_command(props, before) {
	if ($('div.contextmenu').is(':visible') && $.inArray(props.action, rcmail.context_menu_overload_commands) >= 0) {
		if (before) {
			rcmail.env.context_menu_prev_sel = null;
			if (rcmail.message_list.selection.length == 0 || !rcmail.message_list.in_selection(rcmail.env.context_menu_source_id)) {
				rcmail.env.context_menu_prev_sel = rcmail.message_list.get_selection();
				rcmail.message_list.highlight_row(rcmail.env.context_menu_source_id, true);

				for (var i in rcmail.env.context_menu_prev_sel)
					rcmail.message_list.highlight_row(rcmail.env.context_menu_prev_sel[i], true);

				rcmail.message_list.triggerEvent('select');
			}
		}
		else if (rcmail.env.context_menu_prev_sel) {
			for (var i in rcmail.env.context_menu_prev_sel)
				rcmail.message_list.highlight_row(rcmail.env.context_menu_prev_sel[i], true);

			rcmail.message_list.highlight_row(rcmail.env.context_menu_source_id, true);
			rcmail.message_list.triggerEvent('select');
		}
	}
}

$(document).ready(function() {
	if (window.rcmail) {
		rcmail.register_command('plugin.contextmenu.readfolder', function(props, obj) {
			var lock = rcmail.set_busy(true, 'loading');
			rcmail.http_request('plugin.contextmenu.readfolder', {'_mbox': rcmail.env.context_menu_source_id, '_cur': rcmail.env.mailbox}, lock);
		}, false);

		rcmail.register_command('plugin.contextmenu.collapseall', function(props, obj) {
			$("#mailboxlist div.expanded").each(function() { $(this).click(); });
		}, false);

		rcmail.register_command('plugin.contextmenu.expandall', function(props, obj) {
			$("#mailboxlist div.collapsed").each(function() { $(this).click(); });
		}, false);

		rcmail.register_command('plugin.contextmenu.openfolder', function(props, obj) {
			var button_id = rcmail.buttons['plugin.contextmenu.openfolder'][0].id;

			rcube_find_object(button_id).href = '?_task=mail&_mbox='+urlencode(rcmail.env.context_menu_source_id);
			rcmail.sourcewin = window.open(rcube_find_object(button_id).href);
			if (rcmail.sourcewin)
				window.setTimeout(function() { rcmail.sourcewin.focus(); }, 20);

			rcube_find_object(button_id).href = '#';
		}, false);
	}
});