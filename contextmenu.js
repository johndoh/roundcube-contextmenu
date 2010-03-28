rcmail.contextmenu_command_handlers = new Object();
rcmail.contextmenu_disable_multi = new Array('#reply','#reply-all','#forward','#print','#edit','#viewsource','#download','#open','#edit');

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
		if ($(el) && String($(el).attr('id')).match(/rcmrow([a-z0-9\-_=]+)/i))
		{
			var prev_uid = rcmail.env.uid;
			if (rcmail.message_list.selection.length <= 1)
				rcmail.env.uid = RegExp.$1;

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			cmd = (command == 'read' || command == 'unread' || command == 'flagged' || command == 'unflagged') ? 'mark' : command;
			var prev_command = rcmail.commands[cmd];
			rcmail.enable_command(cmd, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function')
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string')
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			else
			{
				switch (command)
				{
				case 'read':
				case 'unread':
				case 'flagged':
				case 'unflagged':
					rcmail.command('mark', command, $(el));
					break;
				case 'reply':
				case 'reply-all':
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
						window.setTimeout(function(){ rcmail.sourcewin.focus(); }, 20);

					rcube_find_object('rcm_open').href = '#open';
					break;
				case 'delete':
					if (rcmail.message_list.selection.length > 1 || rcmail.env.uid == rcmail.message_list.get_selection()) {
						rcmail.env.uid = null;
						rcmail.command(command, '', $(el));
					}
					else {
						var prev_contentframe = rcmail.env.contentframe;
						var prev_selection = rcmail.message_list.get_selection();
						rcmail.env.contentframe = false;
						rcmail.message_list.select(rcmail.env.uid);
						rcmail.env.uid = null;
						rcmail.command(command, '', $(el));

						if (prev_selection != '')
							rcmail.message_list.select(prev_selection);
						else
							rcmail.message_list.clear_selection();

						rcmail.env.contentframe = prev_contentframe;
					}
					break;
				case 'moveto':
					if (rcmail.env.rcm_destfolder == rcmail.env.mailbox)
						return;

					// also select childs of (collapsed) threads
					if (rcmail.message_list.rows[rcmail.env.uid].has_children && !rcmail.message_list.rows[rcmail.env.uid].expanded) {
						rcmail.message_list.select_row(rcmail.env.uid, CONTROL_KEY);
						rcmail.message_list.select_childs(rcmail.env.uid);
						rcmail.env.uid = null;
					}

					rcmail.command(command, rcmail.env.rcm_destfolder, $(el));

					if (rcmail.message_list.selection.length <= 1 && rcmail.env.uid)
						rcmail.message_list.remove_row(rcmail.env.uid, false);

					rcmail.env.rcm_destfolder = null;
					break;
				}
			}

			rcmail.enable_command(cmd, prev_command);
			rcmail.env.uid = prev_uid;
		}
	});
}

function rcm_selection_changed(id, list) {
	if (list.selection.length > 1)
		$('#' + id).disableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
	else
		$('#' + id).enableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
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

	if (pos && $('#rcmContextMenu .' + pos) && newSub) {
		subMenu = $('#rcmContextMenu .' + pos);
		subMenu.addClass('submenu');

		// remove any existing hyperlink
		if (subMenu.children('a')) {
			var text = subMenu.children('a').html();
			subMenu.html(text);
		}

		var newMenu = $('<ul>').addClass('toolbarmenu').appendTo(subMenu);
		newMenu.append(menuItem);
	}
	else if (pos && $('#rcmContextMenu .' + pos))
		$('#rcmContextMenu .' + pos).before(menuItem);
	else
		menu.append(menuItem);

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
		if ($(el) && matches)
		{
			var mailbox = matches[1];
			var messagecount = 0;

			if (command == 'readfolder' || command == 'expunge' || command == 'purge') {
				if (mailbox == rcmail.env.mailbox) {
					messagecount = rcmail.env.messagecount;
				}
				else if (rcmail.env.unread_counts[mailbox] == 0) {
					rcmail.set_busy(true, 'loading');

					querystring = '_mbox=' + urlencode(mailbox);
				    querystring += (querystring ? '&' : '') + '_remote=1';
				    var url = rcmail.env.comm_path + '&_action=' + 'plugin.contextmenu.messagecount' + '&' + querystring

				    // send request
				    console.log('HTTP POST: ' + url);

				    jQuery.ajax({
				         url:    url,
				         dataType: "json",
				         success: function(response){ messagecount = response.env.messagecount; },
				         async:   false
				    });

				    rcmail.set_busy(false);
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
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function')
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string')
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			else
			{
				switch (command)
				{
					case 'readfolder':
						rcmail.set_busy(true, 'loading');
						rcmail.http_request('plugin.contextmenu.readfolder', '_mbox=' + urlencode(mailbox), true);

						if (mailbox == rcmail.env.mailbox) {
							for (var i in rcmail.env.messages) {
								if (rcmail.env.messages[i].unread)
									rcmail.set_message(i, 'unread', false);
							}
						}
						break;
					case 'expunge':
						rcmail.expunge_mailbox(mailbox);
						break;
					case 'purge':
						rcmail.purge_mailbox(mailbox);
						break;
					case 'collapseall':
						$("#mailboxlist div.expanded").each( function() {
							var el = $(this);
							var matches = String($(el).attr('onclick')).match(/.*rcmail.command\(["']collapse-folder["'],\s*["']([^"']*)["']\).*/i);
							rcmail.collapse_folder(matches[1]);
						});
						break;
					case 'expandall':
						$("#mailboxlist div.collapsed").each( function() {
							var el = $(this);
							var matches = String($(el).attr('onclick')).match(/.*rcmail.command\(["']collapse-folder["'],\s*["']([^"']*)["']\).*/i);
							rcmail.collapse_folder(matches[1]);
						});
						break;
					case 'openfolder':
						rcube_find_object('rcm_openfolder').href = '?_task=mail&_mbox='+urlencode(mailbox);
						rcmail.sourcewin = window.open(rcube_find_object('rcm_openfolder').href);
						if (rcmail.sourcewin)
							window.setTimeout(function(){ rcmail.sourcewin.focus(); }, 20);

						rcube_find_object('rcm_openfolder').href = '#openfolder';
						break;
				}
			}

			rcmail.enable_command(command, prev_command);
		}
	});
}

function rcm_update_options(el) {
	if (el.hasClass('mailbox')) {
		$('#rcmFolderMenu').disableContextMenuItems('#readfolder,#purge,#collapseall,#expandall');

		var matches = String($(el).children('a').attr('onclick')).match(/.*rcmail.command\(["']list["'],\s*["']([^"']*)["'],\s*this\).*/i);
		if ($(el) && matches)
		{
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
		$('#rcmGroupMenu').disableContextMenuItems('#renamegroup,#deletegroup');

		//if ($(el).hasClass('contactgroup'))
		//	$('#rcmGroupMenu').enableContextMenuItems('#renamegroup,#deletegroup');
	}
	else if (rcmail.env.task == 'addressbook') {
		// check for new/renamed groups
		for (var i in rcmail.env.contactfolders) {
			if ($('#rcm_contextgrps_' + i). length) {
				if ($('#rcm_contextgrps_' + i).attr('title') != rcmail.env.contactfolders[i].name &&
					$('#rcm_contextgrps_' + i).text() != rcmail.env.contactfolders[i].name){
						$('#rcm_contextgrps_' + i).attr('title', '');
						$('#rcm_contextgrps_' + i).text(rcmail.env.contactfolders[i].name);
				}
			}
			else {
				var link = $('<a>')
					.attr('id', '#rcm_contextgrps_' + i)
					.attr('href', '#moveto')
					.addClass('active')
					.attr('onclick', "rcm_set_dest_book('" + i + "')")
					.html(rcmail.env.contactfolders[i].name);
				var li = $('<li>').attr('id', 'rcm_contextgrps_' + i ).addClass('contactgroup').append(link);
				$('#rcm_contextgrps').append(li);
			}
		}

		// check for deleted
		$('#rcm_contextgrps').children().each(function() {
			var id = $(this).children('a').attr('id');
			id = id.substr(16);

			if (!rcmail.env.contactfolders[id])
				$(this).remove();
		});
	}
}

function rcm_addressmenu_init(row) {
	$("#" + row).contextMenu({
		menu: 'rcmAddressMenu'
	},
	function(command, el, pos) {
		if ($(el) && String($(el).attr('id')).match(/rcmrow([a-z0-9\-_=]+)/i))
		{
			var prev_cid = rcmail.env.cid;
			if (rcmail.contact_list.selection.length <= 1)
				rcmail.env.cid = RegExp.$1;

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			cmd = command;
			var prev_command = rcmail.commands[cmd];
			rcmail.enable_command(cmd, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function')
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string')
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			else
			{
				switch (command)
				{
				case 'edit':
					rcmail.command(command, '', $(el));
					var prev_contentframe = rcmail.env.contentframe;
					rcmail.env.contentframe = false;
					rcmail.contact_list.highlight_row(rcmail.env.cid);
					rcmail.env.contentframe = prev_contentframe;
					break;
				case 'compose':
				case 'delete':
					if (rcmail.contact_list.selection.length > 1 || rcmail.env.cid == rcmail.contact_list.get_selection()) {
						rcmail.env.cid = null;
						rcmail.command(command, '', $(el));
					}
					else {
						var prev_contentframe = rcmail.env.contentframe;
						var prev_selection = rcmail.contact_list.get_selection();
						rcmail.env.contentframe = false;
						rcmail.contact_list.select(rcmail.env.cid);
						rcmail.env.cid = null;
						rcmail.command(command, '', $(el));

						if (prev_selection != '')
							rcmail.contact_list.select(prev_selection);
						else
							rcmail.contact_list.clear_selection();

						rcmail.env.contentframe = prev_contentframe;
					}
					break;
				case 'moveto':
					if (rcmail.env.rcm_destbook == rcmail.env.source || rcmail.env.contactfolders[rcmail.env.rcm_destbook].id == rcmail.env.group)
						return;

					if (rcmail.contact_list.selection.length > 1 || rcmail.env.cid == rcmail.contact_list.get_selection()) {
						rcmail.env.cid = null;
						rcmail.drag_active = true;
						rcmail.command(command, rcmail.env.contactfolders[rcmail.env.rcm_destbook], $(el));
						rcmail.drag_active = false;
					}
					else {
						var prev_contentframe = rcmail.env.contentframe;
						var prev_selection = rcmail.contact_list.get_selection();
						rcmail.env.contentframe = false;
						rcmail.contact_list.select(rcmail.env.cid);
						rcmail.env.cid = null;
						rcmail.drag_active = true;
						rcmail.command(command, rcmail.env.contactfolders[rcmail.env.rcm_destbook], $(el));
						rcmail.drag_active = false;

						if (prev_selection != '')
							rcmail.contact_list.select(prev_selection);
						else
							rcmail.contact_list.clear_selection();

						rcmail.env.contentframe = prev_contentframe;
						rcmail.env.rcm_destbook = null;
					}
					break;
				}
			}

			rcmail.enable_command(cmd, prev_command);
			rcmail.env.cid = prev_cid;
		}
	});
}

function rcm_set_dest_book(book) {
	rcmail.env.rcm_destbook = book;
}

function rcm_groupmenu_init() {
	$("#directorylistbox li").contextMenu({
		menu: 'rcmGroupMenu'
	},
	function(command, el, pos) {
		if ($(el) && String($(el).attr('id')).match(/rcmli([a-z0-9\-_=]+)/i))
		{
			var group = RegExp.$1;

			// double check its a group, not an address book
			if (rcmail.env.contactfolders[group].type != 'group')
				return

			// fix command string in IE
			if (command.indexOf("#") > 0)
				command = command.substr(command.indexOf("#") + 1);

			// enable the required command
			var prev_command = rcmail.commands[command];
			rcmail.enable_command(command, true);

			// process external commands
			if (typeof rcmail.contextmenu_command_handlers[command] == 'function')
				rcmail.contextmenu_command_handlers[command](command, el, pos);
			else if (typeof rcmail.contextmenu_command_handlers[command] == 'string')
				window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
			else
			{
				switch (command)
				{
					case 'renamegroup':
						//
						break;
					case 'deletegroup':
						//
						break;
				}
			}

			rcmail.enable_command(command, prev_command);
		}
	});
}

$(document).ready(function(){
	// init message list menu
	if ($('#rcmContextMenu').length > 0) {
		rcmail.add_onload('if (rcmail.message_list) rcmail.message_list.addEventListener(\'select\', function(list) { rcm_selection_changed(\'rcmContextMenu\', list); } );');
		rcmail.addEventListener('listupdate', function(props) { rcm_contextmenu_update(); rcm_contextmenu_init('messagelist tbody tr'); } );
		rcmail.addEventListener('insertrow', function(props) { rcm_contextmenu_init(props.row.id); } );
	}

	// init folder list menu
	if ($('#rcmFolderMenu').length > 0) {
		rcmail.add_onload('rcm_foldermenu_init();');
	}

	// init contact list menu
	if ($('#rcmAddressMenu').length > 0) {
		rcmail.add_onload('if (rcmail.contact_list) rcmail.contact_list.addEventListener(\'select\', function(list) { rcm_selection_changed(\'rcmAddressMenu\', list); } );');
		rcmail.addEventListener('listupdate', function(props) { rcm_addressmenu_init('contacts-table tbody tr'); } );
		rcmail.addEventListener('insertrow', function(props) { rcm_addressmenu_init(props.row.id); } );
	}

	// init group list menu
	if ($('#rcmGroupMenu').length > 0) {
		rcmail.add_onload('rcm_groupmenu_init();');
	}
});