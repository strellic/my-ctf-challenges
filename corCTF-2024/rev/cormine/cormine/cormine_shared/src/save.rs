use crate::voxel::VoxelKind;

use std::{
    io::{
        Read,
        Seek,
        Write,
    },
    path::Path,
};

use anyhow::Result;
use glam::{
    ivec3,
    IVec3,
};
use rand::{
    RngCore,
    SeedableRng,
};

pub struct SaveData {
    pub seed: u32,
    pub width: usize,
    pub length: usize,
    pub voxels: Vec<(IVec3, VoxelKind)>,
}

impl SaveData {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let file = std::fs::OpenOptions::new()
            .read(true)
            .write(false)
            .create(false)
            .open(path)?;
        Self::from_reader(Serializer { cursor: file })
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_reader(Serializer {
            cursor: std::io::Cursor::new(bytes),
        })
    }

    fn from_reader<Cursor>(mut reader: Serializer<Cursor>) -> Result<Self>
    where
        Cursor: Seek + Read,
    {
        let seed = reader.read_u32()?;
        let width = reader.read_leb128_unsigned()? as _;
        let length = reader.read_leb128_unsigned()? as _;
        let mut voxels = Vec::new();
        let mut rng = rand::rngs::StdRng::seed_from_u64(seed as u64);

        // 1. Cast read value to i32
        // 2. Get next u32 rand value, cast to i32
        // 3. Xor with read value and save
        loop {
            let Ok(x) = reader.read_leb128_signed() else {
                break;
            };
            let x = x as i32 ^ rng.next_u32() as i32;
            let y = reader.read_leb128_signed()? as i32 ^ rng.next_u32() as i32;
            let z = reader.read_leb128_signed()? as i32 ^ rng.next_u32() as i32;
            let kind = (reader.read_byte()? ^ rng.next_u32() as u8).try_into()?;
            voxels.push((ivec3(x, y, z), kind))
        }
        Ok(Self {
            seed,
            width,
            length,
            voxels,
        })
    }

    pub fn to_file<P: AsRef<Path>>(&self, path: P, replace: bool) -> Result<()> {
        let mut options = std::fs::OpenOptions::new();
        options.read(false).write(true);
        if replace {
            options.create(true);
            options.truncate(true);
        } else {
            options.create_new(true);
        }
        let file = options.open(path)?;
        self.to_writer(Serializer { cursor: file })
    }

    fn to_writer<Cursor>(&self, mut writer: Serializer<Cursor>) -> Result<()>
    where
        Cursor: Seek + Write,
    {
        writer.write_u32(self.seed)?;
        writer.write_leb128_unsigned(self.width as _)?;
        writer.write_leb128_unsigned(self.length as _)?;
        let mut rng = rand::rngs::StdRng::seed_from_u64(self.seed as u64);

        // 1. Get next u32 rand value, cast to i32
        // 2. xor with position
        // 3. Cast xor'd value to i64 and write
        for &(vox_pos, vox) in &self.voxels {
            writer.write_leb128_signed((vox_pos.x ^ rng.next_u32() as i32) as i64)?;
            writer.write_leb128_signed((vox_pos.y ^ rng.next_u32() as i32) as i64)?;
            writer.write_leb128_signed((vox_pos.z ^ rng.next_u32() as i32) as i64)?;
            writer.write_byte(vox as u8 ^ rng.next_u32() as u8)?;
        }
        Ok(())
    }
}

pub struct Serializer<Cursor> {
    cursor: Cursor,
}

impl<Cursor> Serializer<Cursor> {
    pub fn new(cursor: Cursor) -> Self {
        Self { cursor }
    }
}

impl<Cursor> Serializer<Cursor>
where
    Cursor: Seek + Read,
{
    pub fn read_byte(&mut self) -> Result<u8> {
        let mut byte = [0];
        self.cursor.read_exact(&mut byte)?;
        Ok(byte[0])
    }

    pub fn read_bytes<const N: usize>(&mut self) -> Result<[u8; N]> {
        let mut bytes = [0; N];
        self.cursor.read_exact(&mut bytes)?;
        Ok(bytes)
    }

    pub fn read_u32(&mut self) -> Result<u32> {
        Ok(u32::from_le_bytes(self.read_bytes()?))
    }

    pub fn read_leb128_signed(&mut self) -> Result<i64> {
        Ok(leb128::read::signed(&mut self.cursor)?)
    }

    pub fn read_leb128_unsigned(&mut self) -> Result<u64> {
        Ok(leb128::read::unsigned(&mut self.cursor)?)
    }
}

impl<Cursor> Serializer<Cursor>
where
    Cursor: Seek + Write,
{
    pub fn write_byte(&mut self, byte: u8) -> Result<()> {
        let byte = [byte];
        self.cursor.write_all(&byte)?;
        Ok(())
    }

    pub fn write_bytes<const N: usize>(&mut self, bytes: [u8; N]) -> Result<()> {
        self.cursor.write_all(&bytes)?;
        Ok(())
    }

    pub fn write_u32(&mut self, val: u32) -> Result<()> {
        self.write_bytes(u32::to_le_bytes(val))
    }

    pub fn write_leb128_signed(&mut self, value: i64) -> Result<()> {
        leb128::write::signed(&mut self.cursor, value)?;
        Ok(())
    }

    pub fn write_leb128_unsigned(&mut self, value: u64) -> Result<()> {
        leb128::write::unsigned(&mut self.cursor, value)?;
        Ok(())
    }
}
