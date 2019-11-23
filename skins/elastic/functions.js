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

$(document).ready(function() {
    if (window.rcmail) {
        $.extend(true, rcmail.contextmenu.settings, {
            popup_attrib: 'data-popup',
            popup_func: "rcm_popup_wrapper('$2');",
            popup_pattern: /rcm_popup_wrapper\(\x27([^\x27]+)\x27|^([a-z0-9\-]+)$/i,
            classes: { container: 'contextmenu', button_remove: '', modal_overlay: 'popover-overlay' },
            menu_defaults: {
                modal: true,
                classes: {
                    ul: 'menu listing',
                    a: 'button rcmbutton',
                    sub_button_a: 'rcmsubbutton',
                    sub_button_span: null
                }
            },
            global_events: {
                'init': function(p) {
                    if (!p.ref.is_submenu) {
                        var label = 'close',
                            title = rcmail.gettext(label),
                            class_name = 'button icon cancel';

                        var header = $('<h3>').addClass('popover-header')
                            .append($('<a>').attr('class', class_name).text(title))
                            .on('click', function(e) {
                                rcmail.contextmenu.hide_all(e, $('div.contextmenu').filter(':visible').length >= 1);
                            });

                        $(p.ref.container).addClass('popover').prepend(header).children('ul').wrap($('<div>').addClass('popover-body'));
                    }
                    else {
                       p.ref.skinable = true;
                    }
                },
                'insertitem': function(p) {
                    var elem = p.originalElement, a = p.item.children('a');

                    if (elem.attr('data-popup') || elem.attr('aria-haspopup')) {
                        a.data('level', (p.ref.parents + 2));
                        a.attr('aria-haspopup', true);
                    }
                },
                'beforeactivate': function(p) {
                    // force toolbar display on small screens while the contextmenu renders
                    if (!$('#layout-content').is(':visible'))
                        $('#layout-content').addClass('contextmenu_content');

                    // do not show submenus on mouseover for small screens
                    p.ref.mouseover_timeout = $('html').is('.layout-small,.layout-phone') ? -1 : rcmail.env.contextmenu_mouseover_timeout;
                },
                'afteractivate': function() {
                    $('#layout-content').removeClass('contextmenu_content');
                },
                'submenu_toggle': function(p) {
                    var matches;
                    if ($(p.id).length > 0 && (matches = p.id.match(/^(#[^\s]+(\s>\s\.[a-z]+\s>)?(\sdiv)?)/)) && p.id.indexOf('#taskmenu') == -1) {
                        var source_id = matches[1];

                        // make sure its a real submenu and not the toolbar on a small screen
                        if ($(source_id).is('div') && !$(source_id).hasClass('footer')) {
                            $(source_id)[p.show ? 'show' : 'hide']();
                            $(source_id)[p.show ? 'removeClass' : 'addClass']('hidden');
                        }
                    }
                },
                'hide_menu': function(p) {
                    // Hide Bootstrap popover styled sub menus
                    $.each(p.ref.submenus, function() {
                        if (this.container.parents('.popover.show').length == 1) {
                            var container = this.container.parents('.popover.show'),
                                popup = $('.popover-body', container),
                                button = popup.children().first().data('button');

                            if (button && p.originalEvent.target != button && !$(button).find(p.originalEvent.target).length && typeof button !== 'string') {
                                $(button).popover('hide');
                            }

                            if (!button) {
                                $(container).remove();
                            }
                        }
                    });
                }
            }
        });

        // Remove any tooltips added to menu elements by Elastic UI JS
        rcmail.addEventListener('enable-command', function() { $('div.contextmenu').find('a.rcmbutton').removeAttr('title'); });

        // Ensure menus are always hidden when opening a dialog box (#114)
        rcmail.addEventListener('dialog-open', function() { rcmail.contextmenu.hide_all(event, false, true); });

        if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function(props) { rcmail.contextmenu.init_list(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#toolbar-menu > li'}); } );
            rcmail.add_onload("rcmail.contextmenu.init_folder('#mailboxlist li', {'menu_source': ['#rcmfolder-menu > ul', '#mailboxoptions-menu > ul > li']})");
        }
        else if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
            // on small screens the compose button is not visible so use rcm-active class to ensure it shows up in the menu
            $('#taskmenu > span > a.compose').addClass('rcm-active');
            rcmail.addEventListener('insertrow', function(props) { rcmail.contextmenu.init_list(props.row.id, {'menu_name': 'contactlist', 'menu_source': ['#taskmenu > span > a.compose', '#toolbar-menu > li'], 'list_object': 'contact_list'}); } );
            rcmail.add_onload("rcmail.contextmenu.init_addressbook('#directorylist li, #savedsearchlist li', {'menu_source': '#groupoptions-menu > ul > li'})");
            rcmail.addEventListener('group_insert', function(props) { rcmail.contextmenu.init_addressbook(props.li, {'menu_source': '#groupoptions-menu > ul > li'}); } );
            rcmail.addEventListener('abook_search_insert', function(props) { rcmail.contextmenu.init_addressbook(rcmail.savedsearchlist.get_item('S' + props.id), {'menu_source': '#groupoptions-menu > ul > li'}); } );
        }
        else if (rcmail.env.task == 'settings') {
            rcmail.contextmenu.settings_menus([
                {'obj': 'settings-menu li', 'props': {'menu_name': 'settingslist', 'menu_source': '#rcmsettings-menu > ul', 'init_func': 'init_settings'}},
                {'obj': 'sections-table tr', 'props': {'menu_name': 'preferenceslist', 'menu_source': '#rcmsettings-menu > ul', 'list_object': 'sections_list'}},
                {'obj': 'subscription-table li', 'props': {'menu_name': 'folderlist', 'menu_source': ['#rcmfolder-menu > ul', '#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'subscription_list', 'init_func': 'init_settings'}},
                {'obj': 'identities-table tr', 'props': {'menu_name': 'identiteslist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'identity_list'}},
                {'obj': 'responses-table tr', 'props': {'menu_name': 'responseslist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'responses_list'}},
                {'obj': 'filtersetslist tr', 'props': {'menu_name': 'managesievesetlist', 'menu_source': ['#rcmsettings-menu > ul', '#filterset-menu > ul > li'], 'list_object': 'filtersets_list'}},
                {'obj': 'filterslist tr', 'props': {'menu_name': 'managesieverulelist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'filters_list'}},
                {'obj': 'keys-table tr', 'props': {'menu_name': 'enigmakeylist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'keys_list', 'list_id': 'keys-table'}}
            ]);
        }
    }
});