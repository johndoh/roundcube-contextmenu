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
		if (!$this->api->output->ajax_call && get_input_value('_uid', RCUBE_INPUT_GET) == ''
		    && !empty(rcmail::get_instance()->user->ID) && get_input_value('_action', RCUBE_INPUT_GET) != 'logout') {
			$this->api->output->add_label('markmessages','markread','markunread','markflagged','markunflagged','replytomessage','replytoallmessage','forwardmessage','printmessage','viewsource','emlsave','openinextwin');
			$this->include_script('jquery.contextMenu.js');
			$this->include_stylesheet('skins/'. $this->api->output->config['skin'] .'/contextmenu.css');
			$this->include_script('contextmenu.js');
		}
	}
}

?>