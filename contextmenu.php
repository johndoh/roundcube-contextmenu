<?php

/**
 * ContextMenu
 *
 * Plugin to add a context menu to the message list
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
		if ($rcmail->task == 'mail' && ($rcmail->action == '' || $rcmail->action == 'show'))
			$this->add_hook('render_mailboxlist', array($this, 'show_mailbox_menu'));
		elseif ($rcmail->task == 'addressbook' && $rcmail->action == '')
			$this->add_hook('addressbooks_list', array($this, 'show_addressbook_menu'));

		$this->register_action('plugin.contextmenu.messagecount', array($this, 'messagecount'));
		$this->register_action('plugin.contextmenu.readfolder', array($this, 'readfolder'));
	}

	public function messagecount()
	{
		$mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET);
		$this->api->output->set_env('messagecount', rcube::get_instance()->storage->count($mbox));
		$this->api->output->send();
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

		if ($cbox == $mbox && $oact == '')
			$this->api->output->command('toggle_read_status', 'read', $uids->get());

		rcmail_send_unread_count($mbox, true);
		$this->api->output->send();
	}

	public function show_mailbox_menu($args)
	{
		$rcmail = rcube::get_instance();
		$this->add_texts('localization/');
		$rcmail->output->add_label('nomessagesfound');
		$this->include_script('jquery.contextMenu.js');
		$this->include_script('jquery.mousewheel.js');
		$this->include_script('contextmenu.js');

		$this->include_stylesheet($this->local_skin_path() . '/contextmenu.css');
		if ($rcmail->output->browser->ie && $rcmail->output->browser->ver == 6)
			$this->include_stylesheet($this->local_skin_path() . '/ie6hacks.css');

		$out = '';

		// message list menu
		if ($rcmail->action == '') {
			$li = '';

			$li .= html::tag('li', array('class' => 'conmentitle'), html::span(null, rcmail::Q($this->gettext('markmessages'))));
			$li .= html::tag('li', array('class' => 'markmessage read'), html::a(array('href' => "#read", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('markread')))));
			$li .= html::tag('li', array('class' => 'markmessage unread'), html::a(array('href' => "#unread", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('markunread')))));
			$li .= html::tag('li', array('class' => 'markmessage flagged'), html::a(array('href' => "#flagged", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('markflagged')))));
			$li .= html::tag('li', array('class' => 'markmessage unflagged separator_below'), html::a(array('href' => "#unflagged", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('markunflagged')))));
			$li .= html::tag('li', array('class' => 'reply'), html::a(array('href' => "#reply", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('replytomessage')))));

			$lis = '';
			$lis .= html::tag('li', array('class' => 'replyall'), html::a(array('href' => "#reply-all", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('replytoallmessage')))));
			$lis .= html::tag('li', array('class' => 'replylist'), html::a(array('href' => "#reply-list", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('replylist')))));
			$li .= html::tag('li', array('class' => 'submenu replyacts'), html::a(array('href' => "#reply-all", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('replyall')))) . html::tag('ul', array('class' => 'popupmenu toolbarmenu replyacts'), $lis));

			$lis = '';
			$lis .= html::tag('li', array('class' => 'forward'), html::a(array('href' => "#forward", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('forwardinline')))));
			$lis .= html::tag('li', array('class' => 'forwardattachment'), html::a(array('href' => "#forward-attachment", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('forwardattachment')))));
			$li .= html::tag('li', array('class' => 'submenu forwardacts'), html::a(array('href' => "#forward", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('forward')))) . html::tag('ul', array('class' => 'popupmenu toolbarmenu forwardacts'), $lis));

			//$rcmail = rcmail::get_instance();
			//if (!$rcmail->config->get('flag_for_deletion', false) && $rcmail->config->get('trash_mbox') && $_SESSION['mbox'] != $rcmail->config->get('trash_mbox'))
			//	$li .= html::tag('li', array('class' => 'delete separator_below'), html::a(array('href' => "#delete", 'id' => 'rcm_delete', 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('movemessagetotrash')))));
			//else
				$li .= html::tag('li', array('class' => 'delete separator_below'), html::a(array('href' => "#delete", 'id' => 'rcm_delete', 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('deletemessage')))));

			$li .= html::tag('li', array('class' => 'submenu moveto'), html::span(null, rcmail::Q($this->gettext('moveto'))) . $this->_gen_folder_list($args['list'], '#moveto'));

			$lis = '';
			$lis .= html::tag('li', array('class' => 'print'), html::a(array('href' => "#print", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('printmessage')))));
			$lis .= html::tag('li', array('class' => 'save'), html::a(array('href' => "#download", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('emlsave')))));
			$lis .= html::tag('li', array('class' => 'edit'), html::a(array('href' => "#edit", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('editasnew')))));
			$lis .= html::tag('li', array('class' => 'source separator_below'), html::a(array('href' => "#viewsource", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('viewsource')))));
			$lis .= html::tag('li', array('class' => 'open'), html::a(array('href' => "#open", 'id' => 'rcm_open', 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('openinextwin')))));
			$li .= html::tag('li', array('class' => 'submenu moreacts'), html::span(null, rcmail::Q($this->gettext('moreactions'))) . html::tag('ul', array('class' => 'popupmenu toolbarmenu moreacts'), $lis));

			$out .= html::tag('ul', array('id' => 'rcmContextMenu', 'class' => 'popupmenu toolbarmenu'), $li);
		}

		// folder list menu
		$li = '';

		$li .= html::tag('li', array('class' => 'readfolder separator_below'), html::a(array('href' => "#readfolder", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('markreadfolder')))));

		$li .= html::tag('li', array('class' => 'expunge'), html::a(array('href' => "#expunge", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('compact')))));
		$li .= html::tag('li', array('class' => 'purge separator_below'), html::a(array('href' => "#purge", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('empty')))));

		$li .= html::tag('li', array('class' => 'collapseall'), html::a(array('href' => "#collapseall", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('collapseall')))));
		$li .= html::tag('li', array('class' => 'expandall separator_below'), html::a(array('href' => "#expandall", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('expandall')))));

		$li .= html::tag('li', array('class' => 'openfolder'), html::a(array('href' => "#openfolder", 'id' => 'rcm_openfolder', 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('openinextwin')))));

		$out .= html::tag('ul', array('id' => 'rcmFolderMenu', 'class' => 'popupmenu toolbarmenu'), $li);

		$this->api->output->add_footer(html::div(null , $out));

		if ($rcmail->action == 'show')
			$this->api->output->set_env('delimiter', $rcmail->storage->get_hierarchy_delimiter());
	}

	public function show_addressbook_menu($args)
	{
		$rcmail = rcube::get_instance();
		$this->add_texts('localization/');
		$this->include_script('jquery.contextMenu.js');
		$this->include_script('jquery.mousewheel.js');
		$this->include_stylesheet($this->local_skin_path() . '/contextmenu.css');
		$this->include_script('contextmenu.js');
		$out = '';

		// contact list menu
		$li = '';

		$li .= html::tag('li', array('class' => 'composeto separator_below'), html::a(array('href' => "#compose", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('composeto')))));

		$li .= html::tag('li', array('class' => 'editcontact'), html::a(array('href' => "#edit", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('editcontact')))));
		$li .= html::tag('li', array('class' => 'deletecontact'), html::a(array('href' => "#delete", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('deletecontact')))));
		$li .= html::tag('li', array('class' => 'removefromgroup'), html::a(array('href' => "#group-remove-selected", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('groupremoveselected')))));

		if ($lis = $this->_gen_addressbooks_list($args['sources'], '#moveto'))
			$li .= html::tag('li', array('class' => 'submenu separator_above'), html::span(null, rcmail::Q($this->gettext('copyto'))) . $lis);

		$out .= html::tag('ul', array('id' => 'rcmAddressMenu', 'class' => 'popupmenu toolbarmenu'), $li);

		// contact group menu
		$li = '';

		$li .= html::tag('li', array('class' => 'groupcreate'), html::a(array('href' => "#group-create", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('newcontactgroup')))));
		$li .= html::tag('li', array('class' => 'grouprename'), html::a(array('href' => "#group-rename", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('grouprename')))));
		$li .= html::tag('li', array('class' => 'groupdelete'), html::a(array('href' => "#group-delete", 'class' => 'active'), html::span(null, rcmail::Q($this->gettext('groupdelete')))));

		$out .= html::tag('ul', array('id' => 'rcmGroupMenu', 'class' => 'popupmenu toolbarmenu'), $li);

		$this->api->output->add_footer(html::div(null , $out));
	}

	// based on rcmail->render_folder_tree_html()
	private function _gen_folder_list($arrFolders, $command, $nestLevel = 0, &$folderTotal = 0)
	{
		$rcmail = rcube::get_instance();

		$maxlength = 35;
		$realnames = false;

		$out = '';
		foreach ($arrFolders as $key => $folder) {
			$title = null;

			if (($folder_class = $rcmail->folder_classname($folder['id'])) && !$realnames) {
				$foldername = $rcmail->gettext($folder_class);
			}
			else {
				$foldername = $folder['name'];

				// shorten the folder name to a given length
				if ($maxlength && $maxlength > 1) {
					$fname = abbreviate_string($foldername, $maxlength);

					if ($fname != $foldername)
						$title = $foldername;

					$foldername = $fname;
				}
			}

			// make folder name safe for ids and class names
			$folder_id = asciiwords($folder['id'], true, '_');
			$classes = array();

			// set special class for Sent, Drafts, Trash and Junk
			if ($folder['id'] == $rcmail->config->get('sent_mbox'))
				$classes[] = 'sent';
			else if ($folder['id'] == $rcmail->config->get('drafts_mbox'))
				$classes[] = 'drafts';
			else if ($folder['id'] == $rcmail->config->get('trash_mbox'))
				$classes[] = 'trash';
			else if ($folder['id'] == $rcmail->config->get('junk_mbox'))
				$classes[] = 'junk';
			else if ($folder['id'] == 'INBOX')
				$classes[] = 'inbox';
			else
				$classes[] = '_'.asciiwords($folder_class ? $folder_class : strtolower($folder['id']), true);

			if ($folder['virtual'])
				$classes[] = 'virtual';

			if ($nestLevel > 0)
				$classes[] = 'subfolder';

			$out .= html::tag('li', array('class' => join(' ', $classes)), html::a(array('href' => $command, 'onclick' => "rcm_set_dest_folder('". rcmail::JQ($folder['id']) ."')", 'class' => 'active', 'title' => $title), html::span(null, str_repeat('&nbsp;&nbsp;', $nestLevel) . rcmail::Q($foldername))));

			if (!empty($folder['folders']))
				$out .= $this->_gen_folder_list($folder['folders'], $command, $nestLevel+1, $folderTotal);

			$folderTotal++;
		}

		if ($nestLevel == 0) {
			if ($folderTotal > 5) {
				$out = html::tag('ul', array('class' => 'toolbarmenu folders scrollable'), $out);
				$out = html::tag('div', array('class' => 'scroll_up_pas'), '') . $out . html::tag('div', array('class' => 'scroll_down_act'), '');
				$out = html::tag('div', array('class' => 'popupmenu'), $out);
			}
			else {
				$out = html::tag('ul', array('class' => 'popupmenu toolbarmenu folders'), $out);
			}
		}

		return $out;
	}

	// based on rcmail_directory_list()
	private function _gen_addressbooks_list($arrBooks, $command)
	{
		$rcmail = rcube::get_instance();
		$groupTotal = 0;
		$maxlength = 35;
		$maxlength_grp = 33;
		$out = '';

		// address books
		foreach ($arrBooks as $j => $source) {
			$title = null;
			$id = $source['id'] ? $source['id'] : $j;
			$bookname = !empty($source['name']) ? rcmail::Q($source['name']) : rcmail::Q($id);

			// shorten the address book name to a given length
			if ($maxlength && $maxlength > 1) {
				$bname = abbreviate_string($bookname, $maxlength);

				if ($bname != $bookname)
					$title = $bookname;

				$bookname = $bname;
			}

			if ($source['readonly'])
				$out .= html::tag('li', array('id' => 'rcm_contextaddr_' . $id, 'class' => 'addressbook disabled'), html::a(array('href' => $command, 'id' => 'rcm_contextgrps_'. rcmail::JQ($id), 'onclick' => "rcm_set_dest_book('" . rcmail::JQ($id) ."', '" . rcmail::JQ($id) ."', null)", 'class' => 'active', 'title' => $title), html::span(null, rcmail::Q($bookname))));
			else
				$out .= html::tag('li', array('id' => 'rcm_contextaddr_' . $id, 'class' => 'addressbook'), html::a(array('href' => $command, 'id' => 'rcm_contextgrps_'. rcmail::JQ($id), 'onclick' => "rcm_set_dest_book('" . rcmail::JQ($id) ."', '" . rcmail::JQ($id) ."', null)", 'class' => 'active', 'title' => $title), html::span(null, rcmail::Q($bookname))));

			// contact groups
			if ($source['groups']) {
				$groups = $rcmail->get_address_book($source['id'])->list_groups();
				foreach ($groups as $group) {
					$title = null;
					$gid = 'G' . rcube_utils::html_identifier($id . $group['ID']);
					$groupname = !empty($group['name']) ? rcmail::Q($group['name']) : rcmail::Q($gid);

					// shorten the address book name to a given length
					if ($maxlength_grp && $maxlength_grp > 1) {
						$gname = abbreviate_string($groupname, $maxlength_grp);

						if ($gname != $groupname)
							$title = $groupname;

						$groupname = $gname;
					}

					if ($source['readonly'])
						$out .= html::tag('li', array('class' => 'contactgroup disabled'), html::a(array('href' => $command, 'id' => 'rcm_contextgrps_'. rcmail::JQ($gid), 'onclick' => "rcm_set_dest_book('" . rcmail::JQ($gid) . "', '" . rcmail::JQ($id) . "', '" . rcmail::JQ($group['ID']) ."')", 'class' => 'active', 'title' => $title), html::span(null, rcmail::Q($groupname))));
					else
						$out .= html::tag('li', array('class' => 'contactgroup'), html::a(array('href' => $command, 'id' => 'rcm_contextgrps_'. rcmail::JQ($gid), 'onclick' => "rcm_set_dest_book('" . rcmail::JQ($gid) . "', '" . rcmail::JQ($id) . "', '" . rcmail::JQ($group['ID']) ."')", 'class' => 'active', 'title' => $title), html::span(null, rcmail::Q($groupname))));

					$groupTotal++;
				}
			}

			$groupTotal++;
		}

		if ($groupTotal > 5) {
			$out = html::tag('ul', array('id' => 'rcm_contextgrps', 'class' => 'toolbarmenu folders scrollable'), $out);
			$out = html::tag('div', array('class' => 'scroll_up_pas'), '') . $out . html::tag('div', array('class' => 'scroll_down_act'), '');
			$out = html::tag('div', array('class' => 'popupmenu'), $out);
		}
		else {
			$out = html::tag('ul', array('id' => 'rcm_contextgrps', 'class' => 'popupmenu toolbarmenu folders'), $out);
		}

		return $out;
	}
}

?>