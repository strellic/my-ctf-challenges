use std::{
    env::args,
    fs::{File, OpenOptions},
    io::{Read, Seek, Write},
};

use anyhow::Result;
use rand::{RngCore, SeedableRng};

pub struct Reader {
    cursor: File,
}

impl Reader {
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

fn main() -> Result<()> {
    let file = args().nth(1).expect("expected save file name");
    let file = OpenOptions::new()
        .write(true)
        .read(true)
        .create(false)
        .open(&file)
        .expect("couldn't open file");

    let mut reader = Reader { cursor: file };
    let seed = reader.read_u32()?;
    let _ = reader.read_leb128_unsigned()?;
    let _ = reader.read_leb128_unsigned()?;
    let mut rng = rand::rngs::StdRng::seed_from_u64(seed as u64);

    loop {
        let entry_start = reader.cursor.stream_position().unwrap();
        let Ok(_) = reader.read_leb128_signed() else {
            break;
        };
        rng.next_u32();
        let _ = reader.read_leb128_signed()?;
        rng.next_u32();
        let _ = reader.read_leb128_signed()?;
        rng.next_u32();

        let vox_rand = rng.next_u32() as u8;
        let voxelkind = reader.read_byte()? ^ vox_rand;
        match voxelkind {
            255 => {
                reader.cursor.seek(std::io::SeekFrom::Current(-1))?;
                reader.cursor.write_all(&[3 ^ vox_rand])?;
            }
            0 => {
                reader.cursor.set_len(entry_start)?;
                break;
            }
            _ => (),
        }
    }
    Ok(())
}
