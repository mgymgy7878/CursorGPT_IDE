' Spark WebNext Dev Server - Windowless Launcher
' VBS wrapper to run start-webnext-dev.cmd without showing a console window
' Place this in shell:startup for silent auto-start

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get script directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
repoRoot = fso.GetParentFolderName(scriptDir)
cmdPath = scriptDir & "\start-webnext-dev.cmd"

' Check if script exists
If Not fso.FileExists(cmdPath) Then
    ' Try alternative path (if VBS is in repo root)
    cmdPath = repoRoot & "\tools\windows\start-webnext-dev.cmd"
End If

If Not fso.FileExists(cmdPath) Then
    ' Log error (if logs folder exists)
    logPath = repoRoot & "\logs\web-next-dev-startup.err.log"
    Set logFile = fso.OpenTextFile(logPath, 8, True)
    logFile.WriteLine "[" & Now & "] ERROR: start-webnext-dev.cmd not found at " & cmdPath
    logFile.Close
    WScript.Quit 1
End If

' Run script hidden (0 = hidden window)
WshShell.Run """" & cmdPath & """", 0, False

' Script started, exit
WScript.Quit 0
