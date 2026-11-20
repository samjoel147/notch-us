//! Global keyboard status watcher: alerts for Caps Lock and Num Lock toggling.

use std::time::Duration;
use windows::Win32::UI::Input::KeyboardAndMouse::{GetAsyncKeyState, GetKeyState, VK_CAPITAL, VK_NUMLOCK};

use super::{Activities, Activity, GREEN};

const POLL: Duration = Duration::from_millis(50);

pub fn watch(activities: Activities) {
    let mut was_caps_down = false;
    let mut was_num_down = false;

    // Initial toggle states
    let mut last_caps_on = unsafe { GetKeyState(VK_CAPITAL.0 as i32) & 1 != 0 };
    let mut last_num_on = unsafe { GetKeyState(VK_NUMLOCK.0 as i32) & 1 != 0 };

    loop {
        let caps_down = unsafe { (GetAsyncKeyState(VK_CAPITAL.0 as i32) as u16 & 0x8000) != 0 };
        let num_down = unsafe { (GetAsyncKeyState(VK_NUMLOCK.0 as i32) as u16 & 0x8000) != 0 };

        // Key pressed down transition
        if caps_down && !was_caps_down {
            // Give Windows 15ms to flip the toggle bit
            std::thread::sleep(Duration::from_millis(15));
            let is_on = unsafe { GetKeyState(VK_CAPITAL.0 as i32) & 1 != 0 };
            last_caps_on = is_on;
            show_key_alert(&activities, "system.caps_lock", "Caps Lock", is_on);
        } else if !caps_down {
            // Also catch toggle if updated externally
            let is_on = unsafe { GetKeyState(VK_CAPITAL.0 as i32) & 1 != 0 };
            if is_on != last_caps_on && !was_caps_down {
                last_caps_on = is_on;
                show_key_alert(&activities, "system.caps_lock", "Caps Lock", is_on);
            }
        }

        if num_down && !was_num_down {
            std::thread::sleep(Duration::from_millis(15));
            let is_on = unsafe { GetKeyState(VK_NUMLOCK.0 as i32) & 1 != 0 };
            last_num_on = is_on;
            show_key_alert(&activities, "system.num_lock", "Num Lock", is_on);
        } else if !num_down {
            let is_on = unsafe { GetKeyState(VK_NUMLOCK.0 as i32) & 1 != 0 };
            if is_on != last_num_on && !was_num_down {
                last_num_on = is_on;
                show_key_alert(&activities, "system.num_lock", "Num Lock", is_on);
            }
        }

        was_caps_down = caps_down;
        was_num_down = num_down;
        std::thread::sleep(POLL);
    }
}

fn show_key_alert(activities: &Activities, id: &str, title: &str, is_on: bool) {
    let mut alert = Activity::alert(id, "keyboard", Duration::from_millis(1400));
    alert.title = title.to_string();
    alert.subtitle = Some(if is_on { "Active".to_string() } else { "Off".to_string() });
    alert.icon = Some(if is_on { "lock_on".to_string() } else { "lock_off".to_string() });
    alert.color = is_on.then(|| GREEN.into());
    alert.priority = 85;
    activities.upsert(alert);
}
