-- GlobeTrotter Relational Database Schema
-- Target: MySQL 8.0 / Compatible with SQLite engine

CREATE DATABASE IF NOT EXISTS globetrotter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE globetrotter;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    country VARCHAR(100) DEFAULT 'India',
    role VARCHAR(20) DEFAULT 'user',
    profile_photo VARCHAR(500) NULL,
    language VARCHAR(50) DEFAULT 'English',
    travel_style VARCHAR(50) DEFAULT 'Standard',
    budget_preference VARCHAR(50) DEFAULT 'Moderate',
    interests TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- Cities table (India-First curation)
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    region VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    cost_index VARCHAR(50) DEFAULT 'Moderate',
    popularity INT DEFAULT 80,
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    best_suited_interests VARCHAR(255) DEFAULT 'Culture,Sightseeing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_city_name (name),
    INDEX idx_city_region (region),
    INDEX idx_city_popularity (popularity)
) ENGINE=InnoDB;

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    duration_hours FLOAT DEFAULT 2.0,
    estimated_cost FLOAT DEFAULT 500.0,
    rating FLOAT DEFAULT 4.5,
    popularity_score INT DEFAULT 85,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    INDEX idx_act_city (city_id),
    INDEX idx_act_category (category),
    INDEX idx_act_rating (rating)
) ENGINE=InnoDB;

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    overall_budget FLOAT DEFAULT 30000.0,
    travel_style VARCHAR(50) DEFAULT 'Standard',
    description TEXT,
    cover_image VARCHAR(500) NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    is_public BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(100) UNIQUE NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_trip_user (user_id),
    INDEX idx_trip_dates (start_date, end_date),
    INDEX idx_trip_share (share_token)
) ENGINE=InnoDB;

-- Trip Stops table
CREATE TABLE IF NOT EXISTS trip_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    city_id INT NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    travel_mode VARCHAR(50) DEFAULT 'Train',
    travel_cost FLOAT DEFAULT 0.0,
    order_index INT DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE RESTRICT,
    INDEX idx_stop_trip (trip_id),
    INDEX idx_stop_city (city_id)
) ENGINE=InnoDB;

-- Itinerary Activities table
CREATE TABLE IF NOT EXISTS itinerary_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    stop_id INT NULL,
    activity_id INT NULL,
    custom_activity_name VARCHAR(200) NULL,
    date DATE NOT NULL,
    start_time VARCHAR(20) DEFAULT '10:00',
    end_time VARCHAR(20) DEFAULT '12:00',
    estimated_cost FLOAT DEFAULT 0.0,
    notes TEXT,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES trip_stops(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    INDEX idx_itinerary_trip (trip_id),
    INDEX idx_itinerary_date (date)
) ENGINE=InnoDB;

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount FLOAT NOT NULL DEFAULT 0.0,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    INDEX idx_expense_trip (trip_id)
) ENGINE=InnoDB;

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_fav_user (user_id, item_type)
) ENGINE=InnoDB;

-- Shared Trips table
CREATE TABLE IF NOT EXISTS shared_trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL UNIQUE,
    share_token VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    INDEX idx_shared_token (share_token)
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id)
) ENGINE=InnoDB;
