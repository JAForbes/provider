export type Night = { timeOfDay: number, increment: number }

export type NightState = {
    night: {
        [index: string]: Night
    }
}

export type Verb = {
    name: string
    positions: string[]
    images: { [k: string]: string }
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
    speed: { x: number, z: number }
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
    alpha: number
}

export type HunterStatus =
    'starving'
    | 'hungry'
    | 'peckish'
    | 'healthy'
    | 'dead'


export type FamilyStatus =
    'starving'
    | 'hungry'
    | 'peckish'
    | 'healthy'

export type Hunter = {
    day: number
    carrying: boolean
    family: {
        status: FamilyStatus
        children: number
        adults: number
        starved: number
    }
    id: string
    status: HunterStatus
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

export type Canvas = {
    element: HTMLCanvasElement
    context: CanvasRenderingContext2D
}

export type State = {
    time: number,
    paused: boolean,
    frame: number,
    keys: { DOWN: { [index: number]: number } }
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
        [index: string]: Coord
    }
    verbs: {
        [index: string]: Verb[]
    }
    characters: {
        [index: string]: Character
    }
    frames: {
        [index: string]: Frame
    }
    camera: Camera
    hunter: {
        [index: string]: Hunter
    }
    deer: {
        [index: string]: Deer
    }
    spatialSounds: {
        [index: string]: SpatialSound
    }
    loopingSounds: {
        [index: string]: LoopingSound
    }
    canvas: {
        [index: string]: Canvas
    }
}
    & NightState

export type Patch = (a: Provider.State) => Provider.State

export as namespace Provider;