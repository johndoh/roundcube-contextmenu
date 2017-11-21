/**
 * ContextMenu plugin script
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2017 Philip Weir
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
    var matches;
    if (matches = $(p.item).children('a').attr('class').match(/\b(addto|addcc|addbcc)\b/)) {
        $(p.item).children('a').children('span').text($('#layout > .sidebar > div.footer a.' + matches[1]).attr('title'));
    }
}

function rcm_reorder_contact_menu(p) {
    // put export link last
    var ul = $(p.ref.container).find('ul:first');
    $(p.ref.container).find('a.export').parent('li').appendTo(ul);

    // put assign group link before remove
    $(p.ref.container).find('a.assigngroup').parent('li').insertBefore($(p.ref.container).find('a.removegroup').parent('li'));
}

function rcm_submenu_toggle(p) {
    var matches;
    if ((matches = p.id.match(/^(#[^\s]+(\s>\s\.[a-z]+\s>)?(\sdiv\.footer)?)/)) && p.id.indexOf('#taskmenu') == -1) {
        var source_id = matches[1];

        // special handling for additional options in folders and contacts menus
        if (source_id == '#rcmFolderMenu' || source_id == '#rcmAddressBookMenu') {
            source_id = $(source_id).parent();
        }

        // make sure its a real submenu and not the toolbar on a small screen
        if ($(source_id).is('div')) {
            if (p.show) {
                $(source_id).show();
                $(source_id).removeClass('hidden');
            }
            else {
                $(source_id).hide();
                $(source_id).addClass('hidden');
            }
        }
    }
}

$(document).ready(function() {
    if (window.rcmail) {
        rcmail.context_menu_settings = $.extend(true, rcmail.context_menu_settings, {
            popup_attrib: 'data-popup',
            popup_func: "rcm_popup_wrapper('$2');",
            popup_pattern: /rcm_popup_wrapper\(\x27([^\x27]+)\x27|^([a-z0-9\-]+)$/i,
            classes: { button_ignore: '', modal_overlay: 'popover-overlay' },
            menu_defaults: {
                modal: true,
                classes: {
                    div: rcmail.context_menu_settings.classes.container + ' popover',
                    ul: 'toolbarmenu toolbar listing',
                    a: 'button rcmbutton',
                    sub_button_a: 'rcmsubbutton',
                    sub_button_span: null
                }
            },
            menu_events: {
                '+init': function(p) {
                    var label = $('div.contextmenu:visible').length >= 1 ? 'back' : 'close',
                        title = rcmail.gettext(label),
                        class_name = 'button icon ' + (label == 'back' ? 'back' : 'cancel');

                    var header = $('<h3>').addClass('popover-header')
                        .append($('<a>').attr('class', class_name).text(title))
                        .click(function(e) {
                            rcm_hide_menu(e, $('div.contextmenu:visible').length >= 1);
                        });

                    $(p.ref.container).prepend(header).children('ul').wrap($('<div>').addClass('popover-body'));
                },
                '+beforeactivate': function() {
                    // force toolbar display on small screens while the contextmenu renders
                    if (!$('#layout > .content').is(':visible'))
                        $('#layout > .content').addClass('contextmenu_content');

                    // change default message list contextmenu to look like normal rc menu when on small screen
                    $('a.rcm_elem_markmessagemenulink,a.rcm_elem_messagemenulink')[($('html').hasClass('layout-phone') || $('html').hasClass('layout-small')) ? 'removeClass' : 'addClass']('rcmsubbutton');
                },
                '+afteractivate': function() {
                    $('#layout > .content').removeClass('contextmenu_content');
                },
                'submenu_toggle': function(p) { rcm_submenu_toggle(p); }
            }
        });

        if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#toolbar-menu > li'}); } );
            rcmail.add_onload("rcm_foldermenu_init('#mailboxlist li', {'menu_source': ['#rcmFolderMenu', '#mailboxoptions-menu > ul > li']})");

            // remove import option from message menu
            rcmail.addEventListener('contextmenu_init', function(menu) {
                if (menu.menu_name == 'message-menu') {
                    menu.addEventListener('addmenuitem', function(p) {
                        var src_elem = !$(p.el).is('a') ? $(p.el).find('a:first') : $(p.el);
                        if (src_elem[0] && src_elem[0].hasAttribute('onclick') && src_elem.attr('onclick').match(/\x27import-messages\x27/)) {
                            p.abort = true;
                            return p;
                        }
                    });
                }
            });
        }
        else if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
            rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'composeto', 'menu_source': '#layout > .sidebar > div.footer', 'list_object': 'contact_list'}, {
                'insertitem': function(p) { rcm_add_menu_text(p); }
            }); } );
        }
        else if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function(props) { rcm_listmenu_init(props.row.id, {'menu_name': 'contactlist', 'menu_source': ['#taskmenu > span > a.compose', '#toolbar-menu > li', '#rcmAddressBookMenu'], 'list_object': 'contact_list'}, {
                'init': function(p) { rcm_reorder_contact_menu(p); }
            }); } );
            rcmail.add_onload("rcm_abookmenu_init('#directorylist li, #savedsearchlist li', {'menu_source': ['#layout > .sidebar > div.footer a.create', '#groupoptions-menu > ul > li']})");
            rcmail.addEventListener('group_insert', function(props) { rcm_abookmenu_init(props.li, {'menu_source': ['#layout > .sidebar > div.footer a.create', '#groupoptions-menu > ul > li']}); } );
            rcmail.addEventListener('abook_search_insert', function(props) { rcm_abookmenu_init(rcmail.savedsearchlist.get_item('S' + props.id), {'menu_source': ['#layout > .sidebar > div.footer a.create', '#groupoptions-menu > ul > li']}); } );
        }
    }
});