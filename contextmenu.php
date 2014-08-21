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
		if ($rcmail->task == 'mail') {
			$this->register_action('plugin.contextmenu.readfolder', array($this, 'readfolder'));

			// on the mailbox screen only add some additional options for the folder menu
			if ($rcmail->action == '') {
				$this->addition_folder_options();
			}
		}

		if ($rcmail->output->type == 'html') {
			$rcmail->output->add_script("rcmail.context_menu_skip_commands = new Array('mail-checkmail', 'mail-compose', 'addressbook-add', 'addressbook-import', 'addressbook-advanced-search', 'addressbook-search-create');");
			$rcmail->output->add_script("rcmail.context_menu_overload_commands = new Array('move', 'copy');");
			$this->include_script('contextmenu.js');
			$this->include_stylesheet($this->local_skin_path() . '/contextmenu.css');
			$this->include_script($this->local_skin_path() . '/functions.js');
			$this->api->output->set_env('contextmenu', true);
		}
	}

	public function addition_folder_options()
	{
		$this->add_texts('localization/');

		$li = '';
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.readfolder', 'type' => 'link', 'class' => 'readfolder', 'label' => 'contextmenu.markreadfolder', 'tabindex' => '-1', 'aria-disabled' => 'true')));
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.collapseall', 'type' => 'link', 'class' => 'collapseall rcm_active', 'label' => 'contextmenu.collapseall', 'tabindex' => '-1', 'aria-disabled' => 'true')));
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.expandall', 'type' => 'link', 'class' => 'expandall rcm_active', 'label' => 'contextmenu.expandall', 'tabindex' => '-1', 'aria-disabled' => 'true')));
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.openfolder', 'type' => 'link', 'class' => 'openfolder rcm_active', 'label' => 'openinextwin', 'tabindex' => '-1', 'aria-disabled' => 'true')));

		$out = html::tag('ul', array('id' => 'rcmFolderMenu', 'role' => 'menu'), $li);
		$this->api->output->add_footer(html::div(array('style' => 'display: none;', 'aria-hidden' => 'true'), $out));
	}

	public function readfolder()
	{
		$storage = rcube::get_instance()->storage;
		$cbox = rcube_utils::get_input_value('_cur', rcube_utils::INPUT_GET);
		$mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET);
		$oact = rcube_utils::get_input_value('_oact', rcube_utils::INPUT_GET);

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