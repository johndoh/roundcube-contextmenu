/**
 * ContextMenu plugin script
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) Philip Weir
 *
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */

rcube_webmail.prototype.contextmenu.skin_funcs.compose_menu_text = function (p) {
    if ($(p.item).children('a').hasClass('vcard')) {
        $(p.item).children('a').children('span').text($('#abookactions a.vcard').attr('title'));
    }
};

rcube_webmail.prototype.contextmenu.skin_funcs.reorder_addressbook_menu = function (p) {
    // remove the remove from group option from the address book menu
    p.ref.container.find('a.rcm_elem_groupmenulink').remove();
    p.ref.container.find('a.cmd_group-remove-selected').remove();
};

$(document).ready(function () {
    if (window.rcmail) {
        $.extend(true, rcmail.contextmenu.settings, {
            popup_pattern: /rcmail_ui\.show_popup\(\u0027([^\u0027]+)\u0027/,
            classes: {
                button_active: 'active button',
                button_disabled: 'disabled buttonPas',
            },
        });

        if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function (props) { rcmail.contextmenu.init_list(props.row.id, { menu_name: 'messagelist', menu_source: '#messagetoolbar' }); });
            rcmail.add_onload("rcmail.contextmenu.init_folder('#mailboxlist li', {'menu_source': ['#rcmfoldermenu > ul', '#mailboxoptionsmenu ul']})");
        }
        else if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
            rcmail.addEventListener('insertrow', function (props) { rcmail.contextmenu.init_list(props.row.id, { menu_name: 'composeto', menu_source: '#abookactions', list_object: 'contact_list' }, {
                insertitem: function (p) { rcmail.contextmenu.skin_funcs.compose_menu_text(p); },
            }); });
        }
        else if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function (props) { rcmail.contextmenu.init_list(props.row.id, { menu_name: 'contactlist', menu_source: ['#abooktoolbar'], list_object: 'contact_list' }); });
            rcmail.add_onload("rcmail.contextmenu.init_addressbook('#directorylist li, #savedsearchlist li', {'menu_source': ['#directorylist-footer', '#groupoptionsmenu ul']}, {'init': function(p) { rcmail.contextmenu.skin_funcs.reorder_addressbook_menu(p); }})");
            rcmail.addEventListener('group_insert', function (props) { rcmail.contextmenu.init_addressbook(props.li, { menu_source: ['#directorylist-footer', '#groupoptionsmenu ul'] }); });
            rcmail.addEventListener('abook_search_insert', function (props) { rcmail.contextmenu.init_addressbook(rcmail.savedsearchlist.get_item('S' + props.id), { menu_source: ['#directorylist-footer', '#groupoptionsmenu ul'] }); });
        }
        else if (rcmail.env.task == 'settings') {
            rcmail.contextmenu.settings_menus([
                { obj: 'sections-table tr', props: { menu_name: 'preferenceslist', menu_source: '#rcmsettingsmenu > ul', list_object: 'sections_list' } },
                {
                    obj: 'subscription-table li',
                    props: {
                        menu_name: 'folderlist', menu_source: ['#rcmfoldermenu > ul', '#rcmsettingsmenu > ul', '#mailboxoptionsmenu > ul'], list_object: 'subscription_list', init_func: 'init_settings',
                    },
                },
                { obj: 'identities-table tr', props: { menu_name: 'identiteslist', menu_source: ['#rcmsettingsmenu > ul', '#identities-list div.boxfooter'], list_object: 'identity_list' } },
                { obj: 'responses-table tr', props: { menu_name: 'responseslist', menu_source: ['#rcmsettingsmenu > ul', '#responses-list div.boxfooter'], list_object: 'responses_list' } },
                { obj: 'filtersetslist tr', props: { menu_name: 'managesievesetlist', menu_source: ['#rcmsettingsmenu > ul', '#filtersetmenu > ul'], list_object: 'filtersets_list' } },
                { obj: 'filterslist tr', props: { menu_name: 'managesieverulelist', menu_source: ['#rcmsettingsmenu > ul', '#filtermenu > ul'], list_object: 'filters_list' } },
                {
                    obj: 'keys-table tr',
                    props: {
                        menu_name: 'enigmakeylist', menu_source: ['#rcmsettingsmenu > ul', '#keystoolbar'], list_object: 'keys_list', list_id: 'keys-table',
                    },
                },
            ]);
        }
    }
});
