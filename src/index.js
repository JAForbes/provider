const Keys = {
	DOWN: []
	,ARROW_RIGHT: 39
	,ARROW_DOWN: 40
	,ARROW_UP: 38
	,ARROW_LEFT: 37
	,SPACE: 32
	,F: 70
}

let mute = false

const Util = {
	distance(p1, p2){
		const xs = 
			[p2.x - p1.x].map( x => x * x )

		const ys = 
			[p2.y - p1.y].map( x => x * x )
			
		return Math.sqrt( xs[0] + ys[0] )
	}

	,random(multiplier=1){
		return Math.random() * Util.even() * multiplier
	}
	,randomInt(multiplier=1){
		return Math.floor(Util.random(multiplier))
	}
	,even(){
		return Math.random() > 0.5 ? 1 : -1
	}

}

const snd = {
	play(audio){
		if( !mute ){
			audio.play()
		}
	}
	,pause(audio){
		audio.pause()
	}
}

// eslint-disable-next-line no-undef
window.onkeyup = e => {
	if( e.keyCode == 77 /* M */){
		mute = !mute

		// eslint-disable-next-line no-undef
		Array.from(document.querySelectorAll('audio'))
			.forEach(function(audio){
				if( mute ){
					audio.pause()
				} else {
					audio.play()
				}
			})
	}
	delete Keys.DOWN[e.keyCode]
}

// eslint-disable-next-line no-undef
window.onkeydown = e => {
	Keys.DOWN[e.keyCode] = true

	if( e.keyCode > 31 && e.keyCode < 41 ){
		e.preventDefault()
	}
}
// eslint-disable-next-line no-undef
const can = document.getElementById('c')
const con = can.getContext('2d')

function Verb(name, positions){
	return {
		images: {}
		,name
		,positions
	}
}

function Frame(
	count=0
	, width=0
	, index=0
	, image
	, playspeed=1/4
	, repeat=true
){
	playspeed = playspeed * 0.5
	function onload(){
		count = image.width / image.height
		// the height of the strip is the width of a frame
		width = image.height
		index = 0
	}

	function reset(newImage){
		image = newImage
		image.onload = onload
		// todo-james why is this happening here?
		count = image.width / image.height
		width = image.height
		index = 0
	}

	function draw(){
		const sx = 
			Math.floor(index)*width
		const sy = 0
		const sWidth = width
		const sHeight = width
		const dx = -width / 2
		const dy = -width / 2
		const dWidth = width
		const dHeight = width
		
		con.drawImage(
			image
			, sx
			, sy
			, sWidth
			, sHeight
			, dx
			, dy
			, dWidth
			, dHeight
		
		)
	}

	function next(){
		draw()
		index = index + playspeed
		if( Math.floor(index)+1 > count ){
			if( repeat ){
				index = 0
			} else {
				index = count - 1
			}
		}
	}

	return {
		reset
		,next
		,draw
		,onload
		,set repeat(x){
			return repeat = x
		}
		,get repeat(){
			return repeat
		}
		,set playspeed(x){
			return playspeed = x 
		}
		,get playspeed(){
			return playspeed
		}
	}
}

function Character(
	name
	,verbs
	,x=0
	,y=0
){
	let image
	let position
	let idles = {}
	
	initSprites()
	const frame = Frame()
	let action = 'idle'
	let speed = 4
	let alive = true
	let respawnId

	function initSprites(){
		let positions = []
		for( let verb of verbs ){
			for( let position of verb.positions ){
				// eslint-disable-next-line no-undef
				verb.images[position] = new Image()
				verb.images[position].src = 
					'resources/img/original/characters/'
						+ name
						+ '/'+position
						+ '_'+verb.name+'.png'

				if( positions.indexOf(position) == -1 ){
					positions.push( position )
				}
			}
		}

		for( let position of positions ){
			idles[position] = {}
			idles[position].image = 
			// eslint-disable-next-line no-undef
				new Image()
			idles[position].image.src = 
				'resources/img/original/characters/'
					+ name
					+ '/'+position
					+ '_idle.png'
		}

		position = positions[0]
	}

	function die(respawn){
		if( alive ){
			alive = false 
			respawnId = 
				// eslint-disable-next-line no-undef
				setInterval(
					respawn
					, 2000
				)
		}
	}

	function update(){
		for( let verb of verbs ){
			if( action == verb.name && verb.positions.indexOf(position) > -1 ){
				if( !(image == verb.images[position]) ){
					image = verb.images[position]
					frame.reset(image)
				}
				break
			}
		}

		if( action != 'idle' ){
			frame.next()
		} else {
			if( image != idles[position].image ){
				image = idles[position].image
				frame.reset(image)
			}
			frame.next()
		}
	}

	return {
		update
		,die
		,frame
		,get x(){ return x }
		,set x(a){
			return x = a
		}
		,get alive(){ return alive }
		,set alive(a){
			return alive = a
		}
		,get y(){ return y }
		,set y(a){
			return y = a
		}
		,get speed(){ return speed }
		,set speed(a){
			return speed = a
		}
		
		,get action(){ return action }
		,set action(a){
			return action = a
		}
		,get position(){ return position }
		,set position(a){
			return position = a
		}
		,get respawnId(){
			return respawnId
		}
		,get scale(){
			return 4
		}
	}
}

function Deer(...args){

	const me = 
		Character(...args)

	me.frame.playspeed = 1/8

	let spawnRadius = 5

	function canSee(character){
		return (
			me.position == 'right' 
			&& me.x < character.character.x  
			&& character.character.x < me.x + 100
			&& me.y - 50 < character.character.y
			&& character.character.y < me.y + 50

			|| me.position == 'left'
			&& me.x > character.character.x
			&& character.character.x > me.x - 100
			&& me.y - 50 < character.character.y
			&& character.character.y < me.y + 50
		) 
	}

	function act(character){
		if( !me.alive ){
			me.action = 'die'
			me.frame.repeat = false
		} else if ( canSee(character) ){
			me.action = 'run'
			me.position = me.position == 'left' ? 'right' : 'left'
		} else if (
			me.action == 'run'
			&& Util.distance(character.character,me) < 150
		) {
			me.x = me.x + ( me.position == 'left' ? -1 : 1 ) * me.speed
		} else if ( me.action == 'run' ){
			me.position = 
				me.position == 'right' ? 'left' : 'right'
			
			me.action = 'idle'
		} else {
			me.action = 'idle'
		}
	}

	function respawn(){
		// eslint-disable-next-line no-undef
		clearInterval(me.respawnId)
		me.x = me.x + Util.random(spawnRadius)
		me.y = Util.randomInt(200)
		me.alive = true
		me.action = 'idle'
		me.position = 
			me.position == 'right' ? 'left' : 'right'
		me.frame.repeat = true
		spawnRadius = spawnRadius + 10
	}

	return {
		respawn
		,act
		,canSee
		,character: me
	}
}  

function Element(x,y,imagePath){
	const frame = Frame()
	// eslint-disable-next-line no-undef
	const image = new Image()
	image.src = imagePath
	frame.reset(image)

	return {
		update: frame.next
		,get x(){
			return x
		}
		,set x(a){
			return x = a
		}
		,get y(){
			return y
		}
		,set y(a){
			return y = a
		}
		,get scale(){
			return 4
		}
	}
}

function Hunter(...args){
	const me = Character(...args)
	
	const statuses = [ 'starving', 'hungry', 'peckish', 'healthy']

	let day = 0
	let carrying = false
	let family = {
		status: 'healthy'
		,children: 2
		, adults: 2
		, starved:  0
	}
	let status = 'peckish'

	function kill(character){
		if( Util.distance(me, character.character) < 60 ){
			if( character.character.alive ){
				character.character.die(character.respawn)
				carrying = true
				// eslint-disable-next-line no-undef
				document.getElementById('snd_drum2')
					.currentTime = 1
				snd.play(
					// eslint-disable-next-line no-undef
					document.getElementById('snd_drum2')
				)
			} else {
				// eslint-disable-next-line no-undef
				document.getElementById('snd_drum2')
					.currentTime = 1
				// eslint-disable-next-line no-undef
				snd.play(document.getElementById('snd_drum4'))
			}
		} else {
			// eslint-disable-next-line no-undef
			document.getElementById('snd_drum2')
				.currentTime = 1
			// eslint-disable-next-line no-undef
			snd.play(document.getElementById('snd_drum3'))

		}
	}

	function hunger(){
		if( status == 'starving' ){
			if( me.alive ){
				me.alive = false
				status = 'dead'
				// eslint-disable-next-line no-undef, no-console
				console.log( 'you lasted '+day+' days but you have starved...' )
			}
		}

		const statuses = [ 'starving', 'hungry', 'peckish', 'healthy']
		

		status = 
			statuses[statuses.indexOf(status) - 1] || 'dead'

		if( family.status == 'starving '){
			if( family.adults > 0 ){
				family.adults --
				family.starved ++
			} else if (family.children > 0 ){
				family.children --
				family.starved ++
			}
		}

		family.status =
			statuses[statuses.indexOf(status) - 1] || family.status

	}

	function eat(){
		// eslint-disable-next-line no-undef
		snd.play(document.getElementById('snd_drum5'))

		// eslint-disable-next-line no-undef, no-console
		console.log('eat')

		status = 
			statuses[statuses.indexOf(status) + 1] || 'healthy'

		if( family.status == 'healthy' && family.adults > 0 ){
			family.children ++ 
		}
			
	}

	function feed(){
		// eslint-disable-next-line no-undef
		snd.play(document.getElementById("snd_drum6"))

		family.status = 
			statuses[statuses.indexOf(status) + 1] || 'healthy'

		if( family.status == 'healthy' && family.adults > 0 ){
			family.children ++ 
		}
	}

	function act(d){
		const [newSpeed, newPlayspeed] =
			{ 'healthy': [5, 1/3 * 0.5]
			, 'peckish': [3, me.frame.playspeed]
			, 'hungry': [2.5, 1/4 * 0.5]
			, 'starving': [1.5,1/5 * 0.5]
			}[ status ] || [me.speed, me.frame.playspeed]

		me.speed = newSpeed
		me.frame.playspeed = newPlayspeed
		

		if( carrying ){
			me.action = 'carry'
			if (Keys.DOWN[Keys.ARROW_UP] ){
				me.position = "back"
				me.y = me.y-1*me.speed
			} else if (Keys.DOWN[Keys.ARROW_DOWN]) {
				me.position = "front"
				me.y= me.y + 1*me.speed
			} else if ( Keys.DOWN[Keys.ARROW_LEFT] ){
				me.position = "left"
				me.x= me.x-1*me.speed
			} else if ( Keys.DOWN[Keys.ARROW_RIGHT] ){
				me.position = "right"
				me.x= me.x + 1*me.speed
			} else if (Keys.DOWN[Keys.F]){

				me.action = "walk"
				carrying = false
				if (Util.distance(me,{x:0,y:0})<75){
					feed()
				} else {
					eat()
				}
			}
		} else if ( Keys.DOWN[Keys.SPACE] ){
			me.action = 'attack'
			kill(d)
		} else if ( Keys.DOWN[Keys.ARROW_UP] ){
			me.action = 'walk'
			me.position = 'back'
			me.y = me.y - 1 * me.speed
		} else if ( Keys.DOWN[Keys.ARROW_DOWN] ){
			me.action = 'walk'
			me.position = 'front'
			me.y = me.y  +  1 * me.speed
		} else if ( Keys.DOWN[Keys.ARROW_LEFT] ){
			me.action = 'walk'
			me.position = 'left'
			me.x = me.x - 1 * me.speed
		} else if ( Keys.DOWN[Keys.ARROW_RIGHT] ){
			me.action = 'walk'
			me.position = 'right'
			me.x = me.x  +  1 * me.speed
		} else {
			me.action = 'idle'
		}

		if (me.action == "walk"){
			// eslint-disable-next-line no-undef
			snd.play(document.getElementById('snd_walk'))
			// eslint-disable-next-line no-undef
			if (document.getElementById('snd_walk').currentTime>4){
				// eslint-disable-next-line no-undef
				document.getElementById('snd_walk').currentTime = 0
			}
		} else {
			// eslint-disable-next-line no-undef
			document.getElementById('snd_walk').pause()  
		}
	}

	return {
		set day(a){
			return day = a
		}
		,get day(){
			return day
		}
		,act
		,hunger
		,get family(){ return family }
		,set family(a){
			return family = a
		}
		,set status(a){
			return status = a
		}
		,get status(){
			return status
		}
		,character: me
	}
}


//eslint-disable-next-line no-undef
const c = 
	Hunter(
		'hunter'
		,[ Verb('walk',['front'])
		, Verb('walk',['left'])
		, Verb('walk',['right'])
		, Verb('walk',['back'])
		, Verb('attack',['front','left','right','back'])
		, Verb('carry',['front','left','right','back'])
		]
		,100
		,40
	)

const d = 
	Deer(
		'deer'
		,[ Verb('run', ['right', 'left'])
		,  Verb('die', ['right', 'left'])
		]
		,60
		,-100
	)


const f = Element(0,0,"resources/img/original/elements/fire/idle.png")
const v = Element(0,-40,"resources/img/original/elements/villager/idle.png")
const v2 = Element(-25,-25,"resources/img/original/elements/villager/idle.png")
const v3 = Element(25,-25,"resources/img/original/elements/villager/idle.png")

let timeOfDay = 0
let increment = 0.1

const FRAME_APPROX = 16/1000

function systems$night(){
	can.style.backgroundColor = 'rgba(0,0,50,'+timeOfDay+')'
	timeOfDay = timeOfDay + increment
	if( timeOfDay > 1 ){
		increment = -0.0125
	} else if ( timeOfDay < 0 && c.character.alive ){
		increment = 0.0125
		c.day = c.day + 1
		c.hunger()
		// eslint-disable-next-line no-undef
		snd.play(document.getElementById("snd_drum1"))

		if( c.day % 10 == 0 && c.family.children > 0 ){
			c.family.adults = c.family.adults + 1
			c.family.children = c.family.children - 1
		}
	}
}

const camera = { x:c.character.x, y:c.character.y, target: c.character }

const actors = {
	d, c
}

const characters = {
	f
	,v
	,v2
	,v3
	,d:d.character
	,c:c.character
}

const spatialSounds = {
	fire: {
		// eslint-disable-next-line no-undef	
		snd: document.querySelector('#snd_fire')
		,coords: f
	}
}
const loopingSounds = {
	// eslint-disable-next-line no-undef
	fire: document.querySelector('#snd_fire')
}

function systems$sndLoop(){
	Object.keys(loopingSounds).forEach(function(k){
		const snd = loopingSounds[k]

		if(snd.currentTime == 0){
			snd.play(snd)
		}

		if( snd.duration - snd.currentTime < snd.duration * FRAME_APPROX * 4 ){
			snd.currentTime = 0
		}
		
	})
}

function systems$sndSpatial(){
	Object.keys(spatialSounds).forEach(function(k){
		const sndObj = spatialSounds[k]	
		const volume = 
			1-Math.abs(Util.distance(sndObj.coords,camera)/1000)
		
		if( volume > 0 && volume < 1 ){
			sndObj.snd.volume = volume
		}
	})
}
	

function systems$prepCanvas(){
	// eslint-disable-next-line no-undef
	can.width = window.innerWidth
	// eslint-disable-next-line no-undef
	can.height = window.innerHeight
	can.width = can.width
	con.imageSmoothingEnabled = false
	
	con.translate(can.width/2, can.height/2)
}

function systems$drawCharacters(){
	Object.keys(characters).forEach(function(k){
		const character = characters[k]
		con.save()
		con.translate(character.x-camera.x,character.y-camera.y)
		con.scale(character.scale, character.scale)
		if( 'act' in character){
			character.act(c)
		}
		if( 'update' in character ){
			character.update()
		}
		con.scale(1,1)
		con.restore()
	})
}

function systems$camera(){
	if( Util.distance(camera, c.character) > 10 ){
		camera.x = camera.x + (camera.target.x - camera.x) * 0.05
		camera.y = camera.y + (camera.target.y - camera.y) * 0.05
	}
}


function system$dpi(){
	// eslint-disable-next-line no-undef
	if( window.innerWidth > 800 ){
		con.scale(2,2)
	}
}

function system$act(){
	Object.keys(actors).forEach(function(k){
		const other = actors[k]

		Object.keys(actors).forEach(function(k){
			const me = actors[k]

			if( me != other ){
				me.act(other, delta)
			}
		})
	})
}

function system$village(){
	if( c.family.children + c.family.adults > 0 ){
		characters.v2 = v2
	} else {
		delete characters[v2]
	}

	if (c.family.children+c.family.adults > 4){
		characters.v = v
	} else {
		delete characters.v
	}

	if (c.family.children+c.family.adults > 8){
		characters.v3 = v3
	} else {
		delete characters.v3
	}
}

let paused = false

let last = 0
let delta = 0
const game = {

	loop(){
		delta = Date.now - last
		last = Date.now()

		if( !paused ){
			systems$camera()
			systems$prepCanvas()
			system$dpi()
			system$village()
			system$act(delta)
			systems$drawCharacters()
	
			// eslint-disable-next-line no-undef
			systems$sndLoop()
			systems$sndSpatial()
			game.status()
		}

		// eslint-disable-next-line no-undef
		requestAnimationFrame(game.loop)
	}

	,restart(){

		c.day = 1
		c.carrying = false
		c.family = {
			status: 'healthy'
			,children: 2
			,adults: 2
			,starved: 0
		}
		c.status = 'peckish'
		c.character.x = 100 * Util.random() * Util.even()
		c.character.y = 40 * Util.random() * Util.even()
		d.character.x = -60
		d.character.y = -100
		d.spawnRadius = 5
		c.character.alive = true
		// eslint-disable-next-line no-undef
		paused = false
		// eslint-disable-next-line no-undef
		snd.play(document.getElementById('snd_fire'))
	}

	,status(){
		//eslint-disable-next-line no-undef
		document.getElementById('dayDisplay').innerHTML = 'Day: '+c.day
		if (c.carrying){

			if (Util.distance(c,{x:0,y:0})>75){
				//eslint-disable-next-line no-undef
				document.getElementById('adviceDisplay').innerHTML = 
					'Eat: (F)'
			} else {
				//eslint-disable-next-line no-undef
				document.getElementById('adviceDisplay').innerHTML = 
					'Feed Village: (F)' 
			}
		} else {
			//eslint-disable-next-line no-undef
			document.getElementById('adviceDisplay').innerHTML = 
				'Swing: (Spacebar), Hunt: (Arrow Keys)'
		}

		//eslint-disable-next-line no-undef
		document.getElementById('youDisplay').innerHTML = 
			'You are '+c.status
		
		//eslint-disable-next-line no-undef
		document.getElementById('familyDisplay').innerHTML = 
			'Your village is '+c.family.status

		//eslint-disable-next-line no-undef
		document.getElementById('gameDisplay').innerHTML = 
			'You have '+c.family.adults+ ' elders and '+c.family.children
				+' children.  '+c.family.starved
				+' of your village have starved.'
		if( !c.character.alive ){
			//eslint-disable-next-line no-undef
			document.getElementById('youDisplay').innerHTML = 
				'You are '+c.status
		
			//eslint-disable-next-line no-undef
			paused = true
			//eslint-disable-next-line no-undef
			document.getElementById("snd_fire").pause()
			//eslint-disable-next-line no-undef
			document.getElementById("snd_walk").pause()
			//eslint-disable-next-line no-undef
			game.restartID = setTimeout(game.restart,8000)
		}
	}
}

// eslint-disable-next-line no-undef
requestAnimationFrame(game.loop)

// eslint-disable-next-line no-undef, no-console
setInterval(systems$night,62.5)