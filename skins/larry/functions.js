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

rcube_webmail.prototype.contextmenu.skin_funcs.compose_menu_text = function(p) {
    var matches;
    if (matches = $(p.item).children('a').attr('class').match(/\b(addto|addcc|addbcc|vcard)\b/)) {
        $(p.item).children('a').children('span').text($('#compose-contacts div.boxfooter a.' + matches[1]).attr('title'));
    }
};

rcube_webmail.prototype.contextmenu.skin_funcs.reorder_contact_menu = function(p) {
    // put export and more submenus last
    var ul = p.ref.container.find('ul:first');
    p.ref.container.find('a.export').parent('li').appendTo(ul);
    p.ref.container.find('a.more').parent('li').appendTo(ul);
};

rcube_webmail.prototype.contextmenu.skin_funcs.reorder_settings_menu = function(p) {
    // remove the create option from the settings menu
    p.ref.container.find('a.create,a.search,a.import').parent().remove();
};

$(document).ready(function() {
    if (window.rcmail) {
        $.extend(rcmail.contextmenu.settings, {
            popup_pattern: /UI\.toggle_popup\(\x27([^\x27]+)\x27/
        });

        if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function(props) { rcmail.contextmenu.init_list(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#messagetoolbar'}); } );
            rcmail.add_onload("rcmail.contextmenu.init_folder('#mailboxlist li', {'menu_source': ['#rcmfoldermenu', '#mailboxoptionsmenu']})");
        }
        else if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
            rcmail.addEventListener('insertrow', function(props) { rcmail.contextmenu.init_list(props.row.id, {'menu_name': 'composeto', 'menu_source': '#compose-contacts div.boxfooter', 'list_object': 'contact_list'}, {
                'insertitem': function(p) { rcmail.contextmenu.skin_funcs.compose_menu_text(p); }
            }); } );
        }
        else if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function(props) { rcmail.contextmenu.init_list(props.row.id, {'menu_name': 'contactlist', 'menu_source': ['#addressbooktoolbar', '#addresslist div.boxfooter a.delete'], 'list_object': 'contact_list'}, {
                'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_contact_menu(p); }
            }); } );
            rcmail.add_onload("rcmail.contextmenu.init_addressbook('#directorylist li, #savedsearchlist li', {'menu_source': ['#directorylist-footer a.add', '#groupoptionsmenu']})");
            rcmail.addEventListener('group_insert', function(props) { rcmail.contextmenu.init_addressbook(props.li, {'menu_source': ['#directorylist-footer', '#groupoptionsmenu']}); } );
            rcmail.addEventListener('abook_search_insert', function(props) { rcmail.init_addressbook(rcmail.savedsearchlist.get_item('S' + props.id), {'menu_source': ['#directorylist-footer', '#groupoptionsmenu']}); } );
        }
        else if (rcmail.env.task == 'settings') {
            var menus = [
                {'obj': '#settings-tabs > ul > li', 'props': {'menu_name': 'settingslist', 'menu_source': '#rcmsettings > ul'}},
                {'obj': '#sections-table tr', 'props': {'menu_name': 'preferenceslist', 'menu_source': '#rcmsettings > ul', 'list_object': 'sections_list'}},
                {'obj': '#subscription-table li', 'props': {'menu_name': 'folderlist', 'menu_source': ['#rcmsettings > ul', '#mailboxoptionsmenu'], 'list_object': 'subscription_list', 'treelist': true}, 'events': {'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_settings_menu(p); }}},
                {'obj': '#identities-table tr', 'props': {'menu_name': 'identiteslist', 'menu_source': ['#rcmsettings > ul', '#identitieslist div.boxfooter a.delete'], 'list_object': 'identity_list'}, 'events': {'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_settings_menu(p); }}},
                {'obj': '#responses-table tr', 'props': {'menu_name': 'responseslist', 'menu_source': ['#rcmsettings > ul', '#responseslist div.boxfooter a.delete'], 'list_object': 'responses_list'}, 'events': {'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_settings_menu(p); }}},
                {'obj': '#filtersetslist tr', 'props': {'menu_name': 'managesievesetlist', 'menu_source': ['#rcmsettings > ul', '#filtersetmenu-menu'], 'list_object': 'filtersets_list'}, 'events': {'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_settings_menu(p); }}},
                {'obj': '#filterslist tr', 'props': {'menu_name': 'managesieverulelist', 'menu_source': ['#rcmsettings > ul', '#filtermenu-menu'], 'list_object': 'filters_list'}, 'events': {'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_settings_menu(p); }}},
                {'obj': '#keys-table tr', 'props': {'menu_name': 'enigmakeylist', 'menu_source': ['#rcmsettings > ul', '#keyoptions > ul', '#keystoolbar'], 'list_object': 'keys_list', 'list_id': 'keys-table'}, 'events': {'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_settings_menu(p); }}}
            ];

            $.each(menus, function() {
                var menu = this;
                if ($(menu.obj).length > 0 && (!menu.props.list_objec || rcmail[menu.props.list_object])) {
                    rcmail.addEventListener('init', function() {
                        rcmail.contextmenu.init_settings(menu.obj, menu.props, menu.events);

                        if (menu.props.list_object && rcmail[menu.props.list_object]) {
                            rcmail[menu.props.list_object].addEventListener('initrow', function(props) {
                                rcmail.contextmenu.init_settings('#' + props.id, menu.props, menu.events);
                            });
                        }
                    });
                }
                else if (menu.props.list_object && menu.props.list_id) {
                    rcmail.addEventListener('initlist', function(props) {
                        if ($(props.obj).attr('id') == menu.props.list_id) {
                            rcmail[menu.props.list_object].addEventListener('initrow', function(props) {
                                rcmail.contextmenu.init_settings('#' + props.id, menu.props, menu.events);
                            });
                        }
                    });
                }
            });
        }
    }
});