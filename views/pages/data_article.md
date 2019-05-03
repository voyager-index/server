# City Data

Downloaded from natural earth.

Used `shp2pgsql` to convert the shapefile into a postgresql query/instert file. Used `psql -f thatfile.sql` to get it into a temp database

Created country table with

```SQL
CREATE TABLE country(id SERIAL NOT NULL, name VARCHAR(100), code VARCHAR(3));
```

Inserted from DB with

```SQL
INSERT INTO country (name, code) SELECT DISTNICT(sov0name) as name, sov_a3 as code FROM temptable;
```

Created city table with

```SQL
CREATE TABLE city (id SERIAL NOT NULL, name VARCHAR(100), country\_id
INTEGER REFERENCES country(id), lat NUMERIC, lng NUMERIC);
```

Inserted with

```sql
INSERT INTO city(name, country\_id, lat, lng) 
SELECT temptable.name,c.id, latitude, longitude 
FROM temptable 
JOIN country AS c ON temptable.sov0name = c.name;
```

Copied these with `\copy (SELECT * FROM country)` to `'\Users\user\...\MyFileName.csv\' with csv`

# Beaches

Using coastline data from the natural earth site, I have created a table using `shp2pgsql`.

Then, I created a temp table from the city data, with postgis point geoms instead of lon/lat, using `ST_MakePoint(lon, lat)`
Since this was actually wrong, and had no srid, I had to 

Then, I merged these tables and used the `ST_DWithin` function from postgis with the following command: 

```sql
ALTER TABLE st_setsrid
ALTER TABLE coastline
ALTER COLUMN geom TYPE geometry(MULTILINESTRING, 4326)
USING ST_SetSRID(geom,4326)

SELECT id, ST_SetSRID(ST_MakePoint(lon, lat), 4326) 
INTO TABLE citygeom FROM city;

SELECT DISTINCT(cg.id), COALESCE(ST_DWithin(cl.geom:geography, cg.st_setsrid::geography, 80000), false) 
INTO TABLE beaches FROM coastline cl 
RIGHT JOIN citygeom cg ON ST_DWithin(cl.geom::geography, cg.st_setsrid::geography, 80000);
```

# Technologies

This project was completed using [PostgreSQL](https://www.postgresql.org/download/) wriuth the [PostGIS](https://postgis.net/install/) extension

# Cities and Countries

City data was downloaded from [Natural Earth](https://www.naturalearthdata.com/), selecting the highest resolution data. \"Populated Places\" was the data item chosen.

Using the commandline program shp2pgsql, the shapefile is converted into a SQL file. Using the command `shp2pgsql ne\_10m\_populated\_places.shp public.populatedplaces \> populatedplace.sql` I was able to create a SQL file that would create a new table, populatedplaces, into the public schema of my database.

This data contained some different characters than what were standard on windwos, so in psql ([psql -U postgres]
) I was able to set the encoding to UTF8 with [SET CLIENT\_ENCODING TO UTF8;]


From here, I moved on to creating two tables, a country table, and a city table. The country table would have the attributes \"id\" and \"name\". The city table would have the attributes \"id\", \"name\", \"country\" (A foreign key), and \"lat\" and \"lon\" which would be used to represent the city points, and eventually to place markers on the map, using OpenLayers 5.

```sql
SELECT DISTINCT(sov0name) FROM populatedplaces INTO TABLE country;

ALTER TABLE country ADD COLUMN id SERIAL;
```


The second statement is to create ids for each country, which will be used for foreign keys.

Then, for cities.

```sql
SELECT p.name, c.id AS country, p.latitude AS lat, p.longitude AS lon
INTO TABLE city FROM populatedplaces p LEFT JOIN country c ON p.sov0name = c.name; 
ALTER TABLE city ADD COLUMN id SERIAL;
ALTER TABLE city ADD CONSTRAINT key FOREIGN KEY (country) REFERENCES country (id) MATCH FULL;
```


It is useful to have these tables saved elsewhere in a short form, to be able to be shared. This was done with the \'\\copy\' command, still on the psql command line

```sql
\\copy (SELECT \* FROM country) to
\'\\Users\\user\\\...\\MyFileName.csv\' with csv
```


A similar command was used for the city table.

Small side note, the ID columns were out of order from how I wanted them, so I opened the csv files in a spreadsheet application, and manually copy and pasted in order to switch the columns

It is also useful to save a SQL file to easily import these into a new
database. A file named \'data.sql\' was created, and had these commands
added to it:

```sql
\\copy Country(id, Name) FROM \'data/country.csv\' DELIMITER \',\' CSV HEADER;
\\copy City(id, name, lat, lon, Country) FROM \'data/city.csv\' DELIMITER \',\' CSV HEADER;
```

# Beaches


The goal for this table was to find the cities that are close to the beach. To do this, coastline data was downloaded from the same Natural Earth website, and the highest resolution (10m) vector data was downloaded, called \"Coastlines.\" What defines close to the beach, for our purposes? We decided that within 40 miles from city center to coastline would be reasonable for now, until we have more user feedback. For reference, 40 miles is about 64,000 meters, which is what will be used in the ST\_DWithin() PostGIS function.

In order to accomplish this goal, a temporary table was created, in order to have fast access to PostGIS GEOMETRIES, rather than having to convert from Latitudes and Longitudes in the main function. The main function took over an hour to run on my machine, so time savings was beneficial.

```sql
SELECT id, ST\_SetSRID(ST\_MakePoint(lon, lat), 4326) INTO TEMP TABLE
citygeom FROM city;
ALTER TABLE citygeom RENAME COLUMN
st\_setsrid TO geom;
```

Coastline data was entered into the database using the .sql file created by the shp2pgsql command line executable. I then altered the table to make sure that the SRIDs were the same for both geometries. The ST\_DWithin() PostGIS function actually needs the vector data as geographies to caculate distances in meters, so they were convereted using two colons like: table.geom::geography

```sql
ALTER TABLE coastline ALTER COLUMN geom TYPE geometry(MULTILINESTRING,
4326) USING ST\_SetSRID(geom,4326)
 SELECT
DISTINCT(cg.id), COALESCE(ST\_DWithin(cl.geom:geography,
cg.geom::geography, 64000), false) INTO TABLE beaches FROM coastline cl
RIGHT JOIN citygeom cg ON ST\_DWithin(cl.geom::geography,
cg.geom::geography, 64000); 

```

# Elevation

Elevation was obtained from the public dataset GTOPO30, downloaded from [Earth Explorer](https://earthexplorer.usgs.gov/). You are required to make an account, download both java, and a bulk download application, and then place an order, though the information is public and free. This data was slected over newer, more accurate information, because of the size of the download. Uncompressed, this elevation raster data was 1.5 GB, which was less than 10% of the size of the newer GTOPO2010 data. This raster data was imported into postgis with the raster2pgsql function. Using the same city geometries table as before, I was able to get elevation data for each of those points. Perhaps someone can share with me a faster way, as this query took 8 hours to compute on my machine!

```sql
SELECT c.id, ST\_Value(e.rast, c.geom) AS elevation INTO TABLE elevationdata FROM citygeom c LEFT JOIN elevationRaster e ON ST\_Contains(ST\_Envelope(e.rast), c.geom);
```

# Climate

Climate data is gathered from WorldClim.org. There is monthly data, gathered from 1960-1990. 

>Citation: 
>Hijmans, R.J., S.E. Cameron, J.L. Parra, P.G. Jones and A. Jarvis, 2005. Very high resolution interpolated climate surfaces for global land areas. International Journal of Climatology 25: 1965-1978. 

This raster data was included in PostGIS with the raster2pgsql function.

```sql
SELECT x.id, x.jan, x.feb, x.mar, x.apr, x.may, x.june, x.july, x.aug, x.sept, x.oct, x.nov, x.dec INTO TABLE temp FROM (
SELECT j.id, j.temp AS jan, f.temp AS feb, m.temp AS mar, a.temp AS apr, ma.temp AS may, ju.temp AS june, jul.temp AS july, au.temp AS aug, s.temp AS sept, o.temp AS oct, n.temp AS nov, d.temp AS dec
FROM jantemp AS j 
INNER JOIN febtemp as f ON j.id = f.id
INNER JOIN martemp as m ON j.id = m.id
INNER JOIN aprtemp as a ON j.id = a.id
INNER JOIN maytemp as ma ON j.id = ma.id
INNER JOIN junetemp as ju ON j.id = ju.id
INNER JOIN julytemp as jul ON j.id = jul.id
INNER JOIN augtemp as au ON j.id = au.id
INNER JOIN septtemp as s ON j.id = s.id
INNER JOIN octtemp as o ON j.id = o.id
INNER JOIN novtemp as n ON j.id = n.id
INNER JOIN dectemp as d ON j.id = d.id
) as x ORDER BY x.id;
```

This was repeated for precipitation. From this dataset, the temperatures are in C, multiplied by 10 (So that there can be one decimal place of accuracy, while using integer data types, to save space) Precipitation appears to be in mm.