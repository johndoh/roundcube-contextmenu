/**
 * ContextMenu plugin script
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2009-2014 Philip Weir
 *
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */

rcube_webmail.prototype.context_menu_skip_commands = new Array('mail-checkmail', 'mail-compose', 'addressbook-add', 'addressbook-import', 'addressbook-advanced-search', 'addressbook-search-create');
rcube_webmail.prototype.context_menu_overload_commands = new Array('move', 'copy');
rcube_webmail.prototype.context_menu_commands = new Array();
rcube_webmail.prototype.context_menu_popup_menus = new Array();
rcube_webmail.prototype.context_menu_popup_commands = {};

rcube_webmail.prototype.context_menu_command_pattern = /rcmail\.command\(\'([^\']+)\',\s?\'([^\']*)\'/;

function rcm_listmenu_init(row, props, events) {
	if (!events)
		events = {};

	var menu = rcm_callbackmenu_init(props, $.extend({
		'beforeactivate': function(p) {
			rcmail.env.contextmenu_selection = p.ref.list_selection(true);
		},
		'afteractivate': function(p) {
			p.ref.menu_selection = p.ref.list_object.get_selection();
			p.ref.list_selection(false, rcmail.env.contextmenu_selection);
		}
	}, events));

	var list_object = props.list_object ? props.list_object : rcmail.message_list;
	$("#" + row).on("contextmenu", function(e) {
		if (uid = list_object.get_row_uid(this)) {
			rcm_show_menu(e, this, uid, menu);
		}
	});
}

function rcm_foldermenu_init(el, props, events) {
	if (!events)
		events = {};

	var menu = rcm_callbackmenu_init($.extend({'menu_name': 'folderlist', 'list_object': null}, props), $.extend({
		'beforeactivate': function(p) {
			if (rcmail.env.contextmenu_messagecount_request) {
				rcmail.env.contextmenu_messagecount_request.abort();
			}
			rcmail.env.contextmenu_messagecount_request = null;
		},
		'activate': function(p) {
			if ($.inArray(p.command, Array('expunge', 'purge', 'mark-all-read')) >= 0) {
				// disable the commands by default
				$(p.el).addClass('disabled').removeClass('active');

				// if menu is opened on current folder (or special mark-all-read command) then enable the commands same as in UI
				if ((rcmail.env.context_menu_source_id == rcmail.env.mailbox || p.command == 'mark-all-read') && rcm_check_button_state(p.btn, true)) {
					$(p.el).addClass('active').removeClass('disabled');
				}
				// if menu is opened on difference folder then get message count for the folder
				else if (rcmail.env.context_menu_source_id != rcmail.env.mailbox && !rcmail.env.contextmenu_messagecount_request) {
					// folder check called async to prevent slowdown on menu load
					rcmail.env.contextmenu_messagecount_request = $.ajax({
						type: 'POST', url: rcmail.url('plugin.contextmenu.messagecount'), data: {'_mbox': rcmail.env.context_menu_source_id}, dataType: 'json', async: true,
						success: function(data) {
							if (data.messagecount > 0 && $('#rcm_folderlist').is(':visible')) {
								// override the environment to check if commands should be abled
								var temp_exists = rcmail.env.exists;
								var temp_mailbox = rcmail.env.mailbox;
								rcmail.env.exists = data.messagecount;
								rcmail.env.mailbox = rcmail.env.context_menu_source_id;

								$('#rcm_folderlist').find('a.cmd_expunge').addClass('active').removeClass('disabled');
								if (rcmail.purge_mailbox_test()) {
									$('#rcm_folderlist').find('a.cmd_purge').addClass('active').removeClass('disabled');
								}

								rcmail.env.exists = temp_exists;
								rcmail.env.mailbox = temp_mailbox;
							}
						}
					});
				}
			}
		},
		'beforecommand': function(p) {
			if (rcmail.env.context_menu_source_id != rcmail.env.mailbox && $.inArray(p.command, Array('expunge', 'purge')) >= 0) {
				var result = rcmail[p.command + '_mailbox'](rcmail.env.context_menu_source_id);

				// update the unread count and trash icon
				if (p.command == 'purge' && result !== false) {
					rcmail.set_unread_count(rcmail.env.context_menu_source_id, 0, false);

					if (rcmail.env.context_menu_source_id == rcmail.env.trash_mailbox)
						rcmail.set_trash_count(0);
				}

				return {'abort': true, 'result': true};
			}
			else if (rcmail.env.context_menu_source_id != rcmail.env.mailbox && p.command == 'mark-all-read') {
				rcmail.mark_all_read(rcmail.env.context_menu_source_id);
				return {'abort': true, 'result': true};
			}
		}
	}, events));

	$(el).click(function(e) {
		// hide menu when changing folder
		menu.hide(e);
	})
	.on("contextmenu", function(e) {
		var source = $(this).children('a');

		// remove focus (and keyboard nav highlighting) from A
		source.blur();

		if (source.attr('onclick') && source.attr('onclick').match(rcmail.context_menu_command_pattern)) {
			rcm_show_menu(e, this, RegExp.$2, menu);
		}
	});
}

function rcm_abookmenu_init(el, props, events) {
	if (!events)
		events = {};

	var menu = rcm_callbackmenu_init($.extend({'menu_name': 'abooklist'}, props), $.extend({
		'beforeactivate': function(p) {
			p.ref.container.find('li.submenu').remove();
		},
		'activate': function(p) {
			var ids = rcmail.env.context_menu_source_id.split(':', 2);
			cur_source = ids[0];

			if (p.command == 'group-create') {
				// addressbook
				if ($(p.source).hasClass('addressbook') && rcmail.env.address_sources[cur_source].groups && !rcmail.env.address_sources[cur_source].readonly) {
					$(p.el).addClass('active').removeClass('disabled');
				}
				else {
					$(p.el).addClass('disabled').removeClass('active');
				}
			}
			else if (p.command == 'group-rename' || p.command == 'group-delete') {
				// group
				if ($(p.source).hasClass('contactgroup') && !rcmail.env.address_sources[cur_source].readonly) {
					$(p.el).addClass('active').removeClass('disabled');
				}
				else {
					$(p.el).addClass('disabled').removeClass('active');
				}
			}
			else if (p.command == 'search-delete') {
				// saved search
				if ($(p.source).hasClass('contactsearch')) {
					$(p.el).addClass('active').removeClass('disabled');
				}
				else {
					$(p.el).addClass('disabled').removeClass('active');
				}
			}
		},
		'command': function(p) {
			if (!$(p.el).hasClass('active'))
				return;

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
				case 'search-delete':
					var result = false;

					if ($(p.ref.selected_object).children('a').attr('rel')) {
						var prev_search_id = rcmail.env.search_id;
						var prev_search_request = rcmail.env.search_request;
						rcmail.env.search_request = true;
						rcmail.env.search_id = $(p.ref.selected_object).children('a').attr('rel').replace('S', '');

						result = rcmail.command(p.command, p.args, p.el, p.evt);

						rcmail.env.search_request = prev_search_request;
						rcmail.env.search_id = prev_search_id;
					}
					break;
				default:
					result = rcmail.command(p.command, p.args, p.el, p.evt);
					break;
			}

			rcmail.enable_command(p.command, prev_command);
			rcmail.env.source = prev_source;
			rcmail.env.group = prev_group;

			return result;
		}
	}, events));

	$(el).click(function(e) {
		// hide menu when changing address book
		menu.hide(e);
	})
	.on("contextmenu",function(e) {
		var source = $(this).children('a');

		// remove focus (and keyboard nav highlighting) from A
		source.blur();

		if (source.attr('rel') && source.attr('rel').match(/([A-Z0-9\-_]+(:[A-Z0-9\-_]+)?)/i)) {
			rcm_show_menu(e, this, RegExp.$1, menu);
		}
	});
}

function rcm_callbackmenu_init(props, events) {
	var std_events = {
		'command': function(p) {
			if (!$(p.el).hasClass('active'))
				return;

			if (p.ref.list_object) {
				var prev_display_next = rcmail.env.display_next;

				if (!(p.ref.list_object.selection.length == 1 && p.ref.list_object.in_selection(rcmail.env.context_menu_source_id)))
					rcmail.env.display_next = false;

				var prev_sel = p.ref.list_selection(true);
			}

			// enable the required command
			var prev_command = rcmail.commands[p.command];
			rcmail.enable_command(p.command, true);
			var result = rcmail.command(p.command, p.args, p.el, p.evt);
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
		},
		'activate': function(p) {
			$(p.el).addClass(p.enabled ? 'active' : 'disabled');
		}
	}

	if (events)
		$.extend(std_events, events);

	if (!rcmail.env.contextmenus[props.menu_name]) {
		var menu = new rcube_context_menu(props);
		$.each(std_events, function(trigger, func) {
			menu.addEventListener(trigger, function(p) { return func(p); });
		});
		menu.init();
		rcmail.env.contextmenus[props.menu_name] = menu;
	}
	else {
		var menu = rcmail.env.contextmenus[props.menu_name];
	}

	return menu;
}

function rcm_show_menu(e, obj, id, menu) {
	// if contextmenus have been disabled then show browser context menu as normal
	if (!rcmail.env.contextmenu)
		return true;

	e.preventDefault();
	e.cancelBubble = true;
	if (e.stopPropagation)
		e.stopPropagation();

	// hide any other open menus
	for (var i = 0; i < rcmail.menu_stack.length; i++) {
		rcmail.hide_menu(rcmail.menu_stack[i], e);
	}

	rcmail.env.context_menu_source_id = id;
	menu.show(obj, e);
}

function rcm_hide_menu(e, sub_only) {
	$.each($(sub_only ? '.rcmsubmenu' : 'div.contextmenu'), function() {
		if ($(this).is(':visible')) {
			$(this).hide();
			rcmail.triggerEvent('menu-close', { name: $(this).attr('id'), props:{ menu: $(this).attr('id') }, originalEvent: e });
		}
	});

	// close popup menus opened by the contextmenu
	for (var i = rcmail.context_menu_popup_menus.length - 1; i >= 0; i--) {
		rcmail.hide_menu(rcmail.context_menu_popup_menus[i], e);
		rcmail.context_menu_popup_menus.pop();
	}
}

function rcube_context_menu(p) {
	this.menu_name = null;
	this.menu_source = null;
	this.list_object = rcmail.message_list;
	this.source_class = 'contextRow';
	this.mouseover_timeout = 400;

	this.is_submenu = false;
	this.parent_menu = this;
	this.parent_object = null;
	this.selected_object = null
	this.container = null;
	this.original_selection = new Array();
	this.menu_selection = new Array();
	this.submenus = new Array();
	this.timers = new Array();

	// overwrite default parameters
	if (p && typeof p === 'object')
		for (var n in p)
			this[n] = p[n];

	var ref = this;

	this.init = function() {
		if (!this.container) {
			rcmail.triggerEvent('contextmenu_init', this);

			this.container = $('<div id="rcm_'+ this.menu_name +'" style="display: none;"></div>');
			this.container.addClass('contextmenu popupmenu');
			this.container.addClass(this.is_submenu ? 'rcmsubmenu' : 'rcmmainmenu');

			var rows = [], ul = $('<ul role="menu">'),
			li = $('<li>'),	link = $('<a>'), span = $('<span>');

			ul.addClass('toolbarmenu iconized');
			li.attr('role', 'menuitem');

			link.attr('href', '#');
			link.addClass('icon active');
			link.attr('role', 'button');
			link.attr('tabindex', '-1');
			link.attr('aria-disabled', 'true');

			span.addClass('icon');

			// loop over possible menu elements and build settings object
			sources = typeof this.menu_source == 'string' ? [this.menu_source] : this.menu_source;
			this.menu_source = {}
			$.each(sources, function(i) {
				var source_elements;
				if (typeof sources[i] == 'string') {
					ref.menu_source[sources[i]] = {
						'toggle': !$(sources[i]).is(':visible')
					};
					source_elements = $(sources[i]).children();
				}
				else {
					ref.menu_source[i] = {
						'toggle': false
					};
					source_elements = $(sources[i]);
				}

				ul.attr('aria-labelledby', $(sources[i]).attr('aria-labelledby'));

				$.each(source_elements, function() {
					var elem, command, args;

					if ($(this).is('a')) {
						elem = $(this).clone();
					}
					else if ($(this).is('span') && $(this).children().length == 2) {
						elem = $(this).children(':first').clone();

						if ($(this).children(':last').attr('onclick').match(rcmail.context_menu_popup_pattern)) {
							$(elem).attr('onclick', $(this).children(':last').attr('onclick'));
						}
					}
					else if ($(this).is('li') && $(this).children('a').length == 1) {
						elem = $(this).children('a').clone();

						if (!elem.attr('onclick') || !elem.attr('onclick').match(rcmail.context_menu_command_pattern))
							return;
					}
					else if ($(this).parent().is('a')) {
						elem = $(this).parent().clone();
					}
					else if (this.command && this.label) {
						elem = $('<a>').attr('href', '#')
								.attr('id', 'rcmjs')
								.attr('onclick', "return rcmail.command('"+ this.command +"','"+ this.props +"',this,event)")
								.addClass(this.classes)
								.html(this.label);
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

					// skip elements we don't need
					if ($.inArray(rcmail.env.task + '-' + command, rcmail.context_menu_skip_commands) > -1 || elem.hasClass('rcm_ignore')) {
						return;
					}

					var a = link.clone(), row = li.clone();

					// add command name element
					tmp = span.clone();
					tmp.text($.trim(elem.text()).length > 0 ? $.trim(elem.text()) : elem.attr('title'));
					tmp.addClass(elem.children('span').attr('class'));
					a.append(tmp);
					a.addClass(elem.attr('class'));
					a.removeClass('button').removeClass('disabled');
					a.addClass('rcm_elem_' + elem.attr('id'));

					if (elem.attr('onclick').match(rcmail.context_menu_popup_pattern)) {
						a.data('command', RegExp.$1);
						a.append($('<span>').addClass('right-arrow'));
						row.addClass('submenu');
						a.click(function(e) {
							if (!$(this).hasClass('active'))
								return;

							ref.submenu(a, e);
							return false;
						});

						if (ref.mouseover_timeout > -1) {
							a.mouseover(function(e) {
								if (!$(this).hasClass('active'))
									return;

								ref.timers['submenu_show'] = window.setTimeout(function(a, e) {
									ref.submenu(a, e);
								}, ref.mouseover_timeout, a, e);
							});

							a.mouseout(function(e) {
								if (!$(this).hasClass('active'))
									return;

								$(this).blur(); clearTimeout(ref.timers['submenu_show']);
							});
						}
					}
					else {
						a.addClass('cmd_' + command);
						a.data('command', command);
						if (elem.attr('target'))
							a.attr('target', elem.attr('target'));

						a.click(function(e) {
							if ($(this).parents('.rcmsubmenu').length == 0) {
								rcm_hide_menu(e, true);
								clearTimeout(ref.timers['submenu_hide']);
							}

							var cur_popups = rcmail.menu_stack.length;
							var result;

							var callback = ref.parent_menu.triggerEvent('beforecommand', {ref: ref, el: this, command: command, args: args});
							if (!callback || !callback.abort) {
								result = ref.parent_menu.triggerEvent('command', {ref: ref, el: this, command: command, args: args, evt: e});
							}
							else {
								result = callback.result;
							}

							if (!callback || !callback.skipaftercommand)
								ref.parent_menu.triggerEvent('aftercommand', {ref: ref, el: this, command: command, args: args});

							if (rcmail.menu_stack.length > cur_popups) {
								var popup_name = rcmail.menu_stack[rcmail.menu_stack.length - 1];
								rcmail.context_menu_popup_menus.push(popup_name);

								// make sure enabled commands match context menu message selection
								$.each(rcmail.context_menu_popup_commands[popup_name], function(cmd, state) {
									rcmail.enable_command(cmd, state);
								});
							}

							// ensure menu is always hidden after action (for Safari)
							ref.hide(e);

							return result;
						});

						if (ref.mouseover_timeout > -1 && !ref.is_submenu) {
							a.mouseover(function(e) {
								ref.timers['submenu_hide'] = window.setTimeout(function(e) {
									rcm_hide_menu(e, true);
								}, ref.mouseover_timeout, e);
							});

							a.mouseout(function(e) { clearTimeout(ref.timers['submenu_hide']); });
						}
					}

					row.append(a);
					ref.parent_menu.triggerEvent('insertitem', {item: row});
					rows.push(row);
				});
			});

			ul.append(rows).appendTo(this.container);
			this.parent_menu.triggerEvent('init', {ref: this});
			this.container.appendTo($('body'));
		}
	};

	this.show = function(obj, e) {
		if (obj) {
			this.hide(e);
		}

		var callback = this.parent_menu.triggerEvent('beforeactivate', {ref: this, source: obj});
		if (!callback || !callback.abort) {
			if (obj) {
				$(obj).addClass(this.source_class);
			}

			$.each(ref.menu_source, function(id, props) {
				if (props.toggle) {
					$(id).parent().show();
				}
			});

			$.each(this.container.find('a'), function() {
				if ($(this).hasClass('rcm_active')) {
					$(this).addClass('active');
				}
				else if (btn = $(this).attr('class').match(/rcm_elem_([a-z0-9]+)/)) {
					$(this).parent('li')[(btn[1] == 'rcmjs' || $('#' + btn[1]).is(':visible')) ? 'show' : 'hide']();
					$(this).removeClass('active').removeClass('disabled');

					var enabled = false;
					if (!rcm_check_button_state(btn[1], false) && (!ref.is_submenu || rcm_check_button_state(btn[1], true))) {
						enabled = true;
					}

					var ret = ref.parent_menu.triggerEvent('activate', {el: this, btn: btn[1], source: obj, command: $(this).data('command'), enabled: enabled});
					if (ret === true) {
						$(this).addClass('active').removeClass('disabled');
					}
					else if (ret === false) {
						$(this).addClass('disabled').removeClass('active');
					}
				}
			});

			$.each(ref.menu_source, function(id, props) {
				if (props.toggle) {
					$(id).parent().hide();
				}
			});

			this.parent_menu.triggerEvent('afteractivate', {ref: this, source: obj});
		}

		// position menu on the screen
		if (this.is_submenu) {
			rcmail.element_position(this.container, this.parent_object);
		}
		else {
			this.position(e, this.container);
		}

		if (!callback || callback.show !== false) {
			this.selected_object = obj;
			this.container.show();
			rcmail.triggerEvent('menu-open', { name: this.container.attr('id'), props:{ menu: this.container.attr('id') }, originalEvent: e });
		}
	};

	this.hide = function(e) {
		// use window.event when e is not defined (legacy support for IE8)
		var target = e ? e.target : window.event.srcElement;

		if ($('div.contextmenu').is(':visible') && (rcmail.context_menu_popup_menus.length == 0 || $(target).parents('div.contextmenu').length == 0)) {
			this.selected_object = null;
			$('.' + this.source_class).removeClass(this.source_class);
			rcm_hide_menu(e);

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

		rcm_hide_menu(e, true);

		var id = rcmail.gui_containers[$(link).data('command')] ? rcmail.gui_containers[$(link).data('command')].attr('id') : $(link).data('command');
		if (!this.submenus[id]) {
			var elem = !$('#' + id).is('ul') ? '#' + id + ' ul' : '#' + id; // check if the container returned is a ul else there should be one directly beneath it
			this.submenus[id] = new rcube_context_menu({'menu_name': id, 'menu_source': elem, 'parent_menu': this, 'parent_object': link, 'is_submenu': true, 'list_object': this.list_object});
			this.submenus[id].init();
		}

		this.submenus[id].show(null, e);
	};

	this.position = function(e, menu) {
		// temporarily show element to calculate its size
		menu.css({left: '-1000px', top: '-1000px'}).show();

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

		menu.hide();
		menu.css({left: left + 'px', top: top + 'px'});
	};

	this.list_selection = function(show, prev_sel) {
		// make the system think no preview pane exists while we do some fake message selects
		// to enable/disable relevent commands for current selection
		var prev_contentframe = rcmail.env.contentframe;
		rcmail.env.contentframe = null;

		if (show) {
			if (this.list_object.selection.length == 0 || !this.list_object.in_selection(rcmail.env.context_menu_source_id)) {
				prev_sel = this.list_object.get_selection();
				this.list_object.highlight_row(rcmail.env.context_menu_source_id, true);

				for (var i in prev_sel)
					this.list_object.highlight_row(prev_sel[i], true);

				this.list_object.triggerEvent('select');
			}
			else {
				// trigger a select event to update active commands
				// use case: select multiple message, open contextmenu; open contextmenu on a message not in selection; open contextmenu on selection
				this.list_object.triggerEvent('select');
			}
		}
		else if (prev_sel) {
			for (var i in prev_sel)
				this.list_object.highlight_row(prev_sel[i], true);

			this.list_object.highlight_row(rcmail.env.context_menu_source_id, true);
			this.list_object.triggerEvent('select');
		}

		rcmail.env.contentframe = prev_contentframe;

		return prev_sel;
	};

	this.addEventListener = rcube_event_engine.prototype.addEventListener;
	this.removeEventListener = rcube_event_engine.prototype.removeEventListener;
	this.triggerEvent = rcube_event_engine.prototype.triggerEvent;
};

function rcm_override_mailbox_command(menu, props, before) {
	if ($('div.contextmenu').is(':visible') && $.inArray(props.action, rcmail.context_menu_overload_commands) >= 0) {
		if (before) {
			rcmail.env.context_menu_prev_display_next = rcmail.env.display_next;
			if (!(menu.list_object.selection.length == 1 && menu.list_object.in_selection(rcmail.env.context_menu_source_id)))
				rcmail.env.display_next = false;

			rcmail.env.context_menu_prev_sel = menu.list_selection(true);
		}
		else if (rcmail.env.context_menu_prev_sel) {
			menu.list_selection(false, rcmail.env.context_menu_prev_sel);
			rcmail.env.display_next = rcmail.env.context_menu_prev_display_next;
		}
	}
}

function rcm_check_button_state(btn, active) {
	var classes = active ? rcmail.context_menu_button_active_class : rcmail.context_menu_button_disabled_class;
	var found = false;

	$.each(classes, function(i) {
		if ($('#' + btn).hasClass(classes[i])) {
			found = true;

			// stop processing
			return false;
		}
	});

	return found;
}

function rcm_addressbook_selector(event, command, callback) {
	var container = rcmail.rcm_addressbook_selector_element;

	if (!container) {
		var rows = [],
			ul = $('<ul class="toolbarmenu">');

		container = $('<div id="addressbook-selector" class="popupmenu"></div>');

		// loop over address books
		$.each(rcmail.env.address_sources, function() {
			if (!this.readonly) {
				rows.push(rcm_addressbook_selector_item(this));

				if (this.groups) {
					var ref = this;
					$.each(rcmail.env.contactgroups, function() {
						rows.push(rcm_addressbook_selector_item(this, ref.id));
					});
				}
			}
		});

		ul.append(rows).appendTo(container);

		// temporarily show element to calculate its size
		container.css({left: '-1000px', top: '-1000px'})
			.appendTo($('body')).show();

		// set max-height if the list is long
		if (rows.length > 10)
			container.css('max-height', $('li', container)[0].offsetHeight * 10 + 9);

		// register delegate event handler for folder item clicks
		container.on('click', 'a.active', function(e) {
			container.data('callback')(this, container.data('command'), e);
			return false;
		});

		rcmail.rcm_addressbook_selector_element = container;
	}

	container.data('command', command);
	container.data('callback', callback);

	// customize menu for move or copy
	container.find('li').show();

	// search result may contain contacts from many sources, but if there is only one...
	var source = rcmail.env.source;
	if (source == '' && rcmail.env.selection_sources.length == 1)
		source = rcmail.env.selection_sources[0];

	// hide currently open address book from menu
	if (source) {
		$.each(container.find('a'), function() {
			if (($(this).data('source') && $(this).data('source') == source) || $(this).data('id') == source)
				$(this).parent('li').hide();
		});
	}

	// position menu on the screen
	rcmail.show_menu('addressbook-selector', true, event);
}

function rcm_group_selector(event, command, callback) {
	var container = rcmail.rcm_addressgroup_selector_element;

	if (!container) {
		var rows = [],
			ul = $('<ul class="toolbarmenu">');

		container = $('<div id="addressgroup-selector" class="popupmenu"></div>');

		// loop over address books
		$.each(rcmail.env.address_sources, function() {
			if (this.id === rcmail.env.source) {
				var ref = this;
				$.each(rcmail.env.contactgroups, function() {
					rows.push(rcm_addressbook_selector_item(this, ref.id));
				});
			}
		});

		ul.append(rows).appendTo(container);

		// remove indent added by rcm_addressbook_selector_item()
		$(ul).find('a').removeAttr('style');

		// temporarily show element to calculate its size
		container.css({left: '-1000px', top: '-1000px'})
			.appendTo($('body')).show();

		// set max-height if the list is long
		if (rows.length > 10)
			container.css('max-height', $('li', container)[0].offsetHeight * 10 + 9);

		// register delegate event handler for folder item clicks
		container.on('click', 'a.active', {cmd: command}, function(e) {
			container.data('callback')(this, e);
			return false;
		});

		rcmail.rcm_addressgroup_selector_element = container;
	}

	container.data('callback', callback);

	// customize menu for move or copy
	container.find('li').show();

	// hide currently open group from menu
	if (rcmail.env.group) {
		$.each(container.find('a'), function() {
			if ($(this).data('id') == rcmail.env.group)
				$(this).parent('li').hide();
		});
	}

	// position menu on the screen
	rcmail.show_menu('addressgroup-selector', true, event);
}

function rcm_addressbook_selector_item(obj, abook_id) {
	if (abook_id && abook_id === obj.source || !abook_id) {
		var a = $('<a>').attr('href', '#').addClass('icon'),
			row = $('<li>');

		if (obj.type == 'group') {
			a.addClass('active contactgroup')
			a.data('source', obj.source);
			a.data('id', obj.id);
			a.css('padding-left', '16px');
		}
		else {
			a.addClass('addressbook active').data('id', obj.id);
		}

		// add address book name element
		a.append($('<span>').text(obj.name));

		return row.append(a);
	}
}

$(document).ready(function() {
	if (window.rcmail) {
		rcmail.env.contextmenus = {};

		rcmail.addEventListener('init', function() {
			// no need to reattach events inside iframe
			if (rcmail.is_framed())
				return;

			var body_mouseup = function(e) { $.each(rcmail.env.contextmenus, function() { this.hide(e); }); };
			$(document.body).on('click contextmenu', body_mouseup);

			// Hide menu after clicks in iframes (eg. preview pane)
			$('iframe').on('load', function(e) {
				try { $(this.contentDocument || this.contentWindow).on('mouseup', body_mouseup) }
				catch (e) { /* catch possible "Permission denied" error in IE */ }
			})
			.contents().on('mouseup', body_mouseup);
		});

		if ((rcmail.env.task == 'mail' || rcmail.env.task == 'addressbook') && rcmail.env.action == '') {
			// special handeling for move/copy functions (folder/address book selector)
			rcmail.addEventListener('actionbefore', function(props) {
				var menu = rcmail.env.task == 'addressbook' ? rcmail.env.contextmenus['contactlist'] : rcmail.env.contextmenus['messagelist'];
				rcm_override_mailbox_command(menu, props, true);
			});

			rcmail.addEventListener('actionafter', function(props) {
				var menu = rcmail.env.task == 'addressbook' ? rcmail.env.contextmenus['contactlist'] : rcmail.env.contextmenus['messagelist'];
				rcm_override_mailbox_command(menu, props, false);
			});
		}

		if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
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

		if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
			// address book selector
			rcmail.addEventListener('actionbefore', function(props) {
				if ((props.action == 'move' || props.action == 'copy') && props.props == '') {
					rcm_addressbook_selector(props.originalEvent, props.action, function(obj, cmd, evt) {
						// search result may contain contacts from many sources, but if there is only one...
						var source = rcmail.env.source;
						if (source == '' && rcmail.env.selection_sources.length == 1)
							source = rcmail.env.selection_sources[0];

						if ($(obj).data('source')) {
							rcmail.command(cmd, rcmail.env.contactgroups['G' + $(obj).data('source') + $(obj).data('id')], evt);
						}
						else {
							rcmail.command(cmd, rcmail.env.address_sources[$(obj).data('id')], evt);
						}
					});

					return false;
				}
			});

			// address book group selector
			rcmail.register_command('plugin.contextmenu.assigngroup', function(props, obj, event) {
				rcm_group_selector(event, props, function(obj, evt) {
					// search result may contain contacts from many sources, but if there is only one...
					rcm_override_mailbox_command(rcmail.env.contextmenus['contactlist'], { action: 'copy' } , true);
					rcmail.group_member_change('add', rcmail.contact_list.get_selection().join(','), rcmail.env.source, $(obj).data('id'));
					rcm_override_mailbox_command(rcmail.env.contextmenus['contactlist'], { action: 'copy' } , false);
				});
			}, false);

			// reset address book selector when groups change
			rcmail.addEventListener('group_insert', function() { $("#addressbook-selector").remove(); $("#addressgroup-selector").remove(); rcmail.rcm_addressbook_selector_element = undefined; rcmail.rcm_addressgroup_selector_element  = undefined; } );
			rcmail.addEventListener('group_update', function() { $("#addressbook-selector").remove(); $("#addressgroup-selector").remove(); rcmail.rcm_addressbook_selector_element = undefined; rcmail.rcm_addressgroup_selector_element  = undefined; } );
			rcmail.addEventListener('group_delete', function() { $("#addressbook-selector").remove(); $("#addressgroup-selector").remove(); rcmail.rcm_addressbook_selector_element = undefined; rcmail.rcm_addressgroup_selector_element  = undefined; } );
		}

		// special event listeners for intreacting with plugins which open popup menus (eg: zipdownload)
		rcmail.addEventListener('menu-open', function(p) {
			// check for popupmenus that arent part of contextmenu
			if ($('div.contextmenu').is(':visible') && p.name.indexOf('rcm_') != 0) {
				rcmail.context_menu_popup_commands[p.name] = {};
				$('#' + p.name).find('a').each(function() {
					if ($(this).attr('onclick') && $(this).attr('onclick').match(rcmail.context_menu_command_pattern)) {
						var cmd = RegExp.$1;
						rcmail.context_menu_popup_commands[p.name][cmd] = rcmail.commands[cmd];
					}
				});
			}
		});

		rcmail.addEventListener('menu-close', function(p) {
			// check required args are present, other plugins trigger this event too
			if (!p.originalEvent) {
				return;
			}

			// check for popupmenus that arent part of contextmenu
			var e = p.originalEvent.currentTarget ? p.originalEvent.currentTarget : p.originalEvent.srcElement;
			if ($('div.contextmenu').is(':visible') && p.name.indexOf('rcm_') != 0 && $(e).attr('class').indexOf('rcm_elem_') == -1) {
				rcm_hide_menu(p.originalEvent);
			}
		});

		rcmail.addEventListener('get_single_uid', function() {
			if ($('#rcm_messagelist').is(':visible') && rcmail.env.contextmenus['messagelist'].menu_selection.length == 1) {
				return rcmail.env.contextmenus['messagelist'].menu_selection[0];
			}
		});

		rcmail.addEventListener('get_single_cid', function() {
			if ($('#rcm_contactlist').is(':visible') && rcmail.env.contextmenus['contactlist'].menu_selection.length == 1) {
				return rcmail.env.contextmenus['contactlist'].menu_selection[0];
			}
			else if ($('#rcm_composeto').is(':visible') && rcmail.env.contextmenus['composeto'].menu_selection.length == 1) {
				return rcmail.env.contextmenus['composeto'].menu_selection[0];
			}
		});
	}
});