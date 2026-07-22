package com.hotel.reservation;

import java.io.*;
import java.util.*;

public class Hotel {

    private ArrayList<Room> rooms = new ArrayList<>();
    private ArrayList<Reservation> reservations = new ArrayList<>();

    public void addRoom(Room room) {
        rooms.add(room);
    }

    public void displayRooms() {

        System.out.println("\nAvailable Rooms");

        for (Room room : rooms) {

            if (room.isAvailable()) {

                System.out.println(room.getRoomNumber() + "  "
                        + room.getRoomType() + "  $"
                        + room.getPrice());
            }
        }
    }

    public void searchRoom(String type) {

        boolean found = false;

        for (Room room : rooms) {

            if (room.getRoomType().equalsIgnoreCase(type)
                    && room.isAvailable()) {

                System.out.println(room.getRoomNumber() + " "
                        + room.getRoomType() + " "
                        + room.getPrice());

                found = true;
            }

        }

        if (!found)

            System.out.println("No Room Found.");
    }

    public void bookRoom(Customer customer, int roomNo) {

        for (Room room : rooms) {

            if (room.getRoomNumber() == roomNo
                    && room.isAvailable()) {

                room.setAvailable(false);

                reservations.add(new Reservation(customer, room));

                System.out.println("Room Booked Successfully.");

                return;

            }

        }

        System.out.println("Room Not Available.");

    }

    public void checkIn(int roomNo) {

        System.out.println("Checked In Room " + roomNo);

    }

    public void checkOut(int roomNo) {

        for (Room room : rooms) {

            if (room.getRoomNumber() == roomNo) {

                room.setAvailable(true);

                System.out.println("Checked Out Successfully.");

                return;

            }

        }

    }

    public void cancelReservation(int roomNo) {

        Iterator<Reservation> iterator = reservations.iterator();

        while (iterator.hasNext()) {

            Reservation r = iterator.next();

            if (r.getRoom().getRoomNumber() == roomNo) {

                r.getRoom().setAvailable(true);

                iterator.remove();

                System.out.println("Reservation Cancelled.");

                return;

            }

        }

        System.out.println("Reservation Not Found.");

    }

    public void generateBill(int roomNo, int days) {

        for (Room room : rooms) {

            if (room.getRoomNumber() == roomNo) {

                double total = room.getPrice() * days;

                System.out.println("Total Bill = $" + total);

                return;

            }

        }

    }

    public void saveReservations() {

        try {

            FileWriter writer = new FileWriter("reservations.txt");

            for (Reservation r : reservations) {

                writer.write(r.getCustomer().getName() + " "
                        + r.getRoom().getRoomNumber()
                        + "\n");

            }

            writer.close();

            System.out.println("Saved Successfully.");

        }

        catch (IOException e) {

            System.out.println(e.getMessage());

        }

    }

    public void loadReservations() {

        try {

            BufferedReader br = new BufferedReader(
                    new FileReader("reservations.txt"));

            String line;

            System.out.println("\nReservations");

            while ((line = br.readLine()) != null) {

                System.out.println(line);

            }

            br.close();

        }

        catch (IOException e) {

            System.out.println(e.getMessage());

        }

    }

}
