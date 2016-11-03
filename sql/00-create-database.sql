DROP DATABASE IF EXISTS newmips;
CREATE DATABASE newmips;

CREATE USER 'newmips'@'127.0.0.1' IDENTIFIED BY 'newmips';
GRANT ALL PRIVILEGES ON newmips.* TO 'newmips'@'127.0.0.1';
