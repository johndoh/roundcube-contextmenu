/**
 * ContextMenu plugin script
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2014 Philip Weir
 *
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */

rcube_webmail.prototype.context_menu_popup_pattern = /rcmail_ui\.show_popup\(\'([^\']+)\'/;
rcube_webmail.prototype.context_menu_button_active_class = new Array('active', 'button');
rcube_webmail.prototype.context_menu_button_disabled_class = new Array('disabled', 'buttonPas');

function reorder_contact_menu(p) {
	// put export link last
	var ul = p.ref.container.find('ul:first');
	$(p.ref.container).find('a.export').parent('li').appendTo(ul);
}

function reorder_abook_menu(p) {
	// remove the remove from group option from the address book menu
	p.ref.container.find('a.cmd_group-remove-selected').remove();
}

$(document).ready(function() {
	if (window.rcmail) {
		if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#messagetoolbar'}); } );
			rcmail.add_onload("rcm_foldermenu_init('#mailboxlist li', {'menu_source': ['#rcmFolderMenu', '#mailboxoptionsmenu ul']})");
		}
		else if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'composeto', 'menu_source': '#abookactions', 'list_object': rcmail.contact_list}); } );
		}
		else if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
			rcmail.addEventListener('contextmenu_init', function(menu) {
				if (menu.menu_name == 'contactlist') {
					// copy the remove from group option in the contact menu
					if (btn = $('#' + rcmail.buttons['group-remove-selected'][0].id).clone()) {
						// remove the ID and add override class
						btn.removeAttr('id').addClass('rcm_active');
						btn = $('<li>').attr('role', 'menuitem').append(btn);
						btn.insertAfter($('#rcmAddressBookMenu').find('a.assigngroup').parent('li'));
					}
				}
			});
			rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'contactlist', 'menu_source': ['#abooktoolbar', '#rcmAddressBookMenu'], 'list_object': rcmail.contact_list}, {
				'init': function(p) { reorder_contact_menu(p); },
				'afteractivate': function(p) {
					p.ref.list_selection(false, rcmail.env.contextmenu_selection);

					// count the number of groups in the current addressbook
					if (!rcmail.env.group || rcmail.env.readonly)
						p.ref.container.find('a.cmd_group-remove-selected').removeClass('active').addClass('disabled');

					// count the number of groups in the current addressbook
					var groupcount = 0;
					if (!rcmail.env.readonly && rcmail.env.address_sources[rcmail.env.source] && rcmail.env.address_sources[rcmail.env.source].groups)
						$.each(rcmail.env.contactgroups, function(){ if (this.source === rcmail.env.source) groupcount++ });

					if (groupcount > 0)
						p.ref.container.find('a.assigngroup').removeClass('disabled').addClass('active');
					else
						p.ref.container.find('a.assigngroup').removeClass('active').addClass('disabled');
				},
				'aftercommand': function(p) {
					if ($(p.el).hasClass('active') && p.command == 'group-remove-selected')
						rcmail.command('listgroup', {'source': rcmail.env.source, 'id': rcmail.env.group}, p.el);
				}
			}); } );
			rcmail.add_onload("rcm_abookmenu_init('#directorylist li, #savedsearchlist li', {'menu_source': ['#directorylist-footer', '#groupoptionsmenu ul']}, {'init': function(p) { reorder_abook_menu(p); }})");
			rcmail.addEventListener('group_insert', function(props) { rcm_abookmenu_init(props.li, {'menu_source': ['#directorylist-footer', '#groupoptionsmenu ul']}); } );
			rcmail.addEventListener('abook_search_insert', function(props) { rcm_abookmenu_init(rcmail.savedsearchlist.get_item('S' + props.id), {'menu_source': ['#directorylist-footer', '#groupoptionsmenu ul']}); } );
		}
	}
});