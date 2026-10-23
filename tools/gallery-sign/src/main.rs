//! Signs `gallery/index.json` for the Kanso theme gallery, verifies it, and
//! makes a key pair. It mirrors Kanso's `kanso-release sign`: a key may sign
//! only when its public half is in `gallery/trusted-keys.txt`, and a verifier
//! accepts only a key from that list.
//!
//! ```text
//! gallery-sign keygen
//! gallery-sign sign --key "$KANSO_THEMES_SIGNING_KEY" --index gallery/index.json
//! gallery-sign verify --index gallery/index.json --signature gallery/index.json.sig
//! ```

use std::path::{Path, PathBuf};
use std::process::ExitCode;

use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as B64;
use ed25519_dalek::{Signature, Signer as _, SigningKey, VerifyingKey};

fn main() -> ExitCode {
    match run(std::env::args().skip(1).collect()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => {
            eprintln!("gallery-sign: {err}");
            ExitCode::FAILURE
        }
    }
}

fn usage() -> String {
    "usage: gallery-sign keygen | sign --key <base64> [--index PATH] [--out PATH] [--keys PATH] | verify [--index PATH] [--signature PATH] [--keys PATH]".into()
}

fn run(args: Vec<String>) -> Result<(), String> {
    let Some(command) = args.first() else {
        return Err(usage());
    };
    let options = options(&args[1..]);
    match command.as_str() {
        "keygen" => keygen(),
        "sign" => sign(&options),
        "verify" => verify(&options),
        other => Err(format!("{other}: {}", usage())),
    }
}

fn options(args: &[String]) -> std::collections::BTreeMap<String, PathBufOrText> {
    let mut out = std::collections::BTreeMap::new();
    let mut at = 0;
    while at < args.len() {
        let key = args[at].trim_start_matches('-').to_owned();
        if let Some(value) = args.get(at + 1) {
            out.insert(key, PathBufOrText(value.clone()));
            at += 2;
        } else {
            at += 1;
        }
    }
    out
}

struct PathBufOrText(String);

impl PathBufOrText {
    fn text(&self) -> &str {
        &self.0
    }
}

fn keys_path(options: &std::collections::BTreeMap<String, PathBufOrText>) -> PathBuf {
    options
        .get("keys")
        .map(PathBufOrText::text)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("gallery/trusted-keys.txt"))
}

fn index_path(options: &std::collections::BTreeMap<String, PathBufOrText>) -> PathBuf {
    options
        .get("index")
        .map(PathBufOrText::text)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("gallery/index.json"))
}

fn signature_path(options: &std::collections::BTreeMap<String, PathBufOrText>) -> PathBuf {
    options
        .get("signature")
        .or_else(|| options.get("out"))
        .map(PathBufOrText::text)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("gallery/index.json.sig"))
}

fn trusted_keys(path: &Path) -> Result<Vec<VerifyingKey>, String> {
    let text = std::fs::read_to_string(path)
        .map_err(|err| format!("couldn't read {}: {err}", path.display()))?;
    let mut keys = Vec::new();
    for line in text.lines().map(str::trim) {
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let bytes = B64
            .decode(line)
            .map_err(|_| format!("{} isn't a base64 key", path.display()))?;
        let bytes: [u8; 32] = bytes
            .try_into()
            .map_err(|_| format!("{} isn't a 32-byte key", path.display()))?;
        keys.push(
            VerifyingKey::from_bytes(&bytes)
                .map_err(|_| format!("{} isn't an Ed25519 key", path.display()))?,
        );
    }
    Ok(keys)
}

fn keygen() -> Result<(), String> {
    let mut seed = [0u8; 32];
    {
        use std::io::Read as _;
        // macOS and the Linux runner both have /dev/urandom; this tool
        // never runs on Windows.
        std::fs::File::open("/dev/urandom")
            .and_then(|mut file| file.read_exact(&mut seed))
            .map_err(|err| format!("no randomness: {err}"))?;
    }
    let key = SigningKey::from_bytes(&seed);
    println!("# Keep the secret in the `gallery` environment only.");
    println!("# Add the public key to gallery/trusted-keys.txt and to Kanso's");
    println!("# crates/kanso-gallery/keys/themes-trusted-keys.txt.");
    println!("secret: {}", B64.encode(seed));
    println!("public: {}", B64.encode(key.verifying_key().to_bytes()));
    Ok(())
}

fn sign(options: &std::collections::BTreeMap<String, PathBufOrText>) -> Result<(), String> {
    let key_text = match options.get("key") {
        Some(key) => key.text().to_owned(),
        None => std::env::var("KANSO_THEMES_SIGNING_KEY")
            .map_err(|_| "no key: pass --key or KANSO_THEMES_SIGNING_KEY")?,
    };
    let seed = B64
        .decode(key_text.trim())
        .map_err(|_| "the signing key isn't base64")?;
    let seed: [u8; 32] = seed
        .as_slice()
        .try_into()
        .map_err(|_| "the signing key isn't a 32-byte seed")?;
    let key = SigningKey::from_bytes(&seed);
    let index = index_path(options);
    let keys = trusted_keys(&keys_path(options))?;
    if keys.is_empty() {
        return Err("gallery/trusted-keys.txt has no key to check the signer against".into());
    }
    if !keys.contains(&key.verifying_key()) {
        return Err("this key's public half isn't in gallery/trusted-keys.txt".into());
    }
    let bytes = std::fs::read(&index)
        .map_err(|err| format!("couldn't read {}: {err}", index.display()))?;
    let signature = format!("{}\n", B64.encode(key.sign(&bytes).to_bytes()));
    let out = signature_path(options);
    std::fs::write(&out, signature)
        .map_err(|err| format!("couldn't write {}: {err}", out.display()))?;
    println!("signed {} -> {}", index.display(), out.display());
    Ok(())
}

fn verify(options: &std::collections::BTreeMap<String, PathBufOrText>) -> Result<(), String> {
    let index = index_path(options);
    let signature = signature_path(options);
    let keys = trusted_keys(&keys_path(options))?;
    if keys.is_empty() {
        return Err("gallery/trusted-keys.txt has no key".into());
    }
    let bytes = std::fs::read(&index)
        .map_err(|err| format!("couldn't read {}: {err}", index.display()))?;
    let text = std::fs::read_to_string(&signature)
        .map_err(|err| format!("couldn't read {}: {err}", signature.display()))?;
    let raw = B64
        .decode(text.trim())
        .map_err(|_| "the signature isn't base64")?;
    let raw: [u8; 64] = raw
        .as_slice()
        .try_into()
        .map_err(|_| "the signature isn't 64 bytes")?;
    let signature = Signature::from_bytes(&raw);
    if keys
        .iter()
        .any(|key| key.verify_strict(&bytes, &signature).is_ok())
    {
        println!("verified {}", index.display());
        Ok(())
    } else {
        Err("the signature doesn't match any trusted key".into())
    }
}
