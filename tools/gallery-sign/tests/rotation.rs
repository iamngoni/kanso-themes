use std::fs;
use std::path::PathBuf;
use std::process::{Command, ExitStatus};

fn dir() -> PathBuf {
    let path = std::env::temp_dir().join(format!(
        "gallery-sign-test-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .subsec_nanos()
    ));
    fs::create_dir_all(&path).unwrap();
    path
}

fn run(args: &[&str]) -> (ExitStatus, String, String) {
    let out = Command::new(env!("CARGO_BIN_EXE_gallery-sign"))
        .args(args)
        .output()
        .unwrap();
    (
        out.status,
        String::from_utf8_lossy(&out.stdout).into_owned(),
        String::from_utf8_lossy(&out.stderr).into_owned(),
    )
}

fn key() -> (String, String) {
    let (status, out, err) = run(&["keygen"]);
    assert!(status.success(), "{err}");
    let secret = out
        .lines()
        .find_map(|line| line.strip_prefix("secret: "))
        .unwrap()
        .to_owned();
    let public = out
        .lines()
        .find_map(|line| line.strip_prefix("public: "))
        .unwrap()
        .to_owned();
    (secret, public)
}

#[test]
fn signs_verifies_rejects_a_bit_and_rotates() {
    let dir = dir();
    let index = dir.join("index.json");
    let sig = dir.join("index.sig");
    let keys = dir.join("trusted-keys.txt");
    fs::write(&index, b"{\"schema\":1,\"serial\":1}\n").unwrap();
    let (secret1, public1) = key();
    let (secret2, public2) = key();

    fs::write(&keys, format!("{public1}\n")).unwrap();
    let i = index.to_str().unwrap();
    let s = sig.to_str().unwrap();
    let k = keys.to_str().unwrap();

    // A missing key doesn't sign.
    let (status, _, _) = run(&["sign", "--index", i, "--out", s, "--keys", k]);
    assert!(!status.success());

    // A trusted key signs and verifies.
    let (status, _, err) = run(&["sign", "--key", &secret1, "--index", i, "--out", s, "--keys", k]);
    assert!(status.success(), "{err}");
    let (status, _, err) = run(&["verify", "--index", i, "--signature", s, "--keys", k]);
    assert!(status.success(), "{err}");

    // One bit is refused.
    let mut bytes = fs::read(&index).unwrap();
    bytes[2] ^= 1;
    fs::write(&index, &bytes).unwrap();
    let (status, _, _) = run(&["verify", "--index", i, "--signature", s, "--keys", k]);
    assert!(!status.success());

    // A foreign key is refused even when asked to sign.
    fs::write(&index, b"{\"schema\":1,\"serial\":2}\n").unwrap();
    let (status, _, _) = run(&["sign", "--key", &secret2, "--index", i, "--out", s, "--keys", k]);
    assert!(!status.success());

    // Two trusted keys: either can sign (rotation).
    fs::write(&keys, format!("{public1}\n{public2}\n")).unwrap();
    let (status, _, err) = run(&["sign", "--key", &secret2, "--index", i, "--out", s, "--keys", k]);
    assert!(status.success(), "{err}");
    let (status, _, err) = run(&["verify", "--index", i, "--signature", s, "--keys", k]);
    assert!(status.success(), "{err}");

    fs::remove_dir_all(dir).ok();
}
