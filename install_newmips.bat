Title Installation Newmips

#Install Newmips app
echo "Starting generator nodes modules installation"
npm install

#Create workspace dir
echo "Create the workspace directory"
mkdir workspace

#Install Newmips structure template
echo "Starting template nodes modules installation"
cd structure/template
npm install

cd ../../

set /p mysqlpath= "Please type the mysql.exe path (Maybe something like : c:/wamp/bin/mysql/mysql5.6.17/bin/mysql.exe)"

set /p havePass= "Do you have a root password ? (If you are using WAMP you shouldn't have on) type 'Yes' or 'No'"

echo "Starting database creation"
if ( %havePass% == "Yes" ) ($mysqlpath -u root -p < sql/00-create-database.sql > error.log) ($mysqlpath -u root < sql/00-create-database.sql > error.log)

echo "Database newmips created"

#Create newmips database
echo "Starting schema newmips creation"
%mysqlpath% -u newmips -pnewmips -h127.0.0.1 newmips < sql/01-newmips-bdd.sql
%mysqlpath% -u newmips -pnewmips -h127.0.0.1 newmips < sql/02-tablesreferences.sql

echo "Newmips ready to be started"