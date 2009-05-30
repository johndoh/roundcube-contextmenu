function rcm_contextmenu_load(update) {
  if (update) {
    if (rcmail.env.trash_mailbox && rcmail.env.mailbox != rcmail.env.trash_mailbox)
      $("#rcm_delete").html(rcmail.gettext('movemessagetotrash'));
    else
      $("#rcm_delete").html(rcmail.gettext('deletemessage'));
  }
  else {
    var menu = $('<ul>').attr('id', 'rcmContextMenu').addClass('toolbarmenu');
    $('<li>').addClass('conmentitle').html(rcmail.gettext('markmessages')).appendTo(menu);
    var menuRead = $('<li>').addClass('read').appendTo(menu);
    var menuUnread = $('<li>').addClass('unread').appendTo(menu);
    var menuFlagged = $('<li>').addClass('flagged').appendTo(menu);
    var menuUnflagged = $('<li>').addClass('unflagged').appendTo(menu);
    var menuReply = $('<li>').addClass('reply').appendTo(menu);
    var menuReplyall = $('<li>').addClass('replyall').appendTo(menu);
    var menuForward = $('<li>').addClass('forward').appendTo(menu);
    var menuDelete = $('<li>').addClass('delete').appendTo(menu);
    var menuPrint = $('<li>').addClass('print').appendTo(menu);

    $('<a>').attr('href', '#read').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markread')).css('background-image', 'url(' + rcmail.env.messageicon + ')').appendTo(menuRead);
    $('<a>').attr('href', '#unread').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markunread')).css('background-image', 'url(' + rcmail.env.unreadicon + ')').appendTo(menuUnread);
    $('<a>').attr('href', '#flagged').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markflagged')).css('background-image', 'url(' + rcmail.env.flaggedicon + ')').appendTo(menuFlagged);
    $('<a>').attr('href', '#unflagged').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markunflagged')).css('background-image', 'url(' + rcmail.env.unflaggedicon + ')').appendTo(menuUnflagged);
    $('<div>').addClass('conmensep').appendTo(menuUnflagged);
    $('<a>').attr('href', '#reply').addClass('active').html(rcmail.gettext('replytomessage')).css('background-image', 'url(' + rcmail.env.repliedicon + ')').appendTo(menuReply);
    $('<a>').attr('href', '#reply-all').addClass('active').html(rcmail.gettext('replytoallmessage')).css('background-image', 'url(' + rcmail.env.repliedallicon + ')').appendTo(menuReplyall);
    $('<a>').attr('href', '#forward').addClass('active').html(rcmail.gettext('forwardmessage')).css('background-image', 'url(' + rcmail.env.forwardedicon + ')').appendTo(menuForward);
    $('<div>').addClass('conmensep').appendTo(menuForward);

    if (rcmail.env.trash_mailbox && rcmail.env.mailbox != rcmail.env.trash_mailbox)
      $('<a>').attr({href: '#delete', id: 'rcm_delete'}).addClass('active').html(rcmail.gettext('movemessagetotrash')).css('background-image', 'url(' + rcmail.env.deletedicon + ')').appendTo(menuDelete);
    else
      $('<a>').attr({href: '#delete', id: 'rcm_delete'}).addClass('active').html(rcmail.gettext('deletemessage')).css('background-image', 'url(' + rcmail.env.deletedicon + ')').appendTo(menuDelete);

    $('<a>').attr('href', '#print').addClass('active').html(rcmail.gettext('printmessage')).css('background-image', 'url(' + rcmail.env.printicon + ')').appendTo(menuPrint);

    $("body").append(menu);
  }
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
          rcmail.command(command, '', $(el));
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

        rcmail.enable_command(cmd, prev_command);
        rcmail.env.uid = prev_uid;
      }
    }
  );
}

function rcm_selection_changed(list) {
  if (list.selection.length > 1)
    $('#rcmContextMenu').disableContextMenuItems('#reply,#reply-all,#forward,#print');
  else
	$('#rcmContextMenu').enableContextMenuItems('#reply,#reply-all,#forward,#print');
}

rcmail.add_onload('rcm_contextmenu_load()');
rcmail.add_onload('rcm_contextmenu_init(\'messagelist tbody tr\')');
rcmail.add_onload('if (rcmail.message_list) rcmail.message_list.addEventListener(\'select\', function(list) { rcm_selection_changed(list); } );');
rcmail.addEventListener('listupdate', function(evt, props) { rcm_contextmenu_load(true); rcm_contextmenu_init('messagelist tbody tr'); } );
rcmail.addEventListener('insertrow', function(evt, props) { rcm_contextmenu_init(props.row.id); } );
