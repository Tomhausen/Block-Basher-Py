let i: number;
namespace SpriteKind {
    export const cursor = SpriteKind.create()
}

//  vars
let proj_count = 10
let proj_speed = 200
let lives = 3
//  sprites
let ghost = sprites.create(assets.image`ghost`, SpriteKind.Player)
ghost.bottom = 120
ghost.setStayInScreen(true)
let pointer = sprites.create(image.create(1, 1), SpriteKind.cursor)
pointer.image.fill(1)
pointer.setFlag(SpriteFlag.Invisible, true)
//  aim sprite
let aim_sprite = sprites.create(image.create(150, 150))
aim_sprite.image.fillRect(74, 74, 75, 2, 2)
aim_sprite.z = -1
aim_sprite.setFlag(SpriteFlag.Invisible, true)
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

function spawn_row() {
    for (let col = 0; col < 10; col++) {
        if (randint(1, 5) > 1) {
            spawn_block(tiles.getTileLocation(col, 0))
        }
        
    }
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
}

function cycle_blocks() {
    move_row()
    spawn_row()
}

browserEvents.MouseLeft.onEvent(browserEvents.MouseButtonEvent.Pressed, function left_mouse_press(x: any, y: any) {
    aim_sprite.setFlag(SpriteFlag.Invisible, false)
    aim_sprite.x = ghost.x
    aim_sprite.y = ghost.y
})
browserEvents.MouseLeft.onEvent(browserEvents.MouseButtonEvent.Released, function left_mouse_release(x: any, y: any) {
    aim_sprite.setFlag(SpriteFlag.Invisible, true)
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
                pause(50)
            }
        })
        animation.runImageAnimation(ghost, assets.animation`ghost throw`, 100, false)
    }
    
})
function block_damage(location: any) {
    if (tiles.tileAtLocationEquals(location, assets.tile`unbreakable`)) {
        return
    }
    
    let new_life = tiles.readDataNumber(location, "life") - 1
    tiles.readDataSprite(location, "text").destroy()
    if (new_life < 1) {
        tiles.setTileAt(location, image.create(16, 16))
        tiles.setWallAt(location, false)
        info.changeScoreBy(10)
    } else {
        tiles.setDataNumber(location, "life", new_life)
        make_lives_text(location)
    }
    
}

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
function aim() {
    let angle = spriteutils.radiansToDegrees(spriteutils.angleFrom(ghost, pointer))
    transformSprites.rotateSprite(aim_sprite, angle)
}

sprites.onDestroyed(SpriteKind.Projectile, function trigger_game_loop() {
    if (tiles.getTilesByType(assets.tile`block`).length < 1) {
        game.over(true)
    }
    
    if (sprites.allOfKind(SpriteKind.Projectile).length < 1) {
        cycle_blocks()
    }
    
})
game.onUpdate(function tick() {
    pointer.x = browserEvents.mouseX()
    pointer.y = browserEvents.mouseY()
    if (pointer.y >= ghost.y - 5) {
        pointer.y = ghost.y - 5
    }
    
    aim()
})
