(function( $ ) {
  $.getDataFromGoogleSpreadsheet = function( options ) {

  	var DEBUG = true;
  	function consoleOut(args) {
		if (DEBUG === true) {
  			console.log(args);
  		}
  	};

  	// Setup default settings
 	var config = $.extend( {
 		key: '0AkT7EMSlHl5hdDVvRTFaQV9vS1U1eW1NTTRyT1hja0E',
 		sheet: 'od5',
		colsToGet: 'A:D',
		rowProcessor: defaultRowProcessor,
		success: defaultCallback
    }, options);

	// Get data from Google Spreadsheet
	$.ajax({
	  url: 'http://spreadsheets.google.com/feeds/cells/'+config.key+'/'+config.sheet+'/public/basic?alt=json-in-script',
	  dataType: 'jsonp',
	  success: processDataFromGoogleSpreadsheet
	});

	function defaultCallback(aData) {
		consoleOut("Here's the default callback", aData);
	};

	function defaultRowProcessor(aRowData, aRowNum) {
		// Just returns the row without any changes
		aRowData['rowNumber'] = aRowNum;
		return aRowData;
	};

	function expandLetterRange(letters) {
		// Takes input in the form A:ZZ and turns it into
		// an array with all intermediate letters filled out
		var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var delimiter = ":";
		var letter1Score = letter2Score = 0;

		var splitLetters = letters.split(':');

		function turnLettersIntoScores(letters) {
			var score = 0;
			for (var i=0; i<letters.length; i++) {
				multiplier = Math.max(1, (letters.length-i-1)*26);
				tmpScore = multiplier * (1 + alphabet.search(letters[i]));
				score = score + tmpScore;
			}
			return score;
		}

		// Get column ranges
		letter1Score = turnLettersIntoScores(splitLetters[0]);
		letter2Score = turnLettersIntoScores(splitLetters[1]);

		if (letter1Score > letter2Score) {
			var letter1ScoreTemp = letter1Score;
			letter1Score = letter2Score;
			letter2Score = letter1ScoreTemp;
		}

		// Create intermediate letters in array
		var outArray = [];
		for (var i = letter1Score-1; i<letter2Score; i++) {
			if (i < 26) {
				var firstLetter = '';
			}
			else {
				var firstLetter = alphabet[Math.floor(i/26)-1];
			}
			var secondLetter = alphabet[i%26];
			outArray[i] = firstLetter + secondLetter;
		}
		return outArray;
	};

	// Process data
	function processDataFromGoogleSpreadsheet(callback) {

		if (_.isUndefined(callback.feed.entry) === true) {
			consoleOut('Your spreadsheet appears to be empty.');
			config.success.call(this, []);
		}
		else {
			var contentIn = callback.feed.entry;
			var tmp = { row: {} };
			var _rowData;
			var _outputData = [];

			// Get column names
			var colNames = {};
			var colsToGet = expandLetterRange(config.colsToGet);

			// Calculate how many relevant rows of cells to pull in by
			// finding the last cell that lies within our chosen range
			var lastCellInRange = _.max(contentIn, function(entry){
				var letter = entry.title.$t.match(/[A-Z]+/)[0];
				var number = parseInt(entry.title.$t.match(/[0-9]+/)[0]);
				if (colsToGet.indexOf(letter) !== -1) {
					return number;
				}
			});

			//var lastCellRow = contentIn[contentIn.length-1].title.$t.match(/[0-9]+/)[0];
			var lastCellRow = lastCellInRange.title.$t.match(/[0-9]+/)[0];
			var numCells = lastCellRow * colsToGet.length;

			// Loop through cells from Google Docs
			var curCell = colsToGet.length;						// Skip first row of spreadsheet
			for (var row=0; row<lastCellRow; row++) { 					// Rows
				for (var col=0; col<colsToGet.length; col++) {	// Cols

					// Go through the google spreadsheet feed until
					// we find a cell that is within our range
					var skipCount = 0
					for (var skipped = 0; skipped <= skipCount; skipped++ ) {
						var nextCell = curCell + skipped;
						// Cache cell name
						if (_.isUndefined(contentIn[nextCell]) === false ){
							tmp.cellName = contentIn[nextCell].title.$t;
							tmp.cellLetter = tmp.cellName.match(/[A-Z]+/)[0];

							// Check if the cell we just got is within the columns we've specified above.
							// If not (e.g. E5, and we haven't chosen any E columns) just move on to the next cell
							if (colsToGet.indexOf(tmp.cellLetter) === -1) {
								consoleOut('Oh no! Cell is outside our chosen range:', tmp.cellName, colsToGet);
								skipCount++	// Let's try the next cell in our feed
							}
						}
					}

					// Work out which cell name (e.g. A1) *should* appear next
					// so we can see if there are any gaps in the feed
					curCell = nextCell;
					var expectedCellLetter = colsToGet[col];
					var expectedCell = expectedCellLetter + (row+1);

					// Title row
					if (row === 0) {
						if (contentIn[col].title.$t === expectedCell) {
							colNames[colsToGet[col]] = contentIn[col].content.$t;
						}
						else {
							colNames[colsToGet[col]] = 'noNameCol' + (col+1);
						}
					}
					// Main body
					else {
						var curColName = colNames[expectedCellLetter];
						// Use data from google spreadsheet if present, otherwise create property in the projects object
						if (tmp.cellName === expectedCell) {
							tmp.row[curColName] = contentIn[curCell].content.$t;
							curCell++;
						}
						else {
							if (colsToGet.indexOf(tmp.cellLetter) === -1) {
								consoleOut('Oh no! Cell is outside our chosen range:', tmp.cellName, colsToGet);
								// This will only trigger if the last cell in our spreadsheet feed is outside the col range
							}
							else {
								tmp.row[curColName] = 'ERROR';
								consoleOut('Oh no! Cell is blank in spreadsheet:', expectedCell);
							}
						}
					}
				}

				if (row > 0) {
					// Call function that processes row before adding it to the data structure
					tmp.row = config.rowProcessor.call(this, tmp.row, row);

					// Add row to output array and reset to ready for next row
					_outputData.push(tmp.row);
					tmp.row = {};
				}

			}
			config.success.call(this, _outputData);
		}
	}
  };
})( jQuery );