//! Files dragged in from other apps (Explorer…) onto the island.
//!
//! wry has a drop handler, but it only hooks the webview's child windows that
//! exist when the webview is created. The island starts hidden and WebView2
//! creates (and replaces) its windows later, so OLE found no target there and
//! showed the "no" cursor. This one is registered on the island window and
//! every child it has right now, each time a drag comes near (`window.rs`).
//!
//! The frontend gets `island://file-drop` events (see `useFileDrop.ts`).

use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;
use tauri::{AppHandle, WebviewWindow};

pub const EVENT: &str = "island://file-drop";

/// The island itself is dragging files out (shelf, clipboard history). Its own
/// drop target must ignore that drag: taking it for files coming in opened the
/// drop zone mid-drag and the drop elsewhere was often lost.
static OUTGOING: AtomicBool = AtomicBool::new(false);

/// Runs a drag that starts on the island; it blocks until the drop.
pub fn outgoing<R>(drag: impl FnOnce() -> R) -> R {
    OUTGOING.store(true, Ordering::Relaxed);
    let result = drag();
    OUTGOING.store(false, Ordering::Relaxed);
    result
}

/// Whether a drag the drop target sees should be taken as files coming in.
fn incoming(has_files: bool) -> bool {
    has_files && !OUTGOING.load(Ordering::Relaxed)
}

#[cfg_attr(not(windows), allow(dead_code))]
#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum DropEvent {
    Enter,
    Leave,
    Drop { paths: Vec<String> },
}

/// (Re)registers the drop target. Must run on the window's thread.
#[cfg(windows)]
pub fn hook(app: &AppHandle, win: &WebviewWindow) {
    use windows::Win32::Foundation::{HWND, LPARAM};
    use windows::Win32::System::Ole::{IDropTarget, RegisterDragDrop, RevokeDragDrop};
    use windows::Win32::UI::WindowsAndMessaging::EnumChildWindows;
    use windows::core::BOOL;

    let Ok(hwnd) = win.hwnd() else {
        return;
    };
    let hwnd = HWND(hwnd.0);
    let target: IDropTarget = imp::Target::new(app.clone()).into();

    let register = |h: HWND| unsafe {
        // Replaces wry's (or WebView2's own) target; fails quietly on windows
        // of another process.
        let _ = RevokeDragDrop(h);
        let _ = RegisterDragDrop(h, &target);
    };
    register(hwnd);

    unsafe extern "system" fn each(h: HWND, lparam: LPARAM) -> BOOL {
        let f = unsafe { &mut *(lparam.0 as *mut &mut dyn FnMut(HWND)) };
        f(h);
        true.into()
    }
    let mut f = register;
    let mut dyn_f: &mut dyn FnMut(HWND) = &mut f;
    let _ = unsafe {
        EnumChildWindows(
            Some(hwnd),
            Some(each),
            LPARAM(&mut dyn_f as *mut _ as isize),
        )
    };
}

#[cfg(not(windows))]
pub fn hook(_: &AppHandle, _: &WebviewWindow) {}

#[cfg(windows)]
mod imp {
    use std::cell::Cell;
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    use tauri::{AppHandle, Emitter, Manager};
    use windows::Win32::Foundation::{HGLOBAL, POINTL};
    use windows::Win32::System::Com::{DVASPECT_CONTENT, FORMATETC, IDataObject, TYMED_HGLOBAL};
    use windows::Win32::System::Memory::{GlobalLock, GlobalSize, GlobalUnlock};
    use windows::Win32::System::Ole::{
        CF_DIB, CF_HDROP, CF_UNICODETEXT, DROPEFFECT, DROPEFFECT_COPY, DROPEFFECT_NONE,
        IDropTarget, IDropTarget_Impl, ReleaseStgMedium,
    };
    use windows::Win32::System::SystemServices::MODIFIERKEYS_FLAGS;
    use windows::Win32::UI::Shell::{DragQueryFileW, HDROP};
    use windows::core::{Ref, implement};

    use super::{DropEvent, EVENT, incoming};

    #[implement(IDropTarget)]
    pub struct Target {
        app: AppHandle,
        /// The dragged thing holds files, links, or images.
        files: Cell<bool>,
    }

    impl Target {
        pub fn new(app: AppHandle) -> Self {
            Self {
                app,
                files: Cell::new(false),
            }
        }

        fn emit(&self, event: DropEvent) {
            let _ = self.app.emit(EVENT, event);
        }
    }

    /// Checks if the data object holds files, URLs, or images.
    fn droppable(data: Option<&IDataObject>) -> bool {
        let Some(data) = data else {
            return false;
        };
        let check = |cf: u16| {
            let format = FORMATETC {
                cfFormat: cf,
                ptd: std::ptr::null_mut(),
                dwAspect: DVASPECT_CONTENT.0,
                lindex: -1,
                tymed: TYMED_HGLOBAL.0 as u32,
            };
            unsafe { data.QueryGetData(&format) }.is_ok()
        };
        check(CF_HDROP.0) || check(CF_UNICODETEXT.0) || check(CF_DIB.0)
    }

    /// Paths in the data object, if it carries files.
    fn paths(data: Option<&IDataObject>) -> Option<Vec<String>> {
        let format = FORMATETC {
            cfFormat: CF_HDROP.0,
            ptd: std::ptr::null_mut(),
            dwAspect: DVASPECT_CONTENT.0,
            lindex: -1,
            tymed: TYMED_HGLOBAL.0 as u32,
        };
        let data = data?;
        let mut medium = unsafe { data.GetData(&format) }.ok()?;
        let hdrop = HDROP(unsafe { medium.u.hGlobal.0 });
        let count = unsafe { DragQueryFileW(hdrop, u32::MAX, None) };
        let paths: Vec<String> = (0..count)
            .map(|i| {
                let len = unsafe { DragQueryFileW(hdrop, i, None) } as usize;
                let mut buf = vec![0u16; len + 1];
                unsafe { DragQueryFileW(hdrop, i, Some(&mut buf)) };
                OsString::from_wide(&buf[..len])
                    .to_string_lossy()
                    .into_owned()
            })
            .collect();
        unsafe { ReleaseStgMedium(&mut medium) };
        Some(paths)
    }

    fn extract_text_or_url(app: &AppHandle, data: Option<&IDataObject>) -> Option<String> {
        let format = FORMATETC {
            cfFormat: CF_UNICODETEXT.0,
            ptd: std::ptr::null_mut(),
            dwAspect: DVASPECT_CONTENT.0,
            lindex: -1,
            tymed: TYMED_HGLOBAL.0 as u32,
        };
        let data = data?;
        let mut medium = unsafe { data.GetData(&format) }.ok()?;
        let global = HGLOBAL(unsafe { medium.u.hGlobal.0 });
        let size = unsafe { GlobalSize(global) };
        if size == 0 {
            unsafe { ReleaseStgMedium(&mut medium) };
            return None;
        }
        let max_len = size / 2;
        let ptr = unsafe { GlobalLock(global) } as *const u16;
        if ptr.is_null() {
            unsafe { ReleaseStgMedium(&mut medium) };
            return None;
        }
        let mut len = 0;
        unsafe {
            while len < max_len && *ptr.add(len) != 0 {
                len += 1;
            }
        }
        let slice = unsafe { std::slice::from_raw_parts(ptr, len) };
        let text = OsString::from_wide(slice).to_string_lossy().into_owned();
        let _ = unsafe { GlobalUnlock(global) };
        unsafe { ReleaseStgMedium(&mut medium) };

        let trimmed = text.trim();
        if trimmed.is_empty() {
            return None;
        }

        let stash_dir = app
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| std::env::temp_dir())
            .join("shelf_stash");
        let _ = std::fs::create_dir_all(&stash_dir);
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();

        if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
            let sanitized: String = trimmed
                .chars()
                .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' { c } else { '_' })
                .take(30)
                .collect();
            let file_name = format!("{}_{}.url", sanitized, timestamp);
            let file_path = stash_dir.join(file_name);
            let content = format!("[InternetShortcut]\r\nURL={}\r\n", trimmed);
            if std::fs::write(&file_path, content).is_ok() {
                return Some(file_path.to_string_lossy().into_owned());
            }
        } else {
            let file_name = format!("note_{}.txt", timestamp);
            let file_path = stash_dir.join(file_name);
            if std::fs::write(&file_path, trimmed).is_ok() {
                return Some(file_path.to_string_lossy().into_owned());
            }
        }
        None
    }

    fn extract_image(app: &AppHandle, data: Option<&IDataObject>) -> Option<String> {
        let format = FORMATETC {
            cfFormat: CF_DIB.0,
            ptd: std::ptr::null_mut(),
            dwAspect: DVASPECT_CONTENT.0,
            lindex: -1,
            tymed: TYMED_HGLOBAL.0 as u32,
        };
        let data = data?;
        let mut medium = unsafe { data.GetData(&format) }.ok()?;
        let global = HGLOBAL(unsafe { medium.u.hGlobal.0 });
        let size = unsafe { GlobalSize(global) };
        if size == 0 {
            unsafe { ReleaseStgMedium(&mut medium) };
            return None;
        }
        let ptr = unsafe { GlobalLock(global) } as *const u8;
        if ptr.is_null() {
            unsafe { ReleaseStgMedium(&mut medium) };
            return None;
        }
        let bytes = unsafe { std::slice::from_raw_parts(ptr, size) };
        let pic = crate::providers::clipboard::image::from_dib(bytes);
        let _ = unsafe { GlobalUnlock(global) };
        unsafe { ReleaseStgMedium(&mut medium) };

        let pic = pic?;
        let png = crate::providers::clipboard::image::encode_png(&pic).ok()?;
        let stash_dir = app
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| std::env::temp_dir())
            .join("shelf_stash");
        let _ = std::fs::create_dir_all(&stash_dir);
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        let file_path = stash_dir.join(format!("dropped_image_{}.png", timestamp));
        std::fs::write(&file_path, png).ok()?;
        Some(file_path.to_string_lossy().into_owned())
    }

    fn extract_all(app: &AppHandle, data: Option<&IDataObject>) -> Option<Vec<String>> {
        if let Some(p) = paths(data).filter(|p| !p.is_empty()) {
            return Some(p);
        }
        if let Some(text_item) = extract_text_or_url(app, data) {
            return Some(vec![text_item]);
        }
        if let Some(img) = extract_image(app, data) {
            return Some(vec![img]);
        }
        None
    }

    impl IDropTarget_Impl for Target_Impl {
        fn DragEnter(
            &self,
            data: Ref<IDataObject>,
            _keys: MODIFIERKEYS_FLAGS,
            _pt: &POINTL,
            effect: *mut DROPEFFECT,
        ) -> windows::core::Result<()> {
            let files = incoming(droppable(data.as_ref()));
            self.files.set(files);
            if files {
                self.emit(DropEvent::Enter);
            }
            // Copy: the source keeps its files (the shelf only keeps a reference).
            unsafe {
                *effect = if files {
                    DROPEFFECT_COPY
                } else {
                    DROPEFFECT_NONE
                }
            };
            Ok(())
        }

        fn DragOver(
            &self,
            _keys: MODIFIERKEYS_FLAGS,
            _pt: &POINTL,
            effect: *mut DROPEFFECT,
        ) -> windows::core::Result<()> {
            unsafe {
                *effect = if self.files.get() {
                    DROPEFFECT_COPY
                } else {
                    DROPEFFECT_NONE
                }
            };
            Ok(())
        }

        fn DragLeave(&self) -> windows::core::Result<()> {
            if self.files.replace(false) {
                self.emit(DropEvent::Leave);
            }
            Ok(())
        }

        fn Drop(
            &self,
            data: Ref<IDataObject>,
            _keys: MODIFIERKEYS_FLAGS,
            _pt: &POINTL,
            effect: *mut DROPEFFECT,
        ) -> windows::core::Result<()> {
            if !self.files.replace(false) {
                unsafe { *effect = DROPEFFECT_NONE };
                return Ok(());
            }
            match extract_all(&self.app, data.as_ref()) {
                Some(paths) if !paths.is_empty() => {
                    self.emit(DropEvent::Drop { paths });
                    unsafe { *effect = DROPEFFECT_COPY };
                }
                _ => {
                    self.emit(DropEvent::Leave);
                    unsafe { *effect = DROPEFFECT_NONE };
                }
            }
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn own_drag_is_not_taken_as_incoming() {
        assert!(incoming(true));
        assert!(!incoming(false));
        outgoing(|| {
            assert!(
                !incoming(true),
                "a drag out of the island must not open its drop zone"
            );
        });
        assert!(incoming(true));
    }
}
