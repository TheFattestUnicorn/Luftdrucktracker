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

# Inbetriebnahme
Als erste Voraussetzung müssen diverse Package aus der standard repository installiert werden:
'apt install yarn node git'

Das projekt muss in dern Ordner /opt/ gecloned werden
'git clone [git url] /opt/'

Im geclonten Ornder "Luftdrucktracker" muss man nun die javascript dependencies der API installieren:
cd /opt/Luftdrucktracker/API
yarn install

Nun kann der Server manuell gestartet werden, um zu sehen ob alles funktioniert:
node server.js


Das File luftdrucktracker.service muss aus dem system_files Ordner nach /etc/systemd/system/ kopiert werden und per systemctl enabled/gestartet werden:
'systemctl enable luftdrucktracker.service'
'systemctl start luftdrucktracker.service'

Nun kann mit der URL und Port 3000 auf die oben aufgeführten endpoints zugegriffen werden.

# Vorgabe:
Die Projektarbeit umfasst die Implementierung einer Webapplikation mit Server auf dem Raspberry Pi und Client im Webbrowser. Vorausgesetzt werden folgende Punkte:

    Serverseitige Applikation (Unterordner server)
    Clientseitige Applikation (Unterordner client)
    Abgabge via public Git Repository
    Dokumentation des Projekts als Markdown README.md mit mindestens einem Screenshot des Clients und einem äquivalenten Umfang von maximal 2 Seiten A4. Die Dokumentation umfasst:
        Abstract in maximal 3 Sätzen.
        Allgemeine Funktionsweise der Applikation (Diagramm erwünscht)
        kurze Beschreibung aller serverseitigen API Endpoints
        Beschreibung des Source Codes und Funktionsweise des Clients
        Hardwareanbindung ist nicht zwingend erforderlich

Neben der Dokumentation wir als separater Teil im README.md erwartet, dass erklärt wird, wie die Applikation in Betrieb genommen werden kann.

Qualitätsmerkmale der Dokumentation und des Source Codes fliessen in die Bewertung mitein.
