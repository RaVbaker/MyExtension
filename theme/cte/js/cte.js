blocksConfig.imageBatchUpload={
           "template": "/templates/blocks/imageBatchUpload.html",
          "internalDependencies":["/src/modules/rubedoBlocks/controllers/imageBatchUploadController.js"]
};

angular.module('rubedoBlocks').filter('cleanUrl', function () {
    return function (input) {
        return input.replace("//","/");
     };
  });


angular.module('rubedoBlocks').filter('cleanHour', function () {
    return function (input) {
    	var hour="";
    	if(input.split('AM').length>1){
    		hour=input.split('AM')[0];
    	}
    	else if(input.split('PM').length>1){
    		var hours = input.split('PM')[0].split(':')[0];
    		var mins = input.split('PM')[0].split(':')[1];
    		hour=(parseInt(hours)+12)+":"+mins
    		
    	}  
    	else hour = input;
        return hour;
     };
  });
angular.module('rubedo').filter('ligneNonVide', function () {
           return function (input) {
                      var filtered = [];
		      var contentDisplay = false;
                      angular.forEach(input, function(row, index) {
				// si la 1re colonne est terminale et non vide
                                 if (row.columns[0].isTerminal&&row.columns[0].blocks) {
				    // toujours afficher la 1re ligne (menu) et les 2 dernires (footer)
				    if (index ==0 || index >= input.length-2) {
					filtered.push(row);
				    }
				    // si la page sert ˆ afficher un contenu (en 2me ligne) on n'affiche pas les autres lignes
				    else if (row.columns[0].blocks[0].configBloc.isAutoInjected)  {
					filtered.push(row);
					contentDisplay = true;
				    }
				    //si la ligne a un bloc de dŽtail en premier, on affiche seulement le bloc dŽtail dans la ligne
				    else if (row.columns[0].blocks[0].bType=="contentDetail" && !contentDisplay) {
					row.columns[0].blocks = {0 : row.columns[0].blocks[0]};
					filtered.push(row);
				    }
				    // sinon on affiche tout
				    else if(!contentDisplay) {filtered.push(row);}
                                 }
                      });
                      return filtered;
		    
           };
  });
angular.module('rubedoBlocks').filter('tags', function() {
    return function(contents, tag) {
           if (tag=="") {
                      return contents;
           }
           else {
                      var contentList=[];
                      angular.forEach(contents, function(content){
                         if(content.taxonomy['5524db6945205e627a8d8c4e'] && (content.taxonomy['5524db6945205e627a8d8c4e']).indexOf(tag) != -1){
                                    contentList.push(content);
                         }
                      })
                      return contentList;
           }
    };
});

/*filtre pour renvoyer le format de la date de début d'une proposition bien formatée*/
angular.module('rubedoBlocks').filter('dateRange', function ($filter) {
    return function(startDate, endDate, rangeFormat,from,to){
	var format = rangeFormat || 'long';
	var formatOfDate =  'd MMM yyyy';
	var isSameDay = false;
	var start = new Date(startDate*1000);
	var end = new Date(endDate*1000);
	if (start.getFullYear() != end.getFullYear()) {
	    formatOfDate = 'd MMM yyyy';
	}
	else if (start.getMonth() != end.getMonth()) {
	    formatOfDate = 'd MMM';
	}
	else  if(start.getDate() == end.getDate()){
	    formatOfDate = 'd';
	    isSameDay=true;
	}
	else {
	    formatOfDate = 'd';
	}
	if (format == 'short') {
		if(isSameDay) formattedDate= $filter('date')(end,'d MMM yyyy');	  
	    	else formattedDate= $filter('date')(start,formatOfDate) + "-"+$filter('date')(end,'d MMM yyyy');	    
	}
	else {
           if(isSameDay) formattedDate= $filter('date')(end,'d MMM yyyy');	  
	   else formattedDate= from +" "+$filter('date')(start,formatOfDate) + " "+to+" "+$filter('date')(end,'d MMMM yyyy');	    
	}
	return formattedDate;
    }
  });

// pour filtrer les éléments avec une date passée
angular.module('rubedoBlocks').filter('isAfter', function ($filter) {
           return function(items, dateAfter){
                      var nextEvents = [];
                      if (dateAfter=='today' ) {
                                 var today = new Date();
                                 var limit = today.getTime();
                      }
                      else var limit = dateAfter*1000;
                      angular.forEach(items, function(content, index) {
                                 if (content.fields.dateDebut*1000 >=limit) {
                                            nextEvents.push(content);
                                 }
                      });
                      return nextEvents;
                      
           }
});




angular.module('rubedoBlocks').controller("AudioFileController",["$scope","RubedoMediaService",function($scope,RubedoMediaService){
        var me=this;
        var mediaId=$scope.audioFileId;
         me.displayMedia=function(){
            if (me.media&&me.media.originalFileId){

                        me.jwSettings={
                            primary:"flash",
                            width:"100%",
                            height:40,
                            file:me.media.url,
                        };
                        setTimeout(function(){jwplayer("audio"+me.media.originalFileId).setup(me.jwSettings);}, 200);
            }
        };
        if (mediaId){
            RubedoMediaService.getMediaById(mediaId).then(
                function(response){
                    if (response.data.success){
                        me.media=response.data.media;
                        me.displayMedia();
                    }
                }
            );
        }
    }]);

 angular.module('rubedoBlocks').directive('jwplayer', ['$compile', function ($compile) {
    return {
        restrict: 'EC',
        link: function (scope, element, attrs) {
           var filmUrl = attrs.videoUrl;
            var id = 'random_player_' + Math.floor((Math.random() * 999999999) + 1),
            getTemplate = function (playerId) {
                      
                return '<div id="' + playerId + '"></div>';
            };
           var options = {
                      file: filmUrl,
                      modestbranding:0,
                      showinfo:1,
                      width:"100%",
                      aspectratio:"16:9"};
            element.html(getTemplate(id));
            $compile(element.contents())(scope);
            jwplayer(id).setup(options);
        }
    };
}]);

 angular.module('rubedoBlocks').directive('balanceText', function ($timeout) {
    return {
        restrict: 'C',
        link:  function (scope, element, attr) {
           function balanceText() {
                      element.balanceText();
            }
            $timeout(balanceText);
                    
        }
    };
});





    angular.module('rubedoDataAccess').factory('RubedoMailService', ['$http',function($http) {
        var serviceInstance={};
        serviceInstance.sendMail=function(payload){
            return ($http({
                url:"api/v1/mail",
                method:"POST",
                data : payload
            }));
        };
        return serviceInstance;
    }]);
    angular.module('rubedoDataAccess').factory('TaxonomyService', ['$http',function($http) {
        var serviceInstance={};
	serviceInstance.getTaxonomyByVocabulary=function(vocabularies){
            return ($http.get("/api/v1/taxonomies",{
                params:{
                    vocabularies:vocabularies
                }
            }));
	};
        return serviceInstance;
    }]);
angular.module('rubedoDataAccess').factory('InscriptionService', ['$http',function($http) {
    var serviceInstance={};
    serviceInstance.inscrire=function(inscription,workspace,traductions){
        return($http({
                url:"/api/v1/inscription",
                method:"POST",
                data:{
                    inscription:inscription,
                    workspace: workspace
                }
            }));
    };
    return serviceInstance;
}]);
angular.module('rubedoDataAccess').factory('DonationService', ['$http',function($http) {
           var serviceInstance={};
           serviceInstance.donate=function(don, account){
            return ($http({
                url:"api/v1/donation",
                method:"POST",
                data : {
                    don:don,
                    account : account
                }
            }));
        };
    return serviceInstance;
}]);

angular.module('rubedoDataAccess').factory('PaymentService', ['$http',function($http) {
    var serviceInstance={};
    serviceInstance.payment=function(payload){
        return($http({
                url:"/api/v1/payment",
                method:"POST",
                data:payload
            }));
    };
    return serviceInstance;
}]);
angular.module('rubedoDataAccess').factory('RubedoPaymentMeansService',['$http',function($http){
           var serviceInstance = {};
           serviceInstance.getPaymentMeansDons=function(){
               return ($http.get("/api/v1/ecommerce/paymentmeans",{
                      params: {
                         filter_by_site:true,
                         type:"dons"
                      }
                }));
           };
           serviceInstance.getPaymentMeansPaf=function(){
               return ($http.get("/api/v1/ecommerce/paymentmeans",{
                      params: {
                         filter_by_site:true,
                         type:"paf"
                      }
                }));
           };
           return serviceInstance;
}]);

/*pour page "autour de vous*/
  angular.module('rubedoBlocks').directive('focusOnClick', function ($timeout) {
    return {
         link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus();element[0].value=""; } );
                }
            }, true);
         }}
  });
  
angular.module('rubedoBlocks').directive('addthisToolbox', ['$timeout','$location','$http', function($timeout,$location,$http) {
  return {
    restrict : 'A',
	  transclude : true,
	  replace : true,
	  template : '<div ng-transclude></div>',
	  link : function($scope, element, attrs) {
		$timeout(function () {
                      addthis.init();
                      var contentUrl = $location.absUrl();
                      addthis.toolbox(angular.element('.addthis_toolbox').get(), {}, {
                                 url: contentUrl,
                                 title : attrs.title,
                                 description : ''        
                      });
		/*if ($window.addthis.layers && $window.addthis.layers.refresh) {
                        $window.addthis.layers.refresh();
                    }*/
		$scope.nbOfLikes=0;
		$http({method: 'GET',url: 'http://graph.facebook.com/?id='+contentUrl})
		.then(function successCallback(response) {
			$scope.nbOfLikes += response.data.share.share_count;
		},
		function errorCallback(response) {
		});
		$http({method: 'GET',url: 'http://cdn.api.twitter.com/1/urls/count.json?url='+contentUrl})
		.then(function successCallback(response) {
			$scope.nbOfLikes += response.data.count;
		},
		function errorCallback(response) {
		});		

		});
	    }
	};
}]);





angular.module('rubedoBlocks').controller('MasonryCtrl', [
    '$scope',
    '$element',
    '$timeout',
    function controller($scope, $element, $timeout) {
      var bricks = {};
      var schedule = [];
      var destroyed = false;
      var self = this;
      var timeout = null;
      this.preserveOrder = false;
      this.loadImages = true;
      this.scheduleMasonryOnce = function scheduleMasonryOnce() {
        var args = arguments;
        var found = schedule.filter(function filterFn(item) {
            return item[0] === args[0];
          }).length > 0;
        if (!found) {
          this.scheduleMasonry.apply(null, arguments);
        }
      };
      // Make sure it's only executed once within a reasonable time-frame in
      // case multiple elements are removed or added at once.
      this.scheduleMasonry = function scheduleMasonry() {
        if (timeout) {
          $timeout.cancel(timeout);
        }
        schedule.push([].slice.call(arguments));
        timeout = $timeout(function runMasonry() {
          if (destroyed) {
            return;
          }
          schedule.forEach(function scheduleForEach(args) {
            $element.masonry.apply($element, args);
          });
          schedule = [];
        }, 30);
      };
      function defaultLoaded($element) {
        $element.addClass('loaded');
      }
      this.appendBrick = function appendBrick(element, id) {
        if (destroyed) {
          return;
        }
        function _append() {
          if (Object.keys(bricks).length === 0) {
            $element.masonry('resize');
          }
          if (bricks[id] === undefined) {
            // Keep track of added elements.
            bricks[id] = true;
            defaultLoaded(element);
            $element.masonry('appended', element, true);
          }
        }
        function _layout() {
          // I wanted to make this dynamic but ran into huuuge memory leaks
          // that I couldn't fix. If you know how to dynamically add a
          // callback so one could say <masonry loaded="callback($element)">
          // please submit a pull request!
          self.scheduleMasonryOnce('layout');
        }
        if (!self.loadImages) {
          _append();
          _layout();
        } else if (self.preserveOrder) {
          _append();
          element.imagesLoaded(_layout);
        } else {
          element.imagesLoaded(function imagesLoaded() {
            _append();
            _layout();
          });
        }
      };
      this.removeBrick = function removeBrick(id, element) {
        if (destroyed) {
          return;
        }
        delete bricks[id];
        $element.masonry('remove', element);
        this.scheduleMasonryOnce('layout');
      };
      this.destroy = function destroy() {
        destroyed = true;
        if ($element.data('masonry')) {
          // Gently uninitialize if still present
          $element.masonry('destroy');
        }
        $scope.$emit('masonry.destroyed');
        bricks = {};
      };
      this.reload = function reload() {
        $element.masonry();
        $scope.$emit('masonry.reloaded');
      };
    }
  ]).directive('masonry', function masonryDirective() {
    return {
      restrict: 'AE',
      controller: 'MasonryCtrl',
      link: {
        pre: function preLink(scope, element, attrs, ctrl) {
          var attrOptions = scope.$eval(attrs.masonry || attrs.masonryOptions);
          var options = angular.extend({
              itemSelector: attrs.itemSelector || '.masonry-brick',
              columnWidth: parseInt(attrs.columnWidth, 10) || attrs.columnWidth
            }, attrOptions || {});
          element.masonry(options);
          scope.masonryContainer = element[0];
          var loadImages = scope.$eval(attrs.loadImages);
          ctrl.loadImages = loadImages !== false;
          var preserveOrder = scope.$eval(attrs.preserveOrder);
          ctrl.preserveOrder = preserveOrder !== false && attrs.preserveOrder !== undefined;
          var reloadOnShow = scope.$eval(attrs.reloadOnShow);
          if (reloadOnShow !== false && attrs.reloadOnShow !== undefined) {
            scope.$watch(function () {
              return element.prop('offsetParent');
            }, function (isVisible, wasVisible) {
              if (isVisible && !wasVisible) {
                ctrl.reload();
              }
            });
          }
          var reloadOnResize = scope.$eval(attrs.reloadOnResize);
          if (reloadOnResize !== false && attrs.reloadOnResize !== undefined) {
            scope.$watch('masonryContainer.offsetWidth', function (newWidth, oldWidth) {
              if (newWidth != oldWidth) {
                ctrl.reload();
              }
            });
          }
          scope.$emit('masonry.created', element);
          scope.$on('$destroy', ctrl.destroy);
        }
      }
    };
  }).directive('masonryBrick', function masonryBrickDirective() {
    return {
      restrict: 'AC',
      require: '^masonry',
      scope: true,
      link: {
        pre: function preLink(scope, element, attrs, ctrl) {
          var id = scope.$id, index;
          ctrl.appendBrick(element, id);
          element.on('$destroy', function () {
            ctrl.removeBrick(id, element);
          });
          scope.$on('masonry.reload', function () {
            ctrl.scheduleMasonryOnce('reloadItems');
            ctrl.scheduleMasonryOnce('layout');
          });
          scope.$watch('$index', function () {
            if (index !== undefined && index !== scope.$index) {
              ctrl.scheduleMasonryOnce('reloadItems');
              ctrl.scheduleMasonryOnce('layout');
            }
            index = scope.$index;
          });
        }
      }
    };
  });







