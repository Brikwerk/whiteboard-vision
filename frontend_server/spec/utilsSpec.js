describe("Utility Functions", function() {
    describe("when a UUID is generated", function() {
        let uuid = createUUID();

        it("should be of type string", function() {
            expect(typeof uuid).toEqual("string");
        });
        
        it("should be 36 chars in length", function() {
            expect(uuid.length).toEqual(36);
        });
    });

    describe("when an array is flattened", function() {
        let originalArray = [[1,2],[3,4],[5,6]];
        let flattenedArray = [1,2,3,4,5,6];
        let result = flattenArray(originalArray);

        it("should be of type object", function() {
            expect(typeof result).toEqual("object");
        });

        it("should have a length", function() {
            expect(result.length).toEqual(6);
        });

        it("should have flattened elements", function() {
            expect(result).toEqual(flattenedArray);
        });
    });

    describe("when coordinates are ordered", function() {
        let originalArray = [[1,1],[1,0],[0,1],[0,0]];
        let orderedArray = [[0,0],[1,0],[1,1],[0,1]];
        let result = orderCoords(originalArray);

        it("should be of type object", function() {
            expect(typeof result).toEqual("object");
        });

        it("should have a length", function() {
            expect(result.length).toEqual(4);
        });

        it("should have flattened elements", function() {
            expect(result).toEqual(orderedArray);
        });
    });
});
  