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
		$rcmail = rcube::get_instance();
		if ($rcmail->task == 'mail' && $rcmail->action == '')
			$this->addition_folder_options();

		$this->include_script('contextmenu.js');
		$this->include_stylesheet($this->local_skin_path() . '/contextmenu.css');
		$this->include_script($this->local_skin_path() . '/functions.js');

		$this->register_action('plugin.contextmenu.readfolder', array($this, 'readfolder'));
	}

	public function addition_folder_options()
	{
		$this->add_texts('localization/');

		$li = '';
		$li .= html::tag('li', null, $this->api->output->button(array('command' => 'plugin.contextmenu.readfolder', 'type' => 'link', 'class' => 'readfolder', 'label' => 'contextmenu.markreadfolder')));
		$li .= html::tag('li', null, $this->api->output->button(array('command' => 'plugin.contextmenu.collapseall', 'type' => 'link', 'class' => 'collapseall rcmglobal', 'label' => 'contextmenu.collapseall')));
		$li .= html::tag('li', null, $this->api->output->button(array('command' => 'plugin.contextmenu.expandall', 'type' => 'link', 'class' => 'expandall rcmglobal', 'label' => 'contextmenu.expandall')));
		$li .= html::tag('li', null, $this->api->output->button(array('command' => 'plugin.contextmenu.openfolder', 'type' => 'link', 'class' => 'openfolder rcmglobal', 'label' => 'openinextwin')));

		$out = html::tag('ul', array('id' => 'rcmFolderMenu'), $li);
		$this->api->output->add_footer(html::div(array('style' => 'display: none;'), $out));
	}

	public function readfolder()
	{
		$storage = rcube::get_instance()->storage;
		$cbox = rcube_utils::get_input_value('_cur', rcube_utils::INPUT_POST);
		$mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);
		$oact = rcube_utils::get_input_value('_oact', rcube_utils::INPUT_POST);

		$uids = $storage->search_once($mbox, 'ALL UNSEEN', true);

		if ($uids->is_empty())
			return false;

		$storage->set_flag($uids->get(), 'SEEN', $mbox);

		if ($cbox == $mbox)
			$this->api->output->command('toggle_read_status', 'read', $uids->get());

		rcmail_send_unread_count($mbox, true);
		$this->api->output->send();
	}
}

?>