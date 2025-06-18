use bevy::prelude::*;
use renderdoc::*;

pub use renderdoc;

pub type RenderDocVersion = V110;

pub type RenderDocResource = RenderDoc<RenderDocVersion>;

pub struct RenderDocPlugin;
impl Plugin for RenderDocPlugin {
    fn build(&self, app: &mut App) {
        match RenderDoc::<RenderDocVersion>::new() {
            Ok(mut rd) => {
                rd.set_log_file_path_template("renderdoc/bevy_capture");
                rd.mask_overlay_bits(OverlayBits::NONE, OverlayBits::NONE);

                app.world_mut().insert_non_send_resource(rd);
                info!("Initialized RenderDoc");
                app.add_systems(Update, trigger_capture);
            }
            Err(e) => {
                error!("Failed to initialize RenderDoc. Ensure RenderDoc is installed and visible from your $PATH. Error: \"{}\"", e);
            }
        }
    }
}

fn trigger_capture(
    key: Res<ButtonInput<KeyCode>>,
    rd: NonSend<RenderDocResource>,
    mut replay_pid: Local<usize>,
) {
    if key.just_pressed(KeyCode::F12) && !rd.is_remote_access_connected() {
        match rd.launch_replay_ui(true, None) {
            Ok(pid) => {
                *replay_pid = pid as usize;
                info!("Launching RenderDoc Replay UI");
            }
            Err(e) => error!("Failed to launch RenderDoc Replay UI: {}", e),
        }
    }
}
