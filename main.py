@namespace
class SpriteKind:
    cursor = SpriteKind.create()

# vars
proj_count = 10
proj_speed = 200
lives = 3

# sprites
ghost = sprites.create(assets.image("ghost"), SpriteKind.player)
ghost.bottom = 120
ghost.set_stay_in_screen(True)
pointer = sprites.create(image.create(1, 1), SpriteKind.cursor)
pointer.image.fill(1)
pointer.set_flag(SpriteFlag.INVISIBLE, True)

# aim sprite
aim_sprite = sprites.create(image.create(150, 150))
aim_sprite.image.fill_rect(74, 74, 75, 2, 2)
aim_sprite.z = -1
aim_sprite.set_flag(SpriteFlag.INVISIBLE, True)

# setup
music.set_volume(20)
tiles.set_current_tilemap(assets.tilemap("level"))
for i in range(3):
    cycle_blocks()

def make_lives_text(location):
    block_life = tiles.read_data_number(location, "life")
    lives_text = textsprite.create(str(block_life))
    tiles.place_on_tile(lives_text, location)
    tiles.set_data_sprite(location, "text", lives_text)

def spawn_block(location):
    tiles.set_tile_at(location, assets.tile("block"))
    tiles.set_wall_at(location, True)
    block_life = 3 + randint(-2, 2)
    tiles.set_data_number(location, "life", block_life)
    make_lives_text(location)

def spawn_row():
    for col in range(10):
        if randint(1, 5) > 1:
            spawn_block(tiles.get_tile_location(col, 0))
    music.knock.play()

def move_block(location: tiles.Location):
    new_location = tiles.get_tile_location(location.column, location.row + 1)
    block_image = tiles.get_tile_image(location)
    tiles.set_tile_at(new_location, block_image)
    tiles.set_wall_at(new_location, True)
    tiles.set_tile_at(location, image.create(16, 16))
    tiles.set_wall_at(location, False)
    tiles.move_data(location, new_location, True)

def move_row():
    all_blocks = tilesAdvanced.get_all_tiles_where_wall_is(True)
    all_blocks.reverse()
    for location in all_blocks:
        if location.bottom > ghost.top - 16:
            game.over(False)
        move_block(location)

def cycle_blocks():
    move_row()
    spawn_row()

def left_mouse_press(x, y):
    aim_sprite.set_flag(SpriteFlag.INVISIBLE, False)
    aim_sprite.x = ghost.x
    aim_sprite.y = ghost.y
browserEvents.mouse_left.on_event(browserEvents.MouseButtonEvent.PRESSED, left_mouse_press)

def left_mouse_release(x, y):
    aim_sprite.set_flag(SpriteFlag.INVISIBLE, True)
    if len(sprites.all_of_kind(SpriteKind.projectile)) < 1:
        timer.background(fire)
        animation.run_image_animation(ghost, assets.animation("ghost throw"), 100, False)
browserEvents.mouse_left.on_event(browserEvents.MouseButtonEvent.RELEASED, left_mouse_release)

def fire():
    fire_angle = spriteutils.angle_from(ghost, pointer)
    for i in range(proj_count):
        proj = sprites.create(assets.image("projectile"), SpriteKind.projectile)
        proj.set_position(ghost.x, ghost.y)
        proj.set_bounce_on_wall(True)
        spriteutils.set_velocity_at_angle(proj, fire_angle, proj_speed)
        pause(50)

def block_damage(location):
    if tiles.tile_at_location_equals(location, assets.tile("unbreakable")):
        return
    new_life = tiles.read_data_number(location, "life") - 1
    tiles.read_data_sprite(location, "text").destroy()
    if new_life < 1:
        tiles.set_tile_at(location, image.create(16, 16))
        tiles.set_wall_at(location, False)
        info.change_score_by(10)
    else:
        tiles.set_data_number(location, "life", new_life)
        make_lives_text(location)

def wall_hit(proj, location):
    if tiles.tile_at_location_equals(location, assets.tile("block")):
        block_damage(location)
    if proj.y > ghost.y:
        if len(sprites.all_of_kind(SpriteKind.projectile)) == proj_count:
            ghost.x = proj.x
        proj.destroy()
scene.on_hit_wall(SpriteKind.projectile, wall_hit)

def aim():
    angle = spriteutils.radians_to_degrees(spriteutils.angle_from(ghost, pointer))
    transformSprites.rotate_sprite(aim_sprite, angle)

def trigger_game_loop():
    if len(tiles.get_tiles_by_type(assets.tile("block"))) < 1:
        game.over(True)
    if len(sprites.all_of_kind(SpriteKind.projectile)) < 1:
        cycle_blocks()
sprites.on_destroyed(SpriteKind.projectile, trigger_game_loop)

def tick():
    pointer.x = browserEvents.mouse_x()
    pointer.y = browserEvents.mouse_y()
    if pointer.y >= ghost.y - 5:
        pointer.y = ghost.y - 5
    aim()
game.on_update(tick)
