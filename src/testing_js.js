// QUnit test for the register function
QUnit.test("Test register function", function (assert) {
    // Arrange
    // Set up any necessary elements or conditions

    // Create an async object to handle asynchronous code
    var done = assert.async();

    // Mock the jQuery.ajax function to simulate a successful response
    var ajaxStub = sinon.stub($, 'ajax');
    ajaxStub.callsFake(function (options) {
        options.success('["admin_corp", "101"]');
    });

    // Act
    register(); // Call the register function

    // Assert
    setTimeout(function () {
        // Use QUnit assertions to check the expected outcome after a short delay
        assert.equal(sessionStorage.getItem("name"), "admin_corp", "Session storage should contain comp_name");
        assert.equal(sessionStorage.getItem("id"), "101", "Session storage should contain comp_id");

        // Restore the original jQuery.ajax function
        ajaxStub.restore();

        // Mark the test as done
        done();
    }, 1000); // Adjust the delay based on your specific case
});
// QUnit test for init_tbl function
QUnit.test("Test init_tbl function", function (assert) {
    // Arrange
    const tableContainer = document.createElement('div');
    tableContainer.id = 'Inventory_table';
    document.body.appendChild(tableContainer);

    // Act
    // Use QUnit's done() to handle asynchronous DataTable initialization
    var done = assert.async();

    // Check if the container element exists
    assert.ok(document.getElementById('Inventory_table'), 'Table container should exist');
    done();
});
// QUnit test for createPieChart function
QUnit.test("Test createPieChart function", function (assert) {
    // Arrange
    const canvas = document.createElement('canvas');
    canvas.id = 'pieChart';
    document.body.appendChild(canvas);

    const data = [
        ['ProductA', 'CategoryA', 'DescriptionA', 'add', 10],
        ['ProductB', 'CategoryB', 'DescriptionB', 'sub', 5],
    ];

    // Act
    createPieChart(data);

    // Assert
    const ctx = document.getElementById('pieChart').getContext('2d');
    assert.ok(ctx, 'Canvas element should exist');
    
    const chartInstance = Chart.instances[0];
    assert.ok(chartInstance, 'Chart instance should exist');

    // Clean up
    document.body.removeChild(canvas);
});
// QUnit test for createBarChart function
QUnit.test("Test createBarChart function", function (assert) {
    // Arrange
    const canvas = document.createElement('canvas');
    canvas.id = 'barChart';
    document.body.appendChild(canvas);

    const data = [
        ['ProductA', 'CategoryA', 'DescriptionA', 'add', 10],
        ['ProductB', 'CategoryB', 'DescriptionB', 'sub', 5],
    ];

    // Act
    createBarChart(data);

    // Assert
    const ctx = document.getElementById('barChart').getContext('2d');
    assert.ok(ctx, 'Canvas element should exist');
    
    const chartInstance = Chart.instances[0]; 
    assert.ok(chartInstance, 'Chart instance should exist');

    // Clean up
    document.body.removeChild(canvas);
});
// QUnit test for make_tbl_logs function
QUnit.test("Test make_tbl_logs function", function (assert) {
    // Arrange
    const data = '[["ProductA", "CategoryA", "DescriptionA", "add", 10], ["ProductB", "CategoryB", "DescriptionB", "sub", 5]]';

    // Create a spy to mock the init_tbl_logs function
    const initTblLogsSpy = sinon.spy(window, 'init_tbl_logs');

    // Act
    make_tbl_logs(data);

    // Assert
    assert.ok(initTblLogsSpy.calledOnce, 'init_tbl_logs should be called once');

    // Clean up
    initTblLogsSpy.restore();
});