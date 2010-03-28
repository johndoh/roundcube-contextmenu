// jQuery Context Menu Plugin
//
// Version 1.00
//
// Cory S.N. LaViska
// A Beautiful Site (http://abeautifulsite.net/)
//
// Visit http://abeautifulsite.net/notebook/80 for usage and more information
//
// Terms of Use
//
// This software is licensed under a Creative Commons License and is copyrighted
// (C)2008 by Cory S.N. LaViska.
//
// For details, visit http://creativecommons.org/licenses/by/3.0/us/
//
// Modified by Phil Weir:
//   Added highlighting of selected row and submenu support
//   Added sub menu functions
//   Added bind to contextmenu event

if(jQuery)( function() {
	$.extend($.fn, {
		contextMenu: function(o, callback) {
			// Defaults
			if( o.menu == undefined ) return false;
			if( o.inSpeed == undefined ) o.inSpeed = 150;
			if( o.outSpeed == undefined ) o.outSpeed = 75;
			// 0 needs to be -1 for expected results (no fade)
			if( o.inSpeed == 0 ) o.inSpeed = -1;
			if( o.outSpeed == 0 ) o.outSpeed = -1;
			// Loop each context menu
			$(this).each( function() {
				var el = $(this);
				var offset = $(el).offset();
				// Add contextMenu class
				$('#' + o.menu).addClass('contextMenu');

				// Cancel context menu event
				$(this).bind("contextmenu",function(e){
					return false;
				});

				// Simulate a true right click
				$(this).mousedown( function(e) {
					var evt = e;
					$(this).mouseup( function(e) {
						var srcElement = $(this);
						$(this).unbind('mouseup');
						if( evt.button == 2 ) {
							// Hide context menus that may be showing
							$(".contextRow").removeClass('contextRow');
							$(".contextMenu").hide();

							if (!srcElement.hasClass('selected'))
								srcElement.addClass('contextRow');

							rcm_update_options(srcElement);

							// Get this context menu
							var menu = $('#' + o.menu);

							if( $(el).hasClass('disabled') ) return false;

							// Detect mouse position
							var d = {}, x, y;
							if( self.innerHeight ) {
								d.pageYOffset = self.pageYOffset;
								d.pageXOffset = self.pageXOffset;
								d.innerHeight = self.innerHeight;
								d.innerWidth = self.innerWidth;
							} else if( document.documentElement &&
								document.documentElement.clientHeight ) {
								d.pageYOffset = document.documentElement.scrollTop;
								d.pageXOffset = document.documentElement.scrollLeft;
								d.innerHeight = document.documentElement.clientHeight;
								d.innerWidth = document.documentElement.clientWidth;
							} else if( document.body ) {
								d.pageYOffset = document.body.scrollTop;
								d.pageXOffset = document.body.scrollLeft;
								d.innerHeight = document.body.clientHeight;
								d.innerWidth = document.body.clientWidth;
							}
							(e.pageX) ? x = e.pageX + 1 : x = e.clientX + d.scrollLeft + 1;
							(e.pageY) ? y = e.pageY + 1 : x = e.clientY + d.scrollTop + 1;

							// Show the menu
							$(document).unbind('click');
							$('#' + o.menu + ' li ul').hide();
							$('#' + o.menu + ' li div').hide();
							$(menu).css({ top: y, left: x }).fadeIn(o.inSpeed);

							// Hover events
							$(menu).find('A').mouseover( function() {
								$(menu).find('LI.hover').removeClass('hover');
								$(this).parent().addClass('hover');
							}).mouseout( function() {
								$(menu).find('LI.hover').removeClass('hover');
							});

							// Keyboard
							$(document).keypress( function(e) {
								switch( e.keyCode ) {
									case 38: // up
										if( $(menu).find('LI.hover').size() == 0 ) {
											$(menu).find('LI:last').addClass('hover');
										} else {
											$(menu).find('LI.hover').removeClass('hover').prevAll('LI:not(.disabled)').eq(0).addClass('hover');
											if( $(menu).find('LI.hover').size() == 0 ) $(menu).find('LI:last').addClass('hover');
										}
									break;
									case 40: // down
										if( $(menu).find('LI.hover').size() == 0 ) {
											$(menu).find('LI:first').addClass('hover');
										} else {
											$(menu).find('LI.hover').removeClass('hover').nextAll('LI:not(.disabled)').eq(0).addClass('hover');
											if( $(menu).find('LI.hover').size() == 0 ) $(menu).find('LI:first').addClass('hover');
										}
									break;
									case 13: // enter
										$(menu).find('LI.hover A').trigger('click');
									break;
									case 27: // esc
										$(document).trigger('click');
									break
								}
							});

							// When items are selected
							$('#' + o.menu).find('A').unbind('click');
							$('#' + o.menu).find('LI:not(.disabled) A').click( function() {
								$(document).unbind('click').unbind('keypress');
								$(".contextMenu").hide();
								srcElement.removeClass('contextRow');
								// Callback
								if( callback ) callback( $(this).attr('href').substr(1), $(srcElement), {x: x - offset.left, y: y - offset.top, docX: x, docY: y} );
								return false;
							});

							// Hide bindings
							setTimeout( function() { // Delay for Mozilla
								$(document).click( function() {
									$(document).unbind('click').unbind('keypress');
									$(".contextRow").removeClass('contextRow');
									$(menu).fadeOut(o.outSpeed);
									return false;
								});
							}, 0);
						}

				        // pop event bubble (when drag 'n drop not active)
				        if (!rcmail.drag_active) {
				        	e.cancelBubble = true;
				        	if (e.stopPropagation) e.stopPropagation();
			        	}
					});
				});

				// Setup events to show/hide the sub menus
				var submenu_showtimer;
				var submenu_hidetimer;
				$('#' + o.menu).children('li').mouseenter( function() {
					// if the element doesnt have a sub menu always hide any existing menus
					if (!$(this).hasClass('submenu')) {
						submenu_hidetimer = window.setTimeout(function() {
							$('#' + o.menu).children('li.submenu').children().hide();
							submenu_hidetimer = null;
						}, o.submenu_delay);
					}
					else if ($(this).hasClass('submenu') && !submenu_showtimer) {
						window.clearTimeout(submenu_hidetimer);
						submenu_hidetimer = null;

						var obj = this;
						submenu_showtimer = window.setTimeout(function() {
							// hide any existing sub menus
							$('#' + o.menu).children('li.submenu').children('div.popupmenu').children('ul.scrollable').scrollTop(0);
							$('#' + o.menu).children('li.submenu').children('div.popupmenu').children('div.scroll_up_act').addClass('scroll_up_pas').removeClass('scroll_up_act');
							$('#' + o.menu).children('li.submenu').children('div.popupmenu').children('div.scroll_down_pas').addClass('scroll_down_act').removeClass('scroll_down_pas');
							$('#' + o.menu).children('li.submenu').children().hide();

							// show selected sub menu
							$(this).submenu_render(obj, $('#' + o.menu));
							submenu_showtimer = null;
						}, o.submenu_delay);
					}
				});

				$('#' + o.menu).children('li.submenu').mouseleave( function() {
					window.clearTimeout(submenu_showtimer);
					submenu_showtimer = null;
				});

				$(this).mouseleave( function() {
					window.clearTimeout(submenu_showtimer);
					submenu_showtimer = null;
				});

				// Disable text selection
				if( $.browser.mozilla ) {
					$('#' + o.menu).each( function() { $(this).css({ 'MozUserSelect' : 'none' }); });
				} else if( $.browser.msie ) {
					$('#' + o.menu).each( function() { $(this).bind('selectstart.disableTextSelect', function() { return false; }); });
				} else {
					$('#' + o.menu).each(function() { $(this).bind('mousedown.disableTextSelect', function() { return false; }); });
				}
				// Disable browser context menu (requires both selectors to work in IE/Safari + FF/Chrome)
				$(el).add('UL.contextMenu').bind('contextmenu', function() { return false; });

			});
			return $(this);
		},

		// Disable context menu items on the fly
		disableContextMenuItems: function(o) {
			if( o == undefined ) {
				// Disable all
				$(this).find('LI').addClass('disabled');
				return( $(this) );
			}
			$(this).each( function() {
				if( o != undefined ) {
					var d = o.split(',');
					for( var i = 0; i < d.length; i++ ) {
						$(this).find('A[href="' + d[i] + '"]').parent().addClass('disabled');

					}
				}
			});
			return( $(this) );
		},

		// Enable context menu items on the fly
		enableContextMenuItems: function(o) {
			if( o == undefined ) {
				// Enable all
				$(this).find('LI.disabled').removeClass('disabled');
				return( $(this) );
			}
			$(this).each( function() {
				if( o != undefined ) {
					var d = o.split(',');
					for( var i = 0; i < d.length; i++ ) {
						$(this).find('A[href="' + d[i] + '"]').parent().removeClass('disabled');

					}
				}
			});
			return( $(this) );
		},

		// Disable context menu(s)
		disableContextMenu: function() {
			$(this).each( function() {
				$(this).addClass('disabled');
			});
			return( $(this) );
		},

		// Enable context menu(s)
		enableContextMenu: function() {
			$(this).each( function() {
				$(this).removeClass('disabled');
			});
			return( $(this) );
		},

		// Destroy context menu(s)
		destroyContextMenu: function() {
			// Destroy specified context menus
			$(this).each( function() {
				// Disable action
				$(this).unbind('mousedown').unbind('mouseup');
			});
			return( $(this) );
		},

		// Show sub menus
		submenu_render: function(obj, menu) {
			$(obj).children().css({left: ($(menu).width() - 2)+ 'px'});
			$(obj).children().show();

			if ($(obj).children('div.popupmenu').length) {
				$(obj).children('div.popupmenu').children().show();

				if ($(obj).children('div.popupmenu').width() == 0) {
					ul_overflow = $(obj).children('div.popupmenu').children('ul').css('overflow');
					$(obj).children('div.popupmenu').children('ul').css({overflow: 'visible'});
					$(obj).children('div.popupmenu').children('div').css({width: $(obj).children('div.popupmenu').children('ul').width()+ 'px'})
					$(obj).children('div.popupmenu').css({width: $(obj).children('div.popupmenu').children('ul').width()+ 'px'})
					$(obj).children('div.popupmenu').children('ul').css({overflow: ul_overflow});

					$(obj).children('div.popupmenu').children('div').click( function(e) {
						var list = $(this).parent().children('ul');

						if ($(this).hasClass('scroll_up_act')) {
							$(list).scrollTop($(list).scrollTop() - 18);

							$(obj).children('div.popupmenu').children('div.scroll_down_pas').addClass('scroll_down_act');
							$(obj).children('div.popupmenu').children('div.scroll_down_pas').removeClass('scroll_down_pas');

							if ($(list).scrollTop() == 0) {
								$(this).removeClass('scroll_up_act');
								$(this).addClass('scroll_up_pas');
							}
						}
						else if ($(this).hasClass('scroll_down_act')) {
							$(list).scrollTop($(list).scrollTop() + 18);

							$(obj).children('div.popupmenu').children('div.scroll_up_pas').addClass('scroll_up_act');
							$(obj).children('div.popupmenu').children('div.scroll_up_pas').removeClass('scroll_up_pas');

							if ($(list).attr('scrollHeight') - $(list).scrollTop() == $(list).outerHeight()) {
								$(this).removeClass('scroll_down_act');
								$(this).addClass('scroll_down_pas');
							}
						}

						// pop event bubble
						e.cancelBubble = true;
						if (e.stopPropagation) e.stopPropagation();
					});

					$(obj).children('div.popupmenu').children('ul').mousewheel( $(this).submenu_mousewheel );
				}
			}
		},

		submenu_mousewheel: function(e, delta) {
			if (delta > 0)
				$(this).parent().children('div.scroll_up_act').click();
			else if (delta < 0)
				$(this).parent().children('div.scroll_down_act').click();
		}
	});
})(jQuery);