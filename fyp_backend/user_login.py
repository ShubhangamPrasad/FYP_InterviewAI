from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS
import jwt
import datetime
import bcrypt  # For secure password hashing

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Shubham2340",  # Replace with your MySQL password
    "database": "ai_interview"
}


def create_user(name, email, password):
    """Store new user in database with hashed password."""
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())  # Hash password
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
            (name, email, hashed_password)
        )
        conn.commit()
        return True
    except mysql.connector.IntegrityError:
        return False  # Email already exists
    finally:
        cursor.close()
        conn.close()
