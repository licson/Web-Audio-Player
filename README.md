Licson's Web Audio Player
==========================

This is a simple web audio player for musical enjoyment.

Usage
==========================

	git clone https://github.com/licson0729/Web-Audio-Player.git
	cd Web-Audio-Player/
	npm install

	# Put your music files inside the /data directory
	cp /path/to/your/music.mp3 ./data

	# Start the Server
	node index.js

Features
==========================

1. Easy to install and use
2. Lightweight (quite)
3. Features Google's Material Design
4. Upload music through HTTP
5. Automatic conversion to MP3 for web playback. No need to worry about file types!

HTTP Upload
==========================

In order to use the HTTP upload feature, you need to open up `index.js` and go to line 12. Change `file` into something only you would know. Then you can use `curl` to upload music files remotely. (Assume you have it installed on your computer).

	curl -F '<your secret string>=@/path/to/your/music.mp3' \
	-F '<your secret string>=@/path/to/your/anothermusic.mp3' \
	'http://yourserver.com/upload'

If successfully uploaded, it outputs `Done.` to notify you.

Reminders
==========================

If you want to use the automatic conversion feature, you need to have FFMpeg installed on your server. Then, enable "Convert media files" in the player settings.

License
==========================

MIT