( function ($) 
{
  // unique id 
  var get_uid = function() { 
    if( !('id' in arguments.callee) )
      arguments.callee.id = 0;
    return "ugallery_" + arguments.callee.id++; 
  };

  // image cache
  var add_cache = function(src) {
    if( !('cache' in arguments.callee) )
      arguments.callee.cache = {};

    if( !(src in arguments.callee.cache) ) {
      arguments.callee.cache[src] = new Image();
      arguments.callee.cache[src].src = src;
    }
  };

  $.fn.ugallery = function(params)  {

    // options
    var defaults = {
      // viewport window
      forward_btn           : "right.gif",
      backward_btn          : "left.gif",
      controls_vpos         : 150,
      animate_controls      : true,
      control_fade_duration : 300,
      controls_fade_from    : 0.2,
      controls_fade_to      : 0.7,
      fade_duration         : 1200,
      // animation
      player                : true,   // show play button
      play_btn              : "play.png",
      stop_btn              : "stop.png",
      play_vpos             : -1,     // play/pause buttons voffset. -1 means controls_vpos - 5px
      hide_controls         : true,   // hide left/right buttons during animation
      show_duration         : 5000,   // make sure the value bigger then fade_duration
      autostart             : false,  // autostart player
      hide_playbtn_on_mout  : true,   // hide play / pause buttons on mouse out
      // thumbnails panel
      // disabled by default in current version and is not announced
      show_thumb            : false, 
      thumb_position        : "right",
      thumb_bg              : "filmv.gif",
      thumb_img_width       : 90,
      thumb_img_height      : 60,
      thumb_pnl_width       : 130,
      thumb_pnl_opacity     : 0.6,
      thumb_img_opacity     : 0.2,
      thumb_img_fade_from   : 0.4,
      thumb_img_fade_to     : 1
    };
    var options = $.extend(defaults, params);

    return this.each(
      function() { 

        // variables
        var obj             = $(this);
        var $kids           = obj.find("a");;
        var gallery_id      = "#" + obj.attr("id");
        // viewport
        var first_image_id  = get_uid(); 
        var second_image_id = get_uid();
        var go_back_img_id  = get_uid();
        var go_forw_img_id  = get_uid();
        var play_img_id     = get_uid();
        var stop_img_id     = get_uid();
        // thumbnails
        var $thumbs         = obj.find("div.collection img");
        var thumb_panel_uid = get_uid();
        var thumb_img_offset1, thumb_img_offset2;
        var thumb_panel_size;
        // variables //

        // remove exist pointers
        var clear_pointers = function() {
          
          $(gallery_id + " .view_pointer_0").removeClass("view_pointer_0");
          $(gallery_id + " .view_pointer_next").removeClass("view_pointer_next");
          $(gallery_id + " .view_pointer_prev").removeClass("view_pointer_prev");
        };


        // returns index of current element
        var get_index_0 = function() {
          
          for(var i=0;i<$kids.length;i++) {
            if( $($kids[i]).hasClass("view_pointer_0") ) 
              return i;
          }
          return -1;
        };


        // returns previous element
        var get_prev = function( ) {
          var idx = get_index_0();
          return $($kids[ (idx==0 ? $kids.length-1 : idx - 1) ]);
        };


        // returns next element
        var get_next = function( ) {
          var idx = get_index_0();
          return $($kids[ (idx==($kids.length-1) ? 0 : idx + 1) ]);
        };
        

        // removes exist pointers and sets new
        var set_marks = function(idx) {
          clear_pointers();   
          $($kids[ idx ]).addClass("view_pointer_0");
          $($kids[ idx==0 ? $kids.length - 1 : idx - 1 ]).addClass("view_pointer_prev");
          $($kids[ idx==($kids.length - 1) ? 0 : idx + 1 ]).addClass("view_pointer_next");
        };

        
        // preloads previouse and next elements
        var preload_neighbours = function() {
          add_cache($(gallery_id + " .view_pointer_next").attr("href"));
          add_cache($(gallery_id + " .view_pointer_prev").attr("href"));
        };


        // shows fade animation
        var animate_show = function(next_image) {
          var self = this;
          if( 'mutex' in self && self.mutex )
            return;
          self.mutex = true;
          
          var elem1 = $("#" + first_image_id).css('opacity')==0 ? 
            ("#" + first_image_id) : ("#" + second_image_id); 
          var elem2 = elem1=="#" + first_image_id ? 
            ("#" + second_image_id) : ("#" + first_image_id); 
          
          $(elem1).attr("src", $(next_image).attr("href"));
          $(elem2).animate(
            {opacity: 0}, options.fade_duration / 2, 
            function() { 
              $(elem1).animate(
                {opacity: 1}, options.fade_duration / 2, 
                function() { self.mutex = false; });
            });
        };


        // shows next image
        var show_next = function(direction) {
          animate_show(direction ? 
                       gallery_id + " .view_pointer_next" : 
                       gallery_id + " .view_pointer_prev");

          var N = $kids.length;
          var X = direction ? 1 : N - 1;
          set_marks( (get_index_0() + X) % $kids.length );
          
          // preload next & prev images
          preload_neighbours();
        };


        var animation_state = false;
        var toggle_animation = function() {
          animation_state = !animation_state;
          if( animation_state ) {
            $("#" + play_img_id).css("display", "none");
            $("#" + stop_img_id).css("display", "block");
            show_next(true);
            setTimeout(animation_tick, options.show_duration);
            show_buttons(false);
          }
          else {
            $("#" + play_img_id).css("display", "block");
            $("#" + stop_img_id).css("display", "none");
            show_buttons(true);
          }
        };

        
        var animation_tick = function() {
          if( animation_state ) {
            show_next(true);
            setTimeout(animation_tick, options.show_duration);
            show_buttons(false);
          }
          else {
            show_buttons(true);
          }
        };


        var show_buttons = function(state) {
          var display = state ? "block" : "none";
          $("#" + go_forw_img_id + ",#" + go_back_img_id).css("display", display);
        };


        // initialize
        var init = function() {
          $(gallery_id).css("height", obj.css("height"));

          // insert images for showing pictures and fade animation
          obj.prepend("<div class=\"viewport\"></div>");
          $(gallery_id + " div.viewport").css(
            { width    : obj.css("width"), 
              height   : obj.css("height"),
              position : "absolute",
              left     : 0,
              top      : 0 });
          $(gallery_id + " div.viewport").prepend(
            "<img id=\"" + first_image_id + "\" class=\"aniview\" />\n"
              + "<img id=\"" + second_image_id + "\" class=\"aniview\" />\n"
              + "<img id=\"" + go_forw_img_id + "\" src=\"" + options.forward_btn + "\" />\n"
              + "<img id=\"" + go_back_img_id + "\" src=\"" + options.backward_btn + "\" />\n"
              + "<img id=\"" + play_img_id + "\" src=\"" + options.play_btn + "\" />\n"
              + "<img id=\"" + stop_img_id + "\" src=\"" + options.stop_btn + "\" />\n"
          );

          // setup viewport images
          $("#" + first_image_id + ",#" + second_image_id).css(
            { position: "absolute",
              top:      0,
              left:     0
            });

          $("#" + second_image_id).css('opacity', 0);

          // set up controls
          $("#" + go_forw_img_id).css(
            { position:  "absolute",
              right:     0,
              top:       options.controls_vpos,
              "z-index": 2, 
              opacity:   options.controls_fade_from,
              cursor:    "pointer" });

          $("#" + go_back_img_id).css(
            { position:  "absolute",
              left:      0,
              top:       options.controls_vpos,
              "z-index": 2,
              opacity:   options.controls_fade_from,
              cursor:    "pointer" });


          // set default value
          if( options.play_vpos==-1 )
            options.play_vpos = options.controls_vpos - 5;


          $("#" + play_img_id + ",#" + stop_img_id).css(
            { position:  "absolute",
              display:   "none",
              left:      (obj.width() / 2 - 28), 
              top:       options.play_vpos,
              "z-index": 2,
              opacity:   options.controls_fade_from,
              cursor:    "pointer" });


          // show play button
          if( options.player ) {
            $("#" + play_img_id).css("display", "block");
          }
            

          // controls animation
          if( options.animate_controls ) {

            $("#"+ go_forw_img_id + ",#" + go_back_img_id + ",#" + 
              play_img_id + ",#" + stop_img_id).hover(
              function(e) { 
                $(this).animate(
                  {opacity: options.controls_fade_to}, 
                  options.controls_fade_duration, function() { }); },
              function(e) { 
                $(this).animate(
                  {opacity: options.controls_fade_from}, 
                  options.controls_fade_duration, function() { }); });              
          }

          // setup marks
          set_marks(0);

          // preload prev & next images
          preload_neighbours();

          // show first image
          $("#" + first_image_id).attr("src", $(gallery_id + " .view_pointer_0").attr("href"));

          // set up thumbnails
          if( options.show_thumb ) {
            
            thumb_img_offset1 = (options.thumb_pnl_width - options.thumb_img_width) / 2; // x
            thumb_img_offset2 = 12; // y

            // <div class="thumbs"></div>
            $(gallery_id).prepend("<div class=\"thumbs\"></div>");
            $(gallery_id + " div.thumbs").css("overflow", "hidden");

            switch( options.thumb_position ) {
              
            case 'right' :
              $(gallery_id + " .thumbs").css(
                { position: "absolute", 
                  left: obj.css("width") + 1, 
                  width: options.thumb_pnl_width, 
                  height: obj.css("height") });
              break;

            case 'left' :
              $(gallery_id + " .thumbs").css(
                { position: "absolute", 
                  left: 0, 
                  width: options.thumb_pnl_width, 
                  height: obj.css("height") });
              $(gallery_id + " div.viewport").css(
                { left: options.thumb_pnl_width + 1 });

              break;
            }

            // add thumbnails panel
            $(gallery_id + " .thumbs").append("<div id=\"" + thumb_panel_uid + "\" class=\"thumb_panel\"></div>\n");
            thumb_panel_size = $thumbs.length * (options.thumb_img_height + thumb_img_offset2) + thumb_img_offset2;
            $("#" + thumb_panel_uid).css(
              { "background-image": "url("+ options.thumb_bg  +")", 
                height: thumb_panel_size,
                opacity: options.thumb_pnl_opacity,
                border: options.thumb_border_style });

            var offset = thumb_img_offset2;
            $thumbs.each( 
              function() {
                $(this).attr("title", $(this).parent().attr("href"));
                $(this).css({ "left": thumb_img_offset1, "top" : offset, "opacity": options.thumb_img_opacity });
                $(this).hover(function() { $(this).css("opacity", options.thumb_img_fade_to); }, 
                              function() {$(this).css("opacity", options.thumb_img_fade_from);} );
                $("#" + thumb_panel_uid).append(this); 
                offset += (thumb_img_offset2 + options.thumb_img_height);
              });
          } // if show_thumb

        } (); // invoke init


        var tX  = -1, tY = -1;
        var move_thumbs = function(e) { 
          if( tX!=-1 && tY!=-1 ) {
            var width  = $(gallery_id + " .thumbs").width();
            var height = $(gallery_id + " .thumbs").height();
            var ll = (tY * 2 * 7) / height - 7;
            if( ll > 3 || ll < -3 )
              $("#" + thumb_panel_uid).css('top', function(i, v) { return parseFloat(v) - ll;  } );
            
            var pos = parseFloat($("#" + thumb_panel_uid).css('top'));
            if( pos > 0 )
              $("#" + thumb_panel_uid).css('top', 0);
            if( pos < -thumb_panel_size + height )
              $("#" + thumb_panel_uid).css('top', -thumb_panel_size + height);
          }
        };            


        // bind controls
        $("#" + go_forw_img_id).click( function() { show_next(true); } );
        $("#" + go_back_img_id).click( function() { show_next(false); } );


        // bind animation
        $("#" + play_img_id + ",#" + stop_img_id).click( 
          function() {   
            if( options.player )
              toggle_animation();
          });          

        if( options.player && options.autostart )  {
          animation_state = !animation_state;
          $("#" + play_img_id).css("display", "none");
          $("#" + stop_img_id).css("display", "block");
          setTimeout(animation_tick, options.show_duration);
          show_buttons(false);
        }

        // hide play / pause buttons on mouseOut
        if( options.hide_playbtn_on_mout ) {

          $("#" + play_img_id + ",#" + stop_img_id).css("top", "-1000px"); 

          $(gallery_id).mouseout(
            function() {
              $("#" + play_img_id + ",#" + stop_img_id).css("top", "-1000px"); 
            });
          $(gallery_id).mouseover(
            function() {
              $("#" + play_img_id + ",#" + stop_img_id).css("top", options.play_vpos); 
            });
        }
        
        var intervalID;
        $(gallery_id + " .thumbs").mousemove(
          function(e) {
            tX = e.pageX - $(gallery_id + " .thumbs").offset().left;
            tY = e.pageY - $(gallery_id + " .thumbs").offset().top;
          });


        $(gallery_id + " .thumbs").hover( 
          function(e) {  
            intervalID = setInterval(function() { move_thumbs(e);  } , 20);
          }, 
          function() { clearInterval(intervalID); tX = -1; tY = -1; }
        );


        // mouse click thumbnail
        $("#" + thumb_panel_uid + " img").click(
          function() {

            clear_pointers();
            $(gallery_id + " div.collection a[href=" + $(this).attr("title") + "]").addClass("view_pointer_0");
            set_marks(get_index_0());
            
            animate_show(gallery_id + " .view_pointer_0");

            // preload prev & next images
            preload_neighbours();
          });

      });
  };
}) (jQuery);