/**
 * ContextMenu plugin script
 */

rcube_webmail.prototype.context_menu_popup_pattern = /UI\.show_popup\(\'([^\']+)\'/;

function add_menu_text(menu, p) {
	if (menu == 'composeto') {
		if ($(p.item).children('a').hasClass('addto')) {
			$(p.item).children('a').children('span').text($('#compose-contacts div.boxfooter a.addto').attr('title'));
		}
		else if ($(p.item).children('a').hasClass('addcc')) {
			$(p.item).children('a').children('span').text($('#compose-contacts div.boxfooter a.addcc').attr('title'));
		}
		else if ($(p.item).children('a').hasClass('addbcc')) {
			$(p.item).children('a').children('span').text($('#compose-contacts div.boxfooter a.addbcc').attr('title'));
		}
	}
	else if (menu == 'contactlist') {
		if ($(p.item).children('a').hasClass('delete')) {
			$(p.item).children('a').children('span').text($('#addresslist div.boxfooter a.delete').attr('title'));
		}
		else if ($(p.item).children('a').hasClass('removegroup')) {
			$(p.item).children('a').children('span').text($('#addresslist div.boxfooter a.removegroup').attr('title'));
		}
	}
	else if (menu == 'abooklist' && $(p.item).children('a').hasClass('add')) {
		$(p.item).children('a').children('span').text($('#directorylist-footer a.add').attr('title'));
	}
}

function reorder_contact_menu(p) {
	var ul = p.obj.find('ul:first');
	$(p.obj).find('a.export').parent('li').appendTo(ul);
}

$(document).ready(function() {
	if (window.rcmail) {
		if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#messagetoolbar'}); } );
			rcmail.add_onload("rcm_foldermenu_init('#mailboxlist li', {'menu_source': '#mailboxoptionsmenu'})");

			// special handeling for move/copy functions (folder selector)
			rcmail.addEventListener('actionbefore', function(props) { rcm_override_mailbox_command(props, true); } );
			rcmail.addEventListener('actionafter', function(props) { rcm_override_mailbox_command(props, false); } );
		}

		if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'composeto', 'menu_source': '#compose-contacts div.boxfooter', 'list_object': rcmail.contact_list}, {'insertitem': function(p) { add_menu_text('composeto', p); }}); } );
		}

		if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'contactlist', 'menu_source': ['#addressbooktoolbar','#addresslist div.boxfooter a.delete', ,'#addresslist div.boxfooter a.removegroup'], 'list_object': rcmail.contact_list, 'list_object_select': false}, {
				'insertitem': function(p) { add_menu_text('contactlist', p); },
				'init': function(p) { reorder_contact_menu(p); },
				'afteractivate': function(p) {
					p.ref.list_selection(false, rcmail['rcm_selection']);

					if (!rcmail.env.group || rcmail.env.readonly)
						p.obj.find('a.removegroup').removeClass('active');
				},
				'afterselect': function(p) {
					if ($(p.el).hasClass('active') && p.command == 'group-remove-selected')
						rcmail.command('listgroup', {'source': rcmail.env.source, 'id': rcmail.env.group}, p.el);
				}
			}); } );
			rcmail.add_onload("rcm_abookmenu_init('#directorylist li.addressbook', {'menu_source': '#directorylist-footer'}, {'insertitem': function(p) { add_menu_text('abooklist', p); }})");
			rcmail.add_onload("rcm_groupmenu_init('#directorylist ul.groups li', {'menu_source': '#groupoptionsmenu'})");
			rcmail.addEventListener('group_insert', function(props) { rcm_groupmenu_init(props.li, {'menu_source': '#groupoptionsmenu'}) } );
		}
	}
});