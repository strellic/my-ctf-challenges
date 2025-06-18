use bevy::math::{
    ivec3,
    vec3,
    IVec3,
    Vec3,
};

use crate::chunk::{
    ChunkPosition,
    CHUNK_SIZE,
    CHUNK_SIZE_I,
    MAX_HEIGHT,
};
pub use cormine_shared::voxel::VoxelKind;

/// X, Y and Z coordinate of voxel within the world
#[derive(Copy, Clone, Debug, Hash)]
pub struct VoxelPosition(IVec3);

impl VoxelPosition {
    pub fn new(position: IVec3) -> Self {
        Self(position)
    }

    pub fn x(&self) -> i32 {
        self.0.x
    }

    pub fn y(&self) -> i32 {
        self.0.y
    }

    pub fn z(&self) -> i32 {
        self.0.z
    }

    pub fn as_ivec3(&self) -> IVec3 {
        ivec3(self.x(), self.y(), self.z())
    }

    pub fn as_vec3(&self) -> Vec3 {
        vec3(self.x() as _, self.y() as _, self.z() as _)
    }

    // Calculate the 4 possible chunks neighbouring this one
    pub fn neighbouring_chunks(&self) -> NeighbouringChunks {
        let this_chunk: &ChunkPosition = &(*self).into();
        let neg_x =
            (self.x() % CHUNK_SIZE_I == 0).then(|| this_chunk + IVec3::NEG_X * CHUNK_SIZE_I);

        let x = (self.x() % CHUNK_SIZE_I == CHUNK_SIZE_I - 1)
            .then(|| this_chunk + IVec3::X * CHUNK_SIZE_I);

        let neg_z =
            (self.z() % CHUNK_SIZE_I == 0).then(|| this_chunk + IVec3::NEG_Z * CHUNK_SIZE_I);

        let z = (self.z() % CHUNK_SIZE_I == CHUNK_SIZE_I - 1)
            .then(|| this_chunk + IVec3::Z * CHUNK_SIZE_I);

        NeighbouringChunks { neg_x, x, neg_z, z }
    }
}

/// The four chunks that may border a given voxel if it lies on a boundary
pub struct NeighbouringChunks {
    pub neg_x: Option<ChunkPosition>,
    pub x: Option<ChunkPosition>,
    pub neg_z: Option<ChunkPosition>,
    pub z: Option<ChunkPosition>,
}

impl NeighbouringChunks {
    pub fn all(&self) -> [Option<ChunkPosition>; 4] {
        [self.neg_x, self.x, self.neg_z, self.z]
    }
}

/// Position of a voxel within a chunk. Will all be within [0,
/// CHUNK_DIMENSION_SIZE]
#[derive(Copy, Clone, Debug, Hash)]
pub struct LocalVoxelPosition {
    x: u8,
    y: u32,
    z: u8,
}

impl LocalVoxelPosition {
    pub fn new(x: u32, y: u32, z: u32) -> Self {
        debug_assert!(
            (x as usize) < CHUNK_SIZE && (y as usize) < MAX_HEIGHT && (z as usize) < CHUNK_SIZE,
            "({x}, {y}, {z}) is not within chunk ranges"
        );
        Self {
            x: x as _,
            y,
            z: z as _,
        }
    }

    pub fn x(&self) -> u32 {
        self.x.into()
    }

    pub fn y(&self) -> u32 {
        self.y
    }

    pub fn z(&self) -> u32 {
        self.z.into()
    }

    pub fn as_ivec3(&self) -> IVec3 {
        ivec3(self.x as _, self.y as _, self.z as _)
    }
}

impl From<VoxelPosition> for LocalVoxelPosition {
    fn from(position: VoxelPosition) -> Self {
        let chunk_pos: ChunkPosition = position.into();
        let x = position.x() - chunk_pos.x();
        let y = position.y();
        let z = position.z() - chunk_pos.z();
        debug_assert!(
            x >= 0 && y >= 0 && z >= 0,
            "({x}, {y}, {z}) is not positive"
        );

        LocalVoxelPosition::new(x as _, y as _, z as _)
    }
}

impl From<LocalVoxelPosition> for [usize; 3] {
    fn from(position: LocalVoxelPosition) -> Self {
        [position.x as _, position.y as _, position.z as _]
    }
}

#[derive(Default, Copy, Clone, Debug)]
pub struct Voxel {
    pub kind: VoxelKind,
}

impl Voxel {
    pub const AIR: Self = Self {
        kind: VoxelKind::Air,
    };

    pub const STONE: Self = Self {
        kind: VoxelKind::Stone,
    };

    pub const GRASS: Self = Self {
        kind: VoxelKind::Grass,
    };

    pub const WATER: Self = Self {
        kind: VoxelKind::Water,
    };

    pub const BEDROCK: Self = Self {
        kind: VoxelKind::Bedrock,
    };

    pub fn should_mesh(&self) -> bool {
        self.kind().should_mesh()
    }

    pub fn transparent(&self) -> bool {
        self.kind().transparent()
    }

    pub fn has_collision(&self) -> bool {
        self.kind().has_collision()
    }

    pub fn casts_shadow(&self) -> bool {
        self.kind().casts_shadow()
    }

    pub fn receives_shadow(&self) -> bool {
        self.kind().receives_shadow()
    }

    pub fn cull_faces(&self) -> bool {
        self.kind().cull_faces()
    }

    pub fn breakable(&self) -> bool {
        self.kind().breakable()
    }

    pub fn kind(&self) -> VoxelKind {
        self.kind
    }

    pub fn clear(&mut self) {
        self.kind = VoxelKind::Air;
    }
}
