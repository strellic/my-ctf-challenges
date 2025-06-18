use bevy::{
    diagnostic::{
        DiagnosticsStore,
        EntityCountDiagnosticsPlugin,
        FrameTimeDiagnosticsPlugin,
    },
    input::{
        keyboard::KeyboardInput,
        ButtonState,
    },
    pbr::wireframe::WireframeConfig,
    prelude::*,
};

use bevy_egui::{
    egui,
    EguiContexts,
    EguiPlugin,
    EguiSet,
};

#[derive(Default, Resource)]
struct DebugUiState {
    perf_stats: bool,
    player_info: bool,
}

fn display_perf_stats(mut egui: EguiContexts, diagnostics: Res<DiagnosticsStore>) {
    egui::Window::new("Perf Info").show(egui.ctx_mut(), |ui| {
        ui.label(format!(
            "Avg. FPS: {}",
            diagnostics
                .get(&FrameTimeDiagnosticsPlugin::FPS)
                .unwrap()
                .average()
                .unwrap_or_default() as u32
        ));
        ui.label(format!(
            "Total Entity count: {}",
            diagnostics
                .get(&EntityCountDiagnosticsPlugin::ENTITY_COUNT)
                .unwrap()
                .average()
                .unwrap_or_default() as u32
        ));
    });
}

fn should_display_perf_stats(state: Res<DebugUiState>) -> bool {
    state.perf_stats
}

fn display_player_info(mut egui: EguiContexts, player: Query<&Transform, With<Camera>>) {
    let camera_trans = player.single();
    egui::Window::new("Player Info").show(egui.ctx_mut(), |ui| {
        ui.label(format!("Position: {:.1}", camera_trans.translation));
        ui.label(format!("Facing: {:.1}", camera_trans.forward().as_vec3()));
    });
}

fn should_display_player_info(state: Res<DebugUiState>) -> bool {
    state.player_info
}

fn toggle_debug_ui_displays(
    mut inputs: EventReader<KeyboardInput>,
    mut ui_state: ResMut<DebugUiState>,
    #[cfg(feature = "wireframe")] mut wireframe_cfg: ResMut<WireframeConfig>,
) {
    for input in inputs.read() {
        match (input.key_code, input.state) {
            (KeyCode::F3, ButtonState::Pressed) => {
                ui_state.perf_stats = !ui_state.perf_stats;
            }
            (KeyCode::F4, ButtonState::Pressed) => {
                ui_state.player_info = !ui_state.player_info;
            }
            #[cfg(feature = "wireframe")]
            (KeyCode::F5, ButtonState::Pressed) => {
                wireframe_cfg.global = !wireframe_cfg.global;
            }
            _ => {}
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, SystemSet)]
/// Systems related to the debug UIs.
enum DebugUiSet {
    Toggle,
    Display,
}

pub struct DebugUiPlugins;

impl Plugin for DebugUiPlugins {
    fn build(&self, app: &mut App) {
        app.add_plugins(EguiPlugin)
            .add_plugins(FrameTimeDiagnosticsPlugin)
            .add_plugins(EntityCountDiagnosticsPlugin)
            .add_systems(Update, toggle_debug_ui_displays.in_set(DebugUiSet::Toggle))
            .add_systems(
                Update,
                display_perf_stats
                    .in_set(DebugUiSet::Display)
                    .run_if(should_display_perf_stats),
            )
            .add_systems(
                Update,
                display_player_info
                    .in_set(DebugUiSet::Display)
                    .run_if(should_display_player_info),
            )
            .configure_sets(
                Update,
                (DebugUiSet::Toggle, DebugUiSet::Display)
                    .chain()
                    .after(EguiSet::ProcessInput),
            )
            .init_resource::<DebugUiState>();
    }
}
