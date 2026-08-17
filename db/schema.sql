-- ============================================================
-- HOTEL RESERVATION SYSTEM — MySQL Schema
-- Generated from the Chen ER diagram
-- ============================================================

CREATE DATABASE IF NOT EXISTS hotel_reservation_system;
USE hotel_reservation_system;

-- ------------------------------------------------------------
-- CUSTOMER
-- ------------------------------------------------------------
CREATE TABLE customer (
    customer_id        INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100)  NOT NULL,
    email               VARCHAR(150)  NOT NULL UNIQUE,
    phone               VARCHAR(20)   NOT NULL,
    address             VARCHAR(255),
    registration_date  DATE          NOT NULL DEFAULT (CURRENT_DATE)
);

-- ------------------------------------------------------------
-- ROOM_TYPE
-- ------------------------------------------------------------
CREATE TABLE room_type (
    room_type_id    INT AUTO_INCREMENT PRIMARY KEY,
    type_name       VARCHAR(50)     NOT NULL,
    description     VARCHAR(255),
    base_price      DECIMAL(10,2)   NOT NULL,
    capacity        INT             NOT NULL
);

-- ------------------------------------------------------------
-- ROOM
-- ------------------------------------------------------------
CREATE TABLE room (
    room_id         INT AUTO_INCREMENT PRIMARY KEY,
    room_number     VARCHAR(10)     NOT NULL UNIQUE,
    room_type_id    INT             NOT NULL,
    price           DECIMAL(10,2)   NOT NULL,
    room_status     ENUM('Available','Occupied','Maintenance') NOT NULL DEFAULT 'Available',
    capacity        INT             NOT NULL,
    CONSTRAINT fk_room_room_type
        FOREIGN KEY (room_type_id) REFERENCES room_type(room_type_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- STAFF
-- ------------------------------------------------------------
CREATE TABLE staff (
    staff_id    INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    phone       VARCHAR(20)     NOT NULL,
    email       VARCHAR(150)    UNIQUE,
    role        ENUM('Admin','Receptionist','Manager','Housekeeping') NOT NULL,
    join_date   DATE            NOT NULL
);

-- ------------------------------------------------------------
-- AMENITY
-- ------------------------------------------------------------
CREATE TABLE amenity (
    amenity_id      INT AUTO_INCREMENT PRIMARY KEY,
    amenity_name    VARCHAR(100)    NOT NULL,
    description     VARCHAR(255)
);

-- ------------------------------------------------------------
-- RESERVATION
-- ------------------------------------------------------------
CREATE TABLE reservation (
    reservation_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id         INT             NOT NULL,
    room_id             INT             NOT NULL,
    check_in_date       DATE            NOT NULL,
    check_out_date      DATE            NOT NULL,
    total_amount        DECIMAL(10,2)   NOT NULL,
    reservation_status  ENUM('Booked','Checked_in','Checked_out','Cancelled') NOT NULL DEFAULT 'Booked',
    booking_date        DATE            NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_reservation_customer
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reservation_room
        FOREIGN KEY (room_id) REFERENCES room(room_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_reservation_dates
        CHECK (check_out_date > check_in_date)
);

-- ------------------------------------------------------------
-- CHECK_IN_OUT
-- ------------------------------------------------------------
CREATE TABLE check_in_out (
    cio_id          INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id  INT         NOT NULL,
    check_in_time   DATETIME,
    check_out_time  DATETIME,
    checked_in_by   INT,
    checked_out_by  INT,
    CONSTRAINT fk_cio_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cio_staff_in
        FOREIGN KEY (checked_in_by) REFERENCES staff(staff_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cio_staff_out
        FOREIGN KEY (checked_out_by) REFERENCES staff(staff_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- PAYMENT
-- ------------------------------------------------------------
CREATE TABLE payment (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id  INT             NOT NULL,
    payment_date    DATE            NOT NULL,
    amount          DECIMAL(10,2)   NOT NULL,
    payment_method  ENUM('Cash','Card','UPI','NetBanking') NOT NULL,
    payment_status  ENUM('Pending','Completed','Failed')   NOT NULL DEFAULT 'Pending',
    transaction_id  VARCHAR(100) UNIQUE,
    CONSTRAINT fk_payment_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- CANCELLATION
-- ------------------------------------------------------------
CREATE TABLE cancellation (
    cancellation_id             INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id              INT             NOT NULL,
    cancellation_date           DATE            NOT NULL,
    reason                      VARCHAR(255),
    refund_amount               DECIMAL(10,2),
    cancellation_policy_applied VARCHAR(255),
    CONSTRAINT fk_cancellation_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- FEEDBACK
-- ------------------------------------------------------------
CREATE TABLE feedback (
    feedback_id     INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id  INT         NOT NULL,
    rating          TINYINT     NOT NULL,
    comments        VARCHAR(500),
    feedback_date   DATE        NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_feedback_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_feedback_rating
        CHECK (rating BETWEEN 1 AND 5)
);

-- ------------------------------------------------------------
-- ROOM_SERVICE
-- ------------------------------------------------------------
CREATE TABLE room_service (
    service_id      INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id  INT             NOT NULL,
    service_date    DATE            NOT NULL,
    service_type    ENUM('Food','Laundry','Cleaning','Other') NOT NULL,
    amount          DECIMAL(10,2)   NOT NULL,
    status          ENUM('Requested','Completed') NOT NULL DEFAULT 'Requested',
    CONSTRAINT fk_service_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ROOM_AMENITY (many-to-many junction: ROOM <-> AMENITY)
-- ------------------------------------------------------------
CREATE TABLE room_amenity (
    room_id     INT NOT NULL,
    amenity_id  INT NOT NULL,
    PRIMARY KEY (room_id, amenity_id),
    CONSTRAINT fk_room_amenity_room
        FOREIGN KEY (room_id) REFERENCES room(room_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_room_amenity_amenity
        FOREIGN KEY (amenity_id) REFERENCES amenity(amenity_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Helpful indexes on FK columns (MySQL auto-indexes most FKs,
-- these are explicit for clarity / query performance)
-- ------------------------------------------------------------
CREATE INDEX idx_reservation_customer   ON reservation(customer_id);
CREATE INDEX idx_reservation_room       ON reservation(room_id);
CREATE INDEX idx_room_type              ON room(room_type_id);
CREATE INDEX idx_cio_reservation        ON check_in_out(reservation_id);
CREATE INDEX idx_payment_reservation    ON payment(reservation_id);
CREATE INDEX idx_cancellation_reservation ON cancellation(reservation_id);
CREATE INDEX idx_feedback_reservation   ON feedback(reservation_id);
CREATE INDEX idx_service_reservation    ON room_service(reservation_id);
