//! Microphone and camera privacy watcher and global mute toggle.
//!
//! Uses Windows Core Audio (WASAPI) to detect when any application is actively
//! capturing audio or video from recording devices (`eCapture`), surfacing an
//! amber indicator for microphone and green indicator for camera, with the
//! offending app's name and icon.
//! Also provides live audio metering via `IAudioMeterInformation` and a global
//! toggle / master mute for the default recording endpoint.

use std::time::Duration;

use serde::Serialize;
use windows::Win32::Media::Audio::Endpoints::{IAudioEndpointVolume, IAudioMeterInformation};
use windows::Win32::Media::Audio::{
    AudioSessionStateActive, DEVICE_STATE_ACTIVE, IAudioSessionControl2, IAudioSessionManager2,
    IMMDeviceEnumerator, MMDeviceEnumerator, eCapture, eConsole, eMultimedia,
};
use windows::Win32::System::Com::{
    CLSCTX_ALL, COINIT_MULTITHREADED, CoCreateInstance, CoInitializeEx, CoTaskMemFree,
};
use windows::core::Interface;

use super::{Activities, Activity, GREEN, ORANGE, RED};
use crate::providers::{now_ms, process};

const POLL: Duration = Duration::from_millis(1500);

#[derive(Debug, Clone, PartialEq, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CapturingApp {
    pub pid: u32,
    pub name: String,
    pub icon: Option<String>,
    pub kind: String, // "mic" or "camera"
    pub peak: f32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyState {
    pub mic_active: bool,
    pub camera_active: bool,
    pub mic_muted: bool,
    pub apps: Vec<CapturingApp>,
}

/// Checks whether the default microphone is currently muted.
pub fn is_mic_muted() -> bool {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let Ok(enumerator) =
            CoCreateInstance::<_, IMMDeviceEnumerator>(&MMDeviceEnumerator, None, CLSCTX_ALL)
        else {
            return false;
        };
        let Ok(endpoint) = enumerator
            .GetDefaultAudioEndpoint(eCapture, eConsole)
            .or_else(|_| enumerator.GetDefaultAudioEndpoint(eCapture, eMultimedia))
        else {
            return false;
        };
        let Ok(volume) = endpoint.Activate::<IAudioEndpointVolume>(CLSCTX_ALL, None) else {
            return false;
        };
        volume.GetMute().map(|m| m.as_bool()).unwrap_or(false)
    }
}

/// Sets mute on the default recording endpoint and shows an island alert.
pub fn set_mic_mute(muted: bool) -> Option<bool> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).ok()?;
        let endpoint: IAudioEndpointVolume = enumerator
            .GetDefaultAudioEndpoint(eCapture, eConsole)
            .or_else(|_| enumerator.GetDefaultAudioEndpoint(eCapture, eMultimedia))
            .ok()?
            .Activate(CLSCTX_ALL, None)
            .ok()?;
        endpoint.SetMute(muted, std::ptr::null()).ok()?;

        if let Some(activities) = super::handle() {
            let (title, glyph, color) = if muted {
                ("Microphone Muted", "mute", RED)
            } else {
                ("Microphone Unmuted", "mic", GREEN)
            };
            activities.upsert(Activity {
                id: "privacy-mute-alert".into(),
                title: title.into(),
                icon: Some(glyph.into()),
                color: Some(color.into()),
                priority: 95,
                source: "privacy".into(),
                expires_at: Some(now_ms() + 1800),
                expand: true,
                ..Default::default()
            });
            activities.update_privacy_mute(muted);
        }
        Some(muted)
    }
}

/// Toggles mute on the default recording endpoint and shows an island alert.
pub fn toggle_mic_mute() -> Option<bool> {
    let current = is_mic_muted();
    set_mic_mute(!current)
}

/// Lists all non-island applications currently actively capturing audio or video.
pub fn active_capture_apps() -> Vec<CapturingApp> {
    let mut apps = Vec::new();
    let current_pid = std::process::id();
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let Ok(enumerator) =
            CoCreateInstance::<_, IMMDeviceEnumerator>(&MMDeviceEnumerator, None, CLSCTX_ALL)
        else {
            return apps;
        };
        let Ok(devices) = enumerator.EnumAudioEndpoints(eCapture, DEVICE_STATE_ACTIVE) else {
            return apps;
        };
        let count = devices.GetCount().unwrap_or(0);
        let mut seen = std::collections::HashSet::new();

        for i in 0..count {
            let Ok(device) = devices.Item(i) else {
                continue;
            };

            let is_camera_device = if let Ok(raw) = device.GetId() {
                let id_str = raw.to_string().unwrap_or_default().to_lowercase();
                CoTaskMemFree(Some(raw.0 as _));
                id_str.contains("camera") || id_str.contains("webcam") || id_str.contains("vid_")
            } else {
                false
            };

            let Ok(manager) = device.Activate::<IAudioSessionManager2>(CLSCTX_ALL, None) else {
                continue;
            };
            let Ok(sessions) = manager.GetSessionEnumerator() else {
                continue;
            };
            let scount = sessions.GetCount().unwrap_or(0);

            for j in 0..scount {
                let Ok(session) = sessions.GetSession(j) else {
                    continue;
                };
                if session.GetState().ok() != Some(AudioSessionStateActive) {
                    continue;
                }
                let Ok(control) = session.cast::<IAudioSessionControl2>() else {
                    continue;
                };
                let Some(pid) = control
                    .GetProcessId()
                    .ok()
                    .filter(|&p| p != 0 && p != current_pid)
                else {
                    continue;
                };
                if !seen.insert(pid) {
                    continue;
                }
                let Some(path) = process::exe_path(pid) else {
                    continue;
                };
                let name = process::app_name(&path);
                let icon = process::app_icon(&path);

                let peak = if let Ok(meter) = session.cast::<IAudioMeterInformation>() {
                    meter.GetPeakValue().unwrap_or(0.0)
                } else {
                    0.0
                };

                let name_lower = name.to_lowercase();
                let path_lower = path.to_string_lossy().to_lowercase();
                let is_video_app = is_camera_device
                    || name_lower.contains("camera")
                    || name_lower.contains("webcam")
                    || path_lower.contains("camera")
                    || path_lower.contains("webcam")
                    || name_lower.contains("zoom")
                    || name_lower.contains("teams")
                    || name_lower.contains("skype")
                    || name_lower.contains("meet")
                    || name_lower.contains("obs")
                    || path_lower.contains("obs-studio");

                let kind = if is_video_app {
                    "both".to_string()
                } else {
                    "mic".to_string()
                };

                apps.push(CapturingApp {
                    pid,
                    name,
                    icon,
                    kind,
                    peak,
                });
            }
        }
    }
    apps
}

/// Watches for recording devices becoming active/idle.
pub fn watch(activities: Activities) {
    let mut was_active = false;
    let mut last_activity_desc: Option<(String, String, Option<String>, &'static str)> = None;

    loop {
        let apps = active_capture_apps();
        let mic_muted = is_mic_muted();
        let mic_active = apps.iter().any(|a| a.kind == "mic" || a.kind == "both");
        let camera_active = apps.iter().any(|a| a.kind == "camera" || a.kind == "both");

        let state = PrivacyState {
            mic_active,
            camera_active,
            mic_muted,
            apps: apps.clone(),
        };
        activities.update_privacy(state);

        if !apps.is_empty() {
            let names = apps
                .iter()
                .map(|a| a.name.as_str())
                .collect::<Vec<_>>()
                .join(", ");
            let image = apps.first().and_then(|a| a.icon.clone());

            let (title, icon, color) = if camera_active && mic_active {
                ("Camera & Microphone in use", "video", GREEN)
            } else if camera_active {
                ("Camera in use", "video", GREEN)
            } else if mic_muted {
                ("Microphone in use (Muted)", "mute", RED)
            } else {
                ("Microphone in use", "mic", ORANGE)
            };

            let current_desc = (title.to_string(), names.clone(), image.clone(), color);
            if !was_active || last_activity_desc.as_ref() != Some(&current_desc) {
                activities.upsert(Activity {
                    id: "privacy-mic".into(),
                    title: title.into(),
                    subtitle: Some(format!("Used by {names}")),
                    caption: Some("Privacy".into()),
                    icon: Some(icon.into()),
                    image,
                    color: Some(color.into()),
                    priority: 75,
                    source: "privacy".into(),
                    expires_at: None,
                    ..Default::default()
                });
                last_activity_desc = Some(current_desc);
                was_active = true;
            }
        } else if was_active {
            activities.remove("privacy-mic");
            last_activity_desc = None;
            was_active = false;
        }
        std::thread::sleep(POLL);
    }
}
