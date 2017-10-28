// @ts-check 

const m = /** @type {any} */ (
	// @ts-ignore
	// eslint-disable-next-line
	window.m
)


const uuid = () => Math.random().toString(15).slice(2)
const hunter = uuid()
const deer = uuid()

const Keys = {
	ARROW_RIGHT: 39
	,ARROW_DOWN: 40
	,ARROW_UP: 38
	,ARROW_LEFT: 37
	,SPACE: 32
	,F: 70
}

const LocalStorage = {

	/**
	 * @param {string} k 
	 * @param {string} v 
	 */
	set(k, v){
		
		// eslint-disable-next-line no-undef
		return localStorage.setItem(k, v)
	}

	,get( /** @type {string}*/ k){
		// eslint-disable-next-line no-undef
		return localStorage.getItem(k)
	}
}

/**
	@param {string} name 
	@param {string[]} positions 
	@returns {Provider.Verb}
 */
function Verb(name, positions){
	return {
		images: {}
		,name
		,positions
	}
}

/** @type {Provider.State}  */
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
		f: {x:0, y:0, z:0}
		,v: {x:0, y:0, z:0}
		,v1: {x:0, y:0, z:0}
		,v2: {x:0, y:0, z:0}
		,camera: {x:0, y:0, z:0}
	}
	,verbs: {}
	,characters: {}
	,frames: {}
	,camera: { 
		x: 0
		, y: 0
		, z: 0
		, scale: { x: 1, y: 1 }
		, target: null
	}
	,hunter: {}
	,deer: {}
	,spatialSounds:{}
	,loopingSounds: {}

}

const Util = {
	/**
	 * 
	 * @param {Provider.Coord} p1 
	 * @param {Provider.Coord} p2 
	 */
	distance(p1, p2){
		const xs = 
			[p2.x - p1.x].map( x => x * x )

		const ys = 
			[p2.y - p1.y].map( x => x * x )
			
		const zs = 
			[p2.z - p1.z].map( x => x * x )
			
		return Math.sqrt( xs[0] + ys[0] + zs[0] )
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

/**
 * 
 * @param {Provider.State} state 
 */
function App(state){

	const SND = {

		/** @param {HTMLAudioElement} audio */
		play(audio){
			if( !state.mute ){
				audio.play()
			}
		},
		
		/** @param {HTMLAudioElement} audio */
		pause(audio){
			audio.pause()
		},

		/** @param {HTMLAudioElement} audio */
		/** @param {number} x */
		volume(audio, x){
			if(!state.mute){
				audio.volume = x
			}
		}
	}

	/**
	 * 
	 * @param {boolean} x 
	 */
	function setMute(x){

		state.mute = x
		LocalStorage.set('provider.mute', String(state.mute))
		// eslint-disable-next-line no-undef
		Object.keys(state.resources.snd)
			.map(function(k){
				return state.resources.snd[k]
			})
			.filter( o => o.element != null )
			
			.forEach(function(o){
				if( state.mute ){
					// @ts-ignore
					o.element.volume = 0
				} else {
					// typescript still things this is null :O
					// @ts-ignore
					o.element.volume = 1
				}	
			})
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	// eslint-disable-next-line no-undef
	window.onkeyup = (e) => {
		if( e.keyCode == 77 /* M */){
			
			setMute(!state.mute)
		}
		delete state.keys.DOWN[e.keyCode]
	}

	/**
	 * @param {KeyboardEvent} e
	 */
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
		},



		/**
		 * @param {Provider.Frame} frame
		 */
		onload(frame){
			if( frame.imageId != null ){
				const image =
					state.resources.img[frame.imageId].element

				if ( image != null ){

					frame.count = 
						image.width / image.height
		
					// the height of the strip is the width of a frame
					frame.width = image.height
		
				}

				frame.index = 0
			}
		},

		/**
		 * @param {Provider.Frame} frame
		 * @param {string} imageId
		 */
		reset(frame, imageId){
			const image = 
				state.resources.img[imageId].element

			frame.imageId = imageId

			if(image != null){

				if( image.complete ){
					Frame.onload(frame)
				} else {
					image.onload = () => 
						Frame.onload(frame)
				}
	
				// todo-james why is this happening here?
				frame.count = image.width / image.height
				frame.width = image.height
			}
			frame.index = 0
		},

		/**
		 * @param {Provider.Frame} frame
		 */
		draw(frame){

			if( frame.imageId != null ){

				const image =
					state.resources.img[frame.imageId].element
	
				if( image != null && image.complete ){
	
					const sx = 
						Math.floor(frame.index)*frame.width;
	
					const sy = 0;
					const sWidth = frame.width;
					const sHeight = frame.width;
					const dx = frame.width / 2;
					const dy = frame.width / 2;
					const dWidth = frame.width;
					const dHeight = frame.width;
	
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
		},

		/**
		 * @param {Provider.Frame} frame
		 */
		next(frame){
			Frame.draw(frame)
			frame.index = frame.index + frame.playspeed
			
			if( Math.floor(frame.index) +1 > frame.count ){
				if( frame.repeat ){
					frame.index = 0
				} else {
					frame.index = frame.count - 1
				}
			}
		}
	}

	const Character = {
		
		/**
		 
		 @param {{ 
			 id:string 
			 name: string
			 position: string
		}} o 
		 @returns { Provider.Character }
		 */
		of(o){
			const { id, name, position } = o
			return { 
				id
				, name
				, imageId: null 
				, position
				, speed: 4
				, action: 'idle'
				, alive: true
				, respawnId: null
			}
		},

		/**
		 * @param { Provider.Character } character
		 */
		initSprites( character ){

			const verbs = state.verbs[character.id]

			for( let verb of verbs ){
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
				}
			}

		},

		/**
		 * 
		 * @param {Provider.Character} o 
		 */
		update(o){
			
			const verbs = state.verbs[o.id]

			for( let verb of verbs ){
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
		}
	}

	// set playspeed to 1/8
	const Deer = {

		/**
		 * 
		 * @param {string} id 
		 * @returns {Provider.Deer}
		 */
		of(id){
			return {
				spawnRadius: 5
				,id
				,respawnId: null
			}
		},

		/**
		 * 
		 * @param {Provider.Deer} deer 
		 * @param {Provider.Hunter} other 
		 */
		// todo pass in an id not an object for other
		canSee(deer, other){
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
		},


		/**
		 * @param {Provider.Deer} deer 
		 * @param {Provider.Hunter} other 
		 */
		act(deer, other){
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
		},


		/**
		 * @param {Provider.Deer} deer 
		 */
		respawn(deer){

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
		},

		system(){
			
			Deer.act(state.deer[deer], state.hunter[hunter])
			
			if( 
				state.characters[deer].alive == false 
				&& state.deer[deer].respawnId == null 
			) {

				state.deer[deer].respawnId = 
					// eslint-disable-next-line no-undef
					setTimeout( 
						() => {
							Deer.respawn(state.deer[deer])
							state.deer[deer].respawnId = null
						}
						, 2000 
					)
			}
		}

	}

	const Hunter = {
		/**
		 * 
		 * @param {string} id 
		 * @returns {Provider.Hunter}
		 */
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
		},
		
		statuses: [ 'starving', 'hungry', 'peckish', 'healthy'],

		/**
		 * 
		 * @param {Provider.Hunter} hunter 
		 * @param {Provider.Deer} deer 
		 */
		kill(hunter, deer){
			
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
					if ( state.resources.snd.drum2.element != null ){
						state.resources.snd.drum2.element
							.currentTime = 1
						SND.play(
							state.resources.snd.drum2.element
						)
					}
				} else {
					if( state.resources.snd.drum4.element != null ){
						state.resources.snd.drum4.element
							.currentTime = 1
						
						SND.play(state.resources.snd.drum4.element)
					}
				}
			} else {
				if( state.resources.snd.drum3.element != null){

					state.resources.snd.drum3.element
						.currentTime = 1

					SND.play(state.resources.snd.drum3.element)
				}

			}
		},

		/**
		 * @param {Provider.Hunter} hunter 
		 */
		hunger(hunter){
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
					hunter.status = 'dead'
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
		},

		/**
		 * @param {Provider.Hunter} hunter
		 */
		eat(hunter){
			
			const { status, family } = hunter

			const statuses = Hunter.statuses

			if( state.resources.snd.drum5.element != null ){
				SND.play(state.resources.snd.drum5.element)
			}

			// eslint-disable-next-line no-undef, no-console
			console.log('eat')

			hunter.status = 
				statuses[statuses.indexOf(status) + 1] || 'healthy'

			if( family.status == 'healthy' && family.adults > 0 ){
				family.children ++ 
			}
		},

		/**
		 * @param {Provider.Hunter} hunter 
		 */
		feed(hunter){

			if( state.resources.snd.drum6.element != null ){
				SND.play(state.resources.snd.drum6.element)
			}

			hunter.family.status = 
				Hunter.statuses
					[Hunter.statuses.indexOf(hunter.family.status) + 1] 
					|| 'healthy'

			if( hunter.family.status == 'healthy' && hunter.family.adults > 0 ){
				hunter.family.children ++ 
			}
		},

		/**
		 * @param {Provider.Hunter} hunter
		 * @param {Provider.Deer} deer
		 */
		act(hunter, deer){
			
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
					if (Util.distance(me.p,{x:0,y:0,z:0})<75){
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
				if( state.resources.snd.walk.element != null ){
					SND.play(state.resources.snd.walk.element)
					if (state.resources.snd.walk.element.currentTime>4){
						state.resources.snd.walk.element.currentTime = 0
					}
				}
			} else {
				if( state.resources.snd.walk.element != null ){
					state.resources.snd.walk.element.pause()  
				}
			}
		}

		,system(){
			return Hunter.act(state.hunter[hunter], state.deer[deer])
		}
	}

	{
		state.verbs[hunter] = 
			[ Verb('idle', ['front', 'left', 'right', 'back'])
			, Verb('walk',['front'])
			, Verb('walk',['left'])
			, Verb('walk',['right'])
			, Verb('walk',['back'])
			, Verb('attack',['front','left','right','back'])
			, Verb('carry',['front','left','right','back'])
			]
	
		state.hunter[hunter] = Hunter.of(hunter)
	
		state.frames[hunter] = Frame.of()
		state.frames[hunter].scale = 4
	
		state.coords[hunter] = { x: 100, y: 40, z: 0 }
	
		state.characters[hunter] =
			Character.of({
				id: hunter
				,name: 'hunter'
				,position: 'left'
			})
	
		Character.initSprites( state.characters[hunter] )
	}

	{
		state.deer[deer] = Deer.of(deer)
		state.frames[deer] = Frame.of()
		state.frames[deer].scale = 4
	
		state.coords[deer] = { x: 60, y: -100, z: 0 }
		state.verbs[deer] =
			[ Verb('idle', ['left', 'right'])
			, Verb('run', ['right', 'left'])
			, Verb('die', ['right', 'left'])
			]
			
		state.characters[deer] =
			Character.of({
				id: deer
				,name: 'deer'
				,position: 'left'
			})
	
		Character.initSprites( state.characters[deer] )
	}

	/**
	 * 
	 * @param {string} id 
	 * @param {string} name 
	 * @param {Provider.Coord} coords 
	 */
	function SimpleCharacter(id, name, coords){
		state.verbs[id] = 
			[ Verb('idle', ['left']) ]

		
		state.frames[id] = Frame.of()
		state.frames[id].scale = 4

		state.coords[id] = coords
		

		state.characters[id] =
			Character.of({
				id,
				name,
				position: 'left'
			})

		Character.initSprites( state.characters[id] )
	}

	SimpleCharacter('f', 'fire', { x:0, y:0, z:0 })
	
	let timeOfDay = 0
	let increment = 0.1

	function systems$night(){
		const c = state.hunter[hunter]
		timeOfDay = timeOfDay + increment
		if( timeOfDay > 1 ){
			increment = -0.0125
		} else if ( timeOfDay < 0 && state.characters[c.id].alive ){
			increment = 0.0125
			c.day = c.day + 1
			Hunter.hunger(c)

			if(state.resources.snd.drum1.element != null){
				SND.play( state.resources.snd.drum1.element )
			}

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

			if( sndResource.element != null ){
				if(SND.currentTime == 0){
					SND.play(sndResource.element)
				}
	
				if( sndResource.element.currentTime > 8 ){
					sndResource.element.currentTime = 0
				}
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
				if(sndResource.element != null){
					SND.volume(sndResource.element, volume)
				}
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
		if( state.camera.target != null ){

			const target = state.coords[ state.camera.target ]
			
			if( Util.distance(state.camera, target) > 10 ){
				state.camera.x = 
					state.camera.x + (target.x - state.camera.x) * 0.05
				state.camera.y = 
					state.camera.y + (target.y - state.camera.y) * 0.05
			}
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
		const c = state.hunter[hunter]
		if( c.family.children + c.family.adults > 0 ){

			SimpleCharacter(
				'v2', 'villager', { x: -25, y: -25, z: 0 } 
			)

		} else {
			delete state.characters.v2
		}

		if (c.family.children+c.family.adults > 4){

			SimpleCharacter(
				'v', 'villager', { x: -25, y: -25, z: 0 } 
			)
	
		} else {
			delete state.characters.v
		}

		if (c.family.children+c.family.adults > 8){

			SimpleCharacter(
				'v3', 'villager', { x: 25, y: -25, z: 0 }
			)

		} else {
			delete state.characters.v3
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
		const c = state.hunter[hunter]

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
								state.coords[c.id], {x:0,y:0,z:0}
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
			if ( state.resources.snd.fire.element != null ){
				SND.play( state.resources.snd.fire.element )
			}

			const c = state.hunter[hunter]
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
			const c = state.hunter[hunter]
			if( !state.characters[c.id].alive ){
		
				//eslint-disable-next-line no-undef
				paused = true

				if( state.resources.snd.fire.element != null ){
					SND.pause( state.resources.snd.fire.element )
				}
				if( state.resources.snd.walk.element != null ){
					SND.pause( state.resources.snd.walk.element )
				}
				
				//eslint-disable-next-line no-undef
				game.restartID = setTimeout(game.restart,8000)
			}
		}

		,restart(){
			const c = state.hunter[hunter]
			const d = state.deer[deer]

			c.day = 1
			c.carrying = false
			c.family = {
				status: 'healthy'
				,children: 2
				,adults: 2
				,starved: 0
			}
			c.status = 'peckish'
			state.coords[hunter].x = 100 * Util.random() * Util.even()
			state.coords[hunter].y = 40 * Util.random() * Util.even()
			state.coords[deer].x = -60
			state.coords[deer].y = -100

			state.camera.x = state.coords[hunter].x
			state.camera.y = state.coords[hunter].y - 10000

			d.spawnRadius = 5
			state.characters[c.id].alive = true
			// eslint-disable-next-line no-undef
			paused = false
			// eslint-disable-next-line no-undef
		}
	}


	state.camera.x = state.coords[hunter].x
	state.camera.y = state.coords[hunter].y - 10000
	systems$initAudioResources()
	state.spatialSounds.fire = {
		snd: 'fire'
		,coords: state.coords.f
	}
	systems$ui()
		
	state.loopingSounds.fire = 'fire'

	const can = /** @type {HTMLCanvasElement} */ (
		// eslint-disable-next-line no-undef
		document.getElementById('c')
	)
	const con = /** @type {CanvasRenderingContext2D} */ (
		can.getContext('2d')
	)

	// eslint-disable-next-line no-undef
	requestAnimationFrame(game.loop)

	// eslint-disable-next-line no-undef
	setInterval(systems$night,62.5)

}

App(state)