angular.module('ui.bootstrap.dateparser', [])

.service('dateParser', ['$locale', 'orderByFilter', function($locale, orderByFilter) {
  // Pulled from https://github.com/mbostock/d3/blob/master/src/format/requote.js
  var SPECIAL_CHARACTERS_REGEXP = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

  this.parsers = {};

  var formatCodeToRegex = {
    'yyyy': {
      regex: '\\d{4}',
      apply: function (value) {
          this.year.use++;
          this.year.value = +value;
      }
    },
    'yy': {
      regex: '\\d{2}',
      apply: function (value) {
          this.year.use++;
          this.year.value = +value + 2000;
      }
    },
    'y': {
      regex: '\\d{1,4}',
      apply: function (value) {
          this.year.use++;
          this.year.value = +value;
      }
    },
    'MMMM': {
      regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
      apply: function (value) {
          this.month.use++;
          this.month.value = $locale.DATETIME_FORMATS.MONTH.indexOf(value);
      }
    },
    'MMM': {
      regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
      apply: function (value) {
          this.month.use++;
          this.month.value = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value);
      }
    },
    'MM': {
      regex: '0[1-9]|1[0-2]',
      apply: function (value) {
          this.month.use++;
          this.month.value = value - 1;
      }
    },
    'M': {
      regex: '[1-9]|1[0-2]',
      apply: function (value) {
          this.month.use++;
          this.month.value = value - 1;
      }
    },
    'dd': {
      regex: '[0-2][0-9]{1}|3[0-1]{1}',
      apply: function (value) {
          this.date.use++;
          this.date.value = +value;
      }
    },
    'd': {
      regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
      apply: function (value) {
          this.date.use++;
          this.date.value = +value;
      }
    },
    'EEEE': {
      regex: $locale.DATETIME_FORMATS.DAY.join('|')
    },
    'EEE': {
      regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|')
    },
    'HH': {
      regex: '(?:0|1)[0-9]|2[0-3]',
      apply: function(value) { this.hours = +value; }
    },
    'H': {
      regex: '1?[0-9]|2[0-3]',
      apply: function(value) { this.hours = +value; }
    },
    'mm': {
      regex: '[0-5][0-9]',
      apply: function(value) { this.minutes = +value; }
    },
    'm': {
      regex: '[0-9]|[1-5][0-9]',
      apply: function(value) { this.minutes = +value; }
    },
    'sss': {
      regex: '[0-9][0-9][0-9]',
      apply: function(value) { this.milliseconds = +value; }
    },
    'ss': {
      regex: '[0-5][0-9]',
      apply: function(value) { this.seconds = +value; }
    },
    's': {
      regex: '[0-9]|[1-5][0-9]',
      apply: function(value) { this.seconds = +value; }
    }
  };

  function createParser(format) {
    var map = [], regex = format.split('');

    angular.forEach(formatCodeToRegex, function(data, code) {
      var index = format.indexOf(code);

      if (index > -1) {
        format = format.split('');

        regex[index] = '(' + data.regex + ')';
        format[index] = '$'; // Custom symbol to define consumed part of format
        for (var i = index + 1, n = index + code.length; i < n; i++) {
          regex[i] = '';
          format[i] = '$';
        }
        format = format.join('');

        map.push({ index: index, apply: data.apply });
      }
    });



    return {
      regex: new RegExp('^' + regex.join('') + '$'),
      map: orderByFilter(map, 'index')
    };
  }

  this.parse = function(input, format) {
    if ( !angular.isString(input) || !format ) {
      return input;
    }

    format = $locale.DATETIME_FORMATS[format] || format;
    format = format.replace(SPECIAL_CHARACTERS_REGEXP, '\\$&');

    if (!this.parsers[format]) {
        this.parsers[format] = createParser(format);
    }

    var parser = this.parsers[format],
        regex = parser.regex,
        map = parser.map,
        results = input.match(regex);

    if ( results && results.length ) {
        var fields = {
          year: {use: 0, value: 1900},
          month: {use: 0, value: 0},
          date: {use: 0, value: 1},
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0
    }, dt;

      for( var i = 1, n = results.length; i < n; i++ ) {
        var mapper = map[i-1];
        if ( mapper.apply ) {
          mapper.apply.call(fields, results[i]);
        }
      }

      if ( isValid(fields.year, fields.month, fields.date) ) {
        dt = new Date(fields.year.value, fields.month.value, fields.date.value, fields.hours, fields.minutes, fields.seconds, fields.milliseconds);
      }

      return dt;
    }
  };

  // Check if date is valid for specific month (and year for February).
  // Month: 0 = Jan, 1 = Feb, etc
  function isValid(year, month, date) {
    if (year.use > 1||month.use > 1||date.use > 1||date.value < 1) {
      return false;
    }

    if ( month.value === 1 && date.value > 28) {
        return date.value === 29 && ((year.value % 4 === 0 && year.value % 100 !== 0) || year.value % 400 === 0);
    }

    if (month.value === 3 || month.value === 5 || month.value === 8 || month.value === 10) {
        return date.value < 31;
    }

    return true;
  }
}]);
