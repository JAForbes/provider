Keys =
  DOWN: []
  ARROW_RIGHT: 39
  ARROW_DOWN: 40
  ARROW_UP: 38
  ARROW_LEFT: 37
  SPACE : 32
  F : 70

window.Util =
  distance : (p1,p2) ->
    xs = ys = 0
    xs = p2.x - p1.x
    xs = xs * xs
 
    ys = p2.y - p1.y
    ys = ys * ys
    Math.sqrt( xs + ys )

  random : (multiplier=1) ->
    Math.random() * @even() * multiplier

  randomInt : (multiplier=1) ->
    Math.floor(@random(multiplier))

  even : () ->
    if Math.random() > 0.5 then 1 else -1

window.onkeyup = (e) ->
  delete Keys.DOWN[1*e.keyCode]

window.onkeydown = (e) ->
  Keys.DOWN[1*e.keyCode] = true
  switch e.keyCode
    when 32,37,38,39,40
      e.preventDefault()

can = document.getElementById 'c'
con = can.getContext '2d'

class Verb
  constructor : (@name,@positions) -> #e.g walk,[left,right,front,back]
    @images = {}

class Frame
  constructor : () ->
    @count = 0
    @width = 0
    @index = 0
    @position = 0
    @image = undefined
    @playspeed = 1/4
    @repeat = true
  onload : () =>
    @count = @image.width/@image.height
    @width = @image.height
    @index = 0
  
  reset : (image) ->
    @image = image
    image.onload = @onload
    @count = @image.width/@image.height
    @width = @image.height
    @index = 0

  draw : () ->
    con.drawImage(@image,Math.floor(@index)*@width,0,@width,@width,-@width/2,-@width/2,@width,@width)

  next : () ->
    @draw()
    @index += @playspeed
    if Math.floor(@index)+1 > @count
      if @repeat
        @index = 0
      else
        @index = @count-1
    @position = @index*@width

class Character
  constructor : (@name,@verbs,@x=0,@y=0) ->
    @image = undefined
    @position = undefined
    @idles = {}
    @initSprites()
    @frame = new Frame()
    @action = "idle"
    @speed = 8
    @alive = true
    @respawnId = undefined

  initSprites : () ->
    positions = []
    for verb in @verbs
      for position in verb.positions
        verb.images[position] = new Image()
        verb.images[position].src = "img/larger/characters/#{@name}/#{position}_#{verb.name}.png"
        positions.push position unless position in positions

    for position in positions
      @idles[position] = {}
      @idles[position].image = new Image()
      @idles[position].image.src = "img/larger/characters/#{@name}/#{position}_idle.png"

    @position = positions[0]

  chooseAction : () ->
    undefined

  die : () =>
    if(@alive)
      @alive = false
      @respawnId = setInterval @respawn, 2000


  update : () ->
    for verb in @verbs
      if @action is verb.name and @position in verb.positions
        #set image if not already set
        unless @image is verb.images[@position]
          @image = verb.images[@position]
          @frame.reset(@image)
        break

    unless @action is "idle"
      @frame.next()
    else
      unless @image is @idles[@position].image
        @image = @idles[@position].image  
        @frame.reset(@image)
      @frame.next()

class Dear extends Character
  constructor : (@name,@verbs,@x,@y) ->
    super(@name,@verbs,@x,@y)
    @spawnRadius = 5

  canSee : (character) =>
    @position is "right" and @x <character.x < @x+100 and @y-50< character.y <@y+50 or 
    @position is "left" and @x > character.x > @x-100 and @y-50< character.y <@y+50

  act : (character) =>
    unless @alive
      @action = "die"
      @frame.repeat = false
    else if @canSee character
      @action = "run"
      @position = if @position is "right" then "left" else "right"
    
    else if @action is "run" and Util.distance(character,@) < 150
      if @position is "left"
        @x-=1*@speed
      else if @position is "right"
        @x+=1*@speed

    else if @action is "run"
      @position = if @position is "right" then "left" else "right"
      @action = "idle"
      
    else 
      @action = "idle"

  respawn : () =>
    clearInterval @respawnId
    @x = @x+Util.randomInt(@spawnRadius)
    @y = Util.randomInt(200)
    @alive = true
    @action = "idle"
    @position = if @position is "right" then "left" else "right"
    @frame.repeat = true
    @spawnRadius+=10

class Element 
  constructor : (@x,@y,@imagePath) ->
    @frame = new Frame()
    @image = new Image()
    @image.src = @imagePath
    @frame.reset(@image)

  update : () ->
    @frame.next()

class Hunter extends Character
  constructor : (@name,@verbs,@x,@y) ->
    super(@name,@verbs,@x,@y)
    @carrying = false
    @family =
      status : "healthy"
      children : 2
      adults : 2
      starved : 0
    @status = "peckish"

  kill : (character) ->
    if(Util.distance(@,character)<60)
      if(character.alive)
        character.die()
        @carrying = true
        document.getElementById("snd_drum2").currentTime = 1
        document.getElementById("snd_drum2").play()
      else
        document.getElementById("snd_drum2").currentTime = 1
        document.getElementById("snd_drum4").play()
    else
      document.getElementById("snd_drum2").currentTime = 1
      document.getElementById("snd_drum3").play()

  hunger : () ->
    if @status is "starving"
      if @alive
        @alive = false
        @status = "dead"
        console.log "you lasted #{day} days but you have starved..."
    @status = "starving" if @status is "hungry"
    @status = "hungry" if @status is "peckish"
    @status = "peckish" if @status is "healthy"

    if @family.status is "starving"
      if @family.adults > 0
        @family.adults--
        @family.starved++
      else if @family.children > 0
        @family.children--
        @family.starved++



    @family.status = "starving" if @family.status is "hungry"
    @family.status = "hungry" if @family.status is "peckish"
    @family.status = "peckish" if @family.status is "healthy"
    
  eat : () ->
    document.getElementById("snd_drum5").play()
    console.log "eat"
    @status = "healthy" if @status is "peckish"
    @status = "peckish" if @status is "hungry"
    @status = "hungry" if @status is "starving"
    if c.family.status is "healthy" and c.family.adults>0
      c.family.children++
  feed : () ->
    document.getElementById("snd_drum6").play()
    console.log "feed"
    @family.status = "healthy" if @family.status is "peckish"
    @family.status = "peckish" if @family.status is "hungry"
    @family.status = "hungry" if @family.status is "starving"
    if c.family.status is "healthy" and c.family.adults>0
      c.family.children++

  act : (d) ->
    switch @status
      when "healthy"
        @speed = 10
        @frame.playspeed = 1/3
      when "peckish"
        @speed = 6
      when "hungry"
        @speed = 5
        @frame.playspeed = 1/4
      when "starving"
        @speed = 3
        @frame.playspeed = 1/5


    if @carrying
      @action = "carry"
      if Keys.DOWN[Keys.ARROW_UP] 
        @position = "back"
        @y-=1*@speed
      else if Keys.DOWN[Keys.ARROW_DOWN]
        @position = "front"
        @y+=1*@speed
      else if Keys.DOWN[Keys.ARROW_LEFT]
        @position = "left"
        @x-=1*@speed
      else if Keys.DOWN[Keys.ARROW_RIGHT]
        @position = "right"
        @x+=1*@speed
      else if Keys.DOWN[Keys.F]
        @action = "walk"
        @carrying = false
        if Util.distance(@,{x:0,y:0})<75
          @feed()
        else
          @eat()
        console.log @status
    else if Keys.DOWN[Keys.SPACE]
      @action = "attack"
      @kill(d)
    else if Keys.DOWN[Keys.ARROW_UP] 
      @action = "walk"
      @position = "back"
      @y-=1*@speed
    else if Keys.DOWN[Keys.ARROW_DOWN]
      @action = "walk"
      @position = "front"
      @y+=1*@speed
    else if Keys.DOWN[Keys.ARROW_LEFT]
      @action = "walk"
      @position = "left"
      @x-=1*@speed
    else if Keys.DOWN[Keys.ARROW_RIGHT]
      @action = "walk"
      @position = "right"
      @x+=1*@speed
    else
      @action = "idle"

    if @action is "walk"
      document.getElementById('snd_walk').play()
      if document.getElementById('snd_walk').currentTime>4
        document.getElementById('snd_walk').currentTime = 0
    else
      document.getElementById('snd_walk').pause()

window.c = new Hunter("hunter",
  [
    new Verb("walk",["front"])
    new Verb("walk",["left"])
    new Verb("walk",["right"])
    new Verb("walk",["back"])
    new Verb("attack",["front","left","right","back"])
    new Verb("carry",["front","left","right","back"])
  ],100,40
)

window.d = new Dear("dear",
    [
      new Verb("run",["right","left"]),
      new Verb("die",["right","left"])
    ],-60,-100
)

f = new Element(0,0,"img/larger/elements/fire/idle.png")
v = new Element(0,-40,"img/larger/elements/villager/idle.png")
v2 = new Element(-25,-25,"img/larger/elements/villager/idle.png")
v3 = new Element(25,-25,"img/larger/elements/villager/idle.png")

timeOfDay  = 0
day = 1
increment = 0.1

game =
  loopID : undefined
  restartID : undefined
  loop : () ->
    can.width = can.width
    con.translate(can.width/2,can.height/2)
    #villagers
    if c.family.children+c.family.adults > 0
      con.save()
      con.translate(v2.x-c.x,v2.y-c.y)
      v2.update()
      con.restore()

    if c.family.children+c.family.adults > 4
      con.save()
      con.translate(v.x-c.x,v.y-c.y)
      v.update()   
      con.restore()

    if c.family.children+c.family.adults > 8
      con.save()
      con.translate(v3.x-c.x,v3.y-c.y)
      v3.update()   
      con.restore()

    #fire
    con.save()
    con.translate(f.x-c.x,f.y-c.y)
    f.update()
    con.restore()

    #deer
    con.save()
    con.translate(d.x-c.x,d.y-c.y)
    d.act(c)
    d.update()
    con.restore()

    #hunter
    con.save()
    c.act(d)
    c.update()
    con.restore()
    fire = document.getElementById("snd_fire")
    if(fire.currentTime is 0)
      fire.play()
    if(fire.currentTime>8)
      fire.currentTime = 0
    volume = 1-(Util.distance(c,{x:0,y:0})/200)
    fire.volume = volume if 0 < volume < 1
    game.status()
  
  night : () ->
    can.style.backgroundColor = "rgba(0,0,50,#{timeOfDay})"
    timeOfDay+=increment
    if timeOfDay>1
      increment=-0.0125
    else if timeOfDay<0 and c.alive
      increment = 0.0125
      day++
      c.hunger()
      document.getElementById("snd_drum1").play()
      if day %10 is 0 and c.family.children > 0
        c.family.adults++
        c.family.children--


  restart : () ->
    clearInterval(game.restartID)
    console.log "restart",game.restartID
    day = 1
    c.carrying = false
    c.family =
      status : "healthy"
      children : 2
      adults : 2
      starved : 0
    c.status = "peckish"
    c.x = 100
    c.y = 40
    d.x = -60
    d.y = -100
    d.spawnRadius = 5
    c.alive = true
    game.loopID = setInterval(game.loop,1000/30)
    document.getElementById("snd_fire").play()

  status : () ->
    document.getElementById('dayDisplay').innerHTML = "Day: #{day}"
    if c.carrying
      if Util.distance(c,{x:0,y:0})>75
        document.getElementById('adviceDisplay').innerHTML = "Eat: (F)"
      else
        document.getElementById('adviceDisplay').innerHTML = "Feed Family: (F)" 
    else
      document.getElementById('adviceDisplay').innerHTML = "Swing: (Spacebar), Hunt: (Arrow Keys)"
    document.getElementById('youDisplay').innerHTML = "You are #{c.status}"
    document.getElementById('familyDisplay').innerHTML = "Your family is #{c.family.status}"
    document.getElementById('gameDisplay').innerHTML = "You have #{c.family.adults} wives and #{c.family.children} children.  #{c.family.starved} of your family have starved."
    unless c.alive
      document.getElementById('youDisplay').innerHTML = "You are #{c.status}"
      console.log "loopID",game.loopID
      clearInterval(game.loopID)
      document.getElementById("snd_fire").pause()
      document.getElementById("snd_walk").pause()
      game.restartID = setInterval @restart,8000


  


game.loopID = setInterval(game.loop,1000/30)
setInterval(game.night,62.5)