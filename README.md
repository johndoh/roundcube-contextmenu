Roundcube Webmail ContextMenu
=============================
This plugin adds a context menu to the message list. Menu links are:
* mark as read
* mark as unread
* mark as flagged
* mark as unflagged
* reply
* reply to all
* forward
* delete
* print
* save
* show source
* open in new window
* move to

This plugin also adds a context menu to the folder list. Menu links are:
* mark all as read
* compact
* empty
* collapse all folders
* expand all folders
* open in new window

This plugin also adds a context menu to the contacts list in the address book.
Menu links are:
* compose message to
* edit contact
* delete contact
* remove contact from group
* copy contact to another address book
* export contacts

This plugin also adds a context menu to the groups list in the address book.
Menu links are:
* create new group
* rename group
* delete group

This plugin also adds a context menu to the address book widget on the compose
screen. Menu links are:
* add contact to To
* add contact to Cc
* add contact to Bcc

License
-------
This plugin is released under the [GNU General Public License Version 3+][gpl].

Even if skins might contain some programming work, they are not considered
as a linked part of the plugin and therefore skins DO NOT fall under the
provisions of the GPL license. See the README file located in the core skins
folder for details on the skin license.

Install
-------
* Place this plugin folder into plugins directory of Roundcube
* Add contextmenu to $config['plugins'] in your Roundcube config

**NB:** When downloading the plugin from GitHub you will need to create a
directory called contextmenu and place the files in there, ignoring the root
directory in the downloaded archive.

Adding other items to the menu
------------------------------
The command *rcm_contextmenu_register_command* allows other plugins to add
items to the context menu.

**IMPORTANT:** The context menu plugin must be initialised before any other
plugin which adds an item to the menu.

```js
rcm_contextmenu_register_command(command, callback, label [, pos [, sep
                                 [, multi [, addsub [, obj [, class ]]]]]])
```

* command:   the name of the command eg: spam
* callback:  the name of the function which should be called when the menu item
is clicked
* label:     the name of the label to use in the menu
* (optional) pos: class name of a existing item in the menu which the new item
should be inserted before, if no pos is specified the item is added to the end
* (optional) sep: [before|after] put a separating line before or after this
item
* (optional) multi: [true|false] should the item be enabled when multiple
messages are selected
* (optional) addsub: [true|false] add the new item to a sub menu
* (optional) obj: the menu object to which the item should be added
* (optional) class: the classes to add to the li in the contextmenu, if none
are specified then the command is used as the class name

[gpl]: http://www.gnu.org/licenses/gpl.html