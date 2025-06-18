use crate::mesh;
use bevy::{
    asset::{
        Asset,
        Assets,
        Handle,
    },
    color::{
        LinearRgba,
        Srgba,
    },
    math::{
        vec3,
        Vec3,
    },
    pbr::{
        Material,
        MaterialPipeline,
        MaterialPipelineKey,
    },
    prelude::*,
    render::{
        mesh::MeshVertexBufferLayoutRef,
        render_resource::{
            AsBindGroup,
            RenderPipelineDescriptor,
            ShaderRef,
            SpecializedMeshPipelineError,
        },
        texture::ImageSampler,
    },
};

pub fn make_voxel_material(
    mut commands: Commands,
    mut materials: ResMut<Assets<VoxelMaterial>>,
    assets: Res<AssetServer>,
) {
    let img_handle = assets.load("embedded://cormine/../assets/images/blocks.png");
    let handle = materials.add(VoxelMaterial {
        light_color: Srgba::WHITE.into(),
        light_dir: vec3(1.0, 1.0, 1.0),
        selected_voxel: Vec3::ZERO,
        has_selected: 0,
        block_textures: img_handle.clone(),
    });
    commands.insert_resource(VoxelMaterialResource {
        handle,
        img_handle,
        textures_loaded: false,
    });
}

// We have to reinterpret the image lazily as assets are loaded asynchronously
pub fn process_block_texture(
    mut images: ResMut<Assets<Image>>,
    mut material: ResMut<VoxelMaterialResource>,
) {
    if material.textures_loaded {
        return;
    }
    let Some(image) = images.get_mut(&material.img_handle) else {
        return;
    };
    image.reinterpret_stacked_2d_as_array(6);
    image.sampler = ImageSampler::nearest();
    material.textures_loaded = true;
}

#[derive(Resource)]
pub struct VoxelMaterialResource {
    pub(crate) handle: Handle<VoxelMaterial>,
    img_handle: Handle<Image>,
    textures_loaded: bool,
}

#[derive(AsBindGroup, Reflect, Asset, Debug, Clone)]
pub struct VoxelMaterial {
    #[uniform(1)]
    light_color: LinearRgba,
    #[uniform(2)]
    light_dir: Vec3,
    #[uniform(3)]
    pub selected_voxel: Vec3,
    #[uniform(4)]
    pub has_selected: u32,
    #[texture(5, dimension = "2d_array")]
    #[sampler(6)]
    block_textures: Handle<Image>,
}

impl Material for VoxelMaterial {
    fn vertex_shader() -> ShaderRef {
        "embedded://cormine/../assets/shaders/voxel.wgsl".into()
    }
    fn fragment_shader() -> ShaderRef {
        "embedded://cormine/../assets/shaders/voxel.wgsl".into()
    }
    fn specialize(
        _: &MaterialPipeline<Self>,
        descriptor: &mut RenderPipelineDescriptor,
        layout: &MeshVertexBufferLayoutRef,
        _: MaterialPipelineKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        let vtx_layout = layout.0.get_layout(&[
            Mesh::ATTRIBUTE_POSITION.at_shader_location(0),
            mesh::VOXEL_VERTEX_DATA.at_shader_location(1),
        ])?;
        descriptor.vertex.buffers = vec![vtx_layout];
        Ok(())
    }
    fn alpha_mode(&self) -> AlphaMode {
        AlphaMode::Opaque
    }
}
