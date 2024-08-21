from flask import Flask, render_template, json, request, redirect, Response, send_file, make_response, jsonify
import api.FlaskTemplate.funcs as funcs
import mimetypes
import io
from werkzeug.datastructures import Headers
from datetime import datetime as dt
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email import encoders
import base64

app = Flask(__name__)

#Return the user to the main page
@app.route('/')
def home():
    return render_template('Main_Page.html')

@app.route('/testing')
def test_suite():
    return render_template('test_suite.html')

@app.route('/change_password')
def change_pass():
    return render_template('change_pass.html')

@app.route('/change_password_data')
def change_password_data():
    new_password = request.args.get('new_password_change')
    confirm_password = request.args.get('confirm_password_change')
    comp_name = request.args.get('comp_name')
    comp_id = request.args.get('comp_id')
    ans = funcs.change_password(new_password, confirm_password, comp_name, comp_id)
    return ans

# Sends the user to the login page
@app.route("/login")
def login():
    return render_template('login.html')

# Get the data from the user login information
@app.route("/login_data")
def login_data():
    user_name = request.args.get("log_user")
    passwrd = request.args.get("log_pass")
    user_name = user_name.lower()
    data = funcs.login_user(user_name, passwrd)
    return json.dumps(data)

# Sends the user to the sign up page
@app.route("/register")
def signup():
    return render_template('sign_up.html')

# Get the data from the user registration 
@app.route("/register_data")
def register_data():
    user_name = request.args.get('new_user')
    passwrd = request.args.get('new_pass')
    confirm = request.args.get('confirm')
    comp_name = request.args.get('comp_name')
    email = request.args.get('user_email')
    user_name = user_name.lower()
    comp_name = comp_name.lower()
    
    ans = funcs.make_user(user_name, passwrd, confirm, comp_name, email)
    
    if ans == "created":
        data = funcs.login_user(user_name, passwrd)
        comp_name = data[0]
        comp_id = data[1]
        lst = []
        lst.append(comp_name)
        lst.append(comp_id)
        return json.dumps(lst)
    else:
        return ans

# Send to user to the contact page
@app.route("/contact")
def about():
    return render_template('Contact_Page.html')

# Send the user to the user dashboard
@app.route('/user_dashboard')
def user_dashboard():
    return render_template('User_dashboard.html')

# Get the data rom the user dashboard
@app.route('/user_dashboard_data')
def user_dashboard_data():
    id = request.args.get('id')
    name = request.args.get('name')
    inv = funcs.get_inv(name, id)
    return json.dumps(inv)

@app.route('/company_logs')
def company_logs():
    return render_template('log_page.html')

@app.route('/company_log_data')
def company_log_data():
    id = request.args.get('id')
    name = request.args.get('name')
    logs = funcs.get_logs(name, id)
    return json.dumps(logs)

# Import CSV file into the database
@app.route('/imprt', methods=['POST'])
def imprt():
    data = json.loads(request.data)
    file_contents = data.get('file_contents')
    comp_name = data.get('name')
    comp_id = data.get('id')
    master_lst = [item.split(',') for item in file_contents]

    ans = funcs.imp_inventory(comp_name, comp_id, master_lst)

    if ans:
        return jsonify({'message': 'Import successful'})
    else:
        return jsonify({'message': 'Import failed'})

# Export the data from the database into a CSV file
@app.route('/export', methods=['POST'])
def export():
    id = request.form.get('id')
    name = request.form.get('name')
    inv = funcs.get_inv(name, id)
    filename= name + '_Inventory_%s.csv' % dt.now().strftime('%Y%m%d%H%M%S')
    headers = funcs.get_table_columns(name, id)
    csv_data = []
    csv_data.append(headers)
    for row in inv:
        csv_data.append(row)

    csv_content = '\n'.join([','.join(row) for row in csv_data])
    response = make_response(csv_content)
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    response.headers["Content-Type"] = "text/csv"

    return jsonify(data=csv_content, filename=filename)

# Export the data from the database into a CSV file and email it to the user
@app.route('/export_and_email', methods=['POST'])
def export_and_email():
    id = request.form.get('id')
    name = request.form.get('name')
    email = request.form.get('email')
    inv = funcs.get_inv(name, id)
    filename = f"{name}_Inventory_{dt.now().strftime('%Y%m%d%H%M%S')}.csv"
    headers = funcs.get_table_columns(name, id)
    csv_data = []
    csv_data.append(headers)
    for row in inv:
        csv_data.append(row)

    csv_content = '\n'.join([','.join(row) for row in csv_data])

    # Compose the email
    msg = MIMEMultipart()
    msg['From'] = 'InventiSync@gmail.com'  # Replace with your email address
    msg['To'] = email  # Replace with the recipient's email address
    msg['Subject'] = 'CSV File Attached'

    # Add CSV file as an attachment
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(csv_content)
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', f'attachment; filename={filename}')
    msg.attach(part)

    # Send the email
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)  # Use your email provider's SMTP server
        server.starttls()
        server.login('InventiSync@gmail.com', 'ysvi tsee dsrw wcde')  # Replace with your email and password/App Password
        text = msg.as_string()
        server.sendmail('InventiSync@gmail.com', email, text)
        server.quit()
        return "Success"
    except Exception as e:
        print(f"Error sending email: {e}")


# Allow the user to update the rows in the database 
@app.route('/update_row', methods=['POST'])
def update_row():
    data = request.get_json()
    edit_data = data["edit_data"]
    comp_name = data["comp_name"]
    comp_id = data["comp_id"]
    add_or_sub = data["add_or_sub"]
    amount_changed = data["amount_changed"]

    prod_id = edit_data[4]
    amount = edit_data[1]
    amount_type = edit_data[2]
    cost = edit_data[5]

    ans = funcs.update_row(comp_name, comp_id, amount, amount_type, cost, prod_id, edit_data, add_or_sub, amount_changed)
    if ans == True:
        return "Update Success"
    else:
        return "Update Failure"
    
@app.route('/get_user_settings', methods=['POST'])
def get_user_settings():
    data = request.form 
    id = data["id"]
    lst = funcs.get_settings(id)
    return json.dumps(lst)

@app.route('/update_user_settings', methods=['POST'])
def update_settings():
    data = request.form 
    comp_id = data["id"]
    comp_name = data["name"]
    threshold = data["threshold"]
    notif = data["notif"]

    ans = funcs.update_user_settings(comp_name, comp_id, threshold, notif)
    if ans == True:
        return "success"
    else:
        return "fail"
    
@app.route('/export_logs', methods=['POST'])
def export_logs():
    id = request.form.get('id')
    name = request.form.get('name')
    inv = funcs.get_logs(name, id)
    filename= name + '_Logs_%s.csv' % dt.now().strftime('%Y%m%d%H%M%S')
    headers = funcs.get_table_columns_logs(name, id)
    csv_data = []
    csv_data.append(headers)
    for row in inv:
        csv_data.append(row)

    csv_content = '\n'.join([','.join(row) for row in csv_data])
    response = make_response(csv_content)
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    response.headers["Content-Type"] = "text/csv"

    return jsonify(data=csv_content, filename=filename)

@app.route('/export_and_email_logs', methods=['POST'])
def export_and_email_logs():
    id = request.form.get('id')
    name = request.form.get('name')
    email = request.form.get('email')
    inv = funcs.get_logs(name, id)
    filename = f"{name}_Logs_{dt.now().strftime('%Y%m%d%H%M%S')}.csv"
    headers = funcs.get_table_columns_logs(name, id)
    csv_data = []
    csv_data.append(headers)
    for row in inv:
        csv_data.append(row)

    csv_content = '\n'.join([','.join(row) for row in csv_data])

    # Compose the email
    msg = MIMEMultipart()
    msg['From'] = 'InventiSync@gmail.com'
    msg['To'] = email
    msg['Subject'] = 'CSV File and Charts Attached'

    # Attach CSV file as an attachment
    part_csv = MIMEBase('application', 'octet-stream')
    part_csv.set_payload(csv_content)
    encoders.encode_base64(part_csv)
    part_csv.add_header('Content-Disposition', f'attachment; filename={filename}')
    msg.attach(part_csv)

   # Attach bar chart as an image attachment
    bar_chart_url = request.form.get('bar_chart_url')
    bar_chart_content_base64 = bar_chart_url  # Already contains Base64-encoded content
    bar_chart_content = base64.b64decode(bar_chart_content_base64)

    part_bar_chart = MIMEImage(bar_chart_content, name='bar_chart.png')
    part_bar_chart.add_header('Content-Disposition', 'attachment', filename='bar_chart.png')
    msg.attach(part_bar_chart)

    # Attach pie chart as an image attachment
    pie_chart_url = request.form.get('pie_chart_url')
    pie_chart_content_base64 = pie_chart_url
    pie_chart_content = base64.b64decode(pie_chart_content_base64)

    part_pie_chart = MIMEImage(pie_chart_content, name='pie_chart.png')
    part_pie_chart.add_header('Content-Disposition', 'attachment', filename='pie_chart.png')
    msg.attach(part_pie_chart)

    # Send the email
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('InventiSync@gmail.com', 'ysvi tsee dsrw wcde')
        text = msg.as_string()
        server.sendmail('InventiSync@gmail.com', email, text)
        server.quit()
    except Exception as e:
        print(f"Error sending email: {e}")

    return "Email sent successfully"

@app.route("/add_row", methods=['POST'])
def add_row(): 
    data = request.form 
    comp_name = data["comp_name"]
    comp_id = data["comp_id"]
    prod_name = data["prod_name"]
    prod_amount = data["prod_amount"]
    prod_typ = data["prod_type"]
    prod_id = data["prod_id"]
    prod_cost = data["prod_cost"]
    lst = [prod_name, prod_amount, prod_typ, prod_id, prod_cost]
    ans = funcs.add_rows(lst, comp_name, comp_id)
    if ans == "added":
        return "added"
    else:
        return "not added"
    
@app.route("/del_row", methods=['POST'])
def del_row():
    data = request.form
    comp_name = data["comp_name"]
    comp_id = data["comp_id"]
    prod_id = data["prod_id"]
    ans = funcs.delete_row(comp_name,comp_id, prod_id)
    if ans == "deleted":
        return "deleted"
    else:
        return "not deleted"

if __name__ == "__main__":
	app.run()    

