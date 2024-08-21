// Predefined variables and event listeners
var tbl = null;

const login_button = document.getElementById('Login');
const sign_up_button = document.getElementById('Register');
const save_button = document.getElementById('save_btn');

document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        if (login_button != null) {
            clickLogin();
        }
        if(sign_up_button != null) {
            clickSignup();
        }
        if(save_button != null) {
            clickSave();
        }
    }
}
);

// Button click functions
function clickLogin() {
    login_button.click();
}
function clickSignup(){
    sign_up_button.click();
}
function clickSave(){
    save_button.click();
}
$(function() {
    $("#Login").click(login);
    $("#Register").click(register);
});

// Register Functions // Functions called when the user registers a new account
function register(){
    var user_name = $("#new_username").val();
    var new_password = $("#new_password").val();
    var confirm_password = $("#confirm_password").val();
    var comp_name = $("#comp_name").val();
    var email = $("#user_email").val();

    $.ajax({
        url: "register_data",
        data: {"new_user": user_name, "new_pass": new_password, "confirm": confirm_password, "comp_name": comp_name, "user_email": email},
        success: send_data_register,
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}
// Gets the register data from the ajax request above and sets the local storage variables to use later
function send_data_register(x) {
    const signup_error = document.getElementById("signup-msg-fail");
    if (x.charAt(0) === "[") {
        x = JSON.parse(x);
        comp_name = x[0]
        comp_id = x[1]
    
        sessionStorage.setItem("name", comp_name);
        sessionStorage.setItem("id", comp_id);
        user_dashboard();
    }
    else{
        signup_error.textContent = x;
        signup_error.style.display = "block"
    }
}
// Login functions // Functions called when the user logs in
function login(){
    var user = $("#log_user").val();
    var password = $("#log_password").val();

    // Used to send data to a python function (login_data) without refreshing the web page.
    // data is pass as 'data' and the values returned from the python function is passed
    // through the success call as a parameter to the function that is being called.
    $.ajax({
        url: "login_data",
        data: {"log_user": user, "log_pass": password},
        success: send_data_login,
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });

}
//Login and go to user_dashboard and sets local storage variables to use later
function send_data_login(x){
    login_error = document.getElementById("login-msg-fail");
    hideError();
    if (x.charAt(0) === "[") {
        x = JSON.parse(x);
        if(x == null)
        {
            showError();
        }
        else
        {
            comp_name = x[0]
            comp_id = x[1]
            email = x[2]

            sessionStorage.setItem("name", comp_name);
            sessionStorage.setItem("id", comp_id);
            sessionStorage.setItem("user_email", email)
            user_dashboard();
        }
    }
    else{
        login_error.textContent = x;
        login_error.style.display = "block"
    }
}
// Redirect to user dashboard page
function user_dashboard(){
    window.location.href = "https://inventisync.net/user_dashboard"; 
}
// Called on user dashboard page load. Gets data from the database according to the variables set upon login/signup
function get_data(){
    var x = sessionStorage.getItem("name");
    var y = sessionStorage.getItem("id");
    insertCompName(x)
    
    $.ajax({
        url: "user_dashboard_data",
        data: {"id": y, "name": x},
        success: make_tbl,
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}

// initialize jquery datatable // Only done once // Called in make_tbl function
function init_tbl(data) {
    var tbl = $("#Inventory_table").DataTable({
        responsive: true,
        data: data, // Initialize with your data
        createdRow: function (row, data, dataIndex) {
            // Add the "parent-row" class to each row
            $(row).addClass("parent-row");
        },
        responsive: {
            details: {
                type: 'inline',
            }
        }
    });
    return tbl;
}
// add the parent-row class to each row in the datatable once the data is added // Called in make_tbl function
function addRowsWithClass(tbl, data) {
    // Clear existing data and add new rows
    tbl.clear().rows.add(data).draw();

    // Loop through each row and add the class
    tbl.rows().every(function (rowIdx, tableLoop, rowLoop) {
        var rowNode = this.node();
        $(rowNode).addClass("parent-row");
    });
}
// Gets only the rows that have a child-row being shown // Called in make_tbl function
function getRowWithChildVisible(table) {
    var rows = table.rows().nodes(); // Get all rows

    for (var i = 0; i < rows.length; i++) {
        var row = $(rows[i]);

        if (table.row(row).child.isShown() && row.hasClass('selected')) {
            return row;
        }
    }
    return null; // No row with child row visible
}
// Button classes assigned in make_tbl function
var saveButtonClass = 'save-button';
var cancelButtonClass = 'cancel-button';
var delButtonClass = 'delete-button';

// Function to create the table and handle all clicks and other events
function make_tbl(data) {
    data = JSON.parse(data);
    // check if the table has already been created // If not, create a new table, otherwise just add rows
    if (tbl == null){
        tbl = init_tbl(data);
    }
    else {
        addRowsWithClass(tbl, data);
    }
    function handleRowClick(event) {
        var parent_row = $(this);
        var target = event.target;

        var rowData = tbl.row(parent_row).data(); // Access data using DataTables

        var childRow = $('#Inventory_table tbody tr.child-row');

        // Iterate through all parent rows
        tbl.rows('.parent-row').every(function () {
            var otherParentRow = $(this.node());
        
            if (otherParentRow.hasClass('selected')) {
                handleCancel(childRow, otherParentRow);
            }
        });
        if ($(target).hasClass('selected')) {
            handleCancel(childRow, parent_row)
        } else {
            tbl.rows('.selected').nodes().to$().removeClass('selected');
            parent_row.addClass('selected');

            var productId = rowData[4];
            var editContent = `
            <tr class="child-row"> 
                <td>
                    <label for="productAmount">Product Amount:</label>
                    <input type="text" id="productAmount" value="${rowData[1]}">
                </td>
                <td>
                    <label for="amountType">Amount Type:</label>
                    <input type="text" id="amountType" value="${rowData[2]}">
                </td>
                <td>
                    <label for="productCost">Product Cost:</label>
                    <input type="text" id="productCost" value="${rowData[5]}">
                </td>
                <td>
                    <button class="${saveButtonClass}" id="save_btn">Save</button>
                    <button class="${cancelButtonClass}">Cancel</button>
                    <button class="${delButtonClass}">Delete</button>
                </td>
                <td>
                    <p id="row-del-msg-success" style="display: none; color: green;">Row Deleted Successfully!</p>
                    <p id="row-del-msg-fail" style="display: none; color: rgb(243, 5, 5);">Row Delete Failed!</p>
                </td>

            </tr>
            `;
            tbl.row(parent_row).child(editContent).show();
            parent_row.addClass('selected');
        }
    }

    function handleChildRowClick(event) {
        var child_row = $(this);
        var target = event.target;
        var parent_row = getRowWithChildVisible(tbl);
        // Check if the clicked element is the Save button
        if ($(target).hasClass(saveButtonClass)) {
            handleSaveButtonClick(child_row, parent_row);
        }
        else if ($(target).hasClass(cancelButtonClass) || $(target).hasClass(`${cancelButtonClass}-child`)) {
            handleCancel(child_row, parent_row);
        }
        else if($(target).hasClass(delButtonClass)){
            openChoiceForm();
            document.getElementById("del_button_confirm").addEventListener("click", function() {
                handleDelete(child_row, parent_row);
            });
            document.getElementById("cancel_button_confirm").addEventListener("click", function() {
                closeChoiceForm();
            });
        }
        return;
    }

    function handleDelete(child, parent){
        if (parent.length > 0) {
            var comp_name = sessionStorage.getItem("name");
            var comp_id = sessionStorage.getItem("id");
            var rowData = tbl.row(parent).data(); // Access data using DataTables
            prod_id = rowData[4]
            const RowDelMessage_fail = document.getElementById("row-del-msg-fail");
            const RowDelMessage_success = document.getElementById("row-del-msg-success");
            $.ajax({
                type: "POST",
                url: "/del_row",
                data: {"comp_name": comp_name, "comp_id": comp_id, "prod_id": prod_id},
                success: function (data) {
                    if(data == "deleted"){
                        RowDelMessage_success.style.display = "block";
                        setTimeout(function () {
                            RowDelMessage_success.style.display = "none";
                            child.remove(); // Remove the child row
                            parent.removeClass('selected'); // Remove the 'selected' class from the parent row
                            tbl.row(parent).child.hide(); // Hide the child row in DataTables
                            reload(); 
                        }, 2500);
                    }
                    else{
                        RowDelMessage_fail.style.display = "block";
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('AJAX request failed.', errorThrown);
                }
            });
        }
    }
    // Handle cancel button in child row
    function handleCancel(child, parent) {
        if (parent.length > 0) {
            child.remove(); // Remove the child row
            parent.removeClass('selected'); // Remove the 'selected' class from the parent row
            tbl.row(parent).child.hide(); // Hide the child row in DataTables
        }
    }
    // Handle save button in child row
    function handleSaveButtonClick(child, parent) {
        var comp_name = sessionStorage.getItem("name");
        var comp_id = sessionStorage.getItem("id");

        var rowData = tbl.row(parent).data(); // Access data using DataTables
    
        // Find the input elements within the child row
        var productAmountValue = child.find('#productAmount').val();
        var amountTypeValue = child.find('#amountType').val();
        var productCostValue = child.find('#productCost').val();

        var originalValue = parseFloat(rowData[1]);
        var updatedValue = parseFloat(productAmountValue);

        // Differentiate between add or subtraction of the product amount
        var add_or_sub = "";
        if (originalValue > updatedValue) {
            add_or_sub = "sub";
        } else {
            add_or_sub = "add";
        }

        // Find the difference between the original product amount and the updated product amount
        var amount_changed = 0;
        function diff(num1, num2) {
            return Math.abs(num1 - num2);
        }
        amount_changed = diff(productAmountValue, rowData[1])

        // Create the data array
        var editedData = [
            rowData[0],
            productAmountValue,
            amountTypeValue,
            rowData[3],
            rowData[4],
            productCostValue,
            rowData[6]
        ];

        // Send the updated data array, including the product ID, to the Python backend using an AJAX request
        $.ajax({
            url: "update_row",
            method: "POST",
            data: JSON.stringify({"edit_data": editedData, "comp_name": comp_name, "comp_id": comp_id, "add_or_sub": add_or_sub, "amount_changed": amount_changed}),
            contentType: "application/json",  // Set the content type to JSON
            success: function (response) {
                if(response == "Update Success") {
                    reload();
                }
                else{
                    update_errror();
                }
            },
            error: function (error) {
                alert(error.message)
            }
        });
    }
    
    // Event delegation for mouseover and mouseleave
    $('#Inventory_table tbody').on('mouseover', 'tr:not(:has(th))', function () {
        $(this).css("background", "lightblue");
    });

    $('#Inventory_table tbody').on('mouseleave', 'tr:not(:has(th))', function () {
        $(this).css("background", "");
    });

    // Event delegation for parent rows
    $('#Inventory_table tbody').on('click', 'tr.parent-row', handleRowClick);
    
    // Event delegation for child rows
    $('#Inventory_table tbody').on('click', 'tr.child-row', handleChildRowClick);
}
//import a csv file to a new table
function imprtFile(){
    var nm = sessionStorage.getItem("name");
    var id = sessionStorage.getItem("id");
    var fileInput = document.getElementById('inpFile');
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);

    if (file) {
        showLoad();
        const reader = new FileReader();

        reader.onload = function(event) {
            var fileContents = event.target.result;
            var dataArray = [];

            // Split the file content into an array of lines
            var lines = fileContents.split('\n');

            // Iterate through each line and add it to the dataArray
            for (let i = 0; i < lines.length; i++) {
                dataArray.push(lines[i]);
            }
            $.ajax({
                url: "/imprt",
                type: "POST", // Use POST method to send JSON data
                data: JSON.stringify({ "file_contents": dataArray, "name": nm, "id": id }), // Convert to JSON
                contentType: "application/json; charset=utf-8", // Set content type to JSON
                success: function(data) {
                    closeLoad();
                    if (data.message === 'Import successful') {
                        // After a successful import
                        const importSuccessMessage = document.getElementById("import-success-message");
                        importSuccessMessage.style.display = "block";

                        // After 2 seconds, hide the message and call the get_data function
                        setTimeout(function () {
                            importSuccessMessage.style.display = "none";
                            closeImport();
                            reload();
                        }, 1500);
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error:', error);
                }
            });
        };

        reader.readAsText(file);
    } else {
        alert("Please select a file to upload.");
    }
}
// Displays the file name within the import form
function displayFileName() {
    const fileInput = document.getElementById("inpFile");
    const fileLabel = document.querySelector(".file-label"); // Use querySelector to select by class
  
    if (fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        fileLabel.textContent = "Selected file: " + fileName;
    } else {
        fileLabel.textContent = "Choose a CSV file:";
    }
}
//export file to the user's computer as a direct download
function exprtFile() {
    var nm = sessionStorage.getItem("name");
    var id = sessionStorage.getItem("id");

    $.ajax({
        type: "POST",
        url: "/export",
        data: {"id": id, "name": nm},
        success: function(response) {
            const FileSentMessage_success = document.getElementById("exprted-msg-success");
            var blob = new Blob([response.data], { type: 'text/csv' });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = response.filename;
            link.click();
            FileSentMessage_success.style.display = "block";
            setTimeout(function () {
                FileSentMessage_success.style.display = "none";
                closeExprt()
            }, 2000);
        },
        error: function() {
            console.error('AJAX request failed.');
        }
    });
}
//export current table to an email
function exprtByEmail(){
    var nm = sessionStorage.getItem("name");
    var id = sessionStorage.getItem("id");
    var email = $("#user_email").val();

    $.ajax({
        type: "POST",
        url: "/export_and_email",
        data: {"id": id, "name": nm, "email": email},
        success: function(data){
            const FileSentMessage_success_inv = document.getElementById("exprted-msg-success-inv");
            const FileSentMessage_fail_inv= document.getElementById("exprted-msg-fail-inv");
            if(data == "Success"){
                FileSentMessage_success_inv.style.display = "block";
                setTimeout(function () {
                    FileSentMessage_success_inv.style.display = "none";
                    closeExprt_email();
                }, 2000);
            }
            else{
                FileSentMessage_fail_inv.style.display = "block";
                setTimeout(function () {
                    FileSentMessage_fail_inv.style.display = "none";
                    closeExprt_email();
                }, 2000);
            }
        },
        error: function() {
            console.error('AJAX request failed.');
        }
    });
}
// Retrieve the users settings 
function getUserSettings(){
    var comp_id = sessionStorage.getItem("id");
    $.ajax({
        type: "POST",
        url: "/get_user_settings",
        data: {"id": comp_id},
        success: function(response) {
            data = JSON.parse(response);
            toggleSettings()
            document.getElementById("itemAmountThreshold").value = data[2] ;
            document.getElementById("automaticNotifications");
            if (data[3] == 1){
                document.getElementById("automaticNotifications").checked = true;
            }else{document.getElementById("automaticNotifications").checked = false}
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}
// Updates the users settings when the user changes a value in the settings menu and clicks save
function updateUserSettings(){
    var threshold = $("#itemAmountThreshold").val();
    if (document.getElementById("automaticNotifications").checked = true)
    {
        var notif = 1
    }
    else{notif = 0}
    var comp_name = sessionStorage.getItem("name");
    var comp_id = sessionStorage.getItem("id");

    $.ajax({
        type: "POST",
        url: "/update_user_settings",
        data: {"id": comp_id, "name": comp_name, "threshold": threshold, "notif": notif},
        success: function(ans){
            const SettingUpdateMessage = document.getElementById("settings-update-success-msg");
            if (ans == "success"){
                SettingUpdateMessage.style.display = "block";
                setTimeout(function () {
                    SettingUpdateMessage.style.display = "none";
                    closeSettings();
                }, 2000);
            }
            else{
                const SettingUpdateMessage_fail = document.getElementById("settings-update-fail-msg");
                SettingUpdateMessage_fail.style.display = "block";
                setTimeout(function () {
                    SettingUpdateMessage_fail.style.display = "none";
                }, 2000);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}
// Adds a single row to the current table and updates the database
function add_row(){
    var comp_name = sessionStorage.getItem("name");
    var comp_id = sessionStorage.getItem("id");
    var prod_name = $("#product_name").val();
    var prod_amount= $("#prod_amount").val();
    var type = $("#amount_type").val();
    var prod_id = $("#prod_ID").val();
    var prod_cost = $("#prod_cost").val();
    console.log("in row add")
    
    const RowAddMessage_fail = document.getElementById("row-add-msg-fail");
    const RowAddMessage_success = document.getElementById("row-add-msg-success");
    $.ajax({
        type: "POST",
        url: "/add_row",
        data: {"comp_name": comp_name, "comp_id": comp_id, "prod_name": prod_name, "prod_amount": prod_amount, "prod_type": type, "prod_id": prod_id, "prod_cost": prod_cost},
        success: function (data) {
            if(data == "added"){
                RowAddMessage_success.style.display = "block";
                setTimeout(function () {
                    RowAddMessage_success.style.display = "none";
                }, 2500);
            }
            else{
                RowAddMessage_fail.style.display = "block";
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}
// Form functions
function checkForms(){
    const exportForm = document.getElementById("exportForm");
    const importForm = document.getElementById("importForm");
    const updateForm =  document.getElementById("updateForm")
    if (updateForm.style.display == "block") {
        closeForm()
    }
    if(exportForm.style.display == "block") {
        closeExprt()
    }
    if(importForm.style.display == "block") {
        closeImport()
    }
}
// confirm form functions // delete row confirm
// Open confirm form
function openChoiceForm(){
    document.getElementById("confirmPopup").style.display = "block";
}
// Close confirm form
function closeChoiceForm(){
    document.getElementById("confirmPopup").style.display = "none";
}
// Import Form functions
// Toggle import form
function toggleImportForm() {
    const importForm = document.getElementById("importForm");

    if (importForm.style.display === "block") {
        // If the form is currently displayed, hide it
        closeImport();
    } else {
        // If the form is currently hidden, display it
        openImport();
    }
}
// Open import form
function openImport() {
    document.getElementById("importForm").style.display = "block";
}
// Close import form
function closeImport() {
    const fileInput = document.getElementById("inpFile");
    fileInput.value = ''; // Reset the file input
    fileInput.previousElementSibling.textContent = "Choose a CSV file"; // Reset the label
    document.getElementById("importForm").style.display = "none";
}
// Export by download functions
function toggleExportForm() {
    const exportForm = document.getElementById("exportForm");

    if (exportForm.style.display == "block") {
        closeExprt();
    } else {
        openExprt();
    }
}
function openExprt() {
    document.getElementById("exportForm").style.display = "block";
}
function closeExprt() {
    document.getElementById("exportForm").style.display = "none";
}
// Export email form functions
// Open email export form
function openExprt_email() {
    document.getElementById("exprt_email").style.display = "block";
}
// Close email export form
function closeExprt_email() {
    document.getElementById("exprt_email").style.display = "none";
}
// Toggle email export form
function toggleExport_Email_Form() {
    const exportForm = document.getElementById("exprt_email");

    if (exportForm.style.display === "block") {
        // If the form is currently displayed, hide it
        closeExprt_email();
    } else {
        // If the form is currently hidden, display it
        openExprt_email();
    }
}
// Update form functions
// Open update form
function openForm() {
    document.getElementById("updateForm").style.display = "block";
}
// Close update form
function closeForm() {
    document.getElementById("updateForm").style.display = "none";
    reload();
}
// Profile menu functions
// Close profile menu when clicking anywhere else on the page
document.addEventListener('click', function (event) {
    var profileMenu = document.getElementById('profileMenu');
    var profileButton = document.querySelector('.profile-button');
    if(profileMenu != null){
        // Check if the clicked element is outside the profile menu and profile button
        if (!profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
            // Hide the profile menu
            profileMenu.style.display = 'none';
        }
    }
});
// Toggle profile menu
function toggleProfileMenu() {
    var profileMenu = document.getElementById('profileMenu');
    // Toggle the display of the profile menu
    profileMenu.style.display = (profileMenu.style.display === 'none' || profileMenu.style.display === '') ? 'block' : 'none';
}
// Settings menu functions
// Toggle settings menu
function toggleSettings() {
    var popup = document.getElementById("settingsPopup");
    if (popup.style.display === "block") {
        popup.style.display = "none";
    } else {
        popup.style.display = "block";
    }
}
// Close settings menu
function closeSettings() {
    document.getElementById("settingsPopup").style.display = "none";
}
// Misc Functions
function change_password(){
    var new_password = $("#new_password_change").val();
    var confirm_password = $("#confirm_password_change").val();
    var comp_name = sessionStorage.getItem("name");
    var comp_id = sessionStorage.getItem("id");

    $.ajax({
        url: "change_password_data",
        data: {"new_password_change": new_password, "confirm_password_change": confirm_password, "comp_name": comp_name, "comp_id": comp_id},
        success: function(data){
            var update_msg_success = document.getElementById("change-pass-msg-success");
            var update_msg_fail = document.getElementById("change-pass-msg-fail");

            if(data == "Password Updated Successfully"){
                update_msg_success.style.display = "block";
                setTimeout(function () {
                    update_msg_success.style.display = "none";
                    window.location.href = "https://inventisync.net/login"; 
            }, 1500);
            }
            else {
                update_msg_fail.style.display = "block";
            };

        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}
// Reload the current page
function reload(){
    location.reload();
}
// Insert the company name in the user dashboard
function insertCompName(comp_name) {
    document.getElementById("companyName").textContent = comp_name;
}
// Show loading icon in the import form
function showLoad(){
    var loadMsg= document.getElementById('loading-message');
    loadMsg.style.display = 'block';
}
// Hide loading icon in the import form
function closeLoad(){
    var loadMsg= document.getElementById('loading-message');
    loadMsg.style.display = 'none';
}
// Show error message during login
function showError() {
    var errorMessage = document.getElementById('error-message');
    errorMessage.style.display = 'block';
}
// Hide error message
function hideError() {
    var errorMessage = document.getElementById('error-message');
    errorMessage.style.display = 'none';
}

// Company Logs Functions
log_tbl = null;
// Redirect to company log page
function log_redirect(){
    window.location.href = "https://inventisync.net/company_logs"; 
}
// Use ajax request to get company log data from backend database
function get_logs(){
    var x = sessionStorage.getItem("name");
    var y = sessionStorage.getItem("id");
    insertCompName(x)
    
    $.ajax({
        url: "company_log_data",
        data: {"id": y, "name": x},
        success: make_tbl_logs,
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}
// Initialize the datatable only once
function init_tbl_logs(data) {
    var log_tbl = $("#Log_table").DataTable({
        responsive: true,
        data: data,
        createdRow: function (row, data, dataIndex) {
            $(row).addClass("parent-row");
        },
        responsive: {
            details: {
                type: 'inline',
            }
        }
    });
    return log_tbl;
}
// Create the datatable
function make_tbl_logs(data) {
    data = JSON.parse(data);
    if (log_tbl == null){
        log_tbl = init_tbl_logs(data);
    }
    else {
        addRowsWithClass(log_tbl, data);
    }
    // Event delegation for mouseover and mouseleave
    $('#Inventory_table tbody').on('mouseover', 'tr:not(:has(th))', function () {
        $(this).css("background", "lightblue");
    });

    $('#Inventory_table tbody').on('mouseleave', 'tr:not(:has(th))', function () {
        $(this).css("background", "");
    });

    // Create the 2 charts
    createPieChart(data);
    createBarChart(data);

}
// Create the Pie Chart
function createPieChart(data) {
    var ctx = document.getElementById('pieChart').getContext('2d');

    // Check if the chart instance already exists
    var existingChart = Chart.getChart(ctx);
    if (existingChart) {
        // Destroy the existing chart before creating a new one
        existingChart.destroy();
    }
 
    var productTotals = {};

    data.forEach(entry => {
        var productName = entry[0];
        var amountChanged = parseFloat(entry[4]);
        var add_or_sub = entry[3];

        if (add_or_sub === 'sub') {
            if (!productTotals[productName]) {
                productTotals[productName] = amountChanged;
            } else {
                productTotals[productName] += amountChanged;
            }
        }
    });

    var productNames = Object.keys(productTotals);
    var productUsage = Object.values(productTotals);
    var productBackgroundColors = productNames.map(name => generateColor(name));

    var pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: productNames,
            datasets: [{
                data: productUsage,
                backgroundColor: productBackgroundColors,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Product Usage Distribution',
            },
        },
    });
}
// Create the bar chart
function createBarChart(data) {
    var ctx = document.getElementById('barChart').getContext('2d');

    // Check if the chart instance already exists
    var existingChart = Chart.getChart(ctx);
    if (existingChart) {
        // Destroy the existing chart before creating a new one
        existingChart.destroy();
    }

     
    var productTotals = {};

    data.forEach(entry => {
        var productName = entry[0];
        var amountChanged = parseFloat(entry[4]);
        var add_or_sub = entry[3];

        if (add_or_sub === 'sub') {
            if (!productTotals[productName]) {
                productTotals[productName] = amountChanged;
            } else {
                productTotals[productName] += amountChanged;
            }
        }
    });

    var productNames = Object.keys(productTotals);
    var productUsage = Object.values(productTotals);
    var productBackgroundColors = productNames.map(name => generateColor(name));

    var barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productNames,
            datasets: [{
                label: 'Product Usage',
                data: productUsage,
                backgroundColor: productBackgroundColors,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Product Usage Distribution (Bar Chart)',
            },
            legend: {
                display: true,
                labels: {
                    boxWidth: 0, // Set the box width to 0 to remove the colored box
                },
            },
        },
    });
}
// Generate chart colors specific to each product name
function generateColor(productName) {
    // Use the product name to generate a consistent color
    var hash = 0;
    for (var i = 0; i < productName.length; i++) {
        hash = productName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert the hash to a color
    var color = '#';
    for (var j = 0; j < 3; j++) {
        var value = (hash >> (j * 8)) & 0xff;
        color += ('00' + value.toString(16)).slice(-2);
    }

    return color;
}

//export logs to the user's computer as a direct download
function exprtFile_logs() {
    var nm = sessionStorage.getItem("name");
    var id = sessionStorage.getItem("id");

    $.ajax({
        type: "POST",
        url: "/export_logs",
        data: {"id": id, "name": nm},
        success: function(response) {
            const FileXportMessage_success = document.getElementById("exprted-msg-success-down");
            var blob = new Blob([response.data], { type: 'text/csv' });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = response.filename;
            link.click();
            exportCharts()
            FileXportMessage_success.style.display = "block";
            setTimeout(function () {
                FileXportMessage_success.style.display = "none";
                closeExprt()
            }, 2000);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}

//export log table and charts to an email
function exprtByEmail_logs() {
    var nm = sessionStorage.getItem("name");
    var id = sessionStorage.getItem("id");
    var email = $("#user_email").val();

    var barCanvas = document.getElementById('barChart');
    var pieCanvas = document.getElementById('pieChart');

    var barChartURL = barCanvas.toDataURL('image/png');
    var pieChartURL = pieCanvas.toDataURL('image/png');

    var barChartBase64 = barChartURL.split(',')[1];
    var pieChartBase64 = pieChartURL.split(',')[1];

    $.ajax({
        type: "POST",
        url: "/export_and_email_logs",
        data: {
            "id": id,
            "name": nm,
            "email": email,
            "bar_chart_url": barChartBase64,
            "pie_chart_url": pieChartBase64
        },
        success: function (data) {
            const FileSentMessage_success = document.getElementById("exprted-msg-success-log");
            const FileSentMessage_fail = document.getElementById("exprted-msg-fail-log");
            if (data == "Email sent successfully") {
                FileSentMessage_success.style.display = "block";
                setTimeout(function () {
                    FileSentMessage_success.style.display = "none";
                    closeExprt_email();
                }, 2000);
            }
            else {
                FileSentMessage_fail.style.display = "block";
                setTimeout(function () {
                    FileSentMessage_fail.style.display = "none";
                    closeExprt_email();
                }, 2000);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed.', errorThrown);
        }
    });
}

// Function to export charts as images
function exportCharts() {
    var barChartCanvas = document.getElementById('barChart');
    var pieChartCanvas = document.getElementById('pieChart');

    var barChartURL = barChartCanvas.toDataURL('image/png');
    var pieChartURL = pieChartCanvas.toDataURL('image/png');

    var link = document.createElement('a');
    link.href = barChartURL;
    link.download = 'barChart.png';
    link.click();

    link.href = pieChartURL;
    link.download = 'pieChart.png';
    link.click();
}