export interface EmailContact {
    name: string;
    email: string;
}

export interface Email {
    sender: EmailContact;
    to: EmailContact[];
    subject: string;
    attachment?: {
        url: string;
        name: string;
    }[];
    htmlContent: string;
}
