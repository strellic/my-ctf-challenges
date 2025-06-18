use bevy::prelude::*;

use crate::{
    chunk::Chunk,
    material::{
        VoxelMaterial,
        VoxelMaterialResource,
    },
    voxel::VoxelPosition,
    world,
};

#[derive(Resource, Default)]
pub struct SelectedVoxel {
    pub to_break: Option<VoxelPosition>,
    pub to_place: Option<VoxelPosition>,
}

const SELECT_DISTANCE: f32 = 32.0;
const STEP_SIZE: f32 = 0.05;

pub fn update_selected_voxel(
    world: Res<world::World>,
    mut selected: ResMut<SelectedVoxel>,
    player: Query<&Transform, With<Camera>>,
    chunks: Query<&Chunk>,
    material_handle: Res<VoxelMaterialResource>,
    mut materials: ResMut<Assets<VoxelMaterial>>,
) {
    let player_trans = player.get_single().expect("expected player object");
    let pos = player_trans.translation;
    let direction = player_trans.forward().as_vec3().normalize();

    let mut step: f32 = 0.0;
    while step <= SELECT_DISTANCE {
        let check = (pos + direction * step).as_ivec3();
        let check = VoxelPosition::new(check);

        match world.voxel_at(check, &chunks) {
            Some(voxel) if voxel.should_mesh() => {
                selected.to_break = Some(check);
                let mat = materials.get_mut(&material_handle.handle).unwrap();
                mat.has_selected = 1;
                mat.selected_voxel = check.as_vec3();

                if step != 0.0 {
                    let prev_step = (pos + direction * (step - STEP_SIZE)).as_ivec3();
                    selected.to_place = Some(VoxelPosition::new(prev_step))
                } else {
                    selected.to_place = None;
                }

                return;
            }
            _ => {
                step += STEP_SIZE;
            }
        }
    }
    if selected.to_break.is_some() {
        let mat = materials.get_mut(&material_handle.handle).unwrap();
        mat.has_selected = 0;
        selected.to_break = None;
    }
}
