$ErrorActionPreference = "Stop"

$root = "D:\kimi-puffer-safesign-app\app"
$out = Join-Path $root "video-output"
$screens = Join-Path $out "screens"
$voiceDir = Join-Path $out "voice"
$ffmpeg = "D:\tools\bin\ffmpeg.exe"
$ffprobe = "D:\tools\bin\ffprobe.exe"

New-Item -ItemType Directory -Force -Path $out, $voiceDir | Out-Null

function Write-Utf8NoBom($path, $content) {
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $content, $utf8)
}

$segments = @(
  @{ id="00_intro"; start=0.0; text="我是小蓝鲸助手。这里是 Puffer SafeSign，一个放在 imToken 钱包流程里的签名前安全层。" },
  @{ id="01_wallet"; start=5.0; text="流程从钱包首页开始。用户不需要打开额外工具，质押入口就在熟悉的钱包路径里。" },
  @{ id="02_entry"; start=15.0; text="在 ETH 质押页，Puffer SafeSign 作为质押前的安全入口出现。它不直接执行质押，而是先进入签名前检查。" },
  @{ id="03_quote"; start=25.0; text="输入 0.05 ETH 后，页面读取 Puffer 数据，计算预计获得的 pufETH，并展示兑换率、APY、TVL、数据来源和更新时间。" },
  @{ id="04_confirm_a"; start=38.0; text="这里展示本次操作的关键项：付出 0.05 ETH，预计收到 pufETH，目标协议是 Puffer，调用方法是 depositETH。此时还没有签名，也没有上链。" },
  @{ id="04_confirm_b"; start=47.0; text="pufETH 数量少于 ETH，是因为它按兑换率计算，不是简单的一比一数量兑换。" },
  @{ id="05_risk_a"; start=52.0; text="风险扫描分三层：Info 说明操作内容，Warning 提醒收益和兑换率变量，Safe by Design 展示系统不会做的事。" },
  @{ id="05_risk_b"; start=60.0; text="这里明确写出：APY 会变化，广播后不能随意撤回；同时不输入助记词，不上传私钥，也不自动广播。" },
  @{ id="06_core_a"; start=65.0; text="接下来调用 Token Core。tcx-wasm 在浏览器本地创建测试 keystore，派生 Sepolia 测试地址，并生成交易签名和消息签名。" },
  @{ id="06_core_b"; start=75.0; text="这里要拍到运行结果：derived address、tx signature、message signature。私钥不导出，助记词不输入。" },
  @{ id="07_gate_a"; start=82.0; text="签名已经生成，但 Demo 不会自动发送 RPC，也不会触碰真实资产。SafeSign 流程到这里完成。" },
  @{ id="07_gate_b"; start=89.0; text="在真实钱包流程里，最后是否广播到链上，仍然需要用户在钱包里确认。" },
  @{ id="08_evidence_a"; start=96.0; text="最后看运行证据。Puffer 的 source、rate、APY、TVL 回填到第三步；Token Core 的地址和签名回填到第六步；广播状态回填到第七步。" },
  @{ id="08_evidence_b"; start=105.0; text="这些结果不藏在控制台里，而是直接进入页面状态和小蓝鲸助手的提示逻辑。" },
  @{ id="09_end"; start=110.0; text="这就是 Puffer SafeSign：先确认操作边界，再本地签名。最后一步，始终由用户决定。" }
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq "zh-CN" } | Select-Object -First 1
if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
$synth.Rate = 1
$synth.Volume = 100

foreach ($seg in $segments) {
  $path = Join-Path $voiceDir ($seg.id + ".wav")
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($seg.text)
  $synth.SetOutputToNull()
}
$synth.Dispose()

$visualList = @"
file '$screens/00-hero.png'
duration 5
file '$screens/01-wallet-bubble.png'
duration 2
file '$screens/01-wallet.png'
duration 7.5
file '$screens/01-wallet-click.png'
duration 0.5
file '$screens/02-stake-entry-bubble.png'
duration 2
file '$screens/02-stake-entry.png'
duration 7.5
file '$screens/02-stake-entry-click.png'
duration 0.5
file '$screens/03-puffer-quote-bubble.png'
duration 2
file '$screens/03-puffer-quote.png'
duration 10.5
file '$screens/03-puffer-quote-click.png'
duration 0.5
file '$screens/04-confirmation-bubble.png'
duration 2
file '$screens/04-confirmation.png'
duration 11.5
file '$screens/04-confirmation-click.png'
duration 0.5
file '$screens/05-risk-bubble.png'
duration 2
file '$screens/05-risk.png'
duration 10.5
file '$screens/05-risk-click.png'
duration 0.5
file '$screens/06-token-core-bubble.png'
duration 2
file '$screens/06-token-core-start.png'
duration 2
file '$screens/06-token-core-result.png'
duration 13
file '$screens/07-complete-bubble.png'
duration 2
file '$screens/07-complete.png'
duration 12
file '$screens/08-runtime-evidence.png'
duration 14
file '$screens/09-ending.png'
duration 8
file '$screens/09-ending.png'
"@
Write-Utf8NoBom (Join-Path $out "visual-list.txt") $visualList

$mainList = @"
file '$screens/00-hero.png'
duration 5
file '$screens/01-wallet-bubble.png'
duration 2
file '$screens/01-wallet.png'
duration 7.5
file '$screens/01-wallet-click.png'
duration 0.5
file '$screens/02-stake-entry-bubble.png'
duration 2
file '$screens/02-stake-entry.png'
duration 7.5
file '$screens/02-stake-entry-click.png'
duration 0.5
file '$screens/03-puffer-quote-bubble.png'
duration 2
file '$screens/03-puffer-quote.png'
duration 10.5
file '$screens/03-puffer-quote-click.png'
duration 0.5
file '$screens/04-confirmation-bubble.png'
duration 2
file '$screens/04-confirmation.png'
duration 11.5
file '$screens/04-confirmation-click.png'
duration 0.5
file '$screens/05-risk-bubble.png'
duration 2
file '$screens/05-risk.png'
duration 10.5
file '$screens/05-risk-click.png'
duration 0.5
file '$screens/06-token-core-bubble.png'
duration 2
file '$screens/06-token-core-start.png'
duration 2
file '$screens/06-token-core-result.png'
duration 13
file '$screens/07-complete-bubble.png'
duration 2
file '$screens/07-complete.png'
duration 12
file '$screens/07-complete.png'
"@
Write-Utf8NoBom (Join-Path $out "main-list.txt") $mainList

$runtimeList = @"
file '$screens/08-runtime-evidence.png'
duration 14
file '$screens/08-runtime-evidence.png'
"@
Write-Utf8NoBom (Join-Path $out "runtime-list.txt") $runtimeList

& $ffmpeg -y -f concat -safe 0 -i (Join-Path $out "main-list.txt") -vf "fps=30,format=yuv420p" -c:v libx264 -crf 18 -preset medium (Join-Path $out "raw-main-flow.mp4")
& $ffmpeg -y -f concat -safe 0 -i (Join-Path $out "runtime-list.txt") -vf "fps=30,format=yuv420p" -c:v libx264 -crf 18 -preset medium (Join-Path $out "raw-runtime-evidence.mp4")
& $ffmpeg -y -f concat -safe 0 -i (Join-Path $out "visual-list.txt") -vf "fps=30,format=yuv420p" -c:v libx264 -crf 18 -preset medium (Join-Path $out "raw-visual-full.mp4")

$srt = @"
1
00:00:00,000 --> 00:00:05,000
Puffer 签名前安全层
A pre-sign safety layer for Puffer staking

2
00:00:05,000 --> 00:00:15,000
从钱包原生入口开始
Start from the native wallet flow

3
00:00:15,000 --> 00:00:25,000
进入 Puffer 前，先做签名前检查
Review before entering Puffer staking

4
00:00:25,000 --> 00:00:38,000
读取 Puffer 报价和协议数据
Fetch Puffer quote and protocol data

5
00:00:29,000 --> 00:00:36,000
Source: Puffer live / Official snapshot
Rate · APY · TVL · pufETH

6
00:00:38,000 --> 00:00:46,500
确认付出、获得、合约和状态
Review asset flow, contract, and status

7
00:00:46,500 --> 00:00:52,000
pufETH 按兑换率计算，不是 1:1 数量兑换
pufETH is rate-based, not a 1:1 quantity swap

8
00:00:52,000 --> 00:00:59,500
区分操作信息、风险变量和安全边界
Separate action details, risks, and safety boundaries

9
00:00:59,500 --> 00:01:05,000
不输入助记词，不上传私钥，不自动广播
No seed phrase, no key export, no auto-broadcast

10
00:01:05,000 --> 00:01:14,500
Token Core 在本地生成测试签名
Token Core signs locally in the browser

11
00:01:14,500 --> 00:01:22,000
地址和签名结果直接显示在页面中
Address and signatures are visible in the UI

12
00:01:22,000 --> 00:01:29,000
签名完成，但不会自动上链
Signed locally, not broadcast automatically

13
00:01:29,000 --> 00:01:36,000
最后广播仍需用户确认
Final broadcasting still requires user confirmation

14
00:01:36,000 --> 00:01:43,500
真实运行结果显示在页面中
Runtime proof is shown directly in the UI

15
00:01:43,500 --> 00:01:50,000
运行结果不藏在控制台
Proof is visible, not hidden in the console

16
00:01:50,000 --> 00:01:58,000
先确认，再签名，最后由用户决定
Review first. Sign locally. User stays in control.
"@
Write-Utf8NoBom (Join-Path $out "subtitle.srt") $srt

$ass = @"
[Script Info]
Title: Before You Sign Demo
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Microsoft YaHei,40,&H00FFFFFF,&H00FFFFFF,&H7A0B1730,&H990B1730,0,0,0,0,100,100,0,0,4,1.5,0,2,120,120,56,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,Puffer 签名前安全层\NA pre-sign safety layer for Puffer staking
Dialogue: 0,0:00:05.00,0:00:15.00,Default,,0,0,0,,从钱包原生入口开始\NStart from the native wallet flow
Dialogue: 0,0:00:15.00,0:00:25.00,Default,,0,0,0,,进入 Puffer 前，先做签名前检查\NReview before entering Puffer staking
Dialogue: 0,0:00:25.00,0:00:38.00,Default,,0,0,0,,读取 Puffer 报价和协议数据\NFetch Puffer quote and protocol data
Dialogue: 0,0:00:29.00,0:00:36.00,Default,,0,0,0,,Source: Puffer live / Official snapshot\NRate · APY · TVL · pufETH
Dialogue: 0,0:00:38.00,0:00:46.50,Default,,0,0,0,,确认付出、获得、合约和状态\NReview asset flow, contract, and status
Dialogue: 0,0:00:46.50,0:00:52.00,Default,,0,0,0,,pufETH 按兑换率计算，不是 1:1 数量兑换\NpufETH is rate-based, not a 1:1 quantity swap
Dialogue: 0,0:00:52.00,0:00:59.50,Default,,0,0,0,,区分操作信息、风险变量和安全边界\NSeparate action details, risks, and safety boundaries
Dialogue: 0,0:00:59.50,0:01:05.00,Default,,0,0,0,,不输入助记词，不上传私钥，不自动广播\NNo seed phrase, no key export, no auto-broadcast
Dialogue: 0,0:01:05.00,0:01:14.50,Default,,0,0,0,,Token Core 在本地生成测试签名\NToken Core signs locally in the browser
Dialogue: 0,0:01:14.50,0:01:22.00,Default,,0,0,0,,地址和签名结果直接显示在页面中\NAddress and signatures are visible in the UI
Dialogue: 0,0:01:22.00,0:01:29.00,Default,,0,0,0,,签名完成，但不会自动上链\NSigned locally, not broadcast automatically
Dialogue: 0,0:01:29.00,0:01:36.00,Default,,0,0,0,,最后广播仍需用户确认\NFinal broadcasting still requires user confirmation
Dialogue: 0,0:01:36.00,0:01:43.50,Default,,0,0,0,,真实运行结果显示在页面中\NRuntime proof is shown directly in the UI
Dialogue: 0,0:01:43.50,0:01:50.00,Default,,0,0,0,,运行结果不藏在控制台\NProof is visible, not hidden in the console
Dialogue: 0,0:01:50.00,0:01:58.00,Default,,0,0,0,,先确认，再签名，最后由用户决定\NReview first. Sign locally. User stays in control.
"@
Write-Utf8NoBom (Join-Path $out "subtitle.ass") $ass

$voiceInputs = @()
$voiceFilters = @()
$mixLabels = @()
for ($i = 0; $i -lt $segments.Count; $i++) {
  $seg = $segments[$i]
  $voiceInputs += @("-i", (Join-Path $voiceDir ($seg.id + ".wav")))
  $delay = [int]($seg.start * 1000)
  $voiceFilters += "[$($i):a]adelay=$delay|$delay,volume=1.0[v$i]"
  $mixLabels += "[v$i]"
}
$voiceComplex = ($voiceFilters -join ";") + ";" + ($mixLabels -join "") + "amix=inputs=$($segments.Count):duration=longest:normalize=0[voice]"
& $ffmpeg -y @voiceInputs -filter_complex $voiceComplex -map "[voice]" -c:a pcm_s16le (Join-Path $out "voiceover.wav")

& $ffmpeg -y -f lavfi -i "sine=frequency=220:duration=118:sample_rate=48000" -f lavfi -i "sine=frequency=330:duration=118:sample_rate=48000" -filter_complex "[0:a]volume=0.025[a0];[1:a]volume=0.018[a1];[a0][a1]amix=inputs=2:duration=first,afade=t=in:st=0:d=3,afade=t=out:st=114:d=4" -c:a pcm_s16le (Join-Path $out "bgm.wav")
& $ffmpeg -y -f lavfi -i "sine=frequency=980:duration=0.07:sample_rate=48000" -af "volume=0.35,afade=t=out:st=0.025:d=0.045" -c:a pcm_s16le (Join-Path $out "tap.wav")

$tapTimes = @(14.6,24.6,37.6,51.6,64.6,81.6,95.6)
$tapInputs = @()
$tapFilters = @()
$tapLabels = @()
for ($i = 0; $i -lt $tapTimes.Count; $i++) {
  $tapInputs += @("-i", (Join-Path $out "tap.wav"))
  $delay = [int]($tapTimes[$i] * 1000)
  $tapFilters += "[$($i):a]adelay=$delay|$delay[t$i]"
  $tapLabels += "[t$i]"
}
$tapComplex = ($tapFilters -join ";") + ";" + ($tapLabels -join "") + "amix=inputs=$($tapTimes.Count):duration=longest:normalize=0[taps]"
& $ffmpeg -y @tapInputs -filter_complex $tapComplex -map "[taps]" -c:a pcm_s16le (Join-Path $out "clicks.wav")

$subtitlePath = (Join-Path $out "subtitle.ass").Replace("\", "/").Replace(":", "\:")
$final = Join-Path $out "BeforeYouSign_PufferSafeSign_Demo.mp4"
& $ffmpeg -y -i (Join-Path $out "raw-visual-full.mp4") -i (Join-Path $out "voiceover.wav") -i (Join-Path $out "bgm.wav") -i (Join-Path $out "clicks.wav") -filter_complex "[1:a]volume=1.0[a1];[2:a]volume=0.12[a2];[3:a]volume=0.22[a3];[a1][a2][a3]amix=inputs=3:duration=longest:normalize=0[a]" -vf "ass='$subtitlePath'" -map 0:v -map "[a]" -t 118 -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -movflags +faststart $final
Copy-Item $final (Join-Path $out "final-project-video.mp4") -Force

& $ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $final
Get-ChildItem $out -File | Select-Object Name,Length | Format-Table -AutoSize
