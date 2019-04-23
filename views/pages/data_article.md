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
 
80,000 references meters, which is roughly 50 miles. This is from city center to coastline, and since some travellers might be willing to drive further, I have decided to include all cities that could 'reasonably'



What do you guys think about: town = less than 50k people, small city, less than 150k, city, less than 500k, large city, less than 2 million people, mega city, anything larger. What population breakdowns would you give?
Similarly, for the coast line, what defines "close to beaches"? I filtered it to less than 50 miles to coast. Some friends I asked said 10 or 25 miles, but I dont think there is harm in showing cities that are 40 miles away, it could be a big drive, but not necessarily terrible.
For mountains, there is no list of mountains I can find. So what defines mountain? I was going to go by elevation data, and say any region over 11,500 feet
If you are looking for potential skiing cities, I think its further than beaches. I was going to set it to "Cities that are less than 80 miles from a region at least 11,500 ft"

Make sure you have postgis extention enabled in your database, 
CREATE EXTENSION postgis;
17:14
then you have to make a temp table where the lon/lat are replaced with geometries (technically geographies, but i havent gotten that far yet, so I just cast later)
I use the projection 4326, because its pretty standard

Convert city points to geoms.
SELECT id, ST_SetSRID(ST_MakePoint(lon, lat), 4326) INTO TABLE citygeom FROM city;

Then I would do something similar for airports, so you have airport id, and point
(Side note, temp tables disappear after you close out of psql. If you want to do that, use INTO TEMP TABLE citygeom
Then, once you have both that are points, you combine them into your perminent table that will have city id, and t/f for whether there is a close by airport
SELECT DISTINCT(cg.id), COALESCE(ST_DWithin(cl.geom:geography, cg.st_setsrid::geography, 80000), false) INTO TABLE beaches FROM coastline cl RIGHT JOIN citygeom cg ON ST_DWithin(cl.geom::geography, cg.st_setsrid::geography, 80000);
Thats the query I used. Note that you have to cast to geography for ST_DWithin to work properly, with the ::
I actually missed it copying in the first one. but its table.geoAttribute::geography
the 80,000 that I used is meters, thats 50 miles. I would make it much smaller than that
like 10 max
So like 16000 meters


Cool, well I have to strip this csv file I have down some and then Ill give that a go

So this: 'SELECT DISTINCT(cg.id), COALESCE(ST_DWithin(cl.geom:geography, cg.st_setsrid::geography, 80000), false) INTO TABLE beaches FROM coastline cl RIGHT JOIN citygeom cg ON ST_DWithin(cl.geom::geography, cg.st_setsrid::geography, 80000);'

coalesce selects the first true statement, or the last one
in this case, if the st_dwithin is true its true, otherwise false
st_dwithin, i believe loops through them all and checks to see if there are city points within the distance specified for each airport point
distance in meters.
