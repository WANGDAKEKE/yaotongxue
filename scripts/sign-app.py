#!/usr/bin/env python3
"""Sign only the project-owned derivative, helpers first; never launch it."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import plistlib
import struct
import subprocess

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "build/package-manifest.json"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--dry-run", action="store_true", help="Validate metadata and print the signing plan without signing")
args = parser.parse_args()
manifest = json.loads(MANIFEST.read_text())
app = Path(manifest["outputApp"]).resolve()
if app.parent != (ROOT / "app").resolve() or app.suffix != ".app":
    raise SystemExit("Refusing to sign an application outside this project's app directory")
plan = manifest["frameworkIntegrity"]["signingPlan"]
helpers = [Path(value) for value in plan["helpers"]]
framework = Path(plan["framework"])
outer = Path(plan["outerApp"])
runtime_executable = Path(plan["runtimeExecutable"]) if plan.get("runtimeExecutable") else None
if outer.resolve() != app or len(helpers) != 8:
    raise SystemExit("Signing plan does not match the current project application")
for target in helpers + [framework, outer]:
    resolved = target.resolve()
    if resolved != app and app not in resolved.parents:
        raise SystemExit("Signing plan contains a path outside the application: " + str(target))
    if not target.is_dir():
        raise SystemExit("Missing signing target: " + str(target))
if runtime_executable is not None:
    if runtime_executable.resolve() != (app / "Contents/MacOS/ChatGPT").resolve() or not runtime_executable.is_file():
        raise SystemExit("Unexpected native runtime executable in signing plan")
entitlements = ROOT / "scripts/local.entitlements.plist"
allowed_entitlements = {
    "com.apple.security.cs.allow-jit",
    "com.apple.security.cs.allow-unsigned-executable-memory",
    "com.apple.security.cs.disable-library-validation",
}
entitlement_values = plistlib.loads(entitlements.read_bytes())
if set(entitlement_values) != allowed_entitlements or not all(value is True for value in entitlement_values.values()):
    raise SystemExit("Local entitlements differ from the three required local Electron runtime permissions")


def digest(bytes_value):
    return hashlib.sha256(bytes_value).hexdigest()


def verify_metadata():
    info = plistlib.loads((app / "Contents/Info.plist").read_bytes())
    integrity = info["ElectronAsarIntegrity"]
    asar = app / "Contents/Resources/app.asar"
    with asar.open("rb") as handle:
        pickle_header = handle.read(16)
        header_length = struct.unpack_from("<I", pickle_header, 12)[0]
        header = handle.read(header_length)
    if len(header) != header_length or digest(header) != integrity["Resources/app.asar"]["hash"]:
        raise SystemExit("ASAR header does not match Info.plist")
    dictionary_bytes = b"".join(
        key.encode() + integrity[key]["algorithm"].encode() + integrity[key]["hash"].encode()
        for key in sorted(integrity)
    )
    dictionary_digest = hashlib.sha256(dictionary_bytes).digest()
    binary = Path(manifest["frameworkIntegrity"]["frameworkBinary"])
    if app not in binary.resolve().parents:
        raise SystemExit("Framework metadata points outside this application")
    with binary.open("rb") as handle:
        for slot in manifest["frameworkIntegrity"]["slots"]:
            handle.seek(slot["digestOffset"] - 2)
            if handle.read(34) != b"\x01\x01" + dictionary_digest:
                raise SystemExit("Framework integrity dictionary digest does not match Info.plist")
    official = Path(manifest["originalApp"]) / "Contents/Resources/app.asar.unpacked"
    for relative in manifest["nativeSidecars"]:
        relative_path = Path(relative)
        if relative_path.is_absolute() or ".." in relative_path.parts:
            raise SystemExit("Invalid native sidecar path in manifest")
        if digest((Path(str(asar) + ".unpacked") / relative).read_bytes()) != digest((official / relative).read_bytes()):
            raise SystemExit("A native ASAR sidecar was modified: " + relative)
    return dictionary_digest.hex()


dictionary_digest = verify_metadata()
sign_commands = [
    ["/usr/bin/codesign", "--force", "--sign", "-", "--timestamp=none", "--options", "runtime",
     "--entitlements", str(entitlements), str(target)]
    for target in helpers
]
# Framework is a library rather than a process; process entitlements belong on
# the helpers and outer executable. Do not deep-sign unrelated native resources.
sign_commands.append(["/usr/bin/codesign", "--force", "--sign", "-", "--timestamp=none", "--options", "runtime", str(framework)])
if runtime_executable is not None:
    sign_commands.append([
        "/usr/bin/codesign", "--force", "--sign", "-", "--timestamp=none", "--options", "runtime",
        "--entitlements", str(entitlements), str(runtime_executable),
    ])
sign_commands.append([
    "/usr/bin/codesign", "--force", "--sign", "-", "--timestamp=none", "--options", "runtime",
    "--entitlements", str(entitlements), str(outer),
])
verify_command = ["/usr/bin/codesign", "--verify", "--deep", "--strict", str(app)]
if args.dry_run:
    print(json.dumps({
        "dryRun": True, "metadataVerified": True, "dictionarySha256": dictionary_digest,
        "commands": sign_commands + [verify_command], "launch": False,
    }, ensure_ascii=False, indent=2))
else:
    for index, command in enumerate(sign_commands, 1):
        print("Signing {}/{}: {}".format(index, len(sign_commands), command[-1]), flush=True)
        subprocess.run(command, check=True)
    subprocess.run(verify_command, check=True)
    verify_metadata()
    verification = {
        "verifiedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "app": str(app), "identity": "local ad-hoc", "helperCount": len(helpers),
        "deepStrictSignatureVerification": "passed",
        "asarHeaderAndFrameworkDigest": "passed", "nativeSidecarsUnchanged": True,
        "fusesChanged": False, "launched": False,
    }
    (ROOT / "build/signing-verification.json").write_text(json.dumps(verification, ensure_ascii=False, indent=2) + "\n")
    manifest["signed"] = True
    manifest["signatureVerification"] = verification
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print("Local signatures and ASAR metadata verified. No application was launched.")
