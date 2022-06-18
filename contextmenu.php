<?php

/**
 * ContextMenu
 *
 * Plugin to add a context menu to various parts of the interface
 *
 * @author Philip Weir
 *
 * Copyright (C) Philip Weir
 *
 * This program is a Roundcube (https://roundcube.net) plugin.
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
 * along with Roundcube. If not, see https://www.gnu.org/licenses/.
 */
class contextmenu extends rcube_plugin
{
    public $task = '?(?!login$|logout$|cli$).*';
    private $rcube;

    public function init()
    {
        $this->rcube = rcube::get_instance();

        if (is_object($this->rcube->output) && $this->rcube->output->type == 'html') {
            $this->include_script('contextmenu.js');
            $this->include_stylesheet($this->local_skin_path() . '/contextmenu.css');
            $this->include_script($this->local_skin_path() . '/functions.js');
            $this->rcube->output->set_env('contextmenu', true);
            $this->rcube->output->set_env('contextmenu_mouseover_timeout', $this->rcube->config->get('contextmenu_mouseover_timeout', 400));
            $this->add_hook('render_page', [$this, 'additional_menus']);
        }

        $this->register_action('plugin.contextmenu.messagecount', [$this, 'messagecount']);
    }

    public function additional_menus($args)
    {
        // Other plugins may use template parsing method, this causes more than one render_page execution.
        // We have to make sure the menu is added only once (when content is going to be written to client).
        if (!$args['write']) {
            return;
        }

        // add additional menus for current task from skins folder if they exist
        if ($file_info = $this->_get_include_file($this->rcube->task . '.html')) {
            $this->add_texts('localization/');

            list($path, $include_path) = $file_info;
            $html = $this->rcube->output->just_parse("<roundcube:include file=\"/$path\" skinpath=\"$include_path\" />");
            $this->rcube->output->add_footer($html);
        }
    }

    public function messagecount()
    {
        $storage = $this->rcube->get_storage();
        $mbox = rcube_utils::get_input_string('_mbox', rcube_utils::INPUT_POST);

        // send output
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
        echo json_encode(['messagecount' => $storage->count($mbox, 'EXISTS')]);
        exit;
    }

    private function _get_include_file($file)
    {
        $file_info = false;

        $base_path = slashify($this->home);
        $rel_path = $this->local_skin_path() . '/includes/' . $file;
        // path to skin folder relative to Roundcube root for template engine
        $template_include_path = 'plugins/' . $this->ID;

        // check if the skin dir is in the plugin folder or in the core skins
        // folder (external to this plugin) see RC #7445 for more info
        if (strpos($rel_path, 'plugins/') !== false) {
            $base_path = slashify(RCUBE_INSTALL_PATH);
            $template_include_path = '.';
        }

        if (is_file($base_path . $rel_path) && is_readable($base_path . $rel_path)) {
            $file_info = [$rel_path, $template_include_path];
        }

        return $file_info;
    }
}
