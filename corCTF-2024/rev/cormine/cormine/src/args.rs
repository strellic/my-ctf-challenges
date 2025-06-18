use argh::FromArgs;
use bevy::prelude::Resource;

/// CoRmine.
#[derive(FromArgs)]
pub struct Arguments {
    #[argh(subcommand)]
    pub commands: Option<ArgumentsCommands>,
}

#[derive(FromArgs)]
#[argh(subcommand)]
pub enum ArgumentsCommands {
    Generate(ArgumentsGenerate),
    Load(ArgumentsLoad),
}

impl Default for ArgumentsCommands {
    fn default() -> Self {
        ArgumentsCommands::Generate(ArgumentsGenerate::default())
    }
}

/// Generate a new world
#[derive(FromArgs, Resource)]
#[argh(subcommand, name = "generate")]
pub struct ArgumentsGenerate {
    /// seed to use for world generation
    #[argh(option)]
    pub seed: Option<u32>,
    /// width of the world in chunks
    #[argh(option, default = "16")]
    pub width: usize,
    /// length of the world in chunks
    #[argh(option, default = "16")]
    pub length: usize,
}

impl Default for ArgumentsGenerate {
    fn default() -> Self {
        Self {
            seed: None,
            width: 16,
            length: 16,
        }
    }
}

/// Load an existing save file
#[derive(FromArgs, Resource)]
#[argh(subcommand, name = "load")]
pub struct ArgumentsLoad {
    /// save file path
    #[argh(positional)]
    pub path: String,
}
