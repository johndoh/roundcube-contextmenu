Roundcube Webmail ContextMenu
=============================
This plugin creates contextmenus for various parts of Roundcube using commands
from the toolbars.

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

ContextMenu manual
------------------
The MANUAL.md file shipped with this plugin contains information for plugin and
skin developers. The ContextMenu plugin can be extended by other plugins; new
menus can be created and existing menus manipulated.

Customizing the Elastic skin
----------------------------
The colors and styles used by this plugin can be overridden by adding a
`_custom.less` file to the `skins/elastic` sub-folder of this plugin and
then recompiling the CSS.

[gpl]: https://www.gnu.org/licenses/gpl.html