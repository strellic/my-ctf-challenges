use crate::{
    chunk::Chunk,
    highlight::SelectedVoxel,
    mesh::HasMesh,
    ui,
    voxel::VoxelKind,
    world,
};
use bevy::prelude::*;

use bevy::{
    input::mouse::{
        MouseMotion,
        MouseWheel,
    },
    window::{
        CursorGrabMode,
        PrimaryWindow,
    },
};

#[derive(Resource, Default)]
pub struct CameraVelocity {
    pub vel: Vec3,
}
#[derive(Resource, Default)]
pub struct InputState {
    pub space_pressed: bool,
    pub space_held: bool,
    pub shift_held: bool,
    pub fly_hack: bool,
    pub selected_voxel: u8,
}

pub fn hook_cursor(mut qwindow: Query<&mut Window, With<PrimaryWindow>>) {
    let window = &mut qwindow.single_mut();
    window.cursor.grab_mode = CursorGrabMode::Confined;
    window.cursor.visible = false;
}

pub fn player_look(
    qwindow: Query<&Window, With<PrimaryWindow>>,
    mut mouse: EventReader<MouseMotion>,
    mut camera_transform: Query<&mut Transform, With<Camera>>,
) {
    let window = qwindow.single();
    let mut camera_transform = camera_transform.single_mut();

    for ev in mouse.read() {
        let (mut yaw, mut pitch, mut _roll) = camera_transform.rotation.to_euler(EulerRot::YXZ);
        if window.cursor.grab_mode != CursorGrabMode::None {
            yaw -= ev.delta.x * 0.002;
            pitch -= ev.delta.y * 0.002;
            pitch = pitch.clamp(-1.54, 1.54);
            camera_transform.rotation =
                Quat::from_axis_angle(Vec3::Y, yaw) * Quat::from_axis_angle(Vec3::X, pitch);
        }
    }
}

#[derive(Event)]
pub struct SaveEvent;

#[derive(SystemSet, PartialEq, Eq, Hash, Debug, Clone)]
pub struct InputSet;

pub fn handle_lmb(
    mut commands: Commands,
    buttons: Res<ButtonInput<MouseButton>>,
    selected: Res<SelectedVoxel>,
    world: Res<world::World>,
    mut chunks: Query<&mut Chunk>,
) {
    if !buttons.just_pressed(MouseButton::Left) {
        return;
    }
    if let Some(selected_voxel) = selected.to_break {
        let chunk = world
            .chunk_containing(selected_voxel)
            .expect("Selected voxel is not in a chunk");
        let mut chunk_data = chunks.get_mut(chunk).expect("Chunk does not exist");
        let voxel = chunk_data.voxel_mut(selected_voxel.into());
        if voxel.breakable() {
            voxel.clear();

            commands
                .entity(chunk)
                .remove::<HasMesh>()
                .insert(crate::UpdateSync);
            // clear HasMesh flag from any adjacent chunk
            for chunk_pos in selected_voxel
                .neighbouring_chunks()
                .all()
                .iter()
                .filter_map(|cp| *cp)
            {
                if let Some(adj_chunk) = world.chunk_at(chunk_pos) {
                    commands
                        .entity(adj_chunk)
                        .remove::<HasMesh>()
                        .insert(crate::UpdateSync);
                }
            }
        }
    }
}

pub fn handle_rmb(
    mut commands: Commands,
    buttons: Res<ButtonInput<MouseButton>>,
    selected: Res<SelectedVoxel>,
    world: Res<world::World>,
    mut chunks: Query<&mut Chunk>,
    input_state: Res<InputState>,
) {
    if !buttons.just_pressed(MouseButton::Right) {
        return;
    }
    if let Some(selected_voxel) = selected.to_place {
        let chunk = world
            .chunk_containing(selected_voxel)
            .expect("Selected voxel is not in a chunk");
        let mut chunk_data = chunks.get_mut(chunk).expect("Chunk does not exist");
        let voxel = chunk_data.voxel_mut(selected_voxel.into());
        voxel.kind = match input_state.selected_voxel {
            0 => VoxelKind::Stone,
            1 => VoxelKind::Grass,
            2 => VoxelKind::Water,
            3 => VoxelKind::Snow,
            4 => VoxelKind::Dirt,
            _ => panic!("Invalid selected voxel"),
        };

        commands
            .entity(chunk)
            .remove::<HasMesh>()
            .insert(crate::UpdateSync);
        // clear HasMesh flag from any adjacent chunk
        for chunk_pos in selected_voxel
            .neighbouring_chunks()
            .all()
            .iter()
            .filter_map(|cp| *cp)
        {
            if let Some(adj_chunk) = world.chunk_at(chunk_pos) {
                commands
                    .entity(adj_chunk)
                    .remove::<HasMesh>()
                    .insert(crate::UpdateSync);
            }
        }
    }
}

pub fn handle_movement_keys(
    keys: Res<ButtonInput<KeyCode>>,
    mut camera_velocity: ResMut<CameraVelocity>,
    camera_transform: Query<&Transform, With<Camera>>,
    mut input_state: ResMut<InputState>,
) {
    let camera_transform = camera_transform.single();
    let camera_velocity = &mut camera_velocity.vel;
    let looking_at = camera_transform.local_z();
    let rotate = Quat::from_rotation_y(f32::atan2(looking_at.x, looking_at.z));
    let camera_forward = rotate * Vec3::NEG_Z;
    let camera_right = rotate * Vec3::X;

    let mut speed_factor = if keys.pressed(KeyCode::ControlLeft) {
        12.5
    } else {
        7.5
    };

    input_state.space_held = keys.pressed(KeyCode::Space);
    input_state.shift_held = keys.pressed(KeyCode::ShiftLeft);
    input_state.space_pressed = keys.just_pressed(KeyCode::Space);

    // TODO: make this cheat only?
    if keys.just_pressed(KeyCode::KeyF) {
        input_state.fly_hack = !input_state.fly_hack;
    }
    if input_state.fly_hack {
        speed_factor *= 2.0;
    }

    for key in keys.get_pressed() {
        if *key == KeyCode::KeyW {
            *camera_velocity += speed_factor * camera_forward;
        } else if *key == KeyCode::KeyS {
            *camera_velocity -= speed_factor * camera_forward;
        } else if *key == KeyCode::KeyA {
            *camera_velocity -= speed_factor * camera_right;
        } else if *key == KeyCode::KeyD {
            *camera_velocity += speed_factor * camera_right;
        }
    }
}

// TODO: Add a quitting wheel
const QUIT_SECONDS: f32 = 1.0;
/// While `Esc` is held, count up for [`QUIT_SECONDS`] to 1.0 then quit the game
#[derive(Resource, Default)]
pub struct QuitCounter(f32);

pub fn handle_special_keys(
    keys: Res<ButtonInput<KeyCode>>,
    mut window: Query<&mut Window, With<PrimaryWindow>>,
    mut input_state: ResMut<InputState>,
    mut scroll: EventReader<MouseWheel>,
    mut selected_pos: Query<(&mut crate::ui::SelectedPosition, &mut Style)>,
    mut ev_save: EventWriter<SaveEvent>,
    mut color_overlay: Query<&mut BackgroundColor, With<ui::ColorOverlay>>,
    mut quit_counter: ResMut<QuitCounter>,
    time: Res<Time>,
    mut exit: EventWriter<AppExit>,
) {
    let mut window = window.single_mut();
    if keys.just_pressed(KeyCode::Escape) {
        let (grab_mode, visible, color) = match window.cursor.grab_mode {
            CursorGrabMode::None => (CursorGrabMode::Locked, false, Color::NONE),
            CursorGrabMode::Locked | CursorGrabMode::Confined => {
                (CursorGrabMode::None, true, Color::BLACK.with_alpha(0.5))
            }
        };
        window.cursor.grab_mode = grab_mode;
        window.cursor.visible = visible;
        let mut color_overlay = color_overlay.single_mut();
        color_overlay.0 = color;
    }

    if keys.pressed(KeyCode::Escape) {
        quit_counter.0 += time.delta_seconds() / QUIT_SECONDS;
        if quit_counter.0 >= 1.0 {
            exit.send(AppExit::Success);
        }
    } else {
        quit_counter.0 = 0.0;
    }

    let mut new_selected = input_state.selected_voxel;
    if keys.just_pressed(KeyCode::Digit1) {
        new_selected = 0;
    } else if keys.just_pressed(KeyCode::Digit2) {
        new_selected = 1;
    } else if keys.just_pressed(KeyCode::Digit3) {
        new_selected = 2;
    } else if keys.just_pressed(KeyCode::Digit4) {
        new_selected = 3;
    } else if keys.just_pressed(KeyCode::Digit5) {
        new_selected = 4;
    }
    for scr_event in scroll.read() {
        if scr_event.y > 0.0 {
            new_selected = new_selected.saturating_add(1);
        } else if scr_event.y < 0.0 {
            new_selected = new_selected.saturating_sub(1);
        }
    }
    new_selected = new_selected.clamp(0, 4);
    if new_selected != input_state.selected_voxel {
        input_state.selected_voxel = new_selected;
    }

    let mut selected_pos = selected_pos.single_mut();
    selected_pos.1.margin.left = Val::Px((input_state.selected_voxel as f32 - 2.0) * 156.0 + 8.0);

    if keys.just_pressed(KeyCode::F9) {
        ev_save.send(SaveEvent);
    }
}
