<?php

/**
 * ContextMenu
 *
 * Plugin to add a context menu to the message list
 *
 * @version 1.1
 * @author Philip Weir
 * @url http://roundcube.net/plugins/contextmenu
 */
class contextmenu extends rcube_plugin
{
	public $task = 'mail';

	function init()
	{
		$rcmail = rcmail::get_instance();
		if (($rcmail->action == '' || $rcmail->action == 'show') && !empty($rcmail->user->ID)) {
			$this->add_texts('localization/');
			$rcmail->output->add_label('nomessagesfound');
			$this->include_script('jquery.contextMenu.js');
			$skin_path = 'skins/'. $this->api->output->config['skin'] .'/contextmenu.css';
			$skin_path = is_file($this->home .'/'. $skin_path) ? $skin_path : 'skins/default/contextmenu.css';
			$this->include_stylesheet($skin_path);
			$this->include_script('contextmenu.js');
			$this->api->output->add_footer($this->_show_menu());

			if ($rcmail->action == 'show')
				$this->add_hook('message_load', array($this, 'set_delimiter'));
		}

		$this->register_action('plugin.contextmenu.messagecount', array($this, 'messagecount'));
		$this->register_action('plugin.contextmenu.readfolder', array($this, 'readfolder'));
	}

	public function messagecount() {
		$mbox = get_input_value('_mbox', RCUBE_INPUT_GET);
		$this->api->output->set_env('messagecount', rcmail::get_instance()->imap->messagecount($mbox));
		$this->api->output->send();
	}

	public function readfolder() {
		$imap = rcmail::get_instance()->imap;
		$mbox = get_input_value('_mbox', RCUBE_INPUT_GET);

		$uids = iil_C_Search($imap->conn, $imap->mod_mailbox($mbox), 'ALL UNSEEN');

		if (!is_array($uids))
			return false;

		// ID to UID
		foreach($uids as $key => $val)
			$uids[$key] = iil_C_ID2UID($imap->conn, $imap->mod_mailbox($mbox), $val);

		$imap->set_flag($uids, 'SEEN', $mbox);
		$this->api->output->command('set_unread_count', $mbox, 0, TRUE);
		$this->api->output->send();
	}

	public function set_delimiter() {
		$this->api->output->set_env('delimiter', rcmail::get_instance()->imap->delimiter);
	}

	private function _show_menu()
	{
		// message list menu
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
		$li .= html::tag('li', array('class' => 'open'), html::a(array('href' => "#open", 'id' => 'rcm_open', 'class' => 'active'), Q($this->gettext('openinextwin'))));

		$out = html::tag('ul', array('id' => 'rcmContextMenu', 'class' => 'toolbarmenu'), $li);

		// folder list menu
		$li = '';

		$li .= html::tag('li', array('class' => 'readfolder separator_below'), html::a(array('href' => "#readfolder", 'class' => 'active'), Q($this->gettext('markreadfolder'))));

		$li .= html::tag('li', array('class' => 'expunge'), html::a(array('href' => "#expunge", 'class' => 'active'), Q($this->gettext('compact'))));
		$li .= html::tag('li', array('class' => 'purge separator_below'), html::a(array('href' => "#purge", 'class' => 'active'), Q($this->gettext('empty'))));

		$li .= html::tag('li', array('class' => 'collapseall'), html::a(array('href' => "#collapseall", 'class' => 'active'), Q($this->gettext('collapseall'))));
		$li .= html::tag('li', array('class' => 'expandall separator_below'), html::a(array('href' => "#expandall", 'class' => 'active'), Q($this->gettext('expandall'))));

		$li .= html::tag('li', array('class' => 'openfolder'), html::a(array('href' => "#openfolder", 'id' => 'rcm_openfolder', 'class' => 'active'), Q($this->gettext('openinextwin'))));

		$out .= html::tag('ul', array('id' => 'rcmFolderMenu', 'class' => 'toolbarmenu'), $li);

		return html::div(null , $out);
	}
}

?>