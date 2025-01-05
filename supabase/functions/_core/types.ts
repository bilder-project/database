export interface UserData {
    id: string;
    created_at: string;
    email: string;
    first_name: string;
    last_name: string;
    latitute: string;
    longitude: string;
    location: string;
}

export interface Property {
    id: string;
    user_id: string;
    created_at: string;
    name: string;
    description: string;
    price: number;
    latitute: string;
    longitude: string;
    image: string;
    location: string;
    type: PropertyType;
}

//appartment, house, garage, plot, business_premises
export enum PropertyType {
    APPARTMENT = "appartment",
    HOUSE = "house",
    GARAGE = "garage",
    PLOT = "plot",
    BUSINESS_PREMISES = "business_premises",
}