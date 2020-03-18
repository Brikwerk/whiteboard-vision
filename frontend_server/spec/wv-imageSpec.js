describe("WV-Image Functions", function() {
    describe("when a new tab is created", function() {
        let tab = createTab("test");

        it("should be a List Item HTML Element", function() {
            expect(tab.nodeName).toEqual("LI");
        });
        
        it("should contain a name", function() {
            expect(tab.innerHTML).toEqual('<a href="#">test</a>');
        });
    });
});