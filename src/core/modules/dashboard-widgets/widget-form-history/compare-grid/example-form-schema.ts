// Schema for the example form, using JSON Schema structure
// This can be extended for your real forms

export const exampleFormSchema = {
  type: "object",
  required: ["age"],
  properties: {
    formAuthors: { type: "string", title: "Form Authors" },
    name: { type: "string", title: "Name" },
    fullName: { type: "string", title: "Full Name" },
    age: { type: "integer", title: "Age" },
    gender: {
      type: "string",
      title: "Gender",
      enum: ["Male", "Female", "Undisclosed"],
    },
    heigh: { type: "number", title: "Heigh" },
    address: {
      type: "object",
      title: "Address Shipping",
      properties: {
        street: { type: "string", title: "Street" },
        streetnumber: { type: "string", title: "Street Number" },
        postalCode: { type: "string", title: "Postal Code" },
        city: { type: "string", title: "City" },
      },
    },
  },
};
