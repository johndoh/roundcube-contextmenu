<?php

/**
 * ContextMenu
 *
 * Plugin to add a context menu to various parts of the interface
 *
 * @version @package_version@
 * @author Philip Weir
 */
class contextmenu extends rcube_plugin
{
	public $task = 'mail|addressbook';

	function init()
	{
		$this->include_script('contextmenu.js');
		$this->include_stylesheet($this->local_skin_path() . '/contextmenu.css');
		$this->include_script($this->local_skin_path() . '/functions.js');
	}
}

?>