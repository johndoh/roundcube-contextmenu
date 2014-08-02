/**
 * ContextMenu plugin script
 */

rcube_webmail.prototype.context_menu_skip_commands = $.merge(rcube_webmail.prototype.context_menu_skip_commands, new Array('addressbook-group-remove-selected'));
rcube_webmail.prototype.context_menu_popup_pattern = /rcmail_ui\.show_popup\(\'([^\']+)\'/;
rcube_webmail.prototype.context_menu_button_active_class = new Array('active', 'button');
rcube_webmail.prototype.context_menu_button_disabled_class = new Array('disabled', 'buttonPas');

$(document).ready(function() {
	if (window.rcmail) {
		if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#messagetoolbar'}); } );
			rcmail.add_onload("rcm_foldermenu_init('#mailboxlist li', {'menu_source': ['#rcmFolderMenu', '#mailboxoptionsmenu ul']})");

			// special handeling for move/copy functions (folder selector)
			rcmail.addEventListener('actionbefore', function(props) { rcm_override_mailbox_command(props, true); } );
			rcmail.addEventListener('actionafter', function(props) { rcm_override_mailbox_command(props, false); } );
		}

		if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'composeto', 'menu_source': '#abookactions', 'list_object': rcmail.contact_list}); } );
		}

		if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'contactlist', 'menu_source': '#abooktoolbar', 'list_object': rcmail.contact_list}); } );
			rcmail.add_onload("rcm_abookmenu_init('#directorylist li.addressbook', {'menu_source': '#directorylist-footer'})");
			rcmail.add_onload("rcm_groupmenu_init('#directorylist ul.groups li', {'menu_source': '#groupoptionsmenu ul'})");
			rcmail.addEventListener('group_insert', function(props) { rcm_groupmenu_init(props.li, {'menu_source': '#groupoptionsmenu'}) } );
		}
	}
});