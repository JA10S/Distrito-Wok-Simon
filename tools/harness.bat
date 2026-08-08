@echo off
REM Wrapper para harness.ps1
REM Uso: harness.bat [comando]

powershell -ExecutionPolicy Bypass -File "%~dp0harness.ps1" %*