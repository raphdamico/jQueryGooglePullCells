describe("Google Spreadsheet Loader", function() {

  // Tests are from:
  // https://docs.google.com/spreadsheet/ccc?key=0AkT7EMSlHl5hdDVvRTFaQV9vS1U1eW1NTTRyT1hja0E#gid=0
  var DATA;
  var ajaxSuccess;

  function writeToContainer(data) {
    console.log(data);
    DATA = data;
    ajaxSuccess = true;
  };

  function countDataOut(data) {
    count = [];
    _.each(data, function(row) {
      count.push(_.toArray(row));
    });
    return _.flatten(count).length;
  }

  beforeEach(function() {
    DATA = [];
    ajaxSuccess = false;
  });

  describe("Default data", function() {

    beforeEach(function() {
      $.getDataFromGoogleSpreadsheet({
        key: '0AkT7EMSlHl5hdDVvRTFaQV9vS1U1eW1NTTRyT1hja0E',
        sheet: 'od5',
        colsToGet: 'A:C',
        success: writeToContainer
      });
      waitsFor(function() {
        return ajaxSuccess;
      }, "Ajax retrieval of spreadsheet failed", 10000);
    });

    it("should be able to load default data", function() {
        expect(DATA.length).toEqual(4);
    });
    it("should be able to load all the data", function() {
        expect(countDataOut(DATA)).toEqual(16);
    });
  })

  describe("Default data, called with too many columns", function() {

    beforeEach(function() {
      $.getDataFromGoogleSpreadsheet({
        key: '0AkT7EMSlHl5hdDVvRTFaQV9vS1U1eW1NTTRyT1hja0E',
        sheet: 'od5',
        colsToGet: 'A:D',
        success: writeToContainer
      });
      waitsFor(function() {
        return ajaxSuccess;
      }, "Ajax retrieval of spreadsheet failed", 10000);
    });

    it("should be still load", function() {
        expect(countDataOut(DATA)).toEqual(20);
    });
    it("Additional column should get assigned a default column title", function() {
      expect(_.keys(DATA[0])[3]).toEqual('noNameColumn4');
    });
  })

  describe("Malformed spreadsheet 1 should load", function() {

    beforeEach(function() {
      $.getDataFromGoogleSpreadsheet({
        key: '0AkT7EMSlHl5hdDVvRTFaQV9vS1U1eW1NTTRyT1hja0E',
        sheet: 'od6',
        colsToGet: 'A:D',
        success: writeToContainer
      });
      waitsFor(function() {
        return ajaxSuccess;
      }, "Ajax retrieval of spreadsheet failed", 10000);
    });

    it("should be able to load default data", function() {
        expect(DATA.length).toEqual(9);
    });
    it("should be able to load all the data", function() {
        expect(countDataOut(DATA)).toEqual(45);
    });
  })


  describe("Malformed spreadsheet 2 should load", function() {

    beforeEach(function() {
      $.getDataFromGoogleSpreadsheet({
        key: '0AkT7EMSlHl5hdDVvRTFaQV9vS1U1eW1NTTRyT1hja0E',
        sheet: 'od7',
        colsToGet: 'A:G',
        success: writeToContainer
      });
      waitsFor(function() {
        return ajaxSuccess;
      }, "Ajax retrieval of spreadsheet failed", 10000);
    });

    it("should be able to load default data", function() {
        expect(DATA.length).toEqual(1);
    });
    it("should be able to load all the data", function() {
        expect(countDataOut(DATA)).toEqual(8);
    });
  })

  describe("Empty sheet", function() {

    beforeEach(function() {
      $.getDataFromGoogleSpreadsheet({
        key: '0AkT7EMSlHl5hdDVvRTFaQV9vS1U1eW1NTTRyT1hja0E',
        sheet: 'od4',
        colsToGet: 'A:G',
        success: writeToContainer
      });
      waitsFor(function() {
        return ajaxSuccess;
      }, "Ajax retrieval of spreadsheet failed", 1000);
    });

    it("data should have 0 length", function() {
        expect(DATA.length).toEqual(0);
    });
    it("no items should be loaded", function() {
        expect(countDataOut(DATA)).toEqual(0);
    });
  })

});