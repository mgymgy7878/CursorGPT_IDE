# Automation Schedule (prod)

## Linux (crontab)
# Hourly self-check + evidence
0 * * * * /usr/bin/bash -lc "pnpm run maintenance:run >> /var/log/spark/maintenance.log 2>&1"

# Daily report + evidence rotation (14g)
5 0 * * * /usr/bin/bash -lc "pnpm run fusion:integrate && find evidence -type f -mtime +14 -delete"

# Weekly confidence review
15 1 * * 1 /usr/bin/bash -lc "pnpm run automation:suggest"

# Monthly hardening
30 1 1 * * /usr/bin/bash -lc "pnpm run ops:harden"

## Windows (Task Scheduler — örnek)
# PowerShell (Yönetici): 
# Register-ScheduledTask -TaskName 'SparkHourly' -Trigger (New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration ([TimeSpan]::MaxValue)) -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -File scripts/maintenance-automation.ps1') -RunLevel Highest
