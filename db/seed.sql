-- ============================================================
-- Sample data so the app has something to show immediately.
-- Safe to re-run: it clears existing rows first (in FK-safe order).
-- ============================================================
USE hotel_reservation_system;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE room_amenity;
TRUNCATE TABLE room_service;
TRUNCATE TABLE feedback;
TRUNCATE TABLE cancellation;
TRUNCATE TABLE payment;
TRUNCATE TABLE check_in_out;
TRUNCATE TABLE reservation;
TRUNCATE TABLE room;
TRUNCATE TABLE room_type;
TRUNCATE TABLE amenity;
TRUNCATE TABLE staff;
TRUNCATE TABLE customer;
SET FOREIGN_KEY_CHECKS = 1;

-- ROOM TYPES
INSERT INTO room_type (room_type_id, type_name, description, base_price, capacity) VALUES
(1, 'Standard', 'Cosy room with a queen bed, ideal for solo travellers or couples.', 79.00, 2),
(2, 'Deluxe', 'Spacious room with a king bed and city view.', 129.00, 2),
(3, 'Suite', 'Separate living area, premium furnishings, skyline view.', 219.00, 4),
(4, 'Family', 'Two queen beds, extra floor space for families.', 159.00, 5);

-- AMENITIES
INSERT INTO amenity (amenity_id, amenity_name, description) VALUES
(1, 'Free Wi-Fi', 'High-speed wireless internet'),
(2, 'Air Conditioning', 'Individually controlled climate'),
(3, 'Mini Bar', 'Stocked mini fridge'),
(4, 'Balcony', 'Private balcony with seating'),
(5, 'Sea View', 'Unobstructed ocean view'),
(6, 'Bathtub', 'Deep soaking bathtub'),
(7, 'Work Desk', 'Dedicated workspace with lamp'),
(8, 'Smart TV', '55" smart television with streaming apps');

-- ROOMS
INSERT INTO room (room_id, room_number, room_type_id, price, room_status, capacity) VALUES
(1,  '101', 1, 79.00,  'Available', 2),
(2,  '102', 1, 79.00,  'Occupied',  2),
(3,  '103', 1, 82.00,  'Available', 2),
(4,  '201', 2, 129.00, 'Available', 2),
(5,  '202', 2, 135.00, 'Maintenance', 2),
(6,  '203', 2, 129.00, 'Available', 2),
(7,  '301', 3, 219.00, 'Available', 4),
(8,  '302', 3, 229.00, 'Occupied',  4),
(9,  '401', 4, 159.00, 'Available', 5),
(10, '402', 4, 159.00, 'Available', 5);

INSERT INTO room_amenity (room_id, amenity_id) VALUES
(1,1),(1,2),(1,7),
(2,1),(2,2),(2,7),
(3,1),(3,2),
(4,1),(4,2),(4,3),(4,7),(4,8),
(6,1),(6,2),(6,3),(6,8),
(7,1),(7,2),(7,3),(7,4),(7,5),(7,6),(7,8),
(8,1),(8,2),(8,3),(8,6),(8,8),
(9,1),(9,2),(9,8),
(10,1),(10,2),(10,8);

-- STAFF
INSERT INTO staff (staff_id, name, phone, email, role, join_date) VALUES
(1, 'Priya Nair', '9876500011', 'priya.nair@aurelia-hotel.com', 'Manager', '2022-03-01'),
(2, 'Arjun Mehta', '9876500012', 'arjun.mehta@aurelia-hotel.com', 'Receptionist', '2023-01-15'),
(3, 'Sara Thomas', '9876500013', 'sara.thomas@aurelia-hotel.com', 'Receptionist', '2023-06-10'),
(4, 'Vikram Rao', '9876500014', 'vikram.rao@aurelia-hotel.com', 'Housekeeping', '2021-11-20'),
(5, 'Neha Kapoor', '9876500015', 'neha.kapoor@aurelia-hotel.com', 'Admin', '2020-07-05');

-- CUSTOMERS
INSERT INTO customer (customer_id, name, email, phone, address, registration_date) VALUES
(1, 'Ravi Kumar', 'ravi.kumar@example.com', '9123456780', '12 MG Road, Bengaluru', '2024-02-10'),
(2, 'Ananya Singh', 'ananya.singh@example.com', '9123456781', '45 Park Street, Kolkata', '2024-03-22'),
(3, 'John Wilson', 'john.wilson@example.com', '9123456782', '221B Baker Street, London', '2024-05-01'),
(4, 'Meera Iyer', 'meera.iyer@example.com', '9123456783', '9 Anna Salai, Chennai', '2024-06-14'),
(5, 'Carlos Diaz', 'carlos.diaz@example.com', '9123456784', '78 Rambla, Madrid', '2024-07-30');

-- RESERVATIONS
INSERT INTO reservation (reservation_id, customer_id, room_id, check_in_date, check_out_date, total_amount, reservation_status, booking_date) VALUES
(1, 1, 2, '2026-08-10', '2026-08-13', 237.00, 'Checked_in', '2026-08-01'),
(2, 3, 8, '2026-08-09', '2026-08-15', 1374.00, 'Checked_in', '2026-07-20'),
(3, 2, 4, '2026-08-20', '2026-08-23', 387.00, 'Booked', '2026-08-05'),
(4, 4, 9, '2026-07-01', '2026-07-05', 636.00, 'Checked_out', '2026-06-15'),
(5, 5, 1, '2026-06-10', '2026-06-12', 158.00, 'Cancelled', '2026-06-01');

INSERT INTO check_in_out (reservation_id, check_in_time, check_out_time, checked_in_by, checked_out_by) VALUES
(1, '2026-08-10 14:05:00', NULL, 2, NULL),
(2, '2026-08-09 13:40:00', NULL, 3, NULL),
(4, '2026-07-01 15:00:00', '2026-07-05 10:30:00', 2, 3);

INSERT INTO payment (reservation_id, payment_date, amount, payment_method, payment_status, transaction_id) VALUES
(1, '2026-08-01', 237.00, 'Card', 'Completed', 'TXN-1001'),
(2, '2026-07-20', 1374.00, 'UPI', 'Completed', 'TXN-1002'),
(3, '2026-08-05', 387.00, 'NetBanking', 'Pending', NULL),
(4, '2026-06-15', 636.00, 'Cash', 'Completed', 'TXN-1004');

INSERT INTO cancellation (reservation_id, cancellation_date, reason, refund_amount, cancellation_policy_applied) VALUES
(5, '2026-06-03', 'Change of travel plans', 118.50, 'Cancelled 7+ days ahead: 75% refund');

INSERT INTO feedback (reservation_id, rating, comments, feedback_date) VALUES
(4, 5, 'Wonderful stay, the family room was spacious and the staff were fantastic.', '2026-07-06');

INSERT INTO room_service (reservation_id, service_date, service_type, amount, status) VALUES
(1, '2026-08-11', 'Food', 24.50, 'Completed'),
(1, '2026-08-12', 'Laundry', 12.00, 'Requested'),
(2, '2026-08-10', 'Cleaning', 0.00, 'Completed');
