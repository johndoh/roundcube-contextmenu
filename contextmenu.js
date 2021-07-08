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

rcube_webmail.prototype.contextmenu = {
    settings: {
        no_right_click_on_menu: true,
        skip_commands: ['mail-checkmail', 'mail-compose', 'addressbook-add', 'addressbook-import', 'addressbook-advanced-search', 'addressbook-search-create'],
        command_pattern: /rcmail\.command\(\x27([^\x27]+)\x27,\s?\x27((?:\\\x27|[^\x27])*)\x27/,
        addressbook_pattern: /([A-Z0-9\-_]+(:[A-Z0-9\-_]+)?)/i,
        popup_attrib: 'onclick',
        popup_pattern: '',
        popup_func: '',
        classes: {
                container: 'contextmenu popupmenu',
                mainmenu: 'rcmmainmenu rcm-mainmenu', // rcmmainmenu class depreciated in v3.0
                submenu: 'rcmsubmenu submenu rcm-submenu', // rcmsubmenu submenu classes depreciated in v3.0
                button_remove: 'button',
                button_active: 'active',
                button_disabled: 'disabled'
            },
        menu_defaults: {},
        global_events: {
            'submenu_toggle': function(p) {
                $(p.id).parent()[(p.show) ? 'show' : 'hide']();
            }
        },
        menu_events: {
            'command': function(p) {
                if (!$(p.el).is('.' + rcmail.contextmenu.settings.classes.button_active.replace(/ /g, ', .')))
                    return;

                var result = rcmail.command(p.command, p.args, p.el, p.evt, true);

                return result;
            }
        }
    },

    vars: {
        popup_menus: [],
        popup_commands: {},
    },

    skin_funcs: {},

    init_list: function(row, props, events) {
        if (!events)
            events = {};

        // backwards compatibility, list_object changed to string in v3.0
        if (typeof props.list_object == 'object') {
            console.log('Roundcube ContextMenu plugin: init_list() list_object param object detected, expected string.');
            var id = $(props.list_object.list).attr('id');
            props.list_object = null;

            if (id == 'contacts-table') {
                props.list_object = 'contact_list';
            }
        }

        if (!props.list_object)
            props.list_object = 'message_list';

        var trigger_list_select = function(list) {
            var prev_contentframe = rcmail.env.contentframe;
            rcmail.env.contentframe = null;
            rcmail[list].triggerEvent('select');
            rcmail.env.contentframe = prev_contentframe;
        };

        var menu = rcmail.contextmenu.init(props, $.extend({
            'beforeactivate': function(p) {
                if (p.ref.is_submenu) {
                    p.ref.menu_selection = p.ref.parent_menu.menu_selection;
                }
                else if (rcmail[p.ref.list_object].selection.length == 0 || !rcmail[p.ref.list_object].in_selection(rcmail.env.context_menu_source_id)) {
                    p.ref.menu_selection = [rcmail.env.context_menu_source_id];
                }
                else {
                    p.ref.menu_selection = rcmail[p.ref.list_object].get_selection();
                }

                if (!rcmail[p.ref.list_object].in_selection(rcmail.env.context_menu_source_id)) {
                    rcmail.env.contextmenu_opening = 'beforeactivate';
                    trigger_list_select(p.ref.list_object);
                }

                if (rcmail.task == 'settings' && p.ref.menu_name != 'settingslist') {
                    p.ref.container.find('a.openextwin').parent().remove();
                }
            },
            'afteractivate': function(p) {
                rcmail.env.contextmenu_opening = 'afteractivate';
                if (!rcmail[p.ref.list_object].in_selection(rcmail.env.context_menu_source_id))
                    trigger_list_select(p.ref.list_object);

                rcmail.env.contextmenu_opening = null;
            },
            'beforecommand': function(p) {
                if (rcmail.task == 'settings' && p.ref.menu_name != 'settingslist' && p.command == 'plugin.contextmenu.openinline') {
                    rcmail[p.ref.list_object].select_row(rcmail.env.context_menu_source_id);
                    return {'abort': true, 'result': true};
                }
            },
            'aftercommand': function(p) {
                if (p.command == 'group-remove-selected') {
                    // update contactlist after contact remove (not done by core because there is no selection)
                    rcmail.command('listgroup', {'source': rcmail.env.source, 'id': rcmail.env.group}, p.el);
                }
            }
        }, events));

        $("#" + row).on('contextmenu', function(e) {
            var uid;
            if (uid = rcmail[props.list_object].get_row_uid(this)) {
                rcmail.contextmenu.hide_all(e);
                rcmail.contextmenu.show_one(e, this, uid, menu);
            }
        });

        rcmail[props.list_object].addEventListener('getselection', function(p) {
            if (rcmail.env.contextmenu_opening == 'afteractivate')
                return;

            var uids = null;
            $.each(rcmail.env.contextmenus, function() {
                if (this.menu_selection.length > 0 && (rcmail.env.contextmenu_opening == 'beforeactivate' || $(this.container).is(':visible'))) {
                    uids = this.menu_selection;
                    return false;
                }
            });

            if (uids) {
                p.res = uids;
                return false;
            }
        });
    },

    init_folder: function(el, props, events) {
        if (!events)
            events = {};

        var menu = rcmail.contextmenu.init($.extend({'menu_name': 'folderlist', 'list_object': null}, props), $.extend({
            'beforeactivate': function() {
                if (rcmail.env.contextmenu_messagecount_request) {
                    rcmail.env.contextmenu_messagecount_request.abort();
                }
                rcmail.env.contextmenu_messagecount_request = null;
            },
            'activate': function(p) {
                return rcmail.contextmenu.activate_folder_commands(p);
            },
            'beforecommand': function(p) {
                if (rcmail.env.context_menu_source_id != rcmail.env.mailbox && $.inArray(p.command, Array('expunge', 'purge')) >= 0) {
                    rcmail[p.command + '_mailbox'](rcmail.env.context_menu_source_id);
                    return {'abort': true, 'result': true};
                }
                else if (rcmail.env.context_menu_source_id != rcmail.env.mailbox && p.command == 'mark-all-read') {
                    rcmail.mark_all_read(rcmail.env.context_menu_source_id);
                    return {'abort': true, 'result': true};
                }
            }
        }, events));

        $(el).on('click', function(e) {
            // hide menu when changing folder
            rcmail.contextmenu.hide_all(e);
        })
        .on('contextmenu', function(e) {
            var source = $(this).find('a[rel][onclick]').filter(function() { return $(this).attr('onclick').match(rcmail.contextmenu.settings.command_pattern); }).first();
            source.blur(); // remove focus (and keyboard nav highlighting) from source element

            rcmail.contextmenu.hide_all(e);
            rcmail.contextmenu.show_one(e, this, source.attr('rel'), menu);
        });
    },

    init_addressbook: function(el, props, events) {
        if (!events)
            events = {};

        var menu = rcmail.contextmenu.init($.extend({'menu_name': 'abooklist'}, props), $.extend({
            'beforeactivate': function(p) {
                p.ref.container.find('li.' + rcmail.contextmenu.settings.classes.submenu.replace(/ /g, '.')).remove();
            },
            'activate': function(p) {
                var ids = rcmail.env.context_menu_source_id.split(':', 2);
                var cur_source = ids[0];

                if (p.command == 'group-create') {
                    // addressbook
                    if ($(p.source).hasClass('addressbook') && rcmail.env.address_sources[cur_source].groups && !rcmail.env.address_sources[cur_source].readonly) {
                        p.enabled = true;
                    }
                    else {
                        p.enabled = false;
                    }
                }
                else if (p.command == 'group-rename' || p.command == 'group-delete') {
                    // group
                    if ($(p.source).hasClass('contactgroup') && !rcmail.env.address_sources[cur_source].readonly) {
                        p.enabled = true;
                    }
                    else {
                        p.enabled = false;
                    }
                }
                else if (p.command == 'search-delete') {
                    // saved search
                    if ($(p.source).hasClass('contactsearch')) {
                        p.enabled = true;
                    }
                    else {
                        p.enabled = false;
                    }
                }

                return p;
            },
            'command': function(p) {
                if (!$(p.el).is('.' + rcmail.contextmenu.settings.classes.button_active.replace(/ /g, ', .')))
                    return;

                var prev_source = rcmail.env.source;
                var prev_group = rcmail.env.group;
                var result = false;

                var ids = rcmail.env.context_menu_source_id.split(':', 2);
                var cur_source = ids[0];
                var cur_id = ids[1];

                rcmail.env.source = cur_source;
                rcmail.env.group = cur_id;

                switch (p.command) {
                    case 'search-delete':
                        if ($(p.ref.selected_object).children('a').attr('rel')) {
                            var prev_search_id = rcmail.env.search_id;
                            var prev_search_request = rcmail.env.search_request;
                            rcmail.env.search_request = true;
                            rcmail.env.search_id = $(p.ref.selected_object).children('a').attr('rel').replace('S', '');

                            result = rcmail.command(p.command, p.args, p.el, p.evt, true);

                            rcmail.env.search_request = prev_search_request;
                            rcmail.env.search_id = prev_search_id;
                        }
                        break;
                    default:
                        result = rcmail.command(p.command, p.args, p.el, p.evt, true);
                        break;
                }

                rcmail.env.source = prev_source;
                rcmail.env.group = prev_group;

                return result;
            }
        }, events));

        $(el).on('click', function(e) {
            // hide menu when changing address book
            rcmail.contextmenu.hide_all(e);
        })
        .on('contextmenu', function(e) {
            var source = $(this).find('a[rel]').filter(function() { return $(this).attr('rel').match(rcmail.contextmenu.settings.addressbook_pattern); }).first(), matches;
            source.blur(); // remove focus (and keyboard nav highlighting) from source element

            if (matches = source.attr('rel').match(rcmail.contextmenu.settings.addressbook_pattern)) {
                rcmail.contextmenu.hide_all(e);
                rcmail.contextmenu.show_one(e, this, matches[1], menu);
            }
        });
    },

    init_settings: function(el, props, events) {
        if (!events)
            events = {};

        var menu = rcmail.contextmenu.init(props, $.extend({
            'beforeactivate': function(p) {
                if (p.ref.menu_name != 'settingslist') {
                    p.ref.container.find('a.openextwin').parent().remove();
                }

                if (p.ref.menu_name == 'folderlist') {
                    if (rcmail.env.contextmenu_messagecount_request) {
                        rcmail.env.contextmenu_messagecount_request.abort();
                    }
                    rcmail.env.contextmenu_messagecount_request = null;
                }
            },
            'activate': function(p) {
                if (p.ref.menu_name == 'folderlist') {
                    p = rcmail.contextmenu.activate_folder_commands(p);
                }

                return p;
            },
            'beforecommand': function(p) {
                if (p.ref.menu_name == 'folderlist') {
                    var result;
                    if ($.inArray(p.command, Array('delete-folder', 'purge')) >= 0) {
                        result = rcmail[p.command == 'delete-folder' ? 'delete_folder' : p.command + '_mailbox'](rcmail.env.context_menu_source_id);
                    }
                    else if (p.command == 'plugin.contextmenu.openinline') {
                        rcmail[p.ref.list_object].select(rcmail.env.context_menu_source_id);
                    }
                    else {
                        result = rcmail.command(p.command, p.args);
                    }

                    return {'abort': true, 'result': true};
                }
            }
        }, events));

        $(el).on('contextmenu', function(e) {
            var source = $(this).find('a').first();
            source.blur(); // remove focus (and keyboard nav highlighting) from source element

            if (props.menu_name == 'settingslist') {
                var matches;
                if (matches = source.attr('onclick').match(rcmail.contextmenu.settings.command_pattern)) {
                    rcmail.contextmenu.hide_all(e);
                    rcmail.contextmenu.show_one(e, this, matches[2], menu);
                }
            }
            else if (props.menu_name == 'folderlist') {
                rcmail.contextmenu.hide_all(e);
                rcmail.contextmenu.show_one(e, this, rcmail.folder_id2name($(this).attr('id')), menu);
            }
        });
    },

    init: function(props, ext_events) {
        var events = $.extend({}, rcmail.contextmenu.settings.menu_events, ext_events), menu;

        if (!rcmail.env.contextmenus[props.menu_name]) {
            menu = new rcube_context_menu(props);

            $.each(rcmail.contextmenu.settings.global_events, function(trigger, func) {
                menu.addEventListener(trigger, function(p) { return func(p); });
            });

            $.each(events, function(trigger, func) {
                menu.addEventListener(trigger, function(p) { return func(p); });
            });

            menu.init();
            rcmail.env.contextmenus[props.menu_name] = menu;
        }
        else {
            menu = rcmail.env.contextmenus[props.menu_name];
        }

        return menu;
    },

    show_one: function(e, src_elm, src_id, menu_obj) {
        // if contextmenus have been disabled then show browser context menu as normal
        if (!rcmail.env.contextmenu)
            return true;

        rcube_event.cancel(e);

        // hide any other open menus
        for (var i = 0; i < rcmail.contextmenu.vars.popup_menus.length; i++) {
            rcmail.hide_menu(rcmail.contextmenu.vars.popup_menus[i], e);
        }

        rcmail.env.context_menu_source_id = src_id;
        menu_obj.show_menu(src_elm, e);
    },

    hide_all: function(e, sub_only, no_trigger) {
        var remove_menu = function(e, menu) {
            if (!menu.container.is(':visible'))
                return;

            menu.hide_menu(e);

            if (!no_trigger) {
                var menu_name = 'rcm_' + menu.menu_name;
                rcmail.triggerEvent('menu-close', { name: menu_name, props:{ menu: menu_name }, originalEvent: e });
            }
        }

        $.each(rcmail.env.contextmenus, function() {
            if (!sub_only) {
                remove_menu(e, this);
            }
            else {
                $.each(this.submenus, function() {
                    remove_menu(e, this);
                });
            }
        });

        // close popup menus opened by the contextmenu
        for (var i = rcmail.contextmenu.vars.popup_menus.length - 1; i >= 0; i--) {
            rcmail.hide_menu(rcmail.contextmenu.vars.popup_menus[i], e);
        }
    },

    activate_folder_commands: function(p) {
        if ($.inArray(p.command, Array('expunge', 'purge', 'mark-all-read')) >= 0) {
            // disable the commands by default
            p.enabled = false;

            // if menu is opened on current folder (or special mark-all-read command) then enable the commands same as in UI
            if ((rcmail.env.context_menu_source_id == rcmail.env.mailbox || p.command == 'mark-all-read') && rcmail.commands[p.command]) {
                p.enabled = true;
            }
            // if menu is opened on difference folder then get message count for the folder
            else if (rcmail.env.context_menu_source_id != rcmail.env.mailbox && !rcmail.env.contextmenu_messagecount_request) {
                p.enabled = false;

                // folder check called async to prevent slowdown on menu load
                rcmail.env.contextmenu_messagecount_request = $.ajax({
                    type: 'POST', url: rcmail.url('plugin.contextmenu.messagecount'), data: {'_mbox': rcmail.env.context_menu_source_id}, dataType: 'json', async: true,
                    success: function(data) {
                        if (data.messagecount > 0 && $('#rcm_folderlist').is(':visible')) {
                            // override the environment to check if commands should be abled
                            var temp_exists = rcmail.env.exists;
                            var temp_mailbox = rcmail.env.mailbox;
                            rcmail.env.exists = data.messagecount;
                            rcmail.env.mailbox = rcmail.env.context_menu_source_id;

                            if (data.messagecount > 0) {
                                $('#rcm_folderlist').find('a.cmd_expunge').addClass(rcmail.contextmenu.settings.classes.button_active).removeClass(rcmail.contextmenu.settings.classes.button_disabled);
                                $('#rcm_folderlist').find('a.cmd_purge').addClass(rcmail.contextmenu.settings.classes.button_active).removeClass(rcmail.contextmenu.settings.classes.button_disabled);
                            }

                            rcmail.env.exists = temp_exists;
                            rcmail.env.mailbox = temp_mailbox;
                        }
                    }
                });
            }
        }
        else if ($.inArray(p.command, Array('plugin.contextmenu.collapseall', 'plugin.contextmenu.expandall')) >= 0) {
            var list_obj = rcmail.gui_objects[rcmail.env.task == 'settings' ? 'subscriptionlist' : 'mailboxlist'];
            var class_name = p.command == 'plugin.contextmenu.collapseall' ? 'expanded' : 'collapsed';

            p.enabled = false;
            if ($(list_obj).find('div.' + class_name + ':visible').length > 0) {
                p.enabled = true;
            }
        }
        else if (rcmail.env.task == 'settings' && p.command == 'delete-folder') {
            p.enabled = false;
            // From rcmail::subscription_select()
            var folder;
            if ((folder = rcmail.env.subscriptionrows[rcmail.env.context_menu_source_id]) && !folder[2]) {
                p.enabled = true;
            }
        }

        return p;
    },

    ui_button_check: function(btn, active) {
        var classes = (active ? rcmail.contextmenu.settings.classes.button_active : rcmail.contextmenu.settings.classes.button_disabled);
        classes = '.' + classes.replace(/ /g, ', .');

        return $('#' + btn).is(classes);
    },

    settings_menus: function(menus) {
        var default_events = {'init': function(p) {
            // remove options like create, import etc from the settings menu
            // addgroup class is used in Classic skin
            p.ref.container.find('a.addgroup,a.create,a.search,a.import').parent().remove();
        }};

        $.each(menus, function() {
            var menu = this;

            if ($('#' + menu.obj).length > 0) {
                rcmail.addEventListener('init', function() {
                    if (menu.props.init_func) {
                        rcmail.contextmenu[menu.props.init_func]('#' + menu.obj, menu.props, menu.events || default_events);
                    }
                    else if (rcmail[menu.props.list_object]) {
                        rcmail.contextmenu.init_list(menu.obj, menu.props, menu.events || default_events);

                        rcmail[menu.props.list_object].addEventListener('initrow', function(props) {
                            rcmail.contextmenu.init_list(props.id, menu.props, menu.events || default_events);
                        });
                    }
                });
            }
            else if (menu.props.list_object && menu.props.list_id) {
                rcmail.addEventListener('initlist', function(props) {
                    if ($(props.obj).attr('id') == menu.props.list_id) {
                        rcmail[menu.props.list_object].addEventListener('initrow', function(props) {
                            rcmail.contextmenu.init_list(props.id, menu.props, menu.events || default_events);
                        });
                    }
                });
            }
        });
    }
};

// backwards compatibility, functions renamed in v3.0
function rcm_listmenu_init(row, props, events) { rcm_log('rcm_listmenu_init'); rcmail.contextmenu.init_list(row, props, events); }
function rcm_foldermenu_init(el, props, events) { rcm_log('rcm_foldermenu_init'); rcmail.contextmenu.init_folder(el, props, events); }
function rcm_abookmenu_init(el, props, events) { rcm_log('rcm_abookmenu_init'); rcmail.contextmenu.init_addressbook(el, props, events); }
function rcm_callbackmenu_init(props, ext_events) { rcm_log('rcm_callbackmenu_init'); return rcmail.contextmenu.init(props, ext_events); }
function rcm_show_menu(e, obj, id, menu) { rcm_log('rcm_show_menu'); rcmail.contextmenu.show_one(e, obj, id, menu); }
function rcm_hide_menu(e, sub_only, no_trigger) { rcm_log('rcm_hide_menu'); rcmail.contextmenu.hide_all(e, sub_only, no_trigger); }
function rcm_check_button_state(btn, active) { rcm_log('rcm_check_button_state'); return rcmail.contextmenu.ui_button_check(btn, active); }
function rcm_log(fname) { console.log('Roundcube ContextMenu plugin: Use of ' + fname + ' is depreciated. This will be removed in future versions.'); }

function rcube_context_menu(p) {
    this.menu_name = null;
    this.menu_source = new Array();
    this.menu_source_obj = null;
    this.list_object = null;
    this.mouseover_timeout = rcmail.env.contextmenu_mouseover_timeout;
    this.classes = {
        source: 'contextRow context-source', // contextRow class depreciated in v3.0
        ul: 'toolbarmenu iconized',
        a: 'icon',
        span: 'icon',
        sub_button_a: null,
        sub_button_span: 'right-arrow sub-button' // right-arrow class depreciated in v3.0
    }

    this.modal = false;
    this.is_submenu = false;
    this.submenu_position = 'right';
    this.skinable = false;
    this.parents = 0;
    this.parent_menu = this;
    this.parent_object = null;
    this.selected_object = null
    this.container = null;
    this.menu_selection = new Array();
    this.submenus = {};
    this.timers = {};

    // add global config defaults and instance config
    $.extend(true, this, rcmail.contextmenu.settings.menu_defaults, p);

    // ensure manu_source option is always an array
    if (typeof this.menu_source == 'string')
        this.menu_source = [this.menu_source];

    var ref = this;

    this.init = function() {
        if (!this.container) {
            rcmail.triggerEvent('contextmenu_init', this);

            this.container = $('<div>').attr('id', 'rcm_' + this.menu_name).css('display', 'none');
            this.container.addClass(rcmail.contextmenu.settings.classes.container);
            this.container.addClass(this.is_submenu ? rcmail.contextmenu.settings.classes.submenu : rcmail.contextmenu.settings.classes.mainmenu);

            var rows = [], ul = $('<ul role="menu">'),
            li = $('<li>'), link = $('<a>'), span = $('<span>');

            ul.addClass(this.classes.ul);
            li.attr('role', 'menuitem');

            link.attr({'href': '#', 'role': 'button', 'tabindex': '-1', 'aria-disabled': 'true'});
            link.addClass(this.classes.a);

            span.addClass(this.classes.span);

            this.menu_source_obj = {};
            $.each(this.menu_source, function(i) {
                var source_elements;
                if (typeof ref.menu_source[i] == 'string') {
                    ref.menu_source_obj[ref.menu_source[i]] = {
                        'toggle': !$(ref.menu_source[i]).is(':visible')
                    };
                    source_elements = $(ref.menu_source[i]).children();
                }
                else {
                    ref.menu_source_obj[i] = {
                        'toggle': false
                    };
                    source_elements = $(ref.menu_source[i]);
                }

                ul.attr('aria-labelledby', $(ref.menu_source[i]).attr('aria-labelledby'));

                $.each(source_elements, function() {
                    var src_elem, elem, command, args;

                    var callback = ref.triggerEvent('addmenuitem', {ref: ref, el: this});
                    if (!callback || (!callback.abort && !callback.result)) {
                        if ($(this).is('li')&& $(this).children().length == 1) {
                            src_elem = $(this).children()[0];
                        }
                        else {
                            src_elem = this;
                        }

                        if ($(src_elem).is('a')) {
                            elem = $(src_elem).clone();

                            if (!elem[0].hasAttribute('onclick') || !elem.attr('onclick').match(rcmail.contextmenu.settings.command_pattern)) {
                                if (elem[0].hasAttribute(rcmail.contextmenu.settings.popup_attrib) && !elem.attr(rcmail.contextmenu.settings.popup_attrib).match(rcmail.contextmenu.settings.popup_pattern)) {
                                    return;
                                }
                            }
                        }
                        else if ($(src_elem).is('span') && $(src_elem).children().length == 2) {
                            elem = $(src_elem).children().first().clone();

                            if ($(src_elem).children().last().attr(rcmail.contextmenu.settings.popup_attrib).match(rcmail.contextmenu.settings.popup_pattern)) {
                                $(elem).attr(rcmail.contextmenu.settings.popup_attrib, $(src_elem).children().last().attr(rcmail.contextmenu.settings.popup_attrib));
                                $(elem).addClass('rcm-uidropdown');
                            }
                        }
                        else if ($(src_elem).parent().is('a')) {
                            elem = $(src_elem).parent().clone();
                        }
                        else if (src_elem.command && src_elem.label) {
                            elem = $('<a>').attr({'id': 'rcmjs', 'href': '#', 'onclick': "return rcmail.command('"+ src_elem.command +"','"+ src_elem.props +"',src_elem,event)"})
                                    .addClass(src_elem.classes)
                                    .html(src_elem.label);
                        }
                        else {
                            return;
                        }
                    }
                    else if (callback.abort) {
                        return;
                    }
                    else {
                        elem = callback.result;
                    }

                    // turn custom popup function into onclick
                    if (rcmail.contextmenu.settings.popup_func.length > 0 && elem[0].hasAttribute(rcmail.contextmenu.settings.popup_attrib) && elem.attr(rcmail.contextmenu.settings.popup_attrib).match(rcmail.contextmenu.settings.popup_pattern)) {
                        elem.attr('onclick', elem.attr(rcmail.contextmenu.settings.popup_attrib).replace(rcmail.contextmenu.settings.popup_pattern, rcmail.contextmenu.settings.popup_func));
                    }

                    // skip any element that does not look like a Roundcube button
                    if (!elem[0].hasAttribute('onclick')) {
                        return;
                    }

                    command = '';
                    var matches;
                    if (matches = elem.attr('onclick').match(rcmail.contextmenu.settings.command_pattern)) {
                        command = matches[1];
                        args = matches[2];
                    }

                    // skip elements we don't need
                    if ($.inArray(rcmail.env.task + '-' + command, rcmail.contextmenu.settings.skip_commands) >= 0 || elem.hasClass('rcm_ignore') || elem.hasClass('rcm-ignore')) { // rcm_ignore class depreciated in v3.0
                        return;
                    }

                    var a = link.clone(), row = li.clone();

                    // add command name element
                    var tmp = span.clone();
                    var label = elem.text().trim();
                    tmp.text(label.length > 0 ? label : elem.attr('title'));
                    tmp.addClass(elem.children('span').attr('class'));
                    a.append(tmp);
                    a.addClass(elem.attr('class'));
                    a.removeClass(rcmail.contextmenu.settings.classes.button_remove);
                    a.removeClass(rcmail.contextmenu.settings.classes.button_disabled);
                    a.addClass('rcm_elem_' + elem.attr('id'));

                    if (matches = elem.attr('onclick').match(rcmail.contextmenu.settings.popup_pattern)) {
                        // check the popup menu exists
                        var popup_id = rcmail.gui_containers[matches[1]] ? rcmail.gui_containers[matches[1]].attr('id') : matches[1];
                        if ($('#' + popup_id).length == 0) {
                            return;
                        }

                        a.data('command', matches[1]);
                        a.data('menu-pos', ref.submenu_position);
                        a.addClass(ref.classes.sub_button_a);
                        if (ref.classes.sub_button_span)
                            a.append($('<span>').addClass(ref.classes.sub_button_span));
                        row.addClass(rcmail.contextmenu.settings.classes.submenu);
                        a.on('click', function(e) {
                            if (!$(this).is('.' + rcmail.contextmenu.settings.classes.button_active.replace(/ /g, ', .')))
                                return;

                            ref.submenu(a, e);
                            return false;
                        })
                        .on('mouseover', function(e) {
                            if (ref.mouseover_timeout < 0)
                                return;

                            var el = this;
                            ref.timers['submenu_show'] = window.setTimeout(function(a, e) {
                                if (!$(el).is('.' + rcmail.contextmenu.settings.classes.button_active.replace(/ /g, ', .'))) {
                                    rcmail.contextmenu.hide_all(e, true);
                                }
                                else {
                                    ref.submenu(a, e);
                                }
                            }, ref.mouseover_timeout, a, e);
                        })
                        .on('mouseout', function() {
                            if (ref.mouseover_timeout < 0 || !$(this).is('.' + rcmail.contextmenu.settings.classes.button_active.replace(/ /g, ', .')))
                                return;

                            $(this).blur();
                            clearTimeout(ref.timers['submenu_show']);
                        });
                    }
                    else {
                        // skip elements for which we could not identify a command
                        if (!command) {
                            return;
                        }

                        a.addClass('cmd_' + command.replace(/\./g, '-'));
                        a.data('command', command);
                        if (elem.attr('target'))
                            a.attr('target', elem.attr('target'));

                        a.on('click', function(e) {
                            if ($(this).parents('div.' + rcmail.contextmenu.settings.classes.submenu.replace(/ /g, '.')).length == 0) {
                                rcmail.contextmenu.hide_all(e, true);
                                clearTimeout(ref.timers['submenu_hide']);
                            }

                            var cur_popups = rcmail.contextmenu.vars.popup_menus.length;
                            var result;

                            var callback = ref.parent_menu.triggerEvent('beforecommand', {ref: ref, el: this, command: command, args: args});
                            if (!callback || !callback.abort) {
                                result = ref.parent_menu.triggerEvent('command', {ref: ref, el: this, command: command, args: args, evt: e});
                            }
                            else {
                                result = callback.result;
                            }

                            if (!callback || !callback.skipaftercommand)
                                ref.parent_menu.triggerEvent('aftercommand', {ref: ref, el: this, command: command, args: args});

                            // ensure menu is always hidden after action
                            ref.parent_menu.hide_menu(e);

                            return result;
                        });

                        if (ref.mouseover_timeout > -1 && !ref.is_submenu) {
                            a.mouseover(function(e) {
                                ref.timers['submenu_hide'] = window.setTimeout(function(e) {
                                    rcmail.contextmenu.hide_all(e, true);
                                }, ref.mouseover_timeout, e);
                            });

                            a.mouseout(function() { clearTimeout(ref.timers['submenu_hide']); });
                        }
                    }

                    row.append(a);
                    ref.parent_menu.triggerEvent('insertitem', {ref: ref, item: row, originalElement: elem});
                    rows.push(row);
                });
            });

            ul.append(rows).appendTo(this.container);
            this.parent_menu.triggerEvent('init', {ref: this});
            this.container.appendTo($('body'));
        }
    };

    this.show_menu = function(obj, e) {
        if (obj) {
            this.hide_menu(e);
        }

        var callback = this.parent_menu.triggerEvent('beforeactivate', {ref: this, source: obj, originalEvent: e});
        if (!callback || !callback.abort) {
            // don't add source class when selected row is part of current selection, current selection is styled already (#113)
            if (obj && !(this.list_object && rcmail[this.list_object].in_selection(rcmail.env.context_menu_source_id))) {
                $(obj).addClass(this.classes.source);
            }

            if (this.modal && !this.is_submenu && ($('#rcm_modal').length == 0 || (rcmail.contextmenu.settings.classes.modal_overlay && $('.' + rcmail.contextmenu.settings.classes.modal_overlay.replace(/ /g, '.')).length == 0))) {
                $('<div>').attr('id', 'rcm_modal').addClass(rcmail.contextmenu.settings.classes.modal_overlay)
                    .on('contextmenu', function(e) { $(e.target).trigger('click'); rcube_event.cancel(e); })
                    .insertBefore('#rcm_' + this.menu_name);
            }

            $.each(ref.menu_source_obj, function(id, props) {
                if (props.toggle) {
                    // wait for return
                    var ret = ref.parent_menu.triggerEvent('submenu_toggle', {id: id, ref: ref, show: true});
                }
            });

            $.each(this.container.find('a'), function() {
                var btn;
                if ($(this).hasClass('rcm_active') || $(this).hasClass('rcm-active')) { // rcm_active class depreciated in v3.0
                    $(this).addClass(rcmail.contextmenu.settings.classes.button_active);
                }
                else if (btn = $(this).attr('class').match(/rcm_elem_([a-z0-9]+)/)) {
                    $(this).parent('li')[(btn[1] == 'rcmjs' || $('#' + btn[1]).is(':visible')) ? 'show' : 'hide']();
                    $(this).removeClass(rcmail.contextmenu.settings.classes.button_active).removeClass(rcmail.contextmenu.settings.classes.button_disabled);

                    var enabled = false;
                    if ($(this).parent('li').is('.' + rcmail.contextmenu.settings.classes.submenu.replace(/ /g, ', .'))) {
                        // check of active commands in submenu to activate submenu link (https://github.com/roundcube/roundcubemail/issues/6444)
                        // based on rcmail.set_menu_buttons()
                        var id = rcmail.gui_containers[$(this).data('command')] ? rcmail.gui_containers[$(this).data('command')].attr('id') : $(this).data('command');
                        if (rcmail.menu_buttons[id]) {
                            $.each(rcmail.menu_buttons[id][1], function() {
                                var is_func = typeof(this) == 'function';
                                if ((is_func && this()) || (!is_func && rcmail.commands[this])) {
                                    return !(enabled = true);
                                }
                            });
                        }
                        else {
                            // cant find the submenu, enable the link just in case
                            enabled = true;
                        }
                    }
                    else if (!rcmail.contextmenu.ui_button_check(btn[1], false) && (!ref.is_submenu || rcmail.contextmenu.ui_button_check(btn[1], true))) {
                        enabled = true;
                    }

                    var args = {ref: ref, el: this, btn: btn[1], source: obj, command: $(this).data('command'), enabled: enabled};
                    var p = ref.parent_menu.triggerEvent('activate', args);

                    if (typeof(p) === "boolean") { // backwards compatibility pre v3.0
                        args.enabled = p;
                        p = args;
                    }
                    else if (!p) {
                        p = args;
                    }

                    if (!p.abort) {
                        $(this).addClass(p.enabled == true ? rcmail.contextmenu.settings.classes.button_active : rcmail.contextmenu.settings.classes.button_disabled);
                    }
                }
            });

            $.each(ref.menu_source_obj, function(id, props) {
                if (props.toggle) {
                    // wait for return
                    var ret = ref.parent_menu.triggerEvent('submenu_toggle', {id: id, ref: ref, show: false});
                }
            });

            this.parent_menu.triggerEvent('afteractivate', {ref: this, source: obj, originalEvent: e});
        }

        // sanity check, make sure there are items contained in the menu
        if (this.container.find('li > a').length == 0) {
            $('.' + this.classes.source.replace(/ /g, '.')).removeClass(this.classes.source);
            return;
        }

        // position menu on the screen
        if (this.is_submenu) {
            rcmail.element_position(this.container, this.parent_object);
        }
        else {
            this.position(e, this.container);
        }

        if (!callback || callback.show !== false) {
            this.selected_object = obj;
            this.container.show();
            rcmail.triggerEvent('menu-open', { name: this.container.attr('id'), props:{ menu: this.container.attr('id'), skinable: this.skinable }, originalEvent: e });
        }
    };

    this.hide_menu = function(e) {
        if ($('div.' + rcmail.contextmenu.settings.classes.container.replace(/ /g, '.')).is(':visible') && (rcmail.contextmenu.vars.popup_menus.length == 0 || $(e.target).parents('div.' + rcmail.contextmenu.settings.classes.container.replace(/ /g, '.')).length == 0)) {
            if (!this.is_submenu) {
                this.selected_object = null;
                $('.' + this.classes.source.replace(/ /g, '.')).removeClass(this.classes.source);

                if (this.modal)
                    $('#rcm_modal').remove();
            }

            // if the menu has submenus they should be hidden to
            $.each(this.submenus, function() {
                this.container.hide();
            });

            this.menu_selection = new Array(); // reset selection ready for next event
            this.container.hide();
            this.parent_menu.triggerEvent('hide_menu', { ref: this, originalEvent: e });
        }
    };

    this.submenu = function(link, e) {
        if (e) {
            rcube_event.cancel(e);
        }

        rcmail.contextmenu.hide_all(e, true);

        var id = rcmail.gui_containers[$(link).data('command')] ? rcmail.gui_containers[$(link).data('command')].attr('id') : $(link).data('command');
        if (!this.submenus[id]) {
            var elem = !$('#' + id).is('ul') ? '#' + id + ' ul' : '#' + id; // check if the container returned is a ul else there should be one directly beneath it
            this.submenus[id] = new rcube_context_menu({'menu_name': id, 'menu_source': elem, 'parents': (this.parents + 1), 'parent_menu': this, 'parent_object': link, 'is_submenu': true, 'list_object': this.list_object});
            this.submenus[id].init();
        }

        this.submenus[id].show_menu(null, e);
    };

    this.position = function(e, menu) {
        // temporarily show element to calculate its size
        menu.css({left: '-1000px', top: '-1000px'}).show();

        var win = $(window),
        win_height = win.height(),
        elem_height = $(menu).height(),
        elem_width = $(menu).width(),
        top = e.pageY,
        left = e.pageX;

        if (top + elem_height > win_height) {
            top -= elem_height;

            if (top < 0)
                top = Math.max(0, (win_height - elem_height) / 2);
        }

        if (left + elem_width > win.width())
            left -= ((left + elem_width) - win.width()) + 10;

        // sanity check
        if (left < 0) left = 0;

        menu.hide();
        menu.css({left: left + 'px', top: top + 'px'});
    };

    this.destroy = function() {
        $.each(this.submenus, function() {
            this.destroy();
        });

        // remove the menu from the UI
        this.container.remove();

        if (this.is_submenu)
            delete rcmail.env.contextmenus[this.parent_menu.menu_name].submenus[this.menu_name];
        else
            delete rcmail.env.contextmenus[this.menu_name];
    };

    this.addEventListener = rcube_event_engine.prototype.addEventListener;
    this.removeEventListener = rcube_event_engine.prototype.removeEventListener;
    this.triggerEvent = rcube_event_engine.prototype.triggerEvent;
}

$(document).ready(function() {
    if (window.rcmail) {
        rcmail.env.contextmenus = {};

        // backwards compatibility with old settings code removed in v3.0
        var old_settings = ['context_menu_skip_commands', 'context_menu_overload_commands', 'context_menu_command_pattern', 'context_menu_popup_pattern', 'context_menu_button_active_class', 'context_menu_button_disabled_class'];
        $.each(old_settings, function() {
            if (rcmail[this]) {
                rcm_log('rcmail.' + this);
                var opt = this.replace(/^context_menu_/, '');

                if ((this == 'context_menu_button_active_class' || this == 'context_menu_button_disabled_class') && $.isArray(rcmail[this])) {
                    rcmail.contextmenu.settings[opt] = rcmail[this].join(' ');
                }
                else {
                    rcmail.contextmenu.settings[opt] = rcmail[this];
                }
            }
        });

        rcmail.addEventListener('init', function() {
            // no need to reattach events inside iframe
            if (rcmail.is_framed())
                return;

            var body_mouseup = function(e) {
                $.each(rcmail.env.contextmenus, function() {
                    if (rcmail.contextmenu.settings.no_right_click_on_menu && e.which == 3 && $(e.target).parents('.contextmenu').length > 0) {
                        // useability - on the contextmenu make right click the same as left (sometimes users think they have to right click because they right clicked to get there)
                        $(e.target).trigger('click');
                        rcube_event.cancel(e);
                    }
                    else {
                        rcmail.contextmenu.hide_all(e);
                    }
                });
            };
            $(document.body).on('click contextmenu', body_mouseup);

            // Hide menu after clicks in iframes (eg. preview pane)
            $('iframe').on('load', function() {
                try { $(this.contentDocument || this.contentWindow).on('mouseup', body_mouseup) }
                catch (e) { /* catch possible "Permission denied" error in IE */ }
            })
            .contents().on('mouseup', body_mouseup);
        });

        rcmail.register_command('plugin.contextmenu.collapseall', function(obj) {
            rcmail[obj].collapse_all();
        }, true);

        rcmail.register_command('plugin.contextmenu.expandall', function(obj) {
            rcmail[obj].expand_all();
        }, true);

        rcmail.register_command('plugin.contextmenu.openextwin', function() {
            var button_id = rcmail.buttons['plugin.contextmenu.openextwin'][0].id;

            if (rcmail.env.task == 'settings') {
                rcube_find_object(button_id).href = '?_task=settings&_action=' + urlencode(rcmail.env.context_menu_source_id);
            }
            else {
                rcube_find_object(button_id).href = '?_task=mail&_mbox=' + urlencode(rcmail.env.context_menu_source_id);
            }

            rcmail.sourcewin = window.open(rcube_find_object(button_id).href);
            if (rcmail.sourcewin)
                window.setTimeout(function() { rcmail.sourcewin.focus(); }, 20);

            rcube_find_object(button_id).href = '#';
        }, false);

        rcmail.register_command('plugin.contextmenu.openinline', function() {
            rcmail.goto_url('settings/' + rcmail.env.context_menu_source_id, {_framed: 0});
        }, false);

        // special event listeners for interacting with plugins which open popup menus (eg: zipdownload)
        rcmail.addEventListener('menu-open', function(p) {
            // check for popupmenus that arent part of contextmenu
            if ($('div.' + rcmail.contextmenu.settings.classes.container.replace(/ /g, '.')).is(':visible') && p.name.indexOf('rcm_') != 0) {
                // keep track of whats open
                rcmail.contextmenu.vars.popup_menus.push(p.name);
            }
        });

        rcmail.addEventListener('menu-close', function(p) {
            // keep track of whats open
            var idx;
            if ((idx = $.inArray(p.name, rcmail.contextmenu.vars.popup_menus)) >= 0) {
                rcmail.contextmenu.vars.popup_menus.splice(idx, 1);
            }

            // check required args are present, other plugins trigger this event too
            if (p.originalEvent && $('div.' + rcmail.contextmenu.settings.classes.container.replace(/ /g, '.')).is(':visible')) {
                var e = p.originalEvent.currentTarget ? p.originalEvent.currentTarget : p.originalEvent.srcElement;
                // check target is an HTML Element (ie not HTML Document #105)
                if (e instanceof HTMLElement) {
                    // check if target is in a contextmenu, and is so hide the menu
                    if (p.name.indexOf('rcm_') != 0 && $(e).prop('class').indexOf('rcm_elem_') == -1) {
                        rcmail.contextmenu.hide_all(p.originalEvent, false, true);
                    }
                }
            }
        });
    }
});
