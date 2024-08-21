import os
import psycopg2
# pip install psycopg2 
# Inv_Admin pass: 1OaoBtmP4rVweOkcvi-eMA
#database connection string: "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=verify-full"

class funcs():
    def __init__(self):
        conn_string = "postgresql://inv_admin:1OaoBtmP4rVweOkcvi-eMA@inventisync-db-1-5322.g8z.cockroachlabs.cloud:26257/main_inventory?sslmode=verify-full"
        self.db =  psycopg2.connect(conn_string)
        self.curs = self.db.cursor()
        
    def make_table(self):
        statement = """CREATE TABLE test_1.Persons (
            PersonID int,
            LastName varchar(255),
            FirstName varchar(255),
            Address varchar(255),
            City varchar(255)
        ); """
        self.curs.execute(statement)
    
    def test_select(self):
        statement = """SELECT * FROM testing_table"""
        curs = self.db.cursor()
        curs.execute(statement)
        for line in curs.fetchall():
            print(line)

    def test_select_alt(self):
        sel_statement = """SELECT user_id FROM users"""
        self.curs.execute(sel_statement)
        lst = self.curs.fetchall()
        last_rw = lst[0][len(lst[0])-1]
        print(last_rw)
if __name__ == "__main__":
    f1 = funcs()
    f1.test_select_alt()
        

