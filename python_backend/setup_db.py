import mysql.connector
from mysql.connector import errorcode

# Configuration for root connection to create database
# YOU MAY NEED TO CHANGE PASSWORD TO MATCH YOUR LOCAL MYSQL INSTALLATION
DB_CONFIG = {
    'user': 'root',
    'password': 'wasd',  # Default for XAMPP. Some require 'root'.
    'host': '127.0.0.1',
}

DB_NAME = 'ashtadisha_db'

TABLES = {}

TABLES['users'] = (
    "CREATE TABLE IF NOT EXISTS `users` ("
    "  `uid` varchar(128) NOT NULL,"
    "  `name` varchar(255) NOT NULL,"
    "  `email` varchar(255) NOT NULL,"
    "  `photoURL` text,"
    "  `totalBookings` int(11) DEFAULT 0,"
    "  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,"
    "  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`uid`)"
    ") ENGINE=InnoDB"
)

TABLES['enquiries'] = (
    "CREATE TABLE IF NOT EXISTS `enquiries` ("
    "  `id` int(11) NOT NULL AUTO_INCREMENT,"
    "  `name` varchar(255) NOT NULL,"
    "  `email` varchar(255) NOT NULL,"
    "  `phone` varchar(50),"
    "  `destination` varchar(255),"
    "  `travelMonth` varchar(50),"
    "  `message` text,"
    "  `status` varchar(50) DEFAULT 'new',"
    "  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`id`)"
    ") ENGINE=InnoDB"
)

TABLES['bookings'] = (
    "CREATE TABLE IF NOT EXISTS `bookings` ("
    "  `id` int(11) NOT NULL AUTO_INCREMENT,"
    "  `userId` varchar(128) NOT NULL,"
    "  `packageName` varchar(255) NOT NULL,"
    "  `destination` varchar(255),"
    "  `travelers` int(11) DEFAULT 1,"
    "  `travelDate` date,"
    "  `totalAmount` decimal(10,2),"
    "  `paymentId` varchar(255),"
    "  `status` varchar(50) DEFAULT 'confirmed',"
    "  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`id`),"
    "  FOREIGN KEY (`userId`) REFERENCES `users` (`uid`) ON DELETE CASCADE"
    ") ENGINE=InnoDB"
)

TABLES['packages'] = (
    "CREATE TABLE IF NOT EXISTS `packages` ("
    "  `id` varchar(128) NOT NULL,"
    "  `title` varchar(255) NOT NULL,"
    "  `description` text,"
    "  `price` decimal(10,2),"
    "  `duration` varchar(100),"
    "  PRIMARY KEY (`id`)"
    ") ENGINE=InnoDB"
)

def create_database(cursor):
    try:
        cursor.execute(f"CREATE DATABASE {DB_NAME} DEFAULT CHARACTER SET 'utf8'")
    except mysql.connector.Error as err:
        print(f"Failed creating database: {err}")
        exit(1)

def main():
    try:
        print("Connecting to MySQL server...")
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor()
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Access denied: Check your MySQL username/password in setup_db.py.")
        else:
            print(err)
        return

    try:
        cursor.execute(f"USE {DB_NAME}")
        print(f"Database {DB_NAME} found.")
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_BAD_DB_ERROR:
            print(f"Database {DB_NAME} does not exist. Creating...")
            create_database(cursor)
            cursor.execute(f"USE {DB_NAME}")
        else:
            print(err)
            return

    for table_name in TABLES:
        table_description = TABLES[table_name]
        try:
            print(f"Creating table {table_name}: ", end='')
            cursor.execute(table_description)
            print("OK")
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                print("Already exists.")
            else:
                print(err.msg)

    # Insert some dummy packages just so the UI has something if it fetches it
    try:
        print("Inserting sample package...")
        insert_pkg = "INSERT IGNORE INTO packages (id, title, price, duration) VALUES (%s, %s, %s, %s)"
        cursor.execute(insert_pkg, ("assam-explorer", "Assam Explorer", 12000.00, "5 Days 4 Nights"))
        cnx.commit()
        print("OK")
    except mysql.connector.Error as err:
        print(err.msg)

    cursor.close()
    cnx.close()
    print("Database setup complete.")

if __name__ == '__main__':
    main()
