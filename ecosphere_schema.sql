CREATE DATABASE IF NOT EXISTS ecosphere;
USE ecosphere;

DROP TABLE IF EXISTS note, carbon_log, dashboard_data, notification, users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    name VARCHAR(255),
    password VARCHAR(255),
    avatar VARCHAR(255) DEFAULT 'default-avatar.png',
    user_rank INT DEFAULT 1,
    progress INT DEFAULT 0,
    guest BOOLEAN DEFAULT FALSE,
    birthday DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE dashboard_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    temperature FLOAT,
    humidity FLOAT,
    light FLOAT,
    ph FLOAT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE carbon_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    transport FLOAT,
    food FLOAT,
    energy FLOAT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE note (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);