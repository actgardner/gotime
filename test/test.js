var test = require('unit.js');
var gotime = require('../gotime.js')

var ANSIC       = "Mon Jan _2 15:04:05 2006"
var UnixDate    = "Mon Jan _2 15:04:05 MST 2006"
var RubyDate    = "Mon Jan 02 15:04:05 -0700 2006"
var RFC822      = "02 Jan 06 15:04 MST"
var RFC822Z     = "02 Jan 06 15:04 -0700" // RFC822 with numeric zone
var RFC850      = "Monday, 02-Jan-06 15:04:05 MST"
var RFC1123     = "Mon, 02 Jan 2006 15:04:05 MST"
var RFC1123Z    = "Mon, 02 Jan 2006 15:04:05 -0700" // RFC1123 with numeric zone
var RFC3339     = "2006-01-02T15:04:05Z07:00"
var RFC3339Nano = "2006-01-02T15:04:05.999999999Z07:00"
var Kitchen     = "3:04PM"

// Handy time stamps.
var Stamp      = "Jan _2 15:04:05"
var StampMilli = "Jan _2 15:04:05.000"
var StampMicro = "Jan _2 15:04:05.000000"
var StampNano  = "Jan _2 15:04:05.000000000"

var parseTests = [
        ["ANSIC", ANSIC, "Thu Feb  4 21:00:57 2010", false, true, 1, 0],
        ["UnixDate", UnixDate, "Thu Feb  4 21:00:57 PST 2010", true, true, 1, 0],
        ["RubyDate", RubyDate, "Thu Feb 04 21:00:57 -0800 2010", true, true, 1, 0],
        ["RFC850", RFC850, "Thursday, 04-Feb-10 21:00:57 PST", true, true, 1, 0],
        ["RFC1123", RFC1123, "Thu, 04 Feb 2010 21:00:57 PST", true, true, 1, 0],
        // Don't do timezone mapping 
        //["RFC1123", RFC1123, "Thu, 04 Feb 2010 22:00:57 PDT", true, true, 1, 0],
        ["RFC1123Z", RFC1123Z, "Thu, 04 Feb 2010 21:00:57 -0800", true, true, 1, 0],
        ["RFC3339", RFC3339, "2010-02-04T21:00:57-08:00", true, false, 1, 0],
        ["custom: \"2006-01-02 15:04:05-07\"", "2006-01-02 15:04:05-07", "2010-02-04 21:00:57-08", true, false, 1, 0],
        // Optional fractional seconds.
        ["ANSIC", ANSIC, "Thu Feb  4 21:00:57.0 2010", false, true, 1, 1],
        ["UnixDate", UnixDate, "Thu Feb  4 21:00:57.01 PST 2010", true, true, 1, 2],
        ["RubyDate", RubyDate, "Thu Feb 04 21:00:57.012 -0800 2010", true, true, 1, 3],
        ["RFC850", RFC850, "Thursday, 04-Feb-10 21:00:57.0123 PST", true, true, 1, 4],
        ["RFC1123", RFC1123, "Thu, 04 Feb 2010 21:00:57.01234 PST", true, true, 1, 5],
        ["RFC1123Z", RFC1123Z, "Thu, 04 Feb 2010 21:00:57.01234 -0800", true, true, 1, 5],
        ["RFC3339", RFC3339, "2010-02-04T21:00:57.012345678-08:00", true, false, 1, 9],
        ["custom: \"2006-01-02 15:04:05\"", "2006-01-02 15:04:05", "2010-02-04 21:00:57.0", false, false, 1, 0],
        // Amount of white space should not matter.
        ["ANSIC", ANSIC, "Thu Feb 4 21:00:57 2010", false, true, 1, 0],
        ["ANSIC", ANSIC, "Thu      Feb     4     21:00:57     2010", false, true, 1, 0],
        // Case should not matter
        ["ANSIC", ANSIC, "THU FEB 4 21:00:57 2010", false, true, 1, 0],
        ["ANSIC", ANSIC, "thu feb 4 21:00:57 2010", false, true, 1, 0],
        // Fractional seconds.
        ["millisecond", "Mon Jan _2 15:04:05.000 2006", "Thu Feb  4 21:00:57.012 2010", false, true, 1, 3],
        ["microsecond", "Mon Jan _2 15:04:05.000000 2006", "Thu Feb  4 21:00:57.012345 2010", false, true, 1, 6],
        ["nanosecond", "Mon Jan _2 15:04:05.000000000 2006", "Thu Feb  4 21:00:57.012345678 2010", false, true, 1, 9],
        // Leading zeros in other places should not be taken as fractional seconds.
        ["zero1", "2006.01.02.15.04.05.0", "2010.02.04.21.00.57.0", false, false, 1, 1],
        ["zero2", "2006.01.02.15.04.05.00", "2010.02.04.21.00.57.01", false, false, 1, 2],
        // Month and day names only match when not followed by a lower-case letter.
        ["Janet", "Hi Janet, the Month is January: Jan _2 15:04:05 2006", "Hi Janet, the Month is February: Feb  4 21:00:57 2010", false, false, 1, 0],
// GMT with offset.
        ["GMT-8", UnixDate, "Thu Feb  4 21:00:57 GMT-8 2010", true, true, 1, 0],

        // Accept any number of fractional second digits (including none) for .999...
        // In Go 1, .999... was completely ignored in the format, meaning the first two
        // cases would succeed, but the next four would not. Go 1.1 accepts all six.
        ["", "2006-01-02 15:04:05.9999 -0700 MST", "2010-02-04 21:00:57 -0800 PST", true, false, 1, 0],
        ["", "2006-01-02 15:04:05.999999999 -0700 MST", "2010-02-04 21:00:57 -0800 PST", true, false, 1, 0],
        ["", "2006-01-02 15:04:05.9999 -0700 MST", "2010-02-04 21:00:57.0123 -0800 PST", true, false, 1, 4],
        ["", "2006-01-02 15:04:05.999999999 -0700 MST", "2010-02-04 21:00:57.0123 -0800 PST", true, false, 1, 4],
        ["", "2006-01-02 15:04:05.9999 -0700 MST", "2010-02-04 21:00:57.012345678 -0800 PST", true, false, 1, 9],
        ["", "2006-01-02 15:04:05.999999999 -0700 MST", "2010-02-04 21:00:57.012345678 -0800 PST", true, false, 1, 9],

        // issue 4502.
        ["StampNano", StampNano, "Feb  4 21:00:57.012345678", false, false, -1, 9],
        ["", "Jan _2 15:04:05.999", "Feb  4 21:00:57.012300000", false, false, -1, 4],
        ["", "Jan _2 15:04:05.999", "Feb  4 21:00:57.012345678", false, false, -1, 9],
        ["", "Jan _2 15:04:05.999999999", "Feb  4 21:00:57.0123", false, false, -1, 4],
        ["", "Jan _2 15:04:05.999999999", "Feb  4 21:00:57.012345678", false, false, -1, 9],
]

describe("Time Format", function() {
  it("Parses time formats", function() {
    for (var i=0; i < parseTests.length; i++) {
      tokens = gotime.tokenizeFormat(parseTests[i][1]);
      parseTime = gotime.parseTimeString(parseTests[i][2], tokens);
      if (parseTests[i][5] != -1) {
        test.number(parseTime["Year"]).is(2010);
      }
      if (parseTests[i][4]) {
        test.string(parseTime["WeekDay"]).is("Thu");
      }
      test.number(parseTime["Month"]).is(2); 
      test.number(parseTime["Day"]).is(4); 
      test.number(parseTime["Hour"]).is(21); 
      test.number(parseTime["Minutes"]).is(0); 
      test.number(parseTime["Seconds"]).is(57);
      var numFracSecs = parseTests[i][6]; 
      var fracSecs = 0;
      if (numFracSecs > 0) {
        fracSecs = parseInt("012345678".slice(0, numFracSecs));
        fracSecs = fracSecs * Math.pow(10, 8-numFracSecs);
      }
      test.number(parseTime["Nanos"]).is(fracSecs);
    }
  }); 
}); 
