export type Verb = { 
    name: string 
    positions: string[]
    images: { [k:string]: string }
}

export type Coord = {
    x: number
    y: number
    z: number
}

export type Character = {
    id: string
    name: string
    imageId: string | null
    position: string
    speed: number
    action: string
    alive: boolean
    respawnId: number | null
}

export type Frame = {
    count: number
    width: number
    index: number
    imageId: string | null
    playspeed: number
    repeat: boolean
    scale: number
}

export type Hunter = {
    day: number
    carrying: boolean
    family: {
        status: string
        children: number
         adults: number
         starved:  number	
    }
    id: string
    status: string
}

export type Deer = {
    spawnRadius: number
    id: string
    respawnId: number | null
}

export type SpatialSound = {
    snd: string,
    coords: Coord
}

export type Camera = {
    scale: { x: number, y: number }
    target: string | null
} & Coord

export type LoopingSound = string

export type State = {
    keys: { DOWN: { [index:number]: number } }
    mute: boolean
    resources: {
        snd: { 
            [index: string]: {
                src: string, element: HTMLAudioElement | null
            }
        }
        img: { 
            [index: string]: {
                src: string, element: HTMLImageElement | null
            }
        }
    }
    coords: {
        [index:string]: Coord
    }
    verbs: {
        [index:string]: Verb[]
    }
    characters: {
        [index:string]: Character
    }
    frames: {
        [index:string]: Frame
    }
    camera: Camera
    hunter: {
        [index:string]: Hunter
    }
    deer: {
        [index:string]: Deer
    }
    spatialSounds: {
        [index:string]: SpatialSound
    }
    loopingSounds: {
        [index:string]: LoopingSound
    }
}

export as namespace Provider;