# Roundcube Webmail ContextMenu

## Version 3.3.1 (2022-06-18, rc-1.5)

- Add placeholder for `undeleted` icon

## Version 3.3 (2021-10-19, rc-1.5)

- Support Dark Mode in Elastic
- Support for customizing Elastic skin

## Version 3.2.1 (2020-11-20, rc-1.4.4)

- Various code improvements
- Add `user-select: none;` to menus

## Version 3.2 (2020-04-27, rc-1.4.4)

- Update command enabling after (req RC cb8c078)

## Version 3.1 (2020-01-11, rc-1.4)

- Fix invalid function call to init_addressbook in Larry skin
- Replace `+ events` with new `global_events` object

## Version 3.0 (2019-10-27, rc-1.4)

- Rework Contextmenu settings object
- Rework core Contextmenu JS functions
  - `rcm_listmenu_init()` -> `rcmail.contextmenu.init_list()`
  - `rcm_foldermenu_init()`-> `rcmail.contextmenu.init_folder()`
  - `rcm_abookmenu_init()` -> `rcmail.contextmenu.init_addressbook()`
  - `rcm_callbackmenu_init()` -> `return rcmail.contextmenu.init()`
  - `rcm_show_menu()` -> `rcmail.contextmenu.show_one()`
  - `rcm_hide_menu()` -> `rcmail.contextmenu.hide_all()`
  - `rcm_check_button_state()` -> `return rcmail.contextmenu.ui_button_check()`
- Allow skins to set Contextmenu classes
- Remove IE8 hacks
- Improve menu element parsing, allow for popup menu functions in skin
- Add new event `submenu_toggle` to handle display of hidden menus
- Disable right click on context menu
- Depreciate `right-arrow` class, use `sub-button` instead
- Depreciate `contextRow` class, use `context-source` instead
- Depreciate `rcmmainmenu` class, use `rcm-mainmenu` instead
- Depreciate `rcmsubmenu` and `submenu` classes, use `rcm-submenu` instead
- Depreciate `rcm_active` class, use `rcm-active` instead
- Depreciate `rcm_ignore` class, use `rcm-ignore` instead
- Add new event `addmenuitem`
- Add ability to add to core event handlers as well as replace them
- Improve collapseall/expandall JS functions to better mimic true click
- Use `getselection` list event added (req RC e9eb87d, afaaa77, 2f7aaca)
- Change `rcube_context_menu.list_object` from Object to String, backwards compatibility added for Contact list but no others
- Replace `overload_commands` option with `always_enable_commands`
- `overload_commands` option removed (req RC afaaa77)
- Add Elastic skin support
- Add `menu-change` JS event listener
- Support new Contacts toolbar with Copy/Move actions (req RC eb0228b)
- Add menus to Settings screens
- Add `contextmenu_mouseover_timeout` config option to override default mouseover timeout for submenus
- Extend activate hook, now returns JSON rather than Boolean
- Make menu button inactive if all subactions are inactive (req RC daf4607)
- Use new treelist collapse_all/expand_all functions (req RC 3a40f6c)

## Version 2.3 (2017-06-14, rc-1.3)

- Remove special handling for group-create/rename (requires roundcube rev ec98aa5)
- "Flattened" the larry theme: fresher look by removing shadows and gradients
- Fix handling of folder names containing special chars

## Version 2.2 (2017-01-02, rc-1.3)

- Use new 'Mark all as read' function from core (requires 1.3)
- Enable compact+purge actions on all folders

## Version 2.1.2 (2015-04-18, rc-1.1)

- Fix #67 address book copy/move action not updated

## Version 2.1.1 (2015-03-18, rc-1.1)

- Update submenu detection after 619891c

## Version 2.1 (2015-01-06, rc-1.1)

- Add specific menu for adding contact to group
- Update after dev-accessibility merged to RC master
- Support multi-folder search results (66536974fe)
- Fix possible CSRF in `readfolder` action
- Add option to move/copy contacts in address book

## Version 2.0 (2014-04-30, rc-1.0)

- Remove IE6 support
- Remove `rcm_contextmenu_register_command`, use commands from toolbars
- Remove specially created menus, generate context menu dynamically from UI
- Much better menu generation, improve loading times

## Version 1.13 (2014-02-01, rc-1.0)

- Add menu to contact list on compose screen (requires b3c034c)

## Version 1.12 (2013-12-01, rc-1.0)

- Update depreciated `moveto` command to `move`
- Update config file var names to match core

## Version 1.11 (2013-05-19, rc-1.0)

_code branching/tagging no longer sync'd to roundcube version_
- Add export option to address book menu
- Add `contextmenu_show` JS event

## Version 1.10 (2013-03-03, rc-0.9)

- Add remove selected contacts from group option
- Rename default skin to classic (c40419bdfe)
- `rcube_ui` > `rcube_utils` (r6091)
- Update for Roundcube framework

## Version 1.9 (2012-04-14, rc-0.8)

- Update after r5781
- Add initial support for Larry

## Version 1.8 (2011-05-14, rc-0.8)

- Fix `readfolder` method after r5557
- Use new labels for group delete/rename (r4864)
- Add `forward-attachment` function (r4761)

## Version 1.7 (2011-10-01, rc-0.5)

- Add reply-list function (r4032)

## Version 1.6 (2010-08-01, rc-0.4)

- Fix error in deleting after moving using context menu
- Update hooks (r3840)

## Version 1.5 (2010-05-29, rc-0.4)

- Hide menu after click in iframes
- Update contact copying after r3694
- Update hooks after r3685

## Version 1.4 (2010-03-30, rc-0.4)

- Update after r3614
- Update `jquery.ContextMenu` to 1.01
- Use new `imap->search_once` function (r3446)
- Add initial support for contact groups in address book
- Fix mark all as read function
- Update to r3393
- Fix folder count with nested folders

## Version 1.3 (2010-02-07, rc-0.4)

- Update after r3258
- CSS update after r3141
- Use `local_skin_path()` (rev 3076)
- Added address book context menu (requires r3023)

## Version 1.2 (2009-09-18, rc-0.3)

- Fix folder menu for UTF8 folders
- Use `rcmail_send_unread_count` (r2960)
- Add 'move to' to message list menu

## Version 1.1 (2009-09-11, rc-0.3)

- Added folder list context menu
- Moved menu generation from JS to PHP
- Added support for sub menus
- Added new `edit` action
- Update `insertrow` event listener following changes in core
- Add fallback to default skin
- Better init restrictions
- Correct style after r2541
- Only init when on mailbox screen (while `_uid` is empty and user is logged in)
- Added hook for other plugins to add items to the menu (see README)
- Added support for new actions: show source, save .eml, open in new window
- Added support for plugin template system
- Added highlighting of selected row
- Fixed menu in IE
- Fixed delete in Trash folder
- Added ability to mark or delete multiple messages
- Fixed delete function
- Fixed working with `Select` functions
- Added event hooks when message list is updated
- Created plugin