Dim sh, rc
Set sh = CreateObject("WScript.Shell")
rc = sh.Run("cmd /c scripts\one-shot.cmd", 1, True)
WScript.Quit rc
