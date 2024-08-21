import cgi
import psycopg2

class Main():

    def __init__(self):
        self.form = cgi.FieldStorage()
        conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=verify-full"
        self.db =  psycopg2.connect(conn_string)
        self.curs = self.db.cursor()

    def login_data(self):
        user = self.form.getvalue('username')
        passwrd = self.form.getvalue('password')

        # user = "admin"
        # passwrd = "admin"

        sel_statement = f"""SELECT company_name FROM users WHERE "user" = '{user}' AND "password" = '{passwrd}'"""
        self.curs.execute(sel_statement)
        lst = self.curs.fetchall()
        if lst:

            comp_name = lst[0][0]
        else:
            comp_name = None
        return comp_name
    
if __name__ == "__main__":
    main = Main()
    main.login()
