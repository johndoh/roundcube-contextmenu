<?php

/**
 * ContextMenu
 *
 * Plugin to add a context menu to the message list
 *
 * @version 1.0-BETA
 * @author Philip Weir
 * @url http://roundcube.net/plugins/contextmenu
 */
class contextmenu extends rcube_plugin
{
	public $task = 'mail';

	function init()
	{
		$this->api->output->add_label('markmessages','markread','markunread','markflagged','markunflagged','replytomessage','replytoallmessage','forwardmessage','printmessage');
		$this->include_script('jquery.contextMenu.js');
		$this->include_stylesheet('contextmenu.css');
		$this->include_script('contextmenu.js');
	}
}

?>