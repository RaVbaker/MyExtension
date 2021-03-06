﻿/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
        config.colorButton_colors = '00a0ae,1d8f9e,0073b3,f19942,e71623,e3dfd7,807f7d,333333';
        config.colorButton_enableMore = false;
        config.youtube_responsive = true;
	config.bootstrapCollapse_managePopupContent = false;

};

CKEDITOR.stylesSet.add( 'default', [
{ name: 'center img', element: 'img', styles: { 'margin': '0 auto'} }

] );


CKEDITOR.plugins.addExternal( 'widget', '/theme/netforgod/ckeditor/plugins/widget/','plugin.js' );
CKEDITOR.plugins.addExternal( 'lineutils', '/theme/netforgod/ckeditor/plugins/lineutils/','plugin.js' );
CKEDITOR.plugins.addExternal( 'youtube', '/theme/goodnews/ckeditor/plugins/youtube/','plugin.js' );
CKEDITOR.plugins.addExternal( 'bootstrapCollapse', '/theme/netforgod/ckeditor/plugins/bootstrapCollapse/','plugin.js' );
