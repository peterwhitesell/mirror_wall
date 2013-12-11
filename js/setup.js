$(document).ready(function(){
	$.getJSON('js/form.json', function(data){
		$.getJSON('js/peter_small_config.json', function(small){
			configs.push(small);

			$.getJSON('js/peter_big_config.json', function(big){
				configs.push(big);


				build_form(data, 'config');

				add_default_buttons('defaults');

				$(window).resize(function(){
					setup();
				});
				$( "#config" ).submit(function( e ) {
					e.preventDefault();
					$('#mirror-tilt-knob').val($('#mirror-tilt').val())
						.trigger('change');
					setup();
				});
				$( "#defaults" ).submit(function( e ) {
					e.preventDefault();
				});
				setup();

				$('.add').click(function(){
					var input = $(this).parent().children('input');
					input.val(parseInt(input.val()) + 1);
					setup();
				});
				$('.sub').click(function(){
					var input = $(this).parent().children('input');
					input.val(parseInt(input.val()) - 1);
					setup();
				});
			});
		});
	});

	var Obstacle = function(top_left, width, height){
		this.width = width;
		this.height = height;
		this.top_left = top_left;
	};
	Obstacle.prototype.show = function(){
		top_right = this.top_left.add( new Vector(
			this.width,
			0
		) );
		bottom_right = this.top_left.add( new Vector(
			this.width,
			this.height
		) );
		bottom_left = this.top_left.add( new Vector(
			0,
			this.height
		) );

		draw_shape(
			this.top_left,
			top_right,
			bottom_right,
			bottom_left,
			'black'
		);
	};

	var Mirror = function(top_left){
		this.generate_info();
		this.update(top_left);
		this.visible = true;
	};
	var convert_coordinates = function(point, origin_corner){
		var w = get('wall-width');
		var h = get('wall-height');
		var result;
		switch(origin_corner){
			case 'top_left':
				result =  new Vector(point.x, point.y);
				break;
			case 'top_right':
				result =  new Vector(w - point.x, point.y);
				break;
			case 'bottom_right':
				result = new Vector(w - point.x, h - point.y);
				break;
			case 'bottom_left':
				result =  new Vector(point.x, h - point.y);
				break;
		}
		return new Vector(
			round_10(result.x),
			round_10(result.y)
		);
	};
	var label_from_coordinates = function(point){
		return '(' + point.x + ',' + point.y + ')';
	};
	var label_point_by_corner = function(point){
		var the_corner = get('wall-origin-corner');
		return label_from_coordinates(convert_coordinates(point, the_corner));
	};
	Mirror.prototype.update = function(top_left){
		if( this.visible ){
			this.hide();
		}
		this.top_left = top_left;
		this.top_right = new Vector(get('mirror-width'), 0).rotate(get('mirror-tilt')).add(top_left);
		this.bottom_right = new Vector(0, get('mirror-height')).rotate(get('mirror-tilt')).add(this.top_right);
		this.bottom_left = new Vector(0, get('mirror-height')).rotate(get('mirror-tilt')).add(top_left);

		if( this.visible ){
			this.show();
		}
		this.info.top_left.css({
			left: this.top_left.x * resolution + 'px',
			top: this.top_left.y * resolution + 'px'
		}).html(label_point_by_corner(this.top_left));
		this.info.top_right.css({
			left: this.top_right.x * resolution + 'px',
			top: this.top_right.y * resolution + 'px'
		}).html(label_point_by_corner(this.top_right));
		this.info.bottom_right.css({
			left: this.bottom_right.x * resolution + 'px',
			top: this.bottom_right.y * resolution + 'px'
		}).html(label_point_by_corner(this.bottom_right));
		this.info.bottom_left.css({
			left: this.bottom_left.x * resolution + 'px',
			top: this.bottom_left.y * resolution + 'px'
		}).html(label_point_by_corner(this.bottom_left));
	};
	Mirror.prototype.show = function(){
		draw_shape(
			this.top_left,
			this.top_right,
			this.bottom_right,
			this.bottom_left
		);
		if( info_visible ){
			this.show_info();
		}
	};
	Mirror.prototype.hide = function(){
		erase_shape(
			this.top_left,
			this.top_right,
			this.bottom_right,
			this.bottom_left
		);
		this.hide_info();
	};
	Mirror.prototype.generate_info = function(){
		var wall_holder = $('#wall-holder');
		this.info = {
			top_left: $('<div class="info"></div>').appendTo(wall_holder),
			top_right: $('<div class="info"></div>').appendTo(wall_holder),
			bottom_right: $('<div class="info"></div>').appendTo(wall_holder),
			bottom_left: $('<div class="info"></div>').appendTo(wall_holder)
		};
	};
	Mirror.prototype.show_info = function(){
		var that = this;
		['top_left', 'top_right', 'bottom_right', 'bottom_left'].forEach(function(i){
			that.info[i].show();

			draw_point(that[i]);
		});

	};
	Mirror.prototype.hide_info = function(){
		var that = this;
		['top_left', 'top_right', 'bottom_right', 'bottom_left'].forEach(function(i){
			that.info[i].hide();
		});
	};

// TODO: Design handles and implement handle controls
// TODO: Provide methods to *show_handles* *hide_handles*

	var resolution;
	var wall =  $('#wall');
	var mirrors = [];
	var obstacles = [];
	var configs = [];
	var context = wall[0].getContext('2d');
	var info_visible = false;
	var origin = 'top_left';

	var get = function(property_name){
		if( property_name == 'wall-origin-corner' ){
			return $('input[name="wall-origin-corner"]:checked').val();
		}
		return parseFloat($('#' + property_name).val());
	};
	var get_resolution = function(){
		var resolution_from_x = get_available_width() / get('wall-width');
		var resolution_from_y = get_available_height() / get('wall-height');

		return Math.min(resolution_from_x, resolution_from_y);
	};
	var get_available_height = function(){
		return window.innerHeight - 60;
	};
	var get_available_width = function(){
		return $('#wall-holder').width();
	};
	var get_mirror_start_point = function(){
		var offset_top;
		var dummy;
		if( get('mirror-tilt') < 0 ){
			dummy = new Vector( -get('mirror-width'), 0).rotate(get('mirror-tilt')).add(new Vector(0, get('mirror-top')));
			return new Vector(
				get('mirror-left'),
				dummy.y
			);
		} else {
			dummy = new Vector( 0, -get('mirror-height')).rotate(get('mirror-tilt')).add(new Vector(get('mirror-left'), 0));
			return new Vector(
				dummy.x,
				get('mirror-top')
			);
		}
	};
	var get_period = function(){
		return (get('mirror-width') + get('mirror-spacing')) / Math.cos(deg_to_rad(get('mirror-tilt')));
	};
	var draw_shape = function(p1, p2, p3, p4, color){
		color = default_(color,
			'rgba(255, 255, 255, 0.5)');

		context.fillStyle   = color;

		context.beginPath();

		context.moveTo(p1.x * resolution, p1.y * resolution);
		context.lineTo(p2.x * resolution, p2.y * resolution);
		context.lineTo(p3.x * resolution, p3.y * resolution);
		context.lineTo(p4.x * resolution, p4.y * resolution);
		context.lineTo(p1.x * resolution, p1.y * resolution);

		context.fill();
		context.closePath();
	};
	var draw_point = function(point){
		context.fillStyle   = 'red';
		context.strokeStyle	= 'black';

		context.beginPath();
		context.arc(point.x * resolution, point.y * resolution, 2, 0, 2 * Math.PI, false);
		context.stroke();
		context.fill();
		context.closePath();
	};
	var erase_shape = function(p1, p2, p3, p4){
		context.clearRect(
			p1.multiply(resolution),
			p2.multiply(resolution),
			p3.multiply(resolution),
			p4.multiply(resolution)
		);
	};
	var update_mirrors = function(){
		var mirror_count_diff = get('mirror-count') - mirrors.length;
		if( mirror_count_diff > 0 ){
			for( var i = 0; i < mirror_count_diff; i++ ){
				mirrors.push(
					new Mirror(new Vector(0, 0))
				);
			}
		}else if( mirror_count_diff < 0 ){
			for( var i = 0; i > mirror_count_diff; i-- ){
				var old = mirrors.pop();
				old.hide();
				Object.keys(old.info).forEach(function(i){
					old.info[i].remove();
				});
			}
		}

		var start = get_mirror_start_point();
		var period = get_period();

		for(var i = 0; i < get('mirror-count'); i++){
			mirrors[i].update(start.add(new Vector(
				i*period,
				0
			)));
		}
	};
	var update_obstacles = function(){
		for(var i = 0; i < obstacles.length; i++){
			obstacles[i].show();
		}
	};
	var add_obstacle = function(top_left, width, height){
		obstacles.push(
			new Obstacle(top_left, width, height)
		);
	};

	var draw_axes = function(){
		// TODO: easy peasy
	};

	var set_silhouette_height = function(){
		var silhouette_height = get('silhouette-height') * resolution;
		var silhouette_width = 16 * resolution;
		$('#wall').css('background-size', silhouette_width + 'px ' + silhouette_height + 'px');
	};

	var setup = function(){
		resolution = get_resolution();

		set_silhouette_height();

		wall.attr('width', resolution * get('wall-width'));
		wall.attr('height', resolution * get('wall-height'));

		update_mirrors();
		update_obstacles();
		draw_axes();
	};

	var add_default_buttons = function(id){
		var container = $('#' + id);

		var i = 0;
		configs.forEach(function(config){
			var j = i;
			container.append('<button id="default_' + j + '" class="btn btn-default">' + config.name + '</button> ');
			$('#default_' + j).click(function(e){
				load_config(config);
			});
			i++;
		});
	};

	var build_form = function(json, container){
		var form = $('#' + container);
		form.attr('role', 'form');
		form.addClass('form-horizontal');

		json.sections.forEach(function(section){
			render_section(section, form);
		});

		json.buttons.forEach(function(button){
			render_button(button, form);
		});
	};

	var render_section = function(section, form){
		form.append(
			'<h4>' + section.name + '</h4>'
		);
		section.fields.forEach(function(field){
			render_field(field, form);
		});
	};

	var render_field = function(field, form){
		form.append(
			'<div class="form-group">' +
				'<label for="' + field.field_name + '" class="control-label col-sm-5">' +
					field.display_name +
				'</label>' +
				'<div class="col-sm-7 input-group">' +
					'<input id="' + field.field_name + '" name="' + field.field_name + '" class="form-control input-sm" value="' + field.default + '">' + (field.units != "" ? '<span class="input-group-addon">' + field.units + '</span>' : '') + '<span class="input-group-addon btn btn-default sub">-</span><span class="input-group-addon btn btn-default add">+</span>' +
				'</div>' +
			'</div>'
		);
		add_ui(field);
	};
	var render_option = function(container, field_name, value, display_name, default_value){
		var checked = default_value == value ? ' checked' : '';
		container.append(
			'<div class="radio">' +
				'<label>' +
					'<input type="radio" name="' + field_name + '" id="' + value + '" value="' + value + '"' + checked + '>' +
					display_name +
				'</label>' +
			'</div>'
		);
		$('#' + value).change(function(){
			setup();
		});
	};

	var add_ui = function(field){
		switch(field.ui.type){
			case 'knob':
				var label = $( "label[for='" + field.field_name + "']" );
				label.append(' <input id="' + field.field_name + '-knob" value="' + field.default + '">');
				$('#' + field.field_name + '-knob').knob({
					'min': parseInt(field.ui.min),
					'max': parseInt(field.ui.max),
					'displayInput': false,
					'width': 50,
					'height': 25,
					'thickness':.8,
					'angleArc': 180,
					'angleOffset': -90,
					'change': function(v){
						$('#' + field.field_name).val(v);
						setup();
					}
				});
				break;
			case 'radio':
				var input = $('#' + field.field_name);
				var ctr = input.parent();
				ctr.children().each( function(){
					$(this).remove();
				});
				Object.keys(field.ui.options).forEach(function(key){
					render_option(ctr, field.field_name, key, field.ui.options[key], field.default)
				});

				break;
			default:
				break;
		}
	};

	var render_button = function(button, form){
		form.append(
			'<div class="form-group">' +
				'<button id="' + button.id + '" class="btn btn-default">' + button.name + '</button>' +
			'</div>'
		);
		$('#' + button.id).click(function(e){
			actions[button.action](e);
		});
	};
	var actions = {
		'toggle_coordinates': function(e){
				info_visible = !info_visible;
				setup();
		}
	};

	var load_config = function(json){
		json.defaults.forEach(function(d){
			$('#' + d.field_name).val(d.field_value);
			var maybe_radio = $('#' + d.field_value);
			if( maybe_radio.size() == 1 ){
				maybe_radio.prop('checked', true);
			}
		});
		obstacles = [];
		json.obstacles.forEach(function(o){
			add_obstacle(
				new Vector(
					parseInt(o.left),
					parseInt(o.top)
				),
				parseInt(o.width),
				parseInt(o.height)
			);
		});
		setup();
	};

});

var Vector = function(x, y){
	this.x = x;
	this.y = y;
};
Vector.prototype.print = function(){
	console.log('(' + this.x + ', ' + this.y + ')');
};
Vector.prototype.len = function(){
	return Math.sqrt( this.x*this.x + this.y*this.y);
};
Vector.prototype.normalize = function(){
	var len = this.len();
	return new Vector(
		this.x / len,
		this.y / len
	);
};
Vector.prototype.add = function(o){
	return new Vector(
		this.x + o.x,
		this.y + o.y
	);
};
Vector.prototype.subtract = function(o){
	return new Vector(
		this.x - o.x,
		this.y - o.y
	);
};
Vector.prototype.multiply = function(c){
	return new Vector(
		this.x * c,
		this.y * c
	);
};
Vector.prototype.rotate = function(deg){
	var rad = deg * Math.PI / 180;
	return this.rotate_rad(rad);
};
Vector.prototype.rotate_rad = function(rad){
	return new Vector(
		this.x * Math.cos(rad) - this.y * Math.sin(rad),
		this.x * Math.sin(rad) + this.y * Math.cos(rad)
	);
};

var deg_to_rad = function(deg){
	return deg * Math.PI / 180;
};

var round_10 = function(float){
	return Math.round(float*10) / 10
};

var default_ = function (arg, val){
	return typeof arg !== 'undefined' ? arg : val;
};

