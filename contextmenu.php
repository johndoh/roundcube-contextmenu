<?php

/**
 * ContextMenu
 *
 * Plugin to add a context menu to various parts of the interface
 *
 * @author Philip Weir
 *
 * Copyright (C) 2009-2014 Philip Weir
 *
 * This program is a Roundcube (http://www.roundcube.net) plugin.
 * For more information see README.md.
 * See MANUAL.md for information about extending this plugin.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Roundcube. If not, see http://www.gnu.org/licenses/.
 */
class contextmenu extends rcube_plugin
{
	public $task = 'mail|addressbook';

	function init()
	{
		$rcmail = rcube::get_instance();

		if ($rcmail->output->type == 'html') {
			$this->include_script('contextmenu.js');
			$this->include_stylesheet($this->local_skin_path() . '/contextmenu.css');
			$this->include_script($this->local_skin_path() . '/functions.js');
			$this->api->output->set_env('contextmenu', true);
		}

		if ($rcmail->task == 'mail') {
			$this->register_action('plugin.contextmenu.messagecount', array($this, 'messagecount'));

			// on the mailbox screen only add some additional options for the folder menu
			if ($rcmail->action == '') {
				$this->addition_folder_options();
			}
		}
		elseif ($rcmail->task == 'addressbook' && $rcmail->action == '') {
			// give other plugins a change to add address books before checking if they exist for the menu
			$this->add_hook('render_page', array($this, 'addition_addressbook_options'));
		}
	}

	public function addition_folder_options()
	{
		$this->add_texts('localization/');

		$li = '';
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.collapseall', 'type' => 'link', 'class' => 'collapseall rcm_active', 'label' => 'contextmenu.collapseall', 'tabindex' => '-1', 'aria-disabled' => 'true')));
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.expandall', 'type' => 'link', 'class' => 'expandall rcm_active', 'label' => 'contextmenu.expandall', 'tabindex' => '-1', 'aria-disabled' => 'true')));
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.openfolder', 'type' => 'link', 'class' => 'openfolder rcm_active', 'label' => 'openinextwin', 'tabindex' => '-1', 'aria-disabled' => 'true')));

		$out = html::tag('ul', array('id' => 'rcmFolderMenu', 'role' => 'menu'), $li);
		$this->api->output->add_footer(html::div(array('style' => 'display: none;', 'aria-hidden' => 'true'), $out));
	}

	public function addition_addressbook_options()
	{
		$this->add_texts('localization/');

		$li = '';
		$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'plugin.contextmenu.assigngroup', 'type' => 'link', 'class' => 'assigngroup disabled', 'classact' => 'assigngroup active', 'label' => 'contextmenu.assigngroup', 'tabindex' => '-1', 'aria-disabled' => 'true')));

		if (count(rcube::get_instance()->get_address_sources(true)) > 1) {
			// only show the move option if there are sources to move between
			$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'move', 'type' => 'link', 'class' => 'movecontact disabled', 'classact' => 'movecontact active', 'label' => 'moveto', 'tabindex' => '-1', 'aria-disabled' => 'true')));
			$li .= html::tag('li', array('role' => 'menuitem'), $this->api->output->button(array('command' => 'copy', 'type' => 'link', 'class' => 'copycontact disabled', 'classact' => 'copycontact active', 'label' => 'copyto', 'tabindex' => '-1', 'aria-disabled' => 'true')));
		}

		$out = html::tag('ul', array('id' => 'rcmAddressBookMenu', 'role' => 'menu'), $li);
		$this->api->output->add_footer(html::div(array('style' => 'display: none;', 'aria-hidden' => 'true'), $out));
	}

	public function messagecount()
	{
		$storage = rcube::get_instance()->storage;
		$mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);

		// send output
		header("Content-Type: application/json; charset=".RCUBE_CHARSET);
		echo json_encode(array('messagecount' => $storage->count($mbox, 'EXISTS')));
		exit;
	}
}

?>