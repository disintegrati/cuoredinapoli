(function($){
	"use strict";
	var ZoompleOverlay = (function(){
		var instance;
		function init(){
			var $overlay, 
				$el, 
				visible, 
				timeoutId, 
				$eylet,
				$img,
				eyletSize = {};
			function showOverlay($el){
				$overlay.trigger('showoverlay.zoomple');
				$overlay.css({	left: $el.offset().left, 
									top: $el.offset().top, 
									width: $el.width(), 
									height: $el.height(),
									display : "block"});
				visible = true;
				$img = $el;
			}
			function moveOverlay(){
				if(visible){
					$overlay.css({	left: $img.offset().left, 
									top: $img.offset().top, 
									width: $img.width(), 
									height: $img.height()});
				}
			}
			function delayedHideOverlay(){
				timeoutId = setTimeout(hideOverlay, 100);
			}
			function hideOverlay(){
				$overlay.trigger('hideoverlay.zoomple');
				$overlay.css({'left': 'auto', 'top': 'auto', 'width': 'auto', 'height': 'auto',display : "none"});
				visible = false;
			}
			function cancelTimeout(){
				if(timeoutId){
					clearTimeout(timeoutId);
					timeoutId = null;
				}
			}
			function getEl(){
				return $overlay;
			}
			function getEylet(){
				return $eylet;
			}
			function setEyletSize(width, height){
				$eylet.css({width : width, height : height});
				eyletSize.width = width;
				eyletSize.height = height;
			}
			function getEyletSize(){
				return eyletSize;
			}
			function moveEylet(css){
				return $eylet.css(css);
			}
			function clearEylet(){
				
				return $eylet.css({background : 'transparent'});
			}
			
			$overlay = $("<div id=\"zoomple_image_overlay\"><div class=\"eyelet\"></div></div>").appendTo("body");
			$overlay.on("mouseenter", cancelTimeout);
			$overlay.on("mouseleave", hideOverlay);
			$eylet = $overlay.find(".eyelet");
			
			
			return {
				hideOverlay: hideOverlay,
				setEyletSize: setEyletSize,
				delayedHideOverlay: delayedHideOverlay,
				getEyletSize: getEyletSize,
				showOverlay: showOverlay,
				clearEylet: clearEylet,
				moveEylet: moveEylet,
				getEylet: getEylet,
				getEl: getEl
			};
		}
		return{
			getInstance : function(){
				if(!instance) instance = init();
				return instance;
			}
		};
	})();
	
	var Zoomple = function(element, options){
		this.$element = $(element),
		this.options = $.extend({}, Zoomple.DEFAULTS, options),
		this.stopLoading = false;
		this.$overlay = null,
		this.$cursor = null,
		this.$holder = null,
		this.overlay = null,
		this.timer = null,
		this.pageX = null,
		this.pageY = null,
		this.init();
	};
	
	Zoomple.DEFAULTS = { 
		source : 'href',
		bgColor : '#fff',
		attachWindowToMouse : true,
		windowPosition : {x : 'right', y : 'top'},
		loaderURL : 'images/loader.gif',
		blankURL : 'images/blank.gif',
		roundedCorners : false,
		offset : {x : 5,y : 5},
		showOverlay : false,
		showCursor : false,
		zoomHeight : 300,
		zoomWidth : 300,
		delay : 1
	};
	Zoomple.prototype.init = function(){
		// if the overlay is displayed the window can follow the mouse cause the overlay will overlap it
		if(this.options.showOverlay){
			this.options.attachWindowToMouse = false;
			this.options.showCursor = false;
		}
		
		
		if(!($('#zoomple_previewholder').length)) {
			$('body').append('<div id="zoomple_previewholder" style="width:'+this.options.zoomWidth+'px;height:'+this.options.zoomHeight+'px;"><div class="overlay"></div><div class="cursor"></div><div class="image_wrap"><img src="'+this.options.blankURL+'" alt="" /></div> <div class="caption-wrap"></div> </div>');	
		}
		this.overlay = ZoompleOverlay.getInstance();
		this.$element.find('img').on('mouseenter.zoomple',$.proxy(this.showZoom,this,this.$element.find('img')));
		this.$element.find('img').on('mouseleave.zoomple',$.proxy(this.hideOverlay,this));
		this.$cursor = this.$holder.find(".cursor");
		this.$holder = $("#zoomple_previewholder");
		this.$overlay = this.overlay.getEl();
	};
	Zoomple.prototype.showZoom = function($img,e ){
		var e = $.Event('zoomshow.zoomple',{zoomple : this});
		this.$overlay.on('hideoverlay.zoomple',$.proxy(this.hideZoom,this));
		this.$overlay.on('mousemove.zoomple',$.proxy(this.moveZoom,this,this.$element.find('img')));
		this.delaier($img.parent().attr(options.source),$img.attr('alt'));
		this.overlay.showOverlay(this.$element.find('img'));
		if (e.isDefaultPrevented()) return;
		var options = this.options;
		this.$element.trigger(e);
		this.setImageOverlay();
		e.stopPropagation();
		e.preventDefault();
		this.setRounded();
		this.setOverlay();
		this.setCursor();
	};
	Zoomple.prototype.hideZoom = function(e){
		var e = $.Event('zoomhide.zoomple',{zoomple : this});	
		this.$holder.find("img").css({"background" : " url("+this.options.blankURL+") 50% 50% no-repeat",'left' : 'auto','top' : 'auto','width' : 'auto','height' : 'auto'});
		if(e && e.stopPropagation) e.stopPropagation();
		if(e && e.preventDefault) e.preventDefault();
		this.$overlay.off('hideoverlay.zoomple');
		this.$overlay.off('mousemove.zoomple');
		this.$holder.removeClass("zp-visible");
		this.$holder.find("p").html('');
		clearTimeout(this.timer);
		this.stopLoading = false;
		this.$element.trigger(e);
		this.hideImageOverlay();
		this.clearCaption();
		this.clearEylet();
	};
	Zoomple.prototype.moveZoom = function($target,e){
		this.positionZoom($target,e);
		this.pageX = e.pageX;
		this.pageY = e.pageY;
		e.stopPropagation();
		e.preventDefault();
	};
	Zoomple.prototype.hideOverlay = function( e){
		this.overlay.delayedHideOverlay();
	};
	Zoomple.prototype.positionZoom = function($target,e){
	
		var options = this.options,
			x = ((e.pageX - $target.offset().left) / $target.width() )*100,
			y =  ((e.pageY - $target.offset().top) / $target.height())*100;
		
		if(this.options.attachWindowToMouse){
			thumbPosition = { left : ( e.pageX ), 
								top : ( e.pageY ), 
								right : Math.round($(window).width() - ( e.pageX - options.offset.x)), 
								bottom : Math.round($(window).height() - ( e.pageY - options.offset.y))}; 
			if(($(window).height() +  $(window).scrollTop() - options.zoomHeight - options.offset.y) > thumbPosition.top){
				this.$holder.css({'top' :  Math.round(thumbPosition.top + options.offset.y) + "px"});  
			} else {
				this.$holder.css({'top' :  Math.round(thumbPosition.top - options.zoomHeight - options.offset.y) + "px"});  
			}
			if(($(window).width() +  $(window).scrollLeft() - options.zoomWidth - options.offset.x) > thumbPosition.left){
				this.$holder.css({ 'left' : Math.round(thumbPosition.left + options.offset.x) + "px"});  
			} else {
				this.$holder.css({ 'left' : Math.round(thumbPosition.left - options.zoomWidth - options.offset.x) });  
			}
		} else {						 			
			var topPos =  Math.round($target.offset().top - options.offset.y);
			var rightPos = Math.round($target.offset().left + $target.width() + options.offset.x);
			var leftPos = Math.round($target.offset().left - options.offset.x - options.zoomWidth);
			var bottomPos =  Math.round($target.offset().top + $target.height() - options.zoomHeight + options.offset.y);
			if(options.windowPosition.y == 'bottom') this.$holder.css({'top' :  bottomPos + "px"});
			if(options.windowPosition.x == 'right') this.$holder.css({'left' :  rightPos + "px"});	  	
			if(options.windowPosition.x == 'left') this.$holder.css({'left' :  leftPos + "px"});
			if(options.windowPosition.y == 'top') this.$holder.css({'top' :  topPos + "px"});
		}
		var $img = this.$holder.find("img"),
			left = -($img.width() - options.zoomWidth)*x/100,
			top = -($img.height() - options.zoomHeight)*y/100;
			
		if(options.showCursor || options.roundedCorners){
			left 	+= (options.zoomWidth)*(50-x)/100;
			top 	+= (options.zoomHeight)*(50-y)/100;
		}
		this.$cursor.css({"left" :  50 +"% ","top": 50 +"%"});  
		
		if(this.options.showOverlay){
			var eyletPos = this.moveEylet(Math.round(e.pageX - $target.offset().left) ,  Math.round(e.pageY - $target.offset().top)),
				width = $img.width(),
				height = $img.height();
			
			this.moveImageOverlay(-Math.round(width*eyletPos.x),-Math.round(height*eyletPos.y) , $img );
		} else {
			$img.css({"left" : left +"px ","top":  top+"px"});  
		}
			
	};
	Zoomple.prototype.delaier = function(imgRefUrl,imgDescription)
	{	 
		this.stopLoading = true;  
		this.timer = setTimeout($.proxy(this.delaiedZoom,this,imgRefUrl,imgDescription), this.options.delay);
	};
	Zoomple.prototype.delaiedZoom = function(imgRefUrl,imgDescription){
			
		var self = this;	
		self.$holder.css({"width" : self.options.zoomWidth + "px","height" : self.options.zoomHeight + "px"});		
		self.$holder.find(".image_wrap").css({"background" : " url(" + self.options.loaderURL +") 50% 50% no-repeat"});		
		
		
		var objImagePreloader = new Image()
			src = imgRefUrl+"?" + new Date().getTime();
		objImagePreloader.src = src;
		if(self.stopLoading){ 
			self.$holder.addClass("zp-visible");
			self.$holder.find("img").attr("src",src);
			//self.$holder.css({"background-image" : " url("+self.options.loaderURL+")"});					
			if($.trim(imgDescription).length) self.$holder.find(".caption-wrap").html('<div class="caption">'+imgDescription+'</div>');
		}
		
		$(objImagePreloader).load(function() {	
			if(self.stopLoading){	
				self.$holder.addClass("zp-visible");
				self.$holder.find(".image_wrap").css({ "background" : self.options.bgColor});		
				self.$holder.find("img").css({"width" : this.width + "px","height" : this.height + "px"}).attr({"src":src, "width" : this.width, "height" : this.height});
				self.$holder.css({"background-image" : " none"});			
				if($.trim(imgDescription).length) self.$holder.find(".caption-wrap").html('<div class="caption">'+imgDescription+'</div>'); 
				var e = { pageX : self.pageX, pageY : self.pageY};
				if(self.options.showOverlay) self.setupEylet();
				self.positionZoom(self.$element.find('img'),e);
			}
		}); 
	};
	Zoomple.prototype.setCursor = function(){
		if(this.options.showCursor){
			this.$cursor.css("display","block");
		}else{
			this.$cursor.css("display","none");
		}
	};
	Zoomple.prototype.setRounded = function(){
		if(this.options.roundedCorners){
			this.$holder.addClass("rounded");
		}else{
			this.$holder.removeClass("rounded");
		}
	};
	Zoomple.prototype.setOverlay = function(){
		if(this.options.showOverlay){
			this.$overlay.addClass("preview");
		}else{
			this.$overlay.removeClass("preview");
		}
	};
	Zoomple.prototype.setupEylet = function(){
		var eylet = this.overlay.getEylet(),
			img = this.$element.find('img'),
			imgBig = this.$holder.find("img"),
			ratioW = this.options.zoomWidth/imgBig.width(),
			ratioH = this.options.zoomHeight/imgBig.height();
		eylet.css({background : "url("+img.attr('src')+") 0 0 no-repeat"});
		this.overlay.setEyletSize(Math.round(ratioW*img.width()), Math.round(ratioH*img.height()));
	};
	Zoomple.prototype.clearEylet = function(){
		this.overlay.clearEylet();
	};
	Zoomple.prototype.moveEylet = function(mouseX, mouseY){
		var eylet = this.overlay.getEylet(),
			size = this.overlay.getEyletSize(),
			left = Math.round(mouseX - size.width/2),
			top = Math.round(mouseY - size.height/2),
			img = this.$element.find('img');
		
		if(left <= 0){
			left = 0;
		}
		if(left >= img.width() - size.width){
			left = img.width() - size.width;
		} 
		if(top <= 0){
			top = 0;
		}
		if(top >= img.height() - size.height){
			top = img.height() - size.height;
		} 
		this.overlay.moveEylet({top : top, left : left});
		eylet.css({backgroundPosition : -left+"px "+ -top+"px"});
		return {x : left/img.width(), y : top/img.height()};
	};
	Zoomple.prototype.setImageOverlay = function(){
		var $overlay = $("#zoomple_image_overlay"),
		$img = this.$element.is("img") ? this.$element : this.$element.find("img") ;
		
		$overlay.css({'left': Math.round($img.offset().left), 'top': Math.round($img.offset().top), 'width': $img.width(), 'height': $img.height()});
	};
	Zoomple.prototype.hideImageOverlay = function(){
		$("#zoomple_image_overlay").css({'left': 'auto', 'top': 'auto', 'width': 'auto', 'height': 'auto'});
	};
	Zoomple.prototype.moveImageOverlay = function(left, top, $img){
		var size = {width : this.options.zoomWidth, height : this.options.zoomHeight};
		
		if(left >= 0){
			left = 0;
		}
		if(left <= size.width - $img.width()){
			left = size.width - $img.width();
		} 
		if(top >= 0){
			top = 0;
		}
		if(top <= size.height - $img.height()){
			top = size.height - $img.height();
		} 
		$img.css({left : left+"px ", top : top+"px"});
	};
	Zoomple.prototype.clearCaption = function(){
		this.$holder.find(".caption").remove(); 
	};		
		   
	$.fn.zoomple = function (options) {
        return this.each(function () {
            if (!$.data(this, 'zoomple')) {
                $.data(this, 'zoomple', new Zoomple( this, options ));
            }
        });
    };
})(jQuery);