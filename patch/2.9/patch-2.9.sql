ALTER TABLE application DROP COLUMN name;
ALTER TABLE application CHANGE codeName name varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL;