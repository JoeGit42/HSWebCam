// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: gopuram;


//////////////////////////////////////////////////////////////////////////////////////////////
// Description of this widget
// ⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺
// Shows newest webcam picture from Hessenschau (ugly night-pictures are not shown)
// 
//
// Installation/Configuration
// ⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺
// 
// ToDo / Ideas
// ⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺
// 
//////////////////////////////////////////////////////////////////////////////////////////////

const webCamURL      = "https://www.hessenschau.de/wetter/wetterkameras/wetterkamera-kassel-herkules-100.html"
const lastImgFile    = "herkulesKSWebCam.jpg"
const lastTimeFile   = "herkulesKSWebCam.time"
const onlyDaylightPics = true
const maxErrLength   = 90
const latKS          = 51.2878
const lonKS          = 9.4706
  var imgList = [ ["", ""] ];
  var lastImg

//////////////////////////////////////////////////////////////////////////////////////////////
// DEBUG-CONFIG - DON'T TOUCH THIS
//////////////////////////////////////////////////////////////////////////////////////////////
//
const DEBUG = false
  let debugRow
  let debugText
//
//////////////////////////////////////////////////////////////////////////////////////////////

sortImgListDesc = function(elm1, elm2) {
  let d1 = new Date (elm1[0])
  let d2 = new Date (elm2[0])

  if (d1 < d2){
    return 1;
  } else if (d1 > d2) {
    return -1;
  } else return 0;
}

let widget = await createWidget()
if (!config.runsInWidget) await widget.presentMedium()
Script.setWidget(widget)
Script.complete()

async function createWidget(items) {
    let webPage = ""
  const list = new ListWidget()
  const today = new Date()
    let yesterday = new Date()
    yesterday.setTime(today.getTime() - 24*60*60*1000) 
    var startCivilTwilight = {val: 0};
    var endCivilTwilight   = {val: 0};
    var rise   = new Object();
    var riseYesterday = new Object();
	  var sunset = new Object();
	  var sunsetYesterday = new Object();
    let dfTime = dfCreateAndInit("HH:mm")
    let timeStr = ""
    let img
    let i
    let picDate
    let fm = FileManager.local()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, lastTimeFile)
    
  list.setPadding(0,14,2,14)
  list.url = webCamURL

  // DEBUG init
  if (DEBUG) {
    debugRow = list.addStack()
    debugText = debugRow.addText("DEBUG")
    debugText.font = Font.mediumSystemFont(6)
  }
  // DEBUG_END

  // fetch website
  webPage = await loadWebPage(webCamURL);
  
  if (webPage.length <= maxErrLength) {
    list.addText("⚠︎ Hessenschau")
    list.addText("     nicht")
    list.addText("     erreichbar!")
    list.addText(webPage)  // it's an error message 
    return list
  }

  // get sunrise and sunset info from today ...
  civil_twilight(today.getFullYear(), today.getMonth()+1, today.getDate(), lonKS, latKS, startCivilTwilight, endCivilTwilight)
  rise = rechne_zeit_um(startCivilTwilight.val - differenz_zur_UTC(today));
	let riseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), rise.h, rise.m, rise.s)
	
  sunset = rechne_zeit_um(endCivilTwilight.val - differenz_zur_UTC(today));
  let sunsetDate = new Date(new Date(today.getFullYear(), today.getMonth(), today.getDate(), sunset.h, sunset.m, sunset.s))

  // ... and yesterday
  civil_twilight(yesterday.getFullYear(), yesterday.getMonth()+1, yesterday.getDate(), lonKS, latKS, startCivilTwilight, endCivilTwilight)
  riseYesterday = rechne_zeit_um(startCivilTwilight.val - differenz_zur_UTC(yesterday));
	let riseDateYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), riseYesterday.h, riseYesterday.m, riseYesterday.s)
	
  sunsetYesterday = rechne_zeit_um(endCivilTwilight.val - differenz_zur_UTC(yesterday));
  let sunsetDateYesterday = new Date(new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), sunsetYesterday.h, sunsetYesterday.m, sunsetYesterday.s))

  // fill list with img-links
  getImgURL(webPage);

  // get info from last shown img
  //await fm.remove(path) // to check behavior after installation
  lastImg = JSON.parse(await fm.readString(path))
  

  // get URL of last available image within daylight
  if (onlyDaylightPics == true) {
    // check if there's a daylight img available
    for (i=0; i<imgList.length; i++) {
      picDate = new Date(imgList[i][0])
      if ( (picDate > riseDate          && picDate < sunsetDate         ) ||
           (picDate > riseDateYesterday && picDate < sunsetDateYesterday)  ) {
        // found pic-info in list
        if (lastImg != null) {
          // image from cache
          if (imgList[i][1] == lastImg.url) {
            img = await loadWebImage("")  // image from cache
          }
          // image from web as cached image is outdated
          else {
            img = await loadWebImage(imgList[i][1])
            lastImg.timeStr = picDate.toJSON()
            lastImg.url = imgList[i][1]
            await fm.writeString(path, JSON.stringify(lastImg))
          }
        } 
        // image from web as there's no last image (might be after 1st run)
        else {
          img = await loadWebImage(imgList[i][1])
          lastImg = JSON.parse ('{ "widget":"KSHerkulesWebCam" }')  // initial creation of file structure
          lastImg.timeStr = picDate.toJSON()
          lastImg.url = imgList[i][1]
          await fm.writeString(path, JSON.stringify(lastImg))
        }
        timeStr = dfTime.string(picDate)
        break;
      }
    }
    // no img found, get the local file (last valid img)
    if (i == imgList.length) {
      img = await loadWebImage("")
      timeStr = dfTime.string(new Date(lastImg.timeStr))    
    }
  } 
  // get the latest img
  else {
    img = await loadWebImage(imgList[0][1])
    timeStr = dfTime.string(new Date(imgList[0][0]))
  }

  list.backgroundImage = img
  
  let footer = list.addStack()  
  footer.bottomAlignContent()
  footer.addSpacer()
  footer.layoutVertically()
  let inner_footer = footer.addStack()
  
  let title_txt = inner_footer.addText("Herkules - " + timeStr)  
  title_txt.textColor = Color.white()  
  title_txt.font = Font.mediumMonospacedSystemFont(12)
//   title_txt.shadowRadius = 1
//   title_txt.shadowColor = Color.black()
  inner_footer.addSpacer()  
  if ( config.widgetFamily == 'small') { inner_footer = footer.addStack() }  // 2 rows in small widget

  printSFSymbol(inner_footer, "sunrise", 12)
  title_txt = inner_footer.addText(" " + dfTime.string(riseDate) + "  " )  
  title_txt.textColor = Color.white()  
  title_txt.font = Font.mediumMonospacedSystemFont(12)
//   title_txt.shadowRadius = 1
//   title_txt.shadowColor = Color.black()


  printSFSymbol(inner_footer, "sunset", 12)
  title_txt = inner_footer.addText(" " + dfTime.string(sunsetDate))  
  title_txt.textColor = Color.white()  
  title_txt.font = Font.mediumMonospacedSystemFont(12)
//   title_txt.shadowRadius = 1
//   title_txt.shadowColor = Color.black()
  
  return list
}

// creates and inits a DateFormatter
function dfCreateAndInit (format) {
  const df = new DateFormatter()
  df.dateFormat = format
  return df
}

async function loadWebImage(imgUrl) {
  let req = new Request(imgUrl)
  let img
  let fm = FileManager.local()
  let dir = fm.documentsDirectory()
  let path = fm.joinPath(dir, lastImgFile)
  
  // url not valid or already downloaded –> get the image from file
  if ( imgUrl.length < 5 ) {
    if (fm.fileExists(path)) { 
      img = await fm.readImage(path)
    }
  } else {  
    img = await req.loadImage()
    await fm.writeImage(path, img)
  }
  
  return img
}

async function loadWebPage(strURL) {
  let return_data = ""
  let errorStr = ""

  try {
    const req = new Request(strURL);
    return_data = await req.loadString();
  } catch (err) {
    errorStr = err.toString() 
    return errorStr.substring(0, maxErrLength-1)  // shortened, so calling function can decide, if it is an errorMsg or the full webpage 
  }
  
  return return_data
}

function printSFSymbol(stack, symbolStr, width) {
  let mobileIcon
  let mobileIconElement
  mobileIcon = SFSymbol.named(symbolStr);
  mobileIconElement = stack.addImage(mobileIcon.image)
  mobileIconElement.imageSize = new Size(width, width)
  mobileIconElement.tintColor =  Color.white()
}


function getImgURL(page) {
  let webpagePart = page
  let urlPart = ""
  let searchString = ""
  let timestampDate
  let posID  = -1
  let hour   = -1
  let minute = -1
  let found_pic = false
  let picNo = 0
  let i
  let today = new Date()

  // delete list
  for (i=0; i<imgList.length; i++) {
    imgList.pop()
  }    


  // put all webcam-pics in the list
  do {
    // goto next image
    searchString = "data-hr-time="
    posID = webpagePart.indexOf(searchString)
    if (posID > 0) {
      webpagePart = webpagePart.substring(posID + searchString.length)
      picNo++
      found_pic = true
    } else {
      found_pic = false
    }
    
    // get timestamp 
    hour   = getNumber(webpagePart, 1)
    minute = getNumber(webpagePart, 2)
	  timestampDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute, 0, picNo) // picNo to sort 2 pics with same timestamps
	  if (timestampDate > today) { 
	    timestampDate.setTime(timestampDate.getTime() - 24*60*60*1000) 
	  }  // found pic from last day
	  
	  // get URL
    // goto the start of ImURL
    searchString = "data-srcset=\""
    posID = webpagePart.indexOf(searchString)
    if (posID > 0 && found_pic == true) {
      urlPart = webpagePart.substring(posID + searchString.length)
    } else {
      found_pic = false
    } 
  
    // cut at the end of 
    searchString = ".jpg"
    posID = urlPart.indexOf(searchString)
    if (posID > 0 && found_pic == true) {
      urlPart = urlPart.substring(0, posID + searchString.length)
      urlPart = urlPart.trim()
    } else {
      found_pic = false
    }
   
    // add to array
    if (found_pic) {
      imgList.push( [timestampDate.toString(), urlPart] )
    }
	  
  } while (found_pic == true)

  // only store the last 20 pictures to make sure not having pictures from the day before yesterday
  do {
    imgList.shift()
  } while (imgList.length > 20)

  // sort by descanding date
  imgList = imgList.sort(sortImgListDesc)
  
  return picNo
}

function getNumber (string, index) {
  var regex = /(\d+)/g;
  var result = (string.match(regex));
  if (index <= result.length)
  return result[index-1]; 
}




/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
// Der ganze nachfolgende Spass wird nur zur Ermittlung der 
// Sonneuntergangs- und Sonnenaufgangszeit genutzt
// gefunden auf dieser Seite: http://www.konarski-wuppertal.de/andreaskw/Javascript.html
/////////////////////////////////////////////////////////////////////////////////////////////

/*
 * SUNRISET.C - computes Sun rise/set times, start/end of twilight, and
 * the length of the day at any date and latitude
 *
 * Written as DAYLEN.C, 1989-08-16
 * Modified to SUNRISET.C, 1992-12-01
 *
 * (c) Paul Schlyter, 1989, 1992
 *
 * Released to the public domain by Paul Schlyter, December 1992
 *
 * Die aktuelle version habe ich auf folgender Seite gefunden:
 *
 * http://www.risacher.org/sunwait/
 *
 * Converted to Javascript by Andreas Konarski
 * programmieren@konarski-wuppertal.de
 */

function TMOD(x) {
	return x < 0 ? x + 24 : (x >= 24 ? x - 24 : x);
};

function DAYSOFF(x) {
	return x < 0 ? -1 : (x >= 24 ? 1 : 0);
};

function HOURS(h) {
	return abschneiden(Math.floor(h));
};

function MINUTES(h) {
	return abschneiden(60 * (h - abschneiden(Math.floor(h))));
};

function ABS(x) {
	return x < 0 ? -x : x;
};

/* A macro to compute the number of days elapsed since 2000 Jan 0.0 */
/* (which is equal to 1999 Dec 31, 0h UT)                           */
/* Dan R sez: This is some pretty fucking high magic.               */
function days_since_2000_Jan_0(y, m, d) {
	return abschneiden(abschneiden(367 * y) - abschneiden((7 * (y + abschneiden((m + 9) / 12))) / 4) + abschneiden((275 * m) / 9) + d - 730530);
};

/* Some conversion factors between radians and degrees */
function PI() {
	return 3.1415926535897932384;
};

function RADEG() {
	return 180.0 / PI();
};

function DEGRAD() {
	return PI() / 180.0;
};

/* The trigonometric functions in degrees */
function sind(x) {
	return Math.sin(x * DEGRAD());
}

function cosd(x) {
	return Math.cos(x * DEGRAD());
};

function tand(x) {
	return Math.tan(x * DEGRAD());
};

function atand(x) {
	return RADEG() * Math.atan(x);
};

function asind(x) {
	return RADEG() * Math.asin(x);
};

function acosd(x) {
	return RADEG() * Math.acos(x);
};

function atan2d(y, x) {
	return RADEG() * Math.atan2(y, x);
};

/* Following are some macros around the "workhorse" function __daylen__ */
/* They mainly fill in the desired values for the reference altitude    */
/* below the horizon, and also selects whether this altitude should     */
/* refer to the Sun's center or its upper limb.                         */

/* This macro computes the length of the day, from sunrise to sunset. */
/* Sunrise/set is considered to occur when the Sun's upper limb is    */
/* 50 arc minutes below the horizon (this accounts for the refraction */
/* of the Earth's atmosphere).                                        */
/* The original version of the program used the value of 35 arc mins, */
/* which is the accepted value in Sweden.                           */
function day_length(year, month, day, lon, lat) {
	return __daylen__(year, month, day, lon, lat, -35.0 / 60.0, 1);
};

/* This macro computes the length of the day, including civil twilight. */
/* Civil twilight starts/ends when the Sun's center is 6 degrees below  */
/* the horizon.                                                         */
function day_civil_twilight_length(year, month, day, lon, lat) {
	return __daylen__(year, month, day, lon, lat, -6.0, 0);
};

/* This macro computes the length of the day, incl. nautical twilight.  */
/* Nautical twilight starts/ends when the Sun's center is 12 degrees    */
/* below the horizon.                                                   */
function day_nautical_twilight_length(year, month, day, lon, lat) {
	return __daylen__(year, month, day, lon, lat, -12.0, 0);
};

/* This macro computes the length of the day, incl. astronomical twilight. */
/* Astronomical twilight starts/ends when the Sun's center is 18 degrees   */
/* below the horizon.                                                      */
function day_astronomical_twilight_length(year, month, day, lon, lat) {
	return __daylen__(year, month, day, lon, lat, -18.0, 0);
};

/* This macro computes times for sunrise/sunset.                      */
/* Sunrise/set is considered to occur when the Sun's upper limb is    */
/* 35 arc minutes below the horizon (this accounts for the refraction */
/* of the Earth's atmosphere).                                        */
function sun_rise_set(year, month, day, lon, lat, rise, set) {
	return __sunriset__(year, month, day, lon, lat, -35.0 / 60.0, 1, rise, set);
};

/* This macro computes the start and end times of civil twilight.       */
/* Civil twilight starts/ends when the Sun's center is 6 degrees below  */
/* the horizon.                                                         */
function civil_twilight(year, month, day, lon, lat, start, end) {
	return __sunriset__(year, month, day, lon, lat, -6.0, 0, start, end);
};

/* This macro computes the start and end times of nautical twilight.    */
/* Nautical twilight starts/ends when the Sun's center is 12 degrees    */
/* below the horizon.                                                   */
function nautical_twilight(year, month, day, lon, lat, start, end) {
	return __sunriset__(year, month, day, lon, lat, -12.0, 0, start, end);
};

/* This macro computes the start and end times of astronomical twilight.   */
/* Astronomical twilight starts/ends when the Sun's center is 18 degrees   */
/* below the horizon.                                                      */
function astronomical_twilight(year, month, day, lon, lat, start, end) {
	return __sunriset__(year, month, day, lon, lat, -18.0, 0, start, end);
};

/* The "workhorse" function for sun rise/set times */
function __sunriset__(year, month, day, lon, lat, altit, upper_limb, trise, tset)
/***************************************************************************/
/* Note: year,month,date = calendar date, 1801-2099 only.             */
/*       Eastern longitude positive, Western longitude negative       */
/*       Northern latitude positive, Southern latitude negative       */
/*       The longitude value IS critical in this function!            */
/*       altit = the altitude which the Sun should cross              */
/*               Set to -35/60 degrees for rise/set, -6 degrees       */
/*               for civil, -12 degrees for nautical and -18          */
/*               degrees for astronomical twilight.                   */
/*         upper_limb: non-zero -> upper limb, zero -> center         */
/*               Set to non-zero (e.g. 1) when computing rise/set     */
/*               times, and to zero when computing start/end of       */
/*               twilight.                                            */
/*        *rise = where to store the rise time                        */
/*        *set  = where to store the set  time                        */
/*                Both times are relative to the specified altitude,  */
/*                and thus this function can be used to comupte       */
/*                various twilight times, as well as rise/set times   */
/* Return value:  0 = sun rises/sets this day, times stored at        */
/*                    *trise and *tset.                               */
/*               +1 = sun above the specified "horizon" 24 hours.     */
/*                    *trise set to time when the sun is at south,    */
/*                    minus 12 hours while *tset is set to the south  */
/*                    time plus 12 hours. "Day" length = 24 hours     */
/*               -1 = sun is below the specified "horizon" 24 hours   */
/*                    "Day" length = 0 hours, *trise and *tset are    */
/*                    both set to the time when the sun is at south.  */
/*                                                                    */
/**********************************************************************/
{
	var d = 0, /* Days since 2000 Jan 0.0 (negative before) */

	sradius = 0, /* Sun's apparent radius */
	t = 0, /* Diurnal arc */
	tsouth = 0, /* Time when Sun is at south */
	sidtime = 0;
	/* Local sidereal time */
	var sr = new Object();
	/* Solar distance, astronomical units */
	var sdec = new Object();
	/* Sun's declination */
	var sRA = new Object();
	/* Sun's Right Ascension */
	sRA.val = 0;
	sr.val = 0;
	sdec.val = 0;

	var rc = 0;
	/* Return cde from function - usually 0 */

	/* Compute d of 12h local mean solar time */
	d = days_since_2000_Jan_0(year, month, day) + 0.5 - lon / 360.0;

	/* Compute local sideral time of this moment */
	sidtime = revolution(GMST0(d) + 180.0 + lon);

	/* Compute Sun's RA + Decl at this moment */
	sun_RA_dec(d, sRA, sdec, sr);

	/* Compute time when Sun is at south - in hours UT */
	tsouth = 12.0 - rev180(sidtime - sRA.val) / 15.0;

	/* Compute the Sun's apparent radius, degrees */
	sradius = 0.2666 / sr.val;

	/* Do correction to upper limb, if necessary */
	if (upper_limb != 0)
		altit -= sradius;

	/* Compute the diurnal arc that the Sun traverses to reach */
	/* the specified altitide altit: */
	{
		var cost;
		cost = (sind(altit) - sind(lat) * sind(sdec.val)) / (cosd(lat) * cosd(sdec.val));

		if (cost >= 1.0) {
			rc = -1;
			t = 0.0;
			/* Sun always below altit */
		} else if (cost <= -1.0) {
			rc = +1;
			t = 12.0;
			/* Sun always above altit */
		} else
			t = acosd(cost) / 15.0;
		/* The diurnal arc, hours */
	}

	/* Store rise and set times - in hours UT */
	trise.val = tsouth - t;
	tset.val = tsouth + t;

	return rc;
}/* __sunriset__ */

/* The "workhorse" function */
function __daylen__(year, month, day, lon, lat, altit, upper_limb)
/**********************************************************************/
/* Note: year,month,date = calendar date, 1801-2099 only.             */
/*       Eastern longitude positive, Western longitude negative       */
/*       Northern latitude positive, Southern latitude negative       */
/*       The longitude value is not critical. Set it to the correct   */
/*       longitude if you're picky, otherwise set to to, say, 0.0     */
/*       The latitude however IS critical - be sure to get it correct */
/*       altit = the altitude which the Sun should cross              */
/*               Set to -35/60 degrees for rise/set, -6 degrees       */
/*               for civil, -12 degrees for nautical and -18          */
/*               degrees for astronomical twilight.                   */
/*         upper_limb: non-zero -> upper limb, zero -> center         */
/*               Set to non-zero (e.g. 1) when computing day length   */
/*               and to zero when computing day+twilight length.      */
/**********************************************************************/
{
	var d = 0, /* Days since 2000 Jan 0.0 (negative before) */
	obl_ecl = 0, /* Obliquity (inclination) of Earth's axis */
	sin_sdecl = 0, /* Sine of Sun's declination */
	cos_sdecl = 0, /* Cosine of Sun's declination */
	sradius = 0, /* Sun's apparent radius */
	t = 0;
	/* Diurnal arc */

	/* Solar distance, astronomical units */
	var sr = new Object;

	/* True solar longitude */
	var slon = new Object;

	sr.val = 0;
	slon.val = 0;

	/* Compute d of 12h local mean solar time */
	d = days_since_2000_Jan_0(year, month, day) + 0.5 - lon / 360.0;

	/* Compute obliquity of ecliptic (inclination of Earth's axis) */
	obl_ecl = 23.4393 - 3.563E-7 * d;

	/* Compute Sun's position */
	sunpos(d, slon, sr);

	/* Compute sine and cosine of Sun's declination */
	sin_sdecl = sind(obl_ecl) * sind(slon.val);
	cos_sdecl = Math.sqrt(1.0 - sin_sdecl * sin_sdecl);

	/* Compute the Sun's apparent radius, degrees */
	sradius = 0.2666 / sr.val;

	/* Do correction to upper limb, if necessary */
	if (upper_limb != 0)
		altit -= sradius;

	/* Compute the diurnal arc that the Sun traverses to reach */
	/* the specified altitide altit: */
	{
		var cost;
		cost = (sind(altit) - sind(lat) * sin_sdecl) / (cosd(lat) * cos_sdecl);
		if (cost >= 1.0)
			t = 0.0;
		/* Sun always below altit */
		else if (cost <= -1.0)
			t = 24.0;
		/* Sun always above altit */
		else
			t = (2.0 / 15.0) * acosd(cost);
		/* The diurnal arc, hours */
	}
	return t;
}/* __daylen__ */

/* This function computes the Sun's position at any instant */
function sunpos(d, lon, r)
/******************************************************/
/* Computes the Sun's ecliptic longitude and distance */
/* at an instant given in d, number of days since     */
/* 2000 Jan 0.0.  The Sun's ecliptic latitude is not  */
/* computed, since it's always very near 0.           */
/******************************************************/
{
	var M = 0, /* Mean anomaly of the Sun */
	w = 0, /* Mean longitude of perihelion */
	/* Note: Sun's mean longitude = M + w */
	e = 0, /* Eccentricity of Earth's orbit */
	E = 0, /* Eccentric anomaly */
	x = 0, y = 0, /* x, y coordinates in orbit */
	v = 0;
	/* True anomaly */

	/* Compute mean elements */
	M = revolution(356.0470 + 0.9856002585 * d);
	w = 282.9404 + 4.70935E-5 * d;
	e = 0.016709 - 1.151E-9 * d;

	/* Compute true longitude and radius vector */
	E = M + e * RADEG() * sind(M) * (1.0 + e * cosd(M));
	x = cosd(E) - e;
	y = Math.sqrt(1.0 - e * e) * sind(E);
	r.val = Math.sqrt(x * x + y * y);

	/* Solar distance */
	v = atan2d(y, x);
	/* True anomaly */
	lon.val = v + w;
	/* True solar longitude */
	if (lon.val >= 360.0)
		lon.val -= 360.0;
	/* Make it 0..360 degrees */
}

function sun_RA_dec(d, RA, dec, r) {
	var obl_ecl = 0;
	var xs, ys, zs = 0;
	var xe, ye, ze;
	var lon = new Object();

	lon.val = 0;

	/* Compute Sun's ecliptical coordinates */
	sunpos(d, lon, r);

	/* Compute ecliptic rectangular coordinates */
	xs = r.val * cosd(lon.val);
	ys = r.val * sind(lon.val);
	zs = 0;

	/* because the Sun is always in the ecliptic plane! */

	/* Compute obliquity of ecliptic (inclination of Earth's axis) */
	obl_ecl = 23.4393 - 3.563E-7 * d;

	/* Convert to equatorial rectangular coordinates - x is unchanged */
	xe = xs;
	ye = ys * cosd(obl_ecl);
	ze = ys * sind(obl_ecl);

	/* Convert to spherical coordinates */
	RA.val = atan2d(ye, xe);
	dec.val = atan2d(ze, Math.sqrt(xe * xe + ye * ye));
}/* sun_RA_dec */

/******************************************************************/
/* This function reduces any angle to within the first revolution */
/* by subtracting or adding even multiples of 360.0 until the     */
/* result is >= 0.0 and < 360.0                                   */
/******************************************************************/
function INV360() {
	return 1.0 / 360.0;
}

function revolution(x)
/*****************************************/
/* Reduce angle to within 0..360 degrees */
/*****************************************/
{
	return (x - 360.0 * Math.floor(x * INV360()));
}/* revolution */

function rev180(x)
/*********************************************/
/* Reduce angle to within -180..+180 degrees */
/*********************************************/
{
	return (x - 360.0 * Math.floor(x * INV360() + 0.5));
}/* revolution */

/*******************************************************************/
/* This function computes GMST0, the Greenwhich Mean Sidereal Time */
/* at 0h UT (i.e. the sidereal time at the Greenwhich meridian at  */
/* 0h UT).  GMST is then the sidereal time at Greenwich at any     */
/* time of the day.  I've generelized GMST0 as well, and define it */
/* as:  GMST0 = GMST - UT  --  this allows GMST0 to be computed at */
/* other times than 0h UT as well.  While this sounds somewhat     */
/* contradictory, it is very practical:  instead of computing      */
/* GMST like:                                                      */
/*                                                                 */
/*  GMST = (GMST0) + UT * (366.2422/365.2422)                      */
/*                                                                 */
/* where (GMST0) is the GMST last time UT was 0 hours, one simply  */
/* computes:                                                       */
/*                                                                 */
/*  GMST = GMST0 + UT                                              */
/*                                                                 */
/* where GMST0 is the GMST "at 0h UT" but at the current moment!   */
/* Defined in this way, GMST0 will increase with about 4 min a     */
/* day.  It also happens that GMST0 (in degrees, 1 hr = 15 degr)   */
/* is equal to the Sun's mean longitude plus/minus 180 degrees!    */
/* (if we neglect aberration, which amounts to 20 seconds of arc   */
/* or 1.33 seconds of time)                                        */
/*                                                                 */
/*******************************************************************/

function GMST0(d) {
	var sidtim0;
	/* Sidtime at 0h UT = L (Sun's mean longitude) + 180.0 degr  */
	/* L = M + w, as defined in sunpos().  Since I'm too lazy to */
	/* add these numbers, I'll let the C compiler do it for me.  */
	/* Any decent C compiler will add the constants at compile   */
	/* time, imposing no runtime or code overhead.               */
	sidtim0 = revolution((180.0 + 356.0470 + 282.9404) + (0.9856002585 + 4.70935E-5) * d);
	return sidtim0;
}/* GMST0 */

function kulmination_sonne(jahr, monat, tag, laenge) {
	// code taken from sunriseset ;-), with little modifications.

	var d = 0, /* Days since 2000 Jan 0.0 (negative before) */
	tsouth = 0, /* Time when Sun is at south */
	sidtime = 0;

	var sr = new Object;
	/* Solar distance, astronomical units */
	var sRA = new Object;
	/* Sun's Right Ascension */
	var sdec = new Object;
	/* Sun's declination */

	sr.val = 0;
	sRA.val = 0;
	sdec.val = 0;

	/* Local sidereal time */

	/* Compute d of 12h local mean solar time */
	d = days_since_2000_Jan_0(jahr, monat, tag) + 0.5 - laenge / 360.0;

	/* Compute local sideral time of this moment */
	sidtime = revolution(GMST0(d) + 180.0 + laenge);

	/* Compute Sun's RA + Decl at this moment */
	sun_RA_dec(d, sRA, sdec, sr);

	/* Compute time when Sun is at south - in hours UT */
	tsouth = 12.0 - rev180(sidtime - sRA.val) / 15.0;

	return tsouth;
}

function berechne_sonnenkoordinaten(jahr, monat, tag, stunde, minute, sekunde, rect, dect, dist) {
	// code taken from sunriseset ;-), with little modifications.

	var d;
	/* Days since 2000 Jan 0.0 (negative before) */

	// berechne d fuer 0 uhr mittlere lokale sonnen zeit
	d = days_since_2000_Jan_0(jahr, monat, tag);

	// die uhrzeit berechnen
	var zusatzsekunden = (stunde * 3600) + (minute * 60) + sekunde;
	d += (zusatzsekunden / 86400);

	/* Compute Sun's RA + Decl at this moment */
	sun_RA_dec(d, rect, dect, dist);
}

function berechne_mittlere_rektaszension(jahr, monat, tag, stunde, minute, sekunde) {
	// code taken from sunriseset ;-), with little modifications.

	var d, M, w;
	/* Days since 2000 Jan 0.0 (negative before) */
	var erg;

	// berechne d fuer 0 uhr mittlere lokale sonnen zeit
	d = days_since_2000_Jan_0(jahr, monat, tag);

	// die uhrzeit berechnen
	var zusatzsekunden = (stunde * 3600) + (minute * 60) + sekunde;
	d += (zusatzsekunden / 86400);

	/* Compute mean elements */
	M = revolution(356.0470 + 0.9856002585 * d);
	w = 282.9404 + 4.70935E-5 * d;

	// die mittlere rektaszension berechnen
	erg = M + w;

	return erg;
}

function berechne_ekliptikale_sonnenposition(jahr, monat, tag, stunde, minute, sekunde) {
	// code taken from sunriseset ;-), with little modifications.

	var d;
	/* Days since 2000 Jan 0.0 (negative before) */

	// berechne d fuer 0 uhr mittlere lokale sonnen zeit
	d = days_since_2000_Jan_0(jahr, monat, tag);

	// die uhrzeit berechnen
	var zusatzsekunden = (stunde * 3600) + (minute * 60) + sekunde;
	d += (zusatzsekunden / 86400);

	var M, /* Mean anomaly of the Sun */
	w, /* Mean longitude of perihelion */
	/* Note: Sun's mean longitude = M + w */
	e, /* Eccentricity of Earth's orbit */
	E, /* Eccentric anomaly */
	x, y, /* x, y coordinates in orbit */
	v;
	/* True anomaly */

	var r, lon;

	/* Compute mean elements */
	M = revolution(356.0470 + 0.9856002585 * d);
	w = 282.9404 + 4.70935E-5 * d;
	e = 0.016709 - 1.151E-9 * d;

	/* Compute true longitude and radius vector */
	E = M + e * RADEG() * sind(M) * (1.0 + e * cosd(M));
	x = cosd(E) - e;
	y = Math.sqrt(1.0 - e * e) * sind(E);
	r = Math.sqrt(x * x + y * y);
	/* Solar distance */
	v = atan2d(y, x);
	/* True anomaly */
	lon = v + w;
	/* True solar longitude */
	if (lon >= 360.0)
		lon -= 360.0;
	/* Make it 0..360 degrees */

	return lon;
}

function abschneiden(wert) {
	var erg;

	if (wert < 0) {
		erg = Math.ceil(wert);
	} else if (wert > 0) {
		erg = Math.floor(wert);
	} else {
		erg = Math.floor(wert);
	}

	return erg;
}

function rechne_zeit_um(wert) {
	var erg = new Object();

	if (wert != null) {
		// wert muss zwischen 0 und 24 liegen
		if (wert < 0)
			wert = 24 + wert;
		else if (wert > 24)
			wert = wert - 24;

		var stunde_aufgang = abschneiden(wert);
		var minuten_aufgang = abschneiden((wert - stunde_aufgang) * 60.0);
		var sekunden_aufgang = abschneiden((((wert - stunde_aufgang) * 60.0) - minuten_aufgang) * 60.0);

		erg.h = stunde_aufgang;
		erg.m = minuten_aufgang;
		erg.s = sekunden_aufgang;
	}

	return erg;
}

function rechne_zeit_um2(wert) {
	var erg = new Object();

	if (wert != null) {
		// wert muss zwischen 0 und 24 liegen
		if (wert < 0)
			wert = 24 + wert;
		else if (wert > 24)
			wert = wert - 24;

		var stunde_aufgang = abschneiden(wert);
		var minuten_aufgang = abschneiden((wert - stunde_aufgang) * 60.0);
		var sekunden_aufgang = abschneiden((((wert - stunde_aufgang) * 60.0) - minuten_aufgang) * 60.0);

		erg.h = stunde_aufgang;
		erg.m = minuten_aufgang;
		erg.s = sekunden_aufgang + 1;
	}

	return erg;
}

function differenz_zur_UTC(wert) {
	return wert.getTimezoneOffset() / 60.0;
}

function berechne(zeitpunkt, laenge, breite) {
	var erg = new Object();
	erg.tag_24h = false;
	erg.tag_0h = false;
	erg.tag_normal = false;
	erg.zivile_daemmerung_24h = false;
	erg.zivile_daemmerung_0h = false;
	erg.zivile_daemmerung_normal = false;
	erg.nautische_daemmerung_24h = false;
	erg.nautische_daemmerung_0h = false;
	erg.nautische_daemmerung_normal = false;
	erg.astronomische_daemmerung_24h = false;
	erg.astronomische_daemmerung_0h = false;
	erg.astronomische_daemmerung_normal = false;

	var rise = new Object();
	var set = new Object();

	// Sonnenaufgang und Sonnenuntergang Beginn
	var rueck_tag = sun_rise_set(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite, rise, set);

	// Normaler Tag
	if (rueck_tag == 0) {
		var aufgang = rechne_zeit_um(rise.val - differenz_zur_UTC(zeitpunkt));
		erg.aufgang = zweistellig(aufgang.h) + ':' + zweistellig(aufgang.m) + ':' + zweistellig(aufgang.s);

		var untergang = rechne_zeit_um(set.val - differenz_zur_UTC(zeitpunkt));
		erg.untergang = zweistellig(untergang.h) + ':' + zweistellig(untergang.m) + ':' + zweistellig(untergang.s);
	}

	// 100% Tag, 0% Tag
	else if (rueck_tag == 1 || rueck_tag == -1) {
		erg.aufgang = '--:--:--';
		erg.untergang = '--:--:--';
	}

	if (rueck_tag == 1) {
		erg.tag_24h = true;
		erg.tag_0h = false;
		erg.tag_normal = false;
	} else if (rueck_tag == -1) {
		erg.tag_24h = false;
		erg.tag_0h = true;
		erg.tag_normal = false;
	} else if (rueck_tag == 0) {
		erg.tag_24h = false;
		erg.tag_0h = false;
		erg.tag_normal = true;
	}
	// Sonnenaufgang und Sonnenuntergang Ende

	// Kulmination Beginn
	var kulmination_wert = kulmination_sonne(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite);

	var Kulmination = rechne_zeit_um(kulmination_wert - differenz_zur_UTC(zeitpunkt));
	erg.Kulmination = zweistellig(Kulmination.h) + ':' + zweistellig(Kulmination.m) + ':' + zweistellig(Kulmination.s);
	// Kulmination Ende

	// Zivile Dämmerung Beginn
	var rueck_zivil = civil_twilight(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite, rise, set);

	// Normal
	if (rueck_zivil == 0) {
		var ZivileDaemmerungBeginn = rechne_zeit_um(rise.val - differenz_zur_UTC(zeitpunkt));
		erg.ZivileDaemmerungBeginn = zweistellig(ZivileDaemmerungBeginn.h) + ':' + zweistellig(ZivileDaemmerungBeginn.m) + ':' + zweistellig(ZivileDaemmerungBeginn.s);

		var ZivileDaemmerungEnde = rechne_zeit_um(set.val - differenz_zur_UTC(zeitpunkt));
		erg.ZivileDaemmerungEnde = zweistellig(ZivileDaemmerungEnde.h) + ':' + zweistellig(ZivileDaemmerungEnde.m) + ':' + zweistellig(ZivileDaemmerungEnde.s);
	}

	// 100%, 0%
	else if (rueck_zivil == 1 || rueck_zivil == -1) {
		erg.ZivileDaemmerungBeginn = '--:--:--';
		erg.ZivileDaemmerungEnde = '--:--:--';
	}

	if (rueck_zivil == -1) {
		erg.zivile_daemmerung_24h = true;
		erg.zivile_daemmerung_0h = false;
		erg.zivile_daemmerung_normal = false;
	} else if (rueck_zivil == 1) {
		erg.zivile_daemmerung_24h = false;
		erg.zivile_daemmerung_0h = true;
		erg.zivile_daemmerung_normal = false;
	} else if (rueck_zivil == 0) {
		erg.zivile_daemmerung_24h = false;
		erg.zivile_daemmerung_0h = false;
		erg.zivile_daemmerung_normal = true;
	}
	// Zivile Dämmerung Ende

	// Nautische Dämmerung Beginn
	var rueck_nautische = nautical_twilight(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite, rise, set);

	// Normal
	if (rueck_nautische == 0) {
		var NautischeDaemmerungBeginn = rechne_zeit_um(rise.val - differenz_zur_UTC(zeitpunkt));
		erg.NautischeDaemmerungBeginn = zweistellig(NautischeDaemmerungBeginn.h) + ':' + zweistellig(NautischeDaemmerungBeginn.m) + ':' + zweistellig(NautischeDaemmerungBeginn.s);

		var NautischeDaemmerungEnde = rechne_zeit_um(set.val - differenz_zur_UTC(zeitpunkt));
		erg.NautischeDaemmerungEnde = zweistellig(NautischeDaemmerungEnde.h) + ':' + zweistellig(NautischeDaemmerungEnde.m) + ':' + zweistellig(NautischeDaemmerungEnde.s);
	}

	// 100%, 0%
	else if (rueck_nautische == 1 || rueck_nautische == -1) {
		erg.NautischeDaemmerungBeginn = '--:--:--';
		erg.NautischeDaemmerungEnde = '--:--:--';
	}

	if (rueck_nautische == -1) {
		erg.nautische_daemmerung_24h = true;
		erg.nautische_daemmerung_0h = false;
		erg.nautische_daemmerung_normal = false;
	} else if (rueck_nautische == 1) {
		erg.nautische_daemmerung_24h = false;
		erg.nautische_daemmerung_0h = true;
		erg.nautische_daemmerung_normal = false;
	} else if (rueck_nautische == 0) {
		erg.nautische_daemmerung_24h = false;
		erg.nautische_daemmerung_0h = false;
		erg.nautische_daemmerung_normal = true;
	}
	// Nautische Dämmerung Ende

	// Astronomische Dämmerung Beginn
	var rueck_astronomische = astronomical_twilight(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite, rise, set);

	// Normal
	if (rueck_astronomische == 0) {
		var AstronomischeDaemmerungBeginn = rechne_zeit_um(rise.val - differenz_zur_UTC(zeitpunkt));
		erg.AstronomischeDaemmerungBeginn = zweistellig(AstronomischeDaemmerungBeginn.h) + ':' + zweistellig(AstronomischeDaemmerungBeginn.m) + ':' + zweistellig(AstronomischeDaemmerungBeginn.s);

		var AstronomischeDaemmerungEnde = rechne_zeit_um(set.val - differenz_zur_UTC(zeitpunkt));
		erg.AstronomischeDaemmerungEnde = zweistellig(AstronomischeDaemmerungEnde.h) + ':' + zweistellig(AstronomischeDaemmerungEnde.m) + ':' + zweistellig(AstronomischeDaemmerungEnde.s);
	}

	// 100%, 0%
	else if (rueck_astronomische == 1 || rueck_astronomische == -1) {
		erg.AstronomischeDaemmerungBeginn = '--:--:--';
		erg.AstronomischeDaemmerungEnde = '--:--:--';
	}

	if (rueck_astronomische == -1) {
		erg.astronomische_daemmerung_24h = true;
		erg.astronomische_daemmerung_0h = false;
		erg.astronomische_daemmerung_normal = false;
	} else if (rueck_astronomische == 1) {
		erg.astronomische_daemmerung_24h = false;
		erg.astronomische_daemmerung_0h = true;
		erg.astronomische_daemmerung_normal = false;
	} else if (rueck_astronomische == 0) {
		erg.astronomische_daemmerung_24h = false;
		erg.astronomische_daemmerung_0h = false;
		erg.astronomische_daemmerung_normal = true;
	}
	// Astronomische Dämmerung Ende

	// Dauer Tag / Nacht Beginn
	// Normal
	if (rueck_tag == 0) {
		var dauer_tag = day_length(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite);

		var DauerTag = rechne_zeit_um(dauer_tag);
		erg.DauerTag = zweistellig(DauerTag.h) + ':' + zweistellig(DauerTag.m) + ':' + zweistellig(DauerTag.s);

		var DauerNacht = rechne_zeit_um2(24.0 - dauer_tag);
		erg.DauerNacht = zweistellig(DauerNacht.h) + ':' + zweistellig(DauerNacht.m) + ':' + zweistellig(DauerNacht.s);
	}

	// 100%, 0%
	else if (rueck_tag == 1 || rueck_tag == -1) {
		erg.DauerTag = '--:--:--';
		erg.DauerNacht = '--:--:--';
	}
	// Dauer Tag / Nacht Ende

	// Dauer Zivile Dämmerung Beginn
	// Normal
	if (rueck_zivil == 0) {
		var dauer_zivile_hell = day_civil_twilight_length(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite);

		var DauerZivilHell = rechne_zeit_um(dauer_zivile_hell);
		erg.DauerZivilHell = zweistellig(DauerZivilHell.h) + ':' + zweistellig(DauerZivilHell.m) + ':' + zweistellig(DauerZivilHell.s);

		var DauerZivilDunkel = rechne_zeit_um2(24.0 - dauer_zivile_hell);
		erg.DauerZivilDunkel = zweistellig(DauerZivilDunkel.h) + ':' + zweistellig(DauerZivilDunkel.m) + ':' + zweistellig(DauerZivilDunkel.s);
	}

	// 100%, 0%
	else if (rueck_zivil == 1 || rueck_zivil == -1) {
		erg.DauerZivilHell = '--:--:--';
		erg.DauerZivilDunkel = '--:--:--';
	}
	// Dauer Zivile Dämmerung Ende

	// Dauer Nautische Dämmerung Beginn
	// Normal
	if (rueck_nautische == 0) {
		var dauer_nautische_hell = day_nautical_twilight_length(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite);

		var DauerNautischHell = rechne_zeit_um(dauer_nautische_hell);
		erg.DauerNautischHell = zweistellig(DauerNautischHell.h) + ':' + zweistellig(DauerNautischHell.m) + ':' + zweistellig(DauerNautischHell.s);

		var DauerNautischDunkel = rechne_zeit_um2(24.0 - dauer_nautische_hell);
		erg.DauerNautischDunkel = zweistellig(DauerNautischDunkel.h) + ':' + zweistellig(DauerNautischDunkel.m) + ':' + zweistellig(DauerNautischDunkel.s);
	}

	// 100%, 0%
	else if (rueck_nautische == 1 || rueck_nautische == -1) {
		erg.DauerNautischHell = '--:--:--';
		erg.DauerNautischDunkel = '--:--:--';
	}
	// Dauer Nautische Dämmerung Ende

	// Dauer Astronomische Dämmerung Beginn
	// Normal
	if (rueck_astronomische == 0) {
		var dauer_astronomische_hell = day_astronomical_twilight_length(zeitpunkt.getUTCFullYear(), zeitpunkt.getUTCMonth() + 1, zeitpunkt.getUTCDate(), laenge, breite);

		var DauerAstronomischHell = rechne_zeit_um(dauer_astronomische_hell);
		erg.DauerAstronomischHell = zweistellig(DauerAstronomischHell.h) + ':' + zweistellig(DauerAstronomischHell.m) + ':' + zweistellig(DauerAstronomischHell.s);

		var DauerAstronomischDunkel = rechne_zeit_um2(24.0 - dauer_astronomische_hell);
		erg.DauerAstronomischDunkel = zweistellig(DauerAstronomischDunkel.h) + ':' + zweistellig(DauerAstronomischDunkel.m) + ':' + zweistellig(DauerAstronomischDunkel.s);
	}

	// 100%, 0%
	else if (rueck_astronomische == 1 || rueck_astronomische == -1) {
		erg.DauerAstronomischHell = '--:--:--';
		erg.DauerAstronomischDunkel = '--:--:--';
	}
	// Dauer Astronomische Dämmerung Ende

	return erg;
}

function zweistellig(wert) {
	while (wert.toString().length < 2)
	wert = '0' + wert;

	return wert;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////



// EOF
//
