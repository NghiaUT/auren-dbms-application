#requires -Version 5.1
[CmdletBinding()]
param(
    [ValidateRange(1, 180)][int]$TimeoutSeconds = 180,
    [string]$LogDirectory = 'D:\DockerTools\logs'
)

$ErrorActionPreference = 'Stop'
$exitCode = 1
$mutex = $null
$ownsMutex = $false
$logFile = $null

function Write-Log([string]$Message) {
    $line = '{0} {1}' -f [DateTimeOffset]::Now.ToString('o'), $Message
    Write-Host $line
    if ($script:logFile) { Add-Content -LiteralPath $script:logFile -Value $line -Encoding UTF8 }
}

# Bound waiting without terminating Docker, WSL, or even a hung CLI process.
# A pending command consumes the remaining budget; no additional probe is spawned.
function Invoke-Docker([string]$Arguments) {
    $remaining = $script:deadline - [DateTime]::UtcNow
    if ($remaining.TotalMilliseconds -le 0) { throw 'Readiness deadline reached.' }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $script:dockerPath
    $psi.Arguments = $Arguments
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    try {
        if (-not $process.Start()) { throw 'Could not launch Docker CLI.' }
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        while (-not $process.HasExited) {
            $left = [int][Math]::Ceiling(($script:deadline - [DateTime]::UtcNow).TotalMilliseconds)
            if ($left -le 0) {
                throw "Docker CLI PID $($process.Id) is still pending at the deadline; no process was terminated."
            }
            [void]$process.WaitForExit([Math]::Min(5000, $left))
        }
        $drainMs = [int][Math]::Max(0, [Math]::Ceiling(($script:deadline - [DateTime]::UtcNow).TotalMilliseconds))
        if (-not [Threading.Tasks.Task]::WaitAll([Threading.Tasks.Task[]]@($stdout, $stderr), $drainMs)) {
            throw 'Docker CLI output did not close before the readiness deadline; no process was terminated.'
        }
        $output = $stdout.GetAwaiter().GetResult().Trim()
        $errorText = $stderr.GetAwaiter().GetResult().Trim()
        return [pscustomobject]@{ Code = $process.ExitCode; Output = $output; Error = $errorText }
    } finally { $process.Dispose() }
}

function Test-Engine {
    $result = Invoke-Docker '--context desktop-linux info --format "{{.ServerVersion}}|{{.OSType}}|{{.OperatingSystem}}|{{.DockerRootDir}}"'
    if ($result.Code -eq 0 -and $result.Output -match '^\d+\.\d+[^|]*\|linux\|') {
        Write-Log "ENGINE_READY $($result.Output)"
        return $true
    }
    Write-Log "ENGINE_NOT_READY exit=$($result.Code) $($result.Error)"
    return $false
}

function Write-Diagnostics {
    # Read runtime metadata only. Never open, move, or remove Docker data/VHDX.
    try {
        $socket = Join-Path $env:LOCALAPPDATA 'Docker\run\dockerInference'
        $item = Get-Item -LiteralPath $socket -Force -ErrorAction SilentlyContinue
        if ($item) { Write-Log "Runtime socket: $($item.FullName); attributes=$($item.Attributes)" }
        else { Write-Log "Runtime socket not found: $socket" }
        $backendLog = Join-Path $env:LOCALAPPDATA 'Docker\log\host\com.docker.backend.exe.log'
        if (Test-Path -LiteralPath $backendLog) {
            $lines = Get-Content -LiteralPath $backendLog -Tail 100 |
                Where-Object { $_ -match 'dockerInference|initializing Inference|starting services|\[ERROR\]' } |
                Select-Object -Last 8
            foreach ($line in $lines) { Write-Log "Backend diagnostic: $line" }
        }
    } catch { Write-Log "Diagnostics unavailable: $($_.Exception.Message)" }
}

try {
    if ($env:OS -ne 'Windows_NT') { throw 'This script requires Windows.' }
    if ($env:LOCALAPPDATA -match '\\Packages\\sandbox\.') {
        throw 'Codex sandbox redirects LOCALAPPDATA. Run this script in the signed-in user Windows session with normal permissions; do not elevate or start Docker Desktop.exe directly.'
    }
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
    $script:logFile = Join-Path $LogDirectory ('ensure-docker-{0}-{1}.log' -f (Get-Date -Format 'yyyyMMdd-HHmmss-fff'), $PID)
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    $session = [Diagnostics.Process]::GetCurrentProcess().SessionId
    Write-Log "User=$($identity.Name); session=$session; elevated=$isAdmin; LOCALAPPDATA=$env:LOCALAPPDATA"
    $mutex = New-Object Threading.Mutex($false, "Local\AurenEnsureDocker-$($identity.User.Value)")
    try { $ownsMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { throw 'Another ensure-docker invocation is active in this user session. Wait for its result.' }
    $script:dockerPath = (Get-Command docker.exe -ErrorAction Stop).Source
    $script:deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)

    # An already usable engine must not trigger a second Desktop instance.
    if (Test-Engine) {
        $exitCode = 0
    } else {
        $explorer = @(Get-Process explorer -ErrorAction SilentlyContinue | Where-Object SessionId -EQ $session)
        if ($isAdmin -or $session -eq 0 -or $explorer.Count -eq 0) {
            throw 'Desktop startup requires the signed-in interactive Windows user session, without administrator elevation. Open Docker Desktop manually or grant access to that normal session.'
        }
        Write-Log 'START_REQUEST docker desktop start --detach (one call)'
        $start = Invoke-Docker 'desktop start --detach'
        Write-Log "START_RESULT exit=$($start.Code) $($start.Output) $($start.Error)"
        # Even a nonzero start result is not proof about engine readiness; poll info.
        while ([DateTime]::UtcNow -lt $script:deadline) {
            if (Test-Engine) { $exitCode = 0; break }
            $sleepMs = [int][Math]::Min(5000, [Math]::Max(0, ($script:deadline - [DateTime]::UtcNow).TotalMilliseconds))
            if ($sleepMs -gt 0) { Start-Sleep -Milliseconds $sleepMs }
        }
        if ($exitCode -ne 0) { throw "Docker Engine was not ready within $TimeoutSeconds seconds." }
    }
} catch {
    Write-Log "FAILED $($_.Exception.Message)"
    if ($script:logFile) {
        Write-Diagnostics
        Write-Log 'If dockerInference recurred, stop here. Inspect the runtime socket with Docker Desktop fully quit through its normal controls; request a scoped runtime-socket repair. This script never deletes/renames files, terminates processes, shuts down WSL, resets, prunes, or alters Docker data.'
    }
} finally {
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    if ($mutex) { $mutex.Dispose() }
    if ($script:logFile) { Write-Log "RESULT exit=$exitCode; log=$script:logFile" }
}
exit $exitCode
