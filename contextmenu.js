/**
 * ContextMenu plugin script
 */

rcmail.contextmenu_command_handlers = new Object();
rcmail.contextmenu_disable_multi = new Array('#reply','#reply-all','#reply-list','#forward','#print','#edit','#viewsource','#download','#open','#edit');

function rcm_contextmenu_update() {
	if (rcmail.env.trash_mailbox && rcmail.env.mailbox != rcmail.env.trash_mailbox)
		$("#rcm_delete").html(rcmail.gettext('movemessagetotrash'));
	else
		$("#rcm_delete").html(rcmail.gettext('deletemessage'));
}

function rcm_contextmenu_init(row) {
	$("#" + row).contextMenu({
		menu: 'rcmContextMenu',
		submenu_delay: 400
	},
	function(command, el, pos) {
		var matches = String($(el).attr('id')).match(/rcmrow([a-z0-9\-_=]+)/i);
		if ($(el) && matches) {
			var prev_uid = rcmail.env.uid;
			if (rcmail.message_list.selection.length <= 1 || !rcmail.message_list.in_selection(matches[1]))
				rcmail.env.uid = matches[1];

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			cmd = (command == 'read' || command == 'unread' || command == 'flagged' || command == 'unflagged') ? 'mark' : command;
			var prev_command = rcmail.commands[cmd];
			rcmail.enable_command(cmd, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function') {
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			}
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string') {
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			}
			else {
				switch (command) {
					case 'read':
					case 'unread':
					case 'flagged':
					case 'unflagged':
						rcmail.command('mark', command, $(el));
						break;
					case 'reply':
					case 'reply-all':
					case 'reply-list':
					case 'forward':
					case 'print':
					case 'download':
					case 'edit':
					case 'viewsource':
						rcmail.command(command, '', $(el));
						break;
					case 'open':
						rcmail.command(command, '', rcube_find_object('rcm_open'));
						rcmail.sourcewin = window.open(rcube_find_object('rcm_open').href);
						if (rcmail.sourcewin)
							window.setTimeout(function() { rcmail.sourcewin.focus(); }, 20);

						rcube_find_object('rcm_open').href = '#open';
						break;
					case 'delete':
					case 'moveto':
						if (command == 'moveto' && rcmail.env.rcm_destfolder == rcmail.env.mailbox)
							return;

						var prev_sel = null;

						// also select childs of (collapsed) threads
						if (rcmail.env.uid) {
							if (!rcmail.message_list.in_selection(rcmail.env.uid)) {
								prev_sel = rcmail.message_list.get_selection();
								rcmail.message_list.select_row(rcmail.env.uid);
							}

							if (rcmail.message_list.rows[rcmail.env.uid].has_children && !rcmail.message_list.rows[rcmail.env.uid].expanded)
								rcmail.message_list.select_childs(rcmail.env.uid);

							rcmail.env.uid = null;
						}

						rcmail.command(command, rcmail.env.rcm_destfolder, $(el));

						if (prev_sel) {
							rcmail.message_list.clear_selection();

							for (var i in prev_sel)
								rcmail.message_list.select_row(prev_sel[i], CONTROL_KEY);
						}

						delete rcmail.env.rcm_destfolder;
						break;
				}
			}

			rcmail.enable_command(cmd, prev_command);
			rcmail.env.uid = prev_uid;
		}
	});
}

function rcm_set_dest_folder(folder) {
	rcmail.env.rcm_destfolder = folder;
}

function rcm_contextmenu_register_command(command, callback, label, pos, sep, multi, newSub, menu) {
	if (!menu)
		menu = $('#rcmContextMenu');

	if (typeof label != 'string') {
		var menuItem = label.children('li');
	}
	else {
		var menuItem = $('<li>').addClass(command);
		$('<a>').attr('href', '#' + command).addClass('active').html(rcmail.gettext(label)).appendTo(menuItem);
	}

	rcmail.contextmenu_command_handlers[command] = callback;

	if (pos && menu.children('li.' + pos) && newSub) {
		subMenu = menu.children('li.' + pos);
		subMenu.addClass('submenu');

		var mainLink = null;
		if (subMenu.children('a') && !subMenu.hasClass('sublink')) {
			subMenu.addClass('sublink');

			var mainLink = $('<li>').addClass(pos);
			subMenu.children('a').clone().appendTo(mainLink)
			subMenu.children('a').addClass('mainlink');
		}

		var newMenu = $('<ul>').addClass('toolbarmenu').appendTo(subMenu);

		if (mainLink)
			newMenu.append(mainLink);

		newMenu.append(menuItem);
	}
	else if (pos && menu.children('li.' + pos)) {
		menu.children('li.' + pos).before(menuItem);
	}
	else {
		menu.append(menuItem);
	}

	if (sep == 'before')
		menuItem.addClass('separator_above');
	else if (sep == 'after')
		menuItem.addClass('separator_below');

	if (!multi)
		rcmail.contextmenu_disable_multi[rcmail.contextmenu_disable_multi.length] = '#' + command;
}

function rcm_foldermenu_init() {
	$("#mailboxlist-container li").contextMenu({
		menu: 'rcmFolderMenu'
	},
	function(command, el, pos) {
		var matches = String($(el).children('a').attr('onclick')).match(/.*rcmail.command\(["']list["'],\s*["']([^"']*)["'],\s*this\).*/i);
		if ($(el) && matches) {
			var mailbox = matches[1];
			var messagecount = 0;

			if (command == 'readfolder' || command == 'expunge' || command == 'purge') {
				if (mailbox == rcmail.env.mailbox) {
					messagecount = rcmail.env.messagecount;
				}
				else if (rcmail.env.unread_counts[mailbox] == 0) {
					var lock = rcmail.set_busy(true, 'loading');

					querystring = '_mbox=' + urlencode(mailbox);
					querystring += (querystring ? '&' : '') + '_remote=1';
					var url = rcmail.env.comm_path + '&_action=' + 'plugin.contextmenu.messagecount' + '&' + querystring

					// send request
					console.log('HTTP POST: ' + url);

					jQuery.ajax({
						url:    url,
						dataType: "json",
						success: function(response) { messagecount = response.env.messagecount; },
						async:   false
					});

					rcmail.set_busy(false, null, lock);
				}

				if (rcmail.env.unread_counts[mailbox] == 0 && messagecount == 0) {
					rcmail.display_message(rcmail.get_label('nomessagesfound'), 'notice');
					return false;
				}
			}

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			var prev_command = rcmail.commands[command];
			rcmail.enable_command(command, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function') {
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			}
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string') {
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			}
			else {
				switch (command) {
					case 'readfolder':
						var lock = rcmail.set_busy(true, 'loading');
						rcmail.http_request('plugin.contextmenu.readfolder', '_mbox=' + urlencode(mailbox) + '&_cur=' + rcmail.env.mailbox, lock);
						break;
					case 'expunge':
						rcmail.expunge_mailbox(mailbox);
						break;
					case 'purge':
						rcmail.purge_mailbox(mailbox);
						break;
					case 'collapseall':
					case 'expandall':
						targetdiv = (command == 'collapseall') ? 'expanded' : 'collapsed';
						$("#mailboxlist div." + targetdiv).each( function() {
							var el = $(this);
							var matches = String($(el).attr('onclick')).match(/.*rcmail.command\(["']collapse-folder["'],\s*["']([^"']*)["']\).*/i);
							rcmail.collapse_folder(matches[1]);
						});
						break;
					case 'openfolder':
						rcube_find_object('rcm_openfolder').href = '?_task=mail&_mbox='+urlencode(mailbox);
						rcmail.sourcewin = window.open(rcube_find_object('rcm_openfolder').href);
						if (rcmail.sourcewin)
							window.setTimeout(function() { rcmail.sourcewin.focus(); }, 20);

						rcube_find_object('rcm_openfolder').href = '#openfolder';
						break;
				}
			}

			rcmail.enable_command(command, prev_command);
		}
	});
}

function rcm_update_options(el) {
	if (el.hasClass('message')) {
		$('#rcmContextMenu').disableContextMenuItems('#reply-list');
		var matches = String($(el).attr('id')).match(/rcmrow([a-z0-9\-_=]+)/i);
		if ($(el) && matches) {
			if (rcmail.message_list.selection.length > 1 && rcmail.message_list.in_selection(matches[1])) {
				$('#rcmContextMenu').disableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
			}
			else {
				$('#rcmContextMenu').enableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));

				var msg = rcmail.env.messages[matches[1]];
				if (!msg.ml)
					$('#rcmContextMenu').disableContextMenuItems('#reply-list');
			}
		}
	}
	else if (el.hasClass('mailbox')) {
		$('#rcmFolderMenu').disableContextMenuItems('#readfolder,#purge,#collapseall,#expandall');
		var matches = String($(el).children('a').attr('onclick')).match(/.*rcmail.command\(["']list["'],\s*["']([^"']*)["'],\s*this\).*/i);
		if ($(el) && matches) {
			var mailbox = matches[1];

			if (rcmail.env.unread_counts[mailbox] > 0)
				$('#rcmFolderMenu').enableContextMenuItems('#readfolder');

			if (mailbox == rcmail.env.trash_mailbox || mailbox == rcmail.env.junk_mailbox
				|| mailbox.match('^' + RegExp.escape(rcmail.env.trash_mailbox) + RegExp.escape(rcmail.env.delimiter))
				|| mailbox.match('^' + RegExp.escape(rcmail.env.junk_mailbox) + RegExp.escape(rcmail.env.delimiter)))
					$('#rcmFolderMenu').enableContextMenuItems('#purge');

			if ($("#mailboxlist div.expanded").length > 0)
				$('#rcmFolderMenu').enableContextMenuItems('#collapseall');

			if ($("#mailboxlist div.collapsed").length > 0)
				$('#rcmFolderMenu').enableContextMenuItems('#expandall');
		}
	}
	else if (el.hasClass('addressbook') || el.hasClass('contactgroup')) {
		$('#rcmGroupMenu').disableContextMenuItems('#group-create,#group-rename,#group-delete');

		if ($(el).hasClass('contactgroup') && $(el).children('a').attr('onclick')) {
			if (!rcmail.name_input)
				$('#rcmGroupMenu').enableContextMenuItems('#group-rename');

			$('#rcmGroupMenu').enableContextMenuItems('#group-delete');
		}
		else if ($(el).hasClass('addressbook')) {
			$('#rcmGroupMenu').enableContextMenuItems('#group-create')
		}
	}
	else if (rcmail.env.task == 'addressbook') {
		var matches = String($(el).attr('id')).match(/rcmrow([a-z0-9\-_=]+)/i);
		if ($(el) && matches) {
			if (rcmail.contact_list.selection.length > 1 && rcmail.contact_list.in_selection(matches[1]))
				$('#rcmAddressMenu').disableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
			else
				$('#rcmAddressMenu').enableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));

			if (rcmail.env.address_sources[rcmail.env.source].readonly)
				$('#rcmAddressMenu').disableContextMenuItems('#edit,#delete');
			else
				$('#rcmAddressMenu').enableContextMenuItems('#edit,#delete');
		}
	}
}

function rcm_addressmenu_init(row) {
	$("tr[id=" + row + "]").contextMenu({
		menu: 'rcmAddressMenu'
	},
	function(command, el, pos) {
		var matches = String($(el).attr('id')).match(/rcmrow([a-z0-9\-_=]+)/i);
		if ($(el) && matches) {
			var prev_cid = rcmail.env.cid;
			if (rcmail.contact_list.selection.length <= 1 || !rcmail.contact_list.in_selection(matches[1]))
				rcmail.env.cid = matches[1];

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			cmd = command;
			var prev_command = rcmail.commands[cmd];
			rcmail.enable_command(cmd, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function') {
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			}
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string') {
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			}
			else {
				switch (command) {
					case 'edit':
						rcmail.contact_list.select(rcmail.env.cid);
						clearTimeout(rcmail.preview_timer)
						rcmail.command(command, '', $(el));
						break;
					case 'compose':
					case 'delete':
					case 'moveto':
						if (command == 'moveto') {
							// check for valid taget
							if (rcmail.env.rcm_destbook == rcmail.env.source || rcmail.env.contactfolders['G' + rcmail.env.rcm_destsource + rcmail.env.rcm_destgroup].id == rcmail.env.group)
								return;
						}

						var prev_sel = null;

						if (rcmail.env.cid) {
							if (!rcmail.contact_list.in_selection(rcmail.env.cid)) {
								prev_sel = rcmail.contact_list.get_selection();
								rcmail.contact_list.select(rcmail.env.cid);

								if (!(command == 'moveto' && rcmail.env.rcm_destbook.substring(0, 1) == 'G') && command != 'compose')
									rcmail.contact_list.remove_row(rcmail.env.cid, false);
							}
							else if (rcmail.contact_list.get_single_selection() == rcmail.env.cid) {
								rcmail.env.cid = null;
							}
							else {
								prev_sel = rcmail.contact_list.get_selection();
								rcmail.contact_list.select(rcmail.env.cid);
							}
						}

						rcmail.drag_active = true;
						rcmail.command(command, rcmail.env.contactfolders['G' + rcmail.env.rcm_destsource + rcmail.env.rcm_destgroup], $(el));
						rcmail.drag_active = false;

						if (prev_sel) {
							rcmail.contact_list.clear_selection();

							for (var i in prev_sel)
								rcmail.contact_list.select_row(prev_sel[i], CONTROL_KEY);
						}

						rcmail.env.rcm_destbook = null;
						rcmail.env.rcm_destsource = null;
						rcmail.env.rcm_destgroup = null;
						break;
				}
			}

			rcmail.enable_command(cmd, prev_command);
			rcmail.env.cid = prev_cid;
		}
	});
}

function rcm_set_dest_book(obj, source, group) {
	rcmail.env.rcm_destbook = obj;
	rcmail.env.rcm_destsource = source;
	rcmail.env.rcm_destgroup = group;
}

function rcm_groupmenu_init(li) {
	$(li).contextMenu({
		menu: 'rcmGroupMenu'
	},
	function(command, el, pos) {
		var matches = $(el).attr('id').match(/rcmli(G?[A-Z0-9\-_]+)/i);
		if ($(el) && matches && $(el).attr('id').indexOf('rcmliG') == -1) {
			prev_source = rcmail.env.source;
			rcmail.env.source = matches[1];

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			var prev_command = rcmail.commands[command];
			rcmail.enable_command(command, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function') {
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			}
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string') {
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			}
			else {
				switch (command) {
					case 'group-create':
						rcmail.command(command, '', $(el).children('a'));
						break;
				}
			}

			rcmail.enable_command(command, prev_command);
			rcmail.env.source = prev_source;
		}
		else if ($(el) && matches) {
			prev_group = rcmail.env.group;
			prev_source = rcmail.env.source;

			var matches = $(el).children('a').attr('onclick').toString().match(/["']?source["']?:\ ?["']([^"']+)["'],\ ?["']?id["']?:\ ?["']?([^"']+)/i);

			cur_id = matches[2];
			cur_source = matches[1];

			rcmail.env.group = cur_id
			rcmail.env.source = cur_source;

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			var prev_command = rcmail.commands[command];
			rcmail.enable_command(command, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function') {
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			}
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string') {
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			}
			else {
				switch (command) {
					case 'group-create':
						rcmail.command(command, '', $(el).children('a'));
						break;
					case 'group-rename':
						rcmail.command(command, '', $(el).children('a'));

						// callback requires target is selected
						rcmail.enable_command('listgroup', true);
						rcmail.env.group = prev_group;
						rcmail.env.source = prev_source
						prev_group = cur_id;
						prev_source = cur_source;
						rcmail.command('listgroup', {'source': prev_source,'id': prev_group}, $(el).children('a'));
						rcmail.enable_command('listgroup', false);
						break;
					case 'group-delete':
						rcmail.command(command, '', $(el).children('a'));
						break;
				}
			}

			rcmail.enable_command(command, prev_command);
			rcmail.env.group = prev_group;
			rcmail.env.source = prev_source;
		}
	});
}

function rcm_groupmenu_update(action, props) {
	var gid = props.source + props.id;
	gid = gid.replace(rcmail.identifier_expr, '_');

	switch (action) {
		case 'insert':
			var link = $('<a>')
				.attr('id', 'rcm_contextgrps_G' + gid)
				.attr('href', '#moveto')
				.addClass('active')
				.attr('onclick', "rcm_set_dest_book('G" + gid + "', '" + props.source + "','" + props.id + "')")
				.html('&nbsp;&nbsp;' + props.name);

			var li = $('<li>').addClass('contactgroup').append(link);
			$(li).insertAfter($('#rcm_contextaddr_' + props.source));
			rcm_groupmenu_init(props.li);
			break;
		case 'update':
			if ($('#rcm_contextgrps_G' + gid).length)
				$('#rcm_contextgrps_G' + gid).html('&nbsp;&nbsp;' + props.name);

			break;
		case 'remove':
			if ($('#rcm_contextgrps_G' + gid).length)
				$('#rcm_contextgrps_G' + gid).remove();

			break;
	}
}

$(document).ready(function() {
	// init message list menu
	if ($('#rcmContextMenu').length > 0) {
		rcmail.addEventListener('listupdate', function(props) { rcm_contextmenu_update(); } );
		rcmail.addEventListener('insertrow', function(props) { rcm_contextmenu_init(props.row.id); } );
	}

	// init folder list menu
	if ($('#rcmFolderMenu').length > 0)
		rcmail.add_onload('rcm_foldermenu_init();');

	// init contact list menu
	if ($('#rcmAddressMenu').length > 0)
		rcmail.addEventListener('insertrow', function(props) { rcm_addressmenu_init(props.row.id); } );

	// init group list menu
	if ($('#rcmGroupMenu').length > 0) {
		rcmail.add_onload('rcm_groupmenu_init("#directorylistbox li");');
		rcmail.addEventListener('group_insert', function(props) { rcm_groupmenu_update('insert', props); } );
		rcmail.addEventListener('group_update', function(props) { rcm_groupmenu_update('update', props); } );
		rcmail.addEventListener('group_delete', function(props) { rcm_groupmenu_update('remove', props); } );
	}
});