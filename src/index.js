/* globals m */

// @ts-check
const Keys = {
	ARROW_RIGHT: 39
	,ARROW_DOWN: 40
	,ARROW_UP: 38
	,ARROW_LEFT: 37
	,SPACE: 32
	,F: 70
}


const LocalStorage = {
	set(k, v){
		// eslint-disable-next-line no-undef
		return localStorage.setItem(k, v)
	}
	,get(k){
		// eslint-disable-next-line no-undef
		return localStorage.getItem(k)
	}
}


function Verb(name, positions){
	return {
		images: {}
		,name
		,positions
	}
}

const state = {
	Keys: {
		DOWN: {}
	}
	,mute: LocalStorage.get('provider.mute') == 'true'
	,resources: {
		snd: {
			fire: { src: 'resources/snd/fire.wav', element: null }
			,walk: { src: 'resources/snd/walk.wav', element: null }
			,drum1: { src: 'resources/snd/drum1.wav', element: null }
			,drum2: { src: 'resources/snd/drum2.wav', element: null }
			,drum3: { src: 'resources/snd/drum3.wav', element: null }
			,drum4: { src: 'resources/snd/drum4.wav', element: null }
			,drum5: { src: 'resources/snd/drum5.wav', element: null }
			,drum6: { src: 'resources/snd/drum6.wav', element: null }
		}
		,img: {}
	}
	,verbs: {
		c: 
			[ Verb('walk',['front'])
			, Verb('walk',['left'])
			, Verb('walk',['right'])
			, Verb('walk',['back'])
			, Verb('attack',['front','left','right','back'])
			, Verb('carry',['front','left','right','back'])
			]

		,d: 
			[ Verb('run', ['right', 'left'])
			, Verb('die', ['right', 'left'])
			]
	}
}

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


function App(state){

	const SND = {
		play(audio){
			if( !state.mute ){
				audio.play()
			}
		}
		,pause(audio){
			audio.pause()
		}
		,volume(audio, x){
			if(!state.mute){
				audio.volume = x
			}
		}
	}

	function setMute(x){

		state.mute = x
		LocalStorage.set('provider.mute', String(state.mute))
		// eslint-disable-next-line no-undef
		Object.keys(state.resources.snd)
			.map(function(k){
				return state.resources.snd[k]
			})
			.filter( o => o.element )
			.forEach(function(o){
				if( state.mute ){
					o.element.volume = 0
				} else {
					o.element.volume = 1
				}	
			})
	}

	// eslint-disable-next-line no-undef
	window.onkeyup = e => {
		if( e.keyCode == 77 /* M */){
			
			setMute(!state.mute)
		}
		delete state.Keys.DOWN[e.keyCode]
	}

	// eslint-disable-next-line no-undef
	window.onkeydown = e => {
		if( !(e.keyCode in state.Keys.DOWN) ){
			state.Keys.DOWN[e.keyCode] = Date.now()
		}

		if( e.keyCode > 31 && e.keyCode < 41 ){
			e.preventDefault()
		}
	}

	const Frame = {
		of(){
			return {
				count: 0
				, width: 0
				, index: 0
				, imageId: null
				, playspeed: 1/8
				, repeat: true
			}
		}
		
		,onload(frame){
			const image =
				state.resources.img[frame.imageId].element

			frame.count = 
				image.width / image.height

			// the height of the strip is the width of a frame
			frame.width = image.height

			frame.index = 0
		}

		,reset(frame, imageId){
			const image = 
				state.resources.img[imageId].element

			frame.imageId = imageId

			if( image.complete ){
				Frame.onload(frame)
			} else {
				image.onload = () => 
					Frame.onload(frame)
			}

			// todo-james why is this happening here?
			frame.count = image.width / image.height
			frame.width = image.height
			frame.index = 0
		}

		,draw(frame){
			const image =
				state.resources.img[frame.imageId].element

			if( image.complete ){

				const sx = 
					Math.floor(frame.index)*frame.width

				const sy = 0
				const sWidth = frame.width
				const sHeight = frame.width
				const dx = -frame.width / 2
				const dy = -frame.width / 2
				const dWidth = frame.width
				const dHeight = frame.width

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
		}

		,next(frame){
			Frame.draw(frame)
			frame.index = frame.index + frame.playspeed
			
			if( Math.floor(frame.index)+1 > frame.count ){
				if( frame.repeat ){
					frame.index = 0
				} else {
					frame.index = frame.count - 1
				}
			}
		}
	}

	const Character = {
		of({ name, verbs, x, y }){
			
			return { 
				name
				, verbs
				, x
				, y
				, imageId: null 
				, position: null
				, idles: {}
				, speed: 4
				, scale: 4
				, frame: Frame.of()
				, action: 'idle'
				, alive: true
				, respawnId: null
			}
		}

		,initSprites( character ){

			let positions = []
			for( let verb of character.verbs ){
				for( let position of verb.positions ){

					// eslint-disable-next-line no-undef
					const image = new Image()

					const src =
						'resources/img/original/characters/'
							+ character.name
							+ '/'+position
							+ '_'+verb.name+'.png'

					verb.images[position] = src
					image.src = src

					state.resources.img[src] = {
						element:image
						,src
					}
					

					if( positions.indexOf(position) == -1 ){
						positions.push( position )
					}
				}
			}

			for( let position of positions ){

				// eslint-disable-next-line no-undef
				const image = new Image()

				const src =
					'resources/img/original/characters/'
						+ character.name
						+ '/'+position
						+ '_idle.png'

				image.src = src
				character.idles[position] = src

				state.resources.img[src] = {
					element:image
					,src
				}

			}

			character.position = positions[0]
		
		}

		,die(character, respawn){
			if( character.alive ){
				character.alive = false 
				character.respawnId = 
					// eslint-disable-next-line no-undef
					setInterval(
						respawn
						, 2000
					)
			}
		}

		,update(o){
			for( let verb of o.verbs ){
				if( 
					o.action == verb.name 
					&& verb.positions.indexOf(o.position) > -1 
				){
					if( !(o.imageId == verb.images[o.position]) ){
						o.imageId = verb.images[o.position]
						Frame.reset(o.frame, verb.images[o.position])
					}
					break
				}
			}

			if( o.action != 'idle' ){
				Frame.next(o.frame)
			} else {
				if( o.imageId != o.idles[o.position] ){
					o.imageId = o.idles[o.position]
					Frame.reset(o.frame, o.idles[o.position])
				}
				Frame.next(o.frame)
			}
		}
	}

	function Deer(...args){

		const me = 	
			Character.of(...args)

		Character.initSprites(me)

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

	function Element(x,y,src){

		const frame = Frame.of()
		// eslint-disable-next-line no-undef
		const image = new Image()
		
		image.src = src
		
		state.resources.img[src] = {
			element:image
			,src
		}

		Frame.reset(frame, src)

		return {
			update: () => Frame.next(frame)
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
		const me = Character.of(...args)
		Character.initSprites(me)
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
					Character.die( character.character, character.respawn )
					carrying = true
					state.resources.snd.drum2.element
						.currentTime = 1
					SND.play(
						state.resources.snd.drum2.element
					)
				} else {
					state.resources.snd.drum2.element
						.currentTime = 1
					SND.play(state.resources.snd.drum4.element)
				}
			} else {
				state.resources.snd.drum2.element
					.currentTime = 1
				SND.play(state.resources.snd.drum3.element)

			}
		}

		function hunger(){
			if( status == 'starving' ){
				if( me.alive ){
					me.alive = false
					status = 'dead'
					// eslint-disable-next-line no-undef, no-console
					console.log( 
						'you lasted '+day+' days but you have starved...' 
					)
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
			
			SND.play(state.resources.snd.drum5.element)

			// eslint-disable-next-line no-undef, no-console
			console.log('eat')

			status = 
				statuses[statuses.indexOf(status) + 1] || 'healthy'

			if( family.status == 'healthy' && family.adults > 0 ){
				family.children ++ 
			}
				
		}

		function feed(){
			
			SND.play(state.resources.snd.drum6.element)

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
				if (state.Keys.DOWN[Keys.ARROW_UP] ){
					me.position = "back"
					me.y = me.y-1*me.speed
				} else if (state.Keys.DOWN[Keys.ARROW_DOWN]) {
					me.position = "front"
					me.y= me.y + 1*me.speed
				} else if ( state.Keys.DOWN[Keys.ARROW_LEFT] ){
					me.position = "left"
					me.x= me.x-1*me.speed
				} else if ( state.Keys.DOWN[Keys.ARROW_RIGHT] ){
					me.position = "right"
					me.x= me.x + 1*me.speed
				} else if (state.Keys.DOWN[Keys.F]){

					me.action = "walk"
					carrying = false
					if (Util.distance(me,{x:0,y:0})<75){
						feed()
					} else {
						eat()
					}
				}
			} else if ( state.Keys.DOWN[Keys.SPACE] ){
				me.action = 'attack'
				kill(d)
			} else if ( state.Keys.DOWN[Keys.ARROW_UP] ){
				me.action = 'walk'
				me.position = 'back'
				me.y = me.y - 1 * me.speed
			} else if ( state.Keys.DOWN[Keys.ARROW_DOWN] ){
				me.action = 'walk'
				me.position = 'front'
				me.y = me.y  +  1 * me.speed
			} else if ( state.Keys.DOWN[Keys.ARROW_LEFT] ){
				me.action = 'walk'
				me.position = 'left'
				me.x = me.x - 1 * me.speed
			} else if ( state.Keys.DOWN[Keys.ARROW_RIGHT] ){
				me.action = 'walk'
				me.position = 'right'
				me.x = me.x  +  1 * me.speed
			} else {
				me.action = 'idle'
			}

			if (me.action == "walk"){
				
				SND.play(state.resources.snd.walk.element)
				if (state.resources.snd.walk.element.currentTime>4){
					state.resources.snd.walk.element.currentTime = 0
				}
			} else {
				state.resources.snd.walk.element.pause()  
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

	const c = 
		Hunter({
			name: 'hunter'
			,verbs: state.verbs.c
			,x: 100
			,y: 40
		})

	const d = 
		Deer({
			name: 'deer'
			,verbs: state.verbs.d
			,x: 60
			,y: -100
		})


	const f = 
		Element(0,0,"resources/img/original/elements/fire/idle.png")
	const v = 
		Element(0,-40,"resources/img/original/elements/villager/idle.png")
	const v2 = 
		Element(-25,-25,"resources/img/original/elements/villager/idle.png")
	const v3 = 
		Element(25,-25,"resources/img/original/elements/villager/idle.png")

	let timeOfDay = 0
	let increment = 0.1

	function systems$night(){
		timeOfDay = timeOfDay + increment
		if( timeOfDay > 1 ){
			increment = -0.0125
		} else if ( timeOfDay < 0 && c.character.alive ){
			increment = 0.0125
			c.day = c.day + 1
			c.hunger()
			
			SND.play( state.resources.snd.drum1.element )

			if( c.day % 10 == 0 && c.family.children > 0 ){
				c.family.adults = c.family.adults + 1
				c.family.children = c.family.children - 1
			}
		}
	}

	function systems$sndLoop(){
		Object.keys(loopingSounds).forEach(function(k){
			const snd = loopingSounds[k]

			if(SND.currentTime == 0){
				SND.play(snd)
			}

			if( snd.currentTime > 8 ){
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
				SND.volume(sndObj.snd, volume)
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
				character.act()
			}
			if( 'update' in character ){
				character.update()
			} else {
				Character.update(character)
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
					me.act(other)
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


	function systems$initAudioResources(){

		setMute(state.mute)
		
		Object.keys(state.resources.snd)
			.forEach(function(id){
				const o = state.resources.snd[id]

				// eslint-disable-next-line no-undef
				o.element = new Audio()
				o.element.src = o.src
			})
	}

	function systems$ui(){

		m.render(
			// eslint-disable-next-line no-undef
			document.body
			,m('div'
				,m('canvas.absolute#c'
					,{ style:
						{ backgroundColor: 'rgba(0,0,50,'+timeOfDay+')'
						}
					}
				)
				,m('.absolute.description'
					,{ style:
						{ margin: '10px'
						, top: '0px'
						, left: '0px'
						, padding: '10px'
						}
					}
					,m('h1', 'Provider')
					,m('p#dayDisplay', 'Day: '+c.day || 1)
				)
				,m('#game.absolute'
					,{ style:
						{ margin: '10px'
						, bottom: '0px'
						, left: '0px'
						}
					}
					,m('#info'
						,{ style:
							{ padding: '10px' 
							}
						}
						,m('p#familyDisplay'
							, 'Your village is '+c.family.status
						)
						,m('p#youDisplay'
							, 'You are '+c.status
						)
						,m('p#gameDisplay'
							,'You have '
								+ c.family.adults+ ' elders and '
								+ c.family.children
								+ ' children.  '+c.family.starved
								+ ' of your village have starved.'
						)
						,m('br')
						,m('p#adviceDisplay'
							, c.carrying
							? Util.distance(c,{x:0,y:0}) > 75
								? 'Eat: (F)'
								: 'Feed Village: (F)'
							: 'Swing: (Spacebar), Hunt: (Arrow Keys)'
						)
					)
				)
				,m('.description.absolute'
					,{ style:
						{ margin: '10px'
						, top: '0px'
						, right: '0px'
						, padding: '10px'
						}
					}
					,m('p', 'Code and Art by',m('h4', m('b', 'James Forbes')))
				)
			)
		)

	}

	let paused = false

	const game = {

		loop(){

			// eslint-disable-next-line no-undef
			SND.play( state.resources.snd.fire.element )
			
			if( !paused ){
				systems$camera()
				systems$prepCanvas()
				system$dpi()
				system$village()
				system$act()
				systems$drawCharacters()
				systems$sndLoop()
				systems$sndSpatial()
				systems$ui()
				game.status()
			}

			// eslint-disable-next-line no-undef
			requestAnimationFrame(game.loop)
		}

		,status(){
			if( !c.character.alive ){
		
				//eslint-disable-next-line no-undef
				paused = true

				SND.pause( state.resources.snd.fire.element )
				SND.pause( state.resources.snd.walk.element )
				
				//eslint-disable-next-line no-undef
				game.restartID = setTimeout(game.restart,8000)
			}
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
		}
	}


	systems$initAudioResources()
	systems$ui()

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
			
			snd: state.resources.snd.fire.element
			,coords: f
		}
	}
	const loopingSounds = {
		
		fire: state.resources.snd.fire.element
	}

	// eslint-disable-next-line no-undef
	const can = document.getElementById('c')
	const con = can.getContext('2d')

	// eslint-disable-next-line no-undef
	requestAnimationFrame(game.loop)

	// eslint-disable-next-line no-undef
	setInterval(systems$night,62.5)
}

App(state)