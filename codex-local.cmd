@echo off
set "CODEX_HOME=%~dp0.codex-home"
call "%~dp0.codex-cli\node_modules\.bin\codex.cmd" %*
