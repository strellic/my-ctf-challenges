use std::sync::OnceLock;

use crate::{
    chunk::{
        Chunk,
        ChunkPosition,
    },
    input::SaveEvent,
    save,
    voxel::{
        Voxel,
        VoxelPosition,
    },
};
use bevy::{
    prelude::*,
    utils::HashMap,
};

#[derive(Default, Resource)]
pub struct World {
    seed: OnceLock<u32>,
    /// The width and length in chunks of the world
    dimensions: OnceLock<(usize, usize)>,
    chunk_map: HashMap<ChunkPosition, Entity>,
}

impl World {
    pub fn add_chunk(&mut self, pos: ChunkPosition, entity: Entity) {
        assert!(
            self.chunk_map.insert(pos, entity).is_none(),
            "Overwriting chunk in map"
        );
    }

    pub fn chunk_at(&self, pos: ChunkPosition) -> Option<Entity> {
        self.chunk_map.get(&pos).copied()
    }

    pub fn chunk_containing(&self, pos: VoxelPosition) -> Option<Entity> {
        let chunk_base: ChunkPosition = pos.into();
        self.chunk_map.get(&chunk_base).copied()
    }

    pub fn voxel_at<'a>(&self, pos: VoxelPosition, chunks: &'a Query<&Chunk>) -> Option<&'a Voxel> {
        let chunk_base: ChunkPosition = pos.into();
        let chunk = self.chunk_map.get(&chunk_base).copied()?;
        let chunk = chunks.get(chunk).unwrap();
        let local_coord = pos.into();

        Some(chunk.voxel(local_coord))
    }

    pub fn set_seed(&mut self, seed: u32) {
        self.seed
            .set(seed)
            .expect("world seed should only be set once")
    }

    pub fn seed(&self) -> u32 {
        *self.seed.get().expect("accessing world seed before set")
    }

    pub fn set_dimensions(&self, size: (usize, usize)) {
        self.dimensions
            .set(size)
            .expect("world dimensions should only be set once")
    }

    pub fn dimensions(&self) -> (usize, usize) {
        *self
            .dimensions
            .get()
            .expect("accessing world dimensions before set")
    }

    /// Iterate over each chunk entity and it's position
    pub fn iter(&self) -> impl Iterator<Item = (ChunkPosition, Entity)> + '_ {
        self.chunk_map.iter().map(|(p, e)| (*p, *e))
    }
}

pub fn process_save_events(
    query: Query<&Chunk>,
    world: Res<World>,
    mut ev_save: EventReader<SaveEvent>,
) {
    if ev_save.read().next().is_none() {
        return;
    }
    let save = save::from_world(query, &world);
    save.to_file("game.cms", true).unwrap();
    info!("Saved to `game.cms`");
}
