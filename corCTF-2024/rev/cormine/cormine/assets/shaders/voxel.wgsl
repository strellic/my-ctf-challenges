#import bevy_pbr::mesh_functions;
#import bevy_pbr::view_transformations;

@group(2) @binding(1) var<uniform> light_color: vec4<f32>;
@group(2) @binding(2) var<uniform> light_dir: vec3<f32>;
@group(2) @binding(3) var<uniform> selected_voxel: vec3<f32>;
@group(2) @binding(4) var<uniform> has_selected: u32;
@group(2) @binding(5) var texture: texture_2d_array<f32>;
@group(2) @binding(6) var texture_sampler: sampler;

const AMBIENT_STRENGTH: f32 = 0.1;
const OUTLINE_THICKNESS: f32 = 0.1;

struct Vertex {
    @builtin(instance_index) instance_index: u32,
    @location(0) position: vec3<f32>,
    @location(1) vertex_data: u32,
}

var<private> VOXEL_NORMALS: array<vec3<f32>, 6> = array<vec3<f32>, 6>(
    vec3(0., 0., -1.),
    vec3(0., 0., 1.),
    vec3(-1., 0., 0.),
    vec3(1., 0., 0.),
    vec3(0., -1., 0.),
    vec3(0., 1., 0.),
);

var<private> VOXEL_UVS: array<vec2<f32>, 4> = array<vec2<f32>, 4>(
    vec2(1.0, 0.0),
    vec2(0.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
);

struct VertexOut {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) position: vec3<f32>,
    @location(1) @interpolate(flat) vertex_data: u32,
    @location(2) normal: vec3<f32>,
    @location(3) uv: vec2<f32>,
    @location(4) ao_level: f32,
}

// vertex_data bitfield
// N - Normal index
// M - Material
// U - UV index
// O - Number of neighbours (for AO)
// XXXXXXXX XXXXXXXX XXXXXXXO OUUMMMNNN

@vertex
fn vertex(vertex: Vertex) -> VertexOut {
    let model = mesh_functions::get_world_from_local(vertex.instance_index);
    let world_position = mesh_functions::mesh_position_local_to_world(model, vec4<f32>(vertex.position, 1.0));
    let normal_idx = extractBits(vertex.vertex_data, 0u, 3u);

    var out: VertexOut;
    out.clip_position = view_transformations::position_world_to_clip(world_position.xyz);
    out.position = world_position.xyz;
    out.vertex_data = vertex.vertex_data;
    out.normal = VOXEL_NORMALS[normal_idx];
    out.uv = VOXEL_UVS[extractBits(vertex.vertex_data, 6u, 2u)];
    switch extractBits(vertex.vertex_data, 8u, 2u) {
        // Number of non-occluding neighbours of this vertex
        case 0u {
            out.ao_level = 0.1;
        }
        case 1u {
            out.ao_level = 0.25;
        }
        case 2u {
            out.ao_level= 0.5;
        }
        default {
            out.ao_level = 1.0;
        }
    }
    return out;
}

fn is_between(v: vec3<f32>, min: vec3<f32>, max: vec3<f32>) -> bool {
    // Fuzz this detection a bit to avoid z fighting
    let greater_than_min = all(v >= min - vec3(0.001));
    let less_than_max = all(v <= max + vec3(0.001));
    return greater_than_min && less_than_max;
}

@fragment
fn fragment(
    mesh: VertexOut,
) -> @location(0) vec4<f32> {
    let norm = normalize(mesh.normal);
    let light_dir = normalize(light_dir);
    let diff_strength = max(dot(norm, light_dir), 0.0);
    let diff_color = light_color * diff_strength;
    let ambient_color = light_color * AMBIENT_STRENGTH;
    let material_idx = extractBits(mesh.vertex_data, 3u, 3u);
    let material_color = textureSample(texture, texture_sampler, mesh.uv, material_idx);

#ifdef AO_DEBUG
    var out = vec4<f32>(mesh.ao_level);
#else
    var out = material_color * (ambient_color + diff_color);
    out *= mesh.ao_level;
#endif

    if bool(has_selected) && is_between(mesh.position, selected_voxel, selected_voxel + vec3(1.0)) {
        out *= 0.7;
    }
    return out;
}