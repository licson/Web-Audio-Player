var express = require('express');
var range = require('express-range');
var fs = require('fs');
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var app = express();
var sha1 = function(data){ return crypto.createHash('sha1').update(data).digest('hex'); };

// Variables

var supportedFormats = ['mp3', 'ogg', 'wav', 'flac', 'mp2', 'wma'];
var tempDir = require('os').tmpdir();

// The middlewares

app.use(express.static('static'));
app.use(range({ accept: 'bytes' }));

// Our main code

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/getList', function(req, res){
	fs.readdir(__dirname + '/data/', function(e, result){
		if(e){
			res.status(500).send('Something went wrong.');
			return;
		}

		var output = [];
		result.forEach(function(item, i){
			var ext = item.split('.').pop().toLowerCase();
			var name = item.replace('.' + ext, '');
			var needConversion = ext != 'mp3' ? true : false;

			if(supportedFormats.indexOf(ext) > -1){
				if(ext !== item){
					output.push({
						name: name,
						path: '/data/' + encodeURIComponent(item),
						convert: needConversion
					});
				}
			}
		});

		output.sort(function(a, b){
			var x = a.name.toLowerCase();
			var y = b.name.toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		});

		res.json(output);
	});
});

app.get('/data/:name', function(req, res){
	req.params.name = req.params.name.replace('../', '');

	var sendFileWithRanges = function(name){
		var size = fs.statSync(name);
		if(!size){
			res.status(404).send('Not found');
			return;
		}

		size = size.size;

		res.range({
			first: req.range.first,
			last: req.range.last ? req.range.last : size - 1,
			length: size
		});

		res.type('mp3');

		fs
			.createReadStream(name, {
				start: req.range.first,
				end: req.range.last
			})
			.pipe(res);
	}

	if(req.query.convert && req.query.convert == 1){
		var newLoc = tempDir + '/' + sha1(req.params.name) + '.mp3';

		if(fs.existsSync(newLoc)){
			sendFileWithRanges(newLoc);
		}
		else {
			var ffmpeg = spawn('ffmpeg', [
				'-i', __dirname + '/data/' + req.params.name,
				'-ar', 44100,
				'-ab', '192k',
				newLoc
			]);

			ffmpeg.on('exit', function(code){
				if(code !== 0){
					res.status(500).send('Error processing file.');
				}
				else {
					sendFileWithRanges(newLoc);
				}
			});
		}
	}
	else {
		sendFileWithRanges(__dirname + '/data/' + req.params.name);
	}
});

app.listen(3001, function(){
	console.log('Server listening on port 3000.');
});