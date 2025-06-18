use crate::{
    chunk::Chunk,
    world::World,
};
use bevy::prelude::Query;
pub use cormine_shared::save::SaveData;

pub fn from_world(query: Query<&Chunk>, world: &World) -> SaveData {
    let seed = world.seed();
    let noise_map = crate::terrain::generate_noise_map(1024, 1024, seed);
    let (width, length) = world.dimensions();
    let mut voxels = Vec::new();
    for (_, chunk) in world.iter() {
        let chunk = query.get(chunk).expect("invalid chunk in world");
        for (vox_pos, vox) in chunk.iter_pos() {
            if crate::terrain::block_at_position(vox_pos, &noise_map) != vox.kind() {
                voxels.push((vox_pos.as_ivec3(), vox.kind()));
            }
        }
    }
    SaveData {
        seed,
        width,
        length,
        voxels,
    }
}
