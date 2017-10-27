/* globals m */

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
	keys: {
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
	,coords: {
		hunter: {x:0, y:0, z:0}
		,deer: {x:0, y:0, z:0}
		,f: {x:0, y:0, z:0}
		,v: {x:0, y:0, z:0}
		,v1: {x:0, y:0, z:0}
		,v2: {x:0, y:0, z:0}
		,camera: {x:0, y:0}
	}
	,verbs: {
		hunter: 
			[ Verb('walk',['front'])
			, Verb('walk',['left'])
			, Verb('walk',['right'])
			, Verb('walk',['back'])
			, Verb('attack',['front','left','right','back'])
			, Verb('carry',['front','left','right','back'])
			]

		,deer: 
			[ Verb('run', ['right', 'left'])
			, Verb('die', ['right', 'left'])
			]
	}
	,characters: {}
	,elements: {}
	,frames: {}
	,camera: { 
		x: 0
		, y: 0
		, scale: { x: 1, y: 1 }
		, target: null
	}
	,hunter: {}
	,deer: {}
	,spatialSounds:{}
	,loopingSounds: {}

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
		delete state.keys.DOWN[e.keyCode]
	}

	// eslint-disable-next-line no-undef
	window.onkeydown = e => {
		if( !(e.keyCode in state.keys.DOWN) ){
			state.keys.DOWN[e.keyCode] = Date.now()
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
				, scale: 1
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
		of({ id, verbs, x, y }){
			
			state.frames[id] = Frame.of()
			state.frames[id].scale = 4

			state.coords[id].x = x
			state.coords[id].y = y

			return { 
				id
				, verbs
				, imageId: null 
				, position: null
				, idles: {}
				, speed: 4
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
							+ character.id
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
						+ character.id
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

		,update(o){
			for( let verb of o.verbs ){
				if( 
					o.action == verb.name 
					&& verb.positions.indexOf(o.position) > -1 
				){
					if( !(o.imageId == verb.images[o.position]) ){
						o.imageId = verb.images[o.position]
						
						Frame.reset(
							state.frames[o.id], verb.images[o.position]
						)
					}
					break
				}
			}

			if( o.action == 'idle' ){
				if( o.imageId != o.idles[o.position] ){
					o.imageId = o.idles[o.position]
					Frame.reset(state.frames[o.id], o.idles[o.position])
				}
			}
		}
	}

	// set playspeed to 1/8
	const Deer = {
		of(id){
			return {
				spawnRadius: 5
				,id
			}
		}

		// todo pass in an id not an object for other
		,canSee(deer, other){
			const [me, them] = 
				[ deer.id, other.id ]
					.map(
						id => ({
							c: state.characters[id]
							,p: state.coords[id]
						})
					)
			
			return (
				me.c.position == 'right' 
				&& me.p.x < them.p.x  
				&& them.p.x < me.p.x + 100
				&& me.p.y - 50 < them.p.y
				&& them.p.y < me.p.y + 50

				|| me.c.position == 'left'
				&& me.p.x > them.p.x
				&& them.p.x > me.p.x - 100
				&& me.p.y - 50 < them.p.y
				&& them.p.y < me.p.y + 50
			) 
		}

		,act(deer, other){
			const [me, them] = 
				[ deer.id, other.id ]
					.map(
						id => ({
							c: state.characters[id]
							,p: state.coords[id]
						})
					)
				
			if( !me.c.alive ){
				me.c.action = 'die'
				state.frames[me.c.id].repeat = false
			} else if ( Deer.canSee(deer, other) ){
				me.c.action = 'run'
				me.c.position = me.c.position == 'left' ? 'right' : 'left'
			} else if (
				me.c.action == 'run'
				&& Util.distance(them.p, me.p) < 150
			) {
				me.p.x = me.p.x + ( 
					me.c.position == 'left' ? -1 : 1 
				) * me.c.speed
			} else if ( me.c.action == 'run' ){
				me.c.position = 
					me.c.position == 'right' ? 'left' : 'right'
				
				me.c.action = 'idle'
			} else {
				me.c.action = 'idle'
			}
		}

		,respawn(deer){

			const [me] = 
				[ deer.id ]
					.map(
						id => ({
							c: state.characters[id]
							,p: state.coords[id]
						})
					)

			state.characters[deer.id]

			me.p.x = me.p.x + Util.random(deer.spawnRadius)
			me.p.y = Util.randomInt(200)
			me.c.alive = true
			me.c.action = 'idle'
			me.c.position = 
				me.c.position == 'right' ? 'left' : 'right'
			state.frames[me.c.id].repeat = true
			deer.spawnRadius = deer.spawnRadius + 10
		}

		,system(){
			
			Deer.act(state.deer.deer, state.hunter.hunter)
			
			if( 
				state.characters.deer.alive == false 
				&& state.deer.deer.respawnId == null 
			) {

				state.deer.deer.respawnId = 
					// eslint-disable-next-line no-undef
					setTimeout( 
						() => {
							Deer.respawn(state.deer.deer)
							state.deer.deer.respawnId = null
						}
						, 2000 
					)
			}
		}

	}

	const Element = {
		of(id){
			return {
				id
			}
		}
		,init({ id }, src, { x, y } ){
			// eslint-disable-next-line no-undef
			const image = new Image()
			
			image.src = src
			
			state.frames[id] = Frame.of()
			state.frames[id].scale = 4
			state.resources.img[src] = {
				element:image
				,src
			}

			Frame.reset(state.frames[id], src)

			state.coords[id] = { x, y }
		}
	}

	const Hunter = {
		of(id){
			return {
				day: 0
				,carrying: false
				,family: {
					status: 'healthy'
					,children: 2
					, adults: 2
					, starved:  0		
				}
				,id
				,status: 'peckish'
			}
		}
		
		,statuses: [ 'starving', 'hungry', 'peckish', 'healthy']

		,kill(hunter, deer){
			
			const [me, them] = 
				[ hunter.id, deer.id ]
					.map(
						id => ({
							c: state.characters[id]
							,p: state.coords[id]
						})
					)
			

			if( Util.distance(me.p, them.p) < 60 ){
				if( them.c.alive ){
					them.c.alive = false
					hunter.carrying = true
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

		,hunger(hunter){
			const { status, id, day, family } = hunter
			const statuses = Hunter.statuses


			const [me] = 
				[ id ]
					.map(
						id => ({
							c: state.characters[id]
							,p: state.coords[id]
						})
					)
			
			if( status == 'starving' ){
				if( me.c.alive ){
					me.c.alive = false
					me.c.status = 'dead'
					// eslint-disable-next-line no-undef, no-console
					console.log( 
						'you lasted '+day+' days but you have starved...' 
					)
				}
			}


			hunter.status = 
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

		,eat(hunter){
			
			const { status, family } = hunter

			const statuses = Hunter.statuses

			SND.play(state.resources.snd.drum5.element)

			// eslint-disable-next-line no-undef, no-console
			console.log('eat')

			hunter.status = 
				statuses[statuses.indexOf(status) + 1] || 'healthy'

			if( family.status == 'healthy' && family.adults > 0 ){
				family.children ++ 
			}
		}

		,feed(hunter){
			SND.play(state.resources.snd.drum6.element)

			hunter.family.status = 
				Hunter.statuses
					[Hunter.statuses.indexOf(hunter.family.status) + 1] 
					|| 'healthy'

			if( hunter.family.status == 'healthy' && hunter.family.adults > 0 ){
				hunter.family.children ++ 
			}
		}

		,act(hunter, deer){
			
			const {
				id
				, status
				, carrying
			} = hunter

			
			const [me] = 
				[ id ]
					.map(
						id => ({
							c: state.characters[id]
							,p: state.coords[id]
						})
					)
			
			const [newSpeed, newPlayspeed] =
				{ 'healthy': [5, 1/3 * 0.5]
				, 'peckish': [3, state.frames[me.c.id].playspeed]
				, 'hungry': [2.5, 1/4 * 0.5]
				, 'starving': [1.5,1/5 * 0.5]
				}[ status ] || [me.c.speed, state.frames[me.c.id].playspeed]

			me.c.speed = newSpeed
			state.frames[me.c.id].playspeed = newPlayspeed
			
			if( carrying ){
				me.c.action = 'carry'
				if (state.keys.DOWN[Keys.ARROW_UP] ){
					me.c.position = "back"
					me.p.y = me.p.y-1*me.c.speed
				} else if (state.keys.DOWN[Keys.ARROW_DOWN]) {
					me.c.position = "front"
					me.p.y= me.p.y + 1*me.c.speed
				} else if ( state.keys.DOWN[Keys.ARROW_LEFT] ){
					me.c.position = "left"
					me.p.x= me.p.x-1*me.c.speed
				} else if ( state.keys.DOWN[Keys.ARROW_RIGHT] ){
					me.c.position = "right"
					me.p.x= me.p.x + 1*me.c.speed
				} else if (state.keys.DOWN[Keys.F]){

					me.c.action = "walk"
					hunter.carrying = false
					if (Util.distance(me.p,{x:0,y:0})<75){
						Hunter.feed(hunter)
					} else {
						Hunter.eat(hunter)
					}
				}
			} else if ( state.keys.DOWN[Keys.SPACE] ){
				me.c.action = 'attack'
				Hunter.kill( hunter, deer )
			} else if ( state.keys.DOWN[Keys.ARROW_UP] ){
				me.c.action = 'walk'
				me.c.position = 'back'
				me.p.y = me.p.y - 1 * me.c.speed
			} else if ( state.keys.DOWN[Keys.ARROW_DOWN] ){
				me.c.action = 'walk'
				me.c.position = 'front'
				me.p.y = me.p.y  +  1 * me.c.speed
			} else if ( state.keys.DOWN[Keys.ARROW_LEFT] ){
				me.c.action = 'walk'
				me.c.position = 'left'
				me.p.x = me.p.x - 1 * me.c.speed
			} else if ( state.keys.DOWN[Keys.ARROW_RIGHT] ){
				me.c.action = 'walk'
				me.c.position = 'right'
				me.p.x = me.p.x  +  1 * me.c.speed
			} else {
				me.c.action = 'idle'
			}

			if (me.c.action == "walk"){
				
				SND.play(state.resources.snd.walk.element)
				if (state.resources.snd.walk.element.currentTime>4){
					state.resources.snd.walk.element.currentTime = 0
				}
			} else {
				state.resources.snd.walk.element.pause()  
			}
		}

		,system(){
			return Hunter.act(state.hunter.hunter, state.deer.deer)
		}
	}

	state.hunter.hunter = Hunter.of('hunter')
	state.deer.deer = Deer.of('deer')

	state.elements.f = 
		Element.of( 'f' )
	
	Element.init(
		state.elements.f
		, "resources/img/original/elements/fire/idle.png"
		, { x: 0, y: 0 } 
	)

	state.characters.deer =
		Character.of({
			id: 'deer'
			,verbs: state.verbs.deer
			,x: 60
			,y: -100
		})

	Character.initSprites( state.characters.deer )


	state.characters.hunter =
		Character.of({
			id: 'hunter'
			,verbs: state.verbs.hunter
			,x: 100
			,y: 40
		})

	Character.initSprites( state.characters.hunter )

	let timeOfDay = 0
	let increment = 0.1

	function systems$night(){
		const c = state.hunter.hunter
		timeOfDay = timeOfDay + increment
		if( timeOfDay > 1 ){
			increment = -0.0125
		} else if ( timeOfDay < 0 && state.characters[c.id].alive ){
			increment = 0.0125
			c.day = c.day + 1
			Hunter.hunger(c)
			
			SND.play( state.resources.snd.drum1.element )

			if( c.day % 10 == 0 && c.family.children > 0 ){
				c.family.adults = c.family.adults + 1
				c.family.children = c.family.children - 1
			}
		}
	}

	function systems$sndLoop(){
		Object.keys(state.loopingSounds).forEach(function(k){
			const sndId = state.loopingSounds[k]
			const sndResource = state.resources.snd[sndId]

			if(SND.currentTime == 0){
				SND.play(sndResource.element)
			}

			if( sndResource.element.currentTime > 8 ){
				sndResource.element.currentTime = 0
			}
			
		})
	}

	function systems$sndSpatial(){
		Object.keys(state.spatialSounds).forEach(function(k){
			const sndObj = state.spatialSounds[k]	
			const sndResource = state.resources.snd[sndObj.snd]
			const volume = 
				1-Math.min(1, Util.distance(sndObj.coords,state.camera) / 1000 )
			
			if( volume > 0 && volume < 1 ){
				SND.volume(sndResource.element, volume)
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

	function systems$drawFrames(){
		
		Object.keys(state.frames)
		.forEach(function(id){
			
			con.save()
			con.scale( state.camera.scale.x, state.camera.scale.y )
			const coords = state.coords[id]
			
			con.translate(coords.x-state.camera.x,coords.y-state.camera.y)
			
			const frame = state.frames[id]
			con.scale(frame.scale, frame.scale)
			
			Frame.next(frame)
			
			con.scale(1,1)
			con.restore()
		})
	}

	function systems$updateCharacters(){
		Object.keys(state.characters).forEach(function(k){
			const character = state.characters[k]
			Character.update(character)
		})
		
	}

	function systems$camera(){
		const target = state.coords[ state.camera.target ]
		
		if( Util.distance(state.camera, target) > 10 ){
			state.camera.x = state.camera.x + (target.x - state.camera.x) * 0.05
			state.camera.y = state.camera.y + (target.y - state.camera.y) * 0.05
		}
	}

	function system$dpi(){
		// eslint-disable-next-line no-undef
		if( window.innerWidth > 800 ){
			state.camera.scale = { x:2, y: 2 }
		} else {
			state.camera.scale = { x:1, y: 1 }
		}
	}


	function system$village(){
		const c = state.hunter.hunter
		if( c.family.children + c.family.adults > 0 ){

			state.elements.v2 = 
				Element.of( 'v2' )

			Element.init(
				state.elements.v2
				, "resources/img/original/elements/villager/idle.png"
				, { x: -25, y: -25 } 
			)

		} else {
			delete state.elements.v2
		}

		if (c.family.children+c.family.adults > 4){
			state.elements.v = 
				Element.of( 'v' )

			Element.init(
				state.elements.v
				, "resources/img/original/elements/villager/idle.png"
				, { x: -25, y: -25 } 
			)
	
		} else {
			delete state.elements.v
		}

		if (c.family.children+c.family.adults > 8){
			state.elements.v3 = 
				Element.of( 'v3' )

			Element.init(
				state.elements.v3
				, "resources/img/original/elements/villager/idle.png"
				, { x: 25, y: -25 } 
			)

		} else {
			delete state.elements.v3
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
		const c = state.hunter.hunter

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
							? Util.distance( 
								state.characters[c.id], {x:0,y:0}
							) > 75
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

			const c = state.hunter.hunter
			state.camera.target = c.id

			if( !paused ){
				systems$camera()
				systems$prepCanvas()
				system$dpi()
				system$village()
				Deer.system()
				Hunter.system()
				systems$updateCharacters()
				systems$drawFrames()
				systems$sndLoop()
				systems$sndSpatial()
				systems$ui()
				game.status()
			}

			// eslint-disable-next-line no-undef
			requestAnimationFrame(game.loop)
		}

		,status(){
			const c = state.hunter.hunter
			if( !state.characters[c.id].alive ){
		
				//eslint-disable-next-line no-undef
				paused = true

				SND.pause( state.resources.snd.fire.element )
				SND.pause( state.resources.snd.walk.element )
				
				//eslint-disable-next-line no-undef
				game.restartID = setTimeout(game.restart,8000)
			}
		}

		,restart(){
			const c = state.hunter.hunter
			const d = state.deer.deer

			c.day = 1
			c.carrying = false
			c.family = {
				status: 'healthy'
				,children: 2
				,adults: 2
				,starved: 0
			}
			c.status = 'peckish'
			state.coords.hunter.x = 100 * Util.random() * Util.even()
			state.coords.hunter.y = 40 * Util.random() * Util.even()
			state.coords.deer.x = -60
			state.coords.deer.y = -100

			state.camera.x = state.coords.hunter.x
			state.camera.y = state.coords.hunter.y - 10000

			d.spawnRadius = 5
			state.characters[c.id].alive = true
			// eslint-disable-next-line no-undef
			paused = false
			// eslint-disable-next-line no-undef
		}
	}


	state.camera.x = state.coords.hunter.x
	state.camera.y = state.coords.hunter.y - 10000
	systems$initAudioResources()
	state.spatialSounds.fire = {
		snd: 'fire'
		,coords: state.elements.f
	}
	systems$ui()
		

	state.loopingSounds.fire = 'fire'
	

	// eslint-disable-next-line no-undef
	const can = document.getElementById('c')
	const con = can.getContext('2d')

	// eslint-disable-next-line no-undef
	requestAnimationFrame(game.loop)

	// eslint-disable-next-line no-undef
	setInterval(systems$night,62.5)

}

App(state)