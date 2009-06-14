rcmail.contextmenu_command_handlers = new Object();
rcmail.contextmenu_disable_multi = new Array('#reply','#reply-all','#forward','#print','#edit','#viewsource','#download','#open');

function rcm_contextmenu_update() {
	if (rcmail.env.trash_mailbox && rcmail.env.mailbox != rcmail.env.trash_mailbox)
		$("#rcm_delete").html(rcmail.gettext('movemessagetotrash'));
	else
		$("#rcm_delete").html(rcmail.gettext('deletemessage'));
}

function rcm_contextmenu_init(row) {
	$("#" + row).contextMenu({
		menu: 'rcmContextMenu'
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
					rcmail.command(command, '', rcube_find_object('contextmenu_open'));
					rcmail.sourcewin = window.open(rcube_find_object('contextmenu_open').href);
					if (rcmail.sourcewin)
						window.setTimeout(function(){ rcmail.sourcewin.focus(); }, 20);

					rcube_find_object('contextmenu_open').href = '#open';
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
				}
			}

			rcmail.enable_command(cmd, prev_command);
			rcmail.env.uid = prev_uid;
		}
	});
}

function rcm_selection_changed(list) {
	if (list.selection.length > 1)
		$('#rcmContextMenu').disableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
	else
		$('#rcmContextMenu').enableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
}

function rcm_contextmenu_register_command(command, callback, label, pos, sep, multi, newSub) {
	var menu = $('#rcmContextMenu');
	var menuItem = $('<li>').addClass(command);
	$('<a>').attr('href', '#' + command).addClass('active').html(rcmail.gettext(label)).appendTo(menuItem);
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
		menu.append(menu);

	if (sep == 'before')
		menuItem.addClass('separator_above');
	else if (sep == 'after')
		menuItem.addClass('separator_below');

	if (!multi)
		rcmail.contextmenu_disable_multi[rcmail.contextmenu_disable_multi.length] = '#' + command;
}

rcmail.add_onload('rcm_contextmenu_init(\'messagelist tbody tr\')');
rcmail.add_onload('if (rcmail.message_list) rcmail.message_list.addEventListener(\'select\', function(list) { rcm_selection_changed(list); } );');
rcmail.addEventListener('listupdate', function(props) { rcm_contextmenu_update(); rcm_contextmenu_init('messagelist tbody tr'); } );
rcmail.addEventListener('insertrow', function(props) { rcm_contextmenu_init(props.row.id); } );