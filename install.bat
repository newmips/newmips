@echo off
REM Installation Newmips
REM Install Newmips app
echo Starting generator node modules installation
call npm install
REM Create workspace dir
echo Create the workspace directory
mkdir workspace
copy structure\template\package.json workspace\
cd workspace
call npm install
cd ..
set /p mysqlpath="Please type the mysql.exe path (Example : c:/xampp/mysql/bin/mysql.exe) "
echo Starting database creation
REM echo %mysqlpath%
echo Trying to log as root on mysql
"%mysqlpath%" -u root -p%pass% < sql/create-database.sql
REM if errorlevel 1 goto :error
echo Database newmips created
REM Create newmips database
goto :success
:error
echo Newmips schema is not created.
echo Installation is not finished due to mysql trouble. Please start mysql and try again.
pause
goto :eof
:success
echo Newmips schema created.
echo Newmips ready to be started.
pause
goto :eof
