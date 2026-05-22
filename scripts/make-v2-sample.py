import asyncio
import json
import math
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(r"D:\kimi-puffer-safesign-app\app")
OUT = ROOT / "video-output" / "v2-sample"
SCREENS = ROOT / "video-output" / "screens"
FFMPEG = Path(r"D:\tools\bin\ffmpeg.exe")
FFPROBE = Path(r"D:\tools\bin\ffprobe.exe")

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+13%"
PITCH = "+4Hz"

SCRIPT = [
    {
        "id": "quote",
        "image": "03-puffer-quote.png",
        "cn": "先看 Puffer Quote。输入零点零五 ETH 后，页面会拉取 Puffer 数据，算出预计 pufETH，并标出 rate、APY、TVL、来源和更新时间。",
        "en": "Fetch the Puffer quote, APY, TVL, source, and update time.",
        "subtitle_cn": "读取 Puffer 报价、APY、TVL",
        "subtitle_en": "Fetch Puffer quote, APY, and TVL",
        "min_duration": 8.0,
    },
    {
        "id": "core",
        "image": "06-token-core-result.png",
        "cn": "接下来是 Token Core。本地创建测试 keystore，派生 Sepolia 地址，然后生成交易签名和消息签名。地址和签名都会直接回到页面。",
        "en": "Token Core creates a test keystore, derives an address, and signs locally.",
        "subtitle_cn": "Token Core 在浏览器本地签名",
        "subtitle_en": "Token Core signs locally in the browser",
        "min_duration": 9.0,
    },
    {
        "id": "runtime",
        "images": [
            "08-runtime-puffer-api.png",
            "08-runtime-token-core.png",
            "08-runtime-broadcast-gate.png",
        ],
        "cn": "最后看运行证据。Puffer 数据回到第三步，Token Core 结果回到第六步，广播状态回到第七步。不是控制台截图，而是页面状态。",
        "en": "Runtime proof is shown in the UI, not hidden in the console.",
        "subtitle_cn": "运行证据随步骤回填",
        "subtitle_en": "Runtime proof is reflected in the UI",
        "min_duration": 11.0,
    },
]


def run(cmd: list[str]) -> None:
    subprocess.run([str(x) for x in cmd], check=True)


def ffprobe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            str(FFPROBE),
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(json.loads(result.stdout)["format"]["duration"])


async def tts(text: str, out_path: Path) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(str(out_path))


async def make_voice_files() -> None:
    for item in SCRIPT:
        await tts(item["cn"], OUT / f"{item['id']}.mp3")


def make_focus_clip(image: Path, out_path: Path, duration: float, zoom: float = 0.0, x_expr: str | None = None, y_expr: str | None = None) -> None:
    frames = max(1, math.ceil(duration * 30))
    x = x_expr or "iw/2-iw/zoom/2"
    y = y_expr or "ih/2-ih/zoom/2"
    vf = (
        "scale=1920:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xF5F8FF,"
        f"zoompan=z='1+{zoom}*on/{frames}':"
        f"x='{x}':y='{y}':d={frames}:s=1920x1080:fps=30,"
        "format=yuv420p"
    )
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            image,
            "-vf",
            vf,
            "-frames:v",
            str(frames),
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-preset",
            "medium",
            out_path,
        ]
    )


def make_runtime_scroll(out_path: Path, duration: float) -> None:
    part_duration = max(3.4, (duration + 0.9) / 3)
    parts = []
    for index, image in enumerate(SCRIPT[2]["images"]):
        part = OUT / f"runtime-part-{index}.mp4"
        make_focus_clip(SCREENS / image, part, part_duration, zoom=0.0)
        parts.append(part)

    transition = 0.45
    offset1 = part_duration - transition
    offset2 = part_duration * 2 - transition * 2
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            parts[0],
            "-i",
            parts[1],
            "-i",
            parts[2],
            "-filter_complex",
            (
                f"[0:v][1:v]xfade=transition=slideup:duration={transition}:offset={offset1:.3f}[v01];"
                f"[v01][2:v]xfade=transition=slideup:duration={transition}:offset={offset2:.3f}[v]"
            ),
            "-map",
            "[v]",
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-pix_fmt",
            "yuv420p",
            out_path,
        ]
    )


def build_ass(timing: list[dict], ass_path: Path) -> None:
    def fmt_time(seconds: float) -> str:
        cs = int(round(seconds * 100))
        h = cs // 360000
        cs %= 360000
        m = cs // 6000
        cs %= 6000
        s = cs // 100
        cs %= 100
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    lines = [
        "[Script Info]",
        "Title: Puffer SafeSign V2 Sample",
        "ScriptType: v4.00+",
        "PlayResX: 1920",
        "PlayResY: 1080",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Demo,Microsoft YaHei UI,30,&H0018273F,&H00FFFFFF,&H00F8FAFC,&H00000000,0,0,0,0,100,100,0,0,1,1.2,0,2,340,340,34,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for item in timing:
        cn = item["subtitle_cn"]
        en = item["subtitle_en"]
        text = f"{{\\b1}}{cn}\\N{{\\b0\\fs22\\c&H8A7764&}}{en}"
        lines.append(
            f"Dialogue: 0,{fmt_time(item['start'])},{fmt_time(item['end'])},Demo,,0,0,0,,{text}"
        )
    ass_path.write_text("\n".join(lines), encoding="utf-8")


def build_srt(timing: list[dict], srt_path: Path) -> None:
    def fmt_time(seconds: float) -> str:
        ms = int(round(seconds * 1000))
        h = ms // 3600000
        ms %= 3600000
        m = ms // 60000
        ms %= 60000
        s = ms // 1000
        ms %= 1000
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    chunks = []
    for idx, item in enumerate(timing, start=1):
        chunks.append(
            f"{idx}\n{fmt_time(item['start'])} --> {fmt_time(item['end'])}\n"
            f"{item['subtitle_cn']}\n{item['subtitle_en']}\n"
        )
    srt_path.write_text("\n".join(chunks), encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    asyncio.run(make_voice_files())

    timing = []
    cursor = 0.0
    clip_paths = []
    for item in SCRIPT:
        voice_path = OUT / f"{item['id']}.mp3"
        voice_duration = ffprobe_duration(voice_path)
        duration = max(item["min_duration"], voice_duration + 1.0)
        item["duration"] = duration
        item["voice_duration"] = voice_duration
        item["start"] = cursor
        item["end"] = cursor + duration
        timing.append(item)
        cursor += duration

        clip = OUT / f"{item['id']}.mp4"
        if item["id"] == "runtime":
            make_runtime_scroll(clip, duration)
        elif item["id"] == "quote":
            make_focus_clip(SCREENS / item["image"], clip, duration, zoom=0.0)
        elif item["id"] == "core":
            make_focus_clip(SCREENS / item["image"], clip, duration, zoom=0.0)
        else:
            make_focus_clip(SCREENS / item["image"], clip, duration, zoom=0.0)
        clip_paths.append(clip)

    concat_list = OUT / "sample-clips.txt"
    concat_list.write_text(
        "\n".join(f"file '{path.as_posix()}'" for path in clip_paths),
        encoding="utf-8",
    )
    visual = OUT / "visual.mp4"
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            concat_list,
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-pix_fmt",
            "yuv420p",
            visual,
        ]
    )

    voice_inputs = []
    voice_filters = []
    labels = []
    for i, item in enumerate(SCRIPT):
        voice_inputs += ["-i", str(OUT / f"{item['id']}.mp3")]
        delay = int((item["start"] + 0.35) * 1000)
        voice_filters.append(f"[{i}:a]adelay={delay}|{delay},volume=1.0[v{i}]")
        labels.append(f"[v{i}]")
    voiceover = OUT / "voiceover.wav"
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            *voice_inputs,
            "-filter_complex",
            ";".join(voice_filters) + ";" + "".join(labels) + f"amix=inputs={len(labels)}:duration=longest:normalize=0[voice]",
            "-map",
            "[voice]",
            "-c:a",
            "pcm_s16le",
            voiceover,
        ]
    )

    bgm = OUT / "bgm.wav"
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=220:duration={cursor:.3f}:sample_rate=48000",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=330:duration={cursor:.3f}:sample_rate=48000",
            "-filter_complex",
            "[0:a]volume=0.018[a0];[1:a]volume=0.012[a1];[a0][a1]amix=inputs=2:duration=first,afade=t=in:st=0:d=2,afade=t=out:st="
            + f"{max(0, cursor-2):.3f}:d=2",
            "-c:a",
            "pcm_s16le",
            bgm,
        ]
    )

    tap = OUT / "tap.wav"
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=980:duration=0.055:sample_rate=48000",
            "-af",
            "volume=0.22,afade=t=out:st=0.02:d=0.035",
            "-c:a",
            "pcm_s16le",
            tap,
        ]
    )

    tap_times = [timing[1]["start"] - 0.2, timing[2]["start"] - 0.2]
    tap_inputs = []
    tap_filters = []
    tap_labels = []
    for i, t in enumerate(tap_times):
        tap_inputs += ["-i", str(tap)]
        delay = int(max(0, t) * 1000)
        tap_filters.append(f"[{i}:a]adelay={delay}|{delay}[t{i}]")
        tap_labels.append(f"[t{i}]")
    clicks = OUT / "clicks.wav"
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            *tap_inputs,
            "-filter_complex",
            ";".join(tap_filters) + ";" + "".join(tap_labels) + f"amix=inputs={len(tap_labels)}:duration=longest:normalize=0[taps]",
            "-map",
            "[taps]",
            "-c:a",
            "pcm_s16le",
            clicks,
        ]
    )

    ass = OUT / "subtitle.ass"
    srt = OUT / "subtitle.srt"
    build_ass(timing, ass)
    build_srt(timing, srt)

    final = OUT / "PufferSafeSign_V2_Sample.mp4"
    ass_path = str(ass).replace("\\", "/").replace(":", "\\:")
    run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            visual,
            "-i",
            voiceover,
            "-i",
            bgm,
            "-i",
            clicks,
            "-filter_complex",
            "[1:a]volume=1.0[a1];[2:a]volume=0.08[a2];[3:a]volume=0.18[a3];[a1][a2][a3]amix=inputs=3:duration=longest:normalize=0[a]",
            "-vf",
            f"ass='{ass_path}'",
            "-map",
            "0:v",
            "-map",
            "[a]",
            "-t",
            f"{cursor:.3f}",
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            final,
        ]
    )

    print(json.dumps({"final": str(final), "duration": cursor, "voice": VOICE, "rate": RATE, "pitch": PITCH}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
