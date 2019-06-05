# Our Data Journey

This article details our process gathering data from a variety of sources, and cleaning it and combining it, and turning into something we can use, to share information about cities from around the globe.

## Technologies

This project was completed using [PostgreSQL](https://www.postgresql.org/download/) wriuth the [PostGIS](https://postgis.net/install/) extension

## Important commands and tools

Copy a table to a CSV (Comma separated values) file with the '\copy' command in postgresql.
`\copy (SELECT * FROM table)` to `'\path\to\MyFileName.csv\' with csv`

Copy from a CSV file into the database with the '\copy' command as well.
`\copy table(column1, column2) FROM 'MyFile.csv' DELIMITER ',' CSV HEADER;`
Only include 'CSV HEADER' if your CSV has a header. If your table id column is serial, and it doesn't exist in your CSV file, you don't need to include it in the set of columns.

Used `shp2pgsql` to convert the shapefile into a postgresql query/insert file. Used `psql -f thatfile.sql` to get it into a temp database

Postgres normally uses the postgres user, so you can get into the postgres command line with `psql -U postgres`

## Cities and Countries

City data was downloaded from [Natural Earth](https://www.naturalearthdata.com/), selecting the highest resolution data. \"Populated Places\" was the data item chosen.

Using the commandline program shp2pgsql, the shapefile is converted into a SQL file. Using the command 
`shp2pgsql ne\_10m\_populated\_places.shp public.populatedplaces \> populatedplace.sql` 
This command generates a SQL file that creates a new table, 'populatedplaces', into the public schema of my database.

This data contained some different characters than what were standard on windows, so in psql set the encoding to UTF8 with `SET CLIENT\_ENCODING TO UTF8;`

From here, I moved on to creating two tables, a country table, and a city table. The country table would have the attributes \"id\" and \"name\". The city table would have the attributes \"id\", \"name\", \"country\" (A foreign key), and \"lat\" and \"lon\" which would be used to represent the city points, and eventually to place markers on the map, using OpenLayers 5.

The following select statements create a table to put their data instead of displaying it on the console.

```sql
SELECT DISTINCT(sov0name) FROM populatedplaces INTO TABLE country;

ALTER TABLE country ADD COLUMN id SERIAL;
```

The second statement is to create ids for each country, which will be used for foreign keys.

Then, for cities.

```sql
SELECT p.name, c.id AS country, p.latitude AS lat, p.longitude AS lon
INTO TABLE city FROM populatedplaces p LEFT JOIN country c ON p.sov0name = c.name ORDER BY c.id;

ALTER TABLE city ADD COLUMN id SERIAL;
ALTER TABLE city ADD CONSTRAINT key FOREIGN KEY (country) REFERENCES country (id) MATCH FULL;
```

It is useful to have these tables saved elsewhere in a short form, to be able to be shared. This was done with the \'\\copy\' command, described in the 'Important commands and tools' section above. This was repeated for each data item that was gathered.

In my case, the id column was out of order, so I added 'ORDER BY c.id' to the end of my select statement.

It is also useful to save a SQL file to easily import these into a new
database. A file named \'data.sql\' was created, and had these commands
added to it:

```sql
\\copy Country(id, Name) FROM \'data/country.csv\' DELIMITER \',\' CSV HEADER;
\\copy City(id, name, lat, lon, Country) FROM \'data/city.csv\' DELIMITER \',\' CSV HEADER;
```

## Beaches

The goal for this table was to find the cities that are close to the beach. To do this, coastline data was downloaded from the same Natural Earth website, and the highest resolution (10m) vector data was downloaded, called \"Coastlines.\" What defines close to the beach, for our purposes? We decided that within 40 miles from city center to coastline would be reasonable for now, until we have more user feedback. For reference, 40 miles is about 64,000 meters, which is what will be used in the ST\_DWithin() PostGIS function.

In order to accomplish this goal, a temporary table was created, in order to have fast access to PostGIS GEOMETRIES, rather than having to convert from Latitudes and Longitudes in the main function. The main function took over an hour to run on my machine, so time savings was beneficial.

```sql
SELECT id, ST\_SetSRID(ST\_MakePoint(lon, lat), 4326) INTO TEMP TABLE
citygeom FROM city;

ALTER TABLE citygeom RENAME COLUMN
st\_setsrid TO geom;
```

I altered the name of the column to geom so that it would be easier to type and remember.

Coastline data was entered into the database using the .sql file created by the shp2pgsql command line executable. I then altered the table to make sure that the SRIDs were the same for both geometries. The ST\_DWithin() PostGIS function actually needs the vector data as geographies to caculate distances in meters, so they were convereted using two colons like: table.geom::geography

```sql
ALTER TABLE coastline ALTER COLUMN geom TYPE geometry(MULTILINESTRING,
4326) USING ST\_SetSRID(geom,4326)
 
SELECT DISTINCT(cg.id), COALESCE(ST\_DWithin(cl.geom::geography,
cg.geom::geography, 64000), false) INTO TABLE beaches FROM coastline cl
RIGHT JOIN citygeom cg ON ST\_DWithin(cl.geom::geography,
cg.geom::geography, 64000); 

```

## Elevation

Elevation was obtained from the public dataset GTOPO30, downloaded from [Earth Explorer](https://earthexplorer.usgs.gov/). You are required to make an account, download both java, and a bulk download application, and then place an order, though the information is public and free. This data was slected over newer, more accurate information, because of the size of the download. Uncompressed, this elevation raster data was 1.5 GB, which was less than 10% of the size of the newer GTOPO2010 data. This raster data was imported into postgis with the raster2pgsql function. Using the same city geometries table as before, I was able to get elevation data for each of those points. Perhaps someone can share with me a faster way, as this query took 8 hours to compute on my machine!

```sql
SELECT c.id, ST\_Value(e.rast, c.geom) AS elevation INTO TABLE elevationdata FROM citygeom c LEFT JOIN elevationRaster e ON ST\_Contains(ST\_Envelope(e.rast), c.geom);
```

## Climate

Climate data is gathered from WorldClim.org. There is monthly data, gathered from 1960-1990. 

>Citation: 
>Hijmans, R.J., S.E. Cameron, J.L. Parra, P.G. Jones and A. Jarvis, 2005. Very high resolution interpolated climate surfaces for global land areas. International Journal of Climatology 25: 1965-1978. 

I found UV information at https://neo.sci.gsfc.nasa.gov/view.php?datasetId=AURA_UVI_CLIM_M 

This raster data was included in PostGIS with the raster2pgsql program.
Each image (and there are 12, one for each month) got it's own row in the table, identified by the filename that it came from.

Something nearly identical was done for temperature, precipitation, and UV index.

Temperature data is stored in degrees C, multiplied by 10 (So that there can be one decimal place of accuracy, while using integer data types, to save physical data space).
Precipitation is in millimeters.
UV is between an index of 0 - 16, multiplied by 16 (again, so that it can be stored as an integer, but have a higher degree of accuracy.)

Raster to postgres demonstration:
```
raster2pgsql -s 4326 -I -C -M *.tiff public.uvrasters > uv.sql
psql -U postgres -f uv.sql
```

Getting each city's uv index for each month, each month having it's own temporary table:
```sql
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table januv from city c, uvrasters u where u.filename = 'JANUARY.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table febuv from city c, uvrasters u where u.filename = 'FEB.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table maruv from city c, uvrasters u where u.filename = 'MARCH.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table apruv from city c, uvrasters u where u.filename = 'APRIL.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table mayuv from city c, uvrasters u where u.filename = 'MAY.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table junuv from city c, uvrasters u where u.filename = 'JUNE.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table juluv from city c, uvrasters u where u.filename = 'JULY.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table auguv from city c, uvrasters u where u.filename = 'AUGUST.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table sepuv from city c, uvrasters u where u.filename = 'SEPTEMBER.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table octuv from city c, uvrasters u where u.filename = 'OCTOBER.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table novuv from city c, uvrasters u where u.filename = 'NOVEMBER.TIFF';
SELECT c.id, ST_Value(u.rast, ST_SetSRID(ST_Point(c.lon, c.lat), 4326)) as uvidx into temp table decuv from city c, uvrasters u where u.filename = 'DECEMBER.TIFF';
```

Combining the information from each month into a single table for UV index:
```sql
SELECT x.id, x.jan, x.feb, x.mar, x.apr, x.may, x.june, x.july, x.aug, x.sept, x.oct, x.nov, x.dec INTO TABLE uvindex FROM (
SELECT j.id, j.uvidx AS jan, f.uvidx AS feb, m.uvidx AS mar, a.uvidx AS apr, ma.uvidx AS may, ju.uvidx AS june, jul.uvidx AS july, au.uvidx AS aug, s.uvidx AS sept, o.uvidx AS oct, n.uvidx AS nov, d.uvidx AS dec
FROM januv AS j 
INNER JOIN febuv as f ON j.id = f.id
INNER JOIN maruv as m ON j.id = m.id
INNER JOIN apruv as a ON j.id = a.id
INNER JOIN maruv as ma ON j.id = ma.id
INNER JOIN junuv as ju ON j.id = ju.id
INNER JOIN juluv as jul ON j.id = jul.id
INNER JOIN auguv as au ON j.id = au.id
INNER JOIN sepuv as s ON j.id = s.id
INNER JOIN octuv as o ON j.id = o.id
INNER JOIN novuv as n ON j.id = n.id
INNER JOIN decuv as d ON j.id = d.id
) as x ORDER BY x.id;

```

Copying this data to a csv file for sharing with teammates:
```sql
\copy (SELECT * FROM uvindex) to 'C:\Users\...\database\uv.csv' with csv
```

## Air Pollution

Air pollution data was obtained from The World Health Organization <a href="https://www.who.int" class="uri">website</a>, which include PM25 (small particle matter) and PM10 (large particle matter) data.  We combined these values to use in our overall air pollution levels.

Since there was a possibility of different spellings of cities or smaller cities that did not have readings, we used the air pollution latitute and longitude points to find the closest reading with 100 miles.

This was done by comparing the geometric points created from latitude and longitude using PostGIS.  To create the points and place them into a TEMP table, we used:

```sql
SELECT id, ST\_SetSRID(ST\_MakePoint(lon, lat), 4326) INTO TEMP TABLE
citygeom FROM city;
SELECT id, ST\_SetSRID(ST\_MakePoint(lon, lat), 4326) INTO TEMP TABLE
air-poll-temp FROM air-poll;
```

Then used this query to select the nearest reading within a 100 mile range:

```sql
SELECT id, ST\_SetSRID(ST\_MakePoint(lon, lat), 4326) INTO TEMP TABLE citygeom FROM city;
SELECT DISTINCT(cg.id), COALESCE(ST\_DWithin(ap.geom:geography, cg.geom::geography, 161000), false)
INTO TABLE air-pollution FROM air-poll-temp ap
RIGHT JOIN citygeom cg ON ST\_DWithin(ap.geom::geography, cg.geom::geography, 161000);
```

## Airports

Airport data was found from the website [Our Airports](http://ourairports.com/data/).

This data was etnered into the database similar to the Air Pollution data, using the PostGIS geometric points and comparing distance between, this time using only a 50 mile range.

## International Airports

This list was scraped from Wikipedia using python and the google geocoding api...

From the list of aiport names and lat, lon values, we selected all cities within 20 miles of an international airport with the postgis query:

```
SELECT DISTINCT(c.id), COALESCE(ST_DWithin(ST_MakePoint(c.lon, c.lat)::geography, ST_MakePoint(i.lon, i.lat)::geography, 32186), false) as exists INTO TABLE intlairports FROM city c LEFT JOIN original_intl_airports_table ON COALESCE(ST_DWithin(ST_MakePoint(c.lon, c.lat)::geography, ST_MakePoint(i.lon, i.lat)::geography, 32186), false);

```

Using the \\copy command this information was saved in a csv file.

## Internet Speeds

Raw internet speed data was retrieved from a [spreadsheet file](https://s3-eu-west-1.amazonaws.com/assets.cable.co.uk/broadband-speedtest/worldwide-broadband-speed-league-2018.xlsx) provided by a private [broadband company](https://www.cable.co.uk/broadband/speed/worldwide-speed-league/) (Cable). The source of data is from [M-lab](https://www.measurementlab.net/), a coalition of reasearch institutes involved with internet statitics:

> The data was collected for the second year in a row across the 12 months up to 29 May this year by M-Lab, a partnership between New America's Open Technology Institute, Google Open Source Research, Princeton University's PlanetLab and other supporting partners, and compiled by Cable

After copying the raw values from the above spreadsheet value into a CSV file (internet_speed.csv), the data was inserted into the database with the following command:

```sql
-- Internet Speed
\copy Internet_Speed(Country, Speed) FROM 'data/internet_speed.csv' DELIMITER ',' CSV HEADER;
```

This data was only found at the country level. It was merged with our countries, on the country name. There ended up being some countries that were not in one database or the other, such as Somaliland, or Aruba. Some of these, we just left as NULL values. There were other countries that we had data for, but the names weren't listed exactly the same, such as "United States" and "United States of America." For these, there ended up only being a handful, and they were easy to identify. This was done using

```sql
SELECT country.name FROM country WHERE country.name NOT IN (SELECT country FROM internet_speed);
```

Crafting a statement like this for both databases (ie, finding the countries in the country table that were not in the internet table, and finding the countries that were in the internet table that were not in the country table) gave us two lists we could compare by hand, and just copy the extra missing information into our final table.

## Purchasing Power Parity

We wanted to measure Cost of Living, or at least how expensive visiting a place would be. There is a lot of data for this, and we only gave ourselves a few days to figure it out. In order to get something that we could use, we decided to go with purchasing power parity, data which is provided by the [World Bank](https://data.worldbank.org/indicator/PA.NUS.PPPC.RF?end=2017&start=2017&view=map). This is how many US dollars you would need to spend to get $1 worth of goods in another country. In the USA, obviously this would be $1. For other countries, you may need less money, or more. Most of the missing locations were either not normal travel desitinations, such as Antarctica, or were places of extreme poverty, but the missing data did require us to make some assumptions in our ranking algorithm. This data was copied into our database by matching country names to the countries that we had. Some names did not match up, and so we could use SQL queries like:

```sql
select c.name from country where c.name not in (select name from purchasingpowerparity);
```

These queries could help identify if we had country names that should be changed, or if this dataset had country names that should be changed. It helped us identify some issues with our own database we have been building. Most of this was easy to fix with an open source speadsheet program.

## Safety

Other sites provide information about whether countries or cities can be considered 'safe' or 'safe for women' more specifically. There are many many ways that this could be measured, but within the timeframe that we were given, we decided it would be best to start with homicide data. The [UN](https://dataunodc.un.org/crime/intentional-homicide-victims-by-sex) provides a dataset by country that lists total homicides per 100,000 people, and the same but by sex. Using a spreadsheet, we opened this data, and took the most recent data for each country. For countries where there was no data, in our ranking function we assume the worst.

## Poverty

Measuring poverty is best left to the experts, so we go our data from the [UN](http://hdr.undp.org/en/composite/MPI), which determines various factors for poverty, and provides the percentage of people living in each country who those factors apply to. If enough factors apply, they are considered in 'Extreme Poverty' which is what we used. We compared the country names to those that we had, and created a table which included the country id, and the percentage of those living in extreme poverty. If there was no data for country, we looked on Wikipedia for more information, and either assumed no poverty, or max poverty, depending on the situation.

## Coconut Trees

This data was more difficult to find, as there was no free dataset that we could find that provided it. Instead, we used wikipedia, and what we already had!
According to [Wikipedia](https://en.wikipedia.org/wiki/Arecaceae) Coconut trees only naturally grow on the coastlines, and if they exist elsewhere, humans must have carried them. The require temperatures to stay within a certain range year round to survive, and only grow within a certain latitude range. Thankfully, we have all of that data already! We search for cities that were within the latitude range, the min temperature never was below 12C, and on the coast, and made our set of cities that way. It looks pretty close to other maps we could find.

## References

Cities: <https://www.naturalearthdata.com/downloads/10m-cultural-vectors/>, Populated Places dataset

Countries: <https://www.naturalearthdata.com/downloads/10m-cultural-vectors/>, Populated Places dataset
 
Population: <https://www.naturalearthdata.com/downloads/10m-cultural-vectors/>, Populated Places dataset

Elevation: <https://earthexplorer.usgs.gov/>, GTOPO30 Dataset, all tiles

Beaches: <https://www.naturalearthdata.com/downloads/10m-physical-vectors/>, Coastline Vectors

Temperature: <https://www.worldclim.org/version1>, Current Conditions, Average Temperature, 5 minutes

Precipitation: <https://www.worldclim.org/version1>, Current Conditions, Average Precipitation, 5 minutes

UV index: <https://neo.sci.gsfc.nasa.gov/view.php?datasetId=AURA_UVI_CLIM_M>

Air Pollution: <https://www.who.int/airpollution/data/cities/en/>, Ambient air pollution dataset

Airports: <http://ourairports.com/data/>, Airport dataset

International airports: <https://en.wikipedia.org/wiki/List_of_international_airports_by_country>

Internet: <https://www.cable.co.uk/broadband/speed/worldwide-speed-league/>, [data file](https://s3-eu-west-1.amazonaws.com/assets.cable.co.uk/broadband-speedtest/worldwide-broadband-speed-league-2018.xlsx)

Purchasing Power Parity: <https://data.worldbank.org/indicator/PA.NUS.PPPC.RF?end=2017&start=2017&view=map>

Severe poverty index: <http://hdr.undp.org/en/composite/MPI>

Palm Trees: <https://en.wikipedia.org/wiki/Arecaceae>

Homicides: <https://dataunodc.un.org/crime/intentional-homicide-victims-by-sex>