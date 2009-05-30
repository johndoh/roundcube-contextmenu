rcmail.contextmenu_command_handlers = new Object();
rcmail.contextmenu_disable_multi = new Array('#reply','#reply-all','#forward','#print','#viewsource','#download','#open');

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
    var menuUnflagged = $('<li>').addClass('unflagged separator_below').appendTo(menu);
    var menuReply = $('<li>').addClass('reply').appendTo(menu);
    var menuReplyall = $('<li>').addClass('replyall').appendTo(menu);
    var menuForward = $('<li>').addClass('forward').appendTo(menu);
    var menuDelete = $('<li>').addClass('delete separator_below').appendTo(menu);
    var menuPrint = $('<li>').addClass('print').appendTo(menu);
    var menuSave = $('<li>').addClass('save').appendTo(menu);
    var menuSource = $('<li>').addClass('source separator_below').appendTo(menu);
    var menuOpen = $('<li>').addClass('open').appendTo(menu);

    $('<a>').attr('href', '#read').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markread')).appendTo(menuRead);
    $('<a>').attr('href', '#unread').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markunread')).appendTo(menuUnread);
    $('<a>').attr('href', '#flagged').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markflagged')).appendTo(menuFlagged);
    $('<a>').attr('href', '#unflagged').addClass('active').html('&nbsp;&nbsp;' + rcmail.gettext('markunflagged')).appendTo(menuUnflagged);
    $('<a>').attr('href', '#reply').addClass('active').html(rcmail.gettext('replytomessage')).appendTo(menuReply);
    $('<a>').attr('href', '#reply-all').addClass('active').html(rcmail.gettext('replytoallmessage')).appendTo(menuReplyall);
    $('<a>').attr('href', '#forward').addClass('active').html(rcmail.gettext('forwardmessage')).appendTo(menuForward);

    if (rcmail.env.trash_mailbox && rcmail.env.mailbox != rcmail.env.trash_mailbox)
      $('<a>').attr({href: '#delete', id: 'rcm_delete'}).addClass('active').html(rcmail.gettext('movemessagetotrash')).appendTo(menuDelete);
    else
      $('<a>').attr({href: '#delete', id: 'rcm_delete'}).addClass('active').html(rcmail.gettext('deletemessage')).appendTo(menuDelete);

    $('<a>').attr('href', '#print').addClass('active').html(rcmail.gettext('printmessage')).appendTo(menuPrint);
    $('<a>').attr('href', '#download').addClass('active').html(rcmail.gettext('emlsave')).appendTo(menuSave);
    $('<a>').attr('href', '#viewsource').addClass('active').html(rcmail.gettext('viewsource')).appendTo(menuSource);
    $('<a>').attr('id', 'contextmenu_open').attr('href', '#open').attr('target', '_blank').addClass('active').html(rcmail.gettext('openinextwin')).appendTo(menuOpen);

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

        // process external commands
        if (typeof rcmail.contextmenu_command_handlers[command] == 'function')
        {
          rcmail.contextmenu_command_handlers[command](command, el, pos);
        }
        else if (typeof rcmail.contextmenu_command_handlers[command] == 'string')
        {
          window[rcmail.contextmenu_command_handlers[command]](command, el, pos);
        }
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
    }
  );
}

function rcm_selection_changed(list) {
  if (list.selection.length > 1)
    $('#rcmContextMenu').disableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
  else
	$('#rcmContextMenu').enableContextMenuItems(rcmail.contextmenu_disable_multi.join(','));
}

function rcm_contextmenu_register_command(command, callback, label, pos, sep, multi) {
  var menu = $('#rcmContextMenu');
  var menuItem = $('<li>').addClass(command);
  $('<a>').attr('href', '#' + command).addClass('active').html(rcmail.gettext(label)).appendTo(menuItem);
  rcmail.contextmenu_command_handlers[command] = callback;

  if (pos)
    $('#rcmContextMenu li:eq(' + pos + ')').before(menuItem);
  else
    menuItem.appendTo(menu);

  if (sep == 'before')
    menuItem.addClass('separator_above');
  else if (sep == 'after')
   menuItem.addClass('separator_below');

  if (!multi)
    rcmail.contextmenu_disable_multi[rcmail.contextmenu_disable_multi.length] = '#' + command;
}

rcmail.add_onload('rcm_contextmenu_load()');
rcmail.add_onload('rcm_contextmenu_init(\'messagelist tbody tr\')');
rcmail.add_onload('if (rcmail.message_list) rcmail.message_list.addEventListener(\'select\', function(list) { rcm_selection_changed(list); } );');
rcmail.addEventListener('listupdate', function(evt, props) { rcm_contextmenu_load(true); rcm_contextmenu_init('messagelist tbody tr'); } );
rcmail.addEventListener('insertrow', function(evt, props) { rcm_contextmenu_init(props.row.id); } );