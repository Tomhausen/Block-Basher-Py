let i: number;
namespace SpriteKind {
    export const cursor = SpriteKind.create()
    //  GM1
    export const path = SpriteKind.create()
}

//  /GM1
//  vars
let proj_count = 10
let proj_speed = 200
let lives = 3
//  GM1
let draw_path = false
//  /GM1
//  sprites
let ghost = sprites.create(assets.image`ghost`, SpriteKind.Player)
ghost.bottom = 120
ghost.setStayInScreen(true)
let pointer = sprites.create(image.create(1, 1), SpriteKind.cursor)
pointer.image.fill(1)
pointer.setFlag(SpriteFlag.Invisible, true)
//  aim sprite
//  GM1
//  aim_sprite = sprites.create(image.create(150, 150)) # REMOVE
//  aim_sprite.image.fill_rect(74, 74, 75, 2, 2) # REMOVE
let aim_sprite = sprites.create(image.create(2, 2))
aim_sprite.image.fill(1)
aim_sprite.setFlag(SpriteFlag.GhostThroughWalls, true)
//  /GM1
aim_sprite.z = -1
aim_sprite.setFlag(SpriteFlag.Invisible, true)
//  BH3
//  status bar
let one_shot_active = false
let power_up_bar = statusbars.create(160, 2, StatusBarKind.Magic)
power_up_bar.bottom = 120
power_up_bar.value = 0
//  /BH3
//  setup
music.setVolume(20)
tiles.setCurrentTilemap(assets.tilemap`level`)
for (i = 0; i < 3; i++) {
    cycle_blocks()
}
function make_lives_text(location: any) {
    let block_life = tiles.readDataNumber(location, "life")
    let lives_text = textsprite.create("" + block_life)
    tiles.placeOnTile(lives_text, location)
    tiles.setDataSprite(location, "text", lives_text)
}

function spawn_block(location: any) {
    tiles.setTileAt(location, assets.tile`block`)
    tiles.setWallAt(location, true)
    let block_life = 3 + randint(-2, 2)
    tiles.setDataNumber(location, "life", block_life)
    make_lives_text(location)
}

//  BH2
function spawn_bonus_ball(location: any) {
    let bonus_ball = sprites.create(assets.image`bonus`, SpriteKind.Food)
    tiles.placeOnTile(bonus_ball, location)
    bonus_ball.setFlag(SpriteFlag.AutoDestroy, true)
}

//  /BH2
function spawn_row() {
    for (let col = 0; col < 10; col++) {
        if (randint(1, 5) > 1) {
            spawn_block(tiles.getTileLocation(col, 0))
        } else if (randint(1, 5) == 1) {
            //  BH2
            spawn_bonus_ball(tiles.getTileLocation(col, 0))
        }
        
    }
    //  /BH2
    music.knock.play()
}

function move_block(location: tiles.Location) {
    let new_location = tiles.getTileLocation(location.column, location.row + 1)
    let block_image = tiles.getTileImage(location)
    tiles.setTileAt(new_location, block_image)
    tiles.setWallAt(new_location, true)
    tiles.setTileAt(location, image.create(16, 16))
    tiles.setWallAt(location, false)
    tiles.moveData(location, new_location, true)
}

function move_row() {
    let all_blocks = tilesAdvanced.getAllTilesWhereWallIs(true)
    all_blocks.reverse()
    for (let location of all_blocks) {
        if (location.bottom > ghost.top - 16) {
            game.over(false)
        }
        
        move_block(location)
    }
    //  BH2
    for (let ball of sprites.allOfKind(SpriteKind.Food)) {
        ball.y += 16
    }
}

//  /BH2
function cycle_blocks() {
    move_row()
    spawn_row()
}

//  BH3
controller.A.onEvent(ControllerButtonEvent.Pressed, function activate_power_up() {
    
    if (power_up_bar.value >= power_up_bar.max) {
        one_shot_active = true
        power_up_bar.value = 0
    }
    
})
//  /BH3
//  /GM1
browserEvents.MouseLeft.onEvent(browserEvents.MouseButtonEvent.Pressed, function left_mouse_press(x: any, y: any) {
    //  GM1
    //  aim_sprite.set_flag(SpriteFlag.INVISIBLE, False) # REMOVE
    //  aim_sprite.x = ghost.x # REMOVE
    //  aim_sprite.y = ghost.y # REMOVE
    
    draw_path = true
})
browserEvents.MouseLeft.onEvent(browserEvents.MouseButtonEvent.Released, function left_mouse_release(x: any, y: any) {
    //  GM1
    
    draw_path = false
    //  aim_sprite.set_flag(SpriteFlag.INVISIBLE, True) # REMOVE
    //  /GM1
    if (sprites.allOfKind(SpriteKind.Projectile).length < 1) {
        timer.background(function fire() {
            let fire_angle: number;
            let proj: Sprite;
            fire_angle = spriteutils.angleFrom(ghost, pointer)
            for (let i = 0; i < proj_count; i++) {
                proj = sprites.create(assets.image`projectile`, SpriteKind.Projectile)
                proj.setPosition(ghost.x, ghost.y)
                proj.setBounceOnWall(true)
                spriteutils.setVelocityAtAngle(proj, fire_angle, proj_speed)
                //  BH3
                if (one_shot_active) {
                    proj.startEffect(effects.fire)
                }
                
                //  /BH3
                pause(50)
            }
        })
        animation.runImageAnimation(ghost, assets.animation`ghost throw`, 100, false)
    }
    
})
//  BH2
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Food, function collect_bonus_ball(proj: Sprite, ball: Sprite) {
    
    proj_count += 1
    ball.destroy()
})
//  /BH2
function block_damage(location: any) {
    let effect_sprite: Sprite;
    if (tiles.tileAtLocationEquals(location, assets.tile`unbreakable`)) {
        return
    }
    
    let new_life = tiles.readDataNumber(location, "life") - 1
    tiles.readDataSprite(location, "text").destroy()
    //  BH3
    if (new_life < 1 || one_shot_active) {
        //  EDIT
        //  /BH3
        tiles.setTileAt(location, image.create(16, 16))
        tiles.setWallAt(location, false)
        info.changeScoreBy(10)
        //  BH1
        scene.cameraShake(4, 500)
        music.bigCrash.play()
    } else {
        //  /BH1
        tiles.setDataNumber(location, "life", new_life)
        make_lives_text(location)
        //  BH1
        music.footstep.play()
        effect_sprite = sprites.create(image.create(16, 16))
        effect_sprite.image.fill(2)
        tiles.placeOnTile(effect_sprite, location)
        effect_sprite.setFlag(SpriteFlag.Invisible, true)
        effect_sprite.startEffect(effects.ashes, 200)
        effect_sprite.lifespan = 200
        //  /BH1
        //  BH3
        power_up_bar.value += 1
    }
    
}

//  /BH3
scene.onHitWall(SpriteKind.Projectile, function wall_hit(proj: Sprite, location: tiles.Location) {
    if (tiles.tileAtLocationEquals(location, assets.tile`block`)) {
        block_damage(location)
    }
    
    if (proj.y > ghost.y) {
        if (sprites.allOfKind(SpriteKind.Projectile).length == proj_count) {
            ghost.x = proj.x
        }
        
        proj.destroy()
    }
    
})
//  GM1 REMOVE
function aim() {
    let angle = spriteutils.radiansToDegrees(spriteutils.angleFrom(ghost, pointer))
    transformSprites.rotateSprite(aim_sprite, angle)
}

//  /GM1
//  GM1
function path() {
    let dot_sprite: Sprite;
    aim_sprite.setPosition(ghost.x, ghost.y)
    let direction = spriteutils.angleFrom(ghost, pointer)
    let x_vector = Math.cos(direction)
    let y_vector = Math.sin(direction)
    let dot = image.create(2, 2)
    dot.fill(1)
    for (let path_length = 0; path_length < 10; path_length++) {
        dot_sprite = sprites.create(dot, SpriteKind.path)
        dot_sprite.setPosition(aim_sprite.x, aim_sprite.y)
        for (let step_length = 0; step_length < 15; step_length++) {
            aim_sprite.x += x_vector
            if (tiles.tileAtLocationIsWall(aim_sprite.tilemapLocation())) {
                aim_sprite.x -= x_vector
                x_vector *= -1
            }
            
            aim_sprite.y += y_vector
            if (tiles.tileAtLocationIsWall(aim_sprite.tilemapLocation())) {
                aim_sprite.y -= y_vector
                y_vector *= -1
            }
            
        }
    }
}

//  /GH1
sprites.onDestroyed(SpriteKind.Projectile, function trigger_game_loop() {
    //  BH3
    
    //  /BH3
    if (tiles.getTilesByType(assets.tile`block`).length < 1) {
        game.over(true)
    }
    
    if (sprites.allOfKind(SpriteKind.Projectile).length < 1) {
        //  BH3
        one_shot_active = false
        //  /BH3
        cycle_blocks()
    }
    
})
//  /GM1
game.onUpdate(function tick() {
    pointer.x = browserEvents.mouseX()
    pointer.y = browserEvents.mouseY()
    if (pointer.y >= ghost.y - 5) {
        pointer.y = ghost.y - 5
    }
    
    //  GM1
    //  aim() # REMOVE
    if (sprites.allOfKind(SpriteKind.path).length > 0) {
        sprites.destroyAllSpritesOfKind(SpriteKind.path)
    }
    
    if (draw_path) {
        path()
    }
    
})
