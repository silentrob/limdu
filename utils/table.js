var AsciiTable = require('ascii-table');
var _ = require("underscore");

var mapRow = function(heading, row) {
  var d = new Array(heading.length);
  for (var i = 0; i < heading.length; i++) {
    var pos = Object.keys(row).indexOf(heading[i]);
    if (pos !== -1) {
      d[i] = row[heading[i]];
    }
  }
  return d;
}

exports.drawBasicTable = function(data, title) {
  var table = new AsciiTable(title || '');
  var h;
  var heading = Object.keys(data);
  heading.unshift("");
  table.setHeading(heading);

  for (var x in data ) {
    h = Object.keys(data[x]);
  }
  for (var i = 0; i < h.length; i++) {
    var row = _.pluck(data, h[i]);
    row.unshift(h[i])
    table.addRow(row);
  }    

  return table.toString();
}

exports.drawTable = function(confusion, title) {
  var table = new AsciiTable(title || 'Confusion Matrix');

  var headings = [''];
  var matrix = [];
  for (var x in confusion ) {
    headings.push(x);  
  }

  table.setHeading(headings);

  var i = 1;
  for (var x in confusion) {
    var row = mapRow(headings, confusion[x])
    row[0] = headings[i]
    table.addRow(row);
    i++;
  }

  return table.toString();
}
