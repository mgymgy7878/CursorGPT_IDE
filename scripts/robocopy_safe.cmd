@echo off
set SRC=%~1
set DST=%~2
shift & shift
set FLAGS=/E /MT:32 /R:1 /W:1 /NP /NFL /NDL /NJH /NJS /DCOPY:T /COPY:DAT /XO /XJ
robocopy "%SRC%" "%DST%" %FLAGS% %*
set RC=%ERRORLEVEL%
if %RC% LSS 8 (exit /b 0) else (exit /b %RC%)
