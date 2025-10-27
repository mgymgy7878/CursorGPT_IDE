' Spark Platform - Gorunmez Baslatma
' PM2 daemon penceresini gizler

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Script dizinini al
scriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' PowerShell komutunu olustur
psCommand = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "\basla.ps1"""

' Gorunmez modda calistir (0 = pencere gizli)
objShell.Run psCommand, 0, False

' Bildirim goster
Set objNotify = CreateObject("WScript.Shell")
objNotify.Popup "Spark Platform baslat" & vbCrLf & vbCrLf & "PM2 arka planda calisiyor..." & vbCrLf & "Durum: pm2 status", 3, "Spark Platform", 64

Set objShell = Nothing
Set objFSO = Nothing
Set objNotify = Nothing

