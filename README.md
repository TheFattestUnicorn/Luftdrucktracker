# Luftdrucktracker
Über ein BMP280 Sensor, welcher an einem Raspberry PI angeschlossen ist, werden Luftdruckdaten, jede Stunde, in eine sqlite Datenbank gespeichert.
Sie werden dann auf einer Webpage grafisch ausgegeben.
Falls nun eine Migräne stattfindet, kann am jeweiligen Tag, eine Notitz und eine Intensität eingetragen werden.
Diese Daten werden bei einem Neuladen dre Seite wieder vom Server/ der API wieder abgerufen und angezeigt.
Falls an einem Tag ein Migräneeintrag erstellt wird, wird je nach intensität, das vorkommen farbig hervorgehoben.

## Endpoints
`/api/pressure/history` \

GET:
Returned alle Barometrischen Daten aus der sqlite3 Datenbank die gesammelt wurden.

`/api/migraine` \

GET:
Returned alle Daten, wann eine Migräne aufgetreten ist, mit der Notitz und der Intensität

POST:
Postet ein neues "Migräneereignis" mit Notitz und intensität.