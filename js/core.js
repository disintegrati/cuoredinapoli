// instafeed function
$(window).scrollTop(0);
$(document).ready(function(){
	"use strict";
	var feed = new Instafeed({
        get: 'tagged',
        tagName: 'cuoredinapoli',
        clientId: '3dab1340f39a4720882ccbb6f6ae204f',
        template: '<div class="cubo"><a href="{{image}}" rel="lightbox" title="Inviato da: {{model.user.username}}"><img src="{{image}}"/></a></div>',
		resolution: 'low_resolution',
		target: 'instagram',
		sortby: 'date',
		limit: '27',
	
	after: function() {
		limiter();
		pulsazione();
		document.getElementById("battito").play();
		$('#battito').get(0).play();
		$("#instagram").animate({"opacity" : 1},200, 
			function(){$("#instagram").animate({"opacity": 0},180, 
				function() {$("#instagram").animate({"opacity": 1},300,
				function() {fetch(); 
				});
			});
		});
	}
});
feed.run();

function fetch() {
	$("#instagram").delay(200).animate({"opacity" : 0}, 2000, function() {
		$("#instagram").remove("#instagram");
		$("#frame").append( "<div id='instagram'></div>" );
		feed.run();
	});
}

function limiter() {
	var instagrams = $("#instagram > .cubo a img");
	for (var i = 27; i < instagrams.length; i += 1) {
		instagrams[i].remove();
	}
}
// lightbox popup function
function pulsazione() {
	$("#zoomple").animate({"opacity": 1},200).animate({"opacity": 0},180).animate({"opacity": 1},300);}
	$('.zoomple').zoomple({ 
		blankURL: 'images/blank.gif',
		loaderURL: 'images/loader.gif',
		offset: {x:-150,y:-150},
		roundedCorners: true,
		bgColor: '#90D5D9', 
		zoomHeight: 300,
		zoomWidth: 300
	});
});
// change menu on scroll
var scroll_start = 0;
$(document).scroll(function() {
	"use strict";
	scroll_start = $("body").scrollTop();
	if(scroll_start > 480) {
		$('menu').css('display','block');
		} else {
			$('menu').css('display','none');
	}
});