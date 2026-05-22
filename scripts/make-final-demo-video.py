import asyncio
import json
import math
import subprocess
from pathlib import Path

import edge_tts


ROOT = Path(r"D:\kimi-puffer-safesign-app\app")
FFMPEG = Path(r"D:\tools\bin\ffmpeg.exe")
FFPROBE = Path(r"D:\tools\bin\ffprobe.exe")
BASE_VIDEO = ROOT / "video-output" / "backup-smoothscroll-20260522-032945" / "PufferSafeSign_7step_dynamic_visual_smoothscroll.mp4"
OUT_DIR = ROOT / "video-output" / "final-edit"
VOICE_DIR = OUT_DIR / "voice"
SFX_DIR = OUT_DIR / "sfx"
FINAL = OUT_DIR / "BeforeYouSign_PufferSafeSign_Demo.mp4"
VOICE_NAME = "zh-CN-YunxiaNeural"
VOICE_RATE = "+24%"
VOICE_PITCH = "+4Hz"


SEGMENTS = [
    {
        "start": 0.3,
        "end": 8.8,
        "voice": "我是小蓝鲸助手。这个作品叫 Puffer SafeSign，是一个放在 imToken 钱包里的签名前安全检查层。",
        "subs": [
            {"start": 0.3, "end": 2.0, "cn": "我是小蓝鲸助手。", "en": "I'm the Blue Whale assistant."},
            {"start": 2.0, "end": 4.3, "cn": "这个作品叫 Puffer SafeSign。", "en": "This is Puffer SafeSign."},
            {"start": 4.3, "end": 8.8, "cn": "它是放在 imToken 钱包里的签名前安全检查层。", "en": "It is a pre-sign safety check layer inside imToken."},
        ],
    },
    {
        "start": 9.1,
        "end": 14.2,
        "voice": "这里先进入签名前检查，而不是直接执行质押。",
        "subs": [
            {"start": 9.1, "end": 14.2, "cn": "这里先进入签名前检查，而不是直接执行质押。", "en": "Here, the user reviews the action before any staking is executed."},
        ],
    },
    {
        "start": 14.6,
        "end": 24.4,
        "voice": "输入零点零五 ETH 后，页面读取 Puffer 数据，显示预计 pufETH、兑换率、APY、TVL、来源和更新时间。",
        "subs": [
            {"start": 14.6, "end": 19.2, "cn": "输入零点零五 ETH 后，页面读取 Puffer 数据。", "en": "After entering 0.05 ETH, the page fetches Puffer data."},
            {"start": 19.2, "end": 24.4, "cn": "这里显示预计 pufETH、兑换率、APY、TVL、来源和更新时间。", "en": "It shows estimated pufETH, rate, APY, TVL, source, and update time."},
        ],
    },
    {
        "start": 24.8,
        "end": 34.4,
        "voice": "确认单列出关键项：付出多少 ETH、收到多少 pufETH、目标协议、调用方法，以及是否签名、是否上链。",
        "subs": [
            {"start": 24.8, "end": 29.9, "cn": "确认单列出关键项：付出多少 ETH、收到多少 pufETH。", "en": "The confirmation sheet lists the ETH paid and the pufETH expected."},
            {"start": 29.9, "end": 34.4, "cn": "也包括目标协议、调用方法，以及是否签名、是否上链。", "en": "It also shows the protocol, method, signing status, and broadcast status."},
        ],
    },
    {
        "start": 34.8,
        "end": 49.4,
        "voice": "风险扫描分三层。Info 说明操作内容，Warning 提醒 APY 和兑换率会变化，Safe by Design 写清系统不会输入助记词、不会导出私钥、也不会自动广播。",
        "subs": [
            {"start": 34.8, "end": 39.4, "cn": "风险扫描分三层。Info 说明操作内容。", "en": "Risk Scan has three layers. Info explains the action."},
            {"start": 39.4, "end": 44.3, "cn": "Warning 提醒 APY 和兑换率会变化。", "en": "Warning highlights that APY and exchange rates can change."},
            {"start": 44.3, "end": 49.4, "cn": "Safe by Design 写清：不输入助记词、不导出私钥、不自动广播。", "en": "Safe by Design states: no seed phrase, no key export, no auto-broadcast."},
        ],
    },
    {
        "start": 49.8,
        "end": 69.4,
        "voice": "接下来调用 Token Core。tcx-wasm 在浏览器本地创建测试 keystore，派生 Sepolia 测试地址，并生成交易签名和消息签名。地址和签名结果直接显示在页面里。",
        "subs": [
            {"start": 49.8, "end": 54.2, "cn": "接下来调用 Token Core。", "en": "Next, the demo calls Token Core."},
            {"start": 54.2, "end": 61.8, "cn": "tcx-wasm 在浏览器本地创建测试 keystore，并派生 Sepolia 测试地址。", "en": "tcx-wasm creates a local test keystore and derives a Sepolia test address."},
            {"start": 61.8, "end": 69.4, "cn": "交易签名和消息签名会生成，并直接显示在页面里。", "en": "The transaction signature and message signature are generated and shown in the UI."},
        ],
    },
    {
        "start": 69.8,
        "end": 84.4,
        "voice": "最后进入完成页。签名已经生成，但这个 Demo 不会自动发送 RPC，也不会触碰真实资产。",
        "subs": [
            {"start": 69.8, "end": 75.0, "cn": "最后进入完成页。签名已经生成。", "en": "The final page confirms that the signature has been generated."},
            {"start": 75.0, "end": 84.4, "cn": "但这个 Demo 不会自动发送 RPC，也不会触碰真实资产。", "en": "But this demo does not send RPC automatically or touch real assets."},
        ],
    },
    {
        "start": 84.8,
        "end": 98.0,
        "voice": "最后看运行证据：Puffer 数据回填第三步，Token Core 结果回填第六步，广播状态回填第七步。先确认，再本地签名，最后由用户决定。",
        "subs": [
            {"start": 84.8, "end": 88.4, "cn": "最后看运行证据：Puffer 数据回填第三步。", "en": "Runtime evidence shows Puffer data in Step 3."},
            {"start": 88.4, "end": 91.8, "cn": "Token Core 结果回填第六步。", "en": "Token Core results return to Step 6."},
            {"start": 91.8, "end": 95.0, "cn": "广播状态回填第七步。", "en": "Broadcast status returns to Step 7."},
            {"start": 95.0, "end": 98.0, "cn": "先确认，再本地签名，最后由用户决定。", "en": "Review first. Sign locally. The user decides last."},
        ],
    },
]

CLICK_TIMES = [5.7, 14.2, 24.4, 34.4, 49.4, 69.4, 84.4]


def run(args, cwd=ROOT):
    subprocess.run([str(a) for a in args], cwd=cwd, check=True)


def ffprobe_duration(path: Path) -> float:
    result = subprocess.run(
        [str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(json.loads(result.stdout)["format"]["duration"])


def ass_time(seconds: float) -> str:
    centis = int(round(seconds * 100))
    h = centis // 360000
    centis %= 360000
    m = centis // 6000
    centis %= 6000
    s = centis // 100
    cs = centis % 100
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def write_ass(path: Path):
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CN,Microsoft YaHei UI,42,&H00FFFFFF,&H000000FF,&HB0000000,&H88000000,1,0,0,0,100,100,0,0,1,3,1,3,760,72,116,1
Style: EN,Segoe UI Semibold,42,&H00F1F5FF,&H000000FF,&HB0000000,&H88000000,0,0,0,0,100,100,0,0,1,4,1,3,760,72,62,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    for seg in SEGMENTS:
        for sub in seg["subs"]:
            start = ass_time(sub["start"])
            end = ass_time(sub["end"])
            lines.append(f"Dialogue: 0,{start},{end},CN,,0,0,0,,{{\\an9\\pos(1848,858)}}{sub['cn']}\n")
            lines.append(f"Dialogue: 0,{start},{end},EN,,0,0,0,,{{\\an9\\pos(1848,926)}}{sub['en']}\n")
    path.write_text("".join(lines), encoding="utf-8-sig")


async def generate_voice():
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    for index, seg in enumerate(SEGMENTS, start=1):
        out = VOICE_DIR / f"{index:02d}.mp3"
        communicate = edge_tts.Communicate(
            text=seg["voice"],
            voice=VOICE_NAME,
            rate=VOICE_RATE,
            pitch=VOICE_PITCH,
        )
        await communicate.save(str(out))


def make_voice_mix(duration: float) -> Path:
    out = OUT_DIR / "voice_mix.wav"
    inputs = ["-f", "lavfi", "-t", f"{duration:.3f}", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"]
    filters = ["[0:a]volume=0.0[base]"]
    labels = ["[base]"]
    for index, seg in enumerate(SEGMENTS, start=1):
        mp3 = VOICE_DIR / f"{index:02d}.mp3"
        inputs.extend(["-i", str(mp3)])
        delay = int(seg["start"] * 1000)
        label = f"a{index}"
        filters.append(f"[{index}:a]adelay={delay}|{delay},volume=1.0[{label}]")
        labels.append(f"[{label}]")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0[aout]")
    run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[aout]", "-ar", "48000", out])
    return out


def make_bgm(duration: float) -> Path:
    out = SFX_DIR / "bgm.wav"
    run([
        FFMPEG,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "lavfi",
        "-t",
        f"{duration:.3f}",
        "-i",
        "sine=frequency=196:sample_rate=48000",
        "-f",
        "lavfi",
        "-t",
        f"{duration:.3f}",
        "-i",
        "sine=frequency=247:sample_rate=48000",
        "-f",
        "lavfi",
        "-t",
        f"{duration:.3f}",
        "-i",
        "anoisesrc=color=pink:amplitude=0.018:sample_rate=48000",
        "-filter_complex",
        f"[0:a]volume=0.080[a0];[1:a]volume=0.052[a1];[2:a]volume=0.20,lowpass=f=1100,highpass=f=110[a2];[a0][a1][a2]amix=inputs=3:duration=longest:normalize=0,afade=t=in:st=0:d=2,afade=t=out:st={max(0, duration-3):.3f}:d=3[a]",
        "-map",
        "[a]",
        out,
    ])
    return out


def make_click_mix(duration: float) -> Path:
    tap = SFX_DIR / "tap.wav"
    out = SFX_DIR / "clicks.wav"
    run([
        FFMPEG,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "aevalsrc=0.22*sin(2*PI*900*t)*exp(-70*t):d=0.12:s=48000",
        "-af",
        "afade=t=out:st=0.03:d=0.09",
        tap,
    ])
    inputs = ["-f", "lavfi", "-t", f"{duration:.3f}", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"]
    filters = ["[0:a]volume=0.0[base]"]
    labels = ["[base]"]
    for index, when in enumerate(CLICK_TIMES):
        inputs.extend(["-i", str(tap)])
        delay = int(when * 1000)
        label = f"c{index}"
        filters.append(f"[{index + 1}:a]adelay={delay}|{delay},volume=0.38[{label}]")
        labels.append(f"[{label}]")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0[aout]")
    run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[aout]", "-ar", "48000", out])
    return out


def render_final(duration: float, voice_mix: Path, bgm: Path, clicks: Path, ass: Path):
    subtitled = OUT_DIR / "subtitled_video.mp4"
    rel_ass = ass.relative_to(ROOT).as_posix()
    run([
        FFMPEG,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(BASE_VIDEO),
        "-vf",
        f"ass={rel_ass}",
        "-c:v",
        "libx264",
        "-crf",
        "17",
        "-preset",
        "medium",
        "-an",
        subtitled,
    ])
    run([
        FFMPEG,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(subtitled),
        "-i",
        str(voice_mix),
        "-i",
        str(bgm),
        "-i",
        str(clicks),
        "-filter_complex",
        "[1:a]volume=1.0[v];[2:a]volume=0.34[bg];[3:a]volume=0.46[ck];[v][bg][ck]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.95[a]",
        "-map",
        "0:v",
        "-map",
        "[a]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        "-t",
        f"{duration:.3f}",
        FINAL,
    ])


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    SFX_DIR.mkdir(parents=True, exist_ok=True)
    duration = ffprobe_duration(BASE_VIDEO)
    asyncio.run(generate_voice())
    ass = OUT_DIR / "subtitles.ass"
    write_ass(ass)
    voice_mix = make_voice_mix(duration)
    bgm = make_bgm(duration)
    clicks = make_click_mix(duration)
    render_final(duration, voice_mix, bgm, clicks, ass)
    print(json.dumps({"final": str(FINAL), "duration": duration, "subtitles": str(ass)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
