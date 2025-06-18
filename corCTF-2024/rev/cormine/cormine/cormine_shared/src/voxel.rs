use anyhow::anyhow;

#[derive(Default, Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum VoxelKind {
    #[default]
    Air = 255,
    Stone = 0,
    Grass = 1,
    Water = 2,
    Snow = 3,
    Dirt = 4,
    Bedrock = 5,
}

impl TryFrom<u8> for VoxelKind {
    type Error = anyhow::Error;

    fn try_from(value: u8) -> anyhow::Result<Self> {
        use VoxelKind::*;
        Ok(match value {
            0 => Stone,
            1 => Grass,
            2 => Water,
            3 => Snow,
            4 => Dirt,
            5 => Bedrock,
            255 => Air,
            x => return Err(anyhow!("invalid voxel kind `{x}`")),
        })
    }
}

impl VoxelKind {
    pub fn should_mesh(&self) -> bool {
        !matches!(self, VoxelKind::Air)
    }

    pub fn transparent(&self) -> bool {
        matches!(self, VoxelKind::Air | VoxelKind::Water)
    }

    pub fn has_collision(&self) -> bool {
        !matches!(self, VoxelKind::Air | VoxelKind::Water)
    }

    pub fn casts_shadow(&self) -> bool {
        !matches!(self, VoxelKind::Air | VoxelKind::Water)
    }

    pub fn receives_shadow(&self) -> bool {
        !matches!(self, VoxelKind::Air | VoxelKind::Water)
    }

    pub fn breakable(&self) -> bool {
        !matches!(self, VoxelKind::Bedrock)
    }

    pub fn cull_faces(&self) -> bool {
        !matches!(self, VoxelKind::Bedrock)
    }
}
