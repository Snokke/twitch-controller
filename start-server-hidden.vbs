Dim objShell, strDir
Set objShell = CreateObject("WScript.Shell")
strDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
objShell.Run "node """ & strDir & "\server\server.js""", 0, False
Set objShell = Nothing
