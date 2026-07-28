"""
_sizecheck.py -- BloomStudio export scanner

Scans the Downloads folder for BloomStudio HTML exports, pulls the ENGINE
version constant out of each one, and reports version / true byte size /
modified time sorted newest-first.

Flags two failure modes:
  1. Duplicate versions  -- Design exported twice without bumping the constant
  2. Size shrinks        -- a newer export is SMALLER than an older one,
                            which usually means a truncated or broken export

Read-only. Writes nothing, moves nothing, deletes nothing.

Run:
  C:/Users/quart/AppData/Local/Programs/Python/Python313/python.exe ~/spiralside/_sizecheck.py
"""

import os          # filesystem paths, file sizes, modified times
import re          # regex scanning for the ENGINE constant
import datetime    # human-readable timestamps

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

# Where Design drops exports. Uses expanduser so it works regardless of
# whether this is launched from Git Bash or cmd.
DOWNLOADS = os.path.expanduser("~/Downloads")

# Only consider files whose name contains this (case-insensitive).
# Set to "" to scan every .html in Downloads.
NAME_FILTER = "bloom"

# How many bytes from the top of each file to search for the ENGINE
# constant. It lives near the top; reading the whole 2 MB file just to
# find it would be wasteful across dozens of exports.
HEAD_BYTES = 300000

# ---------------------------------------------------------------------------
# ENGINE CONSTANT PATTERNS
# ---------------------------------------------------------------------------

# Design has used a few shapes for this over time, so try several.
# Each pattern must have exactly ONE capture group -- the version value.
ENGINE_PATTERNS = [
    r'ENGINE\s*[:=]\s*["\']([^"\']+)["\']',   # ENGINE = "106"  /  ENGINE: '2.9.1'
    r'ENGINE\s*[:=]\s*([0-9][0-9.]*)',        # ENGINE = 106    (unquoted number)
    r'ENGINE_VERSION\s*[:=]\s*["\']([^"\']+)["\']',  # ENGINE_VERSION = "106"
    r'const\s+ENGINE\s*=\s*["\']([^"\']+)["\']',     # const ENGINE = "106"
]


def find_engine(path):
    """
    Read the head of an HTML export and return its ENGINE version string.
    Returns None if no recognized pattern is found.

    Note on decoding: BloomStudio exports contain multi-byte UTF-8 glyphs,
    so we decode with errors='ignore' purely for pattern matching. We never
    use len() of the decoded text as a size -- see byte_size() below.
    """
    try:
        with open(path, "rb") as f:          # binary read, no newline translation
            head = f.read(HEAD_BYTES)
    except OSError:
        return None

    text = head.decode("utf-8", errors="ignore")

    for pattern in ENGINE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()

    return None


def byte_size(path):
    """
    True on-disk byte count.

    Deliberately os.path.getsize and NOT len(open(path).read()). Python's
    len() on decoded text counts characters, and multi-byte UTF-8 glyphs
    in these exports make that number smaller than the real file size.
    Comparing a character count against a byte count produces phantom
    'shrink' warnings.
    """
    return os.path.getsize(path)


def version_sort_key(version):
    """
    Turn a version string into a tuple of ints for sane comparison.
    '2.9.1' -> (2, 9, 1);  '106' -> (106,).  Non-numeric parts become -1
    so they sort low rather than crashing.
    """
    parts = []
    for chunk in str(version).split("."):
        digits = re.sub(r"[^0-9]", "", chunk)
        parts.append(int(digits) if digits else -1)
    return tuple(parts)


def main():
    if not os.path.isdir(DOWNLOADS):
        print("Downloads folder not found: %s" % DOWNLOADS)
        return

    rows = []  # each entry: (mtime, version, size, filename)

    # ----- Collect ------------------------------------------------------
    for name in os.listdir(DOWNLOADS):
        if not name.lower().endswith(".html"):
            continue
        if NAME_FILTER and NAME_FILTER.lower() not in name.lower():
            continue

        full = os.path.join(DOWNLOADS, name)
        if not os.path.isfile(full):
            continue

        version = find_engine(full)
        rows.append((os.path.getmtime(full), version, byte_size(full), name))

    if not rows:
        print("No BloomStudio exports found in %s" % DOWNLOADS)
        print("(Adjust NAME_FILTER at the top of this script if the naming changed.)")
        return

    # Newest first.
    rows.sort(key=lambda r: r[0], reverse=True)

    # ----- Report -------------------------------------------------------
    print("")
    print("BloomStudio exports in %s" % DOWNLOADS)
    print("%-10s  %12s  %-19s  %s" % ("VERSION", "BYTES", "MODIFIED", "FILE"))
    print("-" * 100)

    for mtime, version, size, name in rows:
        stamp = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
        shown = version if version else "(none)"
        print("%-10s  %12s  %-19s  %s" % (shown, "{:,}".format(size), stamp, name))

    # ----- Warning: duplicate versions ----------------------------------
    seen = {}
    for _, version, _, name in rows:
        if version:
            seen.setdefault(version, []).append(name)

    dupes = {v: n for v, n in seen.items() if len(n) > 1}
    if dupes:
        print("")
        print("WARNING -- duplicate ENGINE versions:")
        for version, names in dupes.items():
            print("  %s appears in %d files:" % (version, len(names)))
            for n in names:
                print("      %s" % n)
        print("  Design likely exported twice without bumping the constant.")
        print("  Use byte size and mtime to tell them apart.")

    # ----- Warning: size shrinks ----------------------------------------
    # Walk versions in ascending order. If a higher version is smaller than
    # the largest size seen so far, that's a possible truncated export.
    versioned = [(v, s, n) for _, v, s, n in rows if v]
    versioned.sort(key=lambda r: version_sort_key(r[0]))

    shrinks = []
    high_water = 0        # largest byte size seen so far
    high_name = None      # which file set it
    for version, size, name in versioned:
        if high_water and size < high_water:
            shrinks.append((version, name, size, high_name, high_water))
        if size > high_water:
            high_water = size
            high_name = name

    if shrinks:
        print("")
        print("WARNING -- newer export is smaller than an older one:")
        for version, name, size, prev_name, prev_size in shrinks:
            delta = prev_size - size
            print("  v%s (%s)" % (version, name))
            print("      %s bytes -- %s smaller than %s (%s bytes)"
                  % ("{:,}".format(size), "{:,}".format(delta),
                     prev_name, "{:,}".format(prev_size)))
        print("  A shrink can be legitimate (Design refactored) or can mean a")
        print("  truncated/broken export. Verify before deploying.")

    print("")


if __name__ == "__main__":
    main()
