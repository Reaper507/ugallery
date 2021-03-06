// Copyright (c) 2011 Alexander Sidorov
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 
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

      // images' animation:
      fade_duration         : 1200,   // image fade duration (ms)
      
      // forward/backward controls:
      forward_btn           : "right.gif", // path to images
      backward_btn          : "left.gif",
      controls_vpos         : 150,    // offset from top (px)
      animate_controls      : true,   // fade controls on mouse hover
      control_fade_duration : 300,    // controls fade duration (ms)
      controls_fade_from    : 0.2,    // initial opacity
      controls_fade_to      : 0.7,    // highlight opacity

      // autoplay:
      player                : true,   // enable autoplay, show play button
      play_btn              : "play.png",  // path to images
      stop_btn              : "stop.png",
      play_vpos             : -1,     // play button voffset (px)
                                      // -1 means controls_vpos - 5px,
                                      // modify this value if you use buttons
                                      // with non standard heights
                                      // (difference betweeen forward/backward
                                      // buttons and play/pause is not 10px)
      hide_controls         : true,   // hide forward/backward buttons during autoplay
      show_duration         : 5000,   // delay before showing a next image
      autostart             : false,  // autostart player
      hide_playbtn_on_mout  : true,   // hide play/pause buttons on mouse out

      // descriptions:
      desc_pos              : "top",  // description's DIV position 
                                      // [top | bottom | top-inside | bottom-inside ]
      desc_bg_color         : "#000", // bg color for [top-inside | bottom-inside]
      desc_bg_opacity       : 0.6,    // bg opacity for [top-inside | bottom-inside]
      desc_align            : "right",// text-align [left | center | right]
      desc_height           : 20,     // description's DIV height (px)
      desc_custom_class     : null,   // user defined CSS class for description's DIV 
      desc_custom_callback  : null,   // user defined function fired after showing
                                      // each description, use it if you need to do
                                      // something on each showing, e.g. if you use
                                      // cufón, like here on site. The function
                                      // received an index of the showed image
                                      // as a parameter

      // counter
      counter_enabled       : false,  // show counter
      counter_pos           : "top",  // counter's DIV position
                                      // [top | bottom | top-inside | bottom-inside ]
      counter_align         : "left", // text-align [left | center | right]
      counter_custom_class  : null,   // user defined CSS class for counter's DIV
      counter_custom_callback : null, // user defined function fired after showing
                                      // each image
      counter_height        : -1,     // counter's DIV height, -1 means the same
                                      // height as a value of desc_height 


      // thumbnails panel * disabled by default in current version and is not announced *
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
        var obj              = $(this);
        var $kids            = obj.find("a");;
        var gallery_id       = "#" + obj.attr("id");
        // viewport
        var first_image_id   = get_uid(); 
        var second_image_id  = get_uid();
        var go_back_img_id   = get_uid();
        var go_forw_img_id   = get_uid();
        var play_img_id      = get_uid();
        var stop_img_id      = get_uid();
        var desc_div_id      = get_uid();
        var desc_inner_id    = get_uid();
        var desc_black_id    = get_uid();
        var counter_div_id   = get_uid();
        var counter_inner_id = get_uid();
        // thumbnails
        var $thumbs          = obj.find("div.collection img");
        var thumb_panel_uid  = get_uid();
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
          
          // show description
          show_description();

          // show counter
          if( options.counter_enabled )
            show_counter();

          // preload next & prev images
          preload_neighbours();
        };


        // show description, invoke user-defined callback
        var show_description = function() {
          var text = $(gallery_id + " .view_pointer_0").attr("title");
          $("#" + desc_inner_id).text(text);
          if( options.desc_custom_callback ) {
            options.desc_custom_callback(get_index_0());
          }
        };


        // show counter
        var show_counter = function() {
          var idx = get_index_0() + 1;
          var cnt = $kids.length;
          $("#" + counter_inner_id).text(idx + "/" + cnt);
          if( options.counter_custom_callback ) {
            options.counter_custom_callback(idx - 1);
          }
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
            { width    :  obj.css("width"), 
              height   :  obj.css("height"),
              position :  "absolute",
              left     :  0,
              top      :  0 });
          $(gallery_id + " div.viewport").prepend(
            "<img id=\"" + first_image_id + "\" class=\"aniview\" />\n"
              + "<img id=\"" + second_image_id + "\" class=\"aniview\" />\n"
              + "<img id=\"" + go_forw_img_id + "\" src=\"" + options.forward_btn + "\" />\n"
              + "<img id=\"" + go_back_img_id + "\" src=\"" + options.backward_btn + "\" />\n"
              + "<img id=\"" + play_img_id + "\" src=\"" + options.play_btn + "\" />\n"
              + "<img id=\"" + stop_img_id + "\" src=\"" + options.stop_btn + "\" />\n"
              // description DIV
              + "<div id=\"" + desc_div_id + "\" class=\"ug_desc_outer\">"
              + "<div id=\"" + desc_inner_id + "\" class=\"ug_desc_inner" + 
              (options.desc_custom_class ? (" " + options.desc_custom_class) : "")
              + "\"></div></div>\n"
              + "<div id=\"" + desc_black_id + "\" class=\"ug_desc_black\"></div>\n"
              // counter DIV
              + "<div id=\"" + counter_div_id + "\" class=\"ug_counter_outer\">"  
              + "<div id=\"" + counter_inner_id + "\" class=\"ug_counter_inner" + 
              (options.counter_custom_class ? (" " + options.counter_custom_class) : "")
              + "\"></div></div>\n"
          );

          // setup viewport images
          $("#" + first_image_id + ",#" + second_image_id).css({ 
            position  :  "absolute",
            top       :  0,
            left      :  0
          });

          $("#" + second_image_id).css('opacity', 0);

          // set up controls
          $("#" + go_forw_img_id).css({ 
            position   :  "absolute",
            right      :  0,
            top        :  options.controls_vpos,
            "z-index"  :  2, 
            opacity    :  options.controls_fade_from,
            cursor     :  "pointer" });

          $("#" + go_back_img_id).css({ 
            position   :  "absolute",
            left       :  0,
            top        :  options.controls_vpos,
            "z-index"  :  2,
            opacity    :  options.controls_fade_from,
            cursor     :  "pointer" });


          // set default values up
          if( options.play_vpos==-1 )
            options.play_vpos = options.controls_vpos - 5;
          if( options.counter_height==-1 )
            options.counter_height = options.desc_height;


          // play/pause buttons
          $("#" + play_img_id + ",#" + stop_img_id).css({
            position   :  "absolute",
            display    :  "none",
            left       :  (obj.width() / 2 - 28), 
            top        :  options.play_vpos,
            "z-index"  :  2,
            opacity    :  options.controls_fade_from,
            cursor     :  "pointer" });


          // descriptions area
          $("#" + desc_black_id).css({ 
            position           :  "absolute",
            width              :  obj.width(),
            height             :  options.desc_height,
            "z-index"          :  4,
            "background-color" :  options.desc_bg_color,
            opacity            :  options.desc_bg_opacity });
          $("#" + desc_div_id).css({ 
            position           :  "absolute",
            width              :  obj.width(),
            height             :  options.desc_height,
            "z-index"          :  5,
            "text-align"       :  options.desc_align });
          $("#" + desc_inner_id).css({ 
            "margin"           :  3 });

          switch( options.desc_pos ) {
          case "top" :
            $("#" + desc_div_id).css({
              left          :  0,
              top           :  -options.desc_height - 2
            });
            $("#" + desc_black_id).css("display", "none");
            break;
          case "top-inside" :
            $("#" + desc_div_id + ",#" + desc_black_id).css({
              left               :  0,
              top                :  0
            });
            break;
          case "bottom" :
            $("#" + desc_div_id).css({
              left          :  0,
              bottom        :  -options.desc_height - 2
            });
            $("#" + desc_black_id).css("display", "none");
            break;
          case "bottom-inside" :
            $("#" + desc_div_id + ",#" + desc_black_id).css({
              left               :  0,
              bottom             :  0
            });
            break;
          }


          // counter area
          if( options.counter_enabled ) {
            $("#" + counter_div_id).css({ 
              position     :  "absolute",
              width        :  obj.width(),
              height       :  options.counter_height,
              "z-index"    :  5,
              "text-align" :  options.counter_align });
            $("#" + counter_inner_id).css({ 
              "margin"           :  3 });
          }
          switch( options.counter_pos ) {
          case "top":
            $("#" + counter_div_id).css({
              left          :  0,
              top           :  -options.counter_height - 2
            });
            break;
          case "top-inside" :
            $("#" + counter_div_id).css({
              left               :  0,
              top                :  0
            });
            break;
          case "bottom":
            $("#" + counter_div_id).css({
              left          :  0,
              bottom        :  -options.counter_height - 2
            });
            break;
          case "bottom-inside" :
            $("#" + counter_div_id).css({
              left               :  0,
              bottom             :  0
            });
            break;
          }


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

          // show description
          show_description();

          if( options.counter_enabled )
            show_counter();

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