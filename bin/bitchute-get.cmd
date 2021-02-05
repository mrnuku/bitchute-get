:: Created by npm, please don't edit manually.
@ECHO OFF

SETLOCAL

SET "NODE_EXE=%~dp0\node.exe"
IF NOT EXIST "%NODE_EXE%" (
  SET "NODE_EXE=node"
)

SET "BITCHUTE_GET_CLI_JS=%~dp0\node_modules\bitchute-get\bin\bitchute-get-cli.js"
FOR /F "delims=" %%F IN ('CALL "%NODE_EXE%" "%BITCHUTE_GET_CLI_JS%" prefix -g') DO (
  SET "BITCHUTE_GET_PREFIX_BITCHUTE_GET_CLI_JS=%%F\node_modules\bitchute-get\bin\bitchute-get-cli.js"
)
IF EXIST "%BITCHUTE_GET_PREFIX_BITCHUTE_GET_CLI_JS%" (
  SET "BITCHUTE_GET_CLI_JS=%BITCHUTE_GET_PREFIX_BITCHUTE_GET_CLI_JS%"
)

"%NODE_EXE%" "%BITCHUTE_GET_CLI_JS%" %*
