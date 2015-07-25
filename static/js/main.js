$(function(){
	var audio = new Audio();
	var currentItem = null;
	var isPlaying = false;
	var dragging = false;
	var crossfadeTimer = null;
	
	var updateUI = function(name){
		$('.playback-ui').fadeIn(500);
		$('#control h1').animate({ 'margin-top': 30, 'font-size': 28 }, 500);
		$('#control h1').text(name);
	};

	var resetUI = function(){
		$('.playback-ui').fadeOut(500);
		$('#control h1').animate({ 'margin-top': 50, 'font-size': 36 }, 500);
	};

	var formatTime = function(t){
		var h = t >= 3600 ? Math.floor(t / 3600 % 24) : 0;
		var m = Math.floor(t / 60 % 60);
		var s = Math.floor(t % 60);

		return (h > 0 ? ((h < 10 ? '0' + h : h) + ':') : '') + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
	};

	var playback = function(el){
		if(!$(el).attr('href')) return;
		if($(el).attr('data-needs-convert') && window.localStorage.convertMedia == 'false') return;

		audio.src = $(el).attr('href');
		audio.load();
		audio.play();

		if(currentItem) $(currentItem).parent().removeClass('active');
		$(el).parent().addClass('active');
		
		currentItem = el;
		isPlaying = true;
		updateUI($(el).text());
	};

	var seek = function(e){
		var left = $('.playback-ui .progress').offset().left;
		var width = $('.playback-ui .progress').outerWidth();
		
		if(/^touch(start|move|end)/i.test(e.type)){
			var x = e.originalEvent.touches[0].pageX;
		}
		else {
			var x = e.pageX;
		}
		
		var pos = (x - left) / width;

		audio.currentTime = audio.duration * pos;
		$('.playback-ui .progress-bar').css('width', pos * 100 + '%');

		if(crossfadeTimer){
			clearTimeout(crossfadeTimer);
			crossfadeTimer = setTimeout(function(){
				$(audio).animate({ volume: 0 }, 2000);
			}, (audio.duration * (1 - pos) - 2) * 1000);
		}
	};

	var prepareLocalStorage = function(){
		if(!window.localStorage.settingsEnabled){
			window.localStorage.settingsEnabled = true;

			// Load default settings
			window.localStorage.convertMedia = false;
			window.localStorage.crossfade = true;
		}

		for(var i in window.localStorage){
			if(window.localStorage[i] == 'true') $('input[name=' + i + ']').attr('checked', '')
		}
	};

	$.material.init();
	prepareLocalStorage();

	$.ajax({
		url: '/getList',
		dataType: 'json',
		success: function(data){
			if(data.length == 0){
				$('#playlist ul').append('<li class="disabled"><a href="#">There are no music to play.</a></li>');
			}

			data.forEach(function(item, i){
				var el = $('<li><a></a></li>');
				el.find('a').attr({
					href: item.path + (item.convert ? '?convert=1' : ''),
					id: 'pls-item-' + i
				}).text(item.name);

				if(item.convert){
					el.find('a').attr('data-needs-convert', item.convert);
					if(window.localStorage.convertMedia == 'false') el.addClass('disabled');
				}

				el.appendTo('#playlist ul');
			});
		}
	});

	$(document).on('click', '#playlist ul li a', function(e){
		e.preventDefault();
		playback(e.target);
	});

	$('input[name]').on('change', function(){
		window.localStorage[$(this).attr('name')] = $(this).is(':checked');
	});

	$('.playback-ui .progress').on('mousedown touchstart', function(e){
		dragging = true;
	});

	$('.playback-ui .progress').on('mousemove touchmove', function(e){
		if(dragging) seek(e);
	});

	$('.playback-ui .progress').on('mouseup touchend', function(e){
		dragging = false;
	});

	$('.playback-ui .progress').click(seek);

	$('#control-playpause').click(function(e){
		e.preventDefault();

		if(isPlaying){
			isPlaying = false;

			audio.pause();
			$(this).removeClass('mdi-av-pause').addClass('mdi-av-play-arrow');

			if(crossfadeTimer) clearTimeout(crossfadeTimer);
		}
		else {
			isPlaying = true;

			audio.play();
			$(this).addClass('mdi-av-pause').removeClass('mdi-av-play-arrow');

			if(crossfadeTimer){
				// Re-schedule crossfade
				crossfadeTimer = setTimeout(function(){
					$(audio).animate({ volume: 0 }, 2000);
				}, (audio.duration - audio.currentTime - 2) * 1000);
			}
		}
	});

	$('#control-stop').click(function(e){
		e.preventDefault();

		isPlaying = false;
		$('#control-playpause').removeClass('mdi-av-pause').addClass('mdi-av-play-arrow');
		$('.playback-ui .progress-bar').css('width', 0);

		audio.pause();
		audio.currentTime = 0;

		if(crossfadeTimer) clearTimeout(crossfadeTimer);
	});

	$('#control-prev').click(function(e){
		e.preventDefault();

		$(currentItem).parent().removeClass('active');
		var prevEl = $(currentItem).parent().prev().find('a');

		if(prevEl){
			playback(prevEl);
		}
		else {
			resetUI();
		}
	});

	$('#control-next').click(function(e){
		e.preventDefault();

		$(currentItem).parent().removeClass('active');
		var nextEl = $(currentItem).parent().next().find('a');

		if(nextEl){
			playback(nextEl);
		}
		else {
			resetUI();
		}
	});

	$(audio).on('timeupdate', function(e){
		$('.playback-ui .progress-bar').css('width', (audio.currentTime / audio.duration) * 100 + '%');
		$('.playback-ui .label').text(formatTime(audio.currentTime) + '/' + formatTime(audio.duration))
	});

	$(audio).on('loadedmetadata', function(){
		if(window.localStorage.crossfade == 'true'){
			audio.volume = 0;
			$(audio).animate({ volume: 1 }, 2000);

			crossfadeTimer = setTimeout(function(){
				$(audio).animate({ volume: 0 }, 2000);
			}, (audio.duration - 2) * 1000);
		}
	});

	$(audio).on('ended', function(e){
		$(currentItem).parent().removeClass('active');
		var nextEl = $(currentItem).parent().next().find('a');

		if(nextEl){
			playback(nextEl);
		}
		else {
			resetUI();
		}

		if(crossfadeTimer) clearTimeout(crossfadeTimer);
	});
});