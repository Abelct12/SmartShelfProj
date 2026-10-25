@echo off
setlocal

echo =====================================================================
echo  Stopping AI Food Shelf Life Prediction Services
echo =====================================================================
echo.

powershell -NoProfile -Command "$ports = @(8000, 5173); foreach ($p in $ports) { $connections = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; if ($connections) { $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { try { $proc = Get-Process -Id $procId -ErrorAction Stop; Write-Host \"[*] Terminating process on port $p (PID: $procId, Name: $($proc.ProcessName))...\"; $parentProcId = (Get-CimInstance Win32_Process -Filter \"ProcessId = $procId\" -ErrorAction SilentlyContinue).ParentProcessId; if ($parentProcId) { $parent = Get-Process -Id $parentProcId -ErrorAction SilentlyContinue; if ($parent -and ($parent.ProcessName -eq 'cmd' -or $parent.ProcessName -eq 'powershell' -or $parent.ProcessName -eq 'node' -or $parent.ProcessName -eq 'python')) { taskkill.exe /PID $parentProcId /T /F >$null 2>&1 } }; taskkill.exe /PID $procId /T /F >$null 2>&1; Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue; } catch { Write-Host \"[!] Process $procId could not be stopped: $($_.Exception.Message)\"; } } } else { Write-Host \"[i] No active process detected on port $p.\"; } }; Get-CimInstance Win32_Process -Filter \"CommandLine LIKE '%%FoodShelf%%'\" -ErrorAction SilentlyContinue | ForEach-Object { if ($_.ProcessId -ne $PID) { taskkill.exe /PID $_.ProcessId /T /F >$null 2>&1 } }"

echo.
echo [OK] All FoodShelf.AI services stopped.
echo =====================================================================
