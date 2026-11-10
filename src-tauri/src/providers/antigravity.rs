//! Quota, live sessions and tokens integration with Antigravity.
//! Its CSRF token stays in this process and is never published to the UI.
use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tauri::Manager;

use super::Provider;
use super::claude::activity::Activity;
use super::claude::{Status, TokenStats, preview, vscode_url};
use super::now_ms;
use crate::hub::Hub;
use crate::settings::Settings;

/// Poll interval while the quota can be read.
const CONNECTED_POLL: Duration = Duration::from_secs(60);
/// Poll interval while waiting for the app (cheap: PowerShell only runs once its server is up).
const DISCONNECTED_POLL: Duration = Duration::from_secs(15);
/// Antigravity's exe, `null` for the default install. Set from the settings window
/// (`AntigravitySettings`) through the `setExe` action.
const EXE_KEY: &str = "agents.antigravityExe";
const LANGUAGE_SERVERS: [&str; 2] = ["language_server_windows_x64", "language_server"];

const RECENT_SESSION_MS: u64 = 2 * 3600 * 1000;
const MAX_SESSIONS: usize = 8;

#[derive(Debug, Clone, PartialEq, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub project: String,
    pub cwd: String,
    pub status: Status,
    pub activity: Option<Activity>,
    pub turn_started_at: Option<u64>,
    pub finished_at: Option<u64>,
    pub last_event_at: u64,
    pub model: Option<String>,
    pub context_pct: Option<f64>,
    pub summary: Option<String>,
    pub prompt: Option<String>,
}

#[derive(Clone, Deserialize)]
struct LocalServer {
    port: u16,
    csrf: String,
}

/// The default per-user install.
fn default_executable() -> PathBuf {
    PathBuf::from(std::env::var_os("LOCALAPPDATA").unwrap_or_default())
        .join("Programs")
        .join("Antigravity")
        .join("Antigravity.exe")
}

/// The exe set in the settings, else the default install.
fn executable(hub: &Hub) -> PathBuf {
    hub.app()
        .state::<Settings>()
        .get(EXE_KEY)
        .and_then(|v| {
            v.as_str()
                .filter(|s| !s.trim().is_empty())
                .map(PathBuf::from)
        })
        .unwrap_or_else(default_executable)
}

/// Language servers running from Antigravity's install folder, found by name in
/// the process list: no other process is inspected.
fn language_servers(exe: &Path) -> Vec<u32> {
    let Some(dir) = exe.parent().map(|d| d.to_string_lossy().to_lowercase()) else {
        return vec![];
    };
    LANGUAGE_SERVERS
        .iter()
        .flat_map(|stem| super::process::processes_named(stem))
        .filter(|(_, path)| path.to_string_lossy().to_lowercase().starts_with(&dir))
        .map(|(pid, _)| pid)
        .take(8)
        .collect()
}

/// Ports and CSRF tokens of these language servers (read from their command lines).
#[cfg(windows)]
fn discover(pids: &[u32]) -> Vec<LocalServer> {
    use std::io::Read;
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};
    use std::time::Instant;

    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    const TIMEOUT: Duration = Duration::from_secs(8);
    if pids.is_empty() {
        return vec![];
    }
    let pids = pids
        .iter()
        .map(u32::to_string)
        .collect::<Vec<_>>()
        .join(",");
    let script = format!(
        r#"$ErrorActionPreference='Stop'; $items=@(); foreach($id in @({pids})) {{ $p=Get-CimInstance Win32_Process -Filter "ProcessId=$id"; if($p) {{ $csrf=[regex]::Match([string]$p.CommandLine,'--csrf_token[=\s]+([^\s"]+)').Groups[1].Value; if($csrf) {{ Get-NetTCPConnection -State Listen -OwningProcess $id -ErrorAction SilentlyContinue | Where-Object {{$_.LocalAddress -eq '127.0.0.1'}} | ForEach-Object {{ $items += @{{port=$_.LocalPort;csrf=$csrf}} }} }} }} }}; ConvertTo-Json -InputObject @($items) -Compress"#
    );
    let shell = PathBuf::from(std::env::var_os("SystemRoot").unwrap_or_default())
        .join("System32/WindowsPowerShell/v1.0/powershell.exe");
    let Ok(mut child) = Command::new(shell)
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
    else {
        return vec![];
    };
    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) if status.success() => break,
            Ok(None) if started.elapsed() < TIMEOUT => {
                std::thread::sleep(Duration::from_millis(100))
            }
            Ok(Some(_)) => return vec![],
            _ => {
                let _ = child.kill();
                let _ = child.wait();
                return vec![];
            }
        }
    }
    let mut output = String::new();
    if let Some(stdout) = child.stdout.take() {
        let _ = stdout.take(16 * 1024).read_to_string(&mut output);
    }
    serde_json::from_str::<Vec<LocalServer>>(output.trim_start_matches('\u{feff}').trim())
        .unwrap_or_default()
        .into_iter()
        .filter(|s| s.port > 0 && !s.csrf.is_empty())
        .take(8)
        .collect()
}

#[cfg(not(windows))]
fn discover(_pids: &[u32]) -> Vec<LocalServer> {
    vec![]
}

fn parse_limits(payload: &Value) -> Vec<Value> {
    let Some(groups) = payload
        .pointer("/response/groups")
        .and_then(Value::as_array)
    else {
        return vec![];
    };
    let mut limits = vec![];
    for (i, group) in groups.iter().take(8).enumerate() {
        let label = group["displayName"].as_str().unwrap_or("Antigravity");
        let Some(buckets) = group["buckets"].as_array() else {
            continue;
        };
        for bucket in buckets.iter().take(8) {
            let Some(remaining) = bucket["remainingFraction"]
                .as_f64()
                .filter(|r| (0.0..=1.0).contains(r))
            else {
                continue;
            };
            let window = bucket["window"].as_str().unwrap_or("quota");
            let resets_at = bucket["resetTime"]
                .as_str()
                .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
                .map(|d| d.timestamp_millis());
            limits.push(json!({
                "id": format!("antigravity-{i}-{window}"),
                "label": label,
                "window": window,
                "usedPct": (1.0 - remaining) * 100.0,
                "resetsAt": resets_at,
            }));
        }
    }
    limits
}

/// The server's quota limits; `None` when it can't be read or has none.
fn quota(server: &LocalServer) -> Option<Vec<Value>> {
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .proxy(None)
        .max_redirects(0)
        .timeout_global(Some(Duration::from_secs(3)))
        .build()
        .into();
    let url = format!(
        "http://127.0.0.1:{}/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary",
        server.port
    );
    let mut response = agent
        .post(&url)
        .header("x-codeium-csrf-token", &server.csrf)
        .header("Connect-Protocol-Version", "1")
        .header("Content-Type", "application/json")
        .send(b"{}")
        .ok()?;
    let body = response
        .body_mut()
        .with_config()
        .limit(512 * 1024)
        .read_to_string()
        .ok()?;
    let limits = parse_limits(&serde_json::from_str(&body).ok()?);
    (!limits.is_empty()).then_some(limits)
}

fn brain_dir() -> PathBuf {
    PathBuf::from(std::env::var_os("USERPROFILE").unwrap_or_default())
        .join(".gemini")
        .join("antigravity")
        .join("brain")
}

fn file_name(path: &str) -> String {
    let clean = path.trim_matches('"').trim_matches('\'');
    Path::new(clean)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| clean.to_string())
}

fn clean_prompt(content: &str) -> String {
    if let Some(start) = content.find("<USER_REQUEST>") {
        let rest = &content[start + "<USER_REQUEST>".len()..];
        if let Some(end) = rest.find("</USER_REQUEST>") {
            return rest[..end].trim().to_string();
        }
    }
    content.lines().next().unwrap_or(content).trim().to_string()
}

fn extract_workspace(text: &str) -> Option<(String, String)> {
    if let Some(pos) = text.find("Active Workspaces:") {
        let rest = &text[pos + "Active Workspaces:".len()..];
        for line in rest.lines() {
            let trimmed = line.trim().trim_start_matches('-').trim();
            if !trimmed.is_empty() && (trimmed.contains('\\') || trimmed.contains('/')) {
                let name = Path::new(trimmed)
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| trimmed.to_string());
                return Some((name, trimmed.to_string()));
            }
        }
    }
    if let Some(pos) = text.find("Command Working Directory:") {
        let rest = &text[pos + "Command Working Directory:".len()..];
        if let Some(line) = rest.lines().next() {
            let trimmed = line.trim();
            if !trimmed.is_empty() {
                let name = Path::new(trimmed)
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| trimmed.to_string());
                return Some((name, trimmed.to_string()));
            }
        }
    }
    None
}

fn parse_transcript(
    conv_id: &str,
    path: &Path,
    mtime: u64,
    now: u64,
) -> Option<(Session, Option<TokenStats>)> {
    let mut file = File::open(path).ok()?;
    let len = file.metadata().ok()?.len();
    if len == 0 {
        return None;
    }

    let tail_len = (32 * 1024).min(len);
    file.seek(SeekFrom::Start(len - tail_len)).ok()?;
    let mut tail_buf = vec![0u8; tail_len as usize];
    file.read_exact(&mut tail_buf).ok()?;
    let tail_str = String::from_utf8_lossy(&tail_buf);

    let head_len = (8 * 1024).min(len);
    file.seek(SeekFrom::Start(0)).ok()?;
    let mut head_buf = vec![0u8; head_len as usize];
    file.read_exact(&mut head_buf).ok()?;
    let head_str = String::from_utf8_lossy(&head_buf);

    let (project, cwd) = extract_workspace(&head_str)
        .or_else(|| extract_workspace(&tail_str))
        .unwrap_or_else(|| ("Antigravity".to_string(), String::new()));

    let mut last_prompt = None;
    let mut last_line_val: Option<Value> = None;
    let mut tokens = TokenStats::default();

    for line in tail_str.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if let Ok(v) = serde_json::from_str::<Value>(line) {
            if v["type"] == "USER_INPUT" {
                if let Some(content) = v["content"].as_str() {
                    last_prompt = Some(clean_prompt(content));
                }
                tokens.messages += 1;
            }
            if let Some(inp) = v["input_tokens"].as_u64() {
                tokens.input += inp;
            }
            if let Some(out) = v["output_tokens"].as_u64() {
                tokens.output += out;
            }
            if let Some(cache) = v["cache_read_tokens"].as_u64() {
                tokens.cache_read += cache;
            }
            last_line_val = Some(v);
        }
    }

    let mut status = Status::Idle;
    let mut activity = None;
    let mut summary = None;

    if let Some(last) = last_line_val {
        let source = last["source"].as_str().unwrap_or_default();
        let typ = last["type"].as_str().unwrap_or_default();
        let step_status = last["status"].as_str().unwrap_or_default();

        if source == "USER_EXPLICIT" || (source == "MODEL" && step_status == "RUNNING") {
            status = Status::Working;
            activity = Some(Activity::thinking());
        } else if source == "MODEL" && typ == "PLANNER_RESPONSE" {
            if let Some(tool_calls) = last["tool_calls"].as_array().filter(|a| !a.is_empty()) {
                let call = &tool_calls[0];
                let name = call["name"].as_str().unwrap_or_default();
                let args = &call["args"];
                let act = match name {
                    "run_command" => {
                        let summary = args["toolSummary"]
                            .as_str()
                            .or_else(|| args["CommandLine"].as_str())
                            .unwrap_or("command");
                        Activity::with("run", summary)
                    }
                    "edit_file" => {
                        let p = args["Path"].as_str().unwrap_or("file");
                        Activity::with("edit", file_name(p))
                    }
                    "read_file" => {
                        let p = args["Path"].as_str().unwrap_or("file");
                        Activity::with("read", file_name(p))
                    }
                    "write_file" => {
                        let p = args["Path"].as_str().unwrap_or("file");
                        Activity::with("edit", file_name(p))
                    }
                    "search_web" => {
                        let q = args["query"].as_str().unwrap_or("web");
                        Activity::with("search", q)
                    }
                    _ => Activity::with("tool", name),
                };
                activity = Some(act);
                status = Status::Working;
            } else {
                if now.saturating_sub(mtime) < 20_000 {
                    status = Status::Done;
                } else {
                    status = Status::Idle;
                }
                summary = last["content"].as_str().map(preview);
            }
        }
    }

    let session = Session {
        id: conv_id.to_string(),
        project,
        cwd,
        status,
        activity,
        turn_started_at: Some(mtime),
        finished_at: (status == Status::Done || status == Status::Idle).then_some(mtime),
        last_event_at: mtime,
        model: Some("Gemini".to_string()),
        context_pct: None,
        summary,
        prompt: last_prompt,
    };

    Some((session, Some(tokens)))
}

fn scan_sessions() -> (Vec<Session>, Option<TokenStats>) {
    let dir = brain_dir();
    let Ok(entries) = fs::read_dir(dir) else {
        return (vec![], None);
    };

    let now = now_ms();
    let mut files = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let transcript = path.join(".system_generated").join("logs").join("transcript.jsonl");
        if let Ok(meta) = fs::metadata(&transcript) {
            let mtime = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);
            if now.saturating_sub(mtime) < RECENT_SESSION_MS {
                let conv_id = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                files.push((mtime, conv_id, transcript));
            }
        }
    }

    files.sort_by_key(|a| std::cmp::Reverse(a.0));

    let mut sessions = Vec::new();
    let mut total_tokens = TokenStats::default();
    let mut counted_tokens = false;

    for (mtime, conv_id, path) in files.into_iter().take(MAX_SESSIONS) {
        if let Some((session, tokens)) = parse_transcript(&conv_id, &path, mtime, now) {
            sessions.push(session);
            if let Some(t) = tokens {
                total_tokens.input += t.input;
                total_tokens.output += t.output;
                total_tokens.cache_read += t.cache_read;
                total_tokens.messages += t.messages;
                counted_tokens = true;
            }
        }
    }

    (sessions, counted_tokens.then_some(total_tokens))
}

#[derive(Default)]
pub struct AntigravityProvider {
    hub: OnceLock<Arc<Hub>>,
    /// The last server that answered, tried before discovering again.
    server: Mutex<Option<LocalServer>>,
    cached_limits: Mutex<Option<Vec<Value>>>,
}

impl AntigravityProvider {
    /// Publishes the current state; `true` when the quota could be read.
    fn refresh(&self, hub: &Hub, check_quota: bool) -> bool {
        let exe = executable(hub);
        let connected = if check_quota {
            let cached = self.server.lock().unwrap().clone();
            let mut pids = None;
            let found = cached
                .and_then(|s| quota(&s).map(|limits| (s, limits)))
                .or_else(|| {
                    discover(pids.insert(language_servers(&exe)))
                        .into_iter()
                        .find_map(|s| quota(&s).map(|limits| (s, limits)))
                });
            let ok = found.is_some();
            if let Some((server, limits)) = found {
                *self.server.lock().unwrap() = Some(server);
                *self.cached_limits.lock().unwrap() = Some(limits);
            }
            ok
        } else {
            self.cached_limits.lock().unwrap().is_some()
        };

        let limits = self.cached_limits.lock().unwrap().clone().unwrap_or_default();
        let (sessions, tokens_today) = scan_sessions();
        let running = connected || !sessions.is_empty();

        hub.publish(
            self.id(),
            json!({
                "available": running || exe.is_file(),
                "exe": exe,
                "defaultExe": default_executable(),
                "connected": connected,
                "limits": limits,
                "sessions": sessions,
                "tokensToday": tokens_today,
                "error": (!connected).then_some(if running { "service-unavailable" } else { "not-running" }),
            }),
        );
        connected
    }
}

impl Provider for AntigravityProvider {
    fn id(&self) -> &'static str {
        "antigravity"
    }

    fn start(self: Arc<Self>, hub: Arc<Hub>) {
        let _ = self.hub.set(hub.clone());
        std::thread::spawn(move || {
            let mut last_quota = Instant::now() - CONNECTED_POLL;
            let mut connected = false;
            loop {
                let now = Instant::now();
                let need_quota = now.duration_since(last_quota) >= if connected {
                    CONNECTED_POLL
                } else {
                    DISCONNECTED_POLL
                };
                if need_quota {
                    connected = self.refresh(&hub, true);
                    last_quota = now;
                } else {
                    self.refresh(&hub, false);
                }
                std::thread::sleep(Duration::from_secs(3));
            }
        });
    }

    fn action(&self, action: &str, payload: Value) -> Result<Value, String> {
        let hub = self.hub.get().ok_or("antigravity: not started")?;
        match action {
            "pickExe" => {
                Ok(crate::dialog::pick_file("Antigravity", "*.exe")
                    .map_or(Value::Null, Value::String))
            }
            "setExe" => {
                let exe = payload.as_str().map(str::trim).filter(|s| !s.is_empty());
                crate::settings::set(
                    hub.app(),
                    EXE_KEY,
                    exe.map_or(Value::Null, |s| Value::String(s.into())),
                );
                *self.server.lock().unwrap() = None;
                *self.cached_limits.lock().unwrap() = None;
                self.refresh(hub, true);
                Ok(Value::Null)
            }
            "launch" => {
                let exe = executable(hub);
                if !exe.is_file() {
                    return Err(format!("Antigravity not found at {}", exe.display()));
                }
                std::process::Command::new(exe)
                    .spawn()
                    .map_err(|e| format!("couldn't start Antigravity: {e}"))?;
                Ok(Value::Null)
            }
            "openProject" => {
                let cwd = payload.as_str().unwrap_or_default();
                if !cwd.is_empty() {
                    crate::settings::open_url(&vscode_url(cwd));
                }
                Ok(Value::Null)
            }
            _ => Err(format!("antigravity: unsupported action '{action}'")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_remaining_fractions_and_reset_dates() {
        let data = json!({"response":{"groups":[{"displayName":"Gemini Models","buckets":[{"window":"5h","remainingFraction":0.75,"resetTime":"2026-11-03T08:22:05Z"},{"window":"weekly","remainingFraction":0.4}]}]}});
        let limits = parse_limits(&data);
        assert_eq!(limits.len(), 2);
        assert_eq!(limits[0]["usedPct"], 25.0);
        assert_eq!(limits[0]["label"], "Gemini Models");
        assert!(limits[0]["resetsAt"].as_i64().unwrap() > 0);
        assert_eq!(limits[1]["resetsAt"], Value::Null);
    }

    #[test]
    fn skips_out_of_range_and_missing_fractions() {
        let data = json!({"response":{"groups":[{"buckets":[{"remainingFraction":2.0},{"window":"5h"}]}]}});
        assert!(parse_limits(&data).is_empty());
        assert!(parse_limits(&json!({})).is_empty());
    }
}
