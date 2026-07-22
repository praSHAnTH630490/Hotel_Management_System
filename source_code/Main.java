package com.hotel.reservation;

import java.util.InputMismatchException;
import java.util.Scanner;

public class Main {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        Hotel hotel = new Hotel();

        hotel.addRoom(new Room(101, "Single", 50));
        hotel.addRoom(new Room(102, "Double", 80));
        hotel.addRoom(new Room(103, "Suite", 150));
        hotel.addRoom(new Room(104, "Single", 50));

        while (true) {

            System.out.println("\n==============================");
            System.out.println(" HOTEL RESERVATION SYSTEM");
            System.out.println("==============================");
            System.out.println("1. View Rooms");
            System.out.println("2. Search Room");
            System.out.println("3. Book Room");
            System.out.println("4. Check In");
            System.out.println("5. Check Out");
            System.out.println("6. Cancel Reservation");
            System.out.println("7. Generate Bill");
            System.out.println("8. Save Reservations");
            System.out.println("9. Load Reservations");
            System.out.println("10. Exit");
            System.out.print("Choice : ");

            try {

                int choice = sc.nextInt();

                switch (choice) {

                case 1:
                    hotel.displayRooms();
                    break;

                case 2:

                    sc.nextLine();

                    System.out.print("Room Type : ");

                    hotel.searchRoom(sc.nextLine());

                    break;

                case 3:

                    System.out.print("Customer ID : ");
                    int id = sc.nextInt();
                    sc.nextLine();

                    System.out.print("Name : ");
                    String name = sc.nextLine();

                    System.out.print("Phone : ");
                    String phone = sc.nextLine();

                    Customer customer =
                            new Customer(id, name, phone);

                    System.out.print("Room Number : ");

                    hotel.bookRoom(customer,
                            sc.nextInt());

                    break;

                case 4:

                    System.out.print("Room Number : ");

                    hotel.checkIn(sc.nextInt());

                    break;

                case 5:

                    System.out.print("Room Number : ");

                    hotel.checkOut(sc.nextInt());

                    break;

                case 6:

                    System.out.print("Room Number : ");

                    hotel.cancelReservation(sc.nextInt());

                    break;

                case 7:

                    System.out.print("Room Number : ");
                    int room = sc.nextInt();

                    System.out.print("Days Stayed : ");
                    int days = sc.nextInt();

                    hotel.generateBill(room, days);

                    break;

                case 8:

                    hotel.saveReservations();

                    break;

                case 9:

                    hotel.loadReservations();

                    break;

                case 10:

                    System.out.println("Thank You");

                    System.exit(0);

                default:

                    System.out.println("Invalid Choice");

                }

            } catch (InputMismatchException e) {

                System.out.println("Please enter numbers only.");

                sc.nextLine();

            }

        }

    }

}