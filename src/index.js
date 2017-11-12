// @ts-check 
const m = /** @type {any} */ (
	// @ts-ignore
	// eslint-disable-next-line
	window.m
)


const uuid = () => Math.random().toString(15).slice(2)
const hunter = uuid()
const deer = uuid()
const night = uuid()

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
	
	@typedef {{
		resources: {
			img: { 
				[k:string]: { element: HTMLImageElement | null, src: string } 
			}
		}
		frames: {
			[k:string]: Provider.Frame
		}
		camera: Provider.Camera
		coords: {
			[k:string]: Provider.Coord
		}
		canvas: {
			[k:string]: Provider.Canvas
		}
	}} FrameState

 */
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
			, alpha: 1
		}
	},

	/**
	 * @param {HTMLImageElement | null} element
	 * @param {Provider.Frame} frame
	 */
	onload(element, frame){
		if( element != null ){
			const image = element

				frame.count = 
					image.width / image.height
	
				// the height of the strip is the width of a frame
				frame.width = image.height
	

			frame.index = 0
		}
	},

	/**
	 	@param {FrameState} state
	 	@param {Provider.Frame} frame
	 	@param {string} imageId
	 */
	reset(state, frame, imageId){

		if( imageId != null ){

			const image = 
				state.resources.img[imageId].element
			
			frame.imageId = imageId
	
			if(image != null){
	
				if( image.complete ){
	
					Frame.onload(image, frame)
				} else {
					image.onload = () => 
						Frame.onload(image, frame)
				}
	
				// todo-james why is this happening here?
				frame.count = image.width / image.height
				frame.width = image.height
			}
		}
		
		frame.index = 0
		
	},

	/**
		@param { CanvasRenderingContext2D } con 

	 	@param {FrameState} state
		 
	 	@param {Provider.Frame} frame
	 */
	draw(con, state, frame){

		if( frame.imageId != null ){

			const image =
				state.resources.img[frame.imageId].element

			if( image != null && image.complete ){

				const sx = 
					Math.floor(frame.index)*frame.width;

				const sy = 0;
				const sWidth = frame.width;
				const sHeight = frame.width;
				// positioning within the canvas handled by other systems
				const dx = 0;
				const dy = 0;
				const dWidth = frame.width;
				const dHeight = frame.width;

				if( dWidth > 0 && dHeight > 0 ){

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
		}
	},

	/**
		@param { CanvasRenderingContext2D } con 

	 	@param {FrameState} state

	 	@param {Provider.Frame} frame
	 */
	next(con, state, frame){

		Frame.draw(con, state, frame)

		frame.index = frame.index + frame.playspeed
		
		if( Math.floor(frame.index) +1 > frame.count ){
			if( frame.repeat ){
				frame.index = 0
			} else {
				frame.index = frame.count - 1
			}
		}
	},

	/**
		@param { FrameState } state 
	*/
	system( state ) {
				
		Object.keys(state.frames)
		.forEach(function(id){
			
			const frame = state.frames[id]
			if( id in state.canvas ){

				const canvas = state.canvas[id]
				const con = canvas.context
	
				con.scale(frame.scale, frame.scale)
				Frame.next(con, state, frame)
			}
		})
	}
	
}

/** 
	@typedef {{ 
		mute: boolean 
		resources: {
			snd: { [k:string]: { element: HTMLAudioElement | null } }
		}
	}} SNDState
*/
const SND = {
	
	/** 
		@param {SNDState} state
		@param {HTMLAudioElement} audio 
	*/
	play(state, audio){
		if( !state.mute ){
			audio.play()
		}
	},
	
	/** @param {HTMLAudioElement} audio */
	pause(audio){
		audio.pause()
	},

	/** 
		@param {SNDState} state
		@param {HTMLAudioElement} audio 
		@param {number} x 
	*/
	volume(state, audio, x){
		if(!state.mute){
			audio.volume = x
		}
	},

	/**
	 * @param {SNDState} state
	 * @param {boolean} x 
	 */
	setMute(state, x){
	
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
}

/**
	@typedef {
		{ keys: { DOWN: { [k:string]: number } } } & SNDState 
	} KeyState
*/

const Keys = {
	
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40,
	ARROW_UP: 38,
	ARROW_LEFT: 37,
	SPACE: 32,
	F: 70,

	/**
	 *
	 * @param {KeyState} state 
	 */
	init(state){
		/**
		 * @param {KeyboardEvent} e
		 */
		// eslint-disable-next-line no-undef
		window.onkeyup = (e) => {
			if( e.keyCode == 77 /* M */){	
				SND.setMute(state, !state.mute)
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

	}
}

/**
	@typedef {{
		verbs: { [k:string]: Provider.Verb[] }
		frames: { [k:string]: Provider.Frame }
		characters: { [k:string]: Provider.Character }
	} & FrameState & SNDState } CharacterState
 */
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
			, speed: { x: 4, z: 4 }
			, action: 'idle'
			, alive: true
			, respawnId: null
		}
	},


	/**
	 * @param {CharacterState} state
	 * @param {string} id 
	 * @param {string} name 
	 * @param {Provider.Coord} coords 
	 */
	initSimpleCharacter(state, id, name, coords){
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
	},

	/**
	 * @param { CharacterState } state
	 * @param { Provider.Character } character
	 */
	initSprites( state, character ){

		const verbs = state.verbs[character.id]

		for( let verb of verbs ){
			for( let position of verb.positions ){

				if ( ! (position in verb.images) ){

					// eslint-disable-next-line no-undef
					const image = new Image()

					const src =
						'resources/img/characters/'
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
		}

	},

	/**
	 * @param { CharacterState } state
	 * @param {Provider.Character} o 
	 */
	update(state, o){
		
		const verbs = state.verbs[o.id]

		for( let verb of verbs ){
			if( 
				o.action == verb.name 
				&& verb.positions.indexOf(o.position) > -1 
			){
				if( !(o.imageId == verb.images[o.position]) ){
					o.imageId = verb.images[o.position]
					
					const frame = state.frames[o.id]

					// todo-james make family/villager fade if they are starving
					frame.alpha = 1
					Frame.reset(
						state,
						state.frames[o.id], 
						verb.images[o.position]
					)
				}
				break
			}
		}
	},
	/**
	 * @param { CharacterState } state
	 */
	system(state){
		Object.keys(state.characters).forEach(function(k){
			const character = state.characters[k]
			Character.initSprites( state, character )
			Character.update( state, character )
		})
		
	}
}

/**
	@typedef {
		{

			deer: {
				[k:string]: Provider.Deer
			}

			hunter: {
				[k:string]: Provider.Hunter
			}
			
		} & CharacterState
	} DeerState

*/
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
	 * @param {DeerState} state 
	 * @param {string} id 
	 */
	init(state, id){
		state.deer[id] = Deer.of(id)
		state.frames[id] = Frame.of()
		state.frames[id].scale = 4
	
		state.coords[id] = { x: 60, y: 0, z: -100 }
		state.verbs[id] =
			[ Verb('idle', ['left', 'right'])
			, Verb('run', ['right', 'left'])
			, Verb('die', ['right', 'left'])
			]
			
		state.characters[id] =
			Character.of({
				id: id
				,name: 'deer'
				,position: 'left'
			})
	},
	

	/**
	 * @param {DeerState} state
	 * @param {Provider.Deer} deer 
	 * @param {Provider.Hunter} other 
	 */
	// todo pass in an id not an object for other
	canSee(state, deer, other){
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
			&& me.p.z - 50 < them.p.z
			&& them.p.z < me.p.z + 50

			|| me.c.position == 'left'
			&& me.p.x > them.p.x
			&& them.p.x > me.p.x - 100
			&& me.p.z - 50 < them.p.z
			&& them.p.z < me.p.z + 50
		) 
	},


	/**
	 * @param {DeerState} state
	 * @param {Provider.Deer} deer 
	 * @param {Provider.Hunter} other 
	 */
	act(state, deer, other){
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
		} else if ( Deer.canSee(state, deer, other) ){
			me.c.action = 'run'
			me.c.position = me.c.position == 'left' ? 'right' : 'left'
		} else if (
			me.c.action == 'run'
			&& Util.distance(them.p, me.p) < 150
		) {
			me.p.x = me.p.x + ( 
				me.c.position == 'left' ? -1 : 1 
			) * me.c.speed.x
		} else if ( me.c.action == 'run' ){
			me.c.position = 
				me.c.position == 'right' ? 'left' : 'right'
			
			me.c.action = 'idle'
		} else {
			me.c.action = 'idle'
		}
	},


	/**
	 * @param {DeerState} state
	 * @param {Provider.Deer} deer 
	 */
	respawn(state, deer){

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
		me.p.z = Util.randomInt(200)
		me.c.alive = true
		me.c.action = 'idle'
		me.c.position = 
			me.c.position == 'right' ? 'left' : 'right'
		state.frames[me.c.id].repeat = true
		deer.spawnRadius = deer.spawnRadius + 10
	},

	/**
	 * @param {DeerState} state
	 */
	system(state){
		
		Deer.act(state, state.deer[deer], state.hunter[hunter])
		
		if( 
			state.characters[deer].alive == false 
			&& state.deer[deer].respawnId == null 
		) {

			state.deer[deer].respawnId = 
				// eslint-disable-next-line no-undef
				setTimeout( 
					() => {
						Deer.respawn(state, state.deer[deer])
						state.deer[deer].respawnId = null
					}
					, 2000 
				)
		}
	}

}


/**
	@typedef {
		{

			deer: {
				[k:string]: Provider.Deer
			}

			hunter: {
				[k:string]: Provider.Hunter
			}
			
		} & CharacterState & KeyState
	} HunterState

*/
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

	/**
	 * 
	 * @param {HunterState} state 
	 * @param {string} id 
	 */
	init(state, id){
		state.verbs[id] = 
			[ Verb('idle', ['front', 'left', 'right', 'back'])
			, Verb('walk',['front'])
			, Verb('walk',['left'])
			, Verb('walk',['right'])
			, Verb('walk',['back'])
			, Verb('attack',['front','left','right','back'])
			, Verb('carry',['front','left','right','back'])
			]
	
		state.hunter[id] = Hunter.of(id)
	
		state.frames[id] = Frame.of()
		state.frames[id].scale = 4
	
		state.coords[id] = { x: 100, y: 0, z: 40 }
	
		state.characters[id] =
			Character.of({
				id: id
				,name: 'hunter'
				,position: 'left'
			})
	},
	
	statuses: [ 'starving', 'hungry', 'peckish', 'healthy'],

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter 
	 * @param {Provider.Deer} deer 
	 */
	kill(state, hunter, deer){
		
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
						state,
						state.resources.snd.drum2.element
					)
				}
			} else {
				if( state.resources.snd.drum4.element != null ){
					state.resources.snd.drum4.element
						.currentTime = 1
					
					SND.play(
						state,
						state.resources.snd.drum4.element
					)
				}
			}
		} else {
			if( state.resources.snd.drum3.element != null){

				state.resources.snd.drum3.element
					.currentTime = 1

				SND.play(
					state,
					state.resources.snd.drum3.element
				)
			}

		}
	},

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter 
	 */
	hunger(state, hunter){
		const { id, day, family } = hunter
		const statuses = Hunter.statuses


		const [me] = 
			[ id ]
				.map(
					id => ({
						c: state.characters[id]
						,p: state.coords[id]
					})
				)
		
		if( hunter.status == 'starving' ){
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
			statuses[statuses.indexOf(hunter.status) - 1] || 'dead'

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
			statuses[statuses.indexOf(family.status) - 1] || family.status
	},

	/**
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter
	 */
	eat(state, hunter){
		
		const { status, family } = hunter

		const statuses = Hunter.statuses

		if( state.resources.snd.drum5.element != null ){
			SND.play(state, state.resources.snd.drum5.element)
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
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter 
	 */
	feed(state, hunter){

		if( state.resources.snd.drum6.element != null ){
			SND.play(state, state.resources.snd.drum6.element)
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
	 * @param {HunterState} state
	 * @param {Provider.Hunter} hunter
	 * @param {Provider.Deer} deer
	 */
	act(state, hunter, deer){
		
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

		me.c.speed = {x: newSpeed, z: newSpeed}
		state.frames[me.c.id].playspeed = newPlayspeed
		
		if( carrying ){
			me.c.action = 'carry'
			if (state.keys.DOWN[Keys.ARROW_UP] ){
				me.c.position = "back"
				me.p.z = me.p.z-1*me.c.speed.z
			} else if (state.keys.DOWN[Keys.ARROW_DOWN]) {
				me.c.position = "front"
				me.p.z= me.p.z + 1*me.c.speed.z
			} else if ( state.keys.DOWN[Keys.ARROW_LEFT] ){
				me.c.position = "left"
				me.p.x= me.p.x-1*me.c.speed.x
			} else if ( state.keys.DOWN[Keys.ARROW_RIGHT] ){
				me.c.position = "right"
				me.p.x= me.p.x + 1*me.c.speed.x
			} else if (state.keys.DOWN[Keys.F]){

				me.c.action = "walk"
				hunter.carrying = false
				if (Util.distance(me.p,{x:0,y:0,z:0})<75){
					Hunter.feed(state, hunter)
				} else {
					Hunter.eat(state, hunter)
				}
			}
		} else if ( state.keys.DOWN[Keys.SPACE] ){
			me.c.action = 'attack'
			Hunter.kill( state, hunter, deer )
		} else if ( state.keys.DOWN[Keys.ARROW_UP] ){
			me.c.action = 'walk'
			me.c.position = 'back'
			me.p.z = me.p.z - 1 * me.c.speed.z
		} else if ( state.keys.DOWN[Keys.ARROW_DOWN] ){
			me.c.action = 'walk'
			me.c.position = 'front'
			me.p.z = me.p.z  +  1 * me.c.speed.z
		} else if ( state.keys.DOWN[Keys.ARROW_LEFT] ){
			me.c.action = 'walk'
			me.c.position = 'left'
			me.p.x = me.p.x - 1 * me.c.speed.x
		} else if ( state.keys.DOWN[Keys.ARROW_RIGHT] ){
			me.c.action = 'walk'
			me.c.position = 'right'
			me.p.x = me.p.x  +  1 * me.c.speed.x
		} else {
			me.c.action = 'idle'
		}

		if (me.c.action == "walk"){
			if( state.resources.snd.walk.element != null ){
				SND.play(state, state.resources.snd.walk.element)
				if (state.resources.snd.walk.element.currentTime>4){
					state.resources.snd.walk.element.currentTime = 0
				}
			}
		} else {
			if( state.resources.snd.walk.element != null ){
				state.resources.snd.walk.element.pause()  
			}
		}
	},

	/**
	 * @param {HunterState} state
	 */
	system(state){
		
		Object.keys( state.hunter )
		
			.reduce(function(p, me){

				return p.concat(
					Object.keys( state.deer ).map(
						you => ({ me, you })
					)
				)
			}, /** @type { {me:string, you:string}[] } */ ([]) )

			.forEach(function({ me, you }){
				Hunter.act(state, state.hunter[me], state.deer[you])
			})			
	}
}

/**
 
	@typedef {{ timeOfDay:number, increment: number }} Night

	@typedef {{
		night: {
			[k:string]: Night
		}
	} & HunterState } NightState

*/
const Night = {

	/**
	 * @returns { Night }
	 */
	of(){
		return {
			timeOfDay: 0,
			increment: 0.1
		}
	},

	/**
	 * 
	 * @param {NightState} state 
	 * @param {string} id 
	 */
	init(state, id){
		state.night[id] = Night.of()
	},

	/**
	 * @param {NightState} state 
	 */
	system(state){
		
		Object.keys( state.night ).forEach(function(id){

			Object.keys( state.hunter ).forEach(function(hunterId){

				const c = state.hunter[hunterId]
				state.night[id].timeOfDay = 
					state.night[id].timeOfDay + state.night[id].increment

				if( state.night[id].timeOfDay > 1 ){
					state.night[id].increment = -0.0125
				} else if ( 
					state.night[id].timeOfDay < 0 
					&& state.characters[c.id].alive 
				){
					state.night[id].increment = 0.0125
					c.day = c.day + 1
					Hunter.hunger(state, c)
		
					if(state.resources.snd.drum1.element != null){
						SND.play( state, state.resources.snd.drum1.element )
					}
		
					if( c.day % 10 == 0 && c.family.children > 0 ){
						c.family.adults = c.family.adults + 1
						c.family.children = c.family.children - 1
					}
				}
			})
		})
	}
}

/**
	@typedef {
		{
			loopingSounds: {
				[k:string]: string
			}
		} & SNDState
	} LoopingSoundsState
 */
const LoopingSounds = {

	/**
	* @param {LoopingSoundsState} state 
	*/

	system(state){
		Object.keys(state.loopingSounds).forEach(function(k){
			const sndId = state.loopingSounds[k]
			const sndResource = state.resources.snd[sndId]

			if( sndResource.element != null ){
				if(SND.currentTime == 0){
					SND.play(state, sndResource.element)
				}
	
				if( sndResource.element.currentTime > 8 ){
					sndResource.element.currentTime = 0
				}
			}
			
		})
	}
}


/**
	@typedef {{
		spatialSounds: {
			[k:string]: Provider.SpatialSound
		}
		camera: Provider.Camera
	} & SNDState} SpatialSoundState
 */
const SpatialSounds = {

	/**
	 * 
	 * @param {string} id 
	 * @param {Provider.Coord} coords 
	 */
	of(id, coords){
		return {
			snd: id,
			coords
		}
	},

	/**
	 * 
	 * @param {SpatialSoundState} state 
	 */
	system(state){
		Object.keys(state.spatialSounds).forEach(function(k){
			const sndObj = state.spatialSounds[k]	
			const sndResource = state.resources.snd[sndObj.snd]
			const volume = 
				1-Math.min(1, Util.distance(sndObj.coords,state.camera) / 1000 )
			
			if( volume > 0 && volume < 1 ){
				if(sndResource.element != null){
					SND.volume(state, sndResource.element, volume)
				}
			}
		})
	}
}

const DPI = {

	/**
	 * @param {{ camera: Provider.Camera }} state 
	 */
	system(state){
		// eslint-disable-next-line no-undef
		if( window.innerWidth > 800 ){
			state.camera.scale = { x:2, y: 2 }
		} else {
			state.camera.scale = { x:1, y: 1 }
		}
	}
}

const Canvas = {
	/**

	 	@param {{
			 canvas: {
				 [k:string]: {
					 element: HTMLCanvasElement | null
					 context: CanvasRenderingContext2D
				 }
			 }
	 	}} state 
	 */
	system(state){
		Object.keys( state.canvas ).forEach(function(id){
			const canvas = state.canvas[id]

			if( canvas.element != null ){
				
				canvas.element.width = canvas.element.width
				canvas.context.imageSmoothingEnabled = false
			}
		})
	}
}


const Camera = {
	/**

	 	@param {{
			camera: Provider.Camera
			coords: {
				[k:string]: Provider.Coord
			}
		}} state 
	 */
	system(state){
		if( state.camera.target != null ){

			const target = state.coords[ state.camera.target ]
			
			if( Util.distance(state.camera, target) > 10 ){
				state.camera.x = 
					state.camera.x + (target.x - state.camera.x) * 0.05
				state.camera.y = 
					state.camera.y + (target.y - state.camera.y) * 0.05
				state.camera.z = 
					state.camera.z + (target.z - state.camera.z) * 0.05
			}
		}
	}
}

const UI = {

	/**
	 	@param { NightState } state 
	 */
	system(state){
		const c = state.hunter[hunter]
	
		m.render(
			// eslint-disable-next-line no-undef
			document.body
			,m('div'
				,{
					style: {
						width: '100%',
						height: '100%',
						backgroundColor: '#EEEEB8',						
					//	overflow: 'hidden'
					}
				}
				,Object.keys(state.night).map(function(id){
					const night = state.night[id]

					return m('div'
						,{
							style: {
								width: '100vw',
								height: '100vh',
								top: '0px',
								left: '0px',
								position: 'absolute',
								mixinMode: 'screen',
								opacity: night.timeOfDay,
								backgroundColor: 
									'rgb(0,0,50)'
								
							}
						}
					)
				})
				,m('div'
					,{
						style: {
							width: '100%'
							,height: '100%'
							,transitionDuration: '1s'
							,transform:
								
								'scale3d('+[
									state.camera.scale.x
									, state.camera.scale.y
									, 1
								]+')'
						}
					}
					,m('div#camera-indicators'
						,{
							style: {
								position: 'absolute'
								,transformStyle: 'preserve-3d'
								,transform: [
									'translateY(50px)'

									,'translate('+[
										'calc( 100vw / 2 - 50%)'
										,'calc( 100vh / 2 - 50%)'
									]+')'
									
									,'perspective('+512+'px)'
									,'rotateX(-15deg)'
									,'translate3d('+[
										-state.camera.x+'px'
										,-state.camera.y+'px'
										,(-state.camera.z)+'px'
									]+')'
								]
								.join(' ')
							}
							
						}
						,m('div#ground', {
							style: {
								position: 'absolute'
								, width: '400px'
								, height: '400px'
								, imageRendering: 'pixelated'
								, backgroundImage: 'url(https://cdna.artstation.com/p/assets/images/images/006/295/124/large/sergiu-matei-grass-tile-pixel-art-rpg-top-view-indie-game-dev-matei-sergiu.jpg)'
								, backgroundRepeat: 'repeat'
								, backgroundSize: 'calc( 100% * 1/64 )'
								, opacity: 1
								, filter: 'brightness(0.5)'
								, borderRadius: '100%'
								, transform: 
									'translateY(-150px) rotateX(90deg) rotateZ(45deg) scale(-1, -1) scale(16, 16)'	
							}
						})
						,m('div#mountain', {
							style: {
								position: 'absolute'
								, width: '800px'
								, height: '600px'
								, imageRendering: 'pixelated'
								, backgroundImage: 'url(https://static3.scirra.net/images/newstore/products/3053/ss1.png)'
								, transform: 
									'translateZ(-10000px) translateY(-600px) rotateZ(180deg) scale(-1, -1) scale(32, 32)'	
							}
						})
						,m('div#feedRadius', {
							style: {

								position: 'absolute'
								, width: '150px'
								, height: '150px'
								, borderRadius: '100%'
								, opacity: '0.8'
								, border: 'solid 5px pink'
								, transform: 
									'translate(-50%,-50%) translateY(32px) rotateX(90deg)'	
							}		
						})
					)
					,m('div#camera-game'
						,{
							style: {
								position: 'absolute'
								,transformStyle: 'preserve-3d'
								,transform: [
									'translateY(50px)'
									,'translate('+[
										'calc( 100vw / 2 - 50%)'
										,'calc( 100vh / 2 - 50%)'
									]+')'
									
									,'perspective('+512+'px)'
									,'rotateX(-15deg)'
									,'translate3d('+[
										-state.camera.x+'px'
										,-(state.camera.y)+'px'
										,(-state.camera.z)+'px'
									]+')'
								]
								.join(' ')
							}
							
						}
						,Object.keys(state.frames).map(function(id){
							
							const frame = state.frames[id]
							const coords = state.coords[id]

							return m('canvas', {
								id,
								key: id,
								style: {
									top: '0px',
									left: '0px',
									position: 'absolute',
									opacity: frame.alpha,
									transform: [
										'translate(-50%, -50%)'
										,'translate3d('+[
											coords.x+'px',
											coords.y +'px',
											coords.z+'px'
										]+')'
										
									].join(' ')
								},
								width: frame.width * frame.scale,
								height: frame.width * frame.scale,
								/**
								 * @param {{ dom: HTMLCanvasElement }} vnode 
								 */
								onupdate(vnode){
									
									const el = vnode.dom

									const con =
										el.getContext('2d')

									if( el != null && con != null){
										state.canvas[id] = {
											element: el,
											context: con
										}
									}
								},

								onremove(){
									if( id in state.canvas ){
										delete state.canvas[id]
									}
								}
							})
						})
					)
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
}


const Villager = {
	/**
	 	@param {HunterState} state 
	 */
	system(state){
		const c = state.hunter[hunter]
	
		{
			const exists = 'v2' in state.characters
			const shouldExist = c.family.children + c.family.adults > 0 

			if( shouldExist && !exists ){
				Character.initSimpleCharacter(
					state, 'v2', 'villager', { x: -30, y: 0, z: -20 } 
				)
			} else if(!shouldExist && exists) {
				Object.keys(state).forEach(function(component){
					// @ts-ignore
					// eslint-disable-next-line fp/no-mutation
					delete state[component].v2
				})
			}
		}

		{
			const exists = 'v' in state.characters
			const shouldExist = c.family.children+c.family.adults > 4

			if( shouldExist && !exists ){
				Character.initSimpleCharacter(
					state, 'v', 'villager', { x: 0, y: 0, z: -40 } 
				)
			} else if(!shouldExist && exists) {
				Object.keys(state).forEach(function(component){
					// @ts-ignore
					// eslint-disable-next-line fp/no-mutation
					delete state[component].v
				})
			}
		}
	
		{
			const exists = 'v3' in state.characters
			const shouldExist = c.family.children+c.family.adults > 8

			if( shouldExist && !exists ){
				Character.initSimpleCharacter(
					state, 'v3', 'villager', { x: 30, y: 0, z: -20 } 
				)
			} else if(!shouldExist && exists) {
				Object.keys(state).forEach(function(component){
					// @ts-ignore
					// eslint-disable-next-line fp/no-mutation
					delete state[component].v3
				})
			}
		}
	}
}

const Game = {

	paused: false,
	
	/**
	 * 
	 * @param {Provider.State & NightState} state 
	 */	
	init(state){

		// @ts-ignore
		// eslint-disable-next-line no-undef
		window.state = state

		// eslint-disable-next-line no-undef
		requestAnimationFrame( () => Game.system(state) )

		// eslint-disable-next-line no-undef
		setInterval( () => Night.system(state), 62.5 )

		Keys.init(state)
		Night.init(state, night)


		Deer.init(state, deer)
		Hunter.init(state, hunter)

		Character.initSimpleCharacter(
			state, 
			'f', 
			'fire', 
			{ x:0, y:20, z:0 }
		)
		
		
		state.camera.x = 0//state.coords[hunter].x 
			// + Util.even() * Util.random() * 10000
		state.camera.y = -1000
			// + 50 + Util.random() * 10000
		state.camera.z = 3000//state.coords[hunter].z
			// + Util.even() * Util.random() * 10000

		Game.initAudioResources(state)
		state.spatialSounds.fire = {
			snd: 'fire'
			,coords: state.coords.f
		}
			
		state.loopingSounds.fire = 'fire'

		UI.system(state)
	},


	/**
	 * @param {Provider.State & NightState} state 
	 */
	initAudioResources(state){

		SND.setMute(state, state.mute)
		
		Object.keys(state.resources.snd)
			.forEach(function(id){
				const o = state.resources.snd[id]

				// eslint-disable-next-line no-undef
				o.element = new Audio()
				o.element.src = o.src
			})
	},

	/**
	 * @param {Provider.State & NightState} state 
	 */
	system(state){

		// eslint-disable-next-line no-undef
		if ( state.resources.snd.fire.element != null ){
			SND.play( state, state.resources.snd.fire.element )
		}

		const c = state.hunter[hunter]
		state.camera.target = c.id

		if( !Game.paused ){
			Camera.system(state)
			Canvas.system(state)
			DPI.system(state)
			Villager.system(state)
			Deer.system(state)
			Hunter.system(state)
			Character.system(state)
			Frame.system(state)
			LoopingSounds.system(state)
			SpatialSounds.system(state)
			Game.status(state)
		}
		
		UI.system(state)

		// eslint-disable-next-line no-undef
		requestAnimationFrame( () => Game.system(state) )
	},

	/**
	 * @param {Provider.State & NightState} state 
	 */
	status(state){
		const c = state.hunter[hunter]
		if( !state.characters[c.id].alive ){
	
			//eslint-disable-next-line no-undef
			Game.paused = true

			if( state.resources.snd.fire.element != null ){
				SND.pause( state.resources.snd.fire.element )
			}
			if( state.resources.snd.walk.element != null ){
				SND.pause( state.resources.snd.walk.element )
			}
			
			//eslint-disable-next-line no-undef
			Game.restartID = setTimeout(() => Game.restart(state),8000)
		}
	},

	/**
	 * @param {Provider.State & NightState} state 
	 */
	restart(state){
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
		state.coords[hunter].z = 40 * Util.random() * Util.even()
		state.coords[deer].x = -60
		state.coords[deer].z = -100

		state.camera.x = state.coords[hunter].x
		state.camera.z = state.coords[hunter].z - 10000

		d.spawnRadius = 5
		state.characters[c.id].alive = true
		// eslint-disable-next-line no-undef
		Game.paused = false
		// eslint-disable-next-line no-undef
	}
}

Game.init({
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
	,coords: {}
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
	,night: {}
	,hunter: {}
	,deer: {}
	,spatialSounds:{}
	,loopingSounds: {}
	,canvas: {}

})