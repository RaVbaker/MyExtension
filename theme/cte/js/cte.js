
angular.module('rubedoBlocks').filter('cleanUrl', function () {
    return function (input) {
        return input.replace("//","/");
     };
  });

angular.module('rubedo').filter('ligneNonVide', function () {
    return function (input) {
        return (row.columns[0].blocks).length > 0; 
     };
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

angular.module('rubedoBlocks').directive('loadModal', function () {
    return {
        restrict: 'A',
        link: function(scope, $elm, attrs) {
            $elm.bind('click', function(event) {
                event.preventDefault();
                /*angular.element('#myModal iframe').attr('src', src);*/
                angular.element('#myModal').appendTo('body').modal('show');
            });
            scope.dismiss = function() {
                      angular.element('#myModal').modal('hide');
           };
        }
    }
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
        serviceInstance.getTaxonomyByContentId=function(pageId,contentIds){
            return ($http.get("/api/v1/taxonomy",{
                params:{
                    pageId:pageId,
                    type:contentIds
                }
            }));
        };
        return serviceInstance;
    }]);


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
  
angular.module('rubedoBlocks').directive('addthisToolbox', ['$timeout','$location', function($timeout,$location) {
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
	           addthis.counter(angular.element('.addthis_counter').get(), {}, {url: contentUrl});
           /*addthis.sharecounters.getShareCounts({service: ['facebook','twitter'], countUrl: $location.absUrl()}, function(obj) {
                      console.log(obj)
           });*/
      });
	  }
	};
}]);
