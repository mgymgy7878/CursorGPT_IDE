' Spark WebNext Dev Server Watchdog - Windowless Launcher
' VBS wrapper to run watch-webnext-dev.cmd without showing a console window
' Place this in shell:startup for silent auto-start

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get script directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
cmdPath = scriptDir & "\watch-webnext-dev.cmd"

' Check if script exists
If Not fso.FileExists(cmdPath) Then
    ' Try alternative path (if VBS is in repo root)
    repoRoot = fso.GetParentFolderName(scriptDir)
    cmdPath = repoRoot & "\tools\windows\watch-webnext-dev.cmd"
End If

If Not fso.FileExists(cmdPath) Then
    ' Log error (if logs folder exists)
    logPath = fso.GetParentFolderName(scriptDir) & "\logs\webnext-watch-startup.err.log"
    On Error Resume Next
    Set logFile = fso.OpenTextFile(logPath, 8, True)
    logFile.WriteLine "[" & Now & "] ERROR: watch-webnext-dev.cmd not found at " & cmdPath
    logFile.Close
    On Error Goto 0
    WScript.Quit 1
End If

' Run script hidden (0 = hidden window)
WshShell.Run """" & cmdPath & """", 0, False

' Script started, exit
WScript.Quit 0
