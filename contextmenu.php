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
		$rcmail = rcmail::get_instance();
		if ($rcmail->action == '' && !empty($rcmail->user->ID)) {
			$this->api->output->add_label('markmessages','markread','markunread','markflagged','markunflagged','replytomessage','replytoallmessage','forwardmessage','printmessage','viewsource','emlsave','openinextwin');
			$this->include_script('jquery.contextMenu.js');
			$skin_path = 'skins/'. $this->api->output->config['skin'] .'/contextmenu.css';
			$skin_path = is_file($this->home .'/'. $skin_path) ? $skin_path : 'skins/default/contextmenu.css';
			$this->include_stylesheet($skin_path);
			$this->include_script('contextmenu.js');
		}
	}
}

?>
