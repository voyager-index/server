BEGIN;
DROP TABLE IF EXISTS City CASCADE;
DROP TABLE IF EXISTS Country CASCADE;
COMMIT;

CREATE Table Country(
ID serial PRIMARY KEY NOT NULL,
Name text NOT NULL
);

CREATE Table City(
ID serial NOT NULL,
Name text NOT NULL,
Country int NOT NULL REFERENCES Country(ID),
City_Code text NOT NULL,
PRIMARY KEY (ID, Country)
);


INSERT INTO Country (name) VALUES ('United States');
INSERT INTO Country (name) VALUES ('Canada');
INSERT INTO Country (name) VALUES ('Mexico');
INSERT INTO Country (name) VALUES ('Puerto Rico');
