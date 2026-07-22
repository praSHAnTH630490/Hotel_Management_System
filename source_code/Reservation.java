package com.hotel.reservation;

public class Reservation {

    private Customer customer;
    private Room room;

    public Reservation(Customer customer, Room room) {
        this.customer = customer;
        this.room = room;
    }

    public Customer getCustomer() {
        return customer;
    }

    public Room getRoom() {
        return room;
    }
}