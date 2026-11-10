//! Microphone privacy watcher and global mute toggle.
//!
//! Uses Windows Core Audio to detect when any application is actively
//! capturing audio from any recording device (`eCapture`), surfacing an
//! amber indicator with the offending app's name and icon.
//! Also provides global toggle muting for the default microphone.

use std::time::Duration;

use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
use windows::Win32::Media::Audio::{
    AudioSessionStateActive, DEVICE_STATE_ACTIVE, IAudioSessionControl2, IAudioSessionManager2,
    IMMDeviceEnumerator, MMDeviceEnumerator, eCapture, eConsole,
};
use windows::Win32::System::Com::{
    CLSCTX_ALL, COINIT_MULTITHREADED, CoCreateInstance, CoInitializeEx,
};
use windows::core::Interface;

use super::{Activities, Activity, GREEN, ORANGE, RED};
use crate::providers::{now_ms, process};

const POLL: Duration = Duration::from_millis(1500);

/// Toggles mute on the default recording endpoint and shows an island alert.
pub fn toggle_mic_mute() -> Option<bool> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).ok()?;
        let endpoint: IAudioEndpointVolume = enumerator
            .GetDefaultAudioEndpoint(eCapture, eConsole)
            .ok()?
            .Activate(CLSCTX_ALL, None)
            .ok()?;
        let muted = endpoint.GetMute().ok()?.as_bool();
        let next = !muted;
        endpoint.SetMute(next, std::ptr::null()).ok()?;

        if let Some(activities) = super::handle() {
            let (title, glyph, color) = if next {
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
                ..Default::default()
            });
        }
        Some(next)
    }
}

/// Lists all non-island applications currently actively capturing audio.
pub fn active_capture_apps() -> Vec<(u32, String, Option<String>)> {
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
                apps.push((pid, name, icon));
            }
        }
    }
    apps
}

/// Watches for recording devices becoming active/idle.
pub fn watch(activities: Activities) {
    let mut was_active = false;
    loop {
        let active = active_capture_apps();
        if !active.is_empty() {
            let names = active
                .iter()
                .map(|(_, name, _)| name.as_str())
                .collect::<Vec<_>>()
                .join(", ");
            let image = active.first().and_then(|(_, _, icon)| icon.clone());
            activities.upsert(Activity {
                id: "privacy-mic".into(),
                title: "Microphone in use".into(),
                subtitle: Some(format!("Used by {names}")),
                caption: Some("Privacy".into()),
                icon: Some("mic".into()),
                image,
                color: Some(ORANGE.into()),
                priority: 75,
                source: "privacy".into(),
                expires_at: None,
                ..Default::default()
            });
            was_active = true;
        } else if was_active {
            activities.remove("privacy-mic");
            was_active = false;
        }
        std::thread::sleep(POLL);
    }
}

