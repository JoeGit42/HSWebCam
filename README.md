# KSHerkulesWebCam
Zeigt das aktuellste Bild der Webcam der Hessenschau
https://www.hessenschau.de/wetter/wetterkameras/wetterkamera-kassel-herkules-100.html


### Features
- Bilder vor Sonnenaufgang und nach Sonnuntergang ("zivile Dämmerung") werden nicht angezeigt, da die nicht gut aussehen
- Ein Klick auf das Widget führt zur Webseite der WebCam

![](KSHerkulesWebCamSmall.jpg) 
![](KSHerkulesWebCamMedium.jpg)

### Konfiguration
Das Widget benötigt keine Konfiguration

### Tipps
Sollen die (hässlichen) Nachtbilder auch angezeigt werden, so kann im Code die Variable onlyDaylightPics = false gesetzt werden.


### Known Bugs
- Bewusste Abweichung: Die herangezogene "zivile Dämmerung" entspricht nicht den Sonnenuntergangs- und Sonnenaufgangszeiten, die in der Wetter-App vom iPhone angezeigt werden. 

### ChangeLog
- 2020-12-26 initial version
