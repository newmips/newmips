@echo off
REM Installation Newmips
REM Install Newmips app
echo Starting generator node modules installation
call npm install
REM Create workspace dir
echo Create the workspace directory
mkdir workspace
set /p mysqlpath="Please type the mysql.exe path (Maybe something like : c:/xampp/mysql/bin/mysql.exe) "
echo Starting database creation
REM echo %mysqlpath%
echo Trying to log as root on mysql
"%mysqlpath%" -u root -p%pass% < sql/00-create-database.sql
REM if errorlevel 1 goto :error
echo Database newmips created
REM Create newmips database
echo Starting schema newmips creation
%mysqlpath% -u newmips -pnewmips -h127.0.0.1 newmips < sql/01-newmips-bdd.sql
if errorlevel 1 goto :error
%mysqlpath% -u newmips -pnewmips -h127.0.0.1 newmips < sql/02-tablesreferences.sql
if errorlevel 1 goto :error
goto :success
:error
echo Newmips schema is not created.
echo Installation is not finished due to mysql trouble. Please start Mysql and try again.
pause
goto :eof
:success
echo Newmips schema created.
echo Newmips ready to be started.
pause
goto :eof
