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
			$this->include_script('jquery.contextMenu.js');
			$skin_path = 'skins/'. $this->api->output->config['skin'] .'/contextmenu.css';
			$skin_path = is_file($this->home .'/'. $skin_path) ? $skin_path : 'skins/default/contextmenu.css';
			$this->include_stylesheet($skin_path);
			$this->include_script('contextmenu.js');
			$this->api->output->add_footer($this->_show_menu());
		}
	}

	private function _show_menu()
	{
		$li = '';

		$li .= html::tag('li', array('class' => 'conmentitle'), Q($this->gettext('markmessages')));
		$li .= html::tag('li', array('class' => 'read'), html::a(array('href' => "#read", 'class' => 'active'), Q('&nbsp;&nbsp;' . $this->gettext('markread'))));
		$li .= html::tag('li', array('class' => 'unread'), html::a(array('href' => "#unread", 'class' => 'active'), Q('&nbsp;&nbsp;' . $this->gettext('markunread'))));
		$li .= html::tag('li', array('class' => 'flagged'), html::a(array('href' => "#flagged", 'class' => 'active'), Q('&nbsp;&nbsp;' . $this->gettext('markflagged'))));
		$li .= html::tag('li', array('class' => 'unflagged separator_below'), html::a(array('href' => "#unflagged", 'class' => 'active'), Q('&nbsp;&nbsp;' . $this->gettext('markunflagged'))));
		$li .= html::tag('li', array('class' => 'reply'), html::a(array('href' => "#reply", 'class' => 'active'), Q($this->gettext('replytomessage'))));
		$li .= html::tag('li', array('class' => 'replyall'), html::a(array('href' => "#reply-all", 'class' => 'active'), Q($this->gettext('replytoallmessage'))));
		$li .= html::tag('li', array('class' => 'forward'), html::a(array('href' => "#forward", 'class' => 'active'), Q($this->gettext('forwardmessage'))));

		$rcmail = rcmail::get_instance();
		if ($rcmail->config->get('trash_mbox') && $_SESSION['mbox'] != $rcmail->config->get('trash_mbox'))
			$li .= html::tag('li', array('class' => 'delete separator_below'), html::a(array('href' => "#delete", 'id' => 'rcm_delete', 'class' => 'active'), Q($this->gettext('movemessagetotrash'))));
		else
			$li .= html::tag('li', array('class' => 'delete separator_below'), html::a(array('href' => "#delete", 'id' => 'rcm_delete', 'class' => 'active'), Q($this->gettext('deletemessage'))));

		$li .= html::tag('li', array('class' => 'print'), html::a(array('href' => "#print", 'class' => 'active'), Q($this->gettext('printmessage'))));
		$li .= html::tag('li', array('class' => 'save'), html::a(array('href' => "#download", 'class' => 'active'), Q($this->gettext('emlsave'))));
		$li .= html::tag('li', array('class' => 'edit'), html::a(array('href' => "#edit", 'class' => 'active'), Q($this->gettext('editasnew'))));
		$li .= html::tag('li', array('class' => 'source separator_below'), html::a(array('href' => "#viewsource", 'class' => 'active'), Q($this->gettext('viewsource'))));
		$li .= html::tag('li', array('class' => 'open'), html::a(array('href' => "#open", 'id' => 'contextmenu_open', 'class' => 'active'), Q($this->gettext('openinextwin'))));

		$out = html::tag('ul', array('id' => 'rcmContextMenu', 'class' => 'toolbarmenu'), $li);
		return html::div(null , $out);
	}
}

?>
