import psycopg2
from datetime import datetime, timezone, timedelta
from datetime import datetime, date
import mimetypes
import io
from werkzeug.datastructures import Headers
from datetime import datetime as dt
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime, timezone, timedelta
import bcrypt

#login where username and password match
def login_user(username, password):
        conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
        db =  psycopg2.connect(conn_string)
        curs = db.cursor()

        sel_username_statement = f""" SELECT password from users where "user" = '{username}'"""
        curs.execute(sel_username_statement)
        pass_lst = curs.fetchall()
        curr_pass = pass_lst[0][0]
        if bcrypt.checkpw(password.encode('utf-8'), curr_pass.encode('utf-8')):
            sel_statement = f"""SELECT company_name, company_id, email FROM users WHERE "user" = '{username}' """
            curs.execute(sel_statement)
            lst = curs.fetchall()
            if lst:
                db.close()
                return lst[0]
            else:
                db.close()
                return None
        else:
            return "Password Incorrect"
            

#create a new user and check that passwrd and confirm password are matching
def make_user(username, passwrd, confirm, company_name, email):
        conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
        db =  psycopg2.connect(conn_string)
        curs = db.cursor()
        if (passwrd == confirm):
            hashed_password = bcrypt.hashpw(passwrd.encode('utf-8'), bcrypt.gensalt())
            passwrd_decoded = hashed_password.decode('utf-8')

            if check_users(username) == True:
                return "Username already in use"

            if(check_emails(email) == True):
                return "Email is already in use"
             
            sel_statement = """SELECT * FROM users"""
            curs.execute(sel_statement)
            lst = curs.fetchall()
            if lst:
                last_rw = lst[len(lst) - 1]
                last_id = last_rw[2]
                new_id = int(last_id) + 1

                last_comp_id = last_rw[4]
                new_comp_id = int(last_comp_id) + 1
            else:
                new_id = 1
                new_comp_id = 101

            ins_statement = f"""INSERT INTO users ("user", "password", "user_id", "company_name", "company_id", "email") VALUES ('{username}', '{passwrd_decoded}', '{new_id}', '{company_name}', '{new_comp_id}', '{email}');"""
            curs.execute(ins_statement)

            create_statement_inv = f"""create table "{company_name}_{new_comp_id}" (
                                product varchar,
                                amount int8,
                                amount_type varchar,
                                last_modified timestamp,
                                product_id serial,
                                product_cost float8,
                                company_id int8,
                                primary key (product_id)
                                )"""
            
            curs.execute(create_statement_inv)
            db.commit()

            create_statement_logs = f""" create table "{company_name}_{new_comp_id}_logs"(
								product varchar,
								product_id int,
								last_modified timestamp,
								add_or_sub varchar,
								amount_changed int,
								amount_type varchar,
                                log_id int,
								primary key (log_id));"""
            
            curs.execute(create_statement_logs)


            ins_settings_statement = f"""INSERT INTO user_settings ("comp_name", "comp_id", "threshold", "auto_notifications") VALUES ('{company_name}', '{new_comp_id}', 5, 1);"""
            curs.execute(ins_settings_statement)

            db.commit()
            db.close()
            return "created"
        else:
             db.close()
             return "does not match"

def check_emails(email):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    sel_statement = """select * from users"""
    curs.execute(sel_statement)
    lst = curs.fetchall()
    for row in lst:
        if row[5] == email:
            return True
    return False

def check_users(name):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    sel_statement = """select * from users"""
    curs.execute(sel_statement)
    lst = curs.fetchall()
    for row in lst:
        if row[0] == name:
            return True
    return False

def get_users():
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    sel_statement = """select * from users"""
    curs.execute(sel_statement)
    lst = curs.fetchall()
    return lst
#get inventory for where comp_name and comp_id match the database
def get_inv(comp_name, comp_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    sel_statement = f"""SELECT * FROM "{comp_name}_{comp_id}" """
    curs.execute(sel_statement)
    lst = curs.fetchall()
    master_lst = []
    for tup in lst:
        product = tup[0]
        amount = tup[1]
        amount_type = tup[2]
        last_modified = tup[3]
        product_id = tup[4]
        product_cost = tup[5]
        company_id = tup[6]
        new_tup = (str(product), str(amount), str(amount_type), str(last_modified), str(product_id), str(product_cost), str(company_id))
        master_lst.append(new_tup)
    db.close()
    return master_lst 

def get_logs(comp_name, comp_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    sel_statement = f"""SELECT * FROM "{comp_name}_{comp_id}_logs" """
    curs.execute(sel_statement)
    lst = curs.fetchall()
    master_list = []
    for tup in lst:
        product = tup[0]
        prod_id = tup[1]
        last_mod = tup[2]
        add_or_sub = tup[3]
        amount_changed = tup[4]
        amount_type = tup[5]
        log_id = tup[6]
        new_tup = (str(product), str(prod_id), str(last_mod), str(add_or_sub), str(amount_changed), str(amount_type), str(log_id))
        master_list.append(new_tup)
    db.close()
    return master_list
        
#get column names for table based on comp_name and comp_id
def get_table_columns(comp_name, comp_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    table_name = comp_name + "_" + comp_id
    sel_statement = f"""select column_name from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='{table_name}' and column_name not like '%rowid%' """
    curs.execute(sel_statement)
    col_lst = []
    lst = curs.fetchall()
    for row in lst:
        col_lst.append(row[0])
    db.close()
    return col_lst

def get_table_columns_logs(comp_name, comp_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    table_name = comp_name + "_" + comp_id + "_logs"
    sel_statement = f"""select column_name from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='{table_name}' and column_name not like '%rowid%' """
    curs.execute(sel_statement)
    col_lst = []
    lst = curs.fetchall()
    for row in lst:
        col_lst.append(row[0])
    db.close()
    return col_lst

#import an inventory, file_contents, and create a table if a table does not exist for comp_name
def imp_inventory(comp_name, comp_id, file_contents):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    headers = file_contents[0]
    data = file_contents[1:]
    us_est = timezone(timedelta(hours=-5))
    date_now = datetime.now(us_est)
    # data = [[col if col is not "None" else None for col in row] for row in data] # Fixing the None values in the data for the database
    # Any "None" value should be replaced with None for all columns except the first one
    new_data = []
    for row in data:
        if len(row) > 1:  # Check if the row has more than one element
            new_row = row.copy()  # Create a copy of the row
            new_row[3] = date_now
            for i in range(1, len(new_row)):
                if new_row[i] == "None":
                    new_row[i] = None
            new_data.append(new_row)

    del_statement = f"""DELETE FROM "{comp_name}_{comp_id}";"""
    curs.execute(del_statement)
    cols = get_table_columns(comp_name, comp_id)
    insert_query = f"""INSERT INTO "{comp_name}_{comp_id}" ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))})"""
    curs.executemany(insert_query, new_data)
    db.commit()

    select_query = f"""SELECT * FROM "{comp_name}_{comp_id}" """
    curs.execute(select_query)

    lst = curs.fetchall()
    for row in lst:
        update_statement = f"""UPDATE {comp_name}_{comp_id} SET "company_id"='{comp_id}' WHERE "company_id"= '{row[6]}'"""
        curs.execute(update_statement)

    db.commit()
    db.close()
    return True

#update row with new value
def update_row(comp_name, comp_id, amount, amount_type, cost, prod_id, full_data, add_or_sub, changed):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()

    product = full_data[0]
    us_est = timezone(timedelta(hours=-5))
    date_now = datetime.now(us_est)

    try:
        update_statement = f""" UPDATE {comp_name}_{comp_id}
                            SET "amount" = '{amount}', "amount_type"= '{amount_type}', "product_cost" = '{cost}', "last_modified" = '{date_now}'
                            WHERE "product_id" = {prod_id}; """
        curs.execute(update_statement)

        select_log_statement = f""" SELECT * from {comp_name}_{comp_id}_logs """

        curs.execute(select_log_statement)
        lst = curs.fetchall()
        if lst:
            last_rw = lst[len(lst) - 1]
            last_log_id = last_rw[6]
            new_log_id = int(last_log_id) + 1
        else:
            new_log_id = 1

        ins_log_statement = f""" insert into {comp_name}_{comp_id}_logs VALUES ('{product}', '{prod_id}', '{date_now}', 
                                               '{add_or_sub}', '{changed}', '{amount_type}', '{new_log_id}')"""
        curs.execute(ins_log_statement)
        db.commit()
    except:
         return False

    return True

def get_settings(comp_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    try:
        query_statement = f""" select * from user_settings where "comp_id" = {comp_id} """
        curs.execute(query_statement)
        lst = curs.fetchall()
        return lst[0]
    except:
         return None
     
def update_user_settings(comp_name, comp_id, threshold, notif):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    try:
        update_statement = f""" UPDATE user_settings
                            SET "threshold" = {threshold}, "auto_notifications"= {notif}
                            WHERE "comp_id" = {comp_id}; """
        curs.execute(update_statement)
        db.commit()
    except:
        return False
    return True

def add_rows(lst, comp_name, comp_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    if lst:
        prod_name = lst[0]
        prod_amount = lst[1]
        prod_typ = lst[2]
        prod_id = lst[3]
        prod_cost = lst[4]
        us_est = timezone(timedelta(hours=-5))
        date_now = datetime.now(us_est)
        try:
            ins_statement = f""" insert into {comp_name}_{comp_id} VALUES ('{prod_name}','{prod_amount}','{prod_typ}','{date_now}','{prod_id}','{prod_cost}', '{comp_id}')"""
            curs.execute(ins_statement)
            db.commit()
            db.close()
            return "added"
        except:
            return None
    return None

def delete_row(comp_name, comp_id, prod_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    try:
        del_statement = f""" delete from {comp_name}_{comp_id} where "product_id" = '{prod_id}'"""
        curs.execute(del_statement)
        db.commit()
        db.close()
        return "deleted"
    except:
        return None
    
def change_password(new_password, confirm_password, comp_name, comp_id):
    conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=require"
    db =  psycopg2.connect(conn_string)
    curs = db.cursor()
    if new_password == confirm_password:
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        passwrd_decoded = hashed_password.decode('utf-8')
        try:
            update_statement = f""" UPDATE users SET "password" = '{passwrd_decoded}' WHERE "company_name" = '{comp_name}' and "company_id" = '{comp_id}' """
            curs.execute(update_statement)
            db.commit()
            db.close()
            return "Password Updated Successfully"
        except:
            return "Update Failed"
        
    else:
        return "Passwords do not match"