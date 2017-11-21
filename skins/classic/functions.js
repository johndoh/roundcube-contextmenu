/**
 * ContextMenu plugin script
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2014-2017 Philip Weir
 *
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */

function rcm_add_menu_text(p) {
    if ($(p.item).children('a').hasClass('vcard')) {
        $(p.item).children('a').children('span').text($('#abookactions a.vcard').attr('title'));
    }
}

function rcm_reorder_contact_menu(p) {
    // put export link last
    var ul = p.ref.container.find('ul:first');
    $(p.ref.container).find('a.export').parent('li').appendTo(ul);
}

function rcm_reorder_abook_menu(p) {
    // remove the remove from group option from the address book menu
    p.ref.container.find('a.rcm_elem_groupmenulink').remove();
    p.ref.container.find('a.cmd_group-remove-selected').remove();
}

$(document).ready(function() {
    if (window.rcmail) {
        rcmail.context_menu_settings = $.extend(true, rcmail.context_menu_settings, {
            popup_pattern: /rcmail_ui\.show_popup\(\x27([^\x27]+)\x27/,
            classes: {
                button_active: 'active button',
                button_disabled: 'disabled buttonPas'
            }
        });

        if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#messagetoolbar'}); } );
            rcmail.add_onload("rcm_foldermenu_init('#mailboxlist li', {'menu_source': ['#rcmFolderMenu', '#mailboxoptionsmenu ul']})");
        }
        else if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
            rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'composeto', 'menu_source': '#abookactions', 'list_object': 'contact_list'}, {
                'insertitem': function(p) { rcm_add_menu_text(p); }
            }); } );
        }
        else if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
            rcmail.addEventListener('contextmenu_init', function(menu) {
                if (menu.menu_name == 'contactlist') {
                    // copy the remove from group option in the contact menu
                    var btn;
                    if (btn = $('#' + rcmail.buttons['group-remove-selected'][0].id).clone()) {
                        // remove the ID and add override class
                        btn.removeAttr('id').addClass('rcm_active');
                        btn = $('<li>').attr('role', 'menuitem').append(btn);
                        btn.insertAfter($('#rcmAddressBookMenu').find('a.assigngroup').parent('li'));
                    }
                }
            });
            rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'contactlist', 'menu_source': ['#abooktoolbar', '#rcmAddressBookMenu'], 'list_object': 'contact_list'}, {
                'init': function(p) { rcm_reorder_contact_menu(p); }
            }); } );
            rcmail.add_onload("rcm_abookmenu_init('#directorylist li, #savedsearchlist li', {'menu_source': ['#directorylist-footer', '#groupoptionsmenu ul']}, {'init': function(p) { rcm_reorder_abook_menu(p); }})");
            rcmail.addEventListener('group_insert', function(props) { rcm_abookmenu_init(props.li, {'menu_source': ['#directorylist-footer', '#groupoptionsmenu ul']}); } );
            rcmail.addEventListener('abook_search_insert', function(props) { rcm_abookmenu_init(rcmail.savedsearchlist.get_item('S' + props.id), {'menu_source': ['#directorylist-footer', '#groupoptionsmenu ul']}); } );
        }
    }
});