//! The island's shelf: files and folders dropped on it, kept by reference
//! (nothing is copied) until you drag them somewhere else or remove them.
//! Persisted in the app data folder as `shelf.json`.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde::Serialize;
use serde_json::Value;
use tauri::Manager;

use super::Provider;
use super::ask::{data_url, image_media_type};
use crate::hub::Hub;

pub const ID: &str = "shelf";
pub const MAX_ITEMS: usize = 12;
const MAX_THUMB_BYTES: u64 = 4_000_000;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct Item {
    path: String,
    name: String,
    is_dir: bool,
    /// Lowercase extension, for the file icon.
    ext: String,
    /// File size in bytes (0 for directories)
    size: u64,
    /// Categorized kind: "folder", "link", "image", "video", "audio", "document", "archive", "code", "file"
    kind: String,
    /// Small pictures: the picture itself, as a data URL.
    thumb: Option<String>,
    /// Target URL if this is an internet shortcut
    target_url: Option<String>,
}

fn parse_url_file(path: &str) -> Option<String> {
    let content = std::fs::read_to_string(path).ok()?;
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(url) = trimmed.strip_prefix("URL=") {
            return Some(url.trim().to_string());
        }
    }
    None
}

fn url_display_name(target: &str) -> Option<String> {
    let u = url::Url::parse(target).ok()?;
    let host = u.host_str()?;
    let path = u.path().trim_matches('/');
    if !path.is_empty() {
        let display_path = if path.len() > 24 {
            format!("{}…", &path[..21])
        } else {
            path.to_string()
        };
        Some(format!("{host}/{display_path}"))
    } else {
        Some(host.to_string())
    }
}

fn file_kind(is_dir: bool, ext: &str) -> String {
    if is_dir {
        return "folder".to_string();
    }
    match ext {
        "url" => "link".to_string(),
        "png" | "jpg" | "jpeg" | "webp" | "gif" | "bmp" | "svg" | "ico" | "avif" | "tiff" => {
            "image".to_string()
        }
        "mp4" | "mkv" | "mov" | "avi" | "webm" | "wmv" | "flv" | "m4v" => "video".to_string(),
        "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac" | "wma" | "opus" => "audio".to_string(),
        "pdf" | "doc" | "docx" | "txt" | "md" | "rtf" | "odt" | "xls" | "xlsx" | "ppt"
        | "pptx" | "csv" => "document".to_string(),
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "iso" => "archive".to_string(),
        "js" | "ts" | "tsx" | "jsx" | "rs" | "py" | "json" | "html" | "css" | "c" | "cpp"
        | "h" | "hpp" | "go" | "java" | "sh" | "ps1" | "toml" | "yaml" | "yml" => {
            "code".to_string()
        }
        _ => "file".to_string(),
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Default)]
struct State {
    items: Vec<Item>,
}

struct Ctx {
    hub: Arc<Hub>,
    file: PathBuf,
    paths: Mutex<Vec<String>>,
    thumbs: Mutex<HashMap<String, Option<String>>>,
}

impl Ctx {
    /// Drops entries whose file was deleted or moved, saves and publishes.
    fn commit(&self) {
        let paths: Vec<String> = {
            let mut paths = self.paths.lock().unwrap();
            paths.retain(|p| Path::new(p).exists());
            paths.truncate(MAX_ITEMS);
            paths.clone()
        };
        if let Some(dir) = self.file.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        if let Ok(text) = serde_json::to_string(&paths) {
            let _ = std::fs::write(&self.file, text);
        }
        let mut thumbs = self.thumbs.lock().unwrap();
        let items = paths
            .iter()
            .map(|p| {
                let path = Path::new(p);
                let is_dir = path.is_dir();
                let meta = std::fs::metadata(path).ok();
                let size = if is_dir {
                    0
                } else {
                    meta.as_ref().map(|m| m.len()).unwrap_or(0)
                };
                let ext = path
                    .extension()
                    .map(|e| e.to_string_lossy().to_lowercase())
                    .unwrap_or_default();
                let target_url = if ext == "url" { parse_url_file(p) } else { None };
                let thumb = thumbs
                    .entry(p.clone())
                    .or_insert_with(|| {
                        let small =
                            meta.as_ref().is_some_and(|m| m.len() <= MAX_THUMB_BYTES);
                        image_media_type(path)
                            .filter(|_| small)
                            .and_then(|m| data_url(path, m))
                    })
                    .clone();
                let kind = file_kind(is_dir, &ext);
                let name = if let Some(ref target) = target_url {
                    url_display_name(target).unwrap_or_else(|| {
                        path.file_stem()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| p.clone())
                    })
                } else if ext == "txt" && p.contains("shelf_stash") {
                    std::fs::read_to_string(path)
                        .ok()
                        .and_then(|c| {
                            c.lines().next().map(|l| {
                                let l = l.trim();
                                if l.len() > 30 {
                                    format!("{}…", &l[..27])
                                } else {
                                    l.to_string()
                                }
                            })
                        })
                        .filter(|n| !n.is_empty())
                        .unwrap_or_else(|| {
                            path.file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_else(|| p.clone())
                        })
                } else {
                    path.file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_else(|| p.clone())
                };
                Item {
                    path: p.clone(),
                    name,
                    is_dir,
                    ext,
                    size,
                    kind,
                    thumb,
                    target_url,
                }
            })
            .collect();
        thumbs.retain(|k, _| paths.contains(k));
        drop(thumbs);
        self.hub.publish(ID, &State { items });
    }
}

#[derive(Default)]
pub struct ShelfProvider {
    ctx: Mutex<Option<Arc<Ctx>>>,
}

impl Provider for ShelfProvider {
    fn id(&self) -> &'static str {
        ID
    }

    fn start(self: Arc<Self>, hub: Arc<Hub>) {
        let file = hub
            .app()
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| std::env::temp_dir())
            .join("shelf.json");
        let paths = std::fs::read_to_string(&file)
            .ok()
            .and_then(|t| serde_json::from_str::<Vec<String>>(&t).ok())
            .unwrap_or_default();
        let ctx = Arc::new(Ctx {
            hub,
            file,
            paths: Mutex::new(paths),
            thumbs: Mutex::default(),
        });
        *self.ctx.lock().unwrap() = Some(ctx.clone());
        ctx.commit();
        // Notice files deleted or moved meanwhile.
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(Duration::from_secs(10));
                ctx.commit();
            }
        });
    }

    fn action(&self, action: &str, payload: Value) -> Result<Value, String> {
        let ctx = self
            .ctx
            .lock()
            .unwrap()
            .clone()
            .ok_or("shelf not started")?;
        match action {
            // Newest first; dropping something already there moves it to the front.
            "add" => {
                let new: Vec<String> =
                    serde_json::from_value(payload).map_err(|e| e.to_string())?;
                let mut paths = ctx.paths.lock().unwrap();
                for p in new.into_iter().rev() {
                    paths.retain(|q| !q.eq_ignore_ascii_case(&p));
                    paths.insert(0, p);
                }
            }
            "remove" => {
                let path = payload.as_str().unwrap_or_default();
                ctx.paths.lock().unwrap().retain(|p| p != path);
            }
            "clear" => ctx.paths.lock().unwrap().clear(),
            "open" => {
                if let Some(path) = known(&ctx, &payload) {
                    let target = Path::new(&path)
                        .extension()
                        .filter(|e| e.eq_ignore_ascii_case("url"))
                        .and_then(|_| parse_url_file(&path));
                    if let Some(target) = target {
                        crate::settings::open_url(&target);
                        return Ok(Value::Null);
                    }
                    crate::settings::open_url(&path);
                }
                return Ok(Value::Null);
            }
            "reveal" => {
                let path = known(&ctx, &payload).ok_or("not on the shelf")?;
                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    let _ = std::process::Command::new("explorer")
                        .raw_arg(format!("/select,\"{}\"", path))
                        .spawn();
                }
                return Ok(Value::Null);
            }
            "copy_file" => {
                let path = known(&ctx, &payload).ok_or("not on the shelf")?;
                crate::providers::clipboard::write_files(ctx.hub.app(), &[PathBuf::from(path)])?;
                return Ok(Value::Null);
            }
            "copy_path" => {
                let path = known(&ctx, &payload).ok_or("not on the shelf")?;
                let to_copy = if Path::new(&path)
                    .extension()
                    .is_some_and(|e| e.eq_ignore_ascii_case("url"))
                {
                    parse_url_file(&path).unwrap_or(path)
                } else {
                    path
                };
                crate::providers::clipboard::write_text(ctx.hub.app(), &to_copy)?;
                return Ok(Value::Null);
            }
            // Drag an item out to any app (Explorer, WhatsApp, an e-mail…).
            "drag" => {
                let path = known(&ctx, &payload).ok_or("not on the shelf")?;
                start_drag(ctx.hub.app(), vec![PathBuf::from(path)]);
                return Ok(Value::Null);
            }
            _ => return Err(format!("{ID}: unknown action '{action}'")),
        }
        ctx.commit();
        Ok(Value::Null)
    }
}

/// Only paths that are actually on the shelf can be opened or dragged.
fn known(ctx: &Ctx, payload: &Value) -> Option<String> {
    let path = payload.as_str()?;
    ctx.paths
        .lock()
        .unwrap()
        .iter()
        .find(|p| *p == path)
        .cloned()
}

/// OLE drag & drop has to run on the UI thread, while the mouse button is down.
/// Also used by the clipboard history.
pub(crate) fn start_drag(app: &tauri::AppHandle, paths: Vec<PathBuf>) {
    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        let Some(win) = handle.get_webview_window(crate::window::ISLAND_LABEL) else {
            return;
        };
        let image = match paths.as_slice() {
            [one] if image_media_type(one).is_some() => drag::Image::File(one.clone()),
            _ => drag::Image::Raw(vec![]),
        };
        let result = crate::file_drop::outgoing(|| {
            drag::start_drag(
                &win,
                drag::DragItem::Files(paths),
                image,
                |_, _| {},
                drag::Options::default(),
            )
        });
        if let Err(e) = result {
            log::warn!("drag failed: {e}");
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_kind() {
        assert_eq!(file_kind(true, ""), "folder");
        assert_eq!(file_kind(false, "url"), "link");
        assert_eq!(file_kind(false, "png"), "image");
        assert_eq!(file_kind(false, "mp4"), "video");
        assert_eq!(file_kind(false, "mp3"), "audio");
        assert_eq!(file_kind(false, "pdf"), "document");
        assert_eq!(file_kind(false, "zip"), "archive");
        assert_eq!(file_kind(false, "ts"), "code");
        assert_eq!(file_kind(false, "unknown"), "file");
    }

    #[test]
    fn test_url_display_name() {
        assert_eq!(
            url_display_name("https://github.com/rust-lang/rust"),
            Some("github.com/rust-lang/rust".to_string())
        );
        assert_eq!(
            url_display_name("https://example.com/"),
            Some("example.com".to_string())
        );
        assert_eq!(
            url_display_name("https://example.com"),
            Some("example.com".to_string())
        );
        assert_eq!(
            url_display_name("https://example.com/a/very/long/path/that/exceeds/twenty/four/chars"),
            Some("example.com/a/very/long/path/that…".to_string())
        );
        assert_eq!(url_display_name("not a url"), None);
    }

    #[test]
    fn test_parse_url_file() {
        let temp = std::env::temp_dir().join(format!(
            "test_{}.url",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::write(&temp, "[InternetShortcut]\r\nURL=https://github.com\r\n").unwrap();
        let parsed = parse_url_file(temp.to_str().unwrap());
        let _ = std::fs::remove_file(&temp);
        assert_eq!(parsed, Some("https://github.com".to_string()));
    }
}
