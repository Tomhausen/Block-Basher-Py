@namespace
class SpriteKind:
    cursor = SpriteKind.create()
    # GM1
    path = SpriteKind.create()
    # /GM1

# vars
proj_count = 10
proj_speed = 200
lives = 3
# GM1
draw_path = False
# /GM1

# sprites
ghost = sprites.create(assets.image("ghost"), SpriteKind.player)
ghost.bottom = 120
ghost.set_stay_in_screen(True)
pointer = sprites.create(image.create(1, 1), SpriteKind.cursor)
pointer.image.fill(1)
pointer.set_flag(SpriteFlag.INVISIBLE, True)

# aim sprite
# GM1
# aim_sprite = sprites.create(image.create(150, 150)) # REMOVE
# aim_sprite.image.fill_rect(74, 74, 75, 2, 2) # REMOVE
aim_sprite = sprites.create(image.create(2, 2))
aim_sprite.image.fill(1)
aim_sprite.set_flag(SpriteFlag.GHOST_THROUGH_WALLS, True)
# /GM1
aim_sprite.z = -1
aim_sprite.set_flag(SpriteFlag.INVISIBLE, True)

# BH3
# status bar
one_shot_active = False
power_up_bar = statusbars.create(160, 2, StatusBarKind.magic)
power_up_bar.bottom = 120
power_up_bar.value = 0
# /BH3

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

# BH2
def spawn_bonus_ball(location):
    bonus_ball = sprites.create(assets.image("bonus"), SpriteKind.food)
    tiles.place_on_tile(bonus_ball, location)
    bonus_ball.set_flag(SpriteFlag.AUTO_DESTROY, True)
# /BH2

def spawn_row():
    for col in range(10):
        if randint(1, 5) > 1:
            spawn_block(tiles.get_tile_location(col, 0))
        # BH2
        elif randint(1, 5) == 1:
            spawn_bonus_ball(tiles.get_tile_location(col, 0))
        # /BH2
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
    # BH2
    for ball in sprites.all_of_kind(SpriteKind.food):
        ball.y += 16
    # /BH2

def cycle_blocks():
    move_row()
    spawn_row()

# BH3
def activate_power_up():
    global one_shot_active
    if power_up_bar.value >= power_up_bar.max:
        one_shot_active = True
        power_up_bar.value = 0
controller.A.on_event(ControllerButtonEvent.PRESSED, activate_power_up)
# /BH3

def left_mouse_press(x, y):
    # GM1
    # aim_sprite.set_flag(SpriteFlag.INVISIBLE, False) # REMOVE
    # aim_sprite.x = ghost.x # REMOVE
    # aim_sprite.y = ghost.y # REMOVE
    global draw_path
    draw_path = True
    # /GM1
browserEvents.mouse_left.on_event(browserEvents.MouseButtonEvent.PRESSED, left_mouse_press)

def left_mouse_release(x, y):
    # GM1
    global draw_path
    draw_path = False
    # aim_sprite.set_flag(SpriteFlag.INVISIBLE, True) # REMOVE
    # /GM1
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
        # BH3
        if one_shot_active:
            proj.start_effect(effects.fire)
        # /BH3
        pause(50)

# BH2
def collect_bonus_ball(proj, ball):
    global proj_count
    proj_count += 1
    ball.destroy()
sprites.on_overlap(SpriteKind.projectile, SpriteKind.food, collect_bonus_ball)
# /BH2

def block_damage(location):
    if tiles.tile_at_location_equals(location, assets.tile("unbreakable")):
        return
    new_life = tiles.read_data_number(location, "life") - 1
    tiles.read_data_sprite(location, "text").destroy()
    # BH3
    if new_life < 1 or one_shot_active: # EDIT
    # /BH3
        tiles.set_tile_at(location, image.create(16, 16))
        tiles.set_wall_at(location, False)
        info.change_score_by(10)
        # BH1
        scene.camera_shake(4, 500)
        music.big_crash.play()
        # /BH1
    else:
        tiles.set_data_number(location, "life", new_life)
        make_lives_text(location)
        # BH1
        music.footstep.play()
        effect_sprite = sprites.create(image.create(16, 16))
        effect_sprite.image.fill(2)
        tiles.place_on_tile(effect_sprite, location)
        effect_sprite.set_flag(SpriteFlag.INVISIBLE, True)
        effect_sprite.start_effect(effects.ashes, 200)
        effect_sprite.lifespan = 200
        # /BH1
        # BH3
        power_up_bar.value +=1
        # /BH3

def wall_hit(proj, location):
    if tiles.tile_at_location_equals(location, assets.tile("block")):
        block_damage(location)
    if proj.y > ghost.y:
        if len(sprites.all_of_kind(SpriteKind.projectile)) == proj_count:
            ghost.x = proj.x
        proj.destroy()
scene.on_hit_wall(SpriteKind.projectile, wall_hit)

# GM1 REMOVE
def aim():
    angle = spriteutils.radians_to_degrees(spriteutils.angle_from(ghost, pointer))
    transformSprites.rotate_sprite(aim_sprite, angle)
# /GM1

# GM1
def path():
    aim_sprite.set_position(ghost.x, ghost.y)
    direction = spriteutils.angle_from(ghost, pointer)
    x_vector = Math.cos(direction)
    y_vector = Math.sin(direction)
    dot = image.create(2, 2)
    dot.fill(1)
    for path_length in range(10):
        dot_sprite = sprites.create(dot, SpriteKind.path)
        dot_sprite.set_position(aim_sprite.x, aim_sprite.y)
        for step_length in range(15):
            aim_sprite.x += x_vector
            if tiles.tile_at_location_is_wall(aim_sprite.tilemap_location()):
                aim_sprite.x -= x_vector
                x_vector *= -1
            aim_sprite.y += y_vector
            if tiles.tile_at_location_is_wall(aim_sprite.tilemap_location()):
                aim_sprite.y -= y_vector
                y_vector *= -1
# /GH1

def trigger_game_loop():
    # BH3
    global one_shot_active
    # /BH3
    if len(tiles.get_tiles_by_type(assets.tile("block"))) < 1:
        game.over(True)
    if len(sprites.all_of_kind(SpriteKind.projectile)) < 1:
        # BH3
        one_shot_active = False
        # /BH3
        cycle_blocks()
sprites.on_destroyed(SpriteKind.projectile, trigger_game_loop)

def tick():
    pointer.x = browserEvents.mouse_x()
    pointer.y = browserEvents.mouse_y()
    if pointer.y >= ghost.y - 5:
        pointer.y = ghost.y - 5
    # GM1
    # aim() # REMOVE
    if len(sprites.all_of_kind(SpriteKind.path)) > 0:
        sprites.destroy_all_sprites_of_kind(SpriteKind.path)
    if draw_path:
        path()
    # /GM1
game.on_update(tick)
