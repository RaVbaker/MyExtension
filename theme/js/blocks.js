blocksConfig.buttonToPage={
           "template": "/templates/blocks/buttonToPage.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/buttonToPage.js"]
};
blocksConfig.simpleContact={
           "template": "/templates/blocks/simpleContact.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/simpleContact.js"]
};
blocksConfig.facebook={
           "template": "/templates/blocks/facebook.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/FacebookController.js"]
};
blocksConfig.d3Script= {
            "template": "/templates/blocks/d3Script.html",
            "internalDependencies":["/src/modules/rubedoBlocks/controllers/D3ScriptController.js"],
            "externalDependencies":['/components/mbostock/d3/d3.min.js','//cdnjs.cloudflare.com/ajax/libs/topojson/1.6.9/topojson.min.js']
},
blocksConfig.bg_image={
           "template": "/templates/blocks/bg_image.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/BgImageController.js"]
};
blocksConfig.footer={
           "template": "/templates/blocks/footer.html"
};
blocksConfig.footer_links={
           "template": "/templates/blocks/footer_links.html"
};
blocksConfig.contentDetail = {
            "template": "/templates/blocks/contentDetail.html",
            "externalDependencies":['//s7.addthis.com/js/300/addthis_widget.js','//cdnjs.cloudflare.com/ajax/libs/masonry/3.3.2/masonry.pkgd.min.js','//cdnjs.cloudflare.com/ajax/libs/jquery.imagesloaded/3.2.0/imagesloaded.pkgd.min.js'],
            "internalDependencies":["/src/modules/rubedoBlocks/controllers/ContentDetailController.js","/src/modules/rubedoBlocks/controllers/simpleContact.js","/lib/masonry/masonry.js",]
};
blocksConfig.sectionPresentation={
           "template": "/templates/blocks/sectionPresentation.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/sectionPresentation.js"]
};
blocksConfig.carrousel2={
           "template": "/templates/blocks/carrousel_fullWidth.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/carrousel_fullWidth.js"]
};
blocksConfig.redirect={
           "template": "/templates/blocks/redirect.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/redirectController.js"]
};

